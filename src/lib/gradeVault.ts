import { Grade } from '../types';

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

const getDefaultStorage = (): StorageLike | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
};

export const getLockedGradesVaultKey = (schoolId: string) =>
  `GESTIONNAIRE_LOCKED_GRADES_VAULT_${schoolId}`;

export const getPermanentGradesBackupKey = (schoolId: string) =>
  `GESTIONNAIRE_PERMANENT_BACKUP_${schoolId}_GRADES`;

export const gradeSlotKey = (
  g: Pick<Grade, 'studentId' | 'subjectId' | 'subjectName' | 'trimester' | 'examType' | 'evaluationNumber'>
): string => {
  const subjKey = (g.subjectId || g.subjectName || '').trim().toLowerCase();
  const evalNum = g.evaluationNumber ?? 1;
  return `${g.studentId}::${subjKey}::${Number(g.trimester)}::${(g.examType || '').toUpperCase().trim()}::${evalNum}`;
};

const gradeTimestamp = (g: Grade): string =>
  g.permanentlySavedAt || g.updatedAt || g.createdAt || g.date || '';

export function mergeVaultEntries(existing: Grade[], incoming: Grade[]): Grade[] {
  const byId = new Map<string, Grade>();
  const slotToId = new Map<string, string>();

  const upsert = (raw: Grade) => {
    if (!raw || !raw.id) return;
    const g: Grade = {
      ...raw,
      isPermanentlySaved: true,
      permanentlySavedAt: raw.permanentlySavedAt || raw.updatedAt || raw.createdAt || new Date().toISOString()
    };

    const existingById = byId.get(g.id);
    if (existingById) {
      if (gradeTimestamp(g) >= gradeTimestamp(existingById)) {
        byId.set(g.id, g);
      }
      return;
    }

    const slot = gradeSlotKey(g);
    const sameSlotId = slotToId.get(slot);
    if (sameSlotId) {
      const existingBySlot = byId.get(sameSlotId);
      if (existingBySlot && gradeTimestamp(g) > gradeTimestamp(existingBySlot)) {
        byId.delete(sameSlotId);
        byId.set(g.id, g);
        slotToId.set(slot, g.id);
      }
      return;
    }

    byId.set(g.id, g);
    slotToId.set(slot, g.id);
  };

  existing.forEach(upsert);
  incoming.forEach(upsert);

  return Array.from(byId.values());
}

export function loadPermanentGradeVault(
  schoolId: string,
  storage: StorageLike | null = getDefaultStorage()
): Grade[] {
  if (!schoolId || !storage) return [];

  const collected: Grade[] = [];
  const schoolIds =
    schoolId === 'sch-temple' || schoolId === 'sch-1786960279353'
      ? [schoolId, schoolId === 'sch-temple' ? 'sch-1786960279353' : 'sch-temple']
      : [schoolId];

  for (const sid of schoolIds) {
    try {
      const rawVault = storage.getItem(getLockedGradesVaultKey(sid));
      if (rawVault) {
        const parsed = JSON.parse(rawVault);
        if (Array.isArray(parsed)) {
          parsed.forEach((g: Grade) => {
            if (g && g.id) collected.push({ ...g, isPermanentlySaved: true });
          });
        }
      }
    } catch {
      // Ignore corrupt cache entry
    }

    try {
      const rawBackup = storage.getItem(getPermanentGradesBackupKey(sid));
      if (rawBackup) {
        const parsed = JSON.parse(rawBackup);
        if (Array.isArray(parsed)) {
          parsed.forEach((g: Grade) => {
            if (g && g.id && g.isPermanentlySaved) {
              collected.push(g);
            }
          });
        }
      }
    } catch {
      // Ignore corrupt backup entry
    }
  }

  return mergeVaultEntries([], collected);
}

