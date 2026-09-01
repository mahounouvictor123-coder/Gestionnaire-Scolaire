import React, { useState, useEffect } from 'react';
import { useApp } from '../lib/store';
import {
  Award,
  Calendar,
  Clock,
  Plus,
  X,
  BookOpen,
  Building,
  Sparkles,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  Filter,
  UserCheck,
  Search,
  School,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { ScanExamPaperModal } from '../components/modals/ScanExamPaperModal';
import { Exam } from '../types';

interface ExamsViewProps {
  onNavigate?: (view: string) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({ onNavigate }) => {
  const { exams, addExam, updateExam, deleteExam, classes, subjects, currentSchool, settings } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanPaperModal, setShowScanPaperModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // Escape key handler for smooth closing of modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddModal) setShowAddModal(false);
        if (editingExam) setEditingExam(null);
        if (showScanPaperModal) setShowScanPaperModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, editingExam, showScanPaperModal]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DEVOIR' | 'COMPOSITION' | 'EXAMEN_BLANC' | 'INTERRO'>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Add form fields
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState<'DEVOIR' | 'COMPOSITION' | 'EXAMEN_BLANC' | 'INTERRO'>('COMPOSITION');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08h00 - 10h00');
  const [duration, setDuration] = useState('2 heures');
  const [room, setRoom] = useState('Salle Principale');
  const [coefficient, setCoefficient] = useState(2);
  const [trimester, setTrimester] = useState<1 | 2 | 3>(1);
  const [supervisorName, setSupervisorName] = useState('');
  const [instructions, setInstructions] = useState('');

  // Edit form fields
  const [editTitle, setEditTitle] = useState('');
  const [editExamType, setEditExamType] = useState<'DEVOIR' | 'COMPOSITION' | 'EXAMEN_BLANC' | 'INTERRO'>('COMPOSITION');
  const [editClassId, setEditClassId] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');
  const [editExamDate, setEditExamDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editCoefficient, setEditCoefficient] = useState(2);
  const [editTrimester, setEditTrimester] = useState<1 | 2 | 3>(1);
  const [editSupervisorName, setEditSupervisorName] = useState('');
  const [editInstructions, setEditInstructions] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addExam({
      title: title.trim(),
      classId: classId || classes[0]?.id || '',
      subjectId: subjectId || subjects[0]?.id || '',
      date: examDate,
      time: time || '08h00 - 10h00',
      duration: duration || '2 heures',
      durationMinutes: duration.includes('3') ? 180 : duration.includes('4') ? 240 : 120,
      room: room || 'Salle d\'examen',
      roomNumber: room || 'Salle d\'examen',
      coefficient: Number(coefficient) || 2,
      trimester,
      examType,
      supervisorName: supervisorName.trim() || undefined,
      instructions: instructions.trim() || undefined
    });

    setTitle('');
    setSupervisorName('');
    setInstructions('');
    setShowAddModal(false);
    setNoticeMsg(`L'évaluation « ${title} » a été planifiée avec succès !`);
    setTimeout(() => setNoticeMsg(null), 4000);
  };

  const openEditModal = (ex: Exam) => {
    setEditingExam(ex);
    setEditTitle(ex.title);
    setEditExamType((ex.examType as any) || 'COMPOSITION');
    setEditClassId(ex.classId);
    setEditSubjectId(ex.subjectId);
    setEditExamDate(ex.date);
    setEditTime(ex.time || '08h00 - 10h00');
    setEditDuration(ex.duration || '2 heures');
    setEditRoom(ex.room || ex.roomNumber || 'Salle d\'examen');
    setEditCoefficient(ex.coefficient || 2);
    setEditTrimester((ex.trimester as any) || 1);
    setEditSupervisorName(ex.supervisorName || '');
    setEditInstructions(ex.instructions || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam || !editTitle.trim()) return;

    updateExam(editingExam.id, {
      title: editTitle.trim(),
      classId: editClassId,
      subjectId: editSubjectId,
      date: editExamDate,
      time: editTime,
      duration: editDuration,
      room: editRoom,
      roomNumber: editRoom,
      coefficient: Number(editCoefficient),
      trimester: editTrimester,
      examType: editExamType,
      supervisorName: editSupervisorName.trim() || undefined,
      instructions: editInstructions.trim() || undefined
    });

    setEditingExam(null);
    setNoticeMsg(`L'évaluation « ${editTitle} » a été modifiée avec succès !`);
    setTimeout(() => setNoticeMsg(null), 4000);
  };

  const handleDelete = (id: string, examTitle: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la planification de « ${examTitle} » ?`)) {
      deleteExam(id);
      setNoticeMsg(`L'épreuve « ${examTitle} » a été supprimée.`);
      setTimeout(() => setNoticeMsg(null), 4000);
    }
  };

  const filteredExams = exams.filter(ex => {
    if (filterType !== 'ALL') {
      if (filterType === 'DEVOIR' && ex.examType !== 'DEVOIR') return false;
      if (filterType === 'COMPOSITION' && ex.examType !== 'COMPOSITION' && ex.examType !== undefined) return false;
      if (filterType === 'EXAMEN_BLANC' && ex.examType !== 'EXAMEN_BLANC') return false;
      if (filterType === 'INTERRO' && ex.examType !== 'INTERRO') return false;
    }

    if (filterClass !== 'ALL' && ex.classId !== filterClass) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const cls = classes.find(c => c.id === ex.classId);
      const sbj = subjects.find(s => s.id === ex.subjectId);
      const matchTitle = ex.title.toLowerCase().includes(q);
      const matchClass = cls?.name.toLowerCase().includes(q);
      const matchSbj = sbj?.name.toLowerCase().includes(q);
      const matchRoom = (ex.room || ex.roomNumber || '').toLowerCase().includes(q);
      return matchTitle || matchClass || matchSbj || matchRoom;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center space-x-1 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-all mr-1 cursor-pointer"
                title="Retourner au Tableau de Bord"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-amber-600" />
                <span>Accueil</span>
              </button>
            )}
            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Award className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Planification des Examens, Compositions & Devoirs ({exams.length})
              </h2>
              <p className="text-xs text-slate-500 font-bold">
                {currentSchool?.name || settings.schoolName} &bull; Calendrier officiel des épreuves, salles et surveillances
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowScanPaperModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Scanner une Épreuve (Word IA)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center space-x-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Planifier une Épreuve / Devoir</span>
          </button>
        </div>
      </div>

      {noticeMsg && (
        <div className="p-4 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-black text-xs rounded-2xl border border-emerald-300 dark:border-emerald-800 flex items-center space-x-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{noticeMsg}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Toutes les Épreuves ({exams.length})
          </button>

          <button
            onClick={() => setFilterType('COMPOSITION')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              filterType === 'COMPOSITION'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            Compositions Trimestrielles
          </button>

          <button
            onClick={() => setFilterType('DEVOIR')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              filterType === 'DEVOIR'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 hover:bg-blue-100'
            }`}
          >
            Devoirs Surveillés (DS)
          </button>

          <button
            onClick={() => setFilterType('EXAMEN_BLANC')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              filterType === 'EXAMEN_BLANC'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 hover:bg-purple-100'
            }`}
          >
            Examens Blancs (CEP / BEPC / BAC)
          </button>
        </div>

        {/* Class Filter & Search */}
        <div className="flex items-center gap-2">
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
          >
            <option value="ALL">Toutes les classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level})
              </option>
            ))}
          </select>

          <div className="w-full lg:w-60 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher épreuve..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Grid of Planned Exams */}
      {filteredExams.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Award className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="font-black text-base text-slate-700 dark:text-slate-300">Aucune épreuve planifiée</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Aucun devoir, composition ou examen blanc ne correspond aux critères sélectionnés. Cliquez sur « Planifier une Épreuve » pour en ajouter une.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map(ex => {
            const cls = classes.find(c => c.id === ex.classId);
            const sbj = subjects.find(s => s.id === ex.subjectId);

            const isComp = ex.examType === 'COMPOSITION' || !ex.examType;
            const isDevoir = ex.examType === 'DEVOIR';
            const isBlanc = ex.examType === 'EXAMEN_BLANC';

            const badgeBg = isBlanc
              ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
              : isDevoir
              ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';

            const badgeText = isBlanc
              ? '🎓 Examen Blanc'
              : isDevoir
              ? '📝 Devoir Surveillé'
              : '📊 Composition';

            return (
              <div
                key={ex.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 relative group hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-md border font-black text-[10px] uppercase tracking-wider ${badgeBg}`}>
                      {badgeText} &bull; Trim. {ex.trimester || 1}
                    </span>
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                      {cls?.name || 'Toutes Classes'}
                    </span>
                  </div>

                  <h4 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                    {ex.title}
                  </h4>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="flex items-center space-x-2 font-bold">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>Matière : <strong className="text-slate-900 dark:text-white">{sbj?.name || 'Matière'}</strong></span>
                    </p>
                    <p className="flex items-center space-x-2 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>Date : <strong>{ex.date}</strong> &bull; {ex.time || '08h00'} ({ex.duration || '2h'})</span>
                    </p>
                    <p className="flex items-center space-x-2 font-medium">
                      <Building className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Salle : <strong>{ex.room || ex.roomNumber || 'Salle d\'examen'}</strong> &bull; Coeff : <strong className="text-emerald-600 dark:text-emerald-400">{ex.coefficient}</strong></span>
                    </p>
                    {ex.supervisorName && (
                      <p className="flex items-center space-x-2 font-medium text-slate-500">
                        <UserCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span>Surveillant : <strong>{ex.supervisorName}</strong></span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons (Modifier & Supprimer) */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">
                    ID : {ex.id}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => openEditModal(ex)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-black text-xs flex items-center space-x-1 transition-all cursor-pointer"
                      title="Modifier les détails de cette épreuve"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Modifier</span>
                    </button>

                    <button
                      onClick={() => handleDelete(ex.id, ex.title)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                      title="Supprimer cette épreuve"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Exam Modal */}
      {showAddModal && (
        <div 
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 backdrop-enter"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl text-xs max-h-[90vh] overflow-y-auto modal-enter"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                  <Award className="h-4 w-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Planifier un Examen, Composition ou Devoir
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              {/* Type Selection */}
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  Type d'Évaluation *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExamType('COMPOSITION')}
                    className={`p-2 rounded-xl border text-center font-black transition-all cursor-pointer ${
                      examType === 'COMPOSITION'
                        ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Composition
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamType('DEVOIR')}
                    className={`p-2 rounded-xl border text-center font-black transition-all cursor-pointer ${
                      examType === 'DEVOIR'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Devoir Surveillé
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamType('EXAMEN_BLANC')}
                    className={`p-2 rounded-xl border text-center font-black transition-all cursor-pointer ${
                      examType === 'EXAMEN_BLANC'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Examen Blanc
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  Intitulé de l'Épreuve *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Composition Trimestrielle - Mathématiques"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Classe *</label>
                  <select
                    value={classId}
                    onChange={e => setClassId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Matière *</label>
                  <select
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Coefficient</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={coefficient}
                    onChange={e => setCoefficient(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Trimestre</label>
                  <select
                    value={trimester}
                    onChange={e => setTrimester(Number(e.target.value) as any)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value={1}>1er Trimestre</option>
                    <option value={2}>2ème Trimestre</option>
                    <option value={3}>3ème Trimestre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Heure & Créneau</label>
                  <input
                    type="text"
                    placeholder="ex: 08h00 - 10h00"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Salle d'Épreuve</label>
                  <input
                    type="text"
                    placeholder="ex: Grande Salle A, Salle 12"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Surveillant / Responsable</label>
                <input
                  type="text"
                  placeholder="ex: M. Paulin MENSAH"
                  value={supervisorName}
                  onChange={e => setSupervisorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="pt-3 flex space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-extrabold text-white shadow-md cursor-pointer"
                >
                  Enregistrer l'Épreuve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {editingExam && (
        <div 
          onClick={() => setEditingExam(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 backdrop-enter"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl text-xs max-h-[90vh] overflow-y-auto modal-enter"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                  <Edit2 className="h-4 w-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Modifier les Informations de l'Épreuve
                </h3>
              </div>
              <button
                onClick={() => setEditingExam(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {/* Type Selection */}
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  Type d'Évaluation *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditExamType('COMPOSITION')}
                    className={`p-2 rounded-xl border text-center font-black transition-all cursor-pointer ${
                      editExamType === 'COMPOSITION'
                        ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Composition
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditExamType('DEVOIR')}
                    className={`p-2 rounded-xl border text-center font-black transition-all cursor-pointer ${
                      editExamType === 'DEVOIR'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Devoir Surveillé
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditExamType('EXAMEN_BLANC')}
                    className={`p-2 rounded-xl border text-center font-black transition-all cursor-pointer ${
                      editExamType === 'EXAMEN_BLANC'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Examen Blanc
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  Intitulé de l'Épreuve *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Classe *</label>
                  <select
                    value={editClassId}
                    onChange={e => setEditClassId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Matière *</label>
                  <select
                    value={editSubjectId}
                    onChange={e => setEditSubjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={editExamDate}
                    onChange={e => setEditExamDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Coefficient</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={editCoefficient}
                    onChange={e => setEditCoefficient(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Trimestre</label>
                  <select
                    value={editTrimester}
                    onChange={e => setEditTrimester(Number(e.target.value) as any)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value={1}>1er Trimestre</option>
                    <option value={2}>2ème Trimestre</option>
                    <option value={3}>3ème Trimestre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Heure & Créneau</label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Salle d'Épreuve</label>
                  <input
                    type="text"
                    value={editRoom}
                    onChange={e => setEditRoom(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Surveillant / Responsable</label>
                <input
                  type="text"
                  value={editSupervisorName}
                  onChange={e => setEditSupervisorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="pt-3 flex space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-extrabold text-white shadow-md cursor-pointer"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scan Exam Paper Modal */}
      <ScanExamPaperModal
        isOpen={showScanPaperModal}
        onClose={() => setShowScanPaperModal(false)}
      />

    </div>
  );
};
