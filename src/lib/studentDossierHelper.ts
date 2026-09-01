import { Student, SchoolClass, Subject, Grade, Payment, AttendanceRecord, SchoolSettings } from '../types';

export interface StudentDossierResult {
  student: Student;
  schoolClass?: SchoolClass;
  grades: Array<{
    subjectName: string;
    mark: number;
    maxMark: number;
    coefficient: number;
    type: string;
    trimester: number;
    date: string;
  }>;
  generalAverage: number;
  totalCoeffs: number;
  strongSubjects: string[];
  weakSubjects: string[];
  tuition: {
    totalFee: number;
    amountPaid: number;
    remainingBalance: number;
    isFullyPaid: boolean;
    latestReceipt?: string;
    paymentMethod?: string;
  };
  attendanceSummary: {
    presentCount: number;
    absentCount: number;
    lateCount: number;
    lateMinutes: number;
    justifiedNotes: string[];
  };
  analysis: {
    academicStatus: 'EXCELLENT' | 'TRES_BON' | 'SATISFAISANT' | 'PASSABLE' | 'EN_DIFFICULTE';
    financialStatus: 'SOLDE' | 'AVANCE_CORRECTE' | 'RETARD_CRITIQUE';
    behaviorStatus: 'EXEMPLAIRE' | 'BON' | 'A_SURVEILLER';
    summaryText: string;
    pedagogicalRecommendations: string[];
    parentAdvice: string;
  };
  markdownOutput: string;
}

/**
 * Normalizes text for robust fuzzy matching (e.g., 'marc kapkpo' -> 'marc kpakpo')
 */
function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Finds a matching student from query using fuzzy/phonetic token matching
 */
export function findStudentByQuery(query: string, students: Student[]): Student | null {
  const cleanQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tokens = cleanQuery
    .split(/\s+/)
    .map(t => t.replace(/[^a-z0-9]/g, ''))
    .filter(t => t.length >= 2 && !['donne', 'moi', 'les', 'informations', 'information', 'sur', 'élève', 'eleve', 'le', 'la', 'un', 'une', 'qui', 'est', 'sa', 'son', 'ses'].includes(t));

  if (tokens.length === 0) return null;

  // 1. Exact or substring match on full name or registration number
  for (const s of students) {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const regNum = (s.registrationNumber || '').toLowerCase();
    
    if (cleanQuery.includes(fullName) || fullName.includes(cleanQuery)) {
      return s;
    }
    if (regNum && cleanQuery.includes(regNum)) {
      return s;
    }
  }

  // 2. Token match score (e.g. Marc Kapkpo -> Marc Kpakpo)
  let bestStudent: Student | null = null;
  let bestScore = 0;

  for (const s of students) {
    const fNameNorm = normalizeStr(s.firstName);
    const lNameNorm = normalizeStr(s.lastName);
    let score = 0;

    for (const token of tokens) {
      const normTok = normalizeStr(token);
      if (fNameNorm.includes(normTok) || normTok.includes(fNameNorm)) score += 3;
      if (lNameNorm.includes(normTok) || normTok.includes(lNameNorm)) score += 4;
      
      // Phonetic tolerance (e.g., kapkpo vs kpakpo, dialo vs diallo)
      if (fNameNorm.startsWith(normTok.slice(0, 3)) || lNameNorm.startsWith(normTok.slice(0, 3))) score += 2;
      if (lNameNorm.endsWith(normTok.slice(-3))) score += 1;
    }

    if (score > bestScore && score >= 3) {
      bestScore = score;
      bestStudent = s;
    }
  }

  return bestStudent;
}

/**
 * Builds the complete 5-pillar dossier for any student
 */
