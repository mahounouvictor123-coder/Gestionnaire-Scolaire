import { Student, Grade, Subject, BulletinTemplate, SchoolClass, CouncilDecisionData } from '../types';
import { getClassSection, isPrimaryClass, isSubjectForClass } from './schoolUtils';

export interface SubjectResult {
  subject: Subject;
  grades: Grade[];
  interro1?: number;
  interro2?: number;
  interroAverage?: number;
  devoirMark?: number; // DEV 1
  devoir2Mark?: number; // DEV 2
  compoMark?: number;
  average: number;
  weightedAverage: number;
  coefficient: number;
  subjectRank?: string;
  appreciation: string;
  teacherName?: string;
}

export interface SubjectGroup {
  name: string;
  categoryKey: 'SCIENTIFIQUE' | 'LITTERAIRE' | 'AUTRES';
  items: SubjectResult[];
  totalCoeff: number;
  totalWeightedPoints: number;
  groupAverage: number;
}

export interface StudentRankResult {
  student: Student;
  subjectResults: SubjectResult[];
  totalCoefficients: number;
  totalWeightedPoints: number;
  overallAverage: number;
  rank: string; // e.g., "1er", "2ème", "3ème ex-aequo", "12ème"
  numericRank: number; // 1, 2, 3...
  mention: string; // "TABLEAU D'HONNEUR", "ENCOURAGEMENTS", "ADMIS", etc.
  generalAppreciation: string;
}

export interface ClassRankSummary {
  rankings: StudentRankResult[];
  classAverage: number;
  highestAverage: number;
  lowestAverage: number;
  totalStudents: number;
  passedCount: number;
  passRate: number;
}

export function defaultBulletinTemplate(): BulletinTemplate {
  return {
    id: 'default-model',
    templateName: 'Modèle Officiel PONDÉRÉ (Norme Africaine)',
    calculationFormula: 'WEIGHTED_COEFFICIENTS',
    columns: {
      showInterroAverage: true,
      showInterro1: true,
      showInterro2: true,
      showDevoirMark: true,
      showCompoMark: true,
      showCoefficients: true,
      showWeightedAverage: true,
      showSubjectRank: true,
      showTeacherAppreciation: true
    },
    maxMarkScale: 20,
    honorRollThreshold: 14,
    encouragementThreshold: 12,
    passingThreshold: 10,
    showClassStatistics: true,
    showClassRank: true,
    headerTitle: 'BULLETIN TRIMESTRIEL DE NOTES',
    directorTitle: 'Le Directeur Général'
  };
}

export type CollegeGradeTier = '6EME' | '5EME' | '4EME' | '3EME';

function resolveClassIdFromTarget(
  classOrStudent?: SchoolClass | Student | { level?: string; name?: string; stream?: string; className?: string; classId?: string; id?: string; firstName?: string } | null
): string | undefined {
  if (!classOrStudent) return undefined;
  const isStudentObj = 'firstName' in classOrStudent && typeof (classOrStudent as any).firstName === 'string';
  if (isStudentObj) {
    return (classOrStudent as Student).classId || undefined;
  }
  return ('classId' in classOrStudent && classOrStudent.classId) || classOrStudent.id || undefined;
}

/**
 * Détecte le niveau précis du Collège (6ème, 5ème, 4ème, 3ème) pour appliquer
 * les coefficients officiels propres à chaque classe sur tous les bulletins.
 */
export function getCollegeGradeTier(
  classOrStudent?: SchoolClass | Student | { level?: string; name?: string; stream?: string; className?: string; classId?: string; id?: string; firstName?: string } | null
): CollegeGradeTier | null {
  if (!classOrStudent) return null;
  if (getClassSection(classOrStudent) !== 'COLLEGE') return null;

  const isStudentObj = 'firstName' in classOrStudent && typeof (classOrStudent as any).firstName === 'string';
  const rawName = normalizeSubjectLabel(
    ('name' in classOrStudent && typeof classOrStudent.name === 'string' ? classOrStudent.name : '') ||
    ('className' in classOrStudent && typeof (classOrStudent as any).className === 'string' ? (classOrStudent as any).className : '')
  );
  const classId = (
    (isStudentObj ? (classOrStudent as Student).classId : classOrStudent.id) ||
    ('classId' in classOrStudent && classOrStudent.classId) ||
    ''
  ).toLowerCase();

  if (classId === 'cls-6' || /(?:^|[^0-9])6\s*e(?:me)?(?:[^a-z]|$)|sixieme/i.test(rawName)) {
    return '6EME';
  }
  if (classId === 'cls-5' || /(?:^|[^0-9])5\s*e(?:me)?(?:[^a-z]|$)|cinquieme/i.test(rawName)) {
    return '5EME';
  }
  if (classId === 'cls-4' || /(?:^|[^0-9])4\s*e(?:me)?(?:[^a-z]|$)|quatrieme/i.test(rawName)) {
    return '4EME';
  }
  if (classId === 'cls-3' || /(?:^|[^0-9])3\s*e(?:me)?(?:[^a-z]|$)|troisieme/i.test(rawName)) {
    return '3EME';
  }
  return null;
}

/**
 * Règle officielle des coefficients au Collège :
 * - 6ème & 5ème : coefficient 1 dans toutes les matières.
 * - 4ème & 3ème : coefficient 2 dans toutes les matières, sauf :
 *   Mathématiques = 3, Informatique = 1, EPS = 1, Conduite = 1.
 */
