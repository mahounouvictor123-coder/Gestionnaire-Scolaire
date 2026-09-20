import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { SchoolLevel, Student } from '../types';
import { AddStudentModal } from '../components/modals/AddStudentModal';
import { EditStudentModal } from '../components/modals/EditStudentModal';
import { PrintStudentCardModal } from '../components/modals/PrintStudentCardModal';
import { PrintBulletinModal } from '../components/modals/PrintBulletinModal';
import {
  Users,
  Search,
  UserPlus,
  FileCheck2,
  CreditCard,
  Trash2,
  Edit,
  Filter,
  Eye,
  FileText,
  ScanLine,
  Sparkles,
  Smartphone,
  Check,
  X,
  Pencil,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';

interface StudentsViewProps {
  onNavigateToScanRoster?: (classId?: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ onNavigateToScanRoster }) => {
  const {
    students,
    classes,
    updateStudent,
    deleteStudent,
    deleteMultipleStudents,
    settings,
    currentSchool,
    parentActivations
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [showActiveAppOnly, setShowActiveAppOnly] = useState(false);

  // Multi-selection for bulk delete
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Inline table row editing
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [inlineFormData, setInlineFormData] = useState<{
    lastName: string;
    firstName: string;
    registrationNumber: string;
    classId: string;
    level: SchoolLevel;
    gender: 'M' | 'F';
    dateOfBirth: string;
    parentName: string;
    parentPhone: string;
    status: 'ACTIF' | 'TRANSFERE' | 'ABANDON' | 'EXCLU';
    bloodGroup: string;
  } | null>(null);

  // Toast feedback
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalMode, setAddModalMode] = useState<'SINGLE' | 'BULK_PASTE'>('SINGLE');
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [selectedStudentForBulletin, setSelectedStudentForBulletin] = useState<Student | null>(null);

  const cleanDigits = (p: string) => (p || '').replace(/\D/g, '');

  const isParentActive = (parentPhone: string) => {
    const clean = cleanDigits(parentPhone);
    if (!clean) return false;
    return (parentActivations || []).some(a => 
      a.schoolId === currentSchool?.id &&
      a.status === 'actif' &&
      cleanDigits(a.parentPhone).endsWith(clean.slice(-8))
    );
  };

  // Filter classes according to selectedLevelFilter
  const availableClassesForFilter = classes.filter(c => {
    if (selectedLevelFilter === 'ALL') return true;
    return c.level === selectedLevelFilter;
  });

  // Filter students
  const filteredStudents = students.filter(std => {
    const matchesSearch =
      std.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.parentPhone.includes(searchTerm);

    const matchesLevel = selectedLevelFilter === 'ALL' || std.level === selectedLevelFilter;
    const matchesClass = selectedClassFilter === 'ALL' || std.classId === selectedClassFilter;
    const matchesActiveApp = !showActiveAppOnly || isParentActive(std.parentPhone);

    return matchesSearch && matchesLevel && matchesClass && matchesActiveApp;
  });

  // Multi-selection handlers
  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllVisible = () => {
    const visibleIds = filteredStudents.map(s => s.id);
    if (visibleIds.length === 0) return;
    const allSelected = visibleIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    deleteMultipleStudents(selectedStudentIds);
    setSelectedStudentIds([]);
    setIsBulkDeleteModalOpen(false);
    setFeedbackToast({
      type: 'success',
      message: `✓ ${count} élève${count > 1 ? 's ont été supprimés' : ' a été supprimé'} avec succès. Les effectifs des classes ont été réajustés.`
    });
    setTimeout(() => setFeedbackToast(null), 6000);
  };

  // Inline Row Edit handlers
  const handleStartInlineEdit = (std: Student) => {
    setEditingStudentId(std.id);
    setInlineFormData({
      lastName: std.lastName,
      firstName: std.firstName,
      registrationNumber: std.registrationNumber,
      classId: std.classId,
      level: std.level,
      gender: std.gender,
      dateOfBirth: std.dateOfBirth,
      parentName: std.parentName,
      parentPhone: std.parentPhone,
      status: std.status,
      bloodGroup: std.bloodGroup || 'O+'
    });
  };

  const handleCancelInlineEdit = () => {
    setEditingStudentId(null);
    setInlineFormData(null);
  };

  const handleSaveInlineEdit = (studentId: string) => {
    if (!inlineFormData) return;
    if (!inlineFormData.lastName.trim() || !inlineFormData.firstName.trim()) {
      alert("Le Nom et le Prénom de l'élève ne peuvent pas être vides.");
      return;
    }

    const targetClass = classes.find(c => c.id === inlineFormData.classId);
    const resolvedLevel = targetClass?.level || inlineFormData.level;

    updateStudent(studentId, {
      lastName: inlineFormData.lastName.trim().toUpperCase(),
      firstName: inlineFormData.firstName.trim(),
      registrationNumber: inlineFormData.registrationNumber.trim(),
      classId: inlineFormData.classId,
      level: resolvedLevel,
      gender: inlineFormData.gender,
      dateOfBirth: inlineFormData.dateOfBirth,
      parentName: inlineFormData.parentName.trim() || `M./Mme ${inlineFormData.lastName.toUpperCase()}`,
      parentPhone: inlineFormData.parentPhone.trim(),
      status: inlineFormData.status,
      bloodGroup: inlineFormData.bloodGroup
    });

    const studentFullName = `${inlineFormData.lastName.toUpperCase()} ${inlineFormData.firstName}`;
    setEditingStudentId(null);
    setInlineFormData(null);

    setFeedbackToast({
      type: 'success',
      message: `✓ Modifications directes enregistrées avec succès pour ${studentFullName} !`
    });
    setTimeout(() => setFeedbackToast(null), 5000);
  };

  const countPrimaire = students.filter(s => s.level === 'PRIMAIRE').length;
  const countMaternelle = students.filter(s => s.level === 'MATERNELLE').length;
  const countCollege = students.filter(s => s.level === 'COLLEGE').length;
  const countLycee = students.filter(s => s.level === 'LYCEE' || s.level === 'UNIVERSITE').length;
  const activeAppStudentsCount = students.filter(s => isParentActive(s.parentPhone)).length;

  const allVisibleSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.id));

  return (
    <div className="space-y-5">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            <span>Gestion Scindée du Dossier Scolaire des Élèves</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {students.length} élèves inscrits. Gestion séparée de la section Primaire / Maternelle et du Secondaire (Collège & Lycée).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setAddModalMode('BULK_PASTE');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition-all transform hover:scale-[1.02] cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>📋 Inscription Copier-Coller (IA A-Z)</span>
          </button>

          {onNavigateToScanRoster && (
            <button
              onClick={() => onNavigateToScanRoster(selectedClassFilter !== 'ALL' ? selectedClassFilter : undefined)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
            >
              <ScanLine className="h-4 w-4 text-amber-300" />
              <span>Scan Photo de Classe (IA)</span>
            </button>
          )}

          <button
            onClick={() => {
              setAddModalMode('SINGLE');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Saisie Unique</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackToast && (
        <div className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
          feedbackToast.type === 'success' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800' :
          'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-800'
        }`}>
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedbackToast.message}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Section / Cycle Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => {
            setSelectedLevelFilter('PRIMAIRE');
            setSelectedClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            selectedLevelFilter === 'PRIMAIRE'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🎒</span>
          <span>SECTION PRIMAIRE ({countPrimaire})</span>
        </button>

        <button
          onClick={() => {
            setSelectedLevelFilter('MATERNELLE');
            setSelectedClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            selectedLevelFilter === 'MATERNELLE'
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🧸</span>
          <span>MATERNELLE ({countMaternelle})</span>
        </button>

        <button
          onClick={() => {
            setSelectedLevelFilter('COLLEGE');
            setSelectedClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            selectedLevelFilter === 'COLLEGE'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🏫</span>
          <span>COLLÈGE ({countCollege})</span>
        </button>

        <button
          onClick={() => {
            setSelectedLevelFilter('LYCEE');
            setSelectedClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            selectedLevelFilter === 'LYCEE'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🎓</span>
          <span>LYCÉE & TECH ({countLycee})</span>
        </button>

        <button
          onClick={() => {
            setSelectedLevelFilter('ALL');
            setSelectedClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            selectedLevelFilter === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-slate-700 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🏛️</span>
          <span>TOUT L'ÉTABLISSEMENT ({students.length})</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, prénom, matricule, parent..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 font-semibold"
          />
        </div>

        {/* Level Filter Dropdown */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedLevelFilter}
            onChange={(e) => {
              setSelectedLevelFilter(e.target.value);
              setSelectedClassFilter('ALL');
            }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold cursor-pointer"
          >
            <option value="ALL">Tous les Niveaux</option>
            <option value="PRIMAIRE">🎒 Primaire</option>
            <option value="MATERNELLE">🧸 Maternelle</option>
            <option value="COLLEGE">🏫 Collège</option>
            <option value="LYCEE">🎓 Lycée</option>
            <option value="UNIVERSITE">🏛️ Université</option>
            <option value="FORMATION">🔧 Formation Pro</option>
          </select>

          {/* Class Filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold cursor-pointer"
          >
            <option value="ALL">Toutes les Classes ({availableClassesForFilter.length})</option>
            {availableClassesForFilter.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Quick Filter: Parents with Active Mobile App */}
          <button
            onClick={() => setShowActiveAppOnly(!showActiveAppOnly)}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs rounded-xl font-black transition-all cursor-pointer border shrink-0 ${
              showActiveAppOnly
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
            }`}
            title="Filtrer uniquement les élèves dont les parents ont l'application activée"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>App Active ({activeAppStudentsCount})</span>
          </button>
        </div>

      </div>

      {/* Floating Sticky Bulk Actions Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/50 border border-indigo-400/50 flex items-center justify-center font-black text-sm text-amber-300">
              {selectedStudentIds.length}
            </div>
            <div>
              <p className="text-xs font-black text-white flex items-center space-x-1.5">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                <span>{selectedStudentIds.length} élève{selectedStudentIds.length > 1 ? 's cochés' : ' coché'} pour action groupée</span>
              </p>
              <p className="text-[11px] text-slate-300">
                En cas d'erreur de saisie ou d'inscription, supprimez-les tous ensemble d'un seul clic.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tout décocher</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs flex items-center space-x-2 shadow-lg shadow-rose-900/40 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer les {selectedStudentIds.length} élèves ensemble</span>
            </button>
          </div>
        </div>
      )}

      {/* Student List Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={handleToggleSelectAllVisible}
                    className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                    title={allVisibleSelected ? "Tout décocher" : "Tout cocher dans la liste"}
                  />
                </th>
                <th className="p-3">Élève & Matricule</th>
                <th className="p-3">Niveau / Classe</th>
                <th className="p-3">Sexe & Né(e) le</th>
                <th className="p-3">Parent & Contact</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions / Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(std => {
                  const cls = classes.find(c => c.id === std.classId);
                  const isEditingThisRow = editingStudentId === std.id;
                  const isSelected = selectedStudentIds.includes(std.id);

                  if (isEditingThisRow && inlineFormData) {
                    // Inline Editing Row View
                    return (
                      <tr key={std.id} className="bg-amber-50/90 dark:bg-amber-950/40 border-y-2 border-amber-500/60 transition-colors">
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-black" title="Ligne en cours d'édition">
                            ✏️
                          </span>
                        </td>

                        {/* Élève & Matricule - Inline Edit */}
                        <td className="p-3">
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={std.photoUrl}
                              alt={std.firstName}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-amber-500 shrink-0"
                            />
                            <div className="space-y-1 w-full min-w-[180px]">
                              <input
                                type="text"
                                value={inlineFormData.lastName}
                                onChange={e => setInlineFormData(prev => prev ? { ...prev, lastName: e.target.value.toUpperCase() } : null)}
                                placeholder="NOM (Majuscules)"
                                className="w-full px-2 py-1 text-xs font-black rounded-lg bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-600 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-amber-500 outline-none"
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveInlineEdit(std.id); if (e.key === 'Escape') handleCancelInlineEdit(); }}
                              />
                              <input
                                type="text"
                                value={inlineFormData.firstName}
                                onChange={e => setInlineFormData(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                                placeholder="Prénom(s)"
                                className="w-full px-2 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveInlineEdit(std.id); if (e.key === 'Escape') handleCancelInlineEdit(); }}
                              />
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] text-slate-500 font-bold">Mat:</span>
                                <input
                                  type="text"
                                  value={inlineFormData.registrationNumber}
                                  onChange={e => setInlineFormData(prev => prev ? { ...prev, registrationNumber: e.target.value } : null)}
                                  placeholder="Matricule"
                                  className="w-full px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400"
                                  onKeyDown={e => { if (e.key === 'Enter') handleSaveInlineEdit(std.id); if (e.key === 'Escape') handleCancelInlineEdit(); }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Niveau / Classe - Inline Edit */}
                        <td className="p-3">
                          <div className="space-y-1 min-w-[150px]">
                            <select
                              value={inlineFormData.classId}
                              onChange={e => {
                                const newClassId = e.target.value;
                                const targetCls = classes.find(c => c.id === newClassId);
                                setInlineFormData(prev => prev ? {
                                  ...prev,
                                  classId: newClassId,
                                  level: (targetCls?.level || prev.level) as SchoolLevel
                                } : null);
                              }}
                              className="w-full px-2 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-600 text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-amber-500 outline-none"
                            >
                              {classes.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.level})
                                </option>
                              ))}
                            </select>
                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block uppercase">
                              {classes.find(c => c.id === inlineFormData.classId)?.level || inlineFormData.level}
                            </span>
                          </div>
                        </td>

                        {/* Sexe & Date de naissance - Inline Edit */}
                        <td className="p-3">
                          <div className="space-y-1 min-w-[140px]">
                            <div className="flex items-center space-x-1">
                              <select
                                value={inlineFormData.gender}
                                onChange={e => setInlineFormData(prev => prev ? { ...prev, gender: e.target.value as 'M' | 'F' } : null)}
                                className="px-2 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                              >
                                <option value="M">M (Masculin)</option>
                                <option value="F">F (Féminin)</option>
                              </select>
                              <select
                                value={inlineFormData.bloodGroup}
                                onChange={e => setInlineFormData(prev => prev ? { ...prev, bloodGroup: e.target.value } : null)}
                                className="px-1.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                                title="Groupe Sanguin"
                              >
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                              </select>
                            </div>
                            <input
                              type="date"
                              value={inlineFormData.dateOfBirth}
                              onChange={e => setInlineFormData(prev => prev ? { ...prev, dateOfBirth: e.target.value } : null)}
                              className="w-full px-2 py-1 text-[11px] rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                            />
                          </div>
                        </td>

                        {/* Parent & Contact - Inline Edit */}
                        <td className="p-3">
                          <div className="space-y-1 min-w-[160px]">
                            <input
                              type="text"
                              value={inlineFormData.parentName}
                              onChange={e => setInlineFormData(prev => prev ? { ...prev, parentName: e.target.value } : null)}
                              placeholder="Nom du parent/tuteur"
                              className="w-full px-2 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveInlineEdit(std.id); if (e.key === 'Escape') handleCancelInlineEdit(); }}
                            />
                            <input
                              type="tel"
                              value={inlineFormData.parentPhone}
                              onChange={e => setInlineFormData(prev => prev ? { ...prev, parentPhone: e.target.value } : null)}
                              placeholder="Téléphone / WhatsApp"
                              className="w-full px-2 py-1 text-[11px] font-mono rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveInlineEdit(std.id); if (e.key === 'Escape') handleCancelInlineEdit(); }}
                            />
                          </div>
                        </td>

                        {/* Statut - Inline Edit */}
                        <td className="p-3">
                          <select
                            value={inlineFormData.status}
                            onChange={e => setInlineFormData(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                            className="px-2 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                          >
                            <option value="ACTIF">ACTIF</option>
                            <option value="TRANSFERE">TRANSFERE</option>
                            <option value="ABANDON">ABANDON</option>
                            <option value="EXCLU">EXCLU</option>
                          </select>
                        </td>

                        {/* Actions - Inline Edit Buttons */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveInlineEdit(std.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-1 shadow-md transition-all cursor-pointer"
                              title="Enregistrer les modifications sur la ligne"
                            >
                              <Check className="h-4 w-4" />
                              <span>Valider</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleCancelInlineEdit}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer"
                              title="Annuler les modifications de la ligne"
                            >
                              <X className="h-4 w-4" />
                              <span>Annuler</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Normal Row View
                  return (
                    <tr
                      key={std.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      {/* Checkbox Column */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(std.id)}
                          className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                          title={`Cocher ${std.firstName} ${std.lastName}`}
                        />
                      </td>
                      
                      {/* Photo & Name */}
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={std.photoUrl}
                            alt={std.firstName}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500/20 shrink-0"
                          />
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white text-xs">
                              {std.lastName} {std.firstName}
                            </p>
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                              {std.registrationNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {cls?.name || std.classId}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">{std.level}</span>
                      </td>

                      {/* Gender & Birth */}
                      <td className="p-3">
                        <p className="font-medium text-slate-900 dark:text-white">{std.dateOfBirth}</p>
                        <p className="text-[10px] text-slate-500">Sexe: {std.gender} | Groupe: {std.bloodGroup || 'O+'}</p>
                      </td>

                      {/* Parent */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-900 dark:text-white">{std.parentName}</p>
                          {isParentActive(std.parentPhone) && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700" title="Application mobile activée (Abonnement valide)">
                              <Smartphone className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                              <span>App Active</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">{std.parentPhone}</p>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          {std.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        {/* Direct Inline Edit Button */}
                        <button
                          onClick={() => handleStartInlineEdit(std)}
                          className="px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer inline-flex items-center space-x-1 text-xs font-black shadow-xs"
                          title="Modifier directement dans la liste sur cette ligne"
                        >
                          <Pencil className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          <span className="hidden sm:inline text-[11px]">Éditer ligne</span>
                        </button>

                        {/* Card */}
                        <button
                          onClick={() => setSelectedStudentForCard(std)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 transition-colors cursor-pointer inline-flex"
                          title="Carte Scolaire (Modifier / Imprimer)"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>

                        {/* Bulletin */}
                        <button
                          onClick={() => setSelectedStudentForBulletin(std)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-600 transition-colors cursor-pointer inline-flex"
                          title="Bulletin Trimestriel"
                        >
                          <FileCheck2 className="h-4 w-4" />
                        </button>

                        {/* Full Modal Edit (Photos, webcam, details) */}
                        <button
                          onClick={() => setSelectedStudentForEdit(std)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer inline-flex"
                          title="Ouvrir la fiche complète (Webcam / Photo / Dossier médical)"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {/* Single Delete */}
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer l'élève ${std.firstName} ${std.lastName} ?`)) {
                              deleteStudent(std.id);
                              setSelectedStudentIds(prev => prev.filter(x => x !== std.id));
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 transition-colors cursor-pointer inline-flex"
                          title="Supprimer cet élève"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                    Aucun élève ne correspond aux critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-rose-500/40 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Supprimer {selectedStudentIds.length} élève{selectedStudentIds.length > 1 ? 's' : ''} ensemble ?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Action irréversible en cas d'erreur d'inscription
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-200 space-y-2">
              <p className="font-semibold">
                Vous êtes sur le point de supprimer définitivement ces {selectedStudentIds.length} élève(s). Les effectifs de leurs classes respectives seront automatiquement recalculés et synchronisés.
              </p>
              <div className="max-h-36 overflow-y-auto divide-y divide-rose-200 dark:divide-rose-900/50 pr-1">
                {students.filter(s => selectedStudentIds.includes(s.id)).map((std, i) => {
                  const sClass = classes.find(c => c.id === std.classId);
                  return (
                    <div key={std.id} className="py-1.5 flex items-center justify-between text-[11px]">
                      <span className="font-bold">{i + 1}. {std.lastName} {std.firstName}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px]">{sClass?.name || std.classId}</span>
                        <span className="text-rose-600 dark:text-rose-400 font-mono text-[10px]">{std.registrationNumber}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center space-x-2 shadow-lg shadow-rose-600/30 cursor-pointer transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Oui, supprimer définitivement ({selectedStudentIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialMode={addModalMode}
        initialClassId={selectedClassFilter !== 'ALL' ? selectedClassFilter : undefined}
      />

      {selectedStudentForEdit && (
        <EditStudentModal
          isOpen={!!selectedStudentForEdit}
          onClose={() => setSelectedStudentForEdit(null)}
          student={selectedStudentForEdit}
          onOpenCard={(s) => setSelectedStudentForCard(s)}
          onOpenBulletin={(s) => setSelectedStudentForBulletin(s)}
        />
      )}

      {selectedStudentForCard && (
        <PrintStudentCardModal
          isOpen={!!selectedStudentForCard}
          onClose={() => setSelectedStudentForCard(null)}
          student={selectedStudentForCard}
          classObj={classes.find(c => c.id === selectedStudentForCard.classId)}
        />
      )}

      {selectedStudentForBulletin && (
        <PrintBulletinModal
          isOpen={!!selectedStudentForBulletin}
          onClose={() => setSelectedStudentForBulletin(null)}
          student={selectedStudentForBulletin}
          classObj={classes.find(c => c.id === selectedStudentForBulletin.classId) || classes[0]}
          trimester={settings.currentTrimester}
        />
      )}

    </div>
  );
};
