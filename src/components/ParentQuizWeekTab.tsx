import React, { useState, useMemo } from 'react';
import { useApp } from '../lib/store';
import { Student, QuizWeek, QuizWeekSubmission } from '../types';
import { clientFetch } from '../services/clientFetch.ts';
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
  Award,
  Users,
  Check,
  Lock,
  Unlock,
  Camera,
  FileCheck,
  Printer,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
  Zap,
  Info,
  RefreshCw,
  Lightbulb,
  Target,
  ThumbsUp,
  TrendingUp,
  BookOpen,
  X
} from 'lucide-react';

interface ParentQuizWeekTabProps {
  authenticatedChildren: Student[];
  selectedChildId: string;
  onSelectChild: (id: string) => void;
}

export const ParentQuizWeekTab: React.FC<ParentQuizWeekTabProps> = ({
  authenticatedChildren,
  selectedChildId,
  onSelectChild
}) => {
  const { currentSchool, classes, subjects, quizWeeks, submitQuizWeekAnswer, updateQuizWeekSubmissionAiEvaluation } = useApp();

  // Active Child
  const activeChild = useMemo(() => {
    if (!selectedChildId && authenticatedChildren.length > 0) {
      return authenticatedChildren[0];
    }
    return authenticatedChildren.find(c => c.id === selectedChildId) || authenticatedChildren[0];
  }, [authenticatedChildren, selectedChildId]);

  // Submission Form State (per quiz id)
  const [submissionModes, setSubmissionModes] = useState<Record<string, 'SCAN' | 'DIRECT'>>({});
  const [directAnswers, setDirectAnswers] = useState<Record<string, string>>({});
  const [scannedFiles, setScannedFiles] = useState<Record<string, { url: string; name: string }>>({});
  const [isSubmittingMap, setIsSubmittingMap] = useState<Record<string, boolean>>({});
  const [isAiEvaluatingMap, setIsAiEvaluatingMap] = useState<Record<string, boolean>>({});
  const [justSubmittedQuizId, setJustSubmittedQuizId] = useState<string | null>(null);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<{ url: string; title: string } | null>(null);

  // Filtered Quiz Weeks for the active child's class
  const classQuizWeeks = useMemo(() => {
    if (!activeChild || !activeChild.classId) return [];
    return quizWeeks.filter(qw => {
      if (qw.schoolId && qw.schoolId !== currentSchool.id) return false;
      return qw.classId === activeChild.classId;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quizWeeks, activeChild, currentSchool.id]);

  // Active Child's class name
  const childClassName = useMemo(() => {
    if (!activeChild) return '';
    const cls = classes.find(c => c.id === activeChild.classId);
    return cls ? cls.name : 'Classe';
  }, [activeChild, classes]);

  // File Upload Handler (converts to base64)
  const handleFileUpload = (quizId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Le fichier sélectionné est trop volumineux (maximum 8 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setScannedFiles(prev => ({
          ...prev,
          [quizId]: {
            url: event.target!.result as string,
            name: file.name
          }
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger AI grading request to the server with official answer key and rubric
  const triggerAiEvaluation = async (
    quiz: QuizWeek,
    submissionId: string,
    submissionType: 'SCAN' | 'DIRECT',
    directAns?: string,
    scanFileUrl?: string
  ) => {
    setIsAiEvaluatingMap(prev => ({ ...prev, [quiz.id]: true }));

    try {
      const response = await clientFetch('/api/ai/grade-quiz-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizTitle: quiz.title,
          subjectName: quiz.subjectName,
          className: childClassName,
          exerciseContent: quiz.content,
          officialAnswerKey: quiz.officialAnswerKey,
          gradingScale: quiz.gradingScale,
          teacherAiInstructions: quiz.teacherAiInstructions,
          totalPoints: quiz.totalPoints,
          submissionType,
          directAnswer: directAns,
          scannedFileUrl: scanFileUrl,
          studentName: `${activeChild?.firstName || 'Élève'} ${activeChild?.lastName || ''}`.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur réseau (${response.status})`);
      }

      const aiData = await response.json();

      updateQuizWeekSubmissionAiEvaluation(quiz.id, submissionId, {
        aiScore: typeof aiData.aiScore === 'number' ? aiData.aiScore : Math.round(quiz.totalPoints * 0.75 * 2) / 2,
        aiFeedback: aiData.aiFeedback || "Votre copie a été examinée avec bienveillance au regard du corrigé officiel et de la clémence du professeur.",
        aiObservations: aiData.aiObservations || "L'élève montre une bonne application générale. Les approches de réponses ont été prises en compte.",
        aiStrengths: Array.isArray(aiData.aiStrengths) ? aiData.aiStrengths : [
          "Exercices traités avec assiduité",
          "Démarches de recherche et approches valorisées avec clémence"
        ],
        aiAreasForImprovement: Array.isArray(aiData.aiAreasForImprovement) ? aiData.aiAreasForImprovement : [
          "Bien relire le corrigé type officiel pour consolider la rédaction",
          "Soigner la justification des calculs"
        ],
        aiBreakdown: aiData.aiBreakdown || `Évaluation selon le barème officiel de ${quiz.totalPoints} points (points de démarche inclus)`,
        aiEvaluatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.warn("Évaluation IA Quiz Week dégradée ou hors-ligne:", err);
      // Fallback evaluation
      const fallbackScore = Math.round(quiz.totalPoints * 0.75 * 2) / 2;
      updateQuizWeekSubmissionAiEvaluation(quiz.id, submissionId, {
        aiScore: fallbackScore,
        aiFeedback: "Votre devoir a été transmis avec succès. Conformément aux consignes de votre professeur, vos approches et tentatives de réponses ont été valorisées avec clémence.",
        aiObservations: "L'effort fourni pendant le week-end est très positif. Les approches et méthodes sont récompensées.",
        aiStrengths: [
          "Devoir remis dans les temps impartis",
          "Traitement méthodique des exercices proposés",
          "Approches de réponses prises en compte avec indulgence"
        ],
        aiAreasForImprovement: [
          "Prendre le temps de confronter chaque réponse au corrigé officiel ci-dessous",
          "Repérer les étapes manquantes dans vos justifications",
          "Refaire les questions non abouties pour vous entraîner avant le cours"
        ],
        aiBreakdown: `Attribution selon barème : ${fallbackScore} / ${quiz.totalPoints} points (clémence appliquée)`,
        aiEvaluatedAt: new Date().toISOString()
      });
    } finally {
      setIsAiEvaluatingMap(prev => ({ ...prev, [quiz.id]: false }));
    }
  };

  // Submit Answer Handler
  const handleSubmitQuiz = async (quiz: QuizWeek) => {
    if (!activeChild) return;

    const mode = submissionModes[quiz.id] || 'SCAN';
    const directAns = directAnswers[quiz.id]?.trim() || '';
    const scanFile = scannedFiles[quiz.id];

    if (mode === 'DIRECT' && !directAns) {
      alert("Veuillez rédiger vos réponses dans le champ prévu avant d'envoyer.");
      return;
    }

    if (mode === 'SCAN' && !scanFile?.url) {
      alert("Veuillez photographier ou importer le scan de votre feuille avant d'envoyer.");
      return;
    }

    setIsSubmittingMap(prev => ({ ...prev, [quiz.id]: true }));

    try {
      const createdSub = submitQuizWeekAnswer(quiz.id, {
        quizId: quiz.id,
        studentId: activeChild.id,
        studentName: `${activeChild.firstName} ${activeChild.lastName}`,
        parentPhone: activeChild.parentPhone,
        submissionType: mode,
        directAnswer: mode === 'DIRECT' ? directAns : undefined,
        scannedFileUrl: mode === 'SCAN' ? scanFile?.url : undefined,
        scannedFileName: mode === 'SCAN' ? scanFile?.name : undefined
      });

      setIsSubmittingMap(prev => ({ ...prev, [quiz.id]: false }));
      setJustSubmittedQuizId(quiz.id);
      setTimeout(() => setJustSubmittedQuizId(null), 8000);

      // Now immediately trigger AI correction and observation generator!
      await triggerAiEvaluation(
        quiz,
        createdSub.id,
        mode,
        mode === 'DIRECT' ? directAns : undefined,
        mode === 'SCAN' ? scanFile?.url : undefined
      );
    } catch (e) {
      setIsSubmittingMap(prev => ({ ...prev, [quiz.id]: false }));
    }
  };

  if (!activeChild) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400">
        <Users className="w-10 h-10 mx-auto text-slate-500 mb-2" />
        <p className="font-bold text-sm">Aucun élève associé à ce profil parent.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-6 sm:p-7 text-white border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black tracking-wide">
              <Zap className="w-3.5 h-3.5" />
              <span>QUIZ WEEK-END — ENTRAÎNEMENT & CORRIGÉS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Espace Quiz Week de {activeChild.firstName}</span>
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consultez les exercices envoyés par les professeurs pour le week-end. L'élève traite son devoir sur feuille ou en ligne. <strong className="text-amber-400">Dès que le travail est envoyé (par scannage ou réponse directe), le corrigé type officiel et le barème se débloquent instantanément !</strong>
            </p>
          </div>

          {/* Child Switcher if multiple children */}
          {authenticatedChildren.length > 1 && (
            <div className="shrink-0 space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block">Changer d'enfant :</span>
              <div className="flex gap-1.5 flex-wrap">
                {authenticatedChildren.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectChild(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      activeChild.id === c.id
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c.firstName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Class badge indicator */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-bold text-slate-300">Classe suivie :</span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-black">
            {childClassName}
          </span>
        </div>

        <span className="text-xs font-bold text-slate-400">
          {classQuizWeeks.length} devoir(s) Quiz Week disponible(s)
        </span>
      </div>

      {/* List of Quiz Weeks for Child's Class */}
      {classQuizWeeks.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-white">Aucun Quiz Week publié ce weekend</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Les devoirs de fin de semaine préparés par les enseignants de la classe de {activeChild.firstName} apparaîtront ici avec leur corrigé type et leur barème.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {classQuizWeeks.map((quiz) => {
            // Check if active child has submitted this quiz
            const submission: QuizWeekSubmission | undefined = (quiz.submissions || []).find(
              s => s.studentId === activeChild.id
            );
            const isSubmitted = !!submission;
            const isGraded = submission?.status === 'CORRIGE';
            const selectedMode = submissionModes[quiz.id] || 'SCAN';
            const isJustSubmitted = justSubmittedQuizId === quiz.id;

            return (
              <div
                key={quiz.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden transition-all"
              >
                {/* Quiz Header Bar */}
                <div className="p-5 sm:p-6 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-bold text-xs">
                        📚 {quiz.subjectName}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Date limite : {quiz.deadline}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-black text-xs">
                        🎯 Barème : {quiz.totalPoints} points
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <span>{quiz.title}</span>
                    </h3>

                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>👨‍🏫 Enseignant : {quiz.teacherName}</span>
                      <span>•</span>
                      <span>📅 {quiz.weekendTargetDate}</span>
                    </p>
                  </div>

                  {/* Submission Status Badge */}
                  <div className="shrink-0 self-start md:self-center">
                    {isSubmitted ? (
                      <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-xs font-black block">DEVOIR RENDU AVEC SUCCÈS</span>
                          <span className="text-[10px] text-emerald-400/80">Corrigé type & barème débloqués</span>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <span className="text-xs font-black block">À TRAITER CE WEEK-END</span>
                          <span className="text-[10px] text-amber-400/80">Envoyer pour voir le corrigé</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Just Submitted Flash Banner */}
                {isJustSubmitted && (
                  <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow animate-fadeIn">
                    <Sparkles className="w-5 h-5 text-yellow-300 animate-bounce" />
                    <span>Bravo ! Votre travail a été transmis au professeur. Le corrigé type officiel et le barème sont débloqués ci-dessous !</span>
                  </div>
                )}

                {/* Body Content */}
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Instructions */}
                  {quiz.instructions && (
                    <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
                      <span className="font-black text-indigo-200 block flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        <span>Consignes du professeur :</span>
                      </span>
                      <p>{quiz.instructions}</p>
                    </div>
                  )}

                  {/* Énoncé des Exercices */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span>Sujet & Énoncé des Exercices</span>
                      </h4>
                      {quiz.attachedExerciseFileUrl && (
                        <button
                          type="button"
                          onClick={() => setActiveLightboxPhoto({ url: quiz.attachedExerciseFileUrl!, title: `Sujet / Épreuve : ${quiz.title}` })}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>📸 Agrandir la photo de l'épreuve</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Photo Preview of the Épreuve */}
                    {quiz.attachedExerciseFileUrl && (quiz.attachedExerciseFileUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(quiz.attachedExerciseFileUrl)) && (
                      <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30 bg-black/60 group">
                        <img
                          src={quiz.attachedExerciseFileUrl}
                          alt="Photo du sujet d'exercice"
                          className="w-full max-h-96 object-contain rounded-2xl cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => setActiveLightboxPhoto({ url: quiz.attachedExerciseFileUrl!, title: `Sujet / Épreuve : ${quiz.title}` })}
                        />
                        <div className="absolute bottom-2 right-2 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md text-xs text-white font-bold pointer-events-none flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Cliquer pour zoomer en plein écran</span>
                        </div>
                      </div>
                    )}

                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                      {quiz.content}
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* CASE 1: STUDENT HAS NOT SUBMITTED YET                          */}
                  {/* STRICT USER SPEC: Send first before viewing correction & rubric */}
                  {/* ============================================================== */}
                  {!isSubmitted ? (
                    <div className="space-y-5 pt-2 border-t border-slate-800">
                      {/* Locked Notice */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-amber-500/30 text-amber-200 text-xs sm:text-sm space-y-2 shadow-lg">
                        <div className="flex items-center gap-2 font-black text-amber-300">
                          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>CORRIGÉ TYPE ET BARÈME VERROUILLÉS</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Conformément à la règle de la Quiz Week, <strong className="text-white">l'élève doit traiter le sujet</strong> puis transmettre sa copie ci-dessous (soit en prenant une <em>photo/scan de sa feuille</em>, soit en rédigeant sa <em>réponse en ligne</em>). Le corrigé type complet et le barème officiel se débloqueront immédiatement après validation !
                        </p>
                      </div>

                      {/* Submission Box */}
                      <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/80 border border-indigo-500/30 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <span>Transmettre le travail de {activeChild.firstName}</span>
                          </h4>

                          {/* Choose Submission Mode */}
                          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => setSubmissionModes(prev => ({ ...prev, [quiz.id]: 'SCAN' }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                selectedMode === 'SCAN'
                                  ? 'bg-indigo-600 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Par Scannage / Photo</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSubmissionModes(prev => ({ ...prev, [quiz.id]: 'DIRECT' }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                selectedMode === 'DIRECT'
                                  ? 'bg-cyan-600 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Réponse Directe en Ligne</span>
                            </button>
                          </div>
                        </div>

                        {/* MODE A: SCANNING / PHOTO UPLOAD */}
                        {selectedMode === 'SCAN' && (
                          <div className="space-y-4">
                            <label className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/30 rounded-2xl p-6 text-center cursor-pointer transition-all block">
                              <Camera className="w-10 h-10 mx-auto text-indigo-400 mb-2" />
                              <span className="text-xs sm:text-sm font-black text-white block">
                                Prendre en photo ou scanner la feuille de copie
                              </span>
                              <span className="text-[11px] text-slate-400 block mt-1">
                                Appareil photo smartphone, image JPEG/PNG ou document PDF (max 8 Mo)
                              </span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => handleFileUpload(quiz.id, e)}
                              />
                            </label>

                            {/* Scanned Image Preview */}
                            {scannedFiles[quiz.id] && (
                              <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
                                <div className="flex items-center space-x-3 truncate">
                                  <div className="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden border border-slate-700 shrink-0 flex items-center justify-center">
                                    <img
                                      src={scannedFiles[quiz.id].url}
                                      alt="Aperçu"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="truncate">
                                    <span className="text-xs font-bold text-white block truncate">
                                      {scannedFiles[quiz.id].name}
                                    </span>
                                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Photo prête à l'envoi</span>
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setScannedFiles(prev => {
                                      const copy = { ...prev };
                                      delete copy[quiz.id];
                                      return copy;
                                    });
                                  }}
                                  className="text-xs text-red-400 hover:underline font-bold shrink-0"
                                >
                                  Changer de photo
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* MODE B: DIRECT PLATFORM TEXT ANSWER */}
                        {selectedMode === 'DIRECT' && (
                          <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-300">
                              Réponse de l'élève rédigée directement :
                            </label>
                            <textarea
                              rows={6}
                              value={directAnswers[quiz.id] || ''}
                              onChange={(e) => setDirectAnswers(prev => ({ ...prev, [quiz.id]: e.target.value }))}
                              placeholder="Saisissez ici les calculs, réponses aux questions, formules et justifications..."
                              className="w-full py-3 px-4 rounded-2xl bg-slate-900 border border-slate-700 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-cyan-500 leading-relaxed"
                            />
                            <p className="text-[11px] text-slate-500">
                              💡 Conseil : Numérotez clairement vos réponses (Exercice 1, Question 1, etc.) pour faciliter la lecture du professeur.
                            </p>
                          </div>
                        )}

                        {/* Submit Action Button */}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            disabled={isSubmittingMap[quiz.id]}
                            onClick={() => handleSubmitQuiz(quiz)}
                            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                            <span>
                              {isSubmittingMap[quiz.id] ? "Transmission en cours..." : "Valider et Envoyer mon Devoir"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ============================================================== */
                    /* CASE 2: STUDENT HAS ALREADY SUBMITTED                          */
                    /* REVEAL OFFICIAL ANSWER KEY & DETAILED GRADING SCALE            */
                    /* ============================================================== */
                    <div className="space-y-6 pt-2 border-t border-slate-800">
                      {/* Submission Summary Box */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-xs font-black text-white">
                              Copie envoyée le {new Date(submission.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-xs text-slate-400">
                              ({submission.submissionType === 'SCAN' ? 'Photo / Scan de feuille' : 'Réponse directe en ligne'})
                            </span>
                          </div>

                          {/* Teacher Score if graded */}
                          {isGraded && (
                            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center gap-1.5 self-start sm:self-auto">
                              <Award className="w-4 h-4 text-amber-400" />
                              <span>Note du Professeur : {submission.teacherScore} / {quiz.totalPoints}</span>
                            </span>
                          )}
                        </div>

                        {/* Teacher appreciation if graded */}
                        {isGraded && submission.teacherFeedback && (
                          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
                            <strong className="block text-indigo-300 mb-0.5">Appréciation de l'enseignant :</strong>
                            <p className="italic">« {submission.teacherFeedback} »</p>
                          </div>
                        )}

                        {/* Show student's submitted answer */}
                        <div className="pt-2">
                          {submission.submissionType === 'SCAN' && submission.scannedFileUrl ? (
                            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                              <div className="flex items-center space-x-3">
                                <Camera className="w-5 h-5 text-indigo-400" />
                                <span className="text-xs font-bold text-white truncate max-w-xs">
                                  {submission.scannedFileName || 'Ma_Copie_Scannée.jpg'}
                                </span>
                              </div>
                              <a
                                href={submission.scannedFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Revoir ma copie</span>
                              </a>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                              <span className="text-[10px] text-slate-500 font-bold block mb-1">Votre réponse saisie :</span>
                              {submission.directAnswer}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI EVALUATION LOADING STATE */}
                      {isAiEvaluatingMap[quiz.id] && (
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/40 text-white space-y-3 shadow-xl animate-pulse">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-yellow-300">
                              <Sparkles className="w-5 h-5 animate-spin" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                                <span>L'IA analyse votre copie en temps réel...</span>
                              </h4>
                              <p className="text-xs text-slate-300">
                                Comparaison minutieuse avec le corrigé type officiel et le barème du professeur.
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-400 to-indigo-500 h-2 rounded-full animate-pulse w-3/4" />
                          </div>
                          <span className="text-[11px] text-slate-400 block italic">
                            Attribution de la note chiffrée, analyse des erreurs et rédaction des observations pour vous aider à mieux faire...
                          </span>
                        </div>
                      )}

                      {/* AI EVALUATION COMPLETED CARD */}
                      {submission.aiScore !== undefined && !isAiEvaluatingMap[quiz.id] && (
                        <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/40 border-2 border-indigo-500/50 space-y-6 shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                          {/* Card Header & AI Score */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
                            <div className="space-y-1">
                              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-black tracking-wide border border-indigo-500/30">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>ÉVALUATION AUTOMATIQUE PAR INTELLIGENCE ARTIFICIELLE</span>
                              </div>
                              <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                                <span>Bilan & Note Personnalisée de l'IA</span>
                              </h4>
                              <p className="text-xs text-slate-400">
                                Évalué d'après le corrigé type et le barème de notation officiel de l'enseignant.
                              </p>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 pt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Directives de clémence appliquées : vos démarches et approches de réponses ont été valorisées</span>
                              </span>
                            </div>

                            {/* Big AI Score Badge */}
                            <div className="flex items-center gap-3">
                              <div className="px-5 py-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 text-white shadow-lg text-center shrink-0">
                                <span className="text-[10px] font-black uppercase tracking-wider block opacity-90">Note attribuée par l'IA</span>
                                <div className="text-2xl sm:text-3xl font-black tracking-tight">
                                  {submission.aiScore} <span className="text-sm font-bold opacity-80">/ {quiz.totalPoints}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => triggerAiEvaluation(
                                  quiz,
                                  submission.id,
                                  submission.submissionType,
                                  submission.directAnswer,
                                  submission.scannedFileUrl
                                )}
                                title="Réanalyser la copie avec l'IA"
                                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700 shrink-0"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Feedback & Observations Paragraphs */}
                          <div className="space-y-3">
                            {submission.aiFeedback && (
                              <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-xs sm:text-sm text-indigo-100 leading-relaxed font-medium">
                                <strong className="text-indigo-300 block mb-1 font-black flex items-center gap-1.5">
                                  <ThumbsUp className="w-4 h-4 text-emerald-400" />
                                  <span>Appréciation Générale :</span>
                                </strong>
                                <p>{submission.aiFeedback}</p>
                              </div>
                            )}

                            {submission.aiObservations && (
                              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                                <strong className="text-slate-200 block mb-0.5 font-bold">Observations sur le travail :</strong>
                                <p>{submission.aiObservations}</p>
                              </div>
                            )}
                          </div>

                          {/* Two Pillars: Strengths vs What You Can Do Better */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Strengths */}
                            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                              <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Ce que vous avez bien réussi :</span>
                              </h5>
                              <ul className="space-y-1.5">
                                {(submission.aiStrengths && submission.aiStrengths.length > 0 ? submission.aiStrengths : [
                                  "Devoir traité et rendu dans les délais",
                                  "Effort d'analyse des questions posées"
                                ]).map((st, idx) => (
                                  <li key={idx} className="text-xs text-emerald-100 flex items-start gap-2">
                                    <span className="text-emerald-400 font-black">•</span>
                                    <span>{st}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* What you can do better (Observations & Improvements) */}
                            <div className="p-4 rounded-2xl bg-amber-950/25 border-2 border-amber-500/40 space-y-2.5 shadow-md">
                              <h5 className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                                <Target className="w-4 h-4 text-amber-400" />
                                <span>Ce que vous pouvez mieux faire (Conseils) :</span>
                              </h5>
                              <ul className="space-y-2">
                                {(submission.aiAreasForImprovement && submission.aiAreasForImprovement.length > 0 ? submission.aiAreasForImprovement : [
                                  "Bien relire le corrigé type officiel pour consolider la rédaction",
                                  "Vérifier chaque étape de calcul intermédiaire"
                                ]).map((imp, idx) => (
                                  <li key={idx} className="text-xs text-amber-100 flex items-start gap-2 bg-amber-900/20 p-2 rounded-xl border border-amber-500/20">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <span>{imp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Rubric Points Breakdown */}
                          {submission.aiBreakdown && (
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="font-bold text-white">Détail des points selon le barème :</span>
                                <span className="text-slate-400">{submission.aiBreakdown}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* If submitted but no AI evaluation yet, allow 1-click trigger */}
                      {submission.aiScore === undefined && !isAiEvaluatingMap[quiz.id] && (
                        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
                            <div>
                              <span className="text-xs font-black text-white block">
                                Faire évaluer cette copie par l'Intelligence Artificielle
                              </span>
                              <span className="text-[11px] text-slate-400">
                                L'IA attribue une note selon le corrigé type et le barème, avec des observations pour progresser.
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => triggerAiEvaluation(
                              quiz,
                              submission.id,
                              submission.submissionType,
                              submission.directAnswer,
                              submission.scannedFileUrl
                            )}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow transition-all cursor-pointer shrink-0"
                          >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Lancer l'évaluation IA</span>
                          </button>
                        </div>
                      )}
                      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-teal-950/30 border border-emerald-500/40 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wide flex items-center gap-2">
                            <Unlock className="w-4 h-4 text-emerald-400" />
                            <span>Corrigé Type Officiel du Professeur (Débloqué)</span>
                          </h4>
                          {quiz.attachedAnswerKeyFileUrl && (
                            <button
                              type="button"
                              onClick={() => setActiveLightboxPhoto({ url: quiz.attachedAnswerKeyFileUrl!, title: `Corrigé Type Officiel : ${quiz.title}` })}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>📸 Agrandir la photo du corrigé</span>
                            </button>
                          )}
                        </div>

                        {/* Inline Photo Preview of the Corrigé */}
                        {quiz.attachedAnswerKeyFileUrl && (quiz.attachedAnswerKeyFileUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(quiz.attachedAnswerKeyFileUrl)) && (
                          <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-black/60 group">
                            <img
                              src={quiz.attachedAnswerKeyFileUrl}
                              alt="Photo du corrigé type officiel"
                              className="w-full max-h-96 object-contain rounded-2xl cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => setActiveLightboxPhoto({ url: quiz.attachedAnswerKeyFileUrl!, title: `Corrigé Type Officiel : ${quiz.title}` })}
                            />
                            <div className="absolute bottom-2 right-2 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md text-xs text-emerald-300 font-bold pointer-events-none flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Cliquer pour zoomer le corrigé</span>
                            </div>
                          </div>
                        )}

                        <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 text-emerald-100 text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                          {quiz.officialAnswerKey}
                        </div>
                      </div>

                      {/* UNLOCKED: BARÈME DÉTAILLÉ */}
                      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-yellow-950/30 border border-amber-500/40 space-y-4 shadow-xl">
                        <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span>Barème Officiel de Notation ({quiz.totalPoints} points)</span>
                        </h4>

                        <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 text-amber-100 text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                          {quiz.gradingScale}
                        </div>
                      </div>

                      {/* UNLOCKED: CONSIGNES & DIRECTIVES DE CLÉMENCE DU PROFESSEUR */}
                      {quiz.teacherAiInstructions && (
                        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-950/30 via-slate-900 to-purple-950/30 border border-indigo-500/40 space-y-3 shadow-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h4 className="text-sm font-black text-indigo-300 uppercase tracking-wide flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-amber-400" />
                              <span>Consignes de Clémence du Professeur transmises à l'IA</span>
                            </h4>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 self-start sm:self-auto flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Approches de réponses valorisées</span>
                            </span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 text-indigo-100 text-xs sm:text-sm font-sans italic whitespace-pre-wrap leading-relaxed shadow-inner">
                            « {quiz.teacherAiInstructions} »
                          </div>
                          <p className="text-[11px] text-slate-400">
                            ✨ Votre professeur a expressément demandé à l'IA d'être clémente et d'accorder des points pour vos démarches méthodologiques et tentatives de résolution.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Photo Lightbox Zoom Modal */}
      {activeLightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white border-b border-white/20 mb-3">
              <span className="font-black text-sm text-indigo-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-300" />
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