export function getDefaultCollegeSubjectCoefficient(
  subject: Pick<Subject, 'code' | 'name'>,
  tier: CollegeGradeTier
): number {
  if (tier === '6EME' || tier === '5EME') {
    return 1;
  }

  const c = normalizeSubjectLabel(subject.code);
  const n = normalizeSubjectLabel(subject.name);

  if (c === 'math' || n.includes('math')) return 3;
  if (c === 'info' || n.includes('informatique') || n.includes('algo')) return 1;
  if (c === 'eps' || n.includes('eps') || n.includes('education physique') || n.includes('sport')) return 1;
  if (c === 'cond' || n.includes('conduite')) return 1;

  return 2;
}

/**
 * Retourne le coefficient effectif d'une matière pour une classe donnée,
 * en respectant d'abord les éventuelles personnalisations par classe,
 * puis les règles officielles du Collège (6è/5è vs 4è/3è), sinon le coefficient par défaut de la matière.
 */
export function getEffectiveSubjectCoefficient(
  subject: Subject,
  classOrStudent?: SchoolClass | Student | { level?: string; name?: string; stream?: string; className?: string; classId?: string; id?: string; firstName?: string } | null
): number {
  const classId = resolveClassIdFromTarget(classOrStudent);
  if (classId && subject.classCoefficients) {
    const clsOverride = subject.classCoefficients[classId];
    if (typeof clsOverride === 'number' && clsOverride > 0) {
      return clsOverride;
    }
  }

  const tier = getCollegeGradeTier(classOrStudent);
  if (tier && subject.classCoefficients) {
    const tierOverride = subject.classCoefficients[tier];
    if (typeof tierOverride === 'number' && tierOverride > 0) {
      return tierOverride;
    }
  }

  if (tier) {
    return getDefaultCollegeSubjectCoefficient(subject, tier);
  }

  return subject.coefficient || 1;
}

/**
 * Construit le patch à passer à updateSubject lors d'une modification de coefficient
 * sur le bulletin d'une classe sans écraser les autres niveaux (ex: 6è vs 3è vs Lycée).
 */
export function buildClassCoefficientUpdate(
  subject: Subject,
  newCoeff: number,
  classOrStudent?: SchoolClass | Student | { level?: string; name?: string; stream?: string; className?: string; classId?: string; id?: string; firstName?: string } | null
): Partial<Subject> {
  const safeCoeff = Math.max(1, Math.round(newCoeff) || 1);
  const classId = resolveClassIdFromTarget(classOrStudent);
  const tier = getCollegeGradeTier(classOrStudent);

  if (classId || tier) {
    const nextClassCoeffs: Record<string, number> = {
      ...(subject.classCoefficients || {})
    };
    if (classId) {
      nextClassCoeffs[classId] = safeCoeff;
    } else if (tier) {
      nextClassCoeffs[tier] = safeCoeff;
    }
    return {
      classCoefficients: nextClassCoeffs,
      ...(!tier && subject.level !== 'COLLEGE' ? { coefficient: safeCoeff } : {})
    };
  }

  return { coefficient: safeCoeff };
}

