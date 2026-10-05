import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../lib/store';
import { ExamPaper, ExamType, SchoolClass } from '../types';
import { exportExamPaperToWord, downloadAttachedTeacherFile } from '../lib/examExportUtils';
import {
  FileText,
  FolderArchive,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Eye,
  Archive,
  ArchiveRestore,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Phone,
  FileCheck,
  Check,
  ChevronDown,
  ChevronRight,
  Upload,
  UserCheck,
  Building,
  GraduationCap,
  RefreshCw,
  Send
} from 'lucide-react';

interface ClassExamRepositoryAndArchiveTabProps {
  onPreviewPaper: (paper: ExamPaper) => void;
  onDirectPrint: (paper: ExamPaper) => void;
}

export const ClassExamRepositoryAndArchiveTab: React.FC<ClassExamRepositoryAndArchiveTabProps> = ({
  onPreviewPaper,
  onDirectPrint
}) => {
  const {
    examPapers,
    classes,
    subjects,
    teachers,
    settings,
    currentSchool,
    addExamPaper,
    updateExamPaper,
    deleteExamPaper,
    refreshExamPapersFromCloud
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inboxFilter, setInboxFilter] = useState<'ALL' | 'PENDING' | 'VALIDE' | 'IMPRIME'>('ALL');
  const [isInboxExpanded, setIsInboxExpanded] = useState<boolean>(true);

  // Auto-refresh from cloud on mount and focus
  useEffect(() => {
    refreshExamPapersFromCloud();
    const handleFocus = () => refreshExamPapersFromCloud();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshExamPapersFromCloud();
    setTimeout(() => {
      setIsRefreshing(false);
      showNotice("✓ Liste des épreuves synchronisée avec le Cloud et les professeurs.");
    }, 600);
  };

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedTrimester, setSelectedTrimester] = useState<string>('ALL');
  const [archiveFilter, setArchiveFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Manual Deposit Modal state (when admin receives an exam from a teacher)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositClassId, setDepositClassId] = useState<string>(classes[0]?.id || '');
  const [depositSubject, setDepositSubject] = useState<string>(subjects[0]?.name || 'Français');
  const [depositTeacherName, setDepositTeacherName] = useState<string>('');
  const [depositTeacherPhone, setDepositTeacherPhone] = useState<string>('');
  const [depositTitle, setDepositTitle] = useState<string>('');
  const [depositExamType, setDepositExamType] = useState<ExamType>('DEVOIR_1');
  const [depositTrimester, setDepositTrimester] = useState<number>(settings.currentTrimester || 1);
  const [depositDuration, setDepositDuration] = useState<string>('2 heures');
  const [depositCoefficient, setDepositCoefficient] = useState<number>(2);
  const [depositCopies, setDepositCopies] = useState<number>(() => classes[0]?.studentCount || 40);
  const [depositExamDate, setDepositExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [depositNotes, setDepositNotes] = useState<string>('');
  const [depositContent, setDepositContent] = useState<string>('');
  const [depositFileUrl, setDepositFileUrl] = useState<string>('');
  const [depositFileName, setDepositFileName] = useState<string>('');
  const [depositFileType, setDepositFileType] = useState<'WORD' | 'PDF' | 'IMAGE'>('WORD');

  // Quick feedback toast
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Only consider papers from teachers or explicitly tagged as teacher submissions
  const allTeacherPapers = useMemo(() => {
    return examPapers.filter(p => !!(p.teacherName || p.teacherId || p.teacherPhone || p.submissionNotes || p.attachedFileName || p.sentToSchool || p.sentToParents));
  }, [examPapers]);

  // Sorted list of recent submissions for the top reception feed
  const recentTeacherSubmissions = useMemo(() => {
    let list = [...allTeacherPapers];
    if (inboxFilter === 'PENDING') {
      list = list.filter(p => (!p.status || p.status === 'EN_ATTENTE') && !p.isArchived);
    } else if (inboxFilter === 'VALIDE') {
      list = list.filter(p => p.status === 'VALIDE' && !p.isArchived);
    } else if (inboxFilter === 'IMPRIME') {
      list = list.filter(p => p.status === 'IMPRIME' && !p.isArchived);
    }
    return list.sort((a, b) => {
      const dateA = a.createdAt || '';
      const dateB = b.createdAt || '';
      return dateB.localeCompare(dateA);
    });
  }, [allTeacherPapers, inboxFilter]);

  // General counts
  const totalTeacherPapers = allTeacherPapers.length;
  const pendingCount = allTeacherPapers.filter(p => (!p.status || p.status === 'EN_ATTENTE') && !p.isArchived).length;
  const validatedCount = allTeacherPapers.filter(p => p.status === 'VALIDE' && !p.isArchived).length;
  const printedCount = allTeacherPapers.filter(p => p.status === 'IMPRIME' && !p.isArchived).length;
  const archivedCount = allTeacherPapers.filter(p => p.isArchived || p.status === 'ARCHIVE').length;

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return allTeacherPapers.filter(paper => {
      const isArchived = paper.isArchived || paper.status === 'ARCHIVE';

      // Archive filter
      if (archiveFilter === 'ACTIVE' && isArchived) return false;
      if (archiveFilter === 'ARCHIVED' && !isArchived) return false;

      // Class filter
      if (selectedClassId !== 'ALL' && paper.classId !== selectedClassId && paper.className !== selectedClassId) {
        return false;
      }

      // Trimester filter
      if (selectedTrimester !== 'ALL' && paper.trimester !== parseInt(selectedTrimester, 10)) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ARCHIVED') {
          if (!isArchived) return false;
        } else if (statusFilter === 'PENDING') {
          if (paper.status && paper.status !== 'EN_ATTENTE') return false;
        } else if (paper.status !== statusFilter) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = paper.title?.toLowerCase().includes(query);
        const matchesSubject = paper.subjectName?.toLowerCase().includes(query);
        const matchesClass = paper.className?.toLowerCase().includes(query);
        const matchesTeacher = paper.teacherName?.toLowerCase().includes(query);
        const matchesNotes = paper.submissionNotes?.toLowerCase().includes(query);
        const matchesPhone = paper.teacherPhone?.includes(query);
        if (!matchesTitle && !matchesSubject && !matchesClass && !matchesTeacher && !matchesNotes && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [allTeacherPapers, selectedClassId, selectedTrimester, archiveFilter, statusFilter, searchTerm]);

  // Group papers by class for organized visual hierarchy
  const papersByClass = useMemo(() => {
    const map = new Map<string, { className: string; classObj?: SchoolClass; papers: ExamPaper[] }>();

    // If a specific class is selected, only show that class
    const targetClasses = selectedClassId === 'ALL'
      ? classes
      : classes.filter(c => c.id === selectedClassId);

    // Pre-populate with classes
    targetClasses.forEach(c => {
      map.set(c.name, { className: c.name, classObj: c, papers: [] });
    });

    // Distribute filtered papers into classes
    filteredPapers.forEach(paper => {
      const clsName = paper.className || 'Non classée';
      if (!map.has(clsName)) {
        const found = classes.find(c => c.name === clsName || c.id === paper.classId);
        map.set(clsName, { className: clsName, classObj: found, papers: [] });
      }
      map.get(clsName)!.papers.push(paper);
    });

    // If selectedClassId is ALL, filter out classes with 0 papers when searching or filtering
    const result = Array.from(map.values());
    if (selectedClassId === 'ALL' && (searchTerm || statusFilter !== 'ALL' || archiveFilter === 'ARCHIVED')) {
      return result.filter(group => group.papers.length > 0);
    }

    return result;
  }, [classes, filteredPapers, selectedClassId, searchTerm, statusFilter, archiveFilter]);

  // Handle Archiving
  const handleToggleArchive = (paper: ExamPaper) => {
    const isCurrentlyArchived = paper.isArchived || paper.status === 'ARCHIVE';
    const updated: ExamPaper = {
      ...paper,
      isArchived: !isCurrentlyArchived,
      status: !isCurrentlyArchived ? 'ARCHIVE' : 'VALIDE',
      archivedAt: !isCurrentlyArchived ? new Date().toISOString() : undefined,
      archivedBy: !isCurrentlyArchived ? (settings.schoolName || 'Direction') : undefined
    };
    updateExamPaper(updated);
    showNotice(
      !isCurrentlyArchived
        ? `📦 Épreuve « ${paper.title} » archivée dans la classe ${paper.className}.`
        : `↩️ Épreuve « ${paper.title} » restaurée des archives.`
    );
  };

  // Handle Validation
  const handleValidatePaper = (paper: ExamPaper) => {
    const updated: ExamPaper = {
      ...paper,
      status: 'VALIDE'
    };
    updateExamPaper(updated);
    showNotice(`✓ Épreuve « ${paper.title} » validée pour tirage.`);
  };

  // Handle Print Mark
  const handleMarkPrinted = (paper: ExamPaper) => {
    const updated: ExamPaper = {
      ...paper,
      status: 'IMPRIME'
    };
    updateExamPaper(updated);
    showNotice(`🖨️ Épreuve marquée comme tirée / imprimée.`);
  };

  // Handle manual deposit submission
  const handleSaveManualDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClass = classes.find(c => c.id === depositClassId);
    const className = targetClass?.name || 'Classe';

    const newPaper: Omit<ExamPaper, 'id' | 'createdAt'> = {
      title: depositTitle.trim() || `Épreuve de ${depositSubject} - ${className}`,
      classId: depositClassId,
      className,
      subjectName: depositSubject,
      examType: depositExamType,
      trimester: depositTrimester,
      academicYear: settings.academicYear || '2024-2025',
      duration: depositDuration,
      coefficient: depositCoefficient,
      instructions: "L'usage de la calculatrice n'est pas autorisé sauf mention contraire. Rendre une copie soignée.",
      content: depositContent.trim() || `Épreuve déposée pour la classe de ${className} en ${depositSubject}.`,
      teacherName: depositTeacherName.trim() || 'Enseignant',
      teacherPhone: depositTeacherPhone.trim(),
      status: 'VALIDE',
      numberOfCopiesRequested: depositCopies,
      examDate: depositExamDate,
      submissionNotes: depositNotes.trim(),
      attachedFileUrl: depositFileUrl || undefined,
      attachedFileName: depositFileName || undefined,
      attachedFileType: depositFileType,
      includeHeader: true,
      isArchived: false
    };

    addExamPaper(newPaper);
    setIsDepositModalOpen(false);
    showNotice(`📥 Épreuve de ${depositSubject} recueillie et enregistrée avec succès pour ${className} !`);

    // Reset fields
    setDepositTitle('');
    setDepositNotes('');
    setDepositContent('');
    setDepositFileUrl('');
    setDepositFileName('');
  };

  // Handle file input for manual deposit
  const handleDepositFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDepositFileName(file.name);
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.pdf')) {
      setDepositFileType('PDF');
    } else if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      setDepositFileType('IMAGE');
    } else {
      setDepositFileType('WORD');
    }

    if (!depositTitle) {
      setDepositTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setDepositFileUrl(loadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast feedback notice */}
      {actionNotice && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-slate-900 text-white border border-emerald-500 shadow-2xl flex items-center space-x-3 text-xs font-bold animate-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Banner & Quick Metrics */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              📂 Espace Recueil & Archives des Professeurs
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950">
              {totalTeacherPapers} épreuves répertoriées
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Épreuves Envoyées par les Professeurs par Classe</span>
          </h2>

          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Centralisez, validez et archivez toutes les épreuves de devoirs et compositions transmises par le corps enseignant. Téléchargez le fichier original (Word/PDF), imprimez directement avec l'en-tête officiel ou téléchargez la version Word formatée.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center space-x-2 backdrop-blur-sm border border-white/10 transition-all cursor-pointer disabled:opacity-50"
            title="Synchroniser et récupérer immédiatement les épreuves envoyées par les professeurs"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-300 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Synchronisation...' : 'Actualiser Réceptions'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDepositModalOpen(true)}
            className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-slate-950" />
            <span>📥 Enregistrer une Épreuve reçue</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => { setStatusFilter('PENDING'); setArchiveFilter('ACTIVE'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'PENDING'
              ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">En Attente</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
          <p className="text-[10px] text-slate-500">À valider par le censeur</p>
        </div>

        <div 
          onClick={() => { setStatusFilter('VALIDE'); setArchiveFilter('ACTIVE'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'VALIDE'
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Validées / Prêtes</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{validatedCount}</p>
          <p className="text-[10px] text-slate-500">Prêtes pour reprographie</p>
        </div>

        <div 
          onClick={() => { setStatusFilter('IMPRIME'); setArchiveFilter('ACTIVE'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'IMPRIME'
              ? 'bg-blue-500/15 border-blue-500 text-blue-900 dark:text-blue-200'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tirées / Imprimées</span>
            <Printer className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{printedCount}</p>
          <p className="text-[10px] text-slate-500">Prêtes pour la salle</p>
        </div>

        <div 
          onClick={() => { setArchiveFilter('ARCHIVED'); setStatusFilter('ALL'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            archiveFilter === 'ARCHIVED'
              ? 'bg-purple-500/15 border-purple-500 text-purple-900 dark:text-purple-200'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Dossier Archives</span>
            <FolderArchive className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{archivedCount}</p>
          <p className="text-[10px] text-slate-500">Préservées par classe</p>
        </div>
      </div>

      {/* SECTION 1: BOÎTE DE RÉCEPTION DIRECTE DES ENSEIGNANTS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-md">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Boîte de Réception : Épreuves Déposées par les Professeurs
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  {allTeacherPapers.length} reçue{allTeacherPapers.length > 1 ? 's' : ''}
                </span>
                {pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 animate-pulse">
                    {pendingCount} à valider pour tirage
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Centralisation en temps réel des épreuves transmises depuis l'application enseignant (téléchargement Word, validation et impression directe).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setInboxFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  inboxFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Toutes ({allTeacherPapers.length})
              </button>
              <button
                type="button"
                onClick={() => setInboxFilter('PENDING')}
                className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  inboxFilter === 'PENDING'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                À Valider ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setInboxFilter('VALIDE')}
                className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  inboxFilter === 'VALIDE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Validées ({validatedCount})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsInboxExpanded(prev => !prev)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              {isInboxExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {isInboxExpanded && (
          <>
            {recentTeacherSubmissions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <FileCheck className="h-8 w-8 text-indigo-400 mx-auto" />
                <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                  {inboxFilter === 'PENDING'
                    ? "Aucune épreuve en attente de validation."
                    : "Aucune épreuve trouvée dans cette sélection."}
                </p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Dès qu'un enseignant clique sur « Envoyer » dans son espace professeur, le sujet s'affiche instantanément ici avec son texte formaté et ses pièces jointes Word ou PDF.
                </p>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black shadow cursor-pointer mt-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Actualiser les réceptions</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recentTeacherSubmissions.slice(0, 8).map(paper => {
                  const isArchived = paper.isArchived || paper.status === 'ARCHIVE';
                  return (
                    <div
                      key={`inbox-${paper.id}`}
                      className="p-4 sm:p-5 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-600 text-white shadow-sm">
                              {paper.subjectName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30">
                              🎓 {paper.className}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Trimestre {paper.trimester || 1}
                            </span>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            paper.status === 'VALIDE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30'
                              : paper.status === 'IMPRIME'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-500/30'
                              : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-500/30 animate-pulse'
                          }`}>
                            {paper.status === 'VALIDE' ? '✓ Validée pour tirage' :
                             paper.status === 'IMPRIME' ? '🖨️ Tirée / Imprimée' :
                             '⏳ En attente validation'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                            {paper.title}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap gap-1">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                              <span>👨‍🏫 Prof. {paper.teacherName || 'Enseignant'}</span>
                              {paper.teacherPhone && <span className="opacity-80 font-mono">({paper.teacherPhone})</span>}
                            </span>
                            <span className="text-[11px] flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Reçu le {paper.createdAt || 'Récemment'}</span>
                            </span>
                          </div>
                        </div>

                        {/* Copies and Notes Info */}
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-emerald-700 dark:text-emerald-300 flex items-center space-x-1">
                              <Printer className="h-3.5 w-3.5" />
                              <span>{paper.numberOfCopiesRequested ? `${paper.numberOfCopiesRequested} exemplaires demandés` : 'Tirage standard demandé'}</span>
                            </span>
                            {paper.examDate && (
                              <span className="text-slate-600 dark:text-slate-400">
                                Date prévue : <strong>{paper.examDate}</strong>
                              </span>
                            )}
                          </div>
                          {paper.submissionNotes && (
                            <p className="text-slate-600 dark:text-slate-300 italic">
                              « {paper.submissionNotes} »
                            </p>
                          )}
                          {paper.attachedFileName && (
                            <div className="pt-1 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                              <span className="text-indigo-600 dark:text-indigo-300 font-bold truncate flex items-center space-x-1">
                                <FileText className="h-3 w-3 shrink-0" />
                                <span className="truncate">Document joint : {paper.attachedFileName}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => downloadAttachedTeacherFile(paper)}
                                className="px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] shrink-0 ml-2 cursor-pointer"
                              >
                                Télécharger original
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => onPreviewPaper(paper)}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center space-x-1 transition-all cursor-pointer"
                            title="Aperçu formaté en page Word"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Aperçu</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => exportExamPaperToWord(paper, settings, currentSchool)}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                            title="Télécharger directement en document Word (.doc) avec l'en-tête officiel"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Word (.doc)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDirectPrint(paper)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black flex items-center space-x-1 transition-all cursor-pointer"
                            title="Imprimer directement"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Imprimer</span>
                          </button>
                        </div>

                        <div className="flex items-center space-x-1">
                          {paper.status !== 'VALIDE' && paper.status !== 'IMPRIME' && (
                            <button
                              type="button"
                              onClick={() => handleValidatePaper(paper)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                              title="Valider l'épreuve pour tirage officiel"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Valider Tirage</span>
                            </button>
                          )}
                          {paper.status === 'VALIDE' && (
                            <button
                              type="button"
                              onClick={() => handleMarkPrinted(paper)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center space-x-1 transition-all cursor-pointer"
                              title="Marquer comme tirée / imprimée"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Marquer Tirée</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* FILTER & CLASS BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        
        {/* Search & Main Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Search bar */}
          <div className="flex-1 min-w-[220px] relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher épreuve, matière, nom du prof, mot-clé..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
            />
          </div>

          {/* Trimester selector */}
          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="px-2 font-bold text-slate-400">Trimestre :</span>
            {['ALL', '1', '2', '3'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTrimester(t)}
                className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  selectedTrimester === t
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t === 'ALL' ? 'Tous' : `T${t}`}
              </button>
            ))}
          </div>

          {/* Active vs Archived filter */}
          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setArchiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                archiveFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Toutes ({totalTeacherPapers})
            </button>
            <button
              type="button"
              onClick={() => setArchiveFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                archiveFilter === 'ACTIVE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              En cours ({totalTeacherPapers - archivedCount})
            </button>
            <button
              type="button"
              onClick={() => setArchiveFilter('ARCHIVED')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                archiveFilter === 'ARCHIVED'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              📦 Archives ({archivedCount})
            </button>
          </div>

          {/* Reset button */}
          {(selectedClassId !== 'ALL' || selectedTrimester !== 'ALL' || archiveFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedClassId('ALL');
                setSelectedTrimester('ALL');
                setArchiveFilter('ALL');
                setStatusFilter('ALL');
                setSearchTerm('');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Réinitialiser
            </button>
          )}

        </div>

        {/* CLASS SELECTION TABS / PILLS */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
              <span>Sélectionner une Classe :</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              {classes.length} classes configurées
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedClassId('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center space-x-1.5 ${
                selectedClassId === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Toutes les Classes</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white">
                {allTeacherPapers.length}
              </span>
            </button>

            {classes.map(cls => {
              const countInClass = allTeacherPapers.filter(p => p.classId === cls.id || p.className === cls.name).length;
              const pendingInClass = allTeacherPapers.filter(p => (p.classId === cls.id || p.className === cls.name) && (!p.status || p.status === 'EN_ATTENTE') && !p.isArchived).length;
              const isSelected = selectedClassId === cls.id;

              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{cls.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {countInClass}
                  </span>
                  {pendingInClass > 0 && (
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" title={`${pendingInClass} en attente`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* CLASS-BY-CLASS REPOSITORY AND ARCHIVE SECTIONS */}
      <div className="space-y-6">
        {papersByClass.map(group => {
          const classPapers = group.papers;
          const activePapers = classPapers.filter(p => !p.isArchived && p.status !== 'ARCHIVE');
          const archivedPapers = classPapers.filter(p => p.isArchived || p.status === 'ARCHIVE');

          return (
            <div
              key={group.className}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              {/* Class Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Classe de {group.className}
                      </h3>
                      {group.classObj?.studentCount && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          👥 {group.classObj.studentCount} élèves
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {activePapers.length} épreuve{activePapers.length > 1 ? 's' : ''} active{activePapers.length > 1 ? 's' : ''} • {archivedPapers.length} archivée{archivedPapers.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDepositClassId(group.classObj?.id || classes[0]?.id || '');
                      setIsDepositModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 text-xs font-black flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Déposer pour {group.className}</span>
                  </button>
                </div>
              </div>

              {/* If no papers in this class */}
              {classPapers.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <FileText className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Aucune épreuve enregistrée ou correspondante pour la classe de {group.className}.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Les professeurs peuvent déposer leurs épreuves depuis leur espace enseignant, ou vous pouvez en enregistrer une ci-dessus.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {classPapers.map(paper => {
                    const isArchived = paper.isArchived || paper.status === 'ARCHIVE';

                    return (
                      <div
                        key={paper.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 ${
                          isArchived
                            ? 'bg-slate-50 dark:bg-slate-900/60 border-purple-300/40 dark:border-purple-900/40 opacity-90'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {/* Header of paper card */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-1.5">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                              {/* Subject badge */}
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                {paper.subjectName}
                              </span>

                              {/* Exam type badge */}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {paper.examType.replace(/_/g, ' ')}
                              </span>

                              {/* Status badge */}
                              {isArchived ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-400/30 flex items-center space-x-1">
                                  <FolderArchive className="h-3 w-3" />
                                  <span>Archivée</span>
                                </span>
                              ) : paper.status === 'VALIDE' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400/30 flex items-center space-x-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Validée Tirage</span>
                                </span>
                              ) : paper.status === 'IMPRIME' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-400/30 flex items-center space-x-1">
                                  <Printer className="h-3 w-3" />
                                  <span>Tirée / Imprimée</span>
                                </span>
                              ) : paper.status === 'REJETE' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-400/30">
                                  ⚠️ À Retoucher
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-400/30 animate-pulse flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>En attente validation</span>
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <Calendar className="h-3 w-3 inline" />
                              {paper.examDate || paper.createdAt}
                            </span>
                          </div>

                          {/* Paper Title */}
                          <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-2">
                            {paper.title}
                          </h4>

                          {/* Teacher Submission Info Banner */}
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                                <span className="text-base">👨‍🏫</span>
                                <span>Prof. {paper.teacherName || 'Enseignant'}</span>
                              </span>

                              {paper.teacherPhone && (
                                <a
                                  href={`https://wa.me/${paper.teacherPhone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center space-x-1 hover:bg-emerald-200"
                                  title="Contacter sur WhatsApp"
                                >
                                  <Phone className="h-3 w-3" />
                                  <span>{paper.teacherPhone}</span>
                                </a>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                              {paper.numberOfCopiesRequested ? (
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  🖨️ {paper.numberOfCopiesRequested} exemplaires demandés
                                </span>
                              ) : (
                                <span className="text-slate-400">Copies : Standard</span>
                              )}
                              <span>Durée : <strong>{paper.duration}</strong> (Coeff: {paper.coefficient})</span>
                            </div>

                            {paper.submissionNotes && (
                              <p className="text-[10px] text-slate-500 italic bg-white dark:bg-slate-900 p-1.5 rounded-md border border-slate-200/60 dark:border-slate-800">
                                💬 Note prof : "{paper.submissionNotes}"
                              </p>
                            )}

                            {/* Attached file row */}
                            {paper.attachedFileName && (
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 truncate max-w-[180px]">
                                  📎 {paper.attachedFileName}
                                </span>
                                {paper.attachedFileUrl && (
                                  <button
                                    type="button"
                                    onClick={() => downloadAttachedTeacherFile(paper)}
                                    className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center space-x-1"
                                    title="Télécharger le fichier original déposé par le professeur"
                                  >
                                    <Download className="h-3 w-3" />
                                    <span>Fichier Original</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                        </div>

                        {/* WORKFLOW CONTROLS: VALIDATE, REVISE, MARK PRINTED */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          
                          {/* Validation actions for pending papers */}
                          {(!paper.status || paper.status === 'EN_ATTENTE') && !isArchived && (
                            <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50">
                              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">
                                Action Censeur :
                              </span>
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const feedback = prompt("Note ou correction à transmettre à l'enseignant :");
                                    if (feedback !== null) {
                                      updateExamPaper({ ...paper, status: 'REJETE', schoolFeedback: feedback });
                                      showNotice("Remarque enregistrée.");
                                    }
                                  }}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-700 cursor-pointer"
                                >
                                  Retouche
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleValidatePaper(paper)}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1 shadow-sm cursor-pointer"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Valider Tirage</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {paper.status === 'VALIDE' && !isArchived && (
                            <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50">
                              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                                Prête pour tirage ({paper.numberOfCopiesRequested || 'X'} copies)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleMarkPrinted(paper)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1 shadow-sm cursor-pointer"
                              >
                                <Printer className="h-3 w-3" />
                                <span>Marquer Tiré</span>
                              </button>
                            </div>
                          )}

                          {/* ACTION BUTTONS: PREVIEW, DOWNLOAD WORD, DIRECT PRINT, ARCHIVE */}
                          <div className="flex items-center justify-between gap-1.5 pt-1">
                            <div className="flex items-center space-x-1">
                              {/* Preview A4 */}
                              <button
                                type="button"
                                onClick={() => onPreviewPaper(paper)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center space-x-1 cursor-pointer"
                                title="Aperçu A4 officiel"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Aperçu</span>
                              </button>

                              {/* Download Word Official */}
                              <button
                                type="button"
                                onClick={() => exportExamPaperToWord(paper, settings, currentSchool)}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 font-black text-xs flex items-center space-x-1 transition-all cursor-pointer"
                                title="Télécharger la version Word officielle formatée (.doc)"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Word (.doc)</span>
                              </button>

                              {/* Direct Print */}
                              <button
                                type="button"
                                onClick={() => onDirectPrint(paper)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 hover:text-indigo-600 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center space-x-1 cursor-pointer"
                                title="Imprimer directement l'épreuve avec en-tête"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Imprimer</span>
                              </button>
                            </div>

                            <div className="flex items-center space-x-1">
                              {/* Archive / Restore Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleArchive(paper)}
                                className={`p-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                  isArchived
                                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200'
                                    : 'bg-slate-100 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-purple-950/50 text-slate-600 hover:text-purple-700'
                                }`}
                                title={isArchived ? "Désarchiver / Restaurer dans les épreuves actives" : "Archiver cette épreuve pour la classe"}
                              >
                                {isArchived ? (
                                  <ArchiveRestore className="h-4 w-4 text-purple-600" />
                                ) : (
                                  <FolderArchive className="h-4 w-4" />
                                )}
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Supprimer définitivement l'épreuve « ${paper.title} » ?`)) {
                                    deleteExamPaper(paper.id);
                                    showNotice("Épreuve supprimée.");
                                  }
                                }}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* MANUAL DEPOSIT MODAL (For when school receives an exam directly from a teacher) */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 space-y-5 my-8">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Recueillir & Enregistrer une Épreuve
                  </h3>
                  <p className="text-xs text-slate-500">
                    Déposer une épreuve reçue d'un enseignant (sur clé USB, WhatsApp, papier ou Word)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDepositModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualDeposit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Classe destinataire *
                  </label>
                  <select
                    value={depositClassId}
                    onChange={e => {
                      setDepositClassId(e.target.value);
                      const targetClass = classes.find(c => c.id === e.target.value);
                      if (targetClass && targetClass.studentCount) {
                        setDepositCopies(targetClass.studentCount);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    required
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.studentCount} élèves)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Matière *
                  </label>
                  <select
                    value={depositSubject}
                    onChange={e => setDepositSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    required
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nom du Professeur
                  </label>
                  <input
                    type="text"
                    value={depositTeacherName}
                    onChange={e => setDepositTeacherName(e.target.value)}
                    placeholder="Ex: M. KOUASSI, Mme DOSSOU..."
                    list="teachers-list"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                  <datalist id="teachers-list">
                    {teachers.map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({t.subjects.join(', ')})</option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone WhatsApp Enseignant
                  </label>
                  <input
                    type="tel"
                    value={depositTeacherPhone}
                    onChange={e => setDepositTeacherPhone(e.target.value)}
                    placeholder="Ex: +229 97 00 00 00"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Type d'épreuve
                  </label>
                  <select
                    value={depositExamType}
                    onChange={e => setDepositExamType(e.target.value as ExamType)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="DEVOIR_1">Devoir Surveillé N°1</option>
                    <option value="DEVOIR_2">Devoir Surveillé N°2</option>
                    <option value="COMPOSITION">Composition Trimestrielle</option>
                    <option value="INTERRO">Interrogation Écrite</option>
                    <option value="EXAMEN_BLANC">Examen Blanc</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Trimestre
                  </label>
                  <select
                    value={depositTrimester}
                    onChange={e => setDepositTrimester(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value={1}>1er Trimestre</option>
                    <option value={2}>2ème Trimestre</option>
                    <option value={3}>3ème Trimestre</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de copies demandées
                  </label>
                  <input
                    type="number"
                    value={depositCopies}
                    onChange={e => setDepositCopies(parseInt(e.target.value, 10) || 0)}
                    min={1}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Titre de l'épreuve
                </label>
                <input
                  type="text"
                  value={depositTitle}
                  onChange={e => setDepositTitle(e.target.value)}
                  placeholder="Ex: Épreuve de Mathématiques - 1er Devoir du 1er Trimestre"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              {/* Upload file attached */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Fichier de l'épreuve (.docx Word, .pdf, ou image de scan)
                </label>
                <input
                  type="file"
                  accept=".docx,.doc,.pdf,image/*"
                  onChange={handleDepositFileUpload}
                  className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
                {depositFileName && (
                  <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Fichier sélectionné : {depositFileName}
                  </p>
                )}
              </div>

              {/* Or paste content text */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Texte de l'épreuve (optionnel si fichier joint)
                </label>
                <textarea
                  rows={3}
                  value={depositContent}
                  onChange={e => setDepositContent(e.target.value)}
                  placeholder="Collez ici le sujet, les exercices ou les consignes de l'épreuve..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Enregistrer l'Épreuve</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
