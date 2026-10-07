import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Eye, 
  Search, 
  BookOpen, 
  Sparkles, 
  Clock, 
  Award, 
  CheckCircle2, 
  Calendar, 
  User, 
  FolderArchive, 
  Archive,
  Trash2,
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Share2, 
  GraduationCap, 
  Paperclip,
  Phone,
  MessageCircle,
  FileCheck2,
  ExternalLink,
  Layers,
  ArrowRight,
  Undo2
} from 'lucide-react';
import { ExamPaper, Student, SchoolClass, SchoolSettings, School } from '../types';
import { exportExamPaperToWord, downloadAttachedTeacherFile } from '../lib/examExportUtils';
import { ExamContentRenderer } from './ExamContentRenderer';

interface ParentExamPapersTabProps {
  student: Student;
  currentClass?: SchoolClass;
  examPapers: ExamPaper[];
  settings: SchoolSettings;
  currentSchool: School;
}

export const ParentExamPapersTab: React.FC<ParentExamPapersTabProps> = ({
  student,
  currentClass,
  examPapers,
  settings,
  currentSchool
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedTrimester, setSelectedTrimester] = useState<number | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activePreviewPaper, setActivePreviewPaper] = useState<ExamPaper | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);

  // Storage key for student's local preferences (archived and deleted exams)
  const studentPrefsKey = `STUDENT_PAPERS_PREFS_${student.id}`;

  const [archivedPaperIds, setArchivedPaperIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${studentPrefsKey}_ARCHIVED`);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [deletedPaperIds, setDeletedPaperIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${studentPrefsKey}_DELETED`);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [statusTab, setStatusTab] = useState<'ACTIVE' | 'ARCHIVED' | 'TRASH'>('ACTIVE');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDeletePaper, setConfirmDeletePaper] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${studentPrefsKey}_ARCHIVED`, JSON.stringify(archivedPaperIds));
      } catch (e) {}
    }
  }, [archivedPaperIds, studentPrefsKey]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${studentPrefsKey}_DELETED`, JSON.stringify(deletedPaperIds));
      } catch (e) {}
    }
  }, [deletedPaperIds, studentPrefsKey]);

  const handleArchivePaper = (paperId: string) => {
    setArchivedPaperIds(prev => Array.from(new Set([...prev, paperId])));
    setToastMessage("Épreuve déplacée dans votre boîte d'archives.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUnarchivePaper = (paperId: string) => {
    setArchivedPaperIds(prev => prev.filter(id => id !== paperId));
    setToastMessage("Épreuve restaurée dans vos épreuves actives.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeletePaper = (paperId: string) => {
    setDeletedPaperIds(prev => Array.from(new Set([...prev, paperId])));
    setConfirmDeletePaper(null);
    setToastMessage("Épreuve supprimée de votre espace élève (placée dans la corbeille).");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRestorePaper = (paperId: string) => {
    setDeletedPaperIds(prev => prev.filter(id => id !== paperId));
    setToastMessage("Épreuve restaurée avec succès.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePermanentHide = (paperId: string) => {
    setArchivedPaperIds(prev => prev.filter(id => id !== paperId));
    setDeletedPaperIds(prev => Array.from(new Set([...prev, paperId])));
    setConfirmDeletePaper(null);
    setToastMessage("Épreuve définitivement masquée.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keyboard shortcut: Escape closes the preview modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activePreviewPaper) {
        setActivePreviewPaper(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePreviewPaper]);

  // Filter papers for this student's class (Permanent Archives)
  const classPapers = useMemo(() => {
    const targetClassId = student.classId;
    const targetClassName = currentClass?.name?.toLowerCase().trim() || '';

    return examPapers.filter(paper => {
      // Must not be hidden from students (if paper was sent to parents, it is permanently kept)
      if (paper.isAvailableForStudents === false && !paper.sentToParents) return false;

      // Class matching: either direct classId or class name match (or level match like "3ème" if class is "3ème A")
      const paperClassId = paper.classId;
      const paperClassName = paper.className?.toLowerCase().trim() || '';

      const isExactClass = (paperClassId && paperClassId === targetClassId) || 
                           (paperClassName && targetClassName && paperClassName === targetClassName);

      // Check level matching (e.g. "3ème" in "3ème A" or "Terminales C & D" for "Terminale D")
      const isLevelMatch = targetClassName && paperClassName && (
        paperClassName.includes(targetClassName) || targetClassName.includes(paperClassName)
      );

      const isAllClass = paperClassId === 'ALL';

      return isExactClass || isLevelMatch || isAllClass;
    });
  }, [examPapers, student.classId, currentClass?.name]);

  // Split papers by student's archive & trash status
  const activePapers = useMemo(() => {
    return classPapers.filter(p => !deletedPaperIds.includes(p.id) && !archivedPaperIds.includes(p.id));
  }, [classPapers, deletedPaperIds, archivedPaperIds]);

  const archivedPapers = useMemo(() => {
    return classPapers.filter(p => !deletedPaperIds.includes(p.id) && archivedPaperIds.includes(p.id));
  }, [classPapers, deletedPaperIds, archivedPaperIds]);

  const trashPapers = useMemo(() => {
    return classPapers.filter(p => deletedPaperIds.includes(p.id));
  }, [classPapers, deletedPaperIds]);

  const papersForCurrentTab = useMemo(() => {
    if (statusTab === 'ARCHIVED') return archivedPapers;
    if (statusTab === 'TRASH') return trashPapers;
    return activePapers;
  }, [statusTab, activePapers, archivedPapers, trashPapers]);

  // Unique list of subjects available for this class
  const availableSubjects = useMemo(() => {
    const list = Array.from(new Set(papersForCurrentTab.map(p => p.subjectName))).filter(Boolean);
    return list.sort();
  }, [papersForCurrentTab]);

  // Filtered papers according to search, subject, trimester, and type
  const filteredPapers = useMemo(() => {
    return papersForCurrentTab.filter(paper => {
      // Subject filter
      if (selectedSubject !== 'ALL' && paper.subjectName !== selectedSubject) {
        return false;
      }

      // Trimester filter
      if (selectedTrimester !== 'ALL' && paper.trimester !== selectedTrimester) {
        return false;
      }

      // Type filter
      if (selectedType !== 'ALL' && paper.examType !== selectedType) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTitle = paper.title.toLowerCase().includes(query);
        const inSubject = paper.subjectName.toLowerCase().includes(query);
        const inTeacher = (paper.teacherName || '').toLowerCase().includes(query);
        const inContent = paper.content.toLowerCase().includes(query);
        const inInstructions = (paper.instructions || '').toLowerCase().includes(query);
        return inTitle || inSubject || inTeacher || inContent || inInstructions;
      }

      return true;
    });
  }, [papersForCurrentTab, selectedSubject, selectedTrimester, selectedType, searchQuery]);

  // Subject color badge helper
  const getSubjectColor = (subject: string) => {
    const lower = subject.toLowerCase();
    if (lower.includes('math')) return 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40';
    if (lower.includes('phys') || lower.includes('chim') || lower.includes('pct')) return 'bg-sky-600/20 text-sky-300 border-sky-500/40';
    if (lower.includes('svt') || lower.includes('biol')) return 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40';
    if (lower.includes('fran') || lower.includes('litt')) return 'bg-purple-600/20 text-purple-300 border-purple-500/40';
    if (lower.includes('angl') || lower.includes('esp') || lower.includes('allem')) return 'bg-amber-600/20 text-amber-300 border-amber-500/40';
    if (lower.includes('hist') || lower.includes('géo')) return 'bg-orange-600/20 text-orange-300 border-orange-500/40';
    if (lower.includes('philo')) return 'bg-rose-600/20 text-rose-300 border-rose-500/40';
    return 'bg-blue-600/20 text-blue-300 border-blue-500/40';
  };

  // Exam type label helper
  const formatExamType = (type: string) => {
    switch (type) {
      case 'DEVOIR':
      case 'DEVOIR_1': return 'Devoir Surveillé N°1';
      case 'DEVOIR_2': return 'Devoir Surveillé N°2';
      case 'COMPOSITION': return 'Composition Trimestrielle';
      case 'EXAMEN_BLANC': return 'Examen Blanc Officiel';
      case 'INTERROGATION': return 'Interrogation Écrite';
      default: return type.replace(/_/g, ' ');
    }
  };

  // Direct print handler
  const handleDirectPrint = (paper: ExamPaper) => {
    setActivePreviewPaper(paper);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Share paper link / details
  const handleSharePaper = (paper: ExamPaper) => {
    const text = `Épreuve de ${paper.subjectName} (${paper.className}) - ${paper.title} proposée par ${paper.teacherName || "l'enseignant"}. Disponible sur l'espace scolaire ${currentSchool.name}.`;
    if (navigator.share) {
      navigator.share({
        title: paper.title,
        text: text,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedFeedback(paper.id);
      setTimeout(() => setCopiedFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-emerald-950/70 border border-blue-800/40 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 flex items-center space-x-1">
              <span>🏛️ Archives Permanentes</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-slate-950">
              Route Directe Professeur
            </span>
            <span className="text-xs text-blue-300 font-bold">
              Classe : {currentClass?.name || student.className || 'Classe'}
            </span>
            <span className="text-xs text-slate-400">
              • {currentSchool.name}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <span>Archives Permanentes des Épreuves & Devoirs</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              {classPapers.length} sujet{classPapers.length > 1 ? 's' : ''}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Toutes les épreuves et devoirs transmis par les professeurs pour la classe de <strong>{currentClass?.name || 'votre enfant'}</strong> apparaissent automatiquement ici et y restent <strong>définitivement conservés comme une archive permanente</strong> de révision, avec les consignes pédagogiques de chaque enseignant.
          </p>
        </div>

        {/* Quick Student Badge */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-sm">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <p className="text-xs font-black text-white">{student.firstName} {student.lastName}</p>
            <p className="text-[11px] text-slate-400 font-medium">{currentClass?.name || 'Élève'} • Mat: {student.registrationNumber}</p>
          </div>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Multi-Filters Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
        
        {/* Status Mode Tabs: Actives / Archivées / Corbeille */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setStatusTab('ACTIVE')}
            className={`px-3 py-2 rounded-xl font-black text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
              statusTab === 'ACTIVE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Épreuves en cours ({activePapers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab('ARCHIVED')}
            className={`px-3 py-2 rounded-xl font-black text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
              statusTab === 'ARCHIVED'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5 text-purple-300" />
            <span>Archivées ({archivedPapers.length})</span>
          </button>

          {trashPapers.length > 0 && (
            <button
              type="button"
              onClick={() => setStatusTab('TRASH')}
              className={`px-3 py-2 rounded-xl font-black text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                statusTab === 'TRASH'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-red-300" />
              <span>Corbeille ({trashPapers.length})</span>
            </button>
          )}
        </div>

        {/* Search Input and Trimester Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par matière, titre, nom du professeur, exercice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white text-xs font-bold placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Trimester Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedTrimester('ALL')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                selectedTrimester === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tous Trimestres
            </button>
            <button
              type="button"
              onClick={() => setSelectedTrimester(1)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                selectedTrimester === 1
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1er Trim.
            </button>
            <button
              type="button"
              onClick={() => setSelectedTrimester(2)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                selectedTrimester === 2
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2ème Trim.
            </button>
            <button
              type="button"
              onClick={() => setSelectedTrimester(3)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                selectedTrimester === 3
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3ème Trim.
            </button>
          </div>
        </div>

        {/* Subject Filter Pills */}
        {availableSubjects.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Matières :</span>
            <button
              type="button"
              onClick={() => setSelectedSubject('ALL')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer ${
                selectedSubject === 'ALL'
                  ? 'bg-white text-slate-950 shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Toutes ({classPapers.length})
            </button>
            {availableSubjects.map(subj => {
              const count = classPapers.filter(p => p.subjectName === subj).length;
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer ${
                    selectedSubject === subj
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {subj} ({count})
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* PAPERS LIST */}
      {filteredPapers.length === 0 ? (
        <div className="p-10 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-white">
              {searchQuery || selectedSubject !== 'ALL' || selectedTrimester !== 'ALL'
                ? "Aucune épreuve ne correspond à vos filtres"
                : "Aucune épreuve mise à disposition pour le moment"}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchQuery || selectedSubject !== 'ALL' || selectedTrimester !== 'ALL'
                ? "Essayez d'élargir votre recherche ou de réinitialiser les filtres pour afficher toutes les épreuves disponibles."
                : `Les épreuves et devoirs transmis par les professeurs de la classe ${currentClass?.name || 'de votre enfant'} apparaîtront ici automatiquement dès leur dépôt.`}
            </p>
          </div>

          {(searchQuery || selectedSubject !== 'ALL' || selectedTrimester !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('ALL');
                setSelectedTrimester('ALL');
                setSelectedType('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow cursor-pointer inline-flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPapers.map((paper) => {
            const isArchived = paper.isArchived || paper.status === 'ARCHIVE';
            return (
              <div
                key={paper.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all shadow-lg flex flex-col justify-between space-y-4 group"
              >
                
                {/* Header: Subject & Type Badges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getSubjectColor(paper.subjectName)}`}>
                        {paper.subjectName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {formatExamType(paper.examType)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        Trimestre {paper.trimester}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                      {paper.sentToParents && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>Route Directe Professeur</span>
                        </span>
                      )}

                      {archivedPaperIds.includes(paper.id) && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center space-x-1">
                          <FolderArchive className="w-3 h-3 text-purple-300" />
                          <span>Archivée</span>
                        </span>
                      )}

                      {deletedPaperIds.includes(paper.id) && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/40 flex items-center space-x-1">
                          <Trash2 className="w-3 h-3 text-red-300" />
                          <span>Corbeille</span>
                        </span>
                      )}

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center space-x-1" title="Conservé pour révisions">
                        <FolderArchive className="w-3 h-3 text-slate-400" />
                        <span>Sujet Officiel</span>
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-black text-white leading-snug group-hover:text-blue-300 transition-colors">
                    {paper.title}
                  </h3>

                  {/* Teacher & School Info */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-white truncate">
                          {paper.teacherName ? `Prof. ${paper.teacherName}` : 'Équipe Pédagogique'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">
                          Matière : {paper.subjectName} • Année : {paper.academicYear || '2025-2026'}
                        </p>
                      </div>
                    </div>

                    {paper.teacherPhone && (
                      <a
                        href={`https://wa.me/${paper.teacherPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 text-[10px] font-bold flex items-center space-x-1 shrink-0 transition-colors"
                        title="Contacter le professeur par WhatsApp si besoin d'éclaircissement"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}
                  </div>

                  {/* Exam Specs (Duration, Coefficient, Copies, Deadline) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-semibold text-slate-300">
                    <div className="p-2 rounded-xl bg-slate-950 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{paper.duration || '02 Heures'}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 flex items-center space-x-1.5">
                      <Award className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Coeff. {paper.coefficient || 1}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 col-span-2 sm:col-span-1 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{paper.createdAt || 'Récent'}</span>
                    </div>
                  </div>

                  {/* Teacher Consignes & Instructions Callout for Students/Parents */}
                  {(paper.parentInstructions || paper.instructions) && (
                    <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-amber-400 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                          📢 Consignes du Professeur :
                        </span>
                        {paper.submissionDeadline && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black text-[10px]">
                            ⏳ Pour le : {paper.submissionDeadline}
                          </span>
                        )}
                      </div>
                      <p className="text-amber-100/90 text-xs leading-relaxed font-medium">
                        {paper.parentInstructions || paper.instructions}
                      </p>
                    </div>
                  )}

                  {/* Attached Teacher Original File Banner (if uploaded by teacher) */}
                  {paper.attachedFileName && (
                    <div className="p-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <Paperclip className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="font-mono text-[11px] text-indigo-200 truncate">
                          {paper.attachedFileName}
                        </span>
                      </div>
                      {paper.attachedFileUrl && (
                        <button
                          type="button"
                          onClick={() => downloadAttachedTeacherFile(paper)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] flex items-center space-x-1 shadow cursor-pointer shrink-0 transition-all"
                          title="Télécharger le fichier original déposé par le professeur"
                        >
                          <Download className="w-3 h-3" />
                          <span>Fichier Prof</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Instructions Snippet if available */}
                  {paper.instructions && (
                    <p className="text-[11px] text-slate-400 italic line-clamp-2 bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                      « {paper.instructions} »
                    </p>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  
                  {/* Left Action Buttons: Share, Archive, Delete */}
                  <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                    {/* Share button */}
                    <button
                      type="button"
                      onClick={() => handleSharePaper(paper)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                      title="Partager cette épreuve"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">{copiedFeedback === paper.id ? 'Copié !' : 'Partager'}</span>
                    </button>

                    {/* Bouton Archiver / Désarchiver */}
                    {archivedPaperIds.includes(paper.id) ? (
                      <button
                        type="button"
                        onClick={() => handleUnarchivePaper(paper.id)}
                        className="px-2.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                        title="Désarchiver et remettre dans les épreuves actives"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-purple-300" />
                        <span className="text-[11px] font-black">Désarchiver</span>
                      </button>
                    ) : (
                      !deletedPaperIds.includes(paper.id) && (
                        <button
                          type="button"
                          onClick={() => handleArchivePaper(paper.id)}
                          className="px-2.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                          title="Archiver cette épreuve pour la classer"
                        >
                          <FolderArchive className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-[11px] font-black">Archiver</span>
                        </button>
                      )
                    )}

                    {/* Bouton Supprimer / Restaurer */}
                    {deletedPaperIds.includes(paper.id) ? (
                      <button
                        type="button"
                        onClick={() => handleRestorePaper(paper.id)}
                        className="px-2.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                        title="Restaurer cette épreuve"
                      >
                        <Undo2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px] font-black">Restaurer</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeletePaper({ id: paper.id, title: paper.title })}
                        className="px-2.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                        title="Supprimer cette épreuve de votre espace élève"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-[11px] font-black">Supprimer</span>
                      </button>
                    )}
                  </div>

                  {/* Right Action Tools: Word, Print, Consulter */}
                  <div className="flex items-center space-x-1.5 ml-auto flex-wrap gap-1">
                    
                    {/* Direct Word Export Button (.doc) */}
                    <button
                      type="button"
                      onClick={() => exportExamPaperToWord(paper, settings, currentSchool)}
                      className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 font-black text-xs flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                      title="Télécharger l'épreuve complète au format Microsoft Word (.doc) pour l'ouvrir ou la modifier"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-300" />
                      <span>Word (.doc)</span>
                    </button>

                    {/* Print Button */}
                    <button
                      type="button"
                      onClick={() => handleDirectPrint(paper)}
                      className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Imprimer directement le sujet"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Imprimer</span>
                    </button>

                    {/* View / Read Full Subject Modal */}
                    <button
                      type="button"
                      onClick={() => {
                        setActivePreviewPaper(paper);
                        setPreviewZoom(1);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center space-x-1.5 shadow-md hover:scale-105 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Consulter</span>
                    </button>

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Student Deletion */}
      {confirmDeletePaper && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">Supprimer cette épreuve ?</h3>
              <p className="text-xs text-slate-300 line-clamp-2">
                « {confirmDeletePaper.title} »
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                L'épreuve sera retirée de votre liste d'épreuves actives et placée dans votre Corbeille. Vous pourrez la restaurer à tout moment si nécessaire.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeletePaper(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDeletePaper(confirmDeletePaper.id)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg cursor-pointer transition-all"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN A4 PAPER READER MODAL */}
      {activePreviewPaper && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          
          {/* Top Fixed Control Bar */}
          <div className="w-full max-w-4xl bg-slate-900/95 border border-slate-800 text-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-wrap items-center justify-between gap-3 mb-4 sticky top-2 z-20">
            
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-xs sm:text-sm text-white truncate">
                  {activePreviewPaper.title}
                </h3>
                <p className="text-[11px] text-blue-300 truncate">
                  {activePreviewPaper.subjectName} • {activePreviewPaper.className} • {activePreviewPaper.duration}
                  {activePreviewPaper.teacherName ? ` • Prof. ${activePreviewPaper.teacherName}` : ''}
                </p>
              </div>
            </div>

            {/* Action Tools */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 ml-auto flex-wrap">
              
              {/* Zoom Controls */}
              <div className="hidden sm:flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewZoom(prev => Math.max(0.7, prev - 0.1))}
                  className="p-1 hover:bg-slate-700 rounded-lg cursor-pointer"
                  title="Zoom arrière"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-mono font-bold text-[10px]">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(prev => Math.min(1.4, prev + 0.1))}
                  className="p-1 hover:bg-slate-700 rounded-lg cursor-pointer"
                  title="Zoom avant"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(1)}
                  className="p-1 hover:bg-slate-700 rounded-lg cursor-pointer"
                  title="Taille réelle"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              {/* Download original teacher file if present */}
              {activePreviewPaper.attachedFileUrl && (
                <button
                  type="button"
                  onClick={() => downloadAttachedTeacherFile(activePreviewPaper)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center space-x-1 shadow cursor-pointer"
                  title="Télécharger le fichier original de l'enseignant"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Fichier Prof</span>
                </button>
              )}

              {/* Export Word Button */}
              <button
                type="button"
                onClick={() => exportExamPaperToWord(activePreviewPaper, settings, currentSchool)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center space-x-1 shadow cursor-pointer"
                title="Télécharger en document Word (.doc)"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>Télécharger Word (.doc)</span>
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center space-x-1 cursor-pointer"
                title="Imprimer"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActivePreviewPaper(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Fermer (Échap)"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

          </div>

          {/* Printable A4 Container */}
          <div 
            className="w-full max-w-4xl bg-white text-slate-900 rounded-3xl shadow-2xl p-4 sm:p-10 border-4 border-slate-200 transition-transform origin-top printable-exam-modal-container"
            style={{ transform: `scale(${previewZoom})` }}
          >
            <ExamContentRenderer
              paper={activePreviewPaper}
              settings={settings}
              includeHeader={activePreviewPaper.includeHeader === true || (!activePreviewPaper.teacherName && !activePreviewPaper.teacherId && activePreviewPaper.includeHeader !== false)}
              showVersoDivider={true}
            />
          </div>

        </div>
      )}

    </div>
  );
};