export function calculateSubjectAverage(
  subject: Subject,
  studentGrades: Grade[],
  bulletinTemplate?: BulletinTemplate,
  classOrStudent?: SchoolClass | Student | { level?: string; name?: string; stream?: string; className?: string; classId?: string; id?: string; firstName?: string } | null
): SubjectResult {
  const template = bulletinTemplate || defaultBulletinTemplate();
  const coeff = getEffectiveSubjectCoefficient(subject, classOrStudent);

  if (!studentGrades || studentGrades.length === 0) {
    return {
      subject,
      grades: [],
      interro1: undefined,
      interro2: undefined,
      average: 0,
      weightedAverage: 0,
      coefficient: coeff,
      appreciation: 'Pas de note'
    };
  }

  // Normalize marks to a standard /20 scale
  const toScale20 = (g: Grade) => {
    if (g.maxMark && g.maxMark > 0 && g.maxMark !== 20) {
      return (g.mark / g.maxMark) * 20;
    }
    return g.mark;
  };

  const isInterro = (t: string) => {
    const u = (t || '').toUpperCase().trim();
    return u === 'INTERRO' || u === 'TP' || u.startsWith('INTERRO') || u.startsWith('TEST') || u.startsWith('EVAL') || u.startsWith('INT');
  };
  const isDevoir = (t: string) => {
    const u = (t || '').toUpperCase().trim();
    return u === 'DEVOIR' || u.startsWith('DEVOIR') || u === 'DS' || u.startsWith('DS');
  };
  const isCompo = (t: string) => {
    const u = (t || '').toUpperCase().trim();
    return u === 'COMPOSITION' || u.startsWith('COMPO') || u === 'EXAMEN' || u.startsWith('EXAM');
  };

  const interros = studentGrades
    .filter(g => isInterro(g.examType))
    .sort((a, b) => {
      if (a.evaluationNumber && b.evaluationNumber) return a.evaluationNumber - b.evaluationNumber;
      if (a.evaluationNumber === 1) return -1;
      if (b.evaluationNumber === 1) return 1;
      return (a.date || '').localeCompare(b.date || '');
    });

  const { int1: int1Grade, int2: int2Grade } = resolveInterroSlots(interros);

  const interro1Mark = int1Grade ? toScale20(int1Grade) : undefined;
  const interro2Mark = int2Grade ? toScale20(int2Grade) : undefined;

  const devoirs = studentGrades.filter(g => isDevoir(g.examType));
  const compos = studentGrades.filter(g => isCompo(g.examType));

  const interroAvg = interros.length > 0
    ? interros.reduce((sum, g) => sum + toScale20(g), 0) / interros.length
    : undefined;

  const devoirAvg = devoirs.length > 0
    ? devoirs.reduce((sum, g) => sum + toScale20(g), 0) / devoirs.length
    : undefined;

  const compoAvg = compos.length > 0
    ? compos.reduce((sum, g) => sum + toScale20(g), 0) / compos.length
    : undefined;

  let finalAverage = 0;

  if (template.calculationFormula === 'WEIGHTED_COEFFICIENTS' && interroAvg === undefined && devoirAvg === undefined && compoAvg === undefined) {
    const totalWeighted = studentGrades.reduce((sum, g) => sum + (toScale20(g) * (g.coefficient || 1)), 0);
    const totalCoeffs = studentGrades.reduce((sum, g) => sum + (g.coefficient || 1), 0) || 1;
    finalAverage = totalWeighted / totalCoeffs;
  } else {
    // Formule officielle demandée :
    // La moyenne d'interro s'ajoute à la note de devoir et de composition, puis divisé par 3 :
    // Moyenne = (Moyenne Interros + Note Devoir + Note Composition) / 3
    let totalParts = 0;
    let sumPoints = 0;

    if (interroAvg !== undefined) {
      sumPoints += interroAvg;
      totalParts += 1;
    }
    if (devoirAvg !== undefined) {
      sumPoints += devoirAvg;
      totalParts += 1;
    }
    if (compoAvg !== undefined) {
      sumPoints += compoAvg;
      totalParts += 1;
    }

    if (totalParts > 0) {
      finalAverage = sumPoints / totalParts;
    } else if (studentGrades.length > 0) {
      const totalWeighted = studentGrades.reduce((sum, g) => sum + (toScale20(g) * (g.coefficient || 1)), 0);
      const totalCoeffs = studentGrades.reduce((sum, g) => sum + (g.coefficient || 1), 0) || 1;
      finalAverage = totalWeighted / totalCoeffs;
    } else {
      finalAverage = 0;
    }
  }

  // Teacher comment from entered grades
  const teacherComments = studentGrades
    .map(g => g.comment?.trim())
    .filter((c): c is string => Boolean(c && c.length > 0));
  const teacherComment = teacherComments.length > 0 ? teacherComments[teacherComments.length - 1] : '';
  const devoir1 = devoirs[0] ? toScale20(devoirs[0]) : undefined;
  const devoir2 = devoirs[1] ? toScale20(devoirs[1]) : undefined;

  return {
    subject,
    grades: studentGrades,
    interro1: interro1Mark,
    interro2: interro2Mark,
    interroAverage: interroAvg,
    devoirMark: devoir1 ?? devoirAvg,
    devoir2Mark: devoir2,
    compoMark: compoAvg,
    average: finalAverage,
    weightedAverage: finalAverage * coeff,
    coefficient: coeff,
    appreciation: teacherComment || getSubjectAppreciation(finalAverage)
  };
}

export function getSubjectAppreciation(avg: number): string {
  if (avg >= 18) return 'Travail exceptionnel. Félicitations !';
  if (avg >= 16) return 'Excellent trimestre. Continuez ainsi.';
  if (avg >= 14) return 'Très bon travail. Résultats très satisfaisants.';
  if (avg >= 12) return 'Bon trimestre. Peut encore progresser.';
  if (avg >= 10) return 'Résultats passables. Effort soutenu requis.';
  if (avg >= 8) return 'Insuffisant. Doit se concentrer davantage.';
  return 'Très insuffisant. Alerte rouge, travail à renforcer.';
}

export function getMention(avg: number, template?: BulletinTemplate): string {
  const tmpl = template || defaultBulletinTemplate();
  if (avg >= tmpl.honorRollThreshold) return "TABLEAU D'HONNEUR";
  if (avg >= tmpl.encouragementThreshold) return 'ENCOURAGEMENTS';
  if (avg >= tmpl.passingThreshold) return 'ADMIS';
  if (avg >= 8) return 'AVERTISSEMENT TRAVAIL';
  return 'BLÂME TRAVAIL';
}

export function getGeneralAppreciation(avg: number): string {
  if (avg >= 16) return "Félicitations du Conseil de Classe. L'élève fait preuve d'une excellente maturité et d'une rigueur ejemplaire dans toutes les disciplines.";
  if (avg >= 14) return "Bilan trimestriel très positif. Résultats très satisfaisants et régularité exemplaire dans l'effort.";
  if (avg >= 12) return "Trimestre satisfaisant. L'ensemble est encourageant, maintenez cette attention au second trimestre.";
  if (avg >= 10) return "Ensemble passable. L'élève a atteint le seuil minimum mais doit renforcer son travail personnel.";
  if (avg >= 8) return "Résultats insuffisants. Un rattrapage immédiat et une meilleure assiduité à la maison sont exigés.";
  return "Alerte de la Direction. Le niveau d'effort est très insuffisant, un entretien parent-direction est convoqué.";
}

