import { Student, Grade, Subject, BulletinTemplate } from '../types';

export interface SubjectResult {
  subject: Subject;
  grades: Grade[];
  interroAverage?: number;
  devoirMark?: number;
  compoMark?: number;
  average: number;
  weightedAverage: number;
  coefficient: number;
  subjectRank?: string;
  appreciation: string;
}

export interface StudentRankResult {
  student: Student;
  subjectResults: SubjectResult[];
  totalCoefficients: number;
  totalWeightedPoints: number;
  overallAverage: number;
  rank: string; // e.g., "1er", "2ème", "3ème ex-aequo", "12ème"
  numericRank: number; // 1, 2, 3...
  mention: string; // "TABLEAU D'HONNEUR", "ENCOURAGEMENTS", "ADMIS", "RATTRAPAGE", etc.
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
      showDevoirMark: true,
      showCompoMark: true,
      showCoefficients: true,
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

export function calculateSubjectAverage(
  subject: Subject,
  studentGrades: Grade[],
  bulletinTemplate?: BulletinTemplate
): SubjectResult {
  const template = bulletinTemplate || defaultBulletinTemplate();
  const coeff = subject.coefficient || 1;

  if (!studentGrades || studentGrades.length === 0) {
    return {
      subject,
      grades: [],
      average: 0,
      weightedAverage: 0,
      coefficient: coeff,
      appreciation: 'Pas de note'
    };
  }

  let finalAverage = 0;

  if (template.calculationFormula === 'INTERRO_DEVOIR_COMPO') {
    const interros = studentGrades.filter(g => g.examType === 'INTERRO' || g.examType === 'TP');
    const devoirs = studentGrades.filter(g => g.examType === 'DEVOIR');
    const compos = studentGrades.filter(g => g.examType === 'COMPOSITION');

    const interroAvg = interros.length > 0
      ? interros.reduce((sum, g) => sum + g.mark, 0) / interros.length
      : undefined;

    const devoirAvg = devoirs.length > 0
      ? devoirs.reduce((sum, g) => sum + g.mark, 0) / devoirs.length
      : undefined;

    const compoAvg = compos.length > 0
      ? compos.reduce((sum, g) => sum + g.mark, 0) / compos.length
      : undefined;

    // Formula: (InterroAvg + Devoir + Compo * 2) / 4 or available parts
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
      sumPoints += compoAvg * 2;
      totalParts += 2;
    }

    finalAverage = totalParts > 0 ? sumPoints / totalParts : 0;

    return {
      subject,
      grades: studentGrades,
      interroAverage: interroAvg,
      devoirMark: devoirAvg,
      compoMark: compoAvg,
      average: finalAverage,
      weightedAverage: finalAverage * coeff,
      coefficient: coeff,
      appreciation: getSubjectAppreciation(finalAverage)
    };
  }

  // Standard Weighted / Simple Average
  const totalWeighted = studentGrades.reduce((sum, g) => sum + (g.mark * (g.coefficient || 1)), 0);
  const totalCoeffs = studentGrades.reduce((sum, g) => sum + (g.coefficient || 1), 0) || 1;
  finalAverage = totalWeighted / totalCoeffs;

  return {
    subject,
    grades: studentGrades,
    average: finalAverage,
    weightedAverage: finalAverage * coeff,
    coefficient: coeff,
    appreciation: getSubjectAppreciation(finalAverage)
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
  bulletinTemplate?: BulletinTemplate
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

  // Determine target level of the class
  const targetLevel = students[0]?.level || 'COLLEGE';

  // Filter subjects relevant to this class/level
  const relevantSubjects = subjects.filter(sbj => {
    if (sbj.level && sbj.level === targetLevel) return true;
    const hasGradeInClass = grades.some(g =>
      g.subjectId === sbj.id &&
      g.trimester === trimester &&
      students.some(s => s.id === g.studentId)
    );
    if (hasGradeInClass) return true;
    return !sbj.level;
  });

  const activeSubjects = relevantSubjects.length > 0 ? relevantSubjects : subjects;

  // 1. Calculate for each student
  const rawResults = students.map(student => {
    const studentGrades = grades.filter(g => g.studentId === student.id && g.trimester === trimester);
    
    // Evaluate for each subject relevant to student
    const subjectResults = activeSubjects.map(sbj => {
      const sbjGrades = studentGrades.filter(g => g.subjectId === sbj.id);
      
      // Check if ANY student in the class has a grade for this subject
      const classHasGradesForSbj = grades.some(g => 
        g.subjectId === sbj.id && 
        g.trimester === trimester && 
        students.some(s => s.id === g.studentId)
      );

      const res = calculateSubjectAverage(sbj, sbjGrades, tmpl);
      
      // If no grades exist for this student AND no student in the class has grades for this subject, zero out coefficient
      if (sbjGrades.length === 0 && !classHasGradesForSbj) {
        return {
          ...res,
          coefficient: 0,
          weightedAverage: 0
        };
      }

      return res;
    }).filter(sr => sr.coefficient > 0 || sr.grades.length > 0);

    const totalCoeffs = subjectResults.reduce((sum, sr) => sum + sr.coefficient, 0) || 1;
    const totalWeightedPoints = subjectResults.reduce((sum, sr) => sum + sr.weightedAverage, 0);
    const overallAverage = subjectResults.length > 0 ? totalWeightedPoints / totalCoeffs : 0;

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
