import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { AdministrativeDocument, Student, SchoolClass } from '../types';
import { PrintStudentCardModal } from '../components/modals/PrintStudentCardModal';
import { PrintBulletinModal } from '../components/modals/PrintBulletinModal';
import { getDefaultAvatar } from '../components/StudentPhotoPicker';
import {
  FileText,
  Printer,
  CreditCard,
  FileCheck2,
  Award,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  X,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  QrCode,
  Download,
  AlertTriangle,
  GraduationCap,
  Users,
  Layers,
  Sparkles,
  Filter,
  Check,
  Phone,
  Droplet
} from 'lucide-react';

export const DocumentsView: React.FC = () => {
  const {
    students = [],
    classes = [],
    settings = {} as any,
    administrativeDocuments = [],
    addAdministrativeDocument,
    updateAdministrativeDocument,
    deleteAdministrativeDocument
  } = useApp();

  // Active Main Tab: 'cards' | 'certificates' | 'bulletins' | 'batch_cards'
  const [activeTab, setActiveTab] = useState<'cards' | 'certificates' | 'bulletins' | 'batch_cards'>('cards');

  // Modals for Printing
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [selectedStudentForBulletin, setSelectedStudentForBulletin] = useState<Student | null>(null);

  // Cards Filters & Selection
  const [selectedClassIdForCards, setSelectedClassIdForCards] = useState<string>('ALL');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [previewStudentId, setPreviewStudentId] = useState<string>(students[0]?.id || '');
  const [cardThemeColor, setCardThemeColor] = useState<'indigo' | 'blue' | 'emerald' | 'purple' | 'amber'>('indigo');

  // Certificates Filtering
  const [certSearchTerm, setCertSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Modals for Certificates (Create, Edit, View, Delete)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AdministrativeDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<AdministrativeDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<AdministrativeDocument | null>(null);

  // Form State for Create / Edit Certificate
  const [formData, setFormData] = useState<{
    type: 'CERTIFICAT_SCOLARITE' | 'ATTESTATION_FREQUENTATION' | 'CERTIFICAT_RADIATION' | 'AUTRE';
    studentId: string;
    studentName: string;
    studentBirthDate: string;
    studentBirthPlace: string;
    className: string;
    academicYear: string;
    documentNumber: string;
    issueDate: string;
    conductAppraisal: string;
    notes: string;
  }>({
    type: 'CERTIFICAT_SCOLARITE',
    studentId: '',
    studentName: '',
    studentBirthDate: '',
    studentBirthPlace: 'Cotonou',
    className: '',
    academicYear: settings?.academicYear || '2025-2026',
    documentNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    conductAppraisal: 'Très bonne conduite et assiduité exemplaire',
    notes: 'Délivré pour servir et valoir ce que de droit.'
  });

  // Safe Document Helpers
  const getDocStudent = (doc: AdministrativeDocument) => {
    if (!doc || !doc.studentId) return undefined;
    return (students || []).find(s => s && s.id === doc.studentId);
  };

  const getDocStudentName = (doc: AdministrativeDocument): string => {
    if (!doc) return 'Élève';
    if (doc.studentName && typeof doc.studentName === 'string' && doc.studentName.trim()) {
      return doc.studentName.trim();
    }
    const s = getDocStudent(doc);
    if (s) return `${s.firstName || ''} ${s.lastName || ''}`.trim();
    return doc.studentNameOverride || 'Élève non spécifié';
  };

  const getDocClassName = (doc: AdministrativeDocument): string => {
    if (!doc) return '';
    if (doc.className && typeof doc.className === 'string' && doc.className.trim()) {
      return doc.className.trim();
    }
    const s = getDocStudent(doc);
    if (s && s.classId) {
      const c = (classes || []).find(cl => cl && cl.id === s.classId);
      if (c && c.name) return c.name;
    }
    return doc.classOverride || '';
  };

  const getDocStudentBirthDate = (doc: AdministrativeDocument): string => {
    if (!doc) return '';
    if (doc.studentBirthDate) return doc.studentBirthDate;
    const s = getDocStudent(doc);
    return s?.dateOfBirth || doc.dateOfBirthOverride || '';
  };

  const getDocStudentBirthPlace = (doc: AdministrativeDocument): string => {
    if (!doc) return '';
    if (doc.studentBirthPlace) return doc.studentBirthPlace;
    const s = getDocStudent(doc);
    return s?.placeOfBirth || s?.address || doc.placeOfBirthOverride || 'Cotonou';
  };

  // Open Create Certificate Modal
  const handleOpenCreate = (targetStudent?: Student) => {
    const student = targetStudent || (students || []).find(s => s && s.id === previewStudentId) || (students || [])[0];
    const studentClass = student ? (classes || []).find(c => c && c.id === student.classId) : undefined;
    const count = (administrativeDocuments || []).length + 1;
    const year = settings?.academicYear ? settings.academicYear.split('-')[0] : '2025';

    setFormData({
      type: 'CERTIFICAT_SCOLARITE',
      studentId: student ? student.id : '',
      studentName: student ? `${student.firstName} ${student.lastName}`.trim() : '',
      studentBirthDate: student?.dateOfBirth || '2012-05-15',
      studentBirthPlace: student?.placeOfBirth || student?.address || 'Cotonou',
      className: studentClass ? studentClass.name : '6ème A',
      academicYear: settings?.academicYear || '2025-2026',
      documentNumber: `CERT-${year}-${count.toString().padStart(4, '0')}`,
      issueDate: new Date().toISOString().split('T')[0],
      conductAppraisal: 'Bonne conduite et assiduité régulière',
      notes: 'Ce certificat est délivré à l\'intéressé(e) pour servir et valoir ce que de droit.'
    });
    setEditingDoc(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Certificate Modal
  const handleOpenEdit = (doc: AdministrativeDocument) => {
    setEditingDoc(doc);
    setFormData({
      type: (doc.type as any) || 'CERTIFICAT_SCOLARITE',
      studentId: doc.studentId || '',
      studentName: getDocStudentName(doc),
      studentBirthDate: getDocStudentBirthDate(doc),
      studentBirthPlace: getDocStudentBirthPlace(doc),
      className: getDocClassName(doc),
      academicYear: doc.academicYear || settings?.academicYear || '2025-2026',
      documentNumber: doc.documentNumber || '',
      issueDate: doc.issueDate || new Date().toISOString().split('T')[0],
      conductAppraisal: doc.conductAppraisal || doc.observations || 'Bonne conduite et assiduité régulière',
      notes: doc.notes || doc.reason || 'Délivré pour servir et valoir ce que de droit.'
    });
    setIsCreateModalOpen(true);
  };

  // Student selection in certificate form
  const handleStudentSelectionChange = (newStudentId: string) => {
    const student = (students || []).find(s => s && s.id === newStudentId);
    if (!student) return;
    const studentClass = (classes || []).find(c => c && c.id === student.classId);

    setFormData(prev => ({
      ...prev,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      studentBirthDate: student.dateOfBirth || '',
      studentBirthPlace: student.placeOfBirth || student.address || 'Cotonou',
      className: studentClass ? studentClass.name : prev.className
    }));
  };

  // Save Certificate
  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim()) return;

    if (editingDoc) {
      updateAdministrativeDocument(editingDoc.id, {
        type: formData.type,
        studentId: formData.studentId,
        studentName: formData.studentName,
        studentBirthDate: formData.studentBirthDate,
        studentBirthPlace: formData.studentBirthPlace,
        className: formData.className,
        academicYear: formData.academicYear,
        documentNumber: formData.documentNumber,
        issueDate: formData.issueDate,
        conductAppraisal: formData.conductAppraisal,
        notes: formData.notes
      });
    } else {
      addAdministrativeDocument({
        type: formData.type,
        studentId: formData.studentId || `std-ext-${Date.now()}`,
        studentName: formData.studentName,
        studentBirthDate: formData.studentBirthDate,
        studentBirthPlace: formData.studentBirthPlace,
        className: formData.className,
        academicYear: formData.academicYear,
        documentNumber: formData.documentNumber,
        issueDate: formData.issueDate,
        conductAppraisal: formData.conductAppraisal,
        notes: formData.notes,
        status: 'DELIVRE'
      });
    }

    setIsCreateModalOpen(false);
    setEditingDoc(null);
  };

  // Delete Certificate
  const handleDeleteConfirm = () => {
    if (docToDelete) {
      deleteAdministrativeDocument(docToDelete.id);
      setDocToDelete(null);
    }
  };

  // Safe Filtered Documents
  const filteredDocuments = (administrativeDocuments || []).filter(doc => {
    if (!doc) return false;
    const matchesType = selectedTypeFilter === 'ALL' || doc.type === selectedTypeFilter;
    const sName = (getDocStudentName(doc) || '').toLowerCase();
    const docNum = (doc.documentNumber || '').toLowerCase();
    const cName = (getDocClassName(doc) || '').toLowerCase();
    const query = (certSearchTerm || '').toLowerCase().trim();
    const matchesSearch = !query || sName.includes(query) || docNum.includes(query) || cName.includes(query);
    return matchesType && matchesSearch;
  });

  // Filtered Students for Cards Tab
  const filteredStudents = (students || []).filter(s => {
    if (!s) return false;
    const matchesClass = selectedClassIdForCards === 'ALL' || s.classId === selectedClassIdForCards;
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    const regNum = (s.registrationNumber || '').toLowerCase();
    const query = (studentSearchTerm || '').toLowerCase().trim();
    const matchesSearch = !query || fullName.includes(query) || regNum.includes(query);
    return matchesClass && matchesSearch;
  });

  const previewStudent = (students || []).find(s => s && s.id === previewStudentId) || filteredStudents[0] || (students || [])[0];
  const previewClass = previewStudent ? (classes || []).find(c => c && c.id === previewStudent.classId) : undefined;

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'CERTIFICAT_SCOLARITE':
        return 'Certificat de Scolarité';
      case 'ATTESTATION_FREQUENTATION':
        return 'Attestation de Fréquentation';
      case 'CERTIFICAT_RADIATION':
        return 'Certificat de Radiation';
      default:
        return 'Document Administratif';
    }
  };

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'CERTIFICAT_SCOLARITE':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'ATTESTATION_FREQUENTATION':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'CERTIFICAT_RADIATION':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300';
    }
  };

  // Card Theme Palette
  const getThemeGrad = (theme: string) => {
    switch (theme) {
      case 'blue':
        return 'from-blue-950 via-sky-900 to-indigo-950 border-sky-400';
      case 'emerald':
        return 'from-emerald-950 via-teal-900 to-slate-900 border-emerald-400';
      case 'purple':
        return 'from-purple-950 via-indigo-950 to-slate-900 border-purple-400';
      case 'amber':
        return 'from-amber-950 via-yellow-950 to-slate-900 border-amber-400';
      case 'indigo':
      default:
        return 'from-blue-900 via-indigo-900 to-slate-900 border-amber-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shadow-inner">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Documents & Cartes Scolaires
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Officiel • Année {settings?.academicYear || '2025-2026'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Édition des cartes scolaires plastifiées, certificats d'inscription, attestations officielles et bulletins trimestriels.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenCreate()}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Certificat</span>
          </button>
          <button
            onClick={() => previewStudent && setSelectedStudentForCard(previewStudent)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer Carte Élève</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('cards')}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'cards'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Cartes Scolaires Plastifiées ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'certificates'
              ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Certificats & Attestations ({filteredDocuments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('batch_cards')}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'batch_cards'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Planche A4 Multi-Cartes (Par Classe)</span>
        </button>

        <button
          onClick={() => setActiveTab('bulletins')}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'bulletins'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Bulletins & Relevés</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CARTES SCOLAIRES INDIVIDUELLES ET PREVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center space-x-1">
                <Filter className="h-3.5 w-3.5" />
                <span>Classe :</span>
              </span>
              <select
                value={selectedClassIdForCards}
                onChange={e => setSelectedClassIdForCards(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="ALL">Toutes les Classes ({students.length} élèves)</option>
                {(classes || []).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({students.filter(s => s.classId === c.id).length} élèves)
                  </option>
                ))}
              </select>

              {/* Theme Selector for card preview */}
              <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 mr-1 hidden md:inline">Thème carte :</span>
                {[
                  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
                  { id: 'blue', label: 'Bleu Roi', bg: 'bg-blue-600' },
                  { id: 'emerald', label: 'Émeraude', bg: 'bg-emerald-600' },
                  { id: 'purple', label: 'Pourpre', bg: 'bg-purple-600' },
                  { id: 'amber', label: 'Doré', bg: 'bg-amber-600' }
                ].map(th => (
                  <button
                    key={th.id}
                    onClick={() => setCardThemeColor(th.id as any)}
                    className={`w-5 h-5 rounded-full ${th.bg} transition-all cursor-pointer ${
                      cardThemeColor === th.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                    title={th.label}
                  />
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher élève, matricule..."
                value={studentSearchTerm}
                onChange={e => setStudentSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Cards Split Layout: List on Left, Live Card Badge on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Student Grid (8 cols on lg) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Élèves Répertoriés ({filteredStudents.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  Cliquez sur un élève pour visualiser sa carte
                </span>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <User className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Aucun élève trouvé pour cette sélection.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[640px] overflow-y-auto pr-1">
                  {filteredStudents.map(s => {
                    const studentClass = (classes || []).find(c => c && c.id === s.classId);
                    const isSelected = previewStudent?.id === s.id;
                    const avatar = s.photoUrl || getDefaultAvatar(s.gender);

                    return (
                      <div
                        key={s.id}
                        onClick={() => setPreviewStudentId(s.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative space-y-2.5 ${
                          isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={avatar}
                            alt={`${s.firstName} ${s.lastName}`}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-300 dark:border-indigo-700 shadow-xs shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-xs text-slate-900 dark:text-white truncate">
                              {s.lastName} {s.firstName}
                            </h4>
                            <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold truncate">
                              {s.registrationNumber || 'MAT-NON-DEFINI'}
                            </p>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-extrabold text-slate-700 dark:text-slate-300">
                                {studentClass?.name || 'Sans classe'}
                              </span>
                              {s.bloodGroup && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-[9px] font-extrabold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                                  {s.bloodGroup}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-[11px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentForCard(s);
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] flex items-center justify-center space-x-1 shadow-xs cursor-pointer"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Imprimer Carte</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCreate(s);
                            }}
                            className="px-2 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center space-x-1 border border-purple-200 dark:border-purple-800 cursor-pointer"
                            title="Créer certificat pour cet élève"
                          >
                            <Award className="h-3 w-3" />
                            <span className="hidden sm:inline">Certificat</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Card Preview Box on Right (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-4 sticky top-6">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      Aperçu Visuel de la Carte Scolaire
                    </h3>
                  </div>
                  {previewStudent && (
                    <button
                      onClick={() => setSelectedStudentForCard(previewStudent)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center space-x-1 shadow cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Éditer & Imprimer</span>
                    </button>
                  )}
                </div>

                {previewStudent ? (
                  <div className="space-y-4">
                    {/* Simulated Recto ID Badge Card */}
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${getThemeGrad(cardThemeColor)} text-white shadow-xl border-2 relative overflow-hidden space-y-3`}>
                      
                      {/* Background Watermark */}
                      <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                        <GraduationCap className="w-44 h-44 text-white" />
                      </div>

                      {/* Header School Identity */}
                      <div className="flex items-center justify-between border-b border-white/20 pb-2 relative z-10">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center font-black text-xs text-amber-300">
                            {settings?.schoolName ? settings.schoolName.substring(0, 2).toUpperCase() : 'ES'}
                          </div>
                          <div>
                            <p className="font-black text-[11px] leading-tight uppercase tracking-wider text-amber-300">
                              {settings?.schoolName || 'ÉTABLISSEMENT SCOLAIRE'}
                            </p>
                            <p className="text-[8px] text-slate-200 tracking-wide">
                              CARTE D'IDENTITÉ SCOLAIRE • {settings?.academicYear || '2025-2026'}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase">
                          {previewStudent.level || 'SECONDAIRE'}
                        </span>
                      </div>

                      {/* Card Core Content */}
                      <div className="flex items-start space-x-3.5 relative z-10">
                        {/* Student Photo */}
                        <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-amber-300 shadow-md bg-slate-800 shrink-0">
                          <img
                            src={previewStudent.photoUrl || getDefaultAvatar(previewStudent.gender)}
                            alt={`${previewStudent.firstName} ${previewStudent.lastName}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="space-y-1 min-w-0 flex-1 text-[11px]">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-amber-200">Nom & Prénoms :</p>
                            <p className="font-black text-xs text-white leading-tight uppercase">
                              {previewStudent.lastName} {previewStudent.firstName}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-0.5">
                            <div>
                              <p className="text-[8px] uppercase font-bold text-amber-200">Matricule :</p>
                              <p className="font-mono font-black text-[10px] text-amber-300">
                                {previewStudent.registrationNumber || '2025-COL-001'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[8px] uppercase font-bold text-amber-200">Classe :</p>
                              <p className="font-black text-[10px] text-white">
                                {previewClass?.name || '6ème A'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-0.5">
                            <div>
                              <p className="text-[8px] uppercase font-bold text-amber-200">Né(e) le :</p>
                              <p className="font-bold text-[9px] text-slate-100">
                                {previewStudent.dateOfBirth || '12/04/2012'}
                              </p>
                            </div>
                            {previewStudent.bloodGroup && (
                              <div>
                                <p className="text-[8px] uppercase font-bold text-rose-300 flex items-center space-x-0.5">
                                  <Droplet className="h-2 w-2" />
                                  <span>Groupe :</span>
                                </p>
                                <p className="font-black text-[10px] text-rose-200">
                                  {previewStudent.bloodGroup}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom QR Code & Direction Stamp Bar */}
                      <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[8px] text-slate-200 relative z-10">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded bg-white p-0.5 flex items-center justify-center">
                            <QrCode className="w-7 h-7 text-slate-900" />
                          </div>
                          <div>
                            <p className="font-bold text-white">Contrôle QR Sécurisé</p>
                            <p className="text-[7px] text-slate-300">Valable jusqu'au 31/07/2026</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold uppercase text-[7px] text-amber-300">Le Directeur Général</p>
                          <p className="font-serif italic text-[8px] text-slate-100 underline decoration-amber-400">
                            {settings?.directorName || 'Dr. Amadou KOUASSI'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Specs Checklist */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold">Contact d'urgence Tuteur :</span>
                        <span className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-emerald-500" />
                          <span>{previewStudent.parentPhone || settings?.phone || '+229 01 00 00 00'}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold">Format de carte :</span>
                        <span className="font-black text-indigo-600 dark:text-indigo-400">
                          Format Standard Badge PVC (85.6 × 54 mm)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedStudentForCard(previewStudent)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Ouvrir l'Éditeur & Imprimer cette Carte</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs">Sélectionnez un élève pour afficher sa carte.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CERTIFICATS & ATTESTATIONS ADMINISTRATIVES */}
      {/* ========================================================================= */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  <span>Registre des Certificats & Documents Émis ({filteredDocuments.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Émission officielle, modification des appréciations et téléchargement PDF officiel avec cachet de l'établissement.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter by Type */}
                <select
                  value={selectedTypeFilter}
                  onChange={e => setSelectedTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="ALL">Tous les Types de Documents</option>
                  <option value="CERTIFICAT_SCOLARITE">Certificats de Scolarité</option>
                  <option value="ATTESTATION_FREQUENTATION">Attestations de Fréquentation</option>
                  <option value="CERTIFICAT_RADIATION">Certificats de Radiation</option>
                </select>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher élève, N°..."
                    value={certSearchTerm}
                    onChange={e => setCertSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 w-48 sm:w-60"
                  />
                </div>

                <button
                  onClick={() => handleOpenCreate()}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nouveau Certificat</span>
                </button>
              </div>
            </div>

            {/* Table of Documents */}
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Aucun document ou certificat ne correspond à votre recherche.
                </p>
                <button
                  onClick={() => handleOpenCreate()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Créer un Certificat de Scolarité</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Réf. Document</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Élève & Classe</th>
                      <th className="px-4 py-3">Date d'Émission</th>
                      <th className="px-4 py-3">Appréciation / Mention</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDocuments.map(doc => {
                      const studentName = getDocStudentName(doc);
                      const className = getDocClassName(doc);

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                            {doc.documentNumber || 'CERT-SANS-NUM'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getDocTypeBadge(doc.type)}`}>
                              {getDocTypeLabel(doc.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-extrabold text-slate-900 dark:text-white">{studentName}</p>
                            <p className="text-[11px] text-slate-500">
                              Classe: <span className="font-bold text-slate-700 dark:text-slate-300">{className || 'Non définie'}</span> ({doc.academicYear || settings?.academicYear || '2025-2026'})
                            </p>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                            {doc.issueDate || 'Aujourd\'hui'}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                            {doc.conductAppraisal || doc.notes || doc.reason || 'Conduite satisfaisante'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* View & Print Official Certificate */}
                              <button
                                onClick={() => setViewingDoc(doc)}
                                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                                title="Aperçu & Imprimer le document officiel"
                              >
                                <Printer className="h-4 w-4" />
                              </button>

                              {/* Edit Certificate */}
                              <button
                                onClick={() => handleOpenEdit(doc)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors cursor-pointer"
                                title="Modifier le certificat"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              {/* Delete Certificate */}
                              <button
                                onClick={() => setDocToDelete(doc)}
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors cursor-pointer"
                                title="Supprimer ce document"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PLANCHE A4 MULTI-CARTES (IMPRESSION EN MASSE) */}
      {/* ========================================================================= */}
      {activeTab === 'batch_cards' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  <span>Planche A4 Multi-Cartes d'Identité Scolaires (Prête à Découper & Plastifier)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Imprimez en une seule fois toutes les cartes des élèves de la classe sélectionnée sur feuille A4 ou bristol cartonné.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={selectedClassIdForCards}
                  onChange={e => setSelectedClassIdForCards(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="ALL">Toutes les classes ({students.length} élèves)</option>
                  {(classes || []).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({students.filter(s => s.classId === c.id).length} élèves)
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-1.5 shadow cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer la Planche ({filteredStudents.length} cartes)</span>
                </button>
              </div>
            </div>

            {/* Cards Grid Planche */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-100 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
              {filteredStudents.map(s => {
                const sClass = (classes || []).find(c => c && c.id === s.classId);
                const avatar = s.photoUrl || getDefaultAvatar(s.gender);

                return (
                  <div
                    key={s.id}
                    className={`p-3 rounded-2xl bg-gradient-to-br ${getThemeGrad(cardThemeColor)} text-white shadow-md border-2 relative overflow-hidden space-y-2`}
                  >
                    {/* Header School */}
                    <div className="flex items-center justify-between border-b border-white/20 pb-1 text-[9px]">
                      <span className="font-black text-amber-300 uppercase tracking-wider truncate">
                        {settings?.schoolName || 'ÉCOLE'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[8px] uppercase shrink-0">
                        {s.level || 'SCOLAIRE'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={avatar}
                        alt={`${s.firstName} ${s.lastName}`}
                        referrerPolicy="no-referrer"
                        className="w-14 h-16 rounded-lg object-cover border-2 border-amber-300 shrink-0"
                      />
                      <div className="text-[10px] min-w-0 flex-1 space-y-0.5">
                        <p className="font-black text-xs uppercase leading-tight truncate">
                          {s.lastName} {s.firstName}
                        </p>
                        <p className="font-mono text-amber-300 font-bold text-[9px] truncate">
                          {s.registrationNumber || 'MAT-NON-DEF'}
                        </p>
                        <p className="font-bold text-slate-200">
                          Classe: <strong className="text-white">{sClass?.name || 'Non déf.'}</strong>
                        </p>
                        <p className="text-[8px] text-slate-300">
                          Né(e): {s.dateOfBirth || '-'} {s.bloodGroup ? `| Sang: ${s.bloodGroup}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Bottom */}
                    <div className="pt-1 border-t border-white/20 flex items-center justify-between text-[7px] text-slate-200">
                      <div className="flex items-center space-x-1">
                        <QrCode className="w-4 h-4 text-amber-300" />
                        <span>Validité {settings?.academicYear || '2025-2026'}</span>
                      </div>
                      <span className="font-bold italic text-amber-200">Direction Générale</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BULLETINS & RELEVÉS TRIMESTRIELS */}
      {/* ========================================================================= */}
      {activeTab === 'bulletins' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileCheck2 className="h-4 w-4 text-blue-600" />
                  <span>Édition Rapide des Bulletins Trimestriels</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Bulletins officiels avec notes par matière, coefficients, rangs et signatures de direction.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={selectedClassIdForCards}
                  onChange={e => setSelectedClassIdForCards(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="ALL">Toutes les classes</option>
                  {(classes || []).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of Students with quick bulletin print */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map(s => {
                const sClass = (classes || []).find(c => c && c.id === s.classId);

                return (
                  <div key={s.id} className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3">
                      <img
                        src={s.photoUrl || getDefaultAvatar(s.gender)}
                        alt={s.lastName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {s.lastName} {s.firstName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Matricule: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.registrationNumber}</span> • Classe: <span className="font-bold text-slate-700 dark:text-slate-300">{sClass?.name || '-'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedStudentForBulletin(s)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Imprimer Bulletin</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT CERTIFICAT */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {editingDoc ? 'Modifier le Certificat de Scolarité' : 'Créer un Certificat de Scolarité Officiel'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Remplissez ou modifiez les détails de l'attestation administrative
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingDoc(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-3.5 text-xs">
              {/* Type of Document */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Type de Document</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="CERTIFICAT_SCOLARITE">Certificat de Scolarité</option>
                    <option value="ATTESTATION_FREQUENTATION">Attestation de Fréquentation</option>
                    <option value="CERTIFICAT_RADIATION">Certificat de Radiation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Réf. N° Document</label>
                  <input
                    type="text"
                    required
                    value={formData.documentNumber}
                    onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                    placeholder="CERT-2025-0001"
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Select Existing Student Shortcut */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sélectionner un Élève Inscrit (pré-remplissage automatique)
                </label>
                <select
                  value={formData.studentId}
                  onChange={e => handleStudentSelectionChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="">-- Choisir un élève ou saisir manuellement --</option>
                  {(students || []).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.registrationNumber || 'Matricule non défini'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Details Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom & Prénoms de l'Élève *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="Nom et Prénoms"
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Classe Fréquentée *</label>
                  <input
                    type="text"
                    required
                    value={formData.className}
                    onChange={e => setFormData({ ...formData, className: e.target.value })}
                    placeholder="ex: 6ème A ou CM2"
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date de Naissance</label>
                  <input
                    type="date"
                    value={formData.studentBirthDate}
                    onChange={e => setFormData({ ...formData, studentBirthDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lieu de Naissance</label>
                  <input
                    type="text"
                    value={formData.studentBirthPlace}
                    onChange={e => setFormData({ ...formData, studentBirthPlace: e.target.value })}
                    placeholder="ex: Cotonou, Parakou..."
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Année Scolaire</label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="2025-2026"
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              {/* Appraisal & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Appréciation de Conduite</label>
                  <input
                    type="text"
                    value={formData.conductAppraisal}
                    onChange={e => setFormData({ ...formData, conductAppraisal: e.target.value })}
                    placeholder="ex: Très bonne conduite, assiduité exemplaire"
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date d'Émission</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mention Spéciale / Observations</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes ou mentions légales..."
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingDoc(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 font-extrabold text-white shadow flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{editingDoc ? 'Mettre à Jour le Certificat' : 'Enregistrer le Certificat'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL CERTIFICATE PRINT PREVIEW */}
      {/* ========================================================================= */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in">
            
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center space-x-2 text-purple-700 font-black text-sm">
                <Award className="h-5 w-5" />
                <span>Aperçu Officiel du Document</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer / Télécharger PDF</span>
                </button>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Official Printable Academic Certificate Template */}
            <div className="p-8 border-4 border-double border-slate-800 rounded-2xl bg-white space-y-6 text-slate-950 font-serif relative">
              
              {/* Watermark effect */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <Award className="w-80 h-80" />
              </div>

              {/* Republic & School Header */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b-2 border-slate-900 text-center text-xs">
                <div>
                  <p className="font-extrabold uppercase tracking-widest text-[11px]">RÉPUBLIQUE DU BÉNIN</p>
                  <p className="text-[9px] uppercase italic">Fraternité - Justice - Travail</p>
                  <p className="text-[10px] font-bold mt-1 text-slate-700">MINISTÈRE DES ENSEIGNEMENTS SECONDAIRE, TECHNIQUE ET DE LA FORMATION PROFESSIONNELLE</p>
                </div>
                <div>
                  <p className="font-black uppercase text-sm tracking-wide text-slate-900">{settings?.schoolName || 'ÉTABLISSEMENT SCOLAIRE'}</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase">{settings?.motto || 'DISCIPLINE • TRAVAIL • SUCCÈS'}</p>
                  <p className="text-[10px] mt-1 text-slate-600">{settings?.address || 'Cotonou - Bénin'} | Tél: {settings?.phone || '+229 01 00 00 00'}</p>
                </div>
              </div>

              {/* Reference & Date */}
              <div className="flex justify-between items-center text-xs font-sans">
                <span className="font-bold font-mono">N° {viewingDoc.documentNumber || 'CERT-2025'}</span>
                <span className="font-medium text-slate-700">Fait à {settings?.city || 'Cotonou'}, le {viewingDoc.issueDate || 'Aujourd\'hui'}</span>
              </div>

              {/* Title Banner */}
              <div className="text-center py-3">
                <h1 className="text-xl font-black uppercase tracking-wider underline underline-offset-8">
                  {getDocTypeLabel(viewingDoc.type)}
                </h1>
                <p className="text-xs italic text-slate-600 mt-2">Année Scolaire : {viewingDoc.academicYear || settings?.academicYear || '2025-2026'}</p>
              </div>

              {/* Certificate Body Paragraph */}
              <div className="space-y-4 text-sm leading-relaxed font-serif text-justify pt-2">
                <p>
                  Je soussigné, <strong>{settings?.directorName || 'Le Directeur de l\'Établissement'}</strong>, Directeur de l'établissement scolaire <strong>{settings?.schoolName || 'l\'Établissement'}</strong>, atteste par la présente que :
                </p>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-sans text-xs">
                  <p>L'élève : <strong className="text-sm font-extrabold uppercase">{getDocStudentName(viewingDoc)}</strong></p>
                  {getDocStudentBirthDate(viewingDoc) && (
                    <p>Né(e) le : <strong>{getDocStudentBirthDate(viewingDoc)}</strong> {getDocStudentBirthPlace(viewingDoc) ? `à ${getDocStudentBirthPlace(viewingDoc)}` : ''}</p>
                  )}
                  <p>Inscrit(e) en classe de : <strong className="text-sm font-bold text-purple-800">{getDocClassName(viewingDoc) || 'Non spécifiée'}</strong></p>
                  <p>Appréciation de conduite : <strong>{viewingDoc.conductAppraisal || viewingDoc.observations || 'Bonne conduite et assiduité régulière'}</strong></p>
                </div>

                <p>
                  Est régulièrement inscrit(e) et fréquente avec assiduité les cours dispensés dans notre établissement au titre de l'année scolaire <strong>{viewingDoc.academicYear || settings?.academicYear || '2025-2026'}</strong>.
                </p>

                <p className="italic text-xs text-slate-600">
                  {viewingDoc.notes || viewingDoc.reason || 'En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.'}
                </p>
              </div>

              {/* Signature & QR Stamp Block */}
              <div className="pt-8 flex justify-between items-end text-xs font-sans">
                <div className="space-y-1 text-center">
                  <div className="w-20 h-20 border border-slate-300 rounded-lg p-1 flex items-center justify-center bg-slate-50 mx-auto">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono">Vérification QR Officielle</p>
                </div>

                <div className="text-center space-y-12">
                  <p className="font-bold uppercase tracking-wider">Le Directeur Général,</p>
                  <div className="pt-4">
                    <p className="font-extrabold uppercase underline">{settings?.directorName || 'Directeur d\'Établissement'}</p>
                    <p className="text-[10px] text-slate-500">(Signature & Cachet de l'Établissement)</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 w-fit">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">Confirmer la suppression</h4>
              <p className="text-xs text-slate-500 mt-1">
                Êtes-vous sûr de vouloir supprimer le document <strong>{docToDelete.documentNumber}</strong> pour l'élève <strong>{getDocStudentName(docToDelete)}</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-extrabold text-xs text-white shadow cursor-pointer"
              >
                Supprimer Définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINT STUDENT CARD (BADGE) */}
      {/* ========================================================================= */}
      {selectedStudentForCard && (
        <PrintStudentCardModal
          isOpen={!!selectedStudentForCard}
          onClose={() => setSelectedStudentForCard(null)}
          student={selectedStudentForCard}
          classObj={(classes || []).find(c => c && c.id === selectedStudentForCard.classId)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINT BULLETIN */}
      {/* ========================================================================= */}
      {selectedStudentForBulletin && (
        <PrintBulletinModal
          isOpen={!!selectedStudentForBulletin}
          onClose={() => setSelectedStudentForBulletin(null)}
          student={selectedStudentForBulletin}
          classObj={(classes || []).find(c => c && c.id === selectedStudentForBulletin.classId) || (classes || [])[0]}
          trimester={(settings?.currentTrimester as any) || 1}
        />
      )}
    </div>
  );
};