export function calculateClassRanks(
  students: Student[],
  grades: Grade[],
  subjects: Subject[],
  trimester: number,
  bulletinTemplate?: BulletinTemplate,
  schoolClass?: SchoolClass
): ClassRankSummary {
  const tmpl = bulletinTemplate || defaultBulletinTemplate();

  if (!students || students.length === 0) {
    return {
      rankings: [],
      classAverage: 0,
      highestAverage: 0,
      lowestAverage: 0,
      totalStudents: 0,
      passedCount: 0,
      passRate: 0
    };
  }

  // Référence de la classe pour déterminer la section (schoolClass ou premier élève)
  const classRef = schoolClass || students[0];

  // Filtrage strict par section : Toute matière ajoutée dans une section
  // (Maternelle, Primaire, Collège, Lycée) s'ajoute directement sur les bulletins de la section.
  const relevantSubjects = subjects.filter(sbj => isSubjectForClass(sbj, classRef, subjects));

  // Always include any subjects that have registered grades for these students
  const studentIdsSet = new Set(students.map(s => s.id));
  const gradedSubjectIds = new Set(
    grades
      .filter(g => studentIdsSet.has(g.studentId) && Number(g.trimester) === Number(trimester))
      .map(g => g.subjectId)
  );
  const extraGradedSubjects = subjects.filter(s => gradedSubjectIds.has(s.id) && !relevantSubjects.some(rs => rs.id === s.id));
  const activeSubjectsRaw = (relevantSubjects.length > 0 ? relevantSubjects : subjects).concat(extraGradedSubjects);
  const isCollegeClass = getClassSection(classRef) === 'COLLEGE';
  const { subjects: deduplicatedSubjects, aliasesByKeptId } = deduplicateSubjectsWithAliases(
    activeSubjectsRaw,
    isCollegeClass,
    gradedSubjectIds
  );
  const activeSubjects = isCollegeClass
    ? sortSubjectsForCollege(deduplicatedSubjects)
    : deduplicatedSubjects;

  // 1. Calculate for each student
  const rawResults = students.map(student => {
    const studentGrades = grades.filter(g => g.studentId === student.id && Number(g.trimester) === Number(trimester));
    
    // Evaluate for each subject relevant to student - KEEP ALL subjects defined by the school
    const subjectResults = activeSubjects.map(sbj => {
      const aliases = aliasesByKeptId.get(sbj.id) || [sbj];
      const sbjGrades = studentGrades.filter(g =>
        aliases.some(alias =>
          g.subjectId === alias.id ||
          g.subjectId === alias.name ||
          (alias.code && g.subjectId === alias.code) ||
          (g.subjectName && g.subjectName.trim().toLowerCase() === alias.name.trim().toLowerCase()) ||
          (g.subjectId && g.subjectId.trim().toLowerCase() === alias.name.trim().toLowerCase()) ||
          (g.subjectName && alias.name && (g.subjectName.toLowerCase().includes(alias.name.toLowerCase()) || alias.name.toLowerCase().includes(g.subjectName.toLowerCase())))
        )
      );
      const res = calculateSubjectAverage(sbj, sbjGrades, tmpl, classRef);

      // If no grades exist for this student in this subject
      if (sbjGrades.length === 0) {
        return {
          ...res,
          coefficient: getEffectiveSubjectCoefficient(sbj, classRef),
          average: 0,
          weightedAverage: 0,
          appreciation: 'Non évalué'
        };
      }

      return res;
    });

    // Evaluate total coefficients and overall average based on evaluated subjects
    const evaluatedResults = subjectResults.filter(sr => sr.grades.length > 0);
    const totalCoeffs = evaluatedResults.length > 0
      ? evaluatedResults.reduce((sum, sr) => sum + sr.coefficient, 0)
      : subjectResults.reduce((sum, sr) => sum + sr.coefficient, 0) || 1;
    const totalWeightedPoints = evaluatedResults.reduce((sum, sr) => sum + sr.weightedAverage, 0);
    const overallAverage = evaluatedResults.length > 0 ? totalWeightedPoints / totalCoeffs : 0;

    return {
      student,
      subjectResults,
      totalCoefficients: totalCoeffs,
      totalWeightedPoints,
      overallAverage,
      rank: '',
      numericRank: 0,
      mention: getMention(overallAverage, tmpl),
      generalAppreciation: getGeneralAppreciation(overallAverage)
    };
  });

  // 2. Sort descending by overallAverage
  const sorted = [...rawResults].sort((a, b) => b.overallAverage - a.overallAverage);

  // 3. Assign Ranks (1er, 2ème, 3ème, ex-aequo...)
  let currentRank = 1;
  sorted.forEach((item, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      // Compare rounded to 2 decimals for exact equality
      if (Math.abs(prev.overallAverage - item.overallAverage) < 0.001) {
        item.numericRank = prev.numericRank;
      } else {
        item.numericRank = index + 1;
      }
    } else {
      item.numericRank = 1;
    }

    // Check if ex-aequo
    const hasExAequo = sorted.filter(s => Math.abs(s.overallAverage - item.overallAverage) < 0.001).length > 1;

    let rankSuffix = '';
    if (item.numericRank === 1) {
      rankSuffix = item.student.gender === 'F' ? '1ère' : '1er';
    } else {
      rankSuffix = `${item.numericRank}ème`;
    }

    if (hasExAequo) {
      rankSuffix += ' ex-aequo';
    }

    item.rank = rankSuffix;
  });

  // Calculate subject ranks if needed
  subjects.forEach(sbj => {
    const sbjScores = sorted.map(st => {
      const res = st.subjectResults.find(r => r.subject.id === sbj.id);
      return { studentId: st.student.id, avg: res ? res.average : 0 };
    }).sort((a, b) => b.avg - a.avg);

    sbjScores.forEach((scoreObj, idx) => {
      let sbjRankNum = idx + 1;
      if (idx > 0 && Math.abs(sbjScores[idx - 1].avg - scoreObj.avg) < 0.001) {
        sbjRankNum = idx; // simple tie fallback
      }
      const studentObj = sorted.find(st => st.student.id === scoreObj.studentId);
      if (studentObj) {
        const sr = studentObj.subjectResults.find(r => r.subject.id === sbj.id);
        if (sr) {
          sr.subjectRank = `${sbjRankNum}e`;
        }
      }
    });
  });

  // 4. Class Statistics
  const totalStudents = sorted.length;
  const validAverages = sorted.map(s => s.overallAverage);
  const highestAverage = totalStudents > 0 ? Math.max(...validAverages) : 0;
  const lowestAverage = totalStudents > 0 ? Math.min(...validAverages) : 0;
  const sumAverages = validAverages.reduce((acc, v) => acc + v, 0);
  const classAverage = totalStudents > 0 ? sumAverages / totalStudents : 0;
  const passedCount = sorted.filter(s => s.overallAverage >= (tmpl.passingThreshold || 10)).length;
  const passRate = totalStudents > 0 ? (passedCount / totalStudents) * 100 : 0;

  return {
    rankings: sorted,
    classAverage,
    highestAverage,
    lowestAverage,
    totalStudents,
    passedCount,
    passRate
  };
}

