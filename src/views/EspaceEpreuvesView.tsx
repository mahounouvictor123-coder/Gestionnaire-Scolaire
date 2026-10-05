import React, { useState, useEffect } from 'react';
import { useApp } from '../lib/store';
import { ExamPaper, ExamType } from '../types';
import { ScanExamPaperModal } from '../components/modals/ScanExamPaperModal';
import { ExamHeaderConfigModal } from '../components/modals/ExamHeaderConfigModal';
import { AIExamCopilotChat } from '../components/AIExamCopilotChat';
import { ExamContentRenderer, cleanAndFormatMathText, parseSquareRoots } from '../components/ExamContentRenderer';
import { clientFetch } from '../services/clientFetch.ts';
import {
  FileText,
  Sparkles,
  Building,
  Printer,
  Download,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  BookOpen,
  Award,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  X,
  Split,
  ShieldCheck,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ClipboardPaste,
  Camera,
  ArrowLeft,
  FolderArchive,
  GraduationCap,
  Archive,
  ArchiveRestore,
  FileUp
} from 'lucide-react';
import { ClassExamRepositoryAndArchiveTab } from '../components/ClassExamRepositoryAndArchiveTab';
import { exportExamPaperToWord, downloadAttachedTeacherFile } from '../lib/examExportUtils';

interface EspaceEpreuvesViewProps {
  onNavigate?: (view: string) => void;
}

