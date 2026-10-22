import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../lib/store';
import { Student, SchoolClass, Subject } from '../../types';
import { 
  calculateClassRanks, 
  defaultBulletinTemplate,
  groupSubjectResults,
  getCouncilDecisionMentions,
  getNextClassName,
  SubjectGroup
} from '../../lib/gradingUtils';
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
    attendance,
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
    activeTemplate,
    classObj
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

  // Grouped Subjects into Official Clusters (Scientifiques, Littéraires, Autres)
  const subjectGroups = groupSubjectResults(studentRankData.subjectResults);

  // Council Decision Mentions (Bénin standard)
  const councilDecision = getCouncilDecisionMentions(
    studentRankData.overallAverage,
    trimester,
    classObj?.name || '',
    student.status === 'EXCLU'
  );

  // Previous trimesters calculations for student history bar
  const tri1Summary = calculateClassRanks(classStudents, grades, subjects, 1, activeTemplate, classObj);
  const tri1Student = tri1Summary.rankings.find(r => r.student.id === student.id);
  const moyTri1 = tri1Student?.overallAverage ?? (trimester === 1 ? studentRankData.overallAverage : 0);

  const tri2Summary = calculateClassRanks(classStudents, grades, subjects, 2, activeTemplate, classObj);
  const tri2Student = tri2Summary.rankings.find(r => r.student.id === student.id);
  const moyTri2 = tri2Student?.overallAverage ?? (trimester === 2 ? studentRankData.overallAverage : 0);

  let moyAnnuelle = studentRankData.overallAverage;
  if (trimester === 3) {
    let sumAnnual = 0;
    let countAnnual = 0;
    if (moyTri1 > 0) { sumAnnual += moyTri1; countAnnual++; }
    if (moyTri2 > 0) { sumAnnual += moyTri2; countAnnual++; }
    if (studentRankData.overallAverage > 0) { sumAnnual += studentRankData.overallAverage; countAnnual++; }
    moyAnnuelle = countAnnual > 0 ? sumAnnual / countAnnual : studentRankData.overallAverage;
  } else if (trimester === 2) {
    const valid = [moyTri1, studentRankData.overallAverage].filter(m => m > 0);
    moyAnnuelle = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : studentRankData.overallAverage;
  }

  // Absences and Delays
  const studentAbsences = (attendance || []).filter(a => a.entityId === student.id && a.status === 'ABSENT').length;
  const studentDelays = (attendance || []).filter(a => a.entityId === student.id && a.status === 'RETARD').length;

  // School Identity Data
  const schoolNameDisplay = (settings.schoolName && settings.schoolName !== 'GESTIONNAIRE SCOLAIRE') 
    ? settings.schoolName 
    : (currentSchool?.name || 'COMPLEXE SCOLAIRE LE TEMPLE DU SAVOIR');
  const schoolMotto = currentSchool?.motto || settings.motto || 'SAVOIR - AGIR - ETRE - FAIRE';
  const schoolArrêté = currentSchool?.officialCode || 'Arr: 417/MESFTPRIJ/DC/SGM/DESG/DEP/DPP/SGSI/SA du 05/12/2014';
  const schoolCity = currentSchool?.city || (settings.city ? settings.city.split('-')[0].trim() : 'Godomey');
  const schoolPhone = currentSchool?.phone || settings.phone || '+229 95 05 65 92 / 96 28 75 45';
  const academicYear = settings.academicYear || '2023-2024';
  const className = classObj?.name || student.level || '6ème';
  const directorName = currentSchool?.directorName || settings.directorName || 'Adébayo I. BAKARY';

  const isRedoublant = student.status === 'TRANSFERE' || (student.medicalNotes && student.medicalNotes.toLowerCase().includes('redoubl'));

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

  const handleDownloadPdf = async () => {
    try {
      await downloadSingleBulletinPdf({
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
        <div className="p-4 sm:p-6 bg-white text-slate-900 font-sans print:p-0 print:m-0 relative overflow-hidden text-xs leading-normal" id="bulletin-document">
          
          {/* Filigrane d'arrière-plan officiel type Wexomin */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.035] overflow-hidden select-none z-0">
            <div className="grid grid-cols-5 gap-6 p-2 text-[9px] font-black text-slate-800 uppercase tracking-widest rotate-[-18deg] select-none scale-110">
              {Array.from({ length: 120 }).map((_, i) => (
                <span key={i}>WEXOMIN</span>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            
            {/* 1. EN-TÊTE OFFICIEL BÉNIN */}
            <div className="grid grid-cols-12 gap-2 items-start border-b border-slate-800 pb-2 mb-2">
              {/* Logo de l'établissement à gauche */}
              <div className="col-span-3 flex flex-col items-center justify-center text-center">
                <div 
                  className="relative group cursor-pointer" 
                  onClick={() => setIsLogoModalOpen(true)}
                  title="Cliquer pour changer le logo officiel de l'école"
                >
                  <img
                    src={currentSchool?.logoUrl || settings.logoUrl || '/icon.svg'}
                    alt="Logo"
                    className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-full border-2 border-slate-800 p-1 bg-white shadow-xs"
                  />
                  <span className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity print:hidden shadow-xs">
                    <Camera className="h-2 w-2" />
                  </span>
                </div>
                <p className="text-[8.5px] font-bold text-slate-700 uppercase tracking-tight mt-1 max-w-[130px] leading-tight">
                  {schoolMotto}
                </p>
                <p className="text-[7.5px] text-slate-500 font-semibold tracking-tighter">
                  DISCIPLINE • TRAVAIL • SUCCÈS
                </p>
              </div>

              {/* Bloc Central République & Ministère & Complexe Scolaire */}
              <div className="col-span-9 text-center space-y-0.5">
                <h2 className="text-xs sm:text-sm font-black tracking-widest uppercase text-slate-950">
                  RÉPUBLIQUE DU BÉNIN
                </h2>
                <div className="text-[10px] tracking-widest text-slate-600 font-serif">
                  ************
                </div>
                <p className="text-[8px] sm:text-[9px] font-semibold text-slate-800 uppercase leading-snug px-2">
                  Ministère des Enseignements Secondaire, Technique et de la Formation Professionnelle, de la Reconversion et de l'Insertion des Jeunes
                </p>
                <div className="text-[10px] tracking-widest text-slate-600 font-serif">
                  ************
                </div>
                <h1 className="text-sm sm:text-base font-black uppercase text-slate-950 tracking-tight">
                  {schoolNameDisplay}
                </h1>
                <p className="text-[8.5px] font-bold text-slate-700">
                  {schoolArrêté}
                </p>
                <p className="text-[9.5px] font-extrabold text-slate-900">
                  {schoolCity}
                </p>
                <p className="text-[8.5px] font-semibold text-slate-700">
                  Tél: {schoolPhone}
                </p>
              </div>
            </div>

            {/* 2. BANDEAU TITRE DU BULLETIN */}
            <div className="text-center my-1.5 space-y-0.5">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 underline underline-offset-2 decoration-1">
                BULLETIN DE NOTES
              </h2>
              <div className="flex items-center justify-center space-x-6 text-[10.5px] font-bold text-slate-900">
                <span>ANNÉE SCOLAIRE : <strong className="font-black">{academicYear}</strong></span>
                <span>CLASSE : <strong className="font-black">{className}</strong></span>
                <span>
                  <strong className="text-xs font-black underline mr-1">{trimester}</strong> 
                  ème TRIMESTRE
                </span>
              </div>
            </div>

            {/* 3. BLOC IDENTITÉ DE L'ÉLÈVE (Gauche: Nom/Prénoms/Matricule/Sexe - Droite: Statut & Effectif) */}
            <div className="grid grid-cols-12 gap-3 items-center border border-slate-800 bg-slate-50/60 p-2 mb-2">
              {/* Colonne gauche (table d'identification) */}
              <div className="col-span-8 text-[11px]">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="w-24 font-bold text-slate-700 py-0.5">Nom :</td>
                      <td className="font-black uppercase text-slate-950 text-xs py-0.5">{student.lastName}</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-700 py-0.5">Prénoms :</td>
                      <td className="font-extrabold text-slate-900 py-0.5">{student.firstName}</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-700 py-0.5">N° Matricule :</td>
                      <td className="font-mono font-black text-slate-950 py-0.5">{student.registrationNumber || '2361077'}</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-700 py-0.5">Sexe :</td>
                      <td className="font-black text-slate-950 py-0.5">{student.gender || 'M'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Colonne droite (Nouveau / Redoublant & Effectif) */}
              <div className="col-span-4 border-l border-slate-400 pl-3 flex flex-col justify-center space-y-1.5 text-[10.5px] font-extrabold text-slate-900">
                <div className="flex items-center space-x-2">
                  <span className="w-24">NOUVEAU</span>
                  <span className="w-4 h-4 border border-slate-900 flex items-center justify-center font-black text-[11px] bg-white">
                    {!isRedoublant ? '✓' : ''}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-24">REDOUBLANT</span>
                  <span className="w-4 h-4 border border-slate-900 flex items-center justify-center font-black text-[11px] bg-white">
                    {isRedoublant ? '✓' : ''}
                  </span>
                </div>
                <div className="pt-0.5 text-slate-950 text-[11px]">
                  <span>EFFECTIF : </span>
                  <strong className="font-black text-xs ml-1">{classRankSummary.totalStudents || 14}</strong>
                </div>
              </div>
            </div>

            {/* 4. TABLEAU DES NOTES PAR REGROUPEMENT DISCIPLINAIRE (Norme Bénin) */}
            <div className="overflow-x-auto mb-1">
              <table className="w-full text-[10px] border-collapse border border-slate-800">
                <thead>
                  <tr className="bg-slate-200 text-slate-950 font-black uppercase tracking-tight text-center border-b border-slate-800">
                    <th className="p-1 border border-slate-700 text-left w-36">MATIERES</th>
                    <th className="p-1 border border-slate-700 w-10">COEF</th>
                    <th className="p-1 border border-slate-700 w-11" title="Note d'interrogation 1">Int 1</th>
                    <th className="p-1 border border-slate-700 w-11" title="Note d'interrogation 2">Int 2</th>
                    <th className="p-1 border border-slate-700 w-12" title="Moyenne des interrogations">Moy. INT</th>
                    <th className="p-1 border border-slate-700 w-11">DEVOIR</th>
                    <th className="p-1 border border-slate-700 w-12">COMPO</th>
                    <th className="p-1 border border-slate-700 w-14 font-black">MOY/20</th>
                    <th className="p-1 border border-slate-700 w-14 font-black bg-slate-300">Moy. Coef</th>
                    <th className="p-1 border border-slate-700 w-11">RANG</th>
                    <th className="p-1 border border-slate-700 text-left">APPRECIATIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectGroups.length > 0 ? (
                    subjectGroups.map((group, gIdx) => (
                      <React.Fragment key={gIdx}>
                        {group.items.map((item, idx) => {
                          const interroAvgVal = item.interroAverage !== undefined ? item.interroAverage.toFixed(2) : (item.interro1 !== undefined ? item.interro1.toFixed(2) : '-');
                          const devVal = item.devoirMark !== undefined ? item.devoirMark.toFixed(2) : '-';
                          const compoVal = item.compoMark !== undefined ? item.compoMark.toFixed(2) : '-';

                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="p-1 border border-slate-700 font-bold text-slate-900">
                                <div className="flex items-center justify-between group">
                                  <span>{item.subject.name}</span>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 print:hidden">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTargetSubjectForGrades(item.subject);
                                        setIsInsertGradesOpen(true);
                                      }}
                                      className="p-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer text-[9px]"
                                      title="Saisir/Modifier notes"
                                    >
                                      <Edit3 className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="p-1 border border-slate-700 text-center font-bold text-slate-800">
                                {item.coefficient}
                              </td>
                              <td className="p-1 border border-slate-700 text-center font-semibold text-slate-800">
                                {item.interro1 !== undefined ? item.interro1.toFixed(2) : '-'}
                              </td>
                              <td className="p-1 border border-slate-700 text-center font-semibold text-slate-800">
                                {item.interro2 !== undefined ? item.interro2.toFixed(2) : '-'}
                              </td>
                              <td className="p-1 border border-slate-700 text-center font-bold text-slate-900">
                                {interroAvgVal}
                              </td>
                              <td className="p-1 border border-slate-700 text-center font-semibold text-slate-800">
                                {devVal}
                              </td>
                              <td className="p-1 border border-slate-700 text-center font-semibold text-slate-800">
                                {compoVal}
                              </td>
                              <td className="p-1 border border-slate-700 text-center font-black text-slate-950 bg-slate-100/50">
                                {item.grades.length > 0 ? item.average.toFixed(2) : '-'}
                              </td>
                              <td className="p-1 border border-slate-700 text-center font-black text-slate-950 bg-slate-200/60">
                                {item.grades.length > 0 ? item.weightedAverage.toFixed(2) : '-'}
                              </td>
                              <td className="p-1 border border-slate-700 text-center font-bold text-slate-800">
                                {item.grades.length > 0 ? (item.subjectRank || '-') : '-'}
                              </td>
                              <td className="p-1 border border-slate-700 italic text-slate-700 text-[9.5px]">
                                {item.grades.length > 0 ? item.appreciation : '-'}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Sous-total du groupe (Matières Scientifiques, Matières Littéraires, Autres Matières) */}
                        <tr className="bg-slate-100/80 font-bold text-slate-900 border-t border-b border-slate-600 text-[9.5px]">
                          <td className="p-1 border border-slate-700 italic font-extrabold text-slate-900">
                            {group.name}
                          </td>
                          <td className="p-1 border border-slate-700 text-center font-black">
                            {group.totalCoeff}
                          </td>
                          <td colSpan={5} className="p-1 border border-slate-700 bg-slate-50/50"></td>
                          <td className="p-1 border border-slate-700 text-center font-black text-slate-950">
                            {group.groupAverage > 0 ? group.groupAverage.toFixed(2) : '-'}
                          </td>
                          <td className="p-1 border border-slate-700 text-center font-black text-slate-950 bg-slate-200/40">
                            {group.totalWeightedPoints > 0 ? group.totalWeightedPoints.toFixed(2) : '-'}
                          </td>
                          <td colSpan={2} className="p-1 border border-slate-700"></td>
                        </tr>
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="p-4 text-center text-slate-500 italic">
                        Aucune matière configurée pour ce trimestre.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  {/* Ligne TOTAL GÉNÉRAL / TOUTES MATIÈRES */}
                  <tr className="bg-slate-200 font-black text-slate-950 border-t-2 border-slate-800 text-[10.5px]">
                    <td className="p-1.5 border border-slate-700 uppercase">
                      Toutes Matières
                    </td>
                    <td className="p-1.5 border border-slate-700 text-center font-black text-xs">
                      {studentRankData.totalCoefficients}
                    </td>
                    <td colSpan={5} className="p-1.5 border border-slate-700 text-right uppercase tracking-wider pr-3">
                      TOTAL GENERAL :
                    </td>
                    <td className="p-1.5 border border-slate-700 text-center font-black text-xs" colSpan={2}>
                      {studentRankData.totalWeightedPoints.toFixed(2)}
                    </td>
                    <td colSpan={2} className="p-1.5 border border-slate-700"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 5. BANDEAU DES STATISTIQUES OFFICIELLES (5 cases horizontales quadrillées) */}
            <div className="grid grid-cols-5 border border-slate-800 text-[10px] sm:text-[10.5px] font-bold text-center divide-x divide-slate-800 bg-slate-100 my-1.5">
              <div className="p-1 leading-tight">
                <span className="block text-slate-700 font-extrabold text-[9px] uppercase">MOYENNE TRIMESTRIELLE</span>
                <span className="font-black text-slate-950 text-xs sm:text-sm">{studentRankData.overallAverage.toFixed(2)}</span>
              </div>
              <div className="p-1 leading-tight">
                <span className="block text-slate-700 font-extrabold text-[9px] uppercase">RANG TRIM</span>
                <span className="font-black text-slate-950 text-xs sm:text-sm">{studentRankData.rank}</span>
              </div>
              <div className="p-1 leading-tight">
                <span className="block text-slate-700 font-extrabold text-[9px] uppercase">FORTE MOYENNE</span>
                <span className="font-black text-emerald-800 text-xs sm:text-sm">{classRankSummary.highestAverage.toFixed(2)}</span>
              </div>
              <div className="p-1 leading-tight">
                <span className="block text-slate-700 font-extrabold text-[9px] uppercase">FAIBLE MOYENNE</span>
                <span className="font-black text-red-800 text-xs sm:text-sm">{classRankSummary.lowestAverage.toFixed(2)}</span>
              </div>
              <div className="p-1 leading-tight">
                <span className="block text-slate-700 font-extrabold text-[9px] uppercase">MOYENNE DE LA CLASSE</span>
                <span className="font-black text-blue-900 text-xs sm:text-sm">{classRankSummary.classAverage.toFixed(2)}</span>
              </div>
            </div>

            {/* 6. PIED DE PAGE : DÉCISION DU CONSEIL DES PROFESSEURS & SIGNATURE DU DIRECTEUR */}
            <div className="grid grid-cols-12 gap-3 my-1.5">
              
              {/* Cadre Gauche : Décision du Conseil des Professeurs & Appréciation */}
              <div className="col-span-6 border border-slate-800 p-2 space-y-1.5 text-xs bg-white">
                <div className="text-center font-black uppercase text-[10.5px] tracking-wide border-b border-slate-700 pb-1 text-slate-950">
                  DÉCISION DU CONSEIL DES PROFESSEURS
                </div>
                
                {/* Table des Mentions */}
                <table className="w-full text-[10px] border-collapse border border-slate-700">
                  <tbody>
                    <tr>
                      <td className="border border-slate-700 px-2 py-0.5 font-bold text-slate-900">FÉLICITATIONS</td>
                      <td className="border border-slate-700 text-center font-black w-8 bg-slate-50">{councilDecision.felicitations ? 'X' : ''}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-700 px-2 py-0.5 font-bold text-slate-900">ENCOURAGEMENTS</td>
                      <td className="border border-slate-700 text-center font-black w-8 bg-slate-50">{councilDecision.encouragements ? 'X' : ''}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-700 px-2 py-0.5 font-bold text-slate-900">TABLEAU D'HONNEUR</td>
                      <td className="border border-slate-700 text-center font-black w-8 bg-slate-50">{councilDecision.tableauHonneur ? 'X' : ''}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-700 px-2 py-0.5 font-bold text-slate-900">AVERTISSEMENT</td>
                      <td className="border border-slate-700 text-center font-black w-8 bg-slate-50">{councilDecision.avertissement ? 'X' : ''}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-700 px-2 py-0.5 font-bold text-slate-900">BLÂME</td>
                      <td className="border border-slate-700 text-center font-black w-8 bg-slate-50">{councilDecision.blame ? 'X' : ''}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-700 px-2 py-0.5 font-bold text-slate-900">RENVOI</td>
                      <td className="border border-slate-700 text-center font-black w-8 bg-slate-50">{councilDecision.renvoi ? 'X' : ''}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Appréciation du Directeur & Décision de promotion */}
                <div className="border-t border-slate-700 pt-1.5 space-y-1 text-[10.5px]">
                  <div className="font-black text-slate-900 underline text-[10px] uppercase">
                    Appréciation du Directeur
                  </div>
                  <div className="flex items-center">
                    <span className="text-slate-700 font-semibold w-20">Travail....</span>
                    <strong className="font-black text-slate-950">{councilDecision.appreciationDirecteur}</strong>
                  </div>
                  <div className="flex items-center">
                    <span className="text-slate-900 font-black w-20 uppercase">DÉCISION :</span>
                    <strong className="font-black uppercase text-blue-950 text-xs">{councilDecision.decision}</strong>
                  </div>
                </div>
              </div>

              {/* Cadre Droit : Signature et Cachet du Directeur */}
              <div className="col-span-6 border border-slate-800 p-2 flex flex-col justify-between text-xs text-center bg-white">
                <div>
                  <div className="font-black uppercase text-[10.5px] tracking-wide border-b border-slate-700 pb-1 text-slate-950">
                    SIGNATURE ET CACHET DU DIRECTEUR
                  </div>
                  <p className="font-bold text-slate-800 text-[10.5px] mt-1.5">
                    {schoolCity.toUpperCase()}, le {new Date().toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {/* Emplacement Signature & Cachet officiel */}
                <div className="my-1 min-h-[68px] flex items-center justify-center relative">
                  {showSignatureOnDoc && activeSignatureUrl ? (
                    <div className="relative">
                      <img
                        src={activeSignatureUrl}
                        alt="Signature & Cachet"
                        className="h-16 max-w-[160px] object-contain opacity-95"
                      />
                      <div className="absolute inset-0 border-2 border-emerald-700 rounded-full w-20 h-20 opacity-20 -rotate-12 left-1/2 -translate-x-1/2 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-400 w-44 h-16 rounded flex items-center justify-center text-[10px] text-slate-400 italic">
                      [Signature et Cachet Officiel]
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-400 pt-1">
                  <p className="font-black text-slate-950 text-[11px] uppercase tracking-wide">
                    {directorName}
                  </p>
                </div>
              </div>

            </div>

            {/* 7. BANDEAU HISTORIQUE DES TRIMESTRES & DISCIPLINE (ABSENCES / RETARDS) */}
            <div className="border border-slate-800 p-1.5 text-[10px] sm:text-[10.5px] font-bold text-slate-900 bg-slate-50 space-y-1">
              <div className="flex flex-wrap items-center justify-between px-1">
                <span>Moy 1er Tri : <strong className="font-black text-slate-950">{moyTri1 > 0 ? moyTri1.toFixed(2) : '-'}</strong></span>
                <span>Moy 2e Tri : <strong className="font-black text-slate-950">{moyTri2 > 0 ? moyTri2.toFixed(2) : '-'}</strong></span>
                <span>Moy Annuelle : <strong className="font-black text-blue-950 text-[11px]">{moyAnnuelle > 0 ? moyAnnuelle.toFixed(2) : '-'}</strong></span>
                <span>Rang : <strong className="font-black text-purple-950 text-[11px]">{studentRankData.rank}</strong></span>
              </div>
              <div className="flex items-center justify-between px-1 border-t border-slate-300 pt-1 text-[10px] text-slate-700">
                <span>Nbre d'absences : <strong className="text-slate-950 font-black">{studentAbsences}</strong></span>
                <span>Nbre de retards : <strong className="text-slate-950 font-black">{studentDelays}</strong></span>
              </div>
            </div>

            {/* 8. MENTION LÉGALE & SIGNATURE LOGICIEL (Wexomin / TIC Solution) */}
            <div className="text-center mt-2 space-y-0.5">
              <p className="text-[9.5px] font-bold text-slate-800 italic">
                NB: Conservez précieusement ce bulletin, aucun double ne sera établi.
              </p>
              <p className="text-[8px] text-slate-500 font-mono tracking-tight">
                wexomin 1.1.7.1 Powered by TIC SOLUTION Tel (+229) 62 80 97 78 / 95 08 07 99 e-mail: ticsolution13@gmail.com
              </p>
            </div>

          </div> {/* Fin relative z-10 */}

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