function normalizeSubjectLabel(str: string = ''): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Ordre officiel demandé sur les bulletins de la 6ème à la 3ème :
 * 1. Lecture
 * 2. Communication écrite
 * 3. Anglais
 * 4. Espagnol
 * 5. Histoire-Géographie
 * 6. SVT
 * 7. Mathématiques
 * 8. PCT
 * 9. Informatique
 * 10. EPS
 * 11. Conduite
 */
export function getCollegeSubjectSortOrder(s: Subject): number {
  const n = normalizeSubjectLabel(s.name);
  const c = normalizeSubjectLabel(s.code);

  if (c === 'lect' || n.includes('lecture')) return 1;
  if (c === 'ce' || n.includes('communication') || n.includes('expression ecrite')) return 2;
  if (c === 'ang' || n.includes('anglais') || n.includes('english')) return 3;
  if (c === 'esp' || n.includes('espagnol') || n.includes('spanish')) return 4;
  if (c === 'hist' || c === 'hg' || n.includes('histoire') || n.includes('geograph') || n === 'hist-geo') return 5;
  if (c === 'svt' || n.includes('svt') || n.includes('vie et de la terre') || n.includes('biologie')) return 6;
  if (c === 'math' || n.includes('math')) return 7;
  if (c === 'info' || n.includes('informatique') || n.includes('algo')) return 9;
  if (c === 'eps' || n.includes('eps') || n.includes('education physique') || n.includes('sport')) return 10;
  if (c === 'cond' || n.includes('conduite')) return 11;
  if (c === 'pct' || c === 'pc' || c === 'spct' || n.includes('pct') || n.includes('spct') || n.includes('physique') || n.includes('chimie')) return 8;

  return 99;
}

function getCanonicalSubjectKey(s: Subject, isCollege: boolean): string {
  if (isCollege) {
    const order = getCollegeSubjectSortOrder(s);
    if (order >= 1 && order <= 11) {
      return `college-slot:${order}`;
    }
  }
  const n = normalizeSubjectLabel(s.name);
  const c = normalizeSubjectLabel(s.code);
  if (c === 'pct' || c === 'pc' || c === 'spct' || n.includes('pct') || n.includes('spct') || n === 'physique chimie' || n.includes('physique - chimie') || n.includes('physique-chimie')) {
    return 'canonical:pct';
  }
  return `name:${n || c || s.id}`;
}

export function deduplicateSubjectsWithAliases(
  list: Subject[],
  isCollege: boolean,
  gradedSubjectIds: Set<string> = new Set()
): { subjects: Subject[]; aliasesByKeptId: Map<string, Subject[]> } {
  const buckets = new Map<string, Subject[]>();
  const orderKeys: string[] = [];

  list.forEach(s => {
    const key = getCanonicalSubjectKey(s, isCollege);
    const existing = buckets.get(key);
    if (existing) {
      if (!existing.some(e => e.id === s.id)) {
        existing.push(s);
      }
    } else {
      buckets.set(key, [s]);
      orderKeys.push(key);
    }
  });

  const result: Subject[] = [];
  const aliasesByKeptId = new Map<string, Subject[]>();

  orderKeys.forEach(key => {
    const group = buckets.get(key)!;
    // Préférer une matière ayant déjà des notes saisies, puis la matière officielle (sbj-3 / sbj-col-*), puis la première
    const sortedCandidates = [...group].sort((a, b) => {
      const aGraded = gradedSubjectIds.has(a.id) ? 1 : 0;
      const bGraded = gradedSubjectIds.has(b.id) ? 1 : 0;
      if (aGraded !== bGraded) return bGraded - aGraded;

      const aOfficial = a.id === 'sbj-3' || a.id.startsWith('sbj-col-') || /^sbj-\d+$/.test(a.id) ? 1 : 0;
      const bOfficial = b.id === 'sbj-3' || b.id.startsWith('sbj-col-') || /^sbj-\d+$/.test(b.id) ? 1 : 0;
      return bOfficial - aOfficial;
    });

    const kept = sortedCandidates[0];
    result.push(kept);
    aliasesByKeptId.set(kept.id, group);
  });

  return { subjects: result, aliasesByKeptId };
}

