import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { PrintBulletinModal } from '../components/modals/PrintBulletinModal';
import { SendBulletinParentModal } from '../components/modals/SendBulletinParentModal';
import { ParentExamPapersTab } from '../components/ParentExamPapersTab';
import {
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Printer,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Clock,
  User,
  AlertCircle,
  Star,
  FileText,
  Brain,
  ThumbsUp,
  Flame,
  ChevronRight,
  MessageCircle,
  School as SchoolIcon
} from 'lucide-react';

export const StudentPortalView: React.FC = () => {
  const {
    students,
    classes,
    grades,
    subjects,
    attendance,
    homework,
    exams,
    settings,
    currentSchool,
    currentUser,
    examPapers
  } = useApp();

  // Selected Trimester state (default to settings currentTrimester or 1)
  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(settings.currentTrimester || 1);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Determine current student (link from currentUser or first student)
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    currentUser.studentId || students[0]?.id || ''
  );

  const student = students.find(s => s.id === selectedStudentId) || students[0];
  const classObj = classes.find(c => c.id === student?.classId) || classes[0];

  if (!student) {
    return (
      <div className="p-8 text-center text-slate-500">
        <AlertCircle className="h-10 w-10 mx-auto text-amber-500 mb-2" />
        <p className="font-bold">Aucun élève trouvé dans l'établissement actuellement.</p>
      </div>
    );
  }

  // Filter grades for this student and trimester
  const studentGrades = grades.filter(
    g => g.studentId === student.id && g.trimester === selectedTrimester
  );

  // Filter attendance records for this student
  const studentAttendance = attendance.filter(a => a.entityId === student.id);
  const totalAbsences = studentAttendance.filter(a => a.status === 'ABSENT').length;
  const totalRetards = studentAttendance.filter(a => a.status === 'RETARD').length;

  // Group grades by subject to compute averages
  const subjectBreakdown = subjects.map(sbj => {
    const sbjGrades = studentGrades.filter(g => g.subjectId === sbj.id);
    if (sbjGrades.length === 0) return null;

    const avg = sbjGrades.reduce((acc, g) => acc + g.mark, 0) / sbjGrades.length;
    const weightedAvg = avg * sbj.coefficient;

    return {
      subject: sbj,
      grades: sbjGrades,
      average: avg,
      weightedAverage: weightedAvg
    };
  }).filter(Boolean) as Array<{
    subject: typeof subjects[0];
    grades: typeof grades;
    average: number;
    weightedAverage: number;
  }>;

  const totalCoefficients = subjectBreakdown.reduce((acc, item) => acc + item.subject.coefficient, 0) || 1;
  const totalWeightedMarks = subjectBreakdown.reduce((acc, item) => acc + item.weightedAverage, 0);
  const overallAverage = subjectBreakdown.length > 0 ? totalWeightedMarks / totalCoefficients : 0;

  // Class students for rank simulation
  const classStudents = students.filter(s => s.classId === classObj?.id);
  const classAverages = classStudents.map(s => {
    const sGrades = grades.filter(g => g.studentId === s.id && g.trimester === selectedTrimester);
    if (sGrades.length === 0) return { studentId: s.id, avg: 0 };
    let weightedSum = 0;
    let coeffSum = 0;
    subjects.forEach(sbj => {
      const sbjG = sGrades.filter(g => g.subjectId === sbj.id);
      if (sbjG.length > 0) {
        const avg = sbjG.reduce((acc, g) => acc + g.mark, 0) / sbjG.length;
        weightedSum += avg * sbj.coefficient;
        coeffSum += sbj.coefficient;
      }
    });
    return { studentId: s.id, avg: coeffSum > 0 ? weightedSum / coeffSum : 0 };
  }).sort((a, b) => b.avg - a.avg);

  const rank = classAverages.findIndex(item => item.studentId === student.id) + 1 || 1;

  // Homework & exams for student's class
  const classHomework = homework.filter(h => h.classId === classObj?.id);
  const classExams = exams.filter(e => e.classId === classObj?.id);

  // Discipline observation generator based on attendance and status
  const getDisciplineStatus = () => {
    if (totalAbsences === 0 && totalRetards === 0) {
      return {
        tag: "CONDUITE EXEMPLAIRE",
        badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800",
        observation: "L'élève fait preuve d'un comportement irréprochable et d'une ponctualité exemplaire. Respect parfait des règles de l'établissement et des enseignants. Esprit d'entraide salué par l'ensemble de l'équipe pédagogique.",
        score: "20 / 20"
      };
    } else if (totalAbsences <= 2) {
      return {
        tag: "BONNE CONDUITE",
        badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800",
        observation: "Attitude générale satisfaisante. Élève respectueux et assidu. Quelques rares retards ou absences justifiées auprès de la vie scolaire.",
        score: "17 / 20"
      };
    } else {
      return {
        tag: "AVERTISSEMENT DISCIPLINE",
        badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800",
        observation: "Attention portée aux absences et aux retards répétés. Un effort de régularité et de ponctualité est instamment demandé pour le trimestre à venir.",
        score: "12 / 20"
      };
    }
  };

  // Academic level observation generator based on average
  const getAcademicLevelObservation = () => {
    if (overallAverage >= 16) {
      return {
        levelTag: "EXCELLENT NIVEAU - RANG D'ÉLITE",
        badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300",
        mention: "TABLEAU D'HONNEUR AVEC FÉLICITATIONS",
        appreciation: "Trimestre remarquable ! Élève hautement méthodique, autonome et rigoureux. Excellente maîtrise des disciplines scientifiques et littéraires. Le Conseil de Classe adresse ses félicitations les plus chaleureuses.",
        strengths: [
          "Mise en œuvre brillante des démarches de résolution de problèmes",
          "Esprit d'analyse aiguisé et rigueur de rédaction",
          "Excellente participation orale et leadership positif"
        ],
        improvements: [
          "Continuer d'alimenter la culture générale par des lectures personnelles",
          "Maintenir la constante exigence de soin dans les productions écrites"
        ]
      };
    } else if (overallAverage >= 14) {
      return {
        levelTag: "TRÈS BON NIVEAU ACADÉMIQUE",
        badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300",
        mention: "TABLEAU D'HONNEUR",
        appreciation: "Très bon trimestre. Les résultats sont solides et réguliers. Élève sérieux, appliqué et à l'écoute des conseils. Bravo pour cet engagement constant.",
        strengths: [
          "Bonne assimilation des cours et régularité dans l'apprentissage",
          "Travail d'équipe structuré et respect des consignes"
        ],
        improvements: [
          "Gagner en rapidité lors des épreuves de synthèse",
          "Approfondir le vocabulaire technique dans les matières scientifiques"
        ]
      };
    } else if (overallAverage >= 10) {
      return {
        levelTag: "NIVEAU SATISFAISANT",
        badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300",
        mention: "ENCOURAGEMENTS DU CONSEIL",
        appreciation: "Ensemble satisfaisant. L'élève possède les compétences requises mais peut prétendre à de bien meilleurs résultats avec davantage de rigueur personnelle.",
        strengths: [
          "Participation attentive et esprit curieux en classe",
          "Bonne entente avec le groupe d'élèves"
        ],
        improvements: [
          "Intensifier le travail personnel quotidien à la maison",
          "Éviter les erreurs d'inattention lors des devoirs sur table"
        ]
      };
    } else {
      return {
        levelTag: "NIVEAU FRAGILE - ACCOMPAGNEMENT REQUIS",
        badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300",
        mention: "AVERTISSEMENT TRAVAIL",
        appreciation: "Résultats insuffisants. Un manque de travail personnel et d'assiduité fragilise la moyenne. Un plan de soutien personnalisé et un tutorat individuel doivent être rapidement mis en place.",
        strengths: [
          "Volonté manifeste de bien faire sur certaines épreuves"
        ],
        improvements: [
          "Participation obligatoire aux séances de soutien scolaire",
          "Réviser systématiquement les leçons dès le retour à la maison"
        ]
      };
    }
  };

  const disciplineInfo = getDisciplineStatus();
  const academicInfo = getAcademicLevelObservation();

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Banner / Student Identity Header */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex items-center space-x-4">
            <img
              src={student.photoUrl}
              alt={`${student.firstName} ${student.lastName}`}
              className="h-20 w-20 rounded-2xl object-cover ring-4 ring-emerald-400/30 shadow-lg bg-white shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950">
                  ESPACE ÉLÈVE OFFICIEL
                </span>
                <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
                  {currentSchool.name}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                Bonjour, {student.firstName} {student.lastName} !
              </h1>

              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-300">
                <span className="font-extrabold text-emerald-300 flex items-center space-x-1">
                  <GraduationCap className="h-4 w-4" />
                  <span>{classObj?.name || student.level}</span>
                </span>
                <span>•</span>
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded-md text-amber-300 font-bold">
                  Matricule : {student.registrationNumber}
                </span>
                <span>•</span>
                <span>Année : {settings.academicYear}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Quick Student Selector for Demo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {students.length > 1 && (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold outline-none cursor-pointer hover:bg-white/20 transition-all"
                title="Changer d'élève (Mode Test)"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id} className="text-slate-900">
                    {s.lastName} {s.firstName} ({s.registrationNumber})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowSendModal(true)}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 border border-white/20 shadow-lg transition-all cursor-pointer"
              title="Envoyer ou partager le lien du bulletin par WhatsApp ou SMS"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              <span>📲 Envoyer WhatsApp / SMS</span>
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer Bulletin Trimestre {selectedTrimester}</span>
            </button>
          </div>

        </div>

        {/* Quick Metric Cards Row inside Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          
          <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Moyenne Trimestre</span>
            <span className="text-xl font-black text-amber-300">
              {overallAverage.toFixed(2)} / 20
            </span>
            <p className="text-[10px] text-emerald-300 font-semibold truncate mt-0.5">
              {academicInfo.mention}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Rang en Classe</span>
            <span className="text-xl font-black text-white">
              {rank}<sup>{rank === 1 ? 'er' : 'ème'}</sup> <span className="text-xs text-slate-400 font-normal">/ {classStudents.length}</span>
            </span>
            <p className="text-[10px] text-slate-300 font-semibold mt-0.5">Élèves évalués</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Conduite & Discipline</span>
            <span className="text-sm font-black text-emerald-300 block mt-1 truncate">
              {disciplineInfo.tag}
            </span>
            <p className="text-[10px] text-slate-300 font-semibold mt-0.5">
              0 sanction • {totalAbsences} absence(s)
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Assiduité</span>
            <span className="text-xl font-black text-teal-300">
              {totalAbsences === 0 ? '100%' : '96%'}
            </span>
            <p className="text-[10px] text-slate-300 font-semibold mt-0.5">Présence effective</p>
          </div>

        </div>
      </div>

      {/* Trimester Navigation Bar */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-black uppercase text-slate-400 px-3 hidden sm:inline">
            Période d'Évaluation :
          </span>
          {([1, 2, 3] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTrimester(t)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                selectedTrimester === t
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Trimestre {t}</span>
              {settings.currentTrimester === t && (
                <span className="ml-1 px-1.5 py-0.2 text-[9px] rounded-full bg-emerald-500 text-white font-black">
                  Actuel
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowPrintModal(true)}
          className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
        >
          <FileText className="h-4 w-4" />
          <span>Bulletin Imprimable</span>
        </button>
      </div>

      {/* SECTION 1: Bulletin Trimestriel de l'Élève (Detailed Marks & Coefficients) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            {(currentSchool?.logoUrl || settings.logoUrl) ? (
              <img
                src={currentSchool?.logoUrl || settings.logoUrl}
                alt="Logo"
                className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 dark:border-slate-700 p-0.5 shrink-0 shadow-xs"
              />
            ) : (
              <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shrink-0">
                <BookOpen className="h-6 w-6" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Bulletin Trimestriel des Notes & Évaluations (Trimestre {selectedTrimester})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentSchool?.name || settings.schoolName} • Détail des notes obtenues par matière avec leurs coefficients officiels.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-black text-slate-400 block">MOYENNE GÉNÉRALE</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {overallAverage.toFixed(2)} <span className="text-xs font-normal text-slate-500">/ 20</span>
            </span>
          </div>
        </div>

        {/* Subject Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3.5 rounded-l-xl">Matière & Catégorie</th>
                <th className="p-3.5 text-center">Coeff</th>
                <th className="p-3.5 text-center">Notes Obtenues</th>
                <th className="p-3.5 text-center">Moyenne /20</th>
                <th className="p-3.5 text-center">Total Coeff.</th>
                <th className="p-3.5 rounded-r-xl">Appréciation par Enseignant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjectBreakdown.length > 0 ? (
                subjectBreakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    
                    {/* Subject */}
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                        <div>
                          <p className="text-xs font-black">{item.subject.name}</p>
                          <span className="text-[9px] font-bold uppercase text-slate-400">
                            {item.subject.category} • Code: {item.subject.code}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Coefficient */}
                    <td className="p-3.5 text-center font-black text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                        {item.subject.coefficient}
                      </span>
                    </td>

                    {/* Individual Grades */}
                    <td className="p-3.5 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {item.grades.map(g => (
                          <span
                            key={g.id}
                            className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-extrabold border ${
                              g.mark >= 14
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : g.mark >= 10
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                            }`}
                            title={`${g.examType} du ${g.date}`}
                          >
                            {g.mark}/20
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Average */}
                    <td className="p-3.5 text-center">
                      <span className={`text-sm font-black ${
                        item.average >= 14 ? 'text-emerald-600 dark:text-emerald-400' :
                        item.average >= 10 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.average.toFixed(2)}
                      </span>
                    </td>

                    {/* Weighted Average */}
                    <td className="p-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                      {item.weightedAverage.toFixed(2)}
                    </td>

                    {/* Appreciation */}
                    <td className="p-3.5 text-xs italic text-slate-600 dark:text-slate-300">
                      {item.average >= 16 ? "Bravo ! Résultat brillant, excellente régularité." :
                       item.average >= 14 ? "Très bon travail. Maîtrise solide du programme." :
                       item.average >= 10 ? "Résultats satisfaisants. Travail régulier." :
                       "Insuffisant. Nécessite plus de rigueur et d'exercices."}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                    Aucune note disponible pour le Trimestre {selectedTrimester}.
                  </td>
                </tr>
              )}
            </tbody>
            
            {/* Table Footer */}
            {subjectBreakdown.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white">
                  <td className="p-3.5 rounded-l-xl">BILAN GÉNÉRAL DU TRIMESTRE</td>
                  <td className="p-3.5 text-center">{totalCoefficients}</td>
                  <td className="p-3.5 text-center text-[10px] text-slate-500 uppercase font-black">
                    {subjectBreakdown.reduce((acc, i) => acc + i.grades.length, 0)} Notes enregistrées
                  </td>
                  <td className="p-3.5 text-center text-base text-emerald-600 dark:text-emerald-400 font-black">
                    {overallAverage.toFixed(2)} / 20
                  </td>
                  <td className="p-3.5 text-center">{totalWeightedMarks.toFixed(2)} pts</td>
                  <td className="p-3.5 rounded-r-xl">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${academicInfo.badgeColor}`}>
                      {academicInfo.mention}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </div>

      {/* SECTION 2: OBSERVATIONS GÉNÉRALES (Discipline et Niveau de l'Élève) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD A: Observation sur la Discipline & Assiduité */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  1. Discipline & Comportement
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bilan disciplinaire, ponctualité et assiduité en classe.
                </p>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-black border ${disciplineInfo.badgeColor}`}>
              {disciplineInfo.tag}
            </span>
          </div>

          {/* Discipline Stats Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-black text-slate-400 block">Jours Présents</span>
              <strong className="text-slate-900 dark:text-white font-black text-sm">42 / 42</strong>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-black text-slate-400 block">Retards</span>
              <strong className="text-emerald-600 font-black text-sm">{totalRetards} min</strong>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-black text-slate-400 block">Absences</span>
              <strong className="text-emerald-600 font-black text-sm">{totalAbsences} heure(s)</strong>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-black text-slate-400 block">Note Conduite</span>
              <strong className="text-blue-600 font-black text-sm">{disciplineInfo.score}</strong>
            </div>

          </div>

          {/* Written Discipline Observation Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-black text-emerald-900 dark:text-emerald-300">
              <ThumbsUp className="h-4 w-4 text-emerald-600" />
              <span>Observation du Conseiller Principal d'Éducation (CPE) & Professeur Principal</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
              « {disciplineInfo.observation} »
            </p>
          </div>

          {/* Behavioral Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center space-x-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Respect des enseignants</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center space-x-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Attitude positive en classe</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center space-x-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Tenue conforme & ponctuel</span>
            </span>
          </div>

        </div>

        {/* CARD B: Observation sur le Niveau de l'Élève & Appréciation Globale */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  2. Niveau Académique & Conseil de Classe
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Évaluation globale du niveau, forces et axes de progression.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300">
              {academicInfo.levelTag}
            </span>
          </div>

          {/* Overall Written Appreciation Box */}
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-black text-purple-900 dark:text-purple-300">
              <Award className="h-4 w-4 text-purple-600" />
              <span>Avis Officiel de la Direction Générale & Conseil de Classe</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
              « {academicInfo.appreciation} »
            </p>
          </div>

          {/* Strengths and Growth Areas Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            
            {/* Strengths */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center space-x-1.5 font-black text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
                <span>Points Forts Identifiés</span>
              </div>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                {academicInfo.strengths.map((str, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth areas */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center space-x-1.5 font-black text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-4 w-4" />
                <span>Axes de Progrès Recommandés</span>
              </div>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                {academicInfo.improvements.map((imp, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>

      </div>

      {/* SECTION 3: Homework & Exams Section (Devoirs & Évaluations) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Homework */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <span>Devoirs à Rendre & Cahier de Texte</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400">{classHomework.length} devoir(s)</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {classHomework.length > 0 ? (
              classHomework.map(hw => {
                const sbj = subjects.find(s => s.id === hw.subjectId);
                return (
                  <div key={hw.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between font-extrabold text-slate-900 dark:text-white">
                      <span>{hw.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        {sbj?.name || 'Matière'}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">{hw.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Donné le : {hw.assignedDate}</span>
                      <strong className="text-rose-600">À rendre le : {hw.dueDate}</strong>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 italic text-center py-4">Aucun devoir programmé actuellement.</p>
            )}
          </div>
        </div>

        {/* Exams */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Prochaines Compositions & Examens</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400">{classExams.length} examen(s)</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {classExams.length > 0 ? (
              classExams.map(ex => {
                const sbj = subjects.find(s => s.id === ex.subjectId);
                return (
                  <div key={ex.id} className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1">
                    <div className="flex items-center justify-between font-extrabold text-amber-950 dark:text-amber-300">
                      <span>{ex.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 font-bold">
                        Coeff {ex.coefficient}
                      </span>
                    </div>
                    <p className="text-amber-900/80 dark:text-amber-400 text-[11px]">
                      Matière : {sbj?.name} • Salle : {ex.room}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-amber-800 dark:text-amber-300 pt-1 font-bold">
                      <span>Date : {ex.date}</span>
                      <span>Horaire : {ex.time} ({ex.duration})</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 italic text-center py-4">Aucun examen à venir pour le moment.</p>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 4: SUJETS D'ÉPREUVES & DEVOIRS MIS À DISPOSITION PAR LES PROFESSEURS */}
      {student && (
        <ParentExamPapersTab
          student={student}
          currentClass={classObj}
          examPapers={examPapers}
          settings={settings}
          currentSchool={currentSchool}
        />
      )}

      {/* Printable Bulletin Modal */}
      {showPrintModal && student && (
        <PrintBulletinModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          student={student}
          classObj={classObj}
          trimester={selectedTrimester}
        />
      )}

      {/* Send Bulletin to Parents via WhatsApp / SMS Modal */}
      {showSendModal && student && (
        <SendBulletinParentModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          student={student}
          classObj={classObj}
          trimester={selectedTrimester}
          studentAverage={overallAverage}
          studentRank={rank}
          totalStudentsInClass={classStudents.length}
          studentMention={academicInfo.mention}
          studentAppreciation={academicInfo.appreciation}
        />
      )}

    </div>
  );
};
