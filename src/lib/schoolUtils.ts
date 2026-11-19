import { SchoolClass, Student, Subject } from '../types';

export type SchoolSection = 'MATERNELLE' | 'PRIMAIRE' | 'COLLEGE' | 'LYCEE';

/**
 * Détermine la section éducative (MATERNELLE, PRIMAIRE, COLLEGE, LYCEE)
 * d'une classe, d'un élève ou d'un objet descriptif.
 */
export function getClassSection(
  c?: SchoolClass | Student | { level?: string; name?: string; stream?: string; classId?: string; id?: string } | null
): SchoolSection {
  if (!c) return 'COLLEGE';

  const levelUpper = (c.level || '').trim().toUpperCase();
  const name = (
    ('name' in c && typeof c.name === 'string' ? c.name : '') ||
    ('className' in c && typeof (c as any).className === 'string' ? (c as any).className : '')
  ).trim().toLowerCase();
  const stream = ('stream' in c && typeof c.stream === 'string' ? c.stream : '').toLowerCase();

  // 1. Détection Maternelle
  if (
    levelUpper === 'MATERNELLE' ||
    levelUpper === 'NURSERY' ||
    levelUpper.includes('MATERNELLE') ||
    /\b(maternelle|petite section|moyenne section|grande section|crèche|creche|garderie)\b/i.test(name) ||
    name.includes('maternelle') ||
    stream.includes('maternelle')
  ) {
    return 'MATERNELLE';
  }

  // 2. Détection Primaire (CI à CM2)
  if (
    levelUpper === 'PRIMAIRE' ||
    levelUpper === 'PRIMARY' ||
    levelUpper.includes('PRIMAIRE') ||
    /^(ci|cp|cp1|cp2|ce|ce1|ce2|cm|cm1|cm2|sil)\b/i.test(name) ||
    /\b(ci|cp|cp1|cp2|ce1|ce2|cm1|cm2|sil)\b/i.test(name) ||
    name.includes('cours d\'initiation') ||
    name.includes('cours préparatoire') ||
    name.includes('cours élémentaire') ||
    name.includes('cours moyen') ||
    name.includes('primaire') ||
    stream.includes('primaire') ||
    stream.includes('cep')
  ) {
    return 'PRIMAIRE';
  }

  // 3. Détection Lycée & Formation Professionnelle (Secondaire 2nd Cycle: 2nde, 1ère, Terminale)
  if (
    levelUpper === 'LYCEE' ||
    levelUpper === 'FORMATION' ||
    levelUpper.includes('LYCEE') ||
    levelUpper.includes('FORMATION') ||
    /^(2nde|seconde|1ère|1ere|premiere|première|tle|terminale)\b/i.test(name) ||
    /\b(2nde|seconde|1ère|1ere|premiere|première|tle|terminale|bac|cap|g1|g2|g3|f1|f2|f3|f4)\b/i.test(name) ||
    name.includes('seconde') ||
    name.includes('terminale') ||
    name.includes('première') ||
    name.includes('premiere') ||
    stream.includes('lycée') ||
    stream.includes('lycee') ||
    stream.includes('technique') ||
    stream.includes('bac')
  ) {
    return 'LYCEE';
  }

  // 4. Par défaut : Collège (Secondaire 1er Cycle: 6ème à 3ème)
  return 'COLLEGE';
}

/**
 * Détermine si une classe appartient au cycle Primaire ou Maternelle.
 * Utilisé pour filtrer et exclure rigoureusement les classes du primaire de l'Espace Professeur (secondaire : collège & lycée).
 */
export function isPrimaryClass(c?: SchoolClass | Student | { level?: string; name?: string; stream?: string } | null): boolean {
  if (!c) return false;
  const section = getClassSection(c);
  return section === 'PRIMAIRE' || section === 'MATERNELLE';
}