export const EspaceEpreuvesView: React.FC<EspaceEpreuvesViewProps> = ({ onNavigate }) => {
  const { 
    examPapers, 
    classes, 
    subjects, 
    settings, 
    currentSchool, 
    deleteExamPaper, 
    updateExamPaper,
    refreshExamPapersFromCloud 
  } = useApp();

  const [isRefreshingCloud, setIsRefreshingCloud] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanModalInitialTab, setScanModalInitialTab] = useState<'IMAGE' | 'TEXT' | 'DEMO'>('IMAGE');
  const [isHeaderConfigOpen, setIsHeaderConfigOpen] = useState(false);

  const [mainTab, setMainTab] = useState<'CLASS_ARCHIVES' | 'OCR_GENERATOR' | 'ALL_EXAMS'>('CLASS_ARCHIVES');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [originFilter, setOriginFilter] = useState<'ALL' | 'TEACHERS' | 'ADMIN'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [activePreviewPaper, setActivePreviewPaper] = useState<ExamPaper | null>(null);
  const [previewViewMode, setPreviewViewMode] = useState<'SPLIT' | 'WORD_ONLY'>('SPLIT');
  const [isSynchronizing, setIsSynchronizing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);

  // Auto-refresh from cloud on mount and when tab/window regains focus
  useEffect(() => {
    refreshExamPapersFromCloud();
    const handleFocus = () => {
      refreshExamPapersFromCloud();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleManualCloudRefresh = async () => {
    setIsRefreshingCloud(true);
    await refreshExamPapersFromCloud();
    setTimeout(() => setIsRefreshingCloud(false), 600);
  };

  const handleDirectPrint = (paper: ExamPaper) => {
    setActivePreviewPaper(paper);
    setTimeout(() => {
      window.print();
    }, 350);
  };

  // Smooth Escape key handler to easily exit preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activePreviewPaper) {
        setActivePreviewPaper(null);
        setSyncStatusMessage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePreviewPaper]);

  const handleSyncActivePaper = async () => {
    if (!activePreviewPaper || !activePreviewPaper.originalImageUrl) {
      alert("Aucune image originale attachée à cette épreuve.");
      return;
    }

    setIsSynchronizing(true);
    setSyncStatusMessage("Synchronisation et réalignement avec l'image scannée...");

    try {
      const res = await clientFetch('/api/ai/sync-exam-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: activePreviewPaper.originalImageUrl,
          currentPaper: activePreviewPaper,
          targetSubject: activePreviewPaper.subjectName,
          targetClass: activePreviewPaper.className
        })
      });

      if (!res.ok) throw new Error("Erreur de synchronisation");

      const data = await res.json();
      const updated: ExamPaper = {
        ...activePreviewPaper,
        title: data.title || activePreviewPaper.title,
        subjectName: data.subjectName || activePreviewPaper.subjectName,
        className: data.className || activePreviewPaper.className,
        duration: data.duration || activePreviewPaper.duration,
        coefficient: data.coefficient || activePreviewPaper.coefficient,
        instructions: data.instructions || activePreviewPaper.instructions,
        content: data.content || activePreviewPaper.content
      };

      setActivePreviewPaper(updated);
      updateExamPaper(updated);
      setSyncStatusMessage("✅ Synchronisation parfaite réussie et enregistrée !");
    } catch (err) {
      console.error("Erreur sync:", err);
      setSyncStatusMessage("Avertissement : Erreur de synchronisation.");
    } finally {
      setIsSynchronizing(false);
    }
  };

  // Filter papers
  const filteredPapers = examPapers.filter(paper => {
    const matchesClass = selectedClassFilter === 'ALL' || paper.classId === selectedClassFilter || paper.className === selectedClassFilter;
    const matchesType = selectedTypeFilter === 'ALL' || 
      (selectedTypeFilter === 'DEVOIR' && (paper.examType === 'DEVOIR' || paper.examType === 'DEVOIR_1' || paper.examType === 'DEVOIR_2')) ||
      (selectedTypeFilter === 'COMPOSITION' && (paper.examType === 'COMPOSITION' || paper.examType.startsWith('COMPOSITION'))) ||
      (selectedTypeFilter === 'INTERRO' && (paper.examType === 'INTERRO' || paper.examType.startsWith('INTERRO'))) ||
      paper.examType === selectedTypeFilter;
    const isFromTeacher = !!(paper.teacherName || paper.teacherId || paper.teacherPhone || paper.sentToSchool || paper.sentToParents || paper.submissionNotes || paper.attachedFileName);
    const matchesOrigin = originFilter === 'ALL' || (originFilter === 'TEACHERS' && isFromTeacher) || (originFilter === 'ADMIN' && !isFromTeacher);
    const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          paper.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          paper.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (paper.teacherName && paper.teacherName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (paper.teacherPhone && paper.teacherPhone.includes(searchTerm));
    return matchesClass && matchesType && matchesOrigin && matchesSearch;
  });

  const teacherPapersCount = examPapers.filter(p => !!(p.teacherName || p.teacherId || p.teacherPhone || p.sentToSchool || p.sentToParents || p.submissionNotes || p.attachedFileName)).length;
  const pendingTeacherPapersCount = examPapers.filter(p => !!(p.teacherName || p.teacherId || p.sentToSchool) && (!p.status || p.status === 'EN_ATTENTE')).length;
  const adminPapersCount = Math.max(0, examPapers.length - teacherPapersCount);

  // Export any paper directly to Word (.doc)
  const exportToWord = (paper: ExamPaper) => {
    const includeHeader = paper.includeHeader !== false;
    const logoHtml = (includeHeader && (settings.examHeaderUrl || settings.logoUrl))
      ? `<img src="${settings.examHeaderUrl || settings.logoUrl}" width="80" height="80" style="vertical-align:middle; margin:5px;"/>`
      : '';

    // Check if content has explicit Verso tag or a Problem/Exercice 3 section to break onto Page 2
    const versoBreakRegex = /\[(?:---|\s)*(?:PAGE 2 \/ VERSO|VERSO|PAGE_BREAK|SAUT DE PAGE)(?:---|\s)*\]/i;
    const hasExplicitVerso = versoBreakRegex.test(paper.content);

    let contentToProcess = paper.content;
    if (!hasExplicitVerso) {
      // Auto-insert Verso break if text contains PROBLÈME, SITUATION COMPLEXE, EXERCICE 3, EXERCICE 4 or CORRIGÉ
      const problemMatch = contentToProcess.match(/\n(?=(?:PROBLÈME|SITUATION COMPLEXE|CORRIGÉ|EXERCICE 3|EXERCICE 4))/i);
      if (problemMatch && problemMatch.index && problemMatch.index > 300) {
        contentToProcess = contentToProcess.substring(0, problemMatch.index) + '\n\n[--- PAGE 2 / VERSO ---]\n\n' + contentToProcess.substring(problemMatch.index);
      }
    }

    const hasVersoBreak = versoBreakRegex.test(contentToProcess);

    let formattedContent = cleanAndFormatMathText(contentToProcess);

    if (includeHeader) {
      formattedContent = formattedContent.replace(
        /\[(?:---|\s)*(?:PAGE 2 \/ VERSO|VERSO|PAGE_BREAK|SAUT DE PAGE)(?:---|\s)*\]/gi,
        `<br clear="all" style="page-break-before:always; mso-break-type:section-break" />
         <div style="border-bottom:1.5pt solid #000; padding-bottom:6px; margin-bottom:15px; font-family:'Times New Roman', serif; font-size:10pt; font-weight:bold;">
           ${paper.subjectName.toUpperCase()} — CLASSE : ${paper.className.toUpperCase()}
         </div>`
      );
    } else {
      // Sans en-tête / Verso sans en-tête: Pure page break, no borders, no frames, no header text
      formattedContent = formattedContent.replace(
        /\[(?:---|\s)*(?:PAGE 2 \/ VERSO|VERSO|PAGE_BREAK|SAUT DE PAGE)(?:---|\s)*\]/gi,
        `<br clear="all" style="page-break-before:always; mso-break-type:section-break" />`
      );
    }

    formattedContent = parseSquareRoots(formattedContent, true);

    formattedContent = formattedContent.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)');
    formattedContent = formattedContent.replace(/\n/g, '<br/>');

    const wordHeaderSection = includeHeader ? `
          <!-- PAGE 1 RECTO HEADER -->
          <table class="header-table">
            <tr>
              <td class="header-col" style="width: 42%;">
                ${(settings.ministryHeader || "RÉPUBLIQUE DU BÉNIN<br/>MINISTÈRE DE L'ENSEIGNEMENT SECONDAIRE").replace(/\n/g, '<br/>')}
                <br/><br/>
                ${(settings.regionalDirection || "DIRECTION RÉGIONALE DE L'ENSEIGNEMENT").replace(/\n/g, '<br/>')}
              </td>
              <td class="header-col" style="width: 16%;">
                ${logoHtml}
              </td>
              <td class="header-col" style="width: 42%;">
                ÉTABLISSEMENT :<br/>
                <span class="school-title">${(settings.schoolName && settings.schoolName !== 'GESTIONNAIRE SCOLAIRE') ? settings.schoolName : (currentSchool?.name || 'ÉTABLISSEMENT SCOLAIRE')}</span><br/>
                <em>${settings.motto || currentSchool?.motto || 'Discipline • Travail • Rigueur'}</em><br/>
                Année Scolaire : ${paper.academicYear || settings.academicYear}
              </td>
            </tr>
          </table>

          <div class="exam-box">
            ${paper.title}
          </div>

          <table class="info-table">
            <tr>
              <td>MATIÈRE : ${paper.subjectName.toUpperCase()}</td>
              <td>CLASSE : ${paper.className.toUpperCase()}</td>
            </tr>
            <tr>
              <td>DURÉE : ${paper.duration.toUpperCase()}</td>
              <td>COEFFICIENT : ${paper.coefficient}</td>
            </tr>
          </table>

          ${paper.instructions ? `<div class="instructions-box">CONSIGNES : ${paper.instructions}</div>` : ''}
          ` : '';

    const wordDocumentHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${paper.title}</title>
        <style>
          @page WordSection1 {
            size: 595.3pt 841.9pt;
            margin: 36pt 36pt 36pt 36pt;
          }
          div.WordSection1 { page: WordSection1; font-family: 'Times New Roman', serif; }
          .header-table { width: 100%; border-bottom: 2px solid #000; margin-bottom: 15px; }
          .header-col { text-align: center; vertical-align: top; font-size: 10pt; font-weight: bold; }
          .school-title { font-size: 12pt; color: #1e3a8a; text-transform: uppercase; font-weight: bold; }
          .exam-box { border: 2px solid #000; background-color: #f8fafc; padding: 10px; text-align: center; font-size: 14pt; font-weight: bold; margin: 15px 0; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .info-table td { border: 1px solid #000; padding: 6px; font-size: 10pt; font-weight: bold; }
          .instructions-box { font-style: italic; font-size: 10pt; text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 20px; }
          .content-text { font-size: 11pt; line-height: 1.6; word-wrap: break-word; font-family: 'Times New Roman', serif; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          ${wordHeaderSection}

          <div class="content-text">
            ${formattedContent}
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordDocumentHtml], {
      type: 'application/msword;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EPREUVE_${paper.subjectName.replace(/\s+/g, '_')}_${paper.className.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center space-x-1 transition-all mr-1"
                  title="Retourner au Tableau de Bord"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-amber-300" />
                  <span>Accueil</span>
                </button>
              )}
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                Numérisation & Formatage Word Automatique
              </span>
              <span className="text-xs text-blue-200">• {settings.schoolName}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Espace Épreuves & Numérisation d'Examens
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Scannez les épreuves manuscrites ou imprimées de devoirs et compositions. La plateforme retranscrit le contenu avec l'IA et génère instantanément la version Word avec l'en-tête officiel de l'école.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleManualCloudRefresh}
              disabled={isRefreshingCloud}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center space-x-2 backdrop-blur-sm border border-white/10 transition-all cursor-pointer disabled:opacity-50"
              title="Synchroniser et récupérer immédiatement les épreuves envoyées par les professeurs"
            >
              <RefreshCw className={`h-4 w-4 text-emerald-300 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
              <span>{isRefreshingCloud ? 'Synchronisation...' : 'Actualiser Épreuves'}</span>
            </button>

            <button
              onClick={() => setIsHeaderConfigOpen(true)}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center space-x-2 backdrop-blur-sm border border-white/10 transition-all cursor-pointer"
            >
              <Building className="h-4 w-4 text-amber-300" />
              <span>En-Tête Officiel</span>
            </button>

            <button
              onClick={() => {
                setScanModalInitialTab('TEXT');
                setIsScanModalOpen(true);
              }}
              className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <ClipboardPaste className="h-4 w-4 text-indigo-200" />
              <span>Coller Texte / Word (IA)</span>
            </button>

            <button
              onClick={() => {
                setScanModalInitialTab('IMAGE');
                setIsScanModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Camera className="h-4 w-4 text-slate-950" />
              <span>Scanner Photo / Scan (IA)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Section Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/90 dark:bg-slate-800/90 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm w-full">
        <button
          type="button"
          onClick={() => setMainTab('CLASS_ARCHIVES')}
          className={`flex-1 sm:flex-none px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            mainTab === 'CLASS_ARCHIVES'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
          }`}
        >
          <FolderArchive className="h-4 w-4 text-amber-300" />
          <span>📂 Recueil & Archives par Classe ({teacherPapersCount})</span>
          {pendingTeacherPapersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-pulse">
              {pendingTeacherPapersCount} à valider
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setMainTab('OCR_GENERATOR');
            setOriginFilter('ALL');
          }}
          className={`flex-1 sm:flex-none px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            mainTab === 'OCR_GENERATOR'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>🤖 Scanner & Générateur Word (IA)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMainTab('ALL_EXAMS');
            setOriginFilter('ALL');
          }}
          className={`flex-1 sm:flex-none px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            mainTab === 'ALL_EXAMS'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>📚 Banque Complète ({examPapers.length})</span>
        </button>
      </div>

      {mainTab === 'CLASS_ARCHIVES' ? (
        <ClassExamRepositoryAndArchiveTab
          onPreviewPaper={setActivePreviewPaper}
          onDirectPrint={handleDirectPrint}
        />
      ) : (
        <>
          {/* Origin Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOriginFilter('ALL')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                originFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Toutes les Épreuves ({examPapers.length})
            </button>

            <button
              type="button"
              onClick={() => setOriginFilter('TEACHERS')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center space-x-2 transition-all cursor-pointer ${
                originFilter === 'TEACHERS'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>👨‍🏫 Déposées par les Professeurs ({teacherPapersCount})</span>
              {pendingTeacherPapersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-pulse">
                  {pendingTeacherPapersCount} à valider
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setOriginFilter('ADMIN')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                originFilter === 'ADMIN'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              🏛️ Numérisées en Administration ({adminPapersCount})
            </button>
          </div>

      {/* Filter and Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Search & Filters (8 cols) */}
        <div className="md:col-span-8 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3 text-xs">
          
          <div className="flex-1 min-w-[200px] relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher une épreuve, classe, matière..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedClassFilter}
              onChange={e => setSelectedClassFilter(e.target.value)}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            >
              <option value="ALL">Toutes les classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            >
              <option value="ALL">Tous les types</option>
              <option value="DEVOIR">Devoirs Surveillés</option>
              <option value="COMPOSITION">Compositions</option>
              <option value="INTERRO">Interrogations</option>
            </select>
          </div>

        </div>

        {/* Info card (4 cols) */}
        <div className="md:col-span-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center space-x-3 text-emerald-900 dark:text-emerald-200">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-black">{examPapers.length} Épreuves Numérisées</p>
            <p className="text-[11px] opacity-80">Prêtes pour impression & téléchargement Word</p>
          </div>
        </div>

      </div>

      {/* Exam Papers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPapers.map(paper => (
          <div
            key={paper.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              
              {/* Badges */}
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    paper.examType === 'COMPOSITION'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {paper.examType === 'COMPOSITION' ? 'Composition' : 'Devoir'}
                  </span>

                  {paper.teacherName && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      paper.status === 'VALIDE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30'
                        : paper.status === 'IMPRIME'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-500/30'
                        : paper.status === 'REJETE'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-500/30'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-500/30'
                    }`}>
                      {paper.status === 'VALIDE' ? '✓ Validée Censeur' :
                       paper.status === 'IMPRIME' ? '🖨️ Tirage Prêt' :
                       paper.status === 'REJETE' ? '⚠️ Retouche' :
                       '⏳ En attente validation'}
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1 shrink-0">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {paper.createdAt}
                </span>
              </div>

              {/* Teacher Origin Banner */}
              {paper.teacherName && (
                <div className="p-2.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-900 dark:text-indigo-200 flex items-center space-x-1 truncate">
                      <span>👨‍🏫 Prof. {paper.teacherName}</span>
                    </span>
                    {paper.teacherPhone && (
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0 font-mono">
                        📞 {paper.teacherPhone}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                    {paper.numberOfCopiesRequested ? (
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        🖨️ {paper.numberOfCopiesRequested} copies demandées
                      </span>
                    ) : <span />}
                    {paper.examDate && (
                      <span>Prévu le : <strong>{paper.examDate}</strong></span>
                    )}
                  </div>

                  {paper.submissionNotes && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                      "{paper.submissionNotes}"
                    </p>
                  )}

                  {/* Attached File Pill & Download */}
                  {paper.attachedFileName && (
                    <div className="mt-1 pt-1.5 border-t border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-indigo-800 dark:text-indigo-300 truncate">
                        📎 {paper.attachedFileName}
                      </span>
                      {paper.attachedFileUrl && (
                        <a
                          href={paper.attachedFileUrl}
                          download={paper.attachedFileName}
                          className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-700 shrink-0 transition-colors"
                        >
                          Télécharger
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Title & Subject */}
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                  {paper.title}
                </h3>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {paper.subjectName} • {paper.className}
                </p>
              </div>

              {/* Details Pills */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400 pt-1">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center space-x-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Durée : {paper.duration}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center space-x-1.5">
                  <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Coeff : {paper.coefficient}</span>
                </div>
              </div>

              {/* Snippet preview */}
              <p className="text-[11px] text-slate-500 line-clamp-3 font-serif bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl italic">
                "{paper.content.substring(0, 140)}..."
              </p>

            </div>

            {/* Quick Administrative Workflow Actions for Teacher Submissions */}
            {paper.teacherName && (!paper.status || paper.status === 'EN_ATTENTE') && (
              <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                  Validation Censeur :
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const feedback = prompt("Précisez la remarque ou correction demandée à l'enseignant :");
                      if (feedback !== null) {
                        updateExamPaper({ ...paper, status: 'REJETE', schoolFeedback: feedback });
                      }
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    Demander retouche
                  </button>
                  <button
                    type="button"
                    onClick={() => updateExamPaper({ ...paper, status: 'VALIDE' })}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Valider Tirage</span>
                  </button>
                </div>
              </div>
            )}

            {paper.teacherName && paper.status === 'VALIDE' && (
              <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                  Épreuve validée ({paper.numberOfCopiesRequested || 'X'} copies)
                </span>
                <button
                  type="button"
                  onClick={() => updateExamPaper({ ...paper, status: 'IMPRIME' })}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-600 hover:bg-blue-500 text-white shadow transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Printer className="w-3 h-3" />
                  <span>Marquer Tiré</span>
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setActivePreviewPaper(paper)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center space-x-1"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Aperçu A4</span>
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => exportToWord(paper)}
                  title="Télécharger en version Word (.doc / .docx)"
                  className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-all font-bold text-xs flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Word</span>
                </button>

                <button
                  onClick={() => {
                    setActivePreviewPaper(paper);
                    setTimeout(() => window.print(), 200);
                  }}
                  title="Imprimer l'épreuve"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  <Printer className="h-4 w-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm("Supprimer cette épreuve de la banque d'examens ?")) {
                      deleteExamPaper(paper.id);
                    }
                  }}
                  title="Supprimer"
                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {filteredPapers.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <FileText className="h-12 w-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
            Aucune épreuve numérisée trouvée
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Collez un texte copié depuis Word / PDF ou prenez en photo un devoir imprimé/manuscrit pour générer l'épreuve formatée avec l'en-tête officiel.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setScanModalInitialTab('TEXT');
                setIsScanModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs inline-flex items-center space-x-2 shadow-md transition-all"
            >
              <ClipboardPaste className="h-4 w-4 text-indigo-200" />
              <span>Coller Texte / Word (IA)</span>
            </button>

            <button
              onClick={() => {
                setScanModalInitialTab('IMAGE');
                setIsScanModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs inline-flex items-center space-x-2 shadow-md transition-all"
            >
              <Camera className="h-4 w-4 text-amber-300" />
              <span>Scanner Photo / Scan (IA)</span>
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* FULL-SCREEN A4 PREVIEW MODAL */}
      {activePreviewPaper && (
        <div 
          onClick={() => {
            setActivePreviewPaper(null);
            setSyncStatusMessage(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto backdrop-enter"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`bg-white dark:bg-slate-900 rounded-3xl w-full p-4 sm:p-6 space-y-5 max-h-[94vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl modal-enter ${activePreviewPaper.originalImageUrl && previewViewMode === 'SPLIT' ? 'max-w-7xl' : 'max-w-4xl'}`}
          >
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider">
                  Espace Word Officiel A4
                </span>
                <span className="text-xs font-black truncate max-w-xs sm:max-w-md">{activePreviewPaper.title}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activePreviewPaper.originalImageUrl && (
                  <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPreviewViewMode('SPLIT')}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                        previewViewMode === 'SPLIT'
                          ? 'bg-blue-600 text-white font-black shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Vue côte à côte : Scan original & Document Word"
                    >
                      <Split className="h-3.5 w-3.5" />
                      <span>Vue Synchronisée</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewMode('WORD_ONLY')}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                        previewViewMode === 'WORD_ONLY'
                          ? 'bg-blue-600 text-white font-black shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Document Word plein format"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>Word Seul</span>
                    </button>
                  </div>
                )}

                {activePreviewPaper.originalImageUrl && (
                  <button
                    type="button"
                    onClick={handleSyncActivePaper}
                    disabled={isSynchronizing}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center space-x-1.5 shadow-md transition-all ${
                      isSynchronizing
                        ? 'bg-amber-600 text-white animate-pulse'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                    }`}
                  >
                    {isSynchronizing ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                    )}
                    <span>🔄 Synchroniser avec le Scan</span>
                  </button>
                )}

                {/* Mode En-tête toggle */}
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setActivePreviewPaper({ ...activePreviewPaper, includeHeader: true })}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                      activePreviewPaper.includeHeader !== false
                        ? 'bg-blue-600 text-white shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Building className="h-3 w-3" />
                    <span>Avec En-tête</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewPaper({ ...activePreviewPaper, includeHeader: false })}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                      activePreviewPaper.includeHeader === false
                        ? 'bg-blue-600 text-white shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <FileText className="h-3 w-3" />
                    <span>Sans En-tête</span>
                  </button>
                </div>

                {/* Download original attached teacher file if present */}
                {activePreviewPaper.attachedFileUrl && (
                  <button
                    type="button"
                    onClick={() => downloadAttachedTeacherFile(activePreviewPaper)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-md cursor-pointer"
                    title="Télécharger le fichier original déposé par l'enseignant"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Fichier Original Prof</span>
                  </button>
                )}

                {/* Archive / Restore Button */}
                <button
                  type="button"
                  onClick={() => {
                    const isArchived = activePreviewPaper.isArchived || activePreviewPaper.status === 'ARCHIVE';
                    const updated: ExamPaper = {
                      ...activePreviewPaper,
                      isArchived: !isArchived,
                      status: !isArchived ? 'ARCHIVE' : 'VALIDE',
                      archivedAt: !isArchived ? new Date().toISOString() : undefined,
                      archivedBy: !isArchived ? (settings.schoolName || 'Direction') : undefined
                    };
                    setActivePreviewPaper(updated);
                    updateExamPaper(updated);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                    activePreviewPaper.isArchived || activePreviewPaper.status === 'ARCHIVE'
                      ? 'bg-purple-700 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-purple-950 text-slate-700 dark:text-slate-200'
                  }`}
                  title={activePreviewPaper.isArchived || activePreviewPaper.status === 'ARCHIVE' ? "Désarchiver l'épreuve" : "Archiver l'épreuve"}
                >
                  <FolderArchive className="h-3.5 w-3.5 text-purple-400" />
                  <span>{activePreviewPaper.isArchived || activePreviewPaper.status === 'ARCHIVE' ? 'Archivée (Restaurer)' : 'Archiver'}</span>
                </button>

                <button
                  onClick={() => exportExamPaperToWord(activePreviewPaper, settings, currentSchool)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center space-x-1.5 shadow-md cursor-pointer"
                  title="Télécharger l'épreuve formatée au format Word (.doc)"
                >
                  <Download className="h-3.5 w-3.5 text-amber-300" />
                  <span>Version Word (.doc)</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-black text-xs flex items-center space-x-1.5 cursor-pointer"
                  title="Imprimer l'épreuve"
                >
                  <Printer className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Imprimer</span>
                </button>

                <button
                  onClick={() => {
                    setActivePreviewPaper(null);
                    setSyncStatusMessage(null);
                  }}
                  className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Sync status banner */}
            {syncStatusMessage && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 border border-teal-500/40 text-white text-xs flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-slate-200">{syncStatusMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSyncStatusMessage(null)}
                  className="text-slate-400 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Interactive AI Agent Copilot Chat */}
            <AIExamCopilotChat
              paper={activePreviewPaper}
              onPaperUpdated={(updated) => {
                const merged = { ...activePreviewPaper, ...updated };
                setActivePreviewPaper(merged);
                updateExamPaper(merged);
              }}
            />

            {/* Main Preview Container: Dual Split View vs Single A4 View */}
            {activePreviewPaper.originalImageUrl && previewViewMode === 'SPLIT' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Pane: Original Scan Image with Zoom */}
                <div className="lg:col-span-5 space-y-3 sticky top-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center space-x-1.5">
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                      <span>Épreuve Originale Importée</span>
                    </span>
                    
                    <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(prev => Math.max(0.6, prev - 0.2))}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        title="Dézoomer"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-mono text-[10px] font-bold px-1">{Math.round(previewZoom * 100)}%</span>
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(prev => Math.min(2.5, prev + 0.2))}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        title="Zoomer"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-950 p-2 overflow-auto max-h-[580px] flex items-center justify-center">
                    <img
                      src={activePreviewPaper.originalImageUrl}
                      alt="Épreuve originale"
                      style={{
                        transform: `scale(${previewZoom})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.15s ease-out'
                      }}
                      className="max-w-full rounded-lg shadow-md"
                    />
                  </div>
                </div>

                {/* Right Pane: Formatted A4 Document */}
                <div className="lg:col-span-7">
                  <ExamContentRenderer
                    paper={activePreviewPaper}
                    settings={settings}
                    includeHeader={activePreviewPaper.includeHeader !== false}
                  />
                </div>

              </div>
            ) : (
              /* Single Full A4 Document */
              <ExamContentRenderer
                paper={activePreviewPaper}
                settings={settings}
                includeHeader={activePreviewPaper.includeHeader !== false}
              />
            )}

          </div>
        </div>
      )}

      {/* SCAN MODAL */}
      <ScanExamPaperModal
        isOpen={isScanModalOpen}
        initialTab={scanModalInitialTab}
        onClose={() => setIsScanModalOpen(false)}
      />

      {/* HEADER CONFIG MODAL */}
      <ExamHeaderConfigModal
        isOpen={isHeaderConfigOpen}
        onClose={() => setIsHeaderConfigOpen(false)}
      />

    </div>
  );
};