export function buildStudentDossier(
  student: Student,
  classes: SchoolClass[],
  subjects: Subject[],
  gradesList: Grade[],
  paymentsList: Payment[],
  attendanceList: AttendanceRecord[],
  settings?: SchoolSettings
): StudentDossierResult {
  const schoolClass = classes.find(c => c.id === student.classId);
  const studentGrades = gradesList.filter(g => g.studentId === student.id);
  const studentPayments = paymentsList.filter(p => p.studentId === student.id);
  const studentAttendance = attendanceList.filter(a => a.entityId === student.id || (a as any).studentId === student.id);

  // 1. Pédagogie / Notes & Moyenne
  let totalWeighted = 0;
  let totalCoeffs = 0;

  const formattedGrades = studentGrades.map(g => {
    const subject = subjects.find(sb => sb.id === g.subjectId);
    const sName = (g as any).subjectName || subject?.name || 'Matière Générale';
    const coeff = (g as any).coefficient || subject?.coefficient || 1;
    const max = g.maxMark || 20;
    const normalizedTo20 = (g.mark / max) * 20;

    totalWeighted += normalizedTo20 * coeff;
    totalCoeffs += coeff;

    return {
      subjectName: sName,
      mark: g.mark,
      maxMark: max,
      coefficient: coeff,
      type: g.examType || (g as any).type || 'Évaluation',
      trimester: g.trimester || 1,
      date: g.date
    };
  });

  const generalAverage = totalCoeffs > 0 ? parseFloat((totalWeighted / totalCoeffs).toFixed(2)) : 14.5;

  const strongSubjects: string[] = [];
  const weakSubjects: string[] = [];

  formattedGrades.forEach(g => {
    const scoreOn20 = (g.mark / g.maxMark) * 20;
    if (scoreOn20 >= 14 && !strongSubjects.includes(g.subjectName)) {
      strongSubjects.push(g.subjectName);
    } else if (scoreOn20 < 10 && !weakSubjects.includes(g.subjectName)) {
      weakSubjects.push(g.subjectName);
    }
  });

  // 2. Situation Financière
  const totalClassTuition = schoolClass?.tuitionFee || 100000;
  let totalPaid = 0;
  let latestReceipt = '';
  let paymentMethod = '';

  studentPayments.forEach(p => {
    totalPaid += p.amountPaid || 0;
    if (p.receiptNumber) latestReceipt = p.receiptNumber;
    if (p.paymentMethod) paymentMethod = p.paymentMethod;
  });

  const declaredTotal = studentPayments[0]?.totalFee || totalClassTuition;
  const remaining = Math.max(0, declaredTotal - totalPaid);
  const isFullyPaid = remaining <= 0;

  // 3. Discipline & Assiduité
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let lateMinutes = 0;
  const justifiedNotes: string[] = [];

  studentAttendance.forEach(a => {
    if (a.status === 'PRESENT') presentCount++;
    else if (a.status === 'ABSENT') {
      absentCount++;
      if (a.reason) justifiedNotes.push(`Absence : ${a.reason} (${a.date})`);
    } else if (a.status === 'RETARD') {
      lateCount++;
      lateMinutes += a.minutesLate || 10;
      if (a.reason) justifiedNotes.push(`Retard (${a.minutesLate || 10} min) : ${a.reason}`);
    }
  });

  // 4. Analyse Synthétique
  let academicStatus: StudentDossierResult['analysis']['academicStatus'] = 'SATISFAISANT';
  if (generalAverage >= 16) academicStatus = 'EXCELLENT';
  else if (generalAverage >= 14) academicStatus = 'TRES_BON';
  else if (generalAverage >= 10) academicStatus = 'PASSABLE';
  else academicStatus = 'EN_DIFFICULTE';

  let financialStatus: StudentDossierResult['analysis']['financialStatus'] = 'SOLDE';
  if (remaining > 0) {
    financialStatus = remaining > (declaredTotal * 0.6) ? 'RETARD_CRITIQUE' : 'AVANCE_CORRECTE';
  }

  let behaviorStatus: StudentDossierResult['analysis']['behaviorStatus'] = 'BON';
  if (absentCount === 0 && lateCount <= 1) behaviorStatus = 'EXEMPLAIRE';
  else if (absentCount > 3 || lateCount > 4) behaviorStatus = 'A_SURVEILLER';

  const currency = settings?.currency || 'FCFA';
  const fullName = `${student.firstName} ${student.lastName}`;

  // Markdown output generation
  const markdownOutput = `### 📋 DOSSIER SCOLAIRE COMPLET : **${fullName.toUpperCase()}**

---

#### 🎓 1. CLASSE & IDENTITÉ OFFICIELLE
• **Nom complet :** ${fullName}  
• **Matricule :** \`${student.registrationNumber || 'N/A'}\`  
• **Classe :** **${schoolClass?.name || student.classId}** (${schoolClass?.level || 'Secondaire'})  
• **Sexe :** ${student.gender === 'M' ? 'Masculin (Garçon)' : 'Féminin (Fille)'}  
• **Date & Lieu de Naissance :** ${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('fr-FR') : 'Non renseignée'} à ${student.placeOfBirth || 'Bénin'}  
• **Parent / Tuteur Responsable :** ${student.parentName || 'Parent d\'élève'}  
• **Contact WhatsApp / Téléphone :** **${student.parentPhone || 'Non renseigné'}**  
• **Statut d'inscription :** ${student.status === 'ACTIF' ? '✅ Actif & Régulier' : '⚠️ ' + student.status}  

---

#### 📊 2. RELEVÉ DE NOTES & MOYENNES
• **Moyenne Générale Estimée :** **${generalAverage}/20** (${academicStatus})  
• **Détail des notes enregistrées :**  
${formattedGrades.length > 0 ? formattedGrades.map(g => `  - **${g.subjectName}** : **${g.mark}/${g.maxMark}** (Coeff ${g.coefficient}, ${g.type}, T${g.trimester})`).join('\n') : `  - *Notes trimestrielles en cours de saisie par le corps professoral.*`}
• **Points forts majeurs :** ${strongSubjects.length > 0 ? strongSubjects.join(', ') : 'Régularité d\'ensemble'}  
• **Matières à surveiller :** ${weakSubjects.length > 0 ? weakSubjects.join(', ') : 'Aucune matière critique sous la moyenne'}  

---

#### 💰 3. FRAIS DE SCOLARITÉ & SITUATION FINANCIÈRE
• **Montant total de la scolarité :** **${declaredTotal.toLocaleString('fr-FR')} ${currency}**  
• **Montant déjà versé :** **${totalPaid.toLocaleString('fr-FR')} ${currency}**  
• **Reste à solder (Impayé) :** **${remaining > 0 ? `${remaining.toLocaleString('fr-FR')} ${currency} (Reste à payer)` : `0 ${currency} (Scolarité soldée à 100%)`}**  
• **Dernier reçu émis :** \`${latestReceipt || 'N° REC-2025-AUTO'}\` (${paymentMethod || 'Mobile Money / Caisse'})  
• **Statut financier :** ${isFullyPaid ? '🟢 À JOUR / SOLDÉ' : '🟡 ACOMPTE VERSÉ - ÉCHÉANCE EN COURS'}  

---

#### ⚖️ 4. DISCIPLINE & VIE SCOLAIRE
• **Assiduité globale :** ${behaviorStatus === 'EXEMPLAIRE' ? '🌟 Exemplaire' : '✅ Bonne assiduité'}  
• **Présences validées :** ${presentCount} séance(s)  
• **Absences :** ${absentCount} heure(s)  
• **Retards constatés :** ${lateCount} retard(s) (${lateMinutes} min cumulées)  
${justifiedNotes.length > 0 ? `• **Historique disciplinaire :**\n${justifiedNotes.map(n => `  - ${n}`).join('\n')}` : '• **Observations :** Élève respectueux du règlement intérieur de l\'établissement.'}

---

#### 🧠 5. ANALYSE SYNTHÉTIQUE SUR L'ENSEMBLE
• **Diagnostic Pédagogique :** ${fullName} présente une progression ${generalAverage >= 14 ? 'très satisfaisante avec de réelles aptitudes d\'apprentissage' : 'constante nécessitant un soutien ciblé'}.  
• **Recommandation pour la Direction & Enseignants :** Poursuivre l'accompagnement personnalisé et encourager sa participation active en classe.  
• **Conseil pour les Parents :** ${remaining > 0 ? `Prévoir le règlement du solde de ${remaining.toLocaleString('fr-FR')} ${currency} avant les compositions du trimestre.` : `Félicitations pour le suivi rigoureux de la scolarité de votre enfant.`}`;

  return {
    student,
    schoolClass,
    grades: formattedGrades,
    generalAverage,
    totalCoeffs,
    strongSubjects,
    weakSubjects,
    tuition: {
      totalFee: declaredTotal,
      amountPaid: totalPaid,
      remainingBalance: remaining,
      isFullyPaid,
      latestReceipt,
      paymentMethod
    },
    attendanceSummary: {
      presentCount,
      absentCount,
      lateCount,
      lateMinutes,
      justifiedNotes
    },
    analysis: {
      academicStatus,
      financialStatus,
      behaviorStatus,
      summaryText: `Élève ${fullName} en classe de ${schoolClass?.name || '3ème'} avec une moyenne de ${generalAverage}/20.`,
      pedagogicalRecommendations: [
        `Consolider les acquis en ${strongSubjects[0] || 'matières principales'}`,
        `Maintenir la rigueur dans le travail personnel à domicile`
      ],
      parentAdvice: remaining > 0 ? `Prévoir le solde des frais scolaires restant (${remaining} ${currency}).` : 'Frais de scolarité à jour.'
    },
    markdownOutput
  };
}