export function isEspagnolSubject(sbj: Pick<Subject, 'code' | 'name'>): boolean {
  const code = (sbj.code || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const name = (sbj.name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  return code === 'esp' || name.includes('espagnol') || name.includes('spanish');
}

/**
 * Détermine si une classe (ou un élève) est en 6ème ou 5ème (premier sous-cycle du Collège).
 */
export function isSixthOrFifthClass(
  c?: SchoolClass | Student | { level?: string; name?: string; stream?: string; className?: string; classId?: string; id?: string; firstName?: string } | null
): boolean {
  if (!c) return false;
  if (getClassSection(c) !== 'COLLEGE') return false;

  const isStudentObj = 'firstName' in c && typeof (c as any).firstName === 'string';
  const classId = (
    (isStudentObj ? (c as Student).classId : ('id' in c ? c.id : '')) ||
    ('classId' in c && typeof c.classId === 'string' ? c.classId : '') ||
    ''
  ).trim().toLowerCase();

  if (classId === 'cls-6' || classId === 'cls-5') return true;

  const rawName = (
    ('name' in c && typeof c.name === 'string' ? c.name : '') ||
    ('className' in c && typeof (c as any).className === 'string' ? (c as any).className : '')
  )
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (!rawName) return false;
  return (
    /(?:^|[^0-9])6\s*e(?:me)?(?:[^a-z]|$)|sixieme/i.test(rawName) ||
    /(?:^|[^0-9])5\s*e(?:me)?(?:[^a-z]|$)|cinquieme/i.test(rawName)
  );
}

/**
 * Détermine si une matière appartient au bulletin d'une classe donnée.
 * Règle d'or : Toute matière ajoutée dans une section (Maternelle, Primaire, Collège, Lycée)
 * s'ajoute directement et automatiquement sur les bulletins de toutes les classes de cette section,
 * à l'exception d'Espagnol qui ne figure pas sur les bulletins de 6ème et 5ème.
 */
export function isSubjectForClass(
  sbj: Subject,
  clsOrStudent?: SchoolClass | Student | { level?: string; name?: string; stream?: string; classId?: string; id?: string } | null,
  allSubjects: Subject[] = []
): boolean {
  if (!clsOrStudent) return true;

  const targetSection = getClassSection(clsOrStudent);
  const classId = ('id' in clsOrStudent ? clsOrStudent.id : ('classId' in clsOrStudent ? clsOrStudent.classId : '')) || '';

  // Espagnol n'est pas enseigné en 6ème ni en 5ème (uniquement à partir de la 4ème / 3ème / Lycée)
  if (targetSection === 'COLLEGE' && isSixthOrFifthClass(clsOrStudent) && isEspagnolSubject(sbj)) {
    return false;
  }

  // 1. Si la matière a été ciblée sur des classes spécifiques
  if (sbj.classIds && Array.isArray(sbj.classIds) && sbj.classIds.length > 0) {
    return classId ? sbj.classIds.includes(classId) : false;
  }

  // 2. Section Maternelle
  if (targetSection === 'MATERNELLE') {
    return sbj.level === 'MATERNELLE' || sbj.id.startsWith('sbj-mat-');
  }

  // 3. Section Primaire
  if (targetSection === 'PRIMAIRE') {
    return (
      (sbj.level === 'PRIMAIRE' || sbj.id.startsWith('sbj-p-') || sbj.id.startsWith('sbj-prim-')) &&
      sbj.level !== 'MATERNELLE' &&
      !sbj.id.startsWith('sbj-mat-')
    );
  }

  // 4. Section Collège (6ème à 3ème)
  if (targetSection === 'COLLEGE') {
    // Si la matière a été explicitement créée pour le collège
    if (sbj.level === 'COLLEGE') return true;

    const hasCollegeFrenchSplit = allSubjects.some(
      s =>
        s.level === 'COLLEGE' &&
        (s.code === 'CE' ||
          s.code === 'LECT' ||
          s.name.toLowerCase().includes('communication') ||
          s.name.toLowerCase().includes('lecture'))
    );

    // Matières de base du secondaire partagées entre Collège et Lycée (initialData hérité)
    const sharedSecondaryCodes = hasCollegeFrenchSplit
      ? ['MATH', 'PCT', 'PC', 'SPCT', 'SVT', 'INFO', 'EPS']
      : ['MATH', 'PCT', 'PC', 'SPCT', 'FRAN', 'SVT', 'INFO', 'EPS'];
    if (sbj.level === 'LYCEE' && sharedSecondaryCodes.includes((sbj.code || '').toUpperCase())) {
      return true;
    }

    // Exclure les matières spécifiques au Lycée (Philo, G2 Compta, Eco, etc.) et Primaire/Maternelle
    return false;
  }

  // 5. Section Lycée (2nde à Terminale)
  if (targetSection === 'LYCEE') {
    // Si la matière a été explicitement créée pour le lycée ou formation
    if (sbj.level === 'LYCEE' || sbj.level === 'FORMATION') return true;

    // Matières de base du secondaire partagées entre Collège et Lycée (initialData hérité)
    const sharedSecondaryCodes = ['PCT', 'PC', 'SPCT', 'HIST', 'ANG'];
    if (sbj.level === 'COLLEGE' && sharedSecondaryCodes.includes((sbj.code || '').toUpperCase())) {
      return true;
    }

    return false;
  }

  return sbj.level === targetSection;
}

/**
 * Supprime tout numéro d'ordre, indice ou préfixe matricule pouvant apparaître
 * devant un nom ou prénom d'élève (ex: "1. KOFFI", "01 - KOFFI", "2361077 KOFFI").
 */
export function cleanPersonName(raw?: string | null): string {
  if (!raw) return '';
  let cleaned = String(raw).replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  for (let i = 0; i < 3; i++) {
    const prev = cleaned;
    // Préfixes explicites N°, #, Mat:, Matricule:
    cleaned = cleaned.replace(/^(?:(?:n°|no|#)\s*\d+[a-z0-9\-\/]*[\.\)\-:\s]*|(?:matricule|mat\.?)\s*[:=\-]?\s*[a-z0-9\-\/_]+[\.\)\-:\s]+)/i, '').trim();
    // Préfixes codes alphanumériques type MAT-042, 2025-COL-001
    cleaned = cleaned.replace(/^(?:[A-Z]{2,5}-\d{2,}[A-Z0-9\-]*|\d{4}-[A-Z0-9\-]{2,})[\.\)\-:\s]+/i, '').trim();
    // Nombres seuls ou suivis de ., ), -, : devant le nom (ex: "1. ADANLETE", "02 ADANLETE", "2361077 ADANLETE")
    cleaned = cleaned.replace(/^\d+[\.\)\-:\s]+/, '').trim();
    if (cleaned === prev) break;
  }

  // Si la valeur restante n'est composée que de chiffres/ponctuation (aucune lettre), l'ignorer
  if (/^[\d\s\.\-\/_,;:]+$/.test(cleaned)) {
    return '';
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Retourne exclusivement le nom et les prénoms propres d'un élève,
 * sans aucun numéro ou matricule devant le nom.
 */
export function getCleanStudentNames(
  student?: { lastName?: string | null; firstName?: string | null } | null
): { lastName: string; firstName: string; fullName: string } {
  if (!student) return { lastName: '', firstName: '', fullName: '' };
  let last = cleanPersonName(student.lastName);
  let first = cleanPersonName(student.firstName);

  if (!last && first) {
    const parts = first.split(/\s+/).filter(Boolean);
    last = parts[0] || '';
    first = parts.slice(1).join(' ');
  }

  const fullName = [last ? last.toUpperCase() : '', first].filter(Boolean).join(' ').trim();
  return { lastName: last, firstName: first, fullName };
}

function normalizeNameForMatch(value?: string | null): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’`_.,\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getNormalizedNameParts(student?: { lastName?: string | null; firstName?: string | null } | null) {
  const clean = getCleanStudentNames(student);
  const last = normalizeNameForMatch(clean.lastName);
  const first = normalizeNameForMatch(clean.firstName);
  const full = [last, first].filter(Boolean).join(' ').trim();
  const swapped = [first, last].filter(Boolean).join(' ').trim();
  const tokens = full.split(' ').filter(Boolean);
  const sorted = [...tokens].sort().join(' ');
  return { last, first, full, swapped, tokens, sorted };
}

/**
 * Recherche un élève existant correspondant au nom/prénom fourni
 * (insensible aux accents, tirets, casse et ordre Nom/Prénom),
 * afin de remplacer automatiquement son ancien numéro matricule sans créer de doublon.
 */
export function findMatchingExistingStudent(
  candidate: { lastName?: string | null; firstName?: string | null; classId?: string | null },
  existingStudents: Student[],
  preferredClassId?: string
): Student | undefined {
  if (!existingStudents || existingStudents.length === 0) return undefined;
  const cand = getNormalizedNameParts(candidate);
  if (!cand.full) return undefined;

  const targetClassId = preferredClassId || candidate.classId || undefined;

  const findExactInPool = (pool: Student[]): Student | undefined => {
    const exactFullMatches: Student[] = [];
    const exactVariantMatches: Student[] = [];

    for (const s of pool) {
      const ex = getNormalizedNameParts(s);
      if (!ex.full) continue;
      if (cand.full === ex.full) {
        exactFullMatches.push(s);
      } else if (
        cand.full === ex.swapped ||
        (cand.tokens.length >= 2 && ex.tokens.length === cand.tokens.length && cand.sorted === ex.sorted)
      ) {
        exactVariantMatches.push(s);
      }
    }

    if (exactFullMatches.length === 1) return exactFullMatches[0];
    if (exactFullMatches.length === 0 && exactVariantMatches.length === 1) return exactVariantMatches[0];
    return undefined;
  };

  if (targetClassId) {
    const classPool = existingStudents.filter(s => s.classId === targetClassId);
    const exactClassMatch = findExactInPool(classPool);
    if (exactClassMatch) return exactClassMatch;

    // Correspondance souple dans la même classe uniquement (ex: prénom composé partiel ou nom seul si unique)
    const softMatches: Student[] = [];
    for (const s of classPool) {
      const ex = getNormalizedNameParts(s);
      if (!ex.full) continue;

      if (!cand.first && cand.last && ex.last === cand.last) {
        softMatches.push(s);
        continue;
      }

      if (cand.tokens.length >= 2 && ex.tokens.length >= 2) {
        const candInEx = cand.tokens.every(ct =>
          ex.tokens.some(et => et === ct || (ct.length >= 3 && et.startsWith(ct)))
        );
        const exInCand = ex.tokens.every(et =>
          cand.tokens.some(ct => ct === et || (et.length >= 3 && ct.startsWith(et)))
        );
        if ((candInEx || exInCand) && (ex.last === cand.last || ex.tokens[0] === cand.tokens[0])) {
          softMatches.push(s);
        }
      }
    }
    if (softMatches.length === 1) return softMatches[0];
  }

  // Recherche sur tout l'établissement uniquement si correspondance exacte et strictement unique
  return findExactInPool(existingStudents);
}

/**
 * Détermine si l'élève est redoublant (priorité au choix explicite coché sur le bulletin).
 */
export function getStudentRepeaterStatus(student?: Student | null): boolean {
  if (!student) return false;
  if (typeof student.isRepeater === 'boolean') {
    return student.isRepeater;
  }
  return student.status === 'TRANSFERE' || Boolean(student.medicalNotes && student.medicalNotes.toLowerCase().includes('redoubl'));
}