export function deduplicateSubjectsForSection(list: Subject[], isCollege: boolean): Subject[] {
  return deduplicateSubjectsWithAliases(list, isCollege).subjects;
}

export function sortSubjectsForCollege(list: Subject[]): Subject[] {
  return list
    .map((subj, idx) => ({ subj, idx, rank: getCollegeSubjectSortOrder(subj) }))
    .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.idx - b.idx))
    .map(entry => entry.subj);
}

/**
 * Group subjects into official Beninese secondary education clusters:
 * - Collège (6ème à 3ème) :
 *   1. Matières Littéraires (Lecture, Communication écrite, Anglais, Espagnol, Histoire-Géo)
 *   2. Matières Scientifiques (SVT, Mathématiques, PCT)
 *   3. Autres Matières (Informatique, EPS, Conduite, etc.)
 * - Lycée (2nde à Terminale) :
 *   1. Matières Scientifiques
 *   2. Matières Littéraires
 *   3. Autres Matières
 */
export function groupSubjectResults(
  results: SubjectResult[],
  classOrStudent?: SchoolClass | Student | { level?: string; name?: string; stream?: string } | null
): SubjectGroup[] {
  const isScientific = (s: Subject) => {
    const n = (s.name || '').toUpperCase();
    const c = (s.code || '').toUpperCase();
    if (
      n.includes('INFORMATIQUE') ||
      c === 'INFO' ||
      c === 'EPS' ||
      n.includes('EPS') ||
      n.includes('EDUCATION PHYSIQUE') ||
      n.includes('ÉDUCATION PHYSIQUE') ||
      n.includes('SPORT') ||
      c === 'COND' ||
      n.includes('CONDUITE')
    ) {
      return false;
    }
    const cat = (s.category || '').toUpperCase();
    if (cat === 'SCIENTIFIQUE') return true;
    return (
      n.includes('PCT') ||
      c.includes('PCT') ||
      c === 'PC' ||
      c === 'PCT' ||
      n.includes('PHYSIQUE') ||
      n.includes('CHIMIE') ||
      n.includes('TECHNOLOGIE') ||
      n.includes('TECHNO') ||
      n.includes('SPCT') ||
      c.includes('SPCT') ||
      n.includes('MATH') ||
      c.includes('MATH') ||
      n.includes('SVT') ||
      c.includes('SVT') ||
      n.includes('BIOLOGIE') ||
      n.includes('SCIENCE') ||
      n.includes('EST') ||
      c.includes('EST')
    );
  };

  const isLiterary = (s: Subject) => {
    const cat = (s.category || '').toUpperCase();
    if (cat === 'LITTERAIRE' || cat === 'LANGUE') return true;
    const n = (s.name || '').toUpperCase();
    const c = (s.code || '').toUpperCase();
    return (
      n.includes('FRANCAIS') ||
      n.includes('FRANÇAIS') ||
      n.includes('LECTURE') ||
      n.includes('COMMUNICATION') ||
      n.includes('HIST') ||
      n.includes('GEO') ||
      n.includes('ANGLAIS') ||
      c.includes('ANG') ||
      n.includes('PHILO') ||
      n.includes('LITTERATURE') ||
      n.includes('REDACTION') ||
      n.includes('EXPRESSION') ||
      n.includes('ESPAGNOL') ||
      n.includes('ALLEMAND')
    );
  };

  const isCollege = classOrStudent
    ? getClassSection(classOrStudent) === 'COLLEGE'
    : results.some(r => r.subject.level === 'COLLEGE') &&
      !results.some(r => r.subject.level === 'LYCEE' && (r.subject.code === 'PHIL' || r.subject.code === 'CPT'));

  const orderedResults = isCollege
    ? results
        .map((res, idx) => ({ res, idx, rank: getCollegeSubjectSortOrder(res.subject) }))
        .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.idx - b.idx))
        .map(entry => entry.res)
    : results;

  const scientific: SubjectResult[] = [];
  const literary: SubjectResult[] = [];
  const others: SubjectResult[] = [];

  orderedResults.forEach(res => {
    if (isScientific(res.subject)) {
      scientific.push(res);
    } else if (isLiterary(res.subject)) {
      literary.push(res);
    } else {
      others.push(res);
    }
  });

  const computeGroup = (
    name: string,
    categoryKey: 'SCIENTIFIQUE' | 'LITTERAIRE' | 'AUTRES',
    items: SubjectResult[]
  ): SubjectGroup => {
    const totalCoeff = items.reduce((sum, item) => sum + item.coefficient, 0);
    const totalWeightedPoints = items.reduce((sum, item) => sum + item.weightedAverage, 0);
    const groupAverage = totalCoeff > 0 ? totalWeightedPoints / totalCoeff : 0;
    return {
      name,
      categoryKey,
      items,
      totalCoeff,
      totalWeightedPoints,
      groupAverage
    };
  };

  const groups: SubjectGroup[] = [];
  if (isCollege) {
    if (literary.length > 0) {
      groups.push(computeGroup('Matières Littéraires', 'LITTERAIRE', literary));
    }
    if (scientific.length > 0) {
      groups.push(computeGroup('Matières Scientifiques', 'SCIENTIFIQUE', scientific));
    }
    if (others.length > 0) {
      groups.push(computeGroup('Autres Matières...', 'AUTRES', others));
    }
  } else {
    if (scientific.length > 0) {
      groups.push(computeGroup('Matières Scientifiques', 'SCIENTIFIQUE', scientific));
    }
    if (literary.length > 0) {
      groups.push(computeGroup('Matières Littéraires', 'LITTERAIRE', literary));
    }
    if (others.length > 0) {
      groups.push(computeGroup('Autres Matières...', 'AUTRES', others));
    }
  }

  // Fallback if no category matched
  if (groups.length === 0 && orderedResults.length > 0) {
    groups.push(computeGroup('Toutes Matières', 'AUTRES', orderedResults));
  }

  return groups;
}

