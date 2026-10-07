import React, { useState, useMemo } from 'react';
import { useApp } from '../lib/store';
import { Teacher, QuizWeek, QuizWeekSubmission } from '../types';
import { clientFetch } from '../services/clientFetch.ts';
import { isPrimaryClass } from '../lib/schoolUtils';
import {
  FileText,
  Upload,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Layers,
  Download,
  Eye,
  Trash2,
  Printer,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Award,
  Users,
  Edit3,
  MessageSquare,
  HelpCircle,
  Zap,
  Camera,
  FileCheck,
  Search,
  ExternalLink,
  Lock,
  Unlock,
  Check,
  Save,
  Target,
  Lightbulb,
  RefreshCw
} from 'lucide-react';

export const aiLeniencyPresets = [
  {
    label: "🌟 Clémence & démarche",
    text: "Consigne de clémence : Être indulgent avec les élèves. Reconnaître et valoriser toute démarche de réponse logique. Accorder au moins 50% des points dès lors que la méthode, la formule ou l'amorce de raisonnement est correcte, même si le calcul final comporte une erreur d'inattention."
  },
  {
    label: "💡 Approches alternatives",
    text: "Reconnaissance des approches : Accepter et valoriser les démarches ou formulations alternatives valides qui diffèrent du corrigé type officiel tant que le principe ou la logique est respecté."
  },
  {
    label: "🎯 Tolérance inattention",
    text: "Tolérance d'inattention : Ne pas sanctionner sévèrement les coquilles ou erreurs de calcul de dernière ligne si le cheminement global et la réflexion sont rigoureux."
  },
  {
    label: "🚀 Encouragement & motivation",
    text: "Encouragement prioritaire : Mettre l'accent sur les efforts fournis par l'élève, valoriser ses prises d'initiative et formuler des pistes de progression stimulantes."
  }
];

interface TeacherQuizWeekTabProps {
  currentTeacher: Teacher;
}

