import React, { useState, useMemo } from 'react';
import { useApp } from '../lib/store';
import { QuizWeek, QuizWeekSubmission, Teacher } from '../types';
import { TeacherQuizWeekTab, aiLeniencyPresets } from '../components/TeacherQuizWeekTab';
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  Eye,
  Trash2,
  Printer,
  Plus,
  X,
  Search,
  Check,
  Send,
  Camera,
  FileText,
  Lock,
  Unlock,
  AlertCircle,
  GraduationCap,
  Users,
  MessageSquare,
  Building2,
  BookOpen,
  Download,
  Filter,
  RefreshCw,
  ThumbsUp,
  Target,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  BellRing,
  HelpCircle,
  CheckSquare
} from 'lucide-react';

interface DirectorQuizWeekSupervisionViewProps {
  onNavigate?: (view: string) => void;
}

export const DirectorQuizWeekSupervisionView: React.FC<DirectorQuizWeekSupervisionViewProps> = ({ onNavigate }) => {
  const {
    currentSchool,
    classes,
    subjects,
    teachers,
    students,
    quizWeeks,
    addQuizWeek,
    updateQuizWeek,
    deleteQuizWeek,
    addCommunication,
    currentUser,
    settings
  } = useApp();

  // Filters
  const [filterTeacherId, setFilterTeacherId] = useState<string>('ALL');
  const [filterClassId, setFilterClassId] = useState<string>('ALL');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('ALL');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Top Platform Window Tab (Supervision vs Teacher Space)
  const [supervisionTab, setSupervisionTab] = useState<'SUPERVISION' | 'TEACHER_MANAGEMENT'>('SUPERVISION');

  // Modals
  const [auditingQuiz, setAuditingQuiz] = useState<QuizWeek | null>(null);
  const [auditSubTab, setAuditSubTab] = useState<'SUJET' | 'CORRIGE' | 'COPIES' | 'STATS'>('SUJET');
  const [showRelaunchModal, setShowRelaunchModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Full Photo Lightbox Zoom Modal
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<{ url: string; title: string } | null>(null);

  // Viewing a specific student's submission inside the audit modal
  const [selectedStudentSub, setSelectedStudentSub] = useState<{
    studentName: string;
    submission: QuizWeekSubmission;
  } | null>(null);

  // Director Visa Form State inside audit
  const [directorVisaStatus, setDirectorVisaStatus] = useState<'APPROUVE' | 'EN_ATTENTE' | 'A_REVOIR'>('APPROUVE');
  const [directorVisaNotes, setDirectorVisaNotes] = useState<string>('');
  const [visaSaveSuccess, setVisaSaveSuccess] = useState<boolean>(false);

  // Emergency Create Quiz Modal State (Director can publish on behalf of a teacher)
  const [newTitle, setNewTitle] = useState('');
  const [newTeacherId, setNewTeacherId] = useState<string>(() => teachers[0]?.id || '');
  const [newClassId, setNewClassId] = useState<string>(() => classes[0]?.id || '');
  const [newSubjectId, setNewSubjectId] = useState<string>(() => subjects[0]?.id || '');
  const [newDeadline, setNewDeadline] = useState('Dimanche à 20h00');
  const [newContent, setNewContent] = useState('');
  const [newAttachedExerciseFileUrl, setNewAttachedExerciseFileUrl] = useState<string>('');
  const [newAttachedExerciseFileName, setNewAttachedExerciseFileName] = useState<string>('');
  const [newOfficialAnswerKey, setNewOfficialAnswerKey] = useState('');
  const [newAttachedAnswerKeyFileUrl, setNewAttachedAnswerKeyFileUrl] = useState<string>('');
  const [newAttachedAnswerKeyFileName, setNewAttachedAnswerKeyFileName] = useState<string>('');
  const [newGradingScale, setNewGradingScale] = useState('Exercice 1 : 10 points\nExercice 2 : 10 points\nTotal : 20/20');
  const [newTeacherAiInstructions, setNewTeacherAiInstructions] = useState<string>(
    "Consignes de clémence du professeur : Faire preuve de bienveillance pédagogique. Reconnaître et valoriser chaque démarche de réponse et approche de l'élève. Même si le calcul final comporte une erreur d'inattention, accorder des points de méthode pour la bonne approche. Encourager les efforts fournis."
  );
  const [newTotalPoints, setNewTotalPoints] = useState<number>(20);

  // File Upload Helper (converts to base64 Data URL)
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

  // Filtered Quiz Weeks for current school
  const schoolQuizWeeks = useMemo(() => {
    return quizWeeks.filter(q => !q.schoolId || q.schoolId === currentSchool.id);
  }, [quizWeeks, currentSchool.id]);

  const filteredQuizWeeks = useMemo(() => {
    return schoolQuizWeeks.filter(quiz => {
      if (filterTeacherId !== 'ALL' && quiz.teacherId !== filterTeacherId) return false;
      if (filterClassId !== 'ALL' && quiz.classId !== filterClassId) return false;
      if (filterSubjectId !== 'ALL' && quiz.subjectId !== filterSubjectId) return false;
      if (filterApprovalStatus !== 'ALL') {
        const currentStatus = quiz.directorApprovalStatus || 'EN_ATTENTE';
        if (currentStatus !== filterApprovalStatus) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          quiz.title.toLowerCase().includes(q) ||
          quiz.teacherName.toLowerCase().includes(q) ||
          quiz.className.toLowerCase().includes(q) ||
          quiz.subjectName.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [schoolQuizWeeks, filterTeacherId, filterClassId, filterSubjectId, filterApprovalStatus, searchQuery]);

  // Key Performance Indicators (KPIs)
  const stats = useMemo(() => {
    const total = schoolQuizWeeks.length;
    const approved = schoolQuizWeeks.filter(q => q.directorApprovalStatus === 'APPROUVE').length;
    const pending = schoolQuizWeeks.filter(q => !q.directorApprovalStatus || q.directorApprovalStatus === 'EN_ATTENTE').length;
    const toReview = schoolQuizWeeks.filter(q => q.directorApprovalStatus === 'A_REVOIR').length;

    // Active teachers who published at least 1 quiz
    const activeTeacherIds = new Set(schoolQuizWeeks.map(q => q.teacherId).filter(Boolean));
    const totalTeachersCount = teachers.length || 1;
    const teacherEngagementRate = Math.round((activeTeacherIds.size / totalTeachersCount) * 100);

    // Classes covered
    const coveredClassIds = new Set(schoolQuizWeeks.map(q => q.classId).filter(Boolean));
    const totalClassesCount = classes.length || 1;
    const classCoverageRate = Math.round((coveredClassIds.size / totalClassesCount) * 100);

    // Submissions and grading stats
    let totalSubmissions = 0;
    let totalGraded = 0;
    let totalAiEvaluated = 0;
    let sumScores = 0;
    let countScores = 0;

    schoolQuizWeeks.forEach(q => {
      const subs = q.submissions || [];
      totalSubmissions += subs.length;
      subs.forEach(s => {
        if (s.status === 'CORRIGE' && typeof s.teacherScore === 'number') {
          totalGraded += 1;
          sumScores += s.teacherScore;
          countScores += 1;
        }
        if (typeof s.aiScore === 'number') {
          totalAiEvaluated += 1;
        }
      });
    });

    const averageGrade = countScores > 0 ? (sumScores / countScores).toFixed(1) : '--';

    return {
      total,
      approved,
      pending,
      toReview,
      activeTeachersCount: activeTeacherIds.size,
      totalTeachersCount,
      teacherEngagementRate,
      coveredClassesCount: coveredClassIds.size,
      totalClassesCount,
      classCoverageRate,
      totalSubmissions,
      totalGraded,
      totalAiEvaluated,
      averageGrade
    };
  }, [schoolQuizWeeks, teachers, classes]);

  // Teachers who have NOT posted any quiz yet for the school
  const laggingTeachers = useMemo(() => {
    const activeTeacherIds = new Set(schoolQuizWeeks.map(q => q.teacherId).filter(Boolean));
    return teachers.filter(t => !activeTeacherIds.has(t.id));
  }, [teachers, schoolQuizWeeks]);

  // Open audit modal for a quiz
  const handleOpenAudit = (quiz: QuizWeek) => {
    setAuditingQuiz(quiz);
    setAuditSubTab('SUJET');
    setSelectedStudentSub(null);
    setDirectorVisaStatus(quiz.directorApprovalStatus || 'EN_ATTENTE');
    setDirectorVisaNotes(quiz.directorNotes || '');
    setVisaSaveSuccess(false);
  };

  // Save Director Visa Decision
  const handleSaveDirectorVisa = () => {
    if (!auditingQuiz) return;

    const updatedQuiz: QuizWeek = {
      ...auditingQuiz,
      directorApprovalStatus: directorVisaStatus,
      directorNotes: directorVisaNotes.trim(),
      directorApprovedAt: new Date().toISOString(),
      directorApprovedBy: currentUser?.name || settings.directorName || 'Le Chef d\'Établissement'
    };

    updateQuizWeek(updatedQuiz);
    setAuditingQuiz(updatedQuiz);
    setVisaSaveSuccess(true);
    setNotificationMsg(`Décision de direction enregistrée : Devoir ${directorVisaStatus === 'APPROUVE' ? 'Approuvé avec succès' : directorVisaStatus === 'A_REVOIR' ? 'Marqué À Revoir' : 'Mis En Attente'}.`);

    // Notify teacher if remarks were made
    if (directorVisaStatus === 'A_REVOIR' && auditingQuiz.teacherId) {
      try {
        addCommunication({
          senderId: currentUser?.id || 'dir-1',
          senderName: `${currentUser?.name || 'Direction'} (${settings.schoolName || 'Établissement'})`,
          recipientGroup: 'ENSEIGNANTS',
          subject: `⚠️ Visa Direction Quiz Week : Remarques sur "${auditingQuiz.title}"`,
          content: `M./Mme ${auditingQuiz.teacherName}, votre devoir Quiz Week "${auditingQuiz.title}" pour la classe de ${auditingQuiz.className} nécessite des ajustements suite au contrôle de direction. Remarque : « ${directorVisaNotes.trim()} ». Merci de vérifier le corrigé ou le barème.`,
          channels: ['SMS', 'WHATSAPP'],
          sentAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: 'LIVRE'
        });
      } catch (e) {}
    }

    setTimeout(() => {
      setVisaSaveSuccess(false);
      setNotificationMsg(null);
    }, 4000);
  };

  // Handle Relaunch of Lagging Teachers
  const handleRelaunchTeachers = () => {
    if (laggingTeachers.length === 0) {
      alert("Tous les professeurs de l'établissement ont déjà déposé au moins un Quiz Week !");
      return;
    }

    try {
      addCommunication({
        senderId: currentUser?.id || 'dir-1',
        senderName: `Direction Générale (${settings.schoolName || 'Établissement'})`,
        recipientGroup: 'ENSEIGNANTS',
        subject: `⚡ Rappel Direction : Programmation des devoirs Quiz Week du Week-end`,
        content: `Chers enseignants, la Direction rappelle l'importance de préparer et publier les devoirs Quiz Week avec corrigé type officiel, barème et consignes de clémence pour l'évaluation IA. Les devoirs non encore programmés pour vos classes doivent être déposés avant ce soir.`,
        channels: ['SMS', 'WHATSAPP'],
        sentAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'LIVRE'
      });

      setShowRelaunchModal(false);
      setNotificationMsg(`Relance officielle envoyée avec succès à ${laggingTeachers.length} enseignant(s) !`);
      setTimeout(() => setNotificationMsg(null), 5000);
    } catch (e) {
      alert("Erreur lors de l'envoi de la relance.");
    }
  };

  // Handle Emergency Create Quiz by Director
  const handleCreateByDirector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || (!newContent.trim() && !newAttachedExerciseFileUrl) || (!newOfficialAnswerKey.trim() && !newAttachedAnswerKeyFileUrl)) {
      alert("Veuillez renseigner le titre, ainsi que le sujet (texte ou photo) et le corrigé type officiel (texte ou photo).");
      return;
    }

    const tObj = teachers.find(t => t.id === newTeacherId);
    const cObj = classes.find(c => c.id === newClassId);
    const sObj = subjects.find(s => s.id === newSubjectId);

    const created = addQuizWeek({
      schoolId: currentSchool.id,
      title: newTitle.trim(),
      classId: newClassId,
      className: cObj?.name || 'Classe',
      subjectId: newSubjectId,
      subjectName: sObj?.name || 'Matière',
      teacherId: newTeacherId,
      teacherName: tObj ? `${tObj.firstName} ${tObj.lastName}` : 'Professeur Titulaire',
      teacherPhone: tObj?.phone,
      weekendTargetDate: 'Ce week-end',
      deadline: newDeadline.trim() || 'Dimanche soir',
      instructions: "Devoir de week-end programmé par la Direction en coordination avec le corps enseignant. Renvoyez votre copie (photo scannée ou saisie directe) pour débloquer le corrigé type officiel et le barème.",
      content: newContent.trim() || (newAttachedExerciseFileUrl ? "Énoncé et sujet des exercices fournis en photo / document ci-joint." : "Exercices du week-end"),
      attachedExerciseFileUrl: newAttachedExerciseFileUrl || undefined,
      attachedExerciseFileName: newAttachedExerciseFileName || (newAttachedExerciseFileUrl ? 'Épreuve_Photo.jpg' : undefined),
      officialAnswerKey: newOfficialAnswerKey.trim() || (newAttachedAnswerKeyFileUrl ? "Corrigé type officiel détaillé fourni en photo / document ci-joint." : "Corrigé type en attente"),
      attachedAnswerKeyFileUrl: newAttachedAnswerKeyFileUrl || undefined,
      attachedAnswerKeyFileName: newAttachedAnswerKeyFileName || (newAttachedAnswerKeyFileUrl ? 'Corrigé_Type_Photo.jpg' : undefined),
      gradingScale: newGradingScale.trim() || 'Sur 20 points',
      teacherAiInstructions: newTeacherAiInstructions.trim() || undefined,
      totalPoints: newTotalPoints || 20,
      status: 'ACTIF',
      directorApprovalStatus: 'APPROUVE',
      directorNotes: 'Devoir officiel validé et publié sous supervision de la Direction.',
      directorApprovedAt: new Date().toISOString(),
      directorApprovedBy: currentUser?.name || 'Chef d\'Établissement'
    });

    setShowCreateModal(false);
    // Reset Form
    setNewTitle('');
    setNewContent('');
    setNewAttachedExerciseFileUrl('');
    setNewAttachedExerciseFileName('');
    setNewOfficialAnswerKey('');
    setNewAttachedAnswerKeyFileUrl('');
    setNewAttachedAnswerKeyFileName('');
    setNotificationMsg(`Nouveau Quiz Week "${created.title}" créé et approuvé avec succès pour la classe de ${cObj?.name} !`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Header */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-6 sm:p-8 text-white border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wide">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>ESPACE DIRECTION & INSPECTION PÉDAGOGIQUE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Supervision & Contrôle des Quiz Week</span>
              <Sparkles className="w-7 h-7 text-amber-400 shrink-0 animate-pulse" />
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Contrôlez et supervisez l'ensemble des devoirs du week-end déposés par vos professeurs.
              Vérifiez la pertinence des <strong className="text-emerald-400">corrigés types</strong>, des <strong className="text-amber-400">barèmes détaillés</strong> et des <strong className="text-indigo-400">consignes de clémence IA</strong> (valorisation des approches de réponses), apposez le visa de la Direction et suivez la participation de chaque classe.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {laggingTeachers.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRelaunchModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Relancer {laggingTeachers.length} prof(s) en retard</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Quiz (Aide Direction)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer shadow"
              title="Imprimer le compte-rendu de supervision"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification message */}
      {notificationMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-bold flex items-center justify-between animate-scaleIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="p-1 text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Platform Window Mode Switch: Contrôle Direction vs Espace Professeurs */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          type="button"
          onClick={() => setSupervisionTab('SUPERVISION')}
          className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            supervisionTab === 'SUPERVISION'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-300" />
          <span>Contrôle & Visa Direction (Chef d'Établissement)</span>
          <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-extrabold text-amber-300">
            {schoolQuizWeeks.length} devoirs
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSupervisionTab('TEACHER_MANAGEMENT')}
          className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            supervisionTab === 'TEACHER_MANAGEMENT'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-emerald-300" />
          <span>Espace Professeurs & Dépôt des Devoirs (Photos & Corrigés)</span>
        </button>
      </div>

      {supervisionTab === 'TEACHER_MANAGEMENT' ? (
        <div className="rounded-3xl bg-slate-950 p-1 sm:p-2 border border-slate-800">
          <TeacherQuizWeekTab currentTeacher={teachers[0] || { id: 'teacher-dir', firstName: 'Direction', lastName: 'Pédagogique', subjects: [], classIds: [] }} />
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Devoirs */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider">Devoirs Quiz Week</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.total}</div>
          <p className="text-[11px] text-slate-400">
            {stats.coveredClassesCount} / {stats.totalClassesCount} classes couvertes ({stats.classCoverageRate}%)
          </p>
        </div>

        {/* Visas Direction */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider">Visas Direction</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-400">{stats.approved}</span>
            <span className="text-xs text-slate-400">validés</span>
          </div>
          <p className="text-[11px] text-amber-300 font-bold">
            {stats.pending} en attente • {stats.toReview} à revoir
          </p>
        </div>

        {/* Engagement Professeurs */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider">Professeurs Actifs</span>
            <GraduationCap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats.activeTeachersCount} <span className="text-xs text-slate-400">/ {stats.totalTeachersCount}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Taux d'engagement : <strong className="text-amber-400">{stats.teacherEngagementRate}%</strong>
          </p>
        </div>

        {/* Copies Rendues */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider">Copies Reçues</span>
            <Camera className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalSubmissions}</div>
          <p className="text-[11px] text-slate-400">
            <strong className="text-purple-300">{stats.totalAiEvaluated}</strong> notées par l'IA
          </p>
        </div>

        {/* Moyenne Établissement */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider">Moyenne Globale</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats.averageGrade} <span className="text-xs text-slate-400">/ 20</span>
          </div>
          <p className="text-[11px] text-emerald-400 font-bold">
            {stats.totalGraded} copies finalisées
          </p>
        </div>
      </div>

      {/* Lagging teachers alert panel */}
      {laggingTeachers.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-950/20 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide">
                Alerte de Direction : {laggingTeachers.length} professeur(s) n'ont pas encore programmé de Quiz Week
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Enseignants concernés : {laggingTeachers.map(t => `${t.firstName} ${t.lastName} (${(t.subjects || []).join(', ') || 'Enseignant'})`).slice(0, 4).join(' • ')}
                {laggingTeachers.length > 4 && ` et ${laggingTeachers.length - 4} autre(s)...`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRelaunchModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow shrink-0 cursor-pointer self-start md:self-auto"
          >
            Envoyer un Rappel de Direction
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-xs font-black text-slate-300 uppercase tracking-wide">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Filtres de Contrôle Pédagogique</span>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            {filteredQuizWeeks.length} devoir(s) affiché(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Teacher Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Professeur</label>
            <select
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tous les professeurs ({teachers.length})</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Classe</label>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Toutes les classes ({classes.length})</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Matière</label>
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Toutes les matières ({subjects.length})</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Approval Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Visa Direction</label>
            <select
              value={filterApprovalStatus}
              onChange={(e) => setFilterApprovalStatus(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tous les statuts de visa</option>
              <option value="APPROUVE">✅ Approuvé par la Direction</option>
              <option value="EN_ATTENTE">⏳ En attente de visa</option>
              <option value="A_REVOIR">⚠️ Marqué À revoir</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Recherche</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Titre, sujet, prof..."
                className="w-full py-2 pl-8 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main List of Quizzes for Supervision */}
      {filteredQuizWeeks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-black text-white">Aucun devoir Quiz Week ne correspond aux filtres</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Ajustez vos filtres ou créez directement un nouveau Quiz Week pour une classe au nom de l'équipe pédagogique.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5">
          {filteredQuizWeeks.map((quiz) => {
            const classObj = classes.find(c => c.id === quiz.classId);
            const totalStudentsInClass = classObj ? (classObj.studentCount || 35) : 35;
            const subs = quiz.submissions || [];
            const submissionsCount = subs.length;
            const reviewedCount = subs.filter(s => s.status === 'CORRIGE').length;
            const aiCount = subs.filter(s => s.aiScore !== undefined).length;
            const submissionRate = Math.min(100, Math.round((submissionsCount / totalStudentsInClass) * 100));

            const visaStatus = quiz.directorApprovalStatus || 'EN_ATTENTE';

            return (
              <div
                key={quiz.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col"
              >
                {/* Card Top Row */}
                <div className="p-5 sm:p-6 bg-slate-900/90 border-b border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Visa Badge */}
                      {visaStatus === 'APPROUVE' ? (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center gap-1.5 border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Approuvé par la Direction</span>
                        </span>
                      ) : visaStatus === 'A_REVOIR' ? (
                        <span className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-300 font-black text-xs flex items-center gap-1.5 border border-red-500/40">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          <span>À Revoir par le Professeur</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs flex items-center gap-1.5 border border-amber-500/40">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>En attente de visa Direction</span>
                        </span>
                      )}

                      <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold text-xs">
                        🏫 {quiz.className}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-teal-500/20 text-teal-300 font-bold text-xs">
                        📚 {quiz.subjectName}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs">
                        🎯 Barème : {quiz.totalPoints} pts
                      </span>

                      {quiz.teacherAiInstructions && (
                        <span className="px-2 py-0.5 rounded-xl bg-emerald-500/10 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>Clémence IA active</span>
                        </span>
                      )}
                    </div>

                    {/* Quiz Title & Teacher info */}
                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <span>{quiz.title}</span>
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-200 font-bold">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Prof. {quiz.teacherName}</span>
                      </span>
                      <span>•</span>
                      <span>📅 {quiz.weekendTargetDate}</span>
                      <span>•</span>
                      <span className="text-amber-300 font-bold">⏰ Deadline : {quiz.deadline}</span>
                    </div>

                    {/* Director remarks if present */}
                    {quiz.directorNotes && (
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-300 font-bold">Visa / Avis de Direction : </strong>
                          <span className="italic">« {quiz.directorNotes} »</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right side stats & action */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                    <div className="text-left lg:text-right space-y-1">
                      <div className="text-xs font-black text-white flex items-center lg:justify-end gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{submissionsCount} / {totalStudentsInClass} copies rendues ({submissionRate}%)</span>
                      </div>
                      <div className="w-36 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-1.5 rounded-full"
                          style={{ width: `${submissionRate}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {reviewedCount} notées par prof • {aiCount} analysées IA
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAudit(quiz)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspecter & Viser le Devoir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Confirmez-vous la suppression du Quiz Week "${quiz.title}" ?`)) {
                            deleteQuizWeek(quiz.id);
                            setNotificationMsg(`Quiz Week "${quiz.title}" supprimé.`);
                            setTimeout(() => setNotificationMsg(null), 3000);
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all cursor-pointer border border-slate-700"
                        title="Supprimer ce devoir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: AUDIT PÉDAGOGIQUE APPROFONDI PAR LE CHEF D'ÉTABLISSEMENT       */}
      {/* ========================================================================= */}
      {auditingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full flex flex-col shadow-2xl overflow-hidden my-auto animate-scaleIn max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 z-20">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-[10px] uppercase tracking-wider border border-indigo-500/30">
                    Contrôle Pédagogique Direction
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {auditingQuiz.className} • Prof. {auditingQuiz.teacherName}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">{auditingQuiz.title}</h3>
              </div>

              <button
                type="button"
                onClick={() => setAuditingQuiz(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs Navigation */}
            <div className="flex border-b border-slate-800 bg-slate-950/70 px-4 sm:px-6">
              {[
                { id: 'SUJET', label: '1. Sujet & Exercices', icon: FileText },
                { id: 'CORRIGE', label: '2. Corrigé, Barème & Clémence IA', icon: Award },
                { id: 'COPIES', label: `3. Copies Élèves (${(auditingQuiz.submissions || []).length})`, icon: Users },
                { id: 'STATS', label: '4. Synthèse Pédagogique', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = auditSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setAuditSubTab(tab.id as any);
                      setSelectedStudentSub(null);
                    }}
                    className={`py-3 px-3 sm:px-4 text-xs font-black flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'border-indigo-500 text-indigo-300 bg-indigo-950/30'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* ============================================================== */}
              {/* SUBTAB 1: SUJET ET ÉNONCÉ DES EXERCICES                        */}
              {/* ============================================================== */}
              {auditSubTab === 'SUJET' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-bold mb-0.5">Instructions données aux élèves :</strong>
                      <p>{auditingQuiz.instructions || "Effectuez les exercices avec rigueur."}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-300 uppercase tracking-wide">
                        Énoncé Complet de l'Épreuve
                      </h4>
                      {auditingQuiz.attachedExerciseFileUrl && (
                        <button
                          type="button"
                          onClick={() => setActiveLightboxPhoto({ url: auditingQuiz.attachedExerciseFileUrl!, title: `Épreuve : ${auditingQuiz.title}` })}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>📸 Agrandir la photo de l'épreuve</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Photo Preview of the Épreuve */}
                    {auditingQuiz.attachedExerciseFileUrl && (auditingQuiz.attachedExerciseFileUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(auditingQuiz.attachedExerciseFileUrl)) && (
                      <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30 bg-black/60 group">
                        <img
                          src={auditingQuiz.attachedExerciseFileUrl}
                          alt="Photo du sujet"
                          className="w-full max-h-96 object-contain rounded-2xl cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => setActiveLightboxPhoto({ url: auditingQuiz.attachedExerciseFileUrl!, title: `Épreuve : ${auditingQuiz.title}` })}
                        />
                        <div className="absolute bottom-2 right-2 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md text-xs text-white font-bold pointer-events-none flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Cliquer pour zoomer en plein écran</span>
                        </div>
                      </div>
                    )}

                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed shadow-inner max-h-96 overflow-y-auto">
                      {auditingQuiz.content}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* SUBTAB 2: CORRIGÉ TYPE, BARÈME & VISA DE DIRECTION             */}
              {/* ============================================================== */}
              {auditSubTab === 'CORRIGE' && (
                <div className="space-y-6">
                  {/* Corrigé & Barème Side-by-Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Corrigé type */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Corrigé Type Officiel de l'Enseignant</span>
                        </h4>
                        {auditingQuiz.attachedAnswerKeyFileUrl && (
                          <button
                            type="button"
                            onClick={() => setActiveLightboxPhoto({ url: auditingQuiz.attachedAnswerKeyFileUrl!, title: `Corrigé Type Officiel : ${auditingQuiz.title}` })}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Eye className="w-3 h-3" />
                            <span>📸 Agrandir photo corrigé</span>
                          </button>
                        )}
                      </div>

                      {/* Inline Photo Preview of the Corrigé */}
                      {auditingQuiz.attachedAnswerKeyFileUrl && (auditingQuiz.attachedAnswerKeyFileUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(auditingQuiz.attachedAnswerKeyFileUrl)) && (
                        <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-black/60 group">
                          <img
                            src={auditingQuiz.attachedAnswerKeyFileUrl}
                            alt="Photo du corrigé"
                            className="w-full max-h-60 object-contain rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => setActiveLightboxPhoto({ url: auditingQuiz.attachedAnswerKeyFileUrl!, title: `Corrigé Type Officiel : ${auditingQuiz.title}` })}
                          />
                          <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-[10px] text-emerald-300 font-bold pointer-events-none flex items-center gap-1">
                            <Eye className="w-3 h-3 text-emerald-400" />
                            <span>Zoomer</span>
                          </div>
                        </div>
                      )}

                      <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 text-emerald-100 text-xs font-mono whitespace-pre-wrap leading-relaxed h-64 overflow-y-auto">
                        {auditingQuiz.officialAnswerKey}
                      </div>
                    </div>

                    {/* Barème officiel */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        <span>Barème Officiel de Notation ({auditingQuiz.totalPoints} pts)</span>
                      </h4>
                      <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 text-amber-100 text-xs font-mono whitespace-pre-wrap leading-relaxed h-64 overflow-y-auto">
                        {auditingQuiz.gradingScale}
                      </div>
                    </div>
                  </div>

                  {/* Consignes de clémence IA */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Consignes & Directives de Clémence données à l'IA pour la notation</span>
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        Valorisation des démarches
                      </span>
                    </div>
                    <p className="text-xs text-indigo-100 italic bg-slate-950/70 p-3 rounded-xl border border-indigo-500/20 leading-relaxed">
                      « {auditingQuiz.teacherAiInstructions || "Le professeur demande de faire preuve de bienveillance et de valoriser les approches et démarches de réponse."} »
                    </p>
                  </div>

                  {/* FORMULAIRE DE VISA ET CONTRÔLE PAR LE CHEF D'ÉTABLISSEMENT */}
                  <div className="p-5 rounded-2xl bg-slate-950 border-2 border-indigo-500/50 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-xs font-black text-white uppercase tracking-wide">
                          Visa de Contrôle & Décision du Chef d'Établissement
                        </h4>
                      </div>
                      {visaSaveSuccess && (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                          <Check className="w-3.5 h-3.5" />
                          <span>Décision enregistrée !</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          Statut de Validation par la Direction :
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setDirectorVisaStatus('APPROUVE')}
                            className={`p-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                              directorVisaStatus === 'APPROUVE'
                                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            <span>Approuver le Devoir</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDirectorVisaStatus('EN_ATTENTE')}
                            className={`p-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                              directorVisaStatus === 'EN_ATTENTE'
                                ? 'bg-amber-600 text-white border-amber-400 shadow-lg'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            <Clock className="w-4 h-4 text-amber-300" />
                            <span>En Attente de Visa</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDirectorVisaStatus('A_REVOIR')}
                            className={`p-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                              directorVisaStatus === 'A_REVOIR'
                                ? 'bg-red-600 text-white border-red-400 shadow-lg'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            <AlertCircle className="w-4 h-4 text-red-300" />
                            <span>À Revoir (Remarques)</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Avis, Recommandations ou Observations Pédagogiques de la Direction :
                        </label>
                        <textarea
                          rows={3}
                          value={directorVisaNotes}
                          onChange={(e) => setDirectorVisaNotes(e.target.value)}
                          placeholder="Ex: Sujet conforme au programme du trimestre. Barème équitable. Penser à rappeler la formule de Thalès avant l'examen..."
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleSaveDirectorVisa}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Enregistrer le Visa de Direction</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* SUBTAB 3: COPIES DES ÉLÈVES & SUIVI DE LA CLASSE               */}
              {/* ============================================================== */}
              {auditSubTab === 'COPIES' && (
                <div className="space-y-4">
                  {selectedStudentSub ? (
                    /* Detailed View for a Single Student's Submission */
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                            {selectedStudentSub.studentName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white">{selectedStudentSub.studentName}</h4>
                            <p className="text-xs text-slate-400">
                              Rendu le {new Date(selectedStudentSub.submission.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedStudentSub(null)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                        >
                          ← Retour à la liste de la classe
                        </button>
                      </div>

                      {/* Student's answer (Scan or Direct) */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-xs font-black text-slate-300 uppercase tracking-wide">
                          Copie Rémise par l'Élève :
                        </span>
                        {selectedStudentSub.submission.submissionType === 'SCAN' && selectedStudentSub.submission.scannedFileUrl ? (
                          <div className="text-center">
                            <img
                              src={selectedStudentSub.submission.scannedFileUrl}
                              alt="Scan élève"
                              className="max-h-80 mx-auto rounded-xl object-contain border border-slate-800"
                            />
                            <div className="pt-2">
                              <a
                                href={selectedStudentSub.submission.scannedFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Ouvrir la photo haute résolution</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono whitespace-pre-wrap">
                            {selectedStudentSub.submission.directAnswer || "Aucun texte saisi."}
                          </div>
                        )}
                      </div>

                      {/* AI Evaluation Review */}
                      {selectedStudentSub.submission.aiScore !== undefined && (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/40 border border-indigo-500/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Sparkles className="w-4 h-4 text-amber-400" />
                              <span className="text-xs font-black text-white uppercase tracking-wide">
                                Évaluation & Observations de l'IA (Avec Clémence)
                              </span>
                            </div>
                            <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm">
                              Note IA : {selectedStudentSub.submission.aiScore} / {auditingQuiz.totalPoints}
                            </span>
                          </div>

                          {selectedStudentSub.submission.aiFeedback && (
                            <p className="text-xs text-indigo-100 bg-indigo-950/40 p-3 rounded-xl border border-indigo-500/20 leading-relaxed">
                              {selectedStudentSub.submission.aiFeedback}
                            </p>
                          )}

                          {/* Strengths & Improvements */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                              <span className="font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approches réussies :</span>
                              </span>
                              <ul className="space-y-1 text-[11px] text-emerald-100">
                                {(selectedStudentSub.submission.aiStrengths || ["Démarche amorcée"]).map((s, idx) => (
                                  <li key={idx}>• {s}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                              <span className="font-bold text-amber-300 flex items-center gap-1">
                                <Target className="w-3.5 h-3.5 text-amber-400" />
                                <span>Pistes d'amélioration :</span>
                              </span>
                              <ul className="space-y-1 text-[11px] text-amber-100">
                                {(selectedStudentSub.submission.aiAreasForImprovement || ["Revoir la rédaction"]).map((imp, idx) => (
                                  <li key={idx}>• {imp}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Teacher Final Evaluation if graded */}
                      {selectedStudentSub.submission.status === 'CORRIGE' && (
                        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-wide block">
                              Note Finale Décidée par le Professeur :
                            </span>
                            <p className="text-xs text-emerald-100 italic mt-0.5">
                              « {selectedStudentSub.submission.teacherFeedback || "Travail vérifié."} »
                            </p>
                          </div>
                          <span className="text-xl font-black text-emerald-300 shrink-0">
                            {selectedStudentSub.submission.teacherScore} / {auditingQuiz.totalPoints}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Class Submissions List */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-black text-slate-400">
                        <span>Élèves ayant soumis leur devoir ({(auditingQuiz.submissions || []).length})</span>
                        <span className="text-emerald-400">Cliquez sur une copie pour voir le détail</span>
                      </div>

                      {(auditingQuiz.submissions || []).length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                          Aucun élève de cette classe n'a encore transmis sa copie pour ce Quiz Week.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(auditingQuiz.submissions || []).map((sub) => {
                            const isGraded = sub.status === 'CORRIGE';

                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => setSelectedStudentSub({ studentName: sub.studentName, submission: sub })}
                                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <span className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors block">
                                      {sub.studentName}
                                    </span>
                                    <span className="text-[11px] text-slate-400 block">
                                      {sub.submissionType === 'SCAN' ? '📸 Copie Scannée' : '✍️ Réponse en ligne'}
                                    </span>
                                  </div>

                                  {isGraded ? (
                                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-black text-xs shrink-0 flex items-center gap-1">
                                      <Award className="w-3.5 h-3.5" />
                                      <span>{sub.teacherScore} / {auditingQuiz.totalPoints}</span>
                                    </span>
                                  ) : sub.aiScore !== undefined ? (
                                    <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-black text-xs shrink-0 flex items-center gap-1 border border-indigo-500/30">
                                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                      <span>IA: {sub.aiScore} / {auditingQuiz.totalPoints}</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                      En attente
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                                  <span>Rendu le {new Date(sub.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                  <span className="text-indigo-400 font-bold group-hover:underline">Examiner la copie →</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* SUBTAB 4: STATISTIQUES ET SYNTHÈSE DE CLASSE                   */}
              {/* ============================================================== */}
              {auditSubTab === 'STATS' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Copies Rendues</span>
                      <div className="text-xl font-black text-white">{(auditingQuiz.submissions || []).length}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Évaluées par IA</span>
                      <div className="text-xl font-black text-indigo-400">
                        {(auditingQuiz.submissions || []).filter(s => s.aiScore !== undefined).length}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Validées par Prof</span>
                      <div className="text-xl font-black text-emerald-400">
                        {(auditingQuiz.submissions || []).filter(s => s.status === 'CORRIGE').length}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Barème Total</span>
                      <div className="text-xl font-black text-amber-400">{auditingQuiz.totalPoints} pts</div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                    <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wide">
                      Recommandation de la Direction pour le Conseil Pédagogique
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Ce devoir de week-end permet d'ancrer les apprentissages réguliers chez les élèves de <strong className="text-white">{auditingQuiz.className}</strong>.
                      La reconnaissance des approches de réponses et la clémence de l'IA garantissent un encouragement positif tout en repérant les élèves ayant besoin d'un renforcement méthodologique.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900 sticky bottom-0">
              <span className="text-xs text-slate-400">
                Statut actuel : <strong className="text-white">{auditingQuiz.directorApprovalStatus || 'En attente'}</strong>
              </span>

              <button
                type="button"
                onClick={() => setAuditingQuiz(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RELANCE DES PROFESSEURS EN RETARD                                */}
      {/* ========================================================================= */}
      {showRelaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BellRing className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Relance de Direction — Quiz Week</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRelaunchModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Les <strong className="text-amber-300">{laggingTeachers.length} enseignant(s)</strong> ci-dessous n'ont pas encore programmé de Quiz Week pour leurs classes :
              </p>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 max-h-40 overflow-y-auto space-y-1.5">
                {laggingTeachers.map(t => (
                  <div key={t.id} className="text-xs text-slate-300 flex items-center justify-between">
                    <span className="font-bold">• {t.firstName} {t.lastName}</span>
                    <span className="text-slate-500 text-[11px]">{(t.subjects || []).join(', ') || 'Enseignant'}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                💡 Un SMS & WhatsApp officiel de rappel sera expédié aux professeurs avec invitation à publier leur corrigé type et barème.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowRelaunchModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleRelaunchTeachers}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Envoyer la Relance Officielle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CRÉATION D'UN QUIZ WEEK PAR LA DIRECTION (Aide / Remplacement)  */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden my-auto animate-scaleIn max-h-[90vh]">
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 z-20">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Publication par le Chef d'Établissement
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">Nouveau Quiz Week de Direction</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateByDirector} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Teacher, Class, Subject Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Professeur Attribué *</label>
                  <select
                    value={newTeacherId}
                    onChange={(e) => setNewTeacherId(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Classe Destinataire *</label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Discipline / Matière *</label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Titre du Devoir Quiz Week *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Devoir de Synthèse - Théorème de Thalès & Équations"
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Deadline Remise</label>
                  <input
                    type="text"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    placeholder="Dimanche 20h00"
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Subject Content & Photo */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Énoncé des Exercices *</label>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow">
                    <Camera className="w-3.5 h-3.5 text-amber-300" />
                    <span>📸 Photo Épreuve</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setNewAttachedExerciseFileUrl, setNewAttachedExerciseFileName)}
                    />
                  </label>
                </div>

                {newAttachedExerciseFileUrl && (
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-indigo-200 font-bold truncate">Photo épreuve : {newAttachedExerciseFileName || 'Photo_Epreuve.jpg'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewAttachedExerciseFileUrl('');
                          setNewAttachedExerciseFileName('');
                        }}
                        className="text-red-400 hover:text-red-300 text-[10px] font-bold"
                      >
                        Retirer
                      </button>
                    </div>
                    {newAttachedExerciseFileUrl.startsWith('data:image') && (
                      <img
                        src={newAttachedExerciseFileUrl}
                        alt="Photo épreuve"
                        className="w-full max-h-32 object-contain rounded-lg border border-indigo-500/30 bg-black/40"
                      />
                    )}
                  </div>
                )}

                <textarea
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={newAttachedExerciseFileUrl ? "Optionnel : précisions complémentaires ou énoncé en photo..." : "Saisissez les exercices à traiter pendant le weekend..."}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                  required={!newAttachedExerciseFileUrl}
                />
              </div>

              {/* Answer Key & Photo */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-400">Corrigé Type Officiel * (Masqué aux élèves)</label>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow">
                    <Camera className="w-3.5 h-3.5" />
                    <span>📸 Photo Corrigé</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setNewAttachedAnswerKeyFileUrl, setNewAttachedAnswerKeyFileName)}
                    />
                  </label>
                </div>

                {newAttachedAnswerKeyFileUrl && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-300 font-bold truncate">Photo corrigé : {newAttachedAnswerKeyFileName || 'Photo_Corrige.jpg'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewAttachedAnswerKeyFileUrl('');
                          setNewAttachedAnswerKeyFileName('');
                        }}
                        className="text-red-400 hover:text-red-300 text-[10px] font-bold"
                      >
                        Retirer
                      </button>
                    </div>
                    {newAttachedAnswerKeyFileUrl.startsWith('data:image') && (
                      <img
                        src={newAttachedAnswerKeyFileUrl}
                        alt="Photo corrigé"
                        className="w-full max-h-32 object-contain rounded-lg border border-emerald-500/30 bg-black/40"
                      />
                    )}
                  </div>
                )}

                <textarea
                  rows={3}
                  value={newOfficialAnswerKey}
                  onChange={(e) => setNewOfficialAnswerKey(e.target.value)}
                  placeholder={newAttachedAnswerKeyFileUrl ? "Optionnel : corrigé type en photo..." : "Rédigez les solutions détaillées question par question..."}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs font-mono text-emerald-100 focus:outline-none focus:border-emerald-500 leading-relaxed"
                  required={!newAttachedAnswerKeyFileUrl}
                />
              </div>

              {/* Rubric */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-amber-300 mb-1">Barème Détaillé *</label>
                  <textarea
                    rows={3}
                    value={newGradingScale}
                    onChange={(e) => setNewGradingScale(e.target.value)}
                    placeholder="Ex 1 = 10 pts, Ex 2 = 10 pts..."
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-amber-500/30 text-xs font-mono text-amber-100 focus:outline-none focus:border-amber-500 leading-relaxed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">Total Points</label>
                  <input
                    type="number"
                    value={newTotalPoints}
                    onChange={(e) => setNewTotalPoints(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Leniency Instructions */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <label className="block text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Directives de Clémence & Approches de réponses pour l'IA</span>
                </label>
                <textarea
                  rows={2}
                  value={newTeacherAiInstructions}
                  onChange={(e) => setNewTeacherAiInstructions(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-indigo-500/40 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publier et Viser le Quiz Week</span>
                </button>
              </div>
            </form>
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
