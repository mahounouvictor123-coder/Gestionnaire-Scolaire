import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { AdministrativeDocument, Student } from '../types';
import { PrintStudentCardModal } from '../components/modals/PrintStudentCardModal';
import { PrintBulletinModal } from '../components/modals/PrintBulletinModal';
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
  AlertTriangle
} from 'lucide-react';

export const DocumentsView: React.FC = () => {
  const {
    students,
    classes,
    settings,
    administrativeDocuments,
    addAdministrativeDocument,
    updateAdministrativeDocument,
    deleteAdministrativeDocument
  } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [selectedStudentForBulletin, setSelectedStudentForBulletin] = useState<Student | null>(null);

  // Filter and search for documents
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Modals for Certificates
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AdministrativeDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<AdministrativeDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<AdministrativeDocument | null>(null);

  // Form State for Create / Edit
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
    academicYear: settings.academicYear || '2025-2026',
    documentNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    conductAppraisal: 'Très bonne conduite et assiduité exemplaire',
    notes: 'Délivré pour servir et valoir ce que de droit.'
  });

  const handleOpenCreate = (targetStudent?: Student) => {
    const student = targetStudent || students.find(s => s.id === selectedStudentId) || students[0];
    const studentClass = classes.find(c => c.id === student?.classId);
    const count = administrativeDocuments.length + 1;
    const year = settings.academicYear ? settings.academicYear.split('-')[0] : '2025';

    setFormData({
      type: 'CERTIFICAT_SCOLARITE',
      studentId: student ? student.id : '',
      studentName: student ? `${student.firstName} ${student.lastName}` : '',
      studentBirthDate: student ? student.dateOfBirth : '2012-05-15',
      studentBirthPlace: student?.address || 'Cotonou',
      className: studentClass ? studentClass.name : '6ème A',
      academicYear: settings.academicYear || '2025-2026',
      documentNumber: `CERT-${year}-${count.toString().padStart(4, '0')}`,
      issueDate: new Date().toISOString().split('T')[0],
      conductAppraisal: 'Bonne conduite et assiduité régulière',
      notes: 'Ce certificat est délivré à l\'intéressé(e) pour servir et valoir ce que de droit.'
    });
    setEditingDoc(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (doc: AdministrativeDocument) => {
    setEditingDoc(doc);
    setFormData({
      type: doc.type,
      studentId: doc.studentId,
      studentName: doc.studentName,
      studentBirthDate: doc.studentBirthDate || '',
      studentBirthPlace: doc.studentBirthPlace || 'Cotonou',
      className: doc.className,
      academicYear: doc.academicYear,
      documentNumber: doc.documentNumber,
      issueDate: doc.issueDate,
      conductAppraisal: doc.conductAppraisal || 'Bonne conduite',
      notes: doc.notes || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleStudentSelectionChange = (newStudentId: string) => {
    const student = students.find(s => s.id === newStudentId);
    if (!student) return;
    const studentClass = classes.find(c => c.id === student.classId);

    setFormData(prev => ({
      ...prev,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      studentBirthDate: student.dateOfBirth,
      studentBirthPlace: student.address || 'Cotonou',
      className: studentClass ? studentClass.name : prev.className
    }));
  };

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

  const handleDeleteConfirm = () => {
    if (docToDelete) {
      deleteAdministrativeDocument(docToDelete.id);
      setDocToDelete(null);
    }
  };

  // Filtered documents list
  const filteredDocuments = administrativeDocuments.filter(doc => {
    const matchesType = selectedTypeFilter === 'ALL' || doc.type === selectedTypeFilter;
    const matchesSearch =
      doc.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.className.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const selectedStudent = students.find(s => s.id === selectedStudentId);

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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span>Documents Administratifs & Certificats de Scolarité</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Génération, modification et suppression des certificats officiels, attestations, bulletins et cartes scolaires.
          </p>
        </div>

        <button
          onClick={() => handleOpenCreate()}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau Certificat de Scolarité</span>
        </button>
      </div>

      {/* Quick Generator Shortcut Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Certificate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 w-fit">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Certificat de Scolarité</h4>
            <p className="text-xs text-slate-500 mt-1">
              Attestation officielle d'inscription pour démarches administratives, consulats et bourses.
            </p>
          </div>
          <button
            onClick={() => handleOpenCreate()}
            className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Générer un Certificat</span>
          </button>
        </div>

        {/* Card 2: Student ID Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 w-fit">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Carte Scolaire Plastifiée</h4>
            <p className="text-xs text-slate-500 mt-1">
              Carte d'identité élève avec QR Code de contrôle, photo, groupe sanguin et tuteurs.
            </p>
          </div>
          <button
            onClick={() => selectedStudent && setSelectedStudentForCard(selectedStudent)}
            className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Éditer Carte Élève</span>
          </button>
        </div>

        {/* Card 3: Report Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 w-fit">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Bulletin Trimestriel</h4>
            <p className="text-xs text-slate-500 mt-1">
              Aperçu officiel des notes, coefficients, rang, moyennes et signature de direction.
            </p>
          </div>
          <button
            onClick={() => selectedStudent && setSelectedStudentForBulletin(selectedStudent)}
            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Éditer le Bulletin</span>
          </button>
        </div>
      </div>

      {/* Main Section: Registre des Certificats et Documents avec Modification & Suppression */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <span>Registre des Certificats & Documents Émis ({filteredDocuments.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Modifiez ou supprimez les informations de chaque certificat émis en temps réel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Type */}
            <select
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Tous les Types</option>
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
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 w-48 sm:w-60"
              />
            </div>
          </div>
        </div>

        {/* Table of Documents */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Aucun document ou certificat trouvé.
            </p>
            <button
              onClick={() => handleOpenCreate()}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Créer le Premier Certificat</span>
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
                  <th className="px-4 py-3">Appréciation / Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocuments.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {doc.documentNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getDocTypeBadge(doc.type)}`}>
                        {getDocTypeLabel(doc.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-slate-900 dark:text-white">{doc.studentName}</p>
                      <p className="text-[11px] text-slate-500">Classe: <span className="font-bold text-slate-700 dark:text-slate-300">{doc.className}</span> ({doc.academicYear})</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                      {doc.issueDate}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {doc.conductAppraisal || doc.notes || 'Conduite satisfaisante'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* View & Print */}
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                          title="Aperçu & Imprimer le document officiel"
                        >
                          <Printer className="h-4 w-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
                          title="Modifier les informations du certificat"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDocToDelete(doc)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
                          title="Supprimer définitivement ce certificat"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE & EDIT CERTIFICATE MODAL */}
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
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
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
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Details Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom & Prénoms de l'Élève</label>
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
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Classe Fréquentée</label>
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
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
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

      {/* OFFICIAL PRINT PREVIEW MODAL */}
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
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer / Télécharger PDF</span>
                </button>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
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
                  <p className="text-[10px] font-bold mt-1 text-slate-700">MINISTÈRE DES ENSEIGNEMENTS MATERNEL, PRIMAIRE ET SECONDAIRE</p>
                </div>
                <div>
                  <p className="font-black uppercase text-sm tracking-wide text-slate-900">{settings.schoolName || 'ÉTABLISSEMENT SCOLAIRE'}</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase">{settings.motto || 'DISCIPLINE • TRAVAIL • SUCCÈS'}</p>
                  <p className="text-[10px] mt-1 text-slate-600">{settings.address || 'Cotonou - Bénin'} | Tél: {settings.phone || '+229 01 00 00 00'}</p>
                </div>
              </div>

              {/* Reference & Date */}
              <div className="flex justify-between items-center text-xs font-sans">
                <span className="font-bold font-mono">N° {viewingDoc.documentNumber}</span>
                <span className="font-medium text-slate-700">Fait à {settings.city || 'Cotonou'}, le {viewingDoc.issueDate}</span>
              </div>

              {/* Title Banner */}
              <div className="text-center py-3">
                <h1 className="text-xl font-black uppercase tracking-wider underline underline-offset-8">
                  {getDocTypeLabel(viewingDoc.type)}
                </h1>
                <p className="text-xs italic text-slate-600 mt-2">Année Scolaire : {viewingDoc.academicYear}</p>
              </div>

              {/* Certificate Body Paragraph */}
              <div className="space-y-4 text-sm leading-relaxed font-serif text-justify pt-2">
                <p>
                  Je soussigné, <strong>{settings.directorName || 'Le Directeur de l\'Établissement'}</strong>, Directeur de l'établissement scolaire <strong>{settings.schoolName}</strong>, atteste par la présente que :
                </p>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-sans text-xs">
                  <p>L'élève : <strong className="text-sm font-extrabold uppercase">{viewingDoc.studentName}</strong></p>
                  {viewingDoc.studentBirthDate && (
                    <p>Né(e) le : <strong>{viewingDoc.studentBirthDate}</strong> {viewingDoc.studentBirthPlace ? `à ${viewingDoc.studentBirthPlace}` : ''}</p>
                  )}
                  <p>Inscrit(e) en classe de : <strong className="text-sm font-bold text-purple-800">{viewingDoc.className}</strong></p>
                  <p>Appréciation de conduite : <strong>{viewingDoc.conductAppraisal || 'Bonne conduite et assiduité régulière'}</strong></p>
                </div>

                <p>
                  Est régulièrement inscrit(e) et fréquente avec assiduité les cours dispensés dans notre établissement au titre de l'année scolaire <strong>{viewingDoc.academicYear}</strong>.
                </p>

                <p className="italic text-xs text-slate-600">
                  {viewingDoc.notes || 'En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.'}
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
                    <p className="font-extrabold uppercase underline">{settings.directorName || 'Directeur d\'Établissement'}</p>
                    <p className="text-[10px] text-slate-500">(Signature & Cachet de l'Établissement)</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 w-fit">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">Confirmer la suppression</h4>
              <p className="text-xs text-slate-500 mt-1">
                Êtes-vous sûr de vouloir supprimer le document <strong>{docToDelete.documentNumber}</strong> pour l'élève <strong>{docToDelete.studentName}</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300"
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

      {/* Student ID Card Modal */}
      {selectedStudentForCard && (
        <PrintStudentCardModal
          isOpen={!!selectedStudentForCard}
          onClose={() => setSelectedStudentForCard(null)}
          student={selectedStudentForCard}
          classObj={classes.find(c => c.id === selectedStudentForCard.classId)}
        />
      )}

      {/* Report Card Modal */}
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