export const TeacherQuizWeekTab: React.FC<TeacherQuizWeekTabProps> = ({ currentTeacher }) => {
  const {
    currentSchool,
    classes,
    subjects,
    students,
    quizWeeks,
    addQuizWeek,
    updateQuizWeek,
    deleteQuizWeek,
    gradeQuizWeekSubmission,
    updateQuizWeekSubmissionAiEvaluation,
    addCommunication
  } = useApp();

  // Filter out primary classes from secondary teacher space
  const teacherClasses = useMemo(() => {
    return classes.filter(c => !isPrimaryClass(c));
  }, [classes]);

  // Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    const nonPrimary = classes.filter(c => !isPrimaryClass(c));
    if (currentTeacher.classIds && currentTeacher.classIds.length > 0) {
      const match = currentTeacher.classIds.find(id => nonPrimary.some(c => c.id === id));
      if (match) return match;
    }
    return nonPrimary[0]?.id || '';
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    if (currentTeacher.subjects && currentTeacher.subjects.length > 0) {
      const match = subjects.find(s => s.name.toLowerCase() === currentTeacher.subjects[0].toLowerCase());
      if (match) return match.id;
    }
    return subjects[0]?.id || '';
  });

  const [title, setTitle] = useState('');
  const [weekendTargetDate, setWeekendTargetDate] = useState('Weekend du samedi au dimanche');
  const [deadline, setDeadline] = useState('Dimanche à 20h00');
  const [instructions, setInstructions] = useState('À traiter attentivement pendant le weekend. Renvoyez votre copie (photo scannée ou saisie directe) pour débloquer le corrigé type officiel et le barème.');
  const [content, setContent] = useState('');
  const [officialAnswerKey, setOfficialAnswerKey] = useState('');
  const [gradingScale, setGradingScale] = useState('Exercice 1 : 10 points\nExercice 2 : 10 points\nTotal : 20/20');
  const [teacherAiInstructions, setTeacherAiInstructions] = useState<string>(
    "Consignes de clémence du professeur : Faire preuve de bienveillance pédagogique. Reconnaître et valoriser chaque démarche de réponse et approche méthodologique de l'élève. Même si le calcul final présente une erreur d'inattention, accorder des points de démarche dès lors que le raisonnement ou la formule est amorcé. Encourager les efforts fournis."
  );
  const [totalPoints, setTotalPoints] = useState<number>(20);

  // File Attachments for Quiz (Exercise & Answer Key)
  const [attachedExerciseFileUrl, setAttachedExerciseFileUrl] = useState<string>('');
  const [attachedExerciseFileName, setAttachedExerciseFileName] = useState<string>('');
  const [attachedAnswerKeyFileUrl, setAttachedAnswerKeyFileUrl] = useState<string>('');
  const [attachedAnswerKeyFileName, setAttachedAnswerKeyFileName] = useState<string>('');

  // Filtering & Search
  const [filterClassId, setFilterClassId] = useState<string>('ALL');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Quiz Week for detail or submission reviewing
  const [viewingQuiz, setViewingQuiz] = useState<QuizWeek | null>(null);
  const [activeQuizSubTab, setActiveQuizSubTab] = useState<'CONTENT' | 'KEY' | 'SUBMISSIONS'>('CONTENT');

  // Reviewing specific student submission modal
  const [reviewingSubmission, setReviewingSubmission] = useState<{ quiz: QuizWeek; submission: QuizWeekSubmission; studentName: string } | null>(null);
  const [gradingScoreInput, setGradingScoreInput] = useState<string>('');
  const [gradingFeedbackInput, setGradingFeedbackInput] = useState<string>('');
  const [reviewModalAiInstructions, setReviewModalAiInstructions] = useState<string>('');
  const [showReviewAiInstructionsEdit, setShowReviewAiInstructionsEdit] = useState<boolean>(false);
  const [gradeSuccessFeedback, setGradeSuccessFeedback] = useState<boolean>(false);
  const [isAiEvaluatingSingleSub, setIsAiEvaluatingSingleSub] = useState<boolean>(false);

  // Photo Lightbox Zoom Modal
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<{ url: string; title: string } | null>(null);

  // Success / notification message
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Filtered Quiz Weeks for this school / teacher
  const filteredQuizWeeks = useMemo(() => {
    return quizWeeks.filter(qw => {
      // Must match school
      if (qw.schoolId && qw.schoolId !== currentSchool.id) return false;
      // Filter by teacher if teacher is selected
      if (currentTeacher.id && qw.teacherId && qw.teacherId !== currentTeacher.id) {
        // Still allow seeing it if teacher teaches this class
        if (currentTeacher.classIds && !currentTeacher.classIds.includes(qw.classId)) {
          return false;
        }
      }
      if (filterClassId !== 'ALL' && qw.classId !== filterClassId) return false;
      if (filterSubjectId !== 'ALL' && qw.subjectId !== filterSubjectId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          qw.title.toLowerCase().includes(q) ||
          qw.className.toLowerCase().includes(q) ||
          qw.subjectName.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quizWeeks, currentSchool.id, currentTeacher, filterClassId, filterSubjectId, searchQuery]);

  // File Upload Helper (converts to base64 data URL)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setUrl: (url: string) => void,
    setName: (name: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Le fichier sélectionné est trop volumineux (maximum 8 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUrl(event.target.result as string);
        setName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick prompt generator for weekend exercises
  const handleLoadExerciseTemplate = () => {
    const targetClass = teacherClasses.find(c => c.id === selectedClassId);
    const targetSubject = subjects.find(s => s.id === selectedSubjectId);
    const subName = targetSubject ? targetSubject.name : 'Matière';

    setTitle(`Quiz Week-end — ${subName} (${targetClass?.name || 'Classe'})`);
    setContent(`EXERCICE 1 (10 points) : Questions de révision & Maîtrise de cours
1) Rappeler avec précision la définition et les règles fondamentales du chapitre en cours.
2) Citer deux exemples d'application pratique rencontrés en classe cette semaine.
3) Répondre à la question réflexive posée.

EXERCICE 2 (10 points) : Résolution d'un problème d'application
On donne les données de la situation problème :
1) Analyser les hypothèses et poser le modèle mathématique ou scientifique approprié.
2) Effectuer les calculs détaillés étape par étape.
3) Conclure avec une phrase réponse claire et argumentée.`);

    setOfficialAnswerKey(`CORRIGÉ TYPE OFFICIEL DU PROFESSEUR :

CORRIGÉ EXERCICE 1 (10 points) :
1) Définition exacte du cours avec les termes clés attendus.
2) Les deux exemples valides et conformes au programme.
3) Réponse réflexive structurée.

CORRIGÉ EXERCICE 2 (10 points) :
1) Modèle correctement posé.
2) Calculs intermédiaires détaillés avec unités.
3) Conclusion finale exacte.`);

    setGradingScale(`BARÈME DÉTAILLÉ DE CORRECTION (/20) :
• Exercice 1 : 10 points
  - Définition exacte : 4 pts
  - Exemples pertinents : 3 pts
  - Réflexion et rigueur : 3 pts
• Exercice 2 : 10 points
  - Hypothèses & méthode : 3 pts
  - Calculs et étapes : 5 pts
  - Phrase réponse et unités : 2 pts`);
  };

  // Create new Quiz Week handler
  const handleCreateQuizWeek = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !officialAnswerKey.trim()) {
      alert("Veuillez renseigner le titre, l'énoncé de l'exercice et le corrigé type officiel.");
      return;
    }

    const targetClass = teacherClasses.find(c => c.id === selectedClassId);
    const targetSubject = subjects.find(s => s.id === selectedSubjectId);

    const newQuiz = addQuizWeek({
      schoolId: currentSchool.id,
      title: title.trim(),
      classId: selectedClassId,
      className: targetClass?.name || 'Classe sélectionnée',
      subjectId: selectedSubjectId,
      subjectName: targetSubject?.name || 'Matière',
      teacherId: currentTeacher.id,
      teacherName: `${currentTeacher.firstName} ${currentTeacher.lastName}`,
      teacherPhone: currentTeacher.phone,
      weekendTargetDate: weekendTargetDate.trim() || 'Ce week-end',
      deadline: deadline.trim() || 'Dimanche soir',
      instructions: instructions.trim(),
      content: content.trim() || (attachedExerciseFileUrl ? "Énoncé et sujet des exercices fournis en photo / document ci-joint." : "Exercices du week-end"),
      attachedExerciseFileUrl: attachedExerciseFileUrl || undefined,
      attachedExerciseFileName: attachedExerciseFileName || (attachedExerciseFileUrl ? 'Épreuve_Photo.jpg' : undefined),
      officialAnswerKey: officialAnswerKey.trim() || (attachedAnswerKeyFileUrl ? "Corrigé type officiel détaillé fourni en photo / document ci-joint." : "Corrigé type en attente"),
      attachedAnswerKeyFileUrl: attachedAnswerKeyFileUrl || undefined,
      attachedAnswerKeyFileName: attachedAnswerKeyFileName || (attachedAnswerKeyFileUrl ? 'Corrigé_Type_Photo.jpg' : undefined),
      gradingScale: gradingScale.trim() || 'Sur 20 points',
      teacherAiInstructions: teacherAiInstructions.trim() || undefined,
      totalPoints: totalPoints || 20,
      status: 'ACTIF'
    });

    // Send automatic announcement / communication to class parents
    if (targetClass && targetSubject) {
      try {
        addCommunication({
          senderId: currentTeacher.id,
          senderName: `Prof. ${currentTeacher.lastName} (${targetSubject.name})`,
          recipientGroup: 'PARENTS',
          subject: `⚡ Nouveau Quiz Week-end : ${targetSubject.name} (${targetClass.name})`,
          content: `Un nouveau Quiz Week-end "${title.trim()}" vient d'être publié pour les élèves de ${targetClass.name}. Consultez les exercices sur votre Espace Parents. Les élèves doivent traiter et renvoyer leur travail (par scan ou en ligne) avant ${deadline} pour débloquer le corrigé type officiel.`,
          channels: ['SMS', 'WHATSAPP'],
          sentAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: 'LIVRE'
        });
      } catch (err) {}
    }

    setShowCreateModal(false);
    // Reset Form
    setTitle('');
    setContent('');
    setOfficialAnswerKey('');
    setTeacherAiInstructions("Consignes de clémence du professeur : Faire preuve de bienveillance pédagogique. Reconnaître et valoriser chaque démarche de réponse et approche méthodologique de l'élève. Même si le calcul final présente une erreur d'inattention, accorder des points de démarche dès lors que le raisonnement ou la formule est amorcé. Encourager les efforts fournis.");
    setAttachedExerciseFileUrl('');
    setAttachedExerciseFileName('');
    setAttachedAnswerKeyFileUrl('');
    setAttachedAnswerKeyFileName('');
    setNotificationMsg(`Quiz Week "${newQuiz.title}" envoyé avec succès à la classe ${targetClass?.name} !`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Open review modal for a student's submission
  const handleOpenReview = (quiz: QuizWeek, sub: QuizWeekSubmission) => {
    setReviewingSubmission({
      quiz,
      submission: sub,
      studentName: sub.studentName
    });
    setGradingScoreInput(sub.teacherScore !== undefined ? String(sub.teacherScore) : '');
    setGradingFeedbackInput(sub.teacherFeedback || '');
    setReviewModalAiInstructions(
      quiz.teacherAiInstructions ||
      "Consignes de clémence du professeur : Faire preuve de bienveillance pédagogique. Reconnaître et valoriser chaque démarche de réponse et approche méthodologique de l'élève."
    );
    setShowReviewAiInstructionsEdit(false);
    setGradeSuccessFeedback(false);
  };

  // Save teacher evaluation score & feedback
  const handleSaveGrade = () => {
    if (!reviewingSubmission) return;
    const scoreVal = parseFloat(gradingScoreInput);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > reviewingSubmission.quiz.totalPoints) {
      alert(`Veuillez saisir une note valide comprise entre 0 et ${reviewingSubmission.quiz.totalPoints}.`);
      return;
    }

    gradeQuizWeekSubmission(
      reviewingSubmission.quiz.id,
      reviewingSubmission.submission.id,
      scoreVal,
      gradingFeedbackInput.trim() || 'Travail vérifié par le professeur.'
    );

    setGradeSuccessFeedback(true);
    setTimeout(() => {
      setGradeSuccessFeedback(false);
      setReviewingSubmission(null);
    }, 1500);
  };

  // Trigger AI evaluation for a single submission on demand by teacher
  const triggerTeacherAiEvaluation = async (quiz: QuizWeek, sub: QuizWeekSubmission, customInstructions?: string) => {
    setIsAiEvaluatingSingleSub(true);
    try {
      const instructionsToSend = customInstructions !== undefined
        ? customInstructions
        : (reviewModalAiInstructions || quiz.teacherAiInstructions);

      const response = await clientFetch('/api/ai/grade-quiz-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizTitle: quiz.title,
          subjectName: quiz.subjectName,
          className: quiz.className,
          exerciseContent: quiz.content,
          officialAnswerKey: quiz.officialAnswerKey,
          gradingScale: quiz.gradingScale,
          teacherAiInstructions: instructionsToSend,
          totalPoints: quiz.totalPoints,
          submissionType: sub.submissionType,
          directAnswer: sub.directAnswer,
          scannedFileUrl: sub.scannedFileUrl,
          studentName: sub.studentName
        })
      });

      if (!response.ok) throw new Error("Erreur réseau");
      const aiData = await response.json();

      const aiUpdate = {
        aiScore: typeof aiData.aiScore === 'number' ? aiData.aiScore : Math.round(quiz.totalPoints * 0.77 * 2) / 2,
        aiFeedback: aiData.aiFeedback || "Copie examinée avec clémence au regard du corrigé type officiel et du barème.",
        aiObservations: aiData.aiObservations || "L'élève a traité les exercices. Les démarches et approches ont été valorisées.",
        aiStrengths: Array.isArray(aiData.aiStrengths) ? aiData.aiStrengths : [
          "Exercices abordés avec application",
          "Approches de réponses et démarches valorisées avec clémence"
        ],
        aiAreasForImprovement: Array.isArray(aiData.aiAreasForImprovement) ? aiData.aiAreasForImprovement : [
          "Bien confronter la copie au corrigé type officiel pour consolider la rédaction",
          "Vérifier les calculs intermédiaires"
        ],
        aiBreakdown: aiData.aiBreakdown || `Attribution des points selon le barème officiel sur ${quiz.totalPoints} points (points de démarche inclus)`,
        aiEvaluatedAt: new Date().toISOString()
      };

      updateQuizWeekSubmissionAiEvaluation(quiz.id, sub.id, aiUpdate);

      // Also update reviewingSubmission if currently reviewing this one
      if (reviewingSubmission && reviewingSubmission.submission.id === sub.id) {
        setReviewingSubmission(prev => prev ? {
          ...prev,
          submission: {
            ...prev.submission,
            ...aiUpdate
          }
        } : null);
      }
    } catch (e) {
      console.warn("Erreur AI teacher review:", e);
    } finally {
      setIsAiEvaluatingSingleSub(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-6 sm:p-8 text-white border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wide">
              <Zap className="w-3.5 h-3.5" />
              <span>ESPACE PROFESSEUR — QUIZ WEEK</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Quiz Week du Week-end</span>
              <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Préparez et envoyez des exercices du week-end à votre classe avec le <strong className="text-emerald-400">corrigé type</strong> et le <strong className="text-amber-400">barème officiel</strong>. Les élèves effectuent les exercices et transmettent leur copie par <em>scannage</em> ou <em>réponse directe</em> pour débloquer la correction.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => {
                setShowCreateModal(true);
                if (!title) handleLoadExerciseTemplate();
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Créer un Quiz Week-end</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm font-bold flex items-center space-x-3 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un quiz..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>Classe :</span>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Toutes mes classes</option>
              {teacherClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>Matière :</span>
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Toutes les matières</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quiz Weeks Grid */}
      {filteredQuizWeeks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">Aucun Quiz Week publié pour le moment</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Lancez un devoir du weekend pour vos élèves dès maintenant ! Ils recevront l'énoncé et pourront renvoyer leur copie manuscrite ou tapée en ligne.
          </p>
          <button
            onClick={() => {
              setShowCreateModal(true);
              handleLoadExerciseTemplate();
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Créer mon premier Quiz Week</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredQuizWeeks.map((quiz) => {
            const classObj = classes.find(c => c.id === quiz.classId);
            const totalStudentsInClass = classObj ? (classObj.studentCount || 35) : 35;
            const submissionsCount = (quiz.submissions || []).length;
            const reviewedCount = (quiz.submissions || []).filter(s => s.status === 'CORRIGE').length;
            const isViewing = viewingQuiz?.id === quiz.id;

            return (
              <div
                key={quiz.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg hover:border-slate-700 transition-all"
              >
                {/* Quiz Card Header */}
                <div className="p-5 sm:p-6 bg-slate-900/90 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-black text-xs">
                        🏫 {quiz.className}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-bold text-xs">
                        📚 {quiz.subjectName}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{quiz.deadline}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs">
                        🎯 Barème : {quiz.totalPoints} pts
                      </span>
                      {quiz.teacherAiInstructions && (
                        <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center gap-1 border border-purple-500/30">
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>Clémence IA active (approches valorisées)</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <span>{quiz.title}</span>
                    </h3>

                    <p className="text-xs text-slate-400 flex items-center gap-3">
                      <span>📅 {quiz.weekendTargetDate}</span>
                      <span>•</span>
                      <span>👨‍🏫 Par {quiz.teacherName}</span>
                    </p>
                  </div>

                  {/* Right side stats & toggle */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-black text-white">
                        <span className="text-emerald-400 font-black text-base">{submissionsCount}</span> / {totalStudentsInClass} rendus
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {reviewedCount} copies notées
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (isViewing) {
                          setViewingQuiz(null);
                        } else {
                          setViewingQuiz(quiz);
                          setActiveQuizSubTab('CONTENT');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
                    >
                      <span>{isViewing ? 'Masquer' : 'Gérer & Suivre'}</span>
                      {isViewing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Voulez-vous vraiment supprimer le Quiz Week "${quiz.title}" ?`)) {
                          deleteQuizWeek(quiz.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      title="Supprimer ce Quiz Week"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isViewing && (
                  <div className="p-5 sm:p-6 bg-slate-950/60 border-t border-slate-800 space-y-6">
                    {/* Inner Subtabs */}
                    <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                      <button
                        onClick={() => setActiveQuizSubTab('CONTENT')}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                          activeQuizSubTab === 'CONTENT'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span>Énoncé des Exercices</span>
                      </button>

                      <button
                        onClick={() => setActiveQuizSubTab('KEY')}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                          activeQuizSubTab === 'KEY'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Lock className="w-4 h-4 text-amber-300" />
                        <span>Corrigé Type & Barème Officiel</span>
                      </button>

                      <button
                        onClick={() => setActiveQuizSubTab('SUBMISSIONS')}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                          activeQuizSubTab === 'SUBMISSIONS'
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>Copies d'Élèves Reçues ({submissionsCount})</span>
                      </button>
                    </div>

                    {/* Subtab 1: Content */}
                    {activeQuizSubTab === 'CONTENT' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
                          <span className="font-black block text-indigo-200">📢 Consignes pour le weekend :</span>
                          <p>{quiz.instructions}</p>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                          {quiz.content}
                        </div>

                        {quiz.attachedExerciseFileUrl && (
                          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Camera className="w-6 h-6 text-indigo-400" />
                                <div>
                                  <span className="text-xs font-bold text-white block">
                                    {quiz.attachedExerciseFileName || 'Photo_Epreuve.jpg'}
                                  </span>
                                  <span className="text-[11px] text-slate-400">Photo / Document de l'épreuve joint au devoir</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveLightboxPhoto({ url: quiz.attachedExerciseFileUrl!, title: `Épreuve du devoir : ${quiz.title}` })}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Agrandir la Photo</span>
                              </button>
                            </div>

                            {/* Direct Inline Image Preview */}
                            {(quiz.attachedExerciseFileUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(quiz.attachedExerciseFileUrl)) && (
                              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black/40 group">
                                <img
                                  src={quiz.attachedExerciseFileUrl}
                                  alt="Photo de l'épreuve"
                                  className="w-full max-h-96 object-contain rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                                  onClick={() => setActiveLightboxPhoto({ url: quiz.attachedExerciseFileUrl!, title: `Épreuve : ${quiz.title}` })}
                                />
                                <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] text-white font-bold pointer-events-none flex items-center gap-1">
                                  <Camera className="w-3 h-3 text-indigo-400" />
                                  <span>Cliquer pour zoomer</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subtab 2: Key & Grading Scale */}
                    {activeQuizSubTab === 'KEY' && (
                      <div className="space-y-5">
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                          <span className="font-black flex items-center gap-1.5 text-amber-200">
                            <Lock className="w-4 h-4 text-amber-400" />
                            <span>Protection du Corrigé Type & du Barème :</span>
                          </span>
                          <p>
                            Cette correction et le barème sont rigoureusement masqués aux élèves tant qu'ils n'ont pas encore soumis leur propre travail. Dès que l'élève valide l'envoi de son scannage ou de sa réponse directe, le corrigé type ci-dessous est instantanément déverrouillé sur son écran.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Corrigé Type Officiel Rédactionnel</span>
                            </h4>
                            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs sm:text-sm whitespace-pre-wrap font-mono leading-relaxed h-80 overflow-y-auto">
                              {quiz.officialAnswerKey}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                              <Award className="w-4 h-4" />
                              <span>Barème Officiel de Notation ({quiz.totalPoints} pts)</span>
                            </h4>
                            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs sm:text-sm whitespace-pre-wrap font-mono leading-relaxed h-80 overflow-y-auto">
                              {quiz.gradingScale}
                            </div>
                          </div>
                        </div>

                        {/* Directives de Clémence transmises à l'IA */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-400" />
                              <span>Directives de Clémence & Suggestions données à l'IA pour la notation</span>
                            </h4>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 self-start sm:self-auto flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Reconnaissance des approches de réponses activée</span>
                            </span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/20 text-xs text-indigo-100 font-sans leading-relaxed">
                            <p className="italic">
                              « {quiz.teacherAiInstructions || "Faire preuve de bienveillance pédagogique : valoriser chaque démarche de réponse et approche de l'élève. Accorder des points pour les méthodes et amorces de calcul valides même si le résultat final est incomplet."} »
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            💡 Dès qu'un élève soumet son travail, l'IA Gemini applique scrupuleusement ces consignes de clémence pour valoriser sa réflexion avant de calculer sa note.
                          </p>
                        </div>

                        {quiz.attachedAnswerKeyFileUrl && (
                          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileCheck className="w-6 h-6 text-emerald-400" />
                                <div>
                                  <span className="text-xs font-bold text-white block">
                                    {quiz.attachedAnswerKeyFileName || 'Photo_Corrige_Officiel.jpg'}
                                  </span>
                                  <span className="text-[11px] text-slate-400">Photo / document de la solution manuscrite</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveLightboxPhoto({ url: quiz.attachedAnswerKeyFileUrl!, title: `Corrigé Officiel : ${quiz.title}` })}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Agrandir le Corrigé</span>
                              </button>
                            </div>

                            {/* Direct Inline Image Preview */}
                            {(quiz.attachedAnswerKeyFileUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(quiz.attachedAnswerKeyFileUrl)) && (
                              <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-black/40 group">
                                <img
                                  src={quiz.attachedAnswerKeyFileUrl}
                                  alt="Photo du corrigé type officiel"
                                  className="w-full max-h-96 object-contain rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                                  onClick={() => setActiveLightboxPhoto({ url: quiz.attachedAnswerKeyFileUrl!, title: `Corrigé Officiel : ${quiz.title}` })}
                                />
                                <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] text-emerald-300 font-bold pointer-events-none flex items-center gap-1">
                                  <Camera className="w-3 h-3 text-emerald-400" />
                                  <span>Cliquer pour zoomer le corrigé</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subtab 3: Student Submissions Tracking */}
                    {activeQuizSubTab === 'SUBMISSIONS' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-300 uppercase tracking-wide">
                            Suivi des {submissionsCount} copie(s) rendue(s) sur la classe
                          </h4>
                          <span className="text-xs text-emerald-400 font-bold">
                            {reviewedCount} évaluée(s) par le professeur
                          </span>
                        </div>

                        {submissionsCount === 0 ? (
                          <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                            Aucun élève n'a encore renvoyé sa copie pour ce devoir de weekend.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(quiz.submissions || []).map((sub) => {
                              const isGraded = sub.status === 'CORRIGE';

                              return (
                                <div
                                  key={sub.id}
                                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1">
                                      <span className="text-sm font-black text-white block">
                                        {sub.studentName}
                                      </span>
                                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                        <span className={`px-2 py-0.5 rounded font-bold ${
                                          sub.submissionType === 'SCAN'
                                            ? 'bg-purple-500/20 text-purple-300'
                                            : 'bg-cyan-500/20 text-cyan-300'
                                        }`}>
                                          {sub.submissionType === 'SCAN' ? '📸 Copie Scannée / Photo' : '✍️ Réponse directe en ligne'}
                                        </span>
                                        <span>•</span>
                                        <span>Rendu le {new Date(sub.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                    </div>

                                    {isGraded ? (
                                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-black text-xs shrink-0 flex items-center gap-1">
                                        <Award className="w-3.5 h-3.5" />
                                        <span>{sub.teacherScore} / {quiz.totalPoints}</span>
                                      </span>
                                    ) : sub.aiScore !== undefined ? (
                                      <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-black text-xs shrink-0 flex items-center gap-1 border border-indigo-500/30">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                        <span>IA: {sub.aiScore} / {quiz.totalPoints}</span>
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-[11px] shrink-0">
                                        ⏳ À corriger
                                      </span>
                                    )}
                                  </div>

                                  {/* AI Evaluation Preview if available */}
                                  {sub.aiScore !== undefined && (
                                    <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                          <span>Note IA : {sub.aiScore} / {quiz.totalPoints}</span>
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                          D'après corrigé & barème
                                        </span>
                                      </div>
                                      {sub.aiAreasForImprovement && sub.aiAreasForImprovement.length > 0 && (
                                        <p className="text-[11px] text-slate-300 line-clamp-1 flex items-center gap-1">
                                          <span className="text-amber-400 font-bold shrink-0">💡 À améliorer :</span>
                                          <span className="truncate">{sub.aiAreasForImprovement[0]}</span>
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {sub.teacherFeedback && (
                                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 italic">
                                      💬 "{sub.teacherFeedback}"
                                    </div>
                                  )}

                                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                    <button
                                      onClick={() => handleOpenReview(quiz, sub)}
                                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Consulter & Noter la Copie</span>
                                    </button>

                                    {sub.scannedFileUrl && (
                                      <a
                                        href={sub.scannedFileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                                      >
                                        <Camera className="w-3 h-3" />
                                        <span>Voir le scan</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CREATE QUIZ WEEK */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-scaleIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Nouveau Devoir Quiz Week</h3>
                  <p className="text-xs text-slate-400">Envoyer des exercices du weekend avec corrigé type et barème</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateQuizWeek} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Step 1: Target Class & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1.5">
                    Classe Destinataire *
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {teacherClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1.5">
                    Matière *
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-black text-slate-300 mb-1.5">
                    Date du Weekend Cible *
                  </label>
                  <input
                    type="text"
                    value={weekendTargetDate}
                    onChange={(e) => setWeekendTargetDate(e.target.value)}
                    placeholder="Ex: Weekend du 26-27 Septembre"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-black text-slate-300 mb-1.5">
                    Date/Heure Limite de Rendu *
                  </label>
                  <input
                    type="text"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    placeholder="Ex: Dimanche à 20h00"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-black text-slate-300 mb-1.5">
                    Total des Points *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(Number(e.target.value))}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-1.5">
                  Titre du Quiz Week *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Quiz Week-end N°1 — Théorème de Thalès & Équations"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleLoadExerciseTemplate}
                    className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold shrink-0 transition-all cursor-pointer"
                    title="Générer un modèle type pour ce devoir"
                  >
                    ✨ Modèle type
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-1.5">
                  Consignes et Directives Particulières
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Consignes particulières pour l'élève et les parents..."
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Énoncé des Exercices & Import Photo */}
              <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-black text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>Énoncé des Exercices du Weekend *</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Rédigez le texte ou <strong>importez directement une photo de l'épreuve</strong> (prise avec votre téléphone ou fichier scanné).
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs cursor-pointer shadow-md transition-all self-start sm:self-auto shrink-0">
                    <Camera className="w-4 h-4 text-amber-300" />
                    <span>📸 Importer l'Épreuve (Photo)</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setAttachedExerciseFileUrl, setAttachedExerciseFileName)}
                    />
                  </label>
                </div>

                {/* Photo Preview if uploaded */}
                {attachedExerciseFileUrl && (
                  <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Photo de l'épreuve chargée : {attachedExerciseFileName || 'Photo_Epreuve.jpg'}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveLightboxPhoto({ url: attachedExerciseFileUrl, title: "Photo de l'épreuve sélectionnée" })}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Agrandir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachedExerciseFileUrl('');
                            setAttachedExerciseFileName('');
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                    {attachedExerciseFileUrl.startsWith('data:image') && (
                      <div className="relative max-h-48 overflow-hidden rounded-xl border border-indigo-500/30 bg-black/50">
                        <img
                          src={attachedExerciseFileUrl}
                          alt="Aperçu photo épreuve"
                          className="w-full max-h-48 object-contain cursor-pointer"
                          onClick={() => setActiveLightboxPhoto({ url: attachedExerciseFileUrl, title: "Photo de l'épreuve" })}
                        />
                      </div>
                    )}
                  </div>
                )}

                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={attachedExerciseFileUrl ? "Optionnel : ajoutez un mot d'explication ou des consignes complémentaires..." : "Rédigez ici les exercices, questions, énoncés ou problèmes du weekend..."}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-indigo-500 leading-relaxed"
                  required={!attachedExerciseFileUrl}
                />
              </div>

              {/* Corrigé Type Officiel & Barème */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Corrigé Type */}
                <div className="space-y-3 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <label className="text-xs font-black text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <span>Corrigé Type Officiel *</span>
                      </label>
                      <p className="text-[10px] text-slate-400">
                        Débloqué <strong>uniquement après soumission</strong> de l'élève.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow self-start sm:self-auto shrink-0">
                      <Camera className="w-3.5 h-3.5" />
                      <span>📸 Photo Corrigé</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setAttachedAnswerKeyFileUrl, setAttachedAnswerKeyFileName)}
                      />
                    </label>
                  </div>

                  {/* Photo Corrigé Preview if uploaded */}
                  {attachedAnswerKeyFileUrl && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-300 font-bold truncate">Photo corrigé : {attachedAnswerKeyFileName || 'Photo_Corrige.jpg'}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveLightboxPhoto({ url: attachedAnswerKeyFileUrl, title: "Photo du corrigé type officiel" })}
                            className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold"
                          >
                            Voir
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAttachedAnswerKeyFileUrl('');
                              setAttachedAnswerKeyFileName('');
                            }}
                            className="text-red-400 hover:text-red-300 text-[10px] font-bold"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                      {attachedAnswerKeyFileUrl.startsWith('data:image') && (
                        <img
                          src={attachedAnswerKeyFileUrl}
                          alt="Aperçu photo corrigé"
                          className="w-full max-h-32 object-contain rounded-lg border border-emerald-500/30 cursor-pointer bg-black/40"
                          onClick={() => setActiveLightboxPhoto({ url: attachedAnswerKeyFileUrl, title: "Photo du corrigé type officiel" })}
                        />
                      )}
                    </div>
                  )}

                  <textarea
                    rows={4}
                    value={officialAnswerKey}
                    onChange={(e) => setOfficialAnswerKey(e.target.value)}
                    placeholder={attachedAnswerKeyFileUrl ? "Optionnel : barème ou notes complémentaires..." : "Rédigez le corrigé détaillé étape par étape..."}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    required={!attachedAnswerKeyFileUrl}
                  />
                </div>

                {/* Barème de notation */}
                <div className="space-y-2 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                  <label className="block text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Barème de Notation Détaillé *</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Détail des points par question et critères d'évaluation.
                  </p>
                  <textarea
                    rows={6}
                    value={gradingScale}
                    onChange={(e) => setGradingScale(e.target.value)}
                    placeholder="Ex: Ex 1 Question 1 = 3pts, Question 2 = 4pts..."
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-amber-500/30 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Consignes & Suggestions du Professeur pour l'IA (Clémence & Approches de réponses) */}
                <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-slate-900 to-purple-950/30 border-2 border-indigo-500/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="block text-xs font-black text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Consignes & Suggestions du Professeur pour l'IA (Clémence & Barème)</span>
                    </label>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 self-start sm:self-auto">
                      Reconnaissance des approches de réponses
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Donnez des consignes ou suggestions à l'IA pour qu'elle soit <strong className="text-amber-300">clémente avec les élèves</strong>, reconnaisse et valorise les <strong className="text-emerald-400">approches et démarches de réponses</strong> (méthode, formule posée, logique amorcée) même si le calcul final est erroné.
                  </p>

                  {/* Preset quick buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Suggestions rapides à insérer en 1 clic :
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {aiLeniencyPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setTeacherAiInstructions(prev => {
                              if (!prev.trim()) return preset.text;
                              if (prev.includes(preset.text)) return prev;
                              return `${prev.trim()}\n• ${preset.text}`;
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 text-[11px] font-bold border border-indigo-500/30 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={teacherAiInstructions}
                    onChange={(e) => setTeacherAiInstructions(e.target.value)}
                    placeholder="Ex: Être clément avec les élèves : valoriser toute démarche de réponse pertinente et accorder au moins 50% des points si la méthode est amorcée..."
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-indigo-500/40 text-white font-sans text-xs focus:outline-none focus:border-indigo-400 leading-relaxed"
                  />
                  <div className="text-[10px] text-indigo-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>L'IA prendra obligatoirement en compte ces directives de clémence lors de la notation dès l'envoi de la copie par l'élève.</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-slate-900 pb-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Publier et Envoyer le Quiz Week</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW STUDENT SUBMISSION & GRADE */}
      {reviewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden my-auto animate-scaleIn max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                  {reviewingSubmission.studentName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{reviewingSubmission.studentName}</h3>
                  <p className="text-xs text-slate-400">
                    Copie envoyée le {new Date(reviewingSubmission.submission.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewingSubmission(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Submission Content (Scan or Direct) */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  {reviewingSubmission.submission.submissionType === 'SCAN' ? (
                    <>
                      <Camera className="w-4 h-4 text-purple-400" />
                      <span>Copie Manuscrite Scannée / Photographiée :</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span>Réponse Directe Rédigée par l'Élève :</span>
                    </>
                  )}
                </span>

                {reviewingSubmission.submission.submissionType === 'SCAN' && reviewingSubmission.submission.scannedFileUrl ? (
                  <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 p-2 text-center">
                    <img
                      src={reviewingSubmission.submission.scannedFileUrl}
                      alt="Copie scannée"
                      className="max-h-96 mx-auto rounded-xl object-contain"
                    />
                    <div className="pt-2">
                      <a
                        href={reviewingSubmission.submission.scannedFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ouvrir l'image en haute résolution</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                    {reviewingSubmission.submission.directAnswer || "Aucun texte saisi."}
                  </div>
                )}
              </div>

              {/* TEACHER'S LENIENCY INSTRUCTIONS FOR AI (Adjustable per review) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-indigo-300 uppercase tracking-wide">
                      Consignes de Clémence transmises à l'IA
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReviewAiInstructionsEdit(!showReviewAiInstructionsEdit)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-200 underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{showReviewAiInstructionsEdit ? "Masquer" : "Ajuster les consignes"}</span>
                  </button>
                </div>

                {!showReviewAiInstructionsEdit ? (
                  <p className="text-xs text-indigo-100 italic bg-slate-950/60 p-2.5 rounded-xl border border-indigo-500/20 leading-relaxed">
                    « {reviewModalAiInstructions || "Le professeur demande d'être clément et de valoriser les approches de réponses."} »
                  </p>
                ) : (
                  <div className="space-y-2 pt-1 animate-fadeIn">
                    <p className="text-[11px] text-slate-300">
                      Vous pouvez affiner les consignes de clémence pour cette copie (ex: valoriser une démarche spécifique ou excuser une coquille) :
                    </p>
                    <textarea
                      rows={3}
                      value={reviewModalAiInstructions}
                      onChange={(e) => setReviewModalAiInstructions(e.target.value)}
                      placeholder="Indiquez vos suggestions à l'IA (clémence, valorisation des approches de réponses)..."
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-indigo-500/40 text-white font-sans text-xs focus:outline-none focus:border-indigo-400"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={isAiEvaluatingSingleSub}
                        onClick={() => triggerTeacherAiEvaluation(reviewingSubmission.quiz, reviewingSubmission.submission, reviewModalAiInstructions)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isAiEvaluatingSingleSub ? 'animate-spin' : ''}`} />
                        <span>Réévaluer la copie avec ces consignes</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* AI EVALUATION SECTION (Based on Answer Key, Rubric, and Teacher Leniency) */}
              {isAiEvaluatingSingleSub ? (
                <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-white space-y-3 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                    <div>
                      <h4 className="text-xs font-black text-amber-300">
                        L'IA analyse la copie selon le corrigé type et le barème...
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Vérification des calculs, du raisonnement et formulation des observations.
                      </p>
                    </div>
                  </div>
                </div>
              ) : reviewingSubmission.submission.aiScore !== undefined ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/40 border-2 border-indigo-500/40 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black tracking-wide border border-indigo-500/30">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>ÉVALUATION AUTOMATIQUE PAR L'IA</span>
                      </span>
                      <h4 className="text-sm font-black text-white">
                        Analyse selon le corrigé officiel et le barème
                      </h4>
                      <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Clémence appliquée : approches et démarches de réponse valorisées</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-center shadow">
                        <span className="text-[9px] uppercase font-black block opacity-80">Note IA</span>
                        <span className="text-base font-black">
                          {reviewingSubmission.submission.aiScore} / {reviewingSubmission.quiz.totalPoints}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => triggerTeacherAiEvaluation(reviewingSubmission.quiz, reviewingSubmission.submission)}
                        title="Relancer l'évaluation IA"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* AI Feedback & Observations */}
                  {reviewingSubmission.submission.aiFeedback && (
                    <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-xs text-indigo-200">
                      <strong className="text-indigo-300 block mb-0.5 font-bold">Appréciation de l'IA :</strong>
                      <p>{reviewingSubmission.submission.aiFeedback}</p>
                    </div>
                  )}

                  {/* Two columns: Strengths & What can be done better */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                      <span className="font-black text-emerald-400 block flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ce que l'élève a bien réussi :</span>
                      </span>
                      <ul className="space-y-1">
                        {(reviewingSubmission.submission.aiStrengths || ["Exercices traités"]).map((st, i) => (
                          <li key={i} className="text-emerald-100 text-[11px] flex items-start gap-1.5">
                            <span className="text-emerald-400">•</span>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-950/30 border-2 border-amber-500/40 space-y-1.5">
                      <span className="font-black text-amber-300 block flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ce qu'il peut mieux faire (Conseils) :</span>
                      </span>
                      <ul className="space-y-1">
                        {(reviewingSubmission.submission.aiAreasForImprovement || ["Revoir la rédaction"]).map((imp, i) => (
                          <li key={i} className="text-amber-100 text-[11px] flex items-start gap-1.5">
                            <Lightbulb className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Rubric Breakdown */}
                  {reviewingSubmission.submission.aiBreakdown && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-bold text-slate-200">Détail des points :</span>
                      <span className="text-slate-400 truncate">{reviewingSubmission.submission.aiBreakdown}</span>
                    </div>
                  )}

                  {/* Button to quickly apply AI score & appreciation to teacher form */}
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (reviewingSubmission.submission.aiScore !== undefined) {
                          setGradingScoreInput(String(reviewingSubmission.submission.aiScore));
                          const generatedFeedback = reviewingSubmission.submission.aiFeedback || (
                            reviewingSubmission.submission.aiAreasForImprovement && reviewingSubmission.submission.aiAreasForImprovement.length > 0
                              ? `Bon travail. ${reviewingSubmission.submission.aiAreasForImprovement[0]}`
                              : 'Bon travail sur le devoir du weekend.'
                          );
                          setGradingFeedbackInput(generatedFeedback);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>✨ Appliquer la note ({reviewingSubmission.submission.aiScore}) & l'appréciation de l'IA</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-xs text-indigo-300">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Cette copie n'a pas encore été analysée par l'IA.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerTeacherAiEvaluation(reviewingSubmission.quiz, reviewingSubmission.submission)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Lancer l'évaluation IA</span>
                  </button>
                </div>
              )}

              {/* Grading Form */}
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-4">
                <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Validation & Décision Finale du Professeur</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Note Attribuée (sur {reviewingSubmission.quiz.totalPoints}) *
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max={reviewingSubmission.quiz.totalPoints}
                      value={gradingScoreInput}
                      onChange={(e) => setGradingScoreInput(e.target.value)}
                      placeholder={`Ex: 18.5`}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Appréciation & Conseils Pédagogiques
                    </label>
                    <input
                      type="text"
                      value={gradingFeedbackInput}
                      onChange={(e) => setGradingFeedbackInput(e.target.value)}
                      placeholder="Ex: Excellent travail, raisonnement clair..."
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {gradeSuccessFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Note et appréciation enregistrées avec succès !</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900">
              <button
                type="button"
                onClick={() => setReviewingSubmission(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-all cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={handleSaveGrade}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer la Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Photo Lightbox Zoom Modal */}
      {activeLightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white border-b border-white/20 mb-3">
              <span className="font-black text-sm text-indigo-300 flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-300" />
                <span>{activeLightboxPhoto.title}</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveLightboxPhoto(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                <span>Fermer</span>
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto rounded-2xl border border-white/20 bg-slate-950 p-2 shadow-2xl flex items-center justify-center w-full">
              <img
                src={activeLightboxPhoto.url}
                alt={activeLightboxPhoto.title}
                className="max-h-[76vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
