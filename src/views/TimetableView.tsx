import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../lib/store';
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  Plus,
  Printer,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  PenTool,
  Sparkles,
  ScanLine,
  Bot,
  Layers,
  ChevronRight,
  ChevronDown,
  Info,
  Maximize2,
  Minimize2,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  FileDown,
  Share2,
  Filter
} from 'lucide-react';
import { TimetableSlot, AttachedTimetableDocument } from '../types';
import { ScanTimetableModal } from '../components/modals/ScanTimetableModal';
import { UploadTimetableModal } from '../components/modals/UploadTimetableModal';
import { PrintTimetableModal } from '../components/modals/PrintTimetableModal';
import { TimetableAICopilot } from '../components/TimetableAICopilot';
import {
  exportTimetableToPdf,
  exportTimetableToWord,
  exportTimetableToExcel
} from '../lib/timetableExportUtils';

export const TimetableView: React.FC = () => {
  const {
    classes,
    subjects,
    teachers,
    timetable,
    settings,
    currentSchool,
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,
    replaceClassTimetable
  } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [currentViewTab, setCurrentViewTab] = useState<'BY_CLASS' | 'BY_TEACHER' | 'ATTACHED_DOCS'>('BY_CLASS');
  
  // Modals State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalMode, setPrintModalMode] = useState<'CLASS' | 'ALL_CLASSES' | 'TEACHER'>('CLASS');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // AI Copilot Panel Visibility
  const [showAICopilot, setShowAICopilot] = useState(true);

  // State for editing a specific cell
  const [activeCellModal, setActiveCellModal] = useState<{ day: string; hour: string; existingSlot?: TimetableSlot } | null>(null);
  
  // Cell form states
  const [inputSubjectId, setInputSubjectId] = useState('');
  const [inputCustomSubject, setInputCustomSubject] = useState('');
  const [inputTeacherId, setInputTeacherId] = useState('');
  const [inputCustomTeacher, setInputCustomTeacher] = useState('');
  const [inputRoom, setInputRoom] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [justUpdatedCellKey, setJustUpdatedCellKey] = useState<string | null>(null);
  
  // Input ref to auto-focus for keyboard popping up
  const textInputRef = useRef<HTMLInputElement>(null);

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const hours = ['08h00 - 10h00', '10h15 - 12h15', '13h30 - 15h30', '15h45 - 17h45'];

  const currentClassObj = classes.find(c => c.id === selectedClassId) || classes[0];
  const currentTeacherObj = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
  
  const currentClassSlots = timetable.filter(t => t.classId === selectedClassId);
  const currentTeacherSlots = timetable.filter(t => 
    t.teacherId === selectedTeacherId ||
    (currentTeacherObj && t.customTeacher && t.customTeacher.toLowerCase().includes(currentTeacherObj.name.toLowerCase()))
  );

  // Open modal for a specific cell
  const handleOpenCell = (day: string, hour: string, slot?: TimetableSlot) => {
    setActiveCellModal({ day, hour, existingSlot: slot });
    if (slot) {
      setInputSubjectId(slot.subjectId || '');
      setInputCustomSubject(slot.customSubject || '');
      setInputTeacherId(slot.teacherId || '');
      setInputCustomTeacher(slot.customTeacher || '');
      setInputRoom(slot.room || slot.roomNumber || currentClassObj?.roomNumber || 'Salle 101');
      setInputNotes(slot.notes || '');
    } else {
      setInputSubjectId(subjects[0]?.id || '');
      setInputCustomSubject('');
      setInputTeacherId(teachers[0]?.id || '');
      setInputCustomTeacher('');
      setInputRoom(currentClassObj?.roomNumber || 'Salle 101');
      setInputNotes('');
    }
  };

  // Auto-focus input when modal opens so keyboard appears
  useEffect(() => {
    if (activeCellModal) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [activeCellModal]);

  // Save slot handler
  const handleSaveCellSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCellModal) return;

    const startTime = activeCellModal.hour.split(' - ')[0] || '08h00';
    const endTime = activeCellModal.hour.split(' - ')[1] || '10h00';

    if (activeCellModal.existingSlot) {
      updateTimetableSlot({
        ...activeCellModal.existingSlot,
        classId: selectedClassId,
        dayOfWeek: activeCellModal.day,
        day: activeCellModal.day,
        startTime,
        endTime,
        subjectId: inputSubjectId,
        customSubject: inputCustomSubject,
        teacherId: inputTeacherId,
        customTeacher: inputCustomTeacher,
        room: inputRoom,
        roomNumber: inputRoom,
        notes: inputNotes
      });
      setNoticeMsg(`Créneau mis à jour pour ${activeCellModal.day} (${activeCellModal.hour})`);
    } else {
      addTimetableSlot({
        classId: selectedClassId,
        dayOfWeek: activeCellModal.day,
        day: activeCellModal.day,
        startTime,
        endTime,
        subjectId: inputSubjectId,
        customSubject: inputCustomSubject,
        teacherId: inputTeacherId,
        customTeacher: inputCustomTeacher,
        room: inputRoom,
        roomNumber: inputRoom,
        notes: inputNotes
      });
      setNoticeMsg(`Nouveau cours enregistré pour ${activeCellModal.day} (${activeCellModal.hour})`);
    }

    setJustUpdatedCellKey(`${activeCellModal.day}-${startTime}`);
    setTimeout(() => setJustUpdatedCellKey(null), 2500);

    setActiveCellModal(null);
    setTimeout(() => setNoticeMsg(null), 3000);
  };

  // Delete slot handler
  const handleDeleteCellSlot = (slotId: string) => {
    deleteTimetableSlot(slotId);
    setNoticeMsg('Créneau effacé avec succès');
    setActiveCellModal(null);
    setTimeout(() => setNoticeMsg(null), 3000);
  };

  // Clear all slots for this class
  const handleClearClassTimetable = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir vider tous les cours de la classe ${currentClassObj?.name} ?`)) {
      replaceClassTimetable(selectedClassId, []);
      setNoticeMsg(`Grille de ${currentClassObj?.name} vidée avec succès`);
      setTimeout(() => setNoticeMsg(null), 3000);
    }
  };

  // Callback when OCR scan or AI Copilot updates timetable
  const handleTimetableUpdatedFromAI = (msg: string) => {
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(null), 4000);
  };

  // Helper for quick print/download modal opening
  const handleOpenPrintModal = (mode: 'CLASS' | 'ALL_CLASSES' | 'TEACHER') => {
    setPrintModalMode(mode);
    setIsPrintModalOpen(true);
  };

  // Quick Direct PDF Download for the current active selection
  const handleQuickDownloadPdf = (targetCls?: any, targetTch?: any) => {
    try {
      const cls = targetCls || currentClassObj;
      const tch = targetTch || currentTeacherObj;
      const isTeacher = currentViewTab === 'BY_TEACHER';
      const relevantSlots = isTeacher
        ? currentTeacherSlots
        : timetable.filter(t => t.classId === cls?.id);

      exportTimetableToPdf({
        mode: isTeacher ? 'TEACHER' : 'CLASS',
        currentClass: cls,
        currentTeacher: tch,
        classes,
        subjects,
        teachers,
        slots: relevantSlots,
        settings,
        currentSchool,
        showSignature: true,
        showSubjectSummary: true
      });
      setNoticeMsg(`Emploi du temps téléchargé en fichier PDF (${isTeacher ? (tch?.firstName || 'Enseignant') : (cls?.name || 'Classe')})`);
      setTimeout(() => setNoticeMsg(null), 3500);
    } catch (err: any) {
      console.error('Erreur export PDF:', err);
      setNoticeMsg('Erreur lors du téléchargement du PDF');
      setTimeout(() => setNoticeMsg(null), 3500);
    }
  };

  // Quick Direct Word (.doc) Download for the current active selection
  const handleQuickDownloadWord = (targetCls?: any, targetTch?: any) => {
    try {
      const cls = targetCls || currentClassObj;
      const tch = targetTch || currentTeacherObj;
      const isTeacher = currentViewTab === 'BY_TEACHER';
      const relevantSlots = isTeacher
        ? currentTeacherSlots
        : timetable.filter(t => t.classId === cls?.id);

      exportTimetableToWord({
        mode: isTeacher ? 'TEACHER' : 'CLASS',
        currentClass: cls,
        currentTeacher: tch,
        classes,
        subjects,
        teachers,
        slots: relevantSlots,
        settings,
        currentSchool,
        showSignature: true,
        showSubjectSummary: true
      });
      setNoticeMsg(`Emploi du temps téléchargé en fichier Word (.doc) (${isTeacher ? (tch?.firstName || 'Enseignant') : (cls?.name || 'Classe')})`);
      setTimeout(() => setNoticeMsg(null), 3500);
    } catch (err: any) {
      console.error('Erreur export Word:', err);
      setNoticeMsg('Erreur lors du téléchargement du document Word');
      setTimeout(() => setNoticeMsg(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Main Action Hub */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-2xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 shadow-xs">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Gestion & Téléchargement des Emplois du Temps
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] uppercase border border-emerald-200 dark:border-emerald-800">
                  Import OCR & Export HD
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Téléversez ou téléchargez les emplois du temps officiels en PDF ou Word (.doc).
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Téléverser & Télécharger */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          
          {/* UPLOAD / TÉLÉVERSER BUTTON */}
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-black text-xs flex items-center space-x-2 shadow-md shadow-blue-500/20 cursor-pointer transition-all"
            title="Téléverser une photo, un scan PDF ou un fichier Excel d'emploi du temps"
          >
            <Upload className="h-4 w-4 text-blue-200" />
            <span>Téléverser</span>
          </button>

          {/* DIRECT PDF DOWNLOAD BUTTON */}
          <button
            type="button"
            onClick={handleQuickDownloadPdf}
            className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-red-500/20 cursor-pointer transition-all"
            title="Télécharger directement l'emploi du temps actuel en fichier PDF"
          >
            <FileDown className="h-4 w-4 text-red-200" />
            <span>Télécharger PDF</span>
          </button>

          {/* DIRECT WORD DOWNLOAD BUTTON */}
          <button
            type="button"
            onClick={handleQuickDownloadWord}
            className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 active:scale-[0.99] text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-blue-700/20 cursor-pointer transition-all"
            title="Télécharger directement l'emploi du temps actuel en fichier Word (.doc)"
          >
            <FileText className="h-4 w-4 text-blue-200" />
            <span>Télécharger Word</span>
          </button>

          {/* MODAL OPENER FOR ALL FORMATS / OPTIONS */}
          <button
            type="button"
            onClick={() => handleOpenPrintModal('CLASS')}
            className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
            title="Options d'export par classe, par enseignant, Excel ou WhatsApp"
          >
            <Download className="h-4 w-4 text-emerald-200" />
            <span>Options & Export</span>
          </button>

          {/* Toggle AI Copilot Side Panel */}
          <button
            type="button"
            onClick={() => setShowAICopilot(!showAICopilot)}
            className={`px-3 py-2.5 rounded-2xl font-black text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer ${
              showAICopilot
                ? 'bg-indigo-950 text-white shadow-indigo-950/20 border border-indigo-800'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <Bot className="h-4 w-4 text-amber-400" />
            <span>{showAICopilot ? 'Copilote' : 'Copilote IA'}</span>
          </button>

          {/* Direct Download For Printing Button */}
          <button
            type="button"
            onClick={() => handleQuickDownloadPdf()}
            className="px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            title="Télécharger en PDF haute définition pour impression sur papier"
          >
            <FileDown className="h-4 w-4 text-red-600" />
            <span className="hidden sm:inline">PDF pour Impression</span>
          </button>

        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
        
        {/* Navigation Modes */}
        <div className="flex items-center space-x-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setCurrentViewTab('BY_CLASS')}
            className={`px-3.5 py-2 rounded-lg font-black transition-all cursor-pointer flex items-center space-x-2 ${
              currentViewTab === 'BY_CLASS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Par Classe</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentViewTab('BY_TEACHER')}
            className={`px-3.5 py-2 rounded-lg font-black transition-all cursor-pointer flex items-center space-x-2 ${
              currentViewTab === 'BY_TEACHER'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Planning Enseignant</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentViewTab('ATTACHED_DOCS')}
            className={`px-3.5 py-2 rounded-lg font-black transition-all cursor-pointer flex items-center space-x-2 ${
              currentViewTab === 'ATTACHED_DOCS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Fichiers & Documents Téléversés</span>
          </button>
        </div>

        {/* Dynamic Context Selector */}
        <div className="flex items-center space-x-2">
          {currentViewTab === 'BY_CLASS' && (
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-500">Choisir Classe :</span>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-extrabold text-blue-900 dark:text-blue-300 shadow-2xs outline-none"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    🏫 {c.name} ({c.roomNumber || 'Salle 101'})
                  </option>
                ))}
              </select>

              {/* Direct PDF and Word download buttons for Class */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDownloadPdf(currentClassObj)}
                  className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all"
                  title="Télécharger directement l'emploi du temps de cette classe en PDF"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDownloadWord(currentClassObj)}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all"
                  title="Télécharger directement l'emploi du temps de cette classe en Word (.doc)"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Word</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPrintModal('CLASS')}
                  className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-1 cursor-pointer"
                  title="Toutes les options et export personnalisé"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Options</span>
                </button>
              </div>
            </div>
          )}

          {currentViewTab === 'BY_TEACHER' && (
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-500">Choisir Enseignant :</span>
              <select
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-extrabold text-blue-900 dark:text-blue-300 shadow-2xs outline-none"
              >
                {teachers.map(t => {
                  const isPri = t.id.startsWith('tch-p') || t.firstName.includes('Maître') || t.firstName.includes('Maîtresse');
                  return (
                    <option key={t.id} value={t.id}>
                      {isPri ? '🎒' : '👨‍🏫'} {t.firstName} {t.lastName} ({t.qualification || t.subject || 'Enseignant'})
                    </option>
                  );
                })}
              </select>

              {/* Direct PDF and Word download buttons for Teacher */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDownloadPdf(undefined, currentTeacherObj)}
                  className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all"
                  title="Télécharger directement le planning de cet enseignant en PDF"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDownloadWord(undefined, currentTeacherObj)}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all"
                  title="Télécharger directement le planning de cet enseignant en Word (.doc)"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Word</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPrintModal('TEACHER')}
                  className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-1 cursor-pointer"
                  title="Toutes les options et export personnalisé"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Options</span>
                </button>
              </div>
            </div>
          )}

          {currentViewTab === 'ATTACHED_DOCS' && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Nouveau Fichier / Document</span>
            </button>
          )}
        </div>

      </div>

      {noticeMsg && (
        <div className="p-3.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-extrabold text-xs rounded-2xl flex items-center space-x-2.5 border border-emerald-300 dark:border-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{noticeMsg}</span>
        </div>
      )}

      {/* VIEW TAB 1: INTERACTIVE CLASS TIMETABLE GRID */}
      {currentViewTab === 'BY_CLASS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Interactive Timetable Grid */}
          <div className={`${showAICopilot ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4 transition-all duration-300`}>
            
            {/* Helper / Tips Ribbon */}
            <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50/80 dark:from-slate-800/80 dark:to-slate-800/60 rounded-2xl border border-blue-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900 dark:text-blue-300">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-bold">
                  Emploi du temps de la classe <span className="underline font-black">{currentClassObj?.name}</span> ({currentClassSlots.length} cours programmés)
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickDownloadPdf(currentClassObj)}
                  className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-100 border border-red-200 dark:border-red-800 font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                  title="Télécharger directement en PDF"
                >
                  <FileDown className="h-3 w-3" />
                  <span>Télécharger PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDownloadWord(currentClassObj)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                  title="Télécharger directement en Word (.doc)"
                >
                  <FileText className="h-3 w-3" />
                  <span>Télécharger Word</span>
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={handleClearClassTimetable}
                  className="text-rose-600 dark:text-rose-400 hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Vider la grille</span>
                </button>
              </div>
            </div>

            {/* Grid Matrix Table */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-5">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs min-w-[720px]">
                  <thead>
                    <tr>
                      <th className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 font-black uppercase text-slate-600 dark:text-slate-300 w-32 rounded-tl-xl text-center">
                        Horaires
                      </th>
                      {days.map((d, index) => (
                        <th
                          key={d}
                          className={`p-3 border border-slate-200 dark:border-slate-800 bg-blue-950 text-white font-black uppercase text-center tracking-wider ${
                            index === days.length - 1 ? 'rounded-tr-xl' : ''
                          }`}
                        >
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hours.map((hr) => (
                      <tr key={hr}>
                        {/* Hour Header Cell */}
                        <td className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 font-bold text-slate-700 dark:text-slate-300 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <span className="font-black text-[11px]">{hr}</span>
                          </div>
                        </td>

                        {/* Day Cells */}
                        {days.map((d) => {
                          const startTimeHeader = hr.split(' - ')[0] || '';
                          const match = timetable.find(t => 
                            t.classId === selectedClassId && 
                            (t.dayOfWeek === d || t.day === d) && 
                            (t.startTime === startTimeHeader || startTimeHeader.startsWith(t.startTime) || t.startTime.startsWith(startTimeHeader))
                          );

                          const sbjObj = match?.subjectId ? subjects.find(s => s.id === match.subjectId) : null;
                          const tchObj = match?.teacherId ? teachers.find(t => t.id === match.teacherId) : null;

                          const subjectName = match?.customSubject || sbjObj?.name;
                          const teacherName = match?.customTeacher || (tchObj ? `${tchObj.firstName} ${tchObj.lastName}` : '');
                          const roomText = match?.room || match?.roomNumber;

                          const isHighlighted = justUpdatedCellKey === `${d}-${startTimeHeader}`;

                          return (
                            <td
                              key={d}
                              className={`p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 align-top transition-colors ${
                                isHighlighted ? 'bg-amber-100 dark:bg-amber-950/80 animate-pulse' : ''
                              }`}
                            >
                              {match && (subjectName || teacherName || roomText || match.notes) ? (
                                <div 
                                  onClick={() => handleOpenCell(d, hr, match)}
                                  className="p-2.5 rounded-2xl bg-blue-50/90 hover:bg-blue-100/90 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/80 transition-all cursor-pointer group relative space-y-1.5 shadow-2xs hover:shadow-md"
                                  title="Cliquer pour modifier ou effacer ce cours"
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <p className="font-black text-blue-950 dark:text-blue-100 text-xs leading-snug">
                                      {subjectName || 'Cours'}
                                    </p>
                                    <Edit3 className="h-3 w-3 text-blue-500 opacity-40 group-hover:opacity-100 shrink-0 mt-0.5" />
                                  </div>

                                  {teacherName && (
                                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold flex items-center space-x-1">
                                      <User className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{teacherName}</span>
                                    </p>
                                  )}

                                  <div className="flex items-center justify-between pt-0.5 gap-1">
                                    {roomText && (
                                      <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 truncate">
                                        📍 {roomText}
                                      </span>
                                    )}
                                    {match.notes && (
                                      <span className="text-[9px] text-amber-600 dark:text-amber-400 italic truncate max-w-[80px]">
                                        {match.notes}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCell(d, hr)}
                                  className="w-full h-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-all flex flex-col items-center justify-center p-2 text-slate-400 hover:text-blue-600 cursor-pointer group"
                                >
                                  <PenTool className="h-3.5 w-3.5 mb-1 text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-transform" />
                                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600">+ Renseigner</span>
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Side: Dedicated Timetable AI Copilot */}
          {showAICopilot && (
            <div className="lg:col-span-4 space-y-4">
              <TimetableAICopilot
                selectedClassId={selectedClassId}
                onSlotModified={handleTimetableUpdatedFromAI}
              />
            </div>
          )}

        </div>
      )}

      {/* VIEW TAB 2: TEACHER WEEKLY SCHEDULE */}
      {currentViewTab === 'BY_TEACHER' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                {currentTeacherObj?.firstName?.[0] || 'P'}
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Planning Hebdomadaire de : {currentTeacherObj?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Discipline : <strong className="text-blue-600">{currentTeacherObj?.subject}</strong> &bull; Total : {currentTeacherSlots.length * 2} heures de cours assignées
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickDownloadPdf(undefined, currentTeacherObj)}
                className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-black text-xs flex items-center space-x-1.5 cursor-pointer shadow-md transition-all"
                title="Télécharger directement en PDF"
              >
                <FileDown className="h-4 w-4 text-red-200" />
                <span>Télécharger PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDownloadWord(undefined, currentTeacherObj)}
                className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 active:scale-95 text-white font-black text-xs flex items-center space-x-1.5 cursor-pointer shadow-md transition-all"
                title="Télécharger directement en Word (.doc)"
              >
                <FileText className="h-4 w-4 text-blue-200" />
                <span>Télécharger Word</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPrintModal('TEACHER')}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 cursor-pointer border border-slate-300 dark:border-slate-700"
                title="Options, Excel ou WhatsApp"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Options & Excel</span>
              </button>
            </div>
          </div>

          {/* Teacher Grid Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs min-w-[720px]">
                <thead>
                  <tr>
                    <th className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 font-black uppercase text-slate-600 dark:text-slate-300 w-32 rounded-tl-xl text-center">
                      Horaires
                    </th>
                    {days.map((d, index) => (
                      <th
                        key={d}
                        className={`p-3 border border-slate-200 dark:border-slate-800 bg-indigo-950 text-white font-black uppercase text-center tracking-wider ${
                          index === days.length - 1 ? 'rounded-tr-xl' : ''
                        }`}
                      >
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hours.map((hr) => (
                    <tr key={hr}>
                      <td className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 font-bold text-slate-700 dark:text-slate-300 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span className="font-black text-[11px]">{hr}</span>
                        </div>
                      </td>

                      {days.map((d) => {
                        const startTimeHeader = hr.split(' - ')[0] || '';
                        const match = currentTeacherSlots.find(t => 
                          (t.dayOfWeek === d || t.day === d) && 
                          (t.startTime === startTimeHeader || startTimeHeader.startsWith(t.startTime) || t.startTime.startsWith(startTimeHeader))
                        );

                        const classObj = match ? classes.find(c => c.id === match.classId) : null;
                        const sbjObj = match?.subjectId ? subjects.find(s => s.id === match.subjectId) : null;

                        return (
                          <td
                            key={d}
                            className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 align-top"
                          >
                            {match ? (
                              <div className="p-2.5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 space-y-1">
                                <p className="font-black text-indigo-950 dark:text-indigo-200 text-xs">
                                  {sbjObj?.name || match.customSubject || 'Cours'}
                                </p>
                                <p className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 flex items-center space-x-1">
                                  <span>🏫 Classe : {classObj?.name || 'Général'}</span>
                                </p>
                                <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                                  📍 {match.room || classObj?.roomNumber || 'Salle 101'}
                                </span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-300 dark:text-slate-600 italic text-center py-4">
                                — Libre —
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 3: ATTACHED & UPLOADED DOCUMENTS REPOSITORY */}
      {currentViewTab === 'ATTACHED_DOCS' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Banque des Fichiers & Emplois du Temps Officiels Téléversés
              </h3>
              <p className="text-xs text-slate-500">
                Retrouvez et téléchargez ici tous les documents PDF officiels, tableurs et photos d'emplois du temps enregistrés.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center space-x-2 cursor-pointer shadow-md"
            >
              <Upload className="h-4 w-4" />
              <span>Téléverser un nouveau document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {classes.map(cls => {
              const classSlots = timetable.filter(t => t.classId === cls.id);

              return (
                <div
                  key={cls.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between hover:border-blue-400 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-extrabold text-[10px]">
                        Classe de {cls.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {cls.room || (cls as any).roomNumber || 'Salle 101'}
                      </span>
                    </div>

                    <h4 className="font-black text-xs text-slate-900 dark:text-white">
                      Emploi du Temps — {cls.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {classSlots.length} créneaux enregistrés ({classSlots.length * 2} heures hebdomadaires)
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickDownloadPdf(cls)}
                      className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs flex items-center justify-center space-x-1 cursor-pointer shadow-xs transition-all"
                      title={`Télécharger l'emploi du temps de ${cls.name} en PDF`}
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDownloadWord(cls)}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs flex items-center justify-center space-x-1 cursor-pointer shadow-xs transition-all"
                      title={`Télécharger l'emploi du temps de ${cls.name} en Word (.doc)`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Word</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        handleOpenPrintModal('CLASS');
                      }}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      title="Plus d'options d'export"
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setCurrentViewTab('BY_CLASS');
                      }}
                      className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                      title="Éditer la grille"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* UPLOAD TIMETABLE MODAL (OCR & FILES) */}
      <UploadTimetableModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        initialClassId={selectedClassId}
        onTimetableApplied={(classId, count) => {
          setSelectedClassId(classId);
          setNoticeMsg(`Emploi du temps téléversé et ${count} cours attribués avec succès à la classe !`);
          setTimeout(() => setNoticeMsg(null), 4000);
        }}
      />

      {/* DOWNLOAD & PRINT TIMETABLE MODAL (PDF, EXCEL, WHATSAPP) */}
      <PrintTimetableModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        initialClassId={selectedClassId}
        initialTeacherId={selectedTeacherId}
        initialMode={printModalMode}
      />

      {/* LEGACY OCR SCAN MODAL */}
      <ScanTimetableModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        initialClassId={selectedClassId}
        onTimetableApplied={(classId, count) => {
          setSelectedClassId(classId);
          setNoticeMsg(`Emploi du temps scanné et ${count} cours attribués avec succès à la classe !`);
          setTimeout(() => setNoticeMsg(null), 4000);
        }}
      />

      {/* Cell Editing & Keyboard Popup Modal */}
      {activeCellModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <PenTool className="h-4 w-4 text-blue-600" />
                  <span>Renseigner la Case — {activeCellModal.day} ({activeCellModal.hour})</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Classe : <span className="text-blue-600 font-bold">{currentClassObj?.name}</span>
                </p>
              </div>
              <button 
                onClick={() => setActiveCellModal(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCellSlot} className="space-y-4 text-xs">
              
              {/* 1. Nom de la Matière (Saisie Texte au Clavier ou Choix) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <label className="block font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                  1. Matière à Enseigner *
                </label>
                
                {/* Free Text Input (triggers virtual keyboard immediately) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Écrire directement au clavier :
                  </label>
                  <input
                    ref={textInputRef}
                    type="text"
                    value={inputCustomSubject}
                    onChange={e => setInputCustomSubject(e.target.value)}
                    placeholder="Ex: Mathématiques, Histoire, Anglais, EPS, SVT..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Dropdown Alternative */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Ou sélectionner dans la liste des matières existantes :
                  </label>
                  <select
                    value={inputSubjectId}
                    onChange={e => {
                      setInputSubjectId(e.target.value);
                      const sbj = subjects.find(s => s.id === e.target.value);
                      if (sbj && !inputCustomSubject) {
                        setInputCustomSubject(sbj.name);
                      }
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs"
                  >
                    <option value="">-- Choisir une Matière prédéfinie --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Nom de l'Enseignant */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <label className="block font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                  {currentClassObj?.level === 'PRIMAIRE'
                    ? '2. Nom du Maître ou de la Maîtresse (Instituteur/trice)'
                    : currentClassObj?.level === 'MATERNELLE'
                    ? '2. Nom de la Maîtresse / Éducatrice'
                    : '2. Nom du Professeur'}
                </label>

                {/* Custom teacher text input */}
                <div>
                  <input
                    type="text"
                    value={inputCustomTeacher}
                    onChange={e => setInputCustomTeacher(e.target.value)}
                    placeholder={
                      currentClassObj?.level === 'PRIMAIRE'
                        ? 'Ex: Maître Paulin MENSAH, Maîtresse Aïcha...'
                        : currentClassObj?.level === 'MATERNELLE'
                        ? 'Ex: Maîtresse Mariam BAH...'
                        : 'Ex: Prof. DOSSOU, M. SOGLO...'
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Dropdown Alternative */}
                <div>
                  <select
                    value={inputTeacherId}
                    onChange={e => {
                      setInputTeacherId(e.target.value);
                      const tch = teachers.find(t => t.id === e.target.value);
                      if (tch && !inputCustomTeacher) {
                        setInputCustomTeacher(`${tch.firstName} ${tch.lastName}`);
                      }
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs"
                  >
                    <option value="">-- Ou Choisir dans l'équipe pédagogique --</option>
                    {teachers.map(t => {
                      const isPri = t.id.startsWith('tch-p') || t.firstName.includes('Maître') || t.firstName.includes('Maîtresse');
                      return (
                        <option key={t.id} value={t.id}>
                          {isPri ? '🎒' : '👨‍🏫'} {t.firstName} {t.lastName} ({t.qualification || t.subject || 'Enseignant'})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* 3. Salle & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    3. Salle de Cours *
                  </label>
                  <input
                    type="text"
                    required
                    value={inputRoom}
                    onChange={e => setInputRoom(e.target.value)}
                    placeholder="Ex: Salle 101, Labo..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4. Remarque / Observation
                  </label>
                  <input
                    type="text"
                    value={inputNotes}
                    onChange={e => setInputNotes(e.target.value)}
                    placeholder="Ex: Devoir, TP, Salle Info..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                {activeCellModal.existingSlot ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteCellSlot(activeCellModal.existingSlot!.id)}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-300 font-extrabold text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Effacer la case</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveCellModal(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Enregistrer la Case</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

