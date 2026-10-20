import React, { useState, useRef } from 'react';
import { useApp } from '../../lib/store';
import { Student, SchoolClass, Subject } from '../../types';
import { calculateClassRanks, defaultBulletinTemplate } from '../../lib/gradingUtils';
import { SendBulletinParentModal } from './SendBulletinParentModal';
import { SchoolLogoImportModal } from './SchoolLogoImportModal';
import { InsertBulletinGradesModal } from './InsertBulletinGradesModal';
import { downloadSingleBulletinPdf } from '../../lib/bulletinPdfExport';
import { 
  X, 
  Printer, 
  Download, 
  GraduationCap, 
  CheckCircle2, 
  Award, 
  Trophy, 
  PenTool, 
  Upload, 
  Eye, 
  EyeOff, 
  Sparkles, 
  MessageCircle, 
  Smartphone, 
  Image as ImageIcon, 
  Camera,
  Pencil,
  Trash2,
  Plus,
  BookOpen,
  Edit3
} from 'lucide-react';

const PRESET_SIGNATURES = [
  { name: 'Signature 1 (Encre Bleue)', url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=200' },
  { name: 'Signature 2 (Manuscrite)', url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200' },
  { name: 'Signature 3 (Officielle)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' }
];

interface PrintBulletinModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  classObj?: SchoolClass;
  schoolClass?: SchoolClass;
  trimester: 1 | 2 | 3 | number;
}

export const PrintBulletinModal: React.FC<PrintBulletinModalProps> = ({
  isOpen,
  onClose,
  student,
  classObj: propClassObj,
  schoolClass: propSchoolClass,
  trimester
}) => {
  const classObj = propClassObj || propSchoolClass || ({ id: student?.classId || '', name: 'Classe', level: student?.level || 'COLLEGE' } as SchoolClass);
  const { 
    settings, 
    updateSettings, 
    subjects, 
    grades, 
    students, 
    currentSchool, 
    updateSchool, 
    archiveReportCard,
    updateSubject,
    deleteSubject,
    addSubject
  } = useApp();
  const [showSignatureControls, setShowSignatureControls] = useState(false);
  const [showSignatureOnDoc, setShowSignatureOnDoc] = useState(true);
  const [isSendParentModalOpen, setIsSendParentModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saisie et modification des notes directement depuis ce bulletin
  const [isInsertGradesOpen, setIsInsertGradesOpen] = useState(false);
  const [targetSubjectForGrades, setTargetSubjectForGrades] = useState<Subject | null>(null);

  // Gestion des matières (Modifier ou Supprimer depuis le bulletin)
  const [showSubjectManagerModal, setShowSubjectManagerModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSubjectCoeff, setEditSubjectCoeff] = useState('2');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCoeff, setNewSubjectCoeff] = useState('2');

  const handleOpenEditSubject = (sbj: Subject) => {
    setEditingSubject(sbj);
    setEditSubjectName(sbj.name);
    setEditSubjectCoeff(sbj.coefficient.toString());
  };

  const handleSaveEditSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editSubjectName.trim()) return;

    updateSubject(editingSubject.id, {
      name: editSubjectName.trim(),
      coefficient: Math.max(1, parseInt(editSubjectCoeff) || 1)
    });

    setNoticeMsg(`Matière "${editSubjectName.trim()}" modifiée avec succès !`);
    setEditingSubject(null);
    setTimeout(() => setNoticeMsg(null), 3000);
  };

  const handleDeleteSubject = (sbj: Subject) => {
    deleteSubject(sbj.id);
    setNoticeMsg(`Matière "${sbj.name}" retirée du bulletin.`);
    setTimeout(() => setNoticeMsg(null), 3000);
  };

  const handleAddNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    addSubject({
      name: newSubjectName.trim(),
      code: newSubjectName.trim().substring(0, 4).toUpperCase(),
      coefficient: Math.max(1, parseInt(newSubjectCoeff) || 1),
      level: classObj?.level || student?.level || 'COLLEGE',
      category: 'DIVERS'
    });

    setNoticeMsg(`Matière "${newSubjectName.trim()}" ajoutée au bulletin !`);
    setNewSubjectName('');
    setTimeout(() => setNoticeMsg(null), 3000);
  };

  // Escape key handler for smooth closing
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !student) return null;

  const activeTemplate = currentSchool?.bulletinTemplate || settings.bulletinTemplate || defaultBulletinTemplate();
  const activeSignatureUrl = currentSchool?.signatureUrl || settings.signatureUrl;

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        updateSettings({ signatureUrl: result });
        if (currentSchool) {
          updateSchool(currentSchool.id, { signatureUrl: result });
        }
        setNoticeMsg('Signature scannée enregistrée sur le bulletin !');
        setTimeout(() => setNoticeMsg(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (url: string) => {
    updateSettings({ signatureUrl: url });
    if (currentSchool) {
      updateSchool(currentSchool.id, { signatureUrl: url });
    }
    setNoticeMsg('Signature appliquée !');
    setTimeout(() => setNoticeMsg(null), 3000);
  };

  // Get all students in this class for exact ranking calculation
  const classStudents = students.filter(s => s.classId === (classObj?.id || student.classId));

  // Compute exact class rankings using active bulletin template formula
  const classRankSummary = calculateClassRanks(
    classStudents,
    grades,
    subjects,
    trimester,
    activeTemplate
  );

  // Find target student's rank result
  const studentRankData = classRankSummary.rankings.find(r => r.student.id === student.id) || {
    student,
    subjectResults: [],
    totalCoefficients: 1,
    totalWeightedPoints: 0,
    overallAverage: 0,
    rank: 'N/A',
    numericRank: 0,
    mention: 'SANS DECISION',
    generalAppreciation: 'Aucune donnée enregistrée'
  };

  const handlePrint = () => {
    // Auto-archive this printed bulletin in permanent storage
    archiveReportCard({
      studentId: student.id,
      studentName: `${student.lastName} ${student.firstName}`,
      registrationNumber: student.registrationNumber || 'MAT-N/A',
      photoUrl: student.photoUrl,
      classId: classObj?.id || student.classId,
      className: classObj?.name || 'Classe',
      trimester: trimester,
      academicYear: settings.academicYear || '2025-2026',
      overallAverage: studentRankData.overallAverage,
      rank: studentRankData.rank,
      totalStudentsInClass: classRankSummary.totalStudents,
      mention: studentRankData.mention,
      generalAppreciation: studentRankData.generalAppreciation,
      schoolName: currentSchool?.name || settings.schoolName,
      bulletinTemplateName: activeTemplate.templateName
    });

    window.print();
  };

  const handleDownloadPdf = () => {
    try {
      downloadSingleBulletinPdf({
        studentRank: studentRankData,
        classSummary: classRankSummary,
        schoolClass: classObj,
        school: currentSchool,
        settings,
        trimester: trimester as 1 | 2 | 3,
        template: activeTemplate,
        showSignature: showSignatureOnDoc
      });
      setNoticeMsg(`📥 Bulletin de ${student.lastName} ${student.firstName} téléchargé en PDF avec succès !`);
      setTimeout(() => setNoticeMsg(null), 3500);
    } catch (err) {
      console.error('Erreur lors du téléchargement PDF:', err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto backdrop-enter"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden flex flex-col transition-all max-h-[94vh] modal-enter">
        
        {/* Modal Controls Bar (hidden during print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-purple-400" />
            <span className="font-bold text-sm">Aperçu Officiel du Bulletin - {activeTemplate.templateName}</span>
            <button
              onClick={handleDownloadPdf}
              className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-[11px] rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Télécharger le bulletin officiel de cet élève en document PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span>📥 Télécharger PDF</span>
            </button>
            <button
              onClick={() => {
                setTargetSubjectForGrades(null);
                setIsInsertGradesOpen(true);
              }}
              className="ml-1 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[11px] rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Saisir ou modifier directement les notes de ce bulletin"
            >
              <Edit3 className="h-3.5 w-3.5 text-emerald-200" />
              <span>📝 Saisir / Modifier Notes</span>
            </button>
            <button
              onClick={() => setIsLogoModalOpen(true)}
              className="ml-1 px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-bold text-[11px] rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Importer ou changer le logo officiel qui apparaît sur le bulletin et les épreuves Word"
            >
              <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
              <span>🏫 Logo de l'École</span>
            </button>
            <button
              onClick={() => setShowSubjectManagerModal(true)}
              className="ml-1 px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold text-[11px] rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Modifier les coefficients ou supprimer des matières du bulletin"
            >
              <Pencil className="h-3.5 w-3.5 text-amber-300" />
              <span>⚙️ Gérer les Matières</span>
            </button>
            <button
              onClick={() => setShowSignatureControls(!showSignatureControls)}
              className="ml-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] rounded-lg flex items-center space-x-1 transition-colors"
            >
              <PenTool className="h-3.5 w-3.5 text-amber-400" />
              <span>🖋️ Signature Scannée</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSendParentModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow cursor-pointer"
              title="Transmettre le bulletin officiel au parent sur WhatsApp ou SMS"
            >
              <MessageCircle className="h-4 w-4" />
              <span>📲 WhatsApp / SMS Parent</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Interactive Signature Customizer Bar */}
        {showSignatureControls && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 text-white space-y-3 print:hidden">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Configuration Directe de la Signature & Cachet du Bulletin</span>
              </span>
              <button
                onClick={() => setShowSignatureOnDoc(!showSignatureOnDoc)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center space-x-1 ${
                  showSignatureOnDoc ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {showSignatureOnDoc ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>{showSignatureOnDoc ? 'Signature Affichée' : 'Signature Masquée'}</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              {/* File Upload */}
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                <p className="font-bold text-slate-300 text-[11px]">Importer une nouvelle signature :</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Parcourir une image (PNG/JPG)</span>
                </button>
              </div>

              {/* Presets */}
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                <p className="font-bold text-slate-300 text-[11px]">Ou choisir une signature type :</p>
                <div className="flex items-center gap-1.5">
                  {PRESET_SIGNATURES.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(p.url)}
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                        activeSignatureUrl === p.url
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {noticeMsg && (
          <div className="p-3 bg-emerald-100 text-emerald-900 font-bold text-xs border-b border-emerald-300 flex items-center space-x-2 print:hidden">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{noticeMsg}</span>
          </div>
        )}

        {/* Printable Bulletin Document */}
        <div className="p-8 sm:p-10 bg-white text-slate-900 font-sans print:p-0 print:m-0 relative overflow-hidden" id="bulletin-document">
          
          {/* Filigrane officiel portant le nom de l'école */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden select-none z-0">
            <div className="text-center transform -rotate-25 opacity-[0.05] font-black text-slate-900 uppercase text-4xl sm:text-6xl md:text-7xl tracking-widest leading-relaxed select-none">
              {(settings.schoolName && settings.schoolName !== 'GESTIONNAIRE SCOLAIRE') ? settings.schoolName : (currentSchool?.name || 'ÉTABLISSEMENT SCOLAIRE')}
            </div>
          </div>

          <div className="relative z-10">
          <div className="flex items-start justify-between border-b-2 border-blue-900 pb-4 mb-6">
            <div className="flex items-center space-x-4">
              <div 
                className="relative group cursor-pointer shrink-0" 
                onClick={() => setIsLogoModalOpen(true)}
                title="Cliquer pour importer ou changer le logo officiel de l'école (affiché sur les bulletins et épreuves Word)"
              >
                <img
                  src={currentSchool?.logoUrl || settings.logoUrl || '/icon.svg'}
                  alt={currentSchool?.name || settings.schoolName}
                  className="h-20 w-20 object-contain rounded-xl ring-2 ring-blue-900/20 bg-white p-1"
                />
                <span className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity print:hidden shadow-md">
                  <Camera className="h-2.5 w-2.5" />
                </span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-blue-900 uppercase tracking-tight">
                  {(settings.schoolName && settings.schoolName !== 'GESTIONNAIRE SCOLAIRE') ? settings.schoolName : (currentSchool?.name || 'ÉTABLISSEMENT SCOLAIRE')}
                </h1>
                <p className="text-xs font-semibold text-emerald-700 italic">{currentSchool?.motto || settings.motto}</p>
                <p className="text-xs text-slate-600 mt-1">{currentSchool?.address || settings.address} • Tel: {currentSchool?.phone || settings.phone}</p>
                <p className="text-xs text-slate-500">{currentSchool?.city} ({currentSchool?.country || 'Afrique'})</p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="inline-block bg-blue-900 text-white font-black text-sm px-4 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">
                {activeTemplate.headerTitle || `BULLETIN TRIMESTRE ${trimester}`}
              </div>
              <p className="text-xs font-bold text-slate-700">Année Académique : {settings.academicYear}</p>
              <p className="text-[11px] font-extrabold text-indigo-800">
                Trimestre {trimester} • Classe de {classObj?.name || student.level}
              </p>
              <div className="mt-1 px-3 py-1 bg-blue-50 border border-blue-200 inline-block text-left rounded-lg shadow-xs">
                <span className="text-[10px] uppercase font-bold text-blue-800 block">Élève Titulaire :</span>
                <strong className="text-xs font-black text-blue-950 uppercase tracking-wide">
                  {student.lastName.toUpperCase()} {student.firstName}
                </strong>
              </div>
            </div>
          </div>

          {/* Student Info Box with Prominent Rank Display - NOM DE L'ÉLÈVE EN MAJUSCULE BIEN VISIBLE */}
          <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-xs">
            <div>
              <p className="text-slate-500 font-bold uppercase text-[10px]">Nom & Prénoms de l'Élève</p>
              <p className="font-black text-base text-blue-950 uppercase tracking-tight">{student.lastName.toUpperCase()} {student.firstName}</p>
              <p className="text-slate-600 font-semibold mt-0.5">Matricule : <span className="text-blue-700 font-bold">{student.registrationNumber}</span></p>
            </div>

            <div>
              <p className="text-slate-500 font-bold uppercase text-[10px]">Classe & Sexe</p>
              <p className="font-bold text-slate-900">{classObj?.name || student.level}</p>
              <p className="text-slate-600 mt-0.5">Sexe: {student.gender} | Né(e) le: {student.dateOfBirth}</p>
            </div>

            <div>
              <p className="text-slate-500 font-bold uppercase text-[10px]">Classement dans la Classe</p>
              <p className="font-black text-base text-purple-900 flex items-center space-x-1">
                <Trophy className="h-4 w-4 text-amber-500 inline" />
                <span>RANG : {studentRankData.rank}</span>
              </p>
              <p className="text-slate-600 font-semibold text-[11px]">
                sur {classRankSummary.totalStudents} élèves
              </p>
            </div>

            <div>
              <p className="text-slate-500 font-bold uppercase text-[10px]">Responsable Légal</p>
              <p className="font-bold text-slate-900">{student.parentName}</p>
              <p className="text-slate-600 mt-0.5">Tél: {student.parentPhone}</p>
            </div>
          </div>

          {/* Grades Table */}
          <table className="w-full text-xs border-collapse border border-slate-300 mb-4">
            <thead>
              <tr className="bg-blue-900 text-white font-bold uppercase tracking-wider text-left">
                <th className="p-2 border border-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Matières Définies par l'École</span>
                    <div className="flex items-center space-x-1.5 print:hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetSubjectForGrades(null);
                          setIsInsertGradesOpen(true);
                        }}
                        className="px-2 py-0.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] inline-flex items-center space-x-1 transition-all cursor-pointer"
                        title="Saisir ou corriger les notes de cet élève"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>📝 Saisir Notes</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSubjectManagerModal(true)}
                        className="px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white font-extrabold text-[10px] inline-flex items-center space-x-1 transition-all cursor-pointer"
                        title="Modifier les coefficients ou supprimer des matières"
                      >
                        <Pencil className="h-3 w-3 text-amber-300" />
                        <span>⚙️ Modifier / Supprimer</span>
                      </button>
                    </div>
                  </div>
                </th>
                {activeTemplate.columns.showCoefficients && <th className="p-2 border border-slate-300 text-center">Coeff</th>}
                {activeTemplate.columns.showInterroAverage && <th className="p-2 border border-slate-300 text-center">Interro</th>}
                {activeTemplate.columns.showDevoirMark && <th className="p-2 border border-slate-300 text-center">Devoir</th>}
                {activeTemplate.columns.showCompoMark && <th className="p-2 border border-slate-300 text-center">Compo</th>}
                <th className="p-2 border border-slate-300 text-center">Moy. /20</th>
                {activeTemplate.columns.showSubjectRank && <th className="p-2 border border-slate-300 text-center">Rang</th>}
                {activeTemplate.columns.showTeacherAppreciation && <th className="p-2 border border-slate-300">Appréciation Enseignant</th>}
              </tr>
            </thead>
            <tbody>
              {studentRankData.subjectResults.length > 0 ? (
                studentRankData.subjectResults.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">
                      <div className="flex items-center justify-between group">
                        <span>{item.subject.name}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 print:hidden">
                          <button
                            type="button"
                            onClick={() => {
                              setTargetSubjectForGrades(item.subject);
                              setIsInsertGradesOpen(true);
                            }}
                            className="p-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer"
                            title={`Saisir ou modifier les notes de ${item.subject.name}`}
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditSubject(item.subject)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title={`Modifier "${item.subject.name}" (nom ou coefficient)`}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(item.subject)}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                            title={`Supprimer "${item.subject.name}" du bulletin`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    {activeTemplate.columns.showCoefficients && (
                      <td className="p-2 border border-slate-300 text-center font-semibold">
                        {item.coefficient}
                      </td>
                    )}
                    {activeTemplate.columns.showInterroAverage && (
                      <td className="p-2 border border-slate-300 text-center">
                        {item.interroAverage !== undefined ? item.interroAverage.toFixed(2) : '-'}
                      </td>
                    )}
                    {activeTemplate.columns.showDevoirMark && (
                      <td className="p-2 border border-slate-300 text-center">
                        {item.devoirMark !== undefined ? item.devoirMark.toFixed(2) : '-'}
                      </td>
                    )}
                    {activeTemplate.columns.showCompoMark && (
                      <td className="p-2 border border-slate-300 text-center">
                        {item.compoMark !== undefined ? item.compoMark.toFixed(2) : '-'}
                      </td>
                    )}
                    <td className="p-2 border border-slate-300 text-center font-black text-blue-900">
                      {item.grades.length > 0 ? item.average.toFixed(2) : '-'}
                    </td>
                    {activeTemplate.columns.showSubjectRank && (
                      <td className="p-2 border border-slate-300 text-center font-extrabold text-purple-700">
                        {item.grades.length > 0 ? (item.subjectRank || '-') : '-'}
                      </td>
                    )}
                    {activeTemplate.columns.showTeacherAppreciation && (
                      <td className="p-2 border border-slate-300 italic text-slate-700">
                        {item.grades.length > 0 ? (
                          <div className="space-y-0.5">
                            <div>{item.appreciation}</div>
                            {item.teacherName && (
                              <div className="text-[10px] text-slate-500 font-medium not-italic">
                                {item.teacherName}
                              </div>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-500 italic">
                    Aucune note enregistrée pour ce trimestre.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-extrabold text-slate-900">
                <td className="p-2 border border-slate-300">TOTAL GÉNÉRAL</td>
                {activeTemplate.columns.showCoefficients && (
                  <td className="p-2 border border-slate-300 text-center">{studentRankData.totalCoefficients}</td>
                )}
                <td colSpan={(activeTemplate.columns.showInterroAverage ? 1 : 0) + (activeTemplate.columns.showDevoirMark ? 1 : 0) + (activeTemplate.columns.showCompoMark ? 1 : 0) + 1} className="p-2 border border-slate-300 text-center text-sm font-black text-blue-900">
                  MOYENNE: {studentRankData.overallAverage.toFixed(2)} / 20
                </td>
                {activeTemplate.columns.showSubjectRank && (
                  <td className="p-2 border border-slate-300 text-center font-black text-purple-900">
                    {studentRankData.rank}
                  </td>
                )}
                {activeTemplate.columns.showTeacherAppreciation && (
                  <td className="p-2 border border-slate-300 text-emerald-800 font-extrabold uppercase">
                    {studentRankData.mention}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>

          {/* Class Statistics Line */}
          <div className="grid grid-cols-4 gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl mb-6 text-[11px] text-blue-900 font-bold">
            <div>Moyenne Classe : <span className="font-black text-slate-900">{classRankSummary.classAverage.toFixed(2)} / 20</span></div>
            <div>Plus Forte Moy. : <span className="font-black text-emerald-700">{classRankSummary.highestAverage.toFixed(2)} / 20</span></div>
            <div>Plus Faible Moy. : <span className="font-black text-red-700">{classRankSummary.lowestAverage.toFixed(2)} / 20</span></div>
            <div>Taux de Réussite : <span className="font-black text-purple-700">{classRankSummary.passRate.toFixed(1)}%</span></div>
          </div>

          {/* Summary Stats & Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-200 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-blue-900 uppercase">Appréciation Générale du Conseil de Classe</h4>
              <p className="italic text-slate-700 leading-relaxed">
                "{studentRankData.generalAppreciation}"
              </p>
              <div className="pt-2 flex items-center space-x-2 text-[11px] text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Décision du Conseil : <strong>{studentRankData.mention}</strong></span>
              </div>
            </div>

            <div className="text-center flex flex-col items-center justify-between p-2">
              <p className="font-bold text-slate-800">
                Fait à {currentSchool?.city || settings.city.split('-')[0].trim()}, le {new Date().toLocaleDateString('fr-FR')}
              </p>
              <p className="font-bold text-blue-900 text-xs uppercase mt-2">
                {activeTemplate.directorTitle || 'Le Directeur Général'}
              </p>
              
              {showSignatureOnDoc ? (
                <div className="relative mt-2">
                  <img
                    src={activeSignatureUrl}
                    alt="Signature"
                    className="h-16 opacity-90 object-contain ring-1 ring-slate-100 rounded p-1 bg-white"
                  />
                  <div className="absolute inset-0 border-2 border-emerald-600 rounded-full w-20 h-20 opacity-25 -rotate-12 left-1/2 -translate-x-1/2 pointer-events-none" />
                </div>
              ) : (
                <div className="h-16 w-36 border-2 border-dashed border-slate-300 rounded-lg mt-2 flex items-center justify-center text-[10px] text-slate-400 italic">
                  [Emplacement Signature & Cachet]
                </div>
              )}
            </div>

          </div>

          </div> {/* Closing relative z-10 */}

        </div>

      </div>

      {isSendParentModalOpen && (
        <SendBulletinParentModal
          isOpen={isSendParentModalOpen}
          onClose={() => setIsSendParentModalOpen(false)}
          student={student}
          classObj={classObj}
          trimester={trimester}
          studentAverage={studentRankData.overallAverage}
          studentRank={studentRankData.rank}
          totalStudentsInClass={classRankSummary.totalStudents}
          studentMention={studentRankData.mention}
          studentAppreciation={studentRankData.generalAppreciation}
        />
      )}

      {/* School Logo Import Modal */}
      <SchoolLogoImportModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        initialContext="BULLETIN"
      />

      {/* MODAL GESTION, MODIFICATION ET SUPPRESSION DES MATIÈRES DU BULLETIN */}
      {showSubjectManagerModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSubjectManagerModal(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Gestion des Matières du Bulletin</h3>
                  <p className="text-xs text-slate-500">Modifiez le nom, le coefficient ou supprimez les matières du cursus</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubjectManagerModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Formulaire de modification rapide si une matière est sélectionnée */}
              {editingSubject ? (
                <form onSubmit={handleSaveEditSubject} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-800 dark:text-amber-300 flex items-center space-x-1.5">
                      <Pencil className="h-4 w-4" />
                      <span>Modifier la Matière : <strong>{editingSubject.name}</strong></span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingSubject(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Annuler
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Intitulé de la matière *
                      </label>
                      <input
                        type="text"
                        value={editSubjectName}
                        onChange={e => setEditSubjectName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                        placeholder="Ex: Mathématiques Générales"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Coefficient *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editSubjectCoeff}
                        onChange={e => setEditSubjectCoeff(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingSubject(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-sm transition-colors cursor-pointer"
                    >
                      Enregistrer les modifications
                    </button>
                  </div>
                </form>
              ) : (
                /* Formulaire d'ajout d'une nouvelle matière */
                <form onSubmit={handleAddNewSubject} className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-3">
                  <span className="font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center space-x-1.5">
                    <Plus className="h-4 w-4" />
                    <span>Ajouter une Nouvelle Matière au Bulletin</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nom de la nouvelle matière *
                      </label>
                      <input
                        type="text"
                        value={newSubjectName}
                        onChange={e => setNewSubjectName(e.target.value)}
                        placeholder="Ex: Éducation Civique, Informatique..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Coefficient *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newSubjectCoeff}
                        onChange={e => setNewSubjectCoeff(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Ajouter au Bulletin</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Liste des matières actuelles figurant sur le bulletin */}
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-wider text-[11px]">
                  Matières configurées pour le bulletin ({studentRankData.subjectResults.length}) :
                </h4>

                <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                  {studentRankData.subjectResults.map((sr) => {
                    const sbj = sr.subject;
                    return (
                      <div 
                        key={sbj.id} 
                        className="pt-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold font-mono text-[10px]">
                            {sbj.code || sbj.name.substring(0, 4).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white text-xs">{sbj.name}</p>
                            <p className="text-[10px] text-slate-400">Niveau : {sbj.level || 'SECONDAIRE'}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs">
                            Coeff. {sbj.coefficient}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenEditSubject(sbj)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors cursor-pointer"
                            title="Modifier le nom ou le coefficient de cette matière"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(sbj)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                            title="Supprimer cette matière du bulletin"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSubjectManagerModal(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow transition-all cursor-pointer"
              >
                Terminé & Actualiser le Bulletin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Saisie et modification directe des notes du bulletin */}
      {isInsertGradesOpen && (
        <InsertBulletinGradesModal
          isOpen={isInsertGradesOpen}
          onClose={() => {
            setIsInsertGradesOpen(false);
            setTargetSubjectForGrades(null);
          }}
          student={student}
          classStudents={classStudents}
          schoolClass={classObj}
          trimester={trimester as 1 | 2 | 3}
          targetSubject={targetSubjectForGrades}
          availableSubjects={studentRankData.subjectResults.length > 0 ? studentRankData.subjectResults.map(r => r.subject) : subjects}
        />
      )}
    </div>
  );
};