/**
 * Next grade level promotion name (e.g. 6ème -> 5ème)
 */
export function getNextClassName(currentClassName: string = ''): string {
  const norm = currentClassName.trim().toLowerCase();
  if (norm.includes('6ème') || norm.includes('6eme') || norm.includes('6e')) return '5ème';
  if (norm.includes('5ème') || norm.includes('5eme') || norm.includes('5e')) return '4ème';
  if (norm.includes('4ème') || norm.includes('4eme') || norm.includes('4e')) return '3ème';
  if (norm.includes('3ème') || norm.includes('3eme') || norm.includes('3e')) return 'Seconde';
  if (norm.includes('2nde') || norm.includes('seconde')) return 'Première';
  if (norm.includes('1ère') || norm.includes('premiere') || norm.includes('1ere')) return 'Terminale';
  if (norm.includes('ci')) return 'CP';
  if (norm.includes('cp')) return 'CE1';
  if (norm.includes('ce1')) return 'CE2';
  if (norm.includes('ce2')) return 'CM1';
  if (norm.includes('cm1')) return 'CM2';
  if (norm.includes('cm2')) return '6ème';
  return 'classe supérieure';
}

/**
 * Council decisions according to Benin academic norms:
 * Mentions:
 * - FELICITATIONS (>= 16)
 * - ENCOURAGEMENTS (>= 14 and < 16)
 * - TABLEAU D'HONNEUR (>= 12 and < 14)
 * - AVERTISSEMENT (>= 8.5 and < 10)
 * - BLAME (< 8.5)
 * - RENVOI (severe infraction or exclusion)
 */
export function getCouncilDecisionMentions(
  overallAverage: number,
  trimester: number = 3,
  className: string = '',
  isExcluded: boolean = false
) {
  const felicitations = overallAverage >= 16;
  const encouragements = overallAverage >= 14 && overallAverage < 16;
  const tableauHonneur = overallAverage >= 12 && overallAverage < 14;
  const avertissement = overallAverage >= 8.5 && overallAverage < 10;
  const blame = overallAverage > 0 && overallAverage < 8.5 && !isExcluded;
  const renvoi = isExcluded;

  let appreciationDirecteur = 'Passable';
  if (overallAverage >= 16) appreciationDirecteur = 'Excellent travail';
  else if (overallAverage >= 14) appreciationDirecteur = 'Très satisfaisant';
  else if (overallAverage >= 12) appreciationDirecteur = 'Satisfaisant';
  else if (overallAverage >= 10) appreciationDirecteur = 'Passable';
  else if (overallAverage >= 8.5) appreciationDirecteur = 'Insuffisant, doit progresser';
  else if (overallAverage > 0) appreciationDirecteur = 'Travail très insuffisant';
  else appreciationDirecteur = 'Non évalué';

  let decision = 'Admis(e)';
  const nextClass = getNextClassName(className);
  if (trimester === 3) {
    if (overallAverage >= 10) {
      decision = `Passe en ${nextClass}`;
    } else if (overallAverage > 0) {
      decision = 'Redouble';
    } else {
      decision = 'En attente';
    }
  } else {
    if (overallAverage >= 12) {
      decision = 'Bon travail, continuer ainsi';
    } else if (overallAverage >= 10) {
      decision = 'Poursuivre les efforts';
    } else if (overallAverage > 0) {
      decision = 'Efforts soutenus requis';
    } else {
      decision = 'En attente';
    }
  }

  return {
    felicitations,
    encouragements,
    tableauHonneur,
    avertissement,
    blame,
    renvoi,
    appreciationDirecteur,
    decision
  };
}

/**
 * Fusionne la décision automatique du conseil des professeurs avec les cases
 * cochées ou modifiées manuellement sur le bulletin pour ce trimestre.
 */
export function mergeCouncilDecision(
  autoDecision: CouncilDecisionData,
  student?: Student | null,
  trimester: number = 1
): CouncilDecisionData {
  const override = student?.bulletinCouncilDecisions?.[trimester];
  if (!override) return autoDecision;
  return {
    ...autoDecision,
    ...override
  };
}

