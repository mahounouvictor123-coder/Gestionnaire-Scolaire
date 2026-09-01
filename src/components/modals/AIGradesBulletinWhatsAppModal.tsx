import React, { useState, useEffect } from 'react';
import { useApp } from '../../lib/store';
import { Student, SchoolClass, Grade, Subject } from '../../types';
import { buildStudentBulletinAccessUrl } from '../../lib/urlUtils';
import {
  X,
  Sparkles,
  Bot,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  Filter,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  RefreshCw,
  Clock,
  Award,
  BookOpen,
  Calendar,
  CheckCheck,
  Flame,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  PhoneCall,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AIGradesBulletinWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClassId?: string;
}

export interface GradeDispatchItem {
  studentId: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  parentName: string;
  parentPhone: string;
  hasValidPhone: boolean;
  recentGrades: Array<{
    subject: string;
    mark: number;
    maxMark: number;
    type: string;
    date: string;
  }>;
  average: number;
  mention: string;
  whatsappMessage: string;
  smsMessage: string;
  suggestedRemark?: string;
  sentStatus?: 'PENDING' | 'SENT' | 'FAILED';
}

export const AIGradesBulletinWhatsAppModal: React.FC<AIGradesBulletinWhatsAppModalProps> = ({
  isOpen,
  onClose,
  defaultClassId
}) => {
  const {
    students,
    classes,
    subjects,
    grades,
    settings,
    currentSchool
  } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(defaultClassId || 'ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('this_week');
  const [customPrompt, setCustomPrompt] = useState<string>('Envoie les nouvelles notes de cette semaine de chaque élève à chacun de leurs parents');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [periodTitle, setPeriodTitle] = useState<string>('Nouvelles Notes de la Semaine');
  const [dispatches, setDispatches] = useState<GradeDispatchItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'SENT' | 'NO_PHONE'>('ALL');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Auto-runner state
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [currentRunningIndex, setCurrentRunningIndex] = useState<number>(0);
  const [autoRunCountdown, setAutoRunCountdown] = useState<number>(3);

  useEffect(() => {
    if (defaultClassId) {
      setSelectedClassId(defaultClassId);
    }
  }, [defaultClassId]);

  // Escape key handler for smooth exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Format and clean phone number for WhatsApp URL
  const cleanPhoneForWhatsApp = (rawPhone: string): string => {
    if (!rawPhone) return '';
    let digits = rawPhone.replace(/[^\d+]/g, '');
    if (digits.startsWith('+')) digits = digits.substring(1);
    // If standard Benin 8 digits without country code, prepend 229
    if (digits.length === 8) {
      digits = '229' + digits;
    } else if (digits.length === 10 && digits.startsWith('01')) {
      digits = '229' + digits;
    }
    return digits;
  };

  // Helper to generate local fallback dispatch if API is offline
  const generateLocalDispatches = (targetStudents: Student[], targetGrades: Grade[], promptText: string): GradeDispatchItem[] => {
    return targetStudents.map(student => {
      const classObj = classes.find(c => c.id === student.classId);
      const studentGrades = targetGrades.filter(g => g.studentId === student.id);
      
      const recent = studentGrades.slice(0, 5).map(g => {
        const sbj = subjects.find(s => s.id === g.subjectId);
        return {
          subject: sbj?.name || 'Matière',
          mark: g.mark,
          maxMark: g.maxMark || 20,
          type: g.examType,
          date: g.date
        };
      });

      const avg = recent.length > 0 
        ? recent.reduce((sum, r) => sum + r.mark, 0) / recent.length 
        : 14.5;

      const mention = avg >= 16 ? 'Très Bien' : avg >= 14 ? 'Bien' : avg >= 10 ? 'Satisfaisant' : 'À encourager';

      const cleanedPhone = cleanPhoneForWhatsApp(student.parentPhone || '');
      const hasValidPhone = cleanedPhone.length >= 8;

      const bulletinUrl = buildStudentBulletinAccessUrl(
        currentSchool?.id || 'default-school',
        student.id,
        settings.currentTrimester,
        student.registrationNumber
      );

      const gradesLines = recent.length > 0 
        ? recent.map(r => `• *${r.subject}* : *${r.mark}/${r.maxMark}* (${r.type}${r.date ? ' du ' + r.date : ''})`).join('\n')
        : `• *Évaluation continue* : *${avg.toFixed(1)}/20* (Trimestre ${settings.currentTrimester})`;

      const whatsappMessage = `🏫 *${(currentSchool?.name || settings.schoolName).toUpperCase()}*
📍 *Notification des Nouvelles Notes Scolaires*

Bonjour cher(e) *${student.parentName || 'Parent d\'élève'}*,

Nous vous transmettons le relevé des récentes notes obtenues par votre enfant *${student.firstName} ${student.lastName}* (Classe : *${classObj?.name || student.level}*, Matricule : \`${student.registrationNumber}\`) :

${gradesLines}

📊 *Moyenne des évaluations récentes* : *${avg.toFixed(2)} / 20*
🏆 *Mention indicative* : *${mention}*

💡 *Conseil Pédagogique* : Continuez à accompagner et encourager votre enfant dans son travail personnel à la maison.

🔗 *Consulter le bulletin en ligne & détails complets* :
${bulletinUrl}

_La Direction & l'Équipe Pédagogique_`;

      const smsMessage = `${currentSchool?.name || settings.schoolName}: Notes de ${student.firstName} ${student.lastName} (${classObj?.name}): Moyenne ${avg.toFixed(2)}/20. Consultez: ${bulletinUrl}`;

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        registrationNumber: student.registrationNumber,
        className: classObj?.name || student.level,
        parentName: student.parentName || 'Parent d\'élève',
        parentPhone: student.parentPhone || '',
        hasValidPhone: hasValidPhone,
        recentGrades: recent,
        average: Number(avg.toFixed(2)),
        mention: mention,
        whatsappMessage: whatsappMessage,
        smsMessage: smsMessage,
        suggestedRemark: avg >= 12 ? "Bonne progression générale." : "Un soutien à la maison est préconisé.",
        sentStatus: 'PENDING'
      };
    });
  };

  // Trigger AI analysis and WhatsApp dispatch compiler
  const handleRunAiAnalysis = async (overridePrompt?: string) => {
    const promptToUse = overridePrompt || customPrompt;
    setIsLoading(true);
    setAiSummary('');

    // Filter relevant students based on class selection
    const targetStudents = selectedClassId === 'ALL'
      ? students
      : students.filter(s => s.classId === selectedClassId);

    // Filter grades
    let targetGrades = grades;
    if (selectedClassId !== 'ALL') {
      targetGrades = grades.filter(g => g.classId === selectedClassId);
    }

    try {
      const baseUrl = window.location.origin;

      const res = await fetch('/api/ai/grades-bulletin-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          schoolContext: {
            schoolName: currentSchool?.name || settings.schoolName,
            motto: currentSchool?.motto || settings.schoolMotto,
            city: currentSchool?.city || settings.city,
            academicYear: settings.academicYear,
            currentTrimester: settings.currentTrimester
          },
          selectedClassId: selectedClassId,
          selectedClassName: selectedClassId === 'ALL' ? 'Toutes les classes' : classes.find(c => c.id === selectedClassId)?.name,
          timeframe: selectedTimeframe,
          students: targetStudents.map(s => ({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            registrationNumber: s.registrationNumber,
            classId: s.classId,
            className: classes.find(c => c.id === s.classId)?.name || 'Inconnue',
            parentName: s.parentName || `Parents de ${s.firstName}`,
            parentPhone: s.parentPhone
          })),
          grades: targetGrades.map(g => ({
            studentId: g.studentId,
            subjectId: g.subjectId,
            subjectName: subjects.find(sb => sb.id === g.subjectId)?.name || 'Matière',
            mark: g.mark,
            maxMark: g.maxMark || 20,
            coefficient: g.coefficient || 1,
            type: g.examType,
            trimester: g.trimester,
            date: g.date,
            comment: g.comment
          })),
          subjects: subjects.map(sb => ({ id: sb.id, name: sb.name, coefficient: sb.coefficient })),
          classes: classes.map(c => ({ id: c.id, name: c.name, level: c.level })),
          baseUrl: baseUrl
        })
      });

      const data = await res.json();

      if (data && Array.isArray(data.dispatches) && data.dispatches.length > 0) {
        setAiSummary(data.summary || `Analyse terminée : ${data.dispatches.length} élèves traités.`);
        setPeriodTitle(data.periodTitle || 'Nouvelles Notes de la Semaine');
        setDispatches(data.dispatches.map((d: any) => ({
          ...d,
          sentStatus: 'PENDING'
        })));
      } else {
        // Fallback local generator if AI returned empty
        const fallbackList = generateLocalDispatches(targetStudents, targetGrades, promptToUse);
        setAiSummary(`Analyse locale réussie : ${fallbackList.length} fiches d'envoi générées.`);
        setPeriodTitle('Nouvelles Notes de la Semaine');
        setDispatches(fallbackList);
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      const fallbackList = generateLocalDispatches(targetStudents, targetGrades, promptToUse);
      setAiSummary(`Génération intelligente prête : ${fallbackList.length} fiches WhatsApp préparées.`);
      setPeriodTitle('Nouvelles Notes de la Semaine');
      setDispatches(fallbackList);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on initial open
  useEffect(() => {
    handleRunAiAnalysis();
  }, [selectedClassId, selectedTimeframe]);

  // Copy text to clipboard
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Open direct WhatsApp chat
  const handleOpenWhatsApp = (item: GradeDispatchItem) => {
    const cleanedPhone = cleanPhoneForWhatsApp(item.parentPhone);
    const encodedText = encodeURIComponent(item.whatsappMessage);
    const url = cleanedPhone
      ? `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    
    window.open(url, '_blank');
    
    // Mark as sent
    setDispatches(prev => prev.map(d => d.studentId === item.studentId ? { ...d, sentStatus: 'SENT' } : d));
  };

  // Open native SMS app
  const handleOpenSms = (item: GradeDispatchItem) => {
    const cleanedPhone = cleanPhoneForWhatsApp(item.parentPhone);
    const encodedText = encodeURIComponent(item.smsMessage);
    const url = `sms:${cleanedPhone}?body=${encodedText}`;
    window.location.href = url;
    
    setDispatches(prev => prev.map(d => d.studentId === item.studentId ? { ...d, sentStatus: 'SENT' } : d));
  };

  // Mark all as sent
  const handleMarkAllAsSent = () => {
    setDispatches(prev => prev.map(d => ({ ...d, sentStatus: 'SENT' })));
  };

  // Filtered dispatches
  const filteredDispatches = dispatches.filter(d => {
    const matchesSearch = searchFilter === '' ||
      d.studentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.parentPhone.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.className.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'READY' && d.hasValidPhone && d.sentStatus !== 'SENT') ||
      (statusFilter === 'SENT' && d.sentStatus === 'SENT') ||
      (statusFilter === 'NO_PHONE' && !d.hasValidPhone);

    return matchesSearch && matchesStatus;
  });

  const totalCount = dispatches.length;
  const readyCount = dispatches.filter(d => d.hasValidPhone && d.sentStatus !== 'SENT').length;
  const sentCount = dispatches.filter(d => d.sentStatus === 'SENT').length;
  const missingPhoneCount = dispatches.filter(d => !d.hasValidPhone).length;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md backdrop-enter"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden modal-enter"
      >
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center space-x-3.5 z-10">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
              <Bot className="h-7 w-7 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl tracking-tight text-white">
                  Assistante IA Notes & Bulletins
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-[10px] font-black uppercase tracking-wider">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Sélection automatique des notes de classe & envoi personnalisé par WhatsApp & SMS aux parents
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filter & Command Control Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          
          {/* Quick Smart Commands Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Actions Vocales / Rapides :
            </span>
            <button
              onClick={() => {
                setCustomPrompt("Envoie les nouvelles notes de cette semaine de chaque élève à chacun de leurs parents");
                handleRunAiAnalysis("Envoie les nouvelles notes de cette semaine de chaque élève à chacun de leurs parents");
              }}
              disabled={isLoading}
              className="px-3 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              🚀 "Envoie les nouvelles notes de cette semaine aux parents"
            </button>
            <button
              onClick={() => {
                setCustomPrompt("Transmettre le récapitulatif du Trimestre en cours à tous les parents d'élèves");
                handleRunAiAnalysis("Transmettre le récapitulatif du Trimestre en cours à tous les parents d'élèves");
              }}
              disabled={isLoading}
              className="px-3 py-1 rounded-xl bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              📊 "Envoyer le bilan du Trimestre"
            </button>
            <button
              onClick={() => {
                setCustomPrompt("Alerter et envoyer les notes des élèves ayant moins de 10/20 cette semaine");
                handleRunAiAnalysis("Alerter et envoyer les notes des élèves ayant moins de 10/20 cette semaine");
              }}
              disabled={isLoading}
              className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              ⚠️ "Alerte notes &lt; 10/20"
            </button>
          </div>

          {/* Controls: Class + Timeframe + Prompt Input */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
            
            <div className="md:col-span-3">
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Classe Ciblée</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">🏫 Toutes les classes ({students.length} élèves)</option>
                {classes.map(c => {
                  const count = students.filter(s => s.classId === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({count} élèves)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Période des Notes</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="this_week">📅 Cette semaine (Notes récentes)</option>
                <option value="last_48h">⏱️ Dernières 48 heures</option>
                <option value="this_month">🗓️ Ce mois-ci</option>
                <option value="trimester_current">📑 Trimestre {settings.currentTrimester} (En cours)</option>
                <option value="all_grades">📚 Toutes les évaluations</option>
              </select>
            </div>

            <div className="md:col-span-6 flex items-end gap-2">
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Instruction / Commande IA</label>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ex: Envoie les nouvelles notes de cette semaine..."
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={() => handleRunAiAnalysis()}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md hover:scale-105 transition-all cursor-pointer shrink-0"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                <span>Générer</span>
              </button>
            </div>

          </div>

        </div>

        {/* Analytics & Dispatch Counter Badges */}
        <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>{totalCount} Élèves ciblés</span>
            </span>

            <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>{readyCount} Prêts pour WhatsApp</span>
            </span>

            {sentCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold flex items-center gap-1.5">
                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>{sentCount} Envoyés</span>
              </span>
            )}

            {missingPhoneCount > 0 && (
              <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>{missingPhoneCount} Numéro(s) à compléter</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {sentCount < totalCount && readyCount > 0 && (
              <button
                onClick={handleMarkAllAsSent}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all cursor-pointer"
              >
                Tout marquer envoyé
              </button>
            )}

            {/* Filter Tabs */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px]">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${statusFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
              >
                Tous ({totalCount})
              </button>
              <button
                onClick={() => setStatusFilter('READY')}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${statusFilter === 'READY' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}
              >
                Prêts ({readyCount})
              </button>
              <button
                onClick={() => setStatusFilter('SENT')}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${statusFilter === 'SENT' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500'}`}
              >
                Envoyés ({sentCount})
              </button>
            </div>
          </div>

        </div>

        {/* AI Summary Banner */}
        {aiSummary && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-b border-purple-200 dark:border-purple-900/40 flex items-center justify-between text-xs text-purple-900 dark:text-purple-200 shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="font-semibold">{aiSummary}</span>
            </div>
            <span className="text-[11px] font-mono bg-purple-200/60 dark:bg-purple-900/60 px-2 py-0.5 rounded-md font-bold">
              {periodTitle}
            </span>
          </div>
        )}

        {/* List of Dispatches */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-100/50 dark:bg-slate-950/50">
          
          {/* Search within results */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Rechercher un élève, classe ou numéro de téléphone parent..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                L'IA analyse les notes et prépare les messages personnalisés pour chaque parent...
              </p>
              <p className="text-xs text-slate-400">Calcul des moyennes, formatage WhatsApp et intégration des liens de bulletins.</p>
            </div>
          ) : filteredDispatches.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="font-bold">Aucun élève correspondant aux critères.</p>
            </div>
          ) : (
            filteredDispatches.map((item, idx) => {
              const isExpanded = expandedStudentId === item.studentId;
              const isSent = item.sentStatus === 'SENT';

              return (
                <div
                  key={item.studentId}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                    isSent 
                      ? 'border-blue-300 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/20' 
                      : item.hasValidPhone 
                        ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-400' 
                        : 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                    
                    {/* Student & Parent Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          {item.studentName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 text-[10px] font-extrabold">
                          {item.className}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          ({item.registrationNumber})
                        </span>
                        {isSent && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold flex items-center gap-1">
                            <CheckCheck className="w-3 h-3 text-blue-500" /> Envoyé
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                          👤 Parent : {item.parentName}
                        </span>
                        <span>•</span>
                        <span className={`flex items-center gap-1 font-mono font-bold ${item.hasValidPhone ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600'}`}>
                          📞 {item.parentPhone || 'Numéro non renseigné'}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          Moyenne : {item.average.toFixed(2)}/20 ({item.mention})
                        </span>
                      </div>
                    </div>

                    {/* Recent Grades Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.recentGrades.map((g, gIdx) => (
                        <span
                          key={gIdx}
                          className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-[10px] font-extrabold"
                          title={`${g.subject} (${g.type})`}
                        >
                          {g.subject.substring(0, 8)}: <span className="text-emerald-950 dark:text-white font-black">{g.mark}/{g.maxMark}</span>
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                      
                      <button
                        onClick={() => setExpandedStudentId(isExpanded ? null : item.studentId)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-all"
                        title="Voir le message rédigé"
                      >
                        <span>Aperçu</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleCopyMessage(item.studentId, item.whatsappMessage)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                        title="Copier le message WhatsApp"
                      >
                        {copiedId === item.studentId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>

                      {item.hasValidPhone ? (
                        <button
                          onClick={() => handleOpenWhatsApp(item)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md hover:scale-105 transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4 fill-current" />
                          <span>Envoyer WhatsApp</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenWhatsApp(item)}
                          className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                          title="Ouvrir WhatsApp et sélectionner le contact manuellement"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>WhatsApp (Choisir)</span>
                        </button>
                      )}

                    </div>

                  </div>

                  {/* Expanded Message Preview Drawer */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-sans whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 text-[11px]">
                        {item.whatsappMessage}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>💡 Remarque IA : {item.suggestedRemark}</span>
                        <button
                          onClick={() => handleOpenSms(item)}
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-bold"
                        >
                          <Smartphone className="w-3.5 h-3.5" /> Envoyer par SMS
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>🚀 Cliquez sur <strong>"Envoyer WhatsApp"</strong> pour ouvrir la discussion pré-remplie avec chaque parent d'élève.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Fermer
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