export function writePermanentGradeVault(
  schoolId: string,
  lockedGrades: Grade[],
  storage: StorageLike | null = getDefaultStorage()
): void {
  if (!schoolId || !storage) return;
  const serialized = JSON.stringify(lockedGrades);
  const schoolIds =
    schoolId === 'sch-temple' || schoolId === 'sch-1786960279353'
      ? ['sch-temple', 'sch-1786960279353']
      : [schoolId];

  for (const sid of schoolIds) {
    try {
      storage.setItem(getLockedGradesVaultKey(sid), serialized);
      storage.setItem(getPermanentGradesBackupKey(sid), serialized);
    } catch {
      // Ignore quota errors
    }
  }
}

/**
 * Protège toutes les notes sauvegardées définitivement contre toute réinitialisation,
 * mise à jour générale ou synchronisation distante obsolète.
 */
export function mergeProtectedGrades(
  incomingGrades: Grade[],
  vaultedGrades: Grade[]
): Grade[] {
  const safeIncoming = Array.isArray(incomingGrades) ? incomingGrades : [];
  const safeVault = Array.isArray(vaultedGrades)
    ? vaultedGrades.filter(g => g && g.id && g.isPermanentlySaved)
    : [];

  if (safeVault.length === 0) return safeIncoming;

  const result = [...safeIncoming];
  const indexById = new Map<string, number>();
  const indexBySlot = new Map<string, number>();

  result.forEach((g, idx) => {
    if (!g || !g.id) return;
    indexById.set(g.id, idx);
    indexBySlot.set(gradeSlotKey(g), idx);
  });

  safeVault.forEach(vaultGrade => {
    const protectedCopy: Grade = {
      ...vaultGrade,
      isPermanentlySaved: true
    };
    const vaultTs = gradeTimestamp(protectedCopy);

    const existingIdIdx = indexById.get(protectedCopy.id);
    if (existingIdIdx !== undefined) {
      const current = result[existingIdIdx];
      const currentTs = gradeTimestamp(current);
      // La version verrouillée dans le coffre gagne sauf si la version entrante est elle-même sauvegardée définitivement et plus récente
      if (current.isPermanentlySaved && currentTs > vaultTs) {
        return;
      }
      result[existingIdIdx] = protectedCopy;
      return;
    }

    const slot = gradeSlotKey(protectedCopy);
    const existingSlotIdx = indexBySlot.get(slot);
    if (existingSlotIdx !== undefined) {
      const current = result[existingSlotIdx];
      const currentTs = gradeTimestamp(current);
      if (current.isPermanentlySaved && currentTs > vaultTs) {
        return;
      }
      result[existingSlotIdx] = protectedCopy;
      indexById.set(protectedCopy.id, existingSlotIdx);
      return;
    }

    result.push(protectedCopy);
    const newIdx = result.length - 1;
    indexById.set(protectedCopy.id, newIdx);
    indexBySlot.set(slot, newIdx);
  });

  return result;
}

export function lockStudentGradesInList(
  allGrades: Grade[],
  studentId: string,
  trimester?: number,
  nowIso: string = new Date().toISOString()
): {
  updatedGrades: Grade[];
  studentSavedGrades: Grade[];
  savedCount: number;
  savedAt: string;
} {
  let savedCount = 0;
  const studentSavedGrades: Grade[] = [];

  const updatedGrades = allGrades.map(g => {
    const matchesStudent = g.studentId === studentId;
    const matchesTrimester = trimester === undefined || Number(g.trimester) === Number(trimester);
    if (matchesStudent && matchesTrimester) {
      savedCount++;
      const locked: Grade = {
        ...g,
        isPermanentlySaved: true,
        permanentlySavedAt: nowIso,
        updatedAt: nowIso
      };
      studentSavedGrades.push(locked);
      return locked;
    }
    return g;
  });

  return {
    updatedGrades,
    studentSavedGrades,
    savedCount,
    savedAt: nowIso
  };
}

export function removeGradeFromVault(
  schoolId: string,
  gradeId: string,
  storage: StorageLike | null = getDefaultStorage()
): Grade[] {
  const current = loadPermanentGradeVault(schoolId, storage);
  const filtered = current.filter(g => g.id !== gradeId);
  writePermanentGradeVault(schoolId, filtered, storage);
  return filtered;
}
