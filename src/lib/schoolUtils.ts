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

/**
 * Détermine si une matière appartient au bulletin d'une classe donnée.
 * Règle d'or : Toute matière ajoutée dans une section (Maternelle, Primaire, Collège, Lycée)
 * s'ajoute directement et automatiquement sur les bulletins de toutes les classes de cette section.
 */
export function isSubjectForClass(
  sbj: Subject,
  clsOrStudent?: SchoolClass | Student | { level?: string; name?: string; stream?: string; classId?: string; id?: string } | null,
  allSubjects: Subject[] = []
): boolean {
  if (!clsOrStudent) return true;

  const targetSection = getClassSection(clsOrStudent);
  const classId = ('id' in clsOrStudent ? clsOrStudent.id : ('classId' in clsOrStudent ? clsOrStudent.classId : '')) || '';

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

    // Matières de base du secondaire partagées entre Collège et Lycée (initialData hérité)
    const sharedSecondaryCodes = ['MATH', 'FRAN', 'SVT', 'INFO', 'EPS'];
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
    const sharedSecondaryCodes = ['PCT', 'HIST', 'ANG'];
    if (sbj.level === 'COLLEGE' && sharedSecondaryCodes.includes((sbj.code || '').toUpperCase())) {
      return true;
    }

    return false;
  }

  return sbj.level === targetSection;
}