function resolveInterroSlots(interros: Grade[]): { int1?: Grade; int2?: Grade } {
  const isMarkedInt1 = (g: Grade) => {
    const c = (g.comment || '').toLowerCase();
    return g.evaluationNumber === 1 || c.includes('interro 1') || c.includes('int 1') || c.includes('interro n°1');
  };
  const isMarkedInt2 = (g: Grade) => {
    const c = (g.comment || '').toLowerCase();
    return g.evaluationNumber === 2 || c.includes('interro 2') || c.includes('int 2') || c.includes('interro n°2');
  };

  const explicitInt1 = interros.find(g => g.evaluationNumber === 1) || interros.find(isMarkedInt1);
  const explicitInt2 = interros.find(g => g.evaluationNumber === 2) || interros.find(g => isMarkedInt2(g) && g !== explicitInt1);

  const int1 = explicitInt1 || interros.find(g => g !== explicitInt2 && !isMarkedInt2(g));
  const int2 = explicitInt2 || interros.find(g => g !== int1 && !isMarkedInt1(g));

  return { int1, int2 };
}

export type BulletinGradeSlot = 'INT1' | 'INT2' | 'DEVOIR' | 'COMPO';

/**
 * Met à jour, ajoute ou supprime une note directement depuis une cellule du bulletin
 * (Int 1, Int 2, DEVOIR, COMPO) en cohérence exacte avec calculateSubjectAverage.
 */
export function applyInlineBulletinGrade(params: {
  slot: BulletinGradeSlot;
  newMark: number | null;
  student: Student;
  subject: Subject;
  subjectGrades: Grade[];
  classId: string;
  className: string;
  trimester: 1 | 2 | 3;
  addGrade: (grd: Omit<Grade, 'id'>) => void;
  updateGrade: (id: string, grd: Partial<Grade>) => void;
  deleteGrade: (id: string) => void;
}) {
  const {
    slot,
    newMark,
    student,
    subject,
    subjectGrades,
    classId,
    className,
    trimester,
    addGrade,
    updateGrade,
    deleteGrade
  } = params;

  const isInterro = (t: string) => {
    const u = (t || '').toUpperCase().trim();
    return u === 'INTERRO' || u === 'TP' || u.startsWith('INTERRO') || u.startsWith('TEST') || u.startsWith('EVAL') || u.startsWith('INT');
  };
  const isDevoir = (t: string) => {
    const u = (t || '').toUpperCase().trim();
    return u === 'DEVOIR' || u.startsWith('DEVOIR') || u === 'DS' || u.startsWith('DS');
  };
  const isCompo = (t: string) => {
    const u = (t || '').toUpperCase().trim();
    return u === 'COMPOSITION' || u.startsWith('COMPO') || u === 'EXAMEN' || u.startsWith('EXAM');
  };

  const today = new Date().toISOString().split('T')[0];
  const effectiveCoeff = getEffectiveSubjectCoefficient(subject, {
    id: classId,
    name: className,
    level: student.level
  });

  if (slot === 'INT1' || slot === 'INT2') {
    const interros = subjectGrades
      .filter(g => isInterro(g.examType))
      .sort((a, b) => {
        if (a.evaluationNumber && b.evaluationNumber) return a.evaluationNumber - b.evaluationNumber;
        if (a.evaluationNumber === 1) return -1;
        if (b.evaluationNumber === 1) return 1;
        return (a.date || '').localeCompare(b.date || '');
      });

    const { int1, int2 } = resolveInterroSlots(interros);

    const target = slot === 'INT1' ? int1 : int2;
    const evalNum = slot === 'INT1' ? 1 : 2;

    if (newMark === null) {
      if (target) deleteGrade(target.id);
      return;
    }

    if (target) {
      updateGrade(target.id, { mark: newMark, maxMark: 20, evaluationNumber: evalNum, coefficient: effectiveCoeff });
    } else {
      addGrade({
        studentId: student.id,
        subjectId: subject.id,
        subjectName: subject.name,
        classId,
        className,
        trimester,
        examType: 'INTERRO',
        evaluationNumber: evalNum,
        mark: newMark,
        maxMark: 20,
        date: today,
        coefficient: effectiveCoeff,
        comment: `[Interro ${evalNum}]`
      });
    }
    return;
  }

  if (slot === 'DEVOIR') {
    const devoirs = subjectGrades.filter(g => isDevoir(g.examType));
    if (newMark === null) {
      devoirs.forEach(d => deleteGrade(d.id));
      return;
    }
    if (devoirs.length > 0) {
      updateGrade(devoirs[0].id, { mark: newMark, maxMark: 20, coefficient: effectiveCoeff });
      devoirs.slice(1).forEach(extra => deleteGrade(extra.id));
    } else {
      addGrade({
        studentId: student.id,
        subjectId: subject.id,
        subjectName: subject.name,
        classId,
        className,
        trimester,
        examType: 'DEVOIR',
        mark: newMark,
        maxMark: 20,
        date: today,
        coefficient: effectiveCoeff,
        comment: '[Devoir]'
      });
    }
    return;
  }

  // COMPO
  const compos = subjectGrades.filter(g => isCompo(g.examType));
  if (newMark === null) {
    compos.forEach(c => deleteGrade(c.id));
    return;
  }
  if (compos.length > 0) {
    updateGrade(compos[0].id, { mark: newMark, maxMark: 20, coefficient: effectiveCoeff });
    compos.slice(1).forEach(extra => deleteGrade(extra.id));
  } else {
    addGrade({
      studentId: student.id,
      subjectId: subject.id,
      subjectName: subject.name,
      classId,
      className,
      trimester,
      examType: 'COMPOSITION',
      mark: newMark,
      maxMark: 20,
      date: today,
      coefficient: effectiveCoeff,
      comment: '[Composition]'
    });
  }
}



