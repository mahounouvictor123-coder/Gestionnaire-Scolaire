import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../lib/store';
import { Student, Subject } from '../types';
import { isPrimaryClass } from '../lib/schoolUtils';
import { PrintBulletinModal } from '../components/modals/PrintBulletinModal';
import { ScanBulletinTemplateModal } from '../components/modals/ScanBulletinTemplateModal';
import { SendBulletinParentModal } from '../components/modals/SendBulletinParentModal';
import { AIGradesBulletinWhatsAppModal } from '../components/modals/AIGradesBulletinWhatsAppModal';
import { SchoolLogoImportModal } from '../components/modals/SchoolLogoImportModal';
import { InsertBulletinGradesModal } from '../components/modals/InsertBulletinGradesModal';
import { downloadSingleBulletinPdf, downloadClassBulletinsPdf } from '../lib/bulletinPdfExport';
import { 
  calculateClassRanks, 
  defaultBulletinTemplate,
  groupSubjectResults,
  getCouncilDecisionMentions
} from '../lib/gradingUtils';
import {
  FileCheck,
  FileText,
  Printer,
  Sparkles,
  User,
  Award,
  Scan,
  Trophy,
  ListOrdered,
  Grid,
  CheckCircle2,
  TrendingUp,
  Download,
  Users,
  Archive,
  Clock,
  Search,
  Filter,
  Trash2,
  History,
  ShieldCheck,
  FolderArchive,
  MessageCircle,
  Smartphone,
  Send,
  Bot,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  PenTool,
  Eye,
  EyeOff,
  Pencil,
  Edit3,
  X,
  Plus
} from 'lucide-react';

interface ReportCardsViewProps {
  onNavigate?: (view: string) => void;
}

export const ReportCardsView: React.FC<ReportCardsViewProps> = ({ onNavigate }) => {
  const {
    students,
    classes,
    settings,
    grades,
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    currentSchool,
    attendance,
    archivedReportCards,
    archiveReportCard,
    deleteArchivedReportCard
  } = useApp();

  const [mainTab, setMainTab] = useState<'GENERATOR' | 'ARCHIVES'>('GENERATOR');
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return classes[0]?.id || '';
  });

  // Maintenir la classe sélectionnée
  useEffect(() => {
    if (classes.length > 0 && !classes.some(c => c.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(settings.currentTrimester);
  const [selectedStudentForBulletin, setSelectedStudentForBulletin] = useState<Student | null>(null);
  const [isScanTemplateModalOpen, setIsScanTemplateModalOpen] = useState(false);
  const [showAiWhatsAppModal, setShowAiWhatsAppModal] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  
  // Format d'affichage par défaut : RANKING_TABLE (La liste de la classe s'affiche d'abord, cliquer sur un élève affiche son bulletin)
  const [viewMode, setViewMode] = useState<'RANKING_TABLE' | 'BULLETIN_PREVIEW' | 'CARDS'>('RANKING_TABLE');
  // Sélectionner par défaut le premier élève réel de la classe
  const [previewStudentId, setPreviewStudentId] = useState<string>(() => {
    const firstCls = classes[0];
    const firstSts = students.filter(s => s.classId === firstCls?.id);
    return firstSts[0]?.id || 'SPECIMEN';
  });
  const [showSignatureOnDoc, setShowSignatureOnDoc] = useState(true);
  const [bulkArchiveMessage, setBulkArchiveMessage] = useState<string>('');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Saisie et insertion directe des notes du bulletin
  const [isInsertGradesModalOpen, setIsInsertGradesModalOpen] = useState(false);
  const [insertGradesStudent, setInsertGradesStudent] = useState<Student | null>(null);
  const [insertGradesTargetSubject, setInsertGradesTargetSubject] = useState<Subject | null>(null);

  // Gestion des matières (Modification et Suppression directe depuis le bulletin)
  const [showSubjectManagerModal, setShowSubjectManagerModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSubjectCoeff, setEditSubjectCoeff] = useState('2');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCoeff, setNewSubjectCoeff] = useState('2');
  const [subjectNotice, setSubjectNotice] = useState<string | null>(null);

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

    setSubjectNotice(`Matière "${editSubjectName.trim()}" mise à jour avec succès !`);
    setEditingSubject(null);
    setTimeout(() => setSubjectNotice(null), 3000);
  };

  const handleDeleteSubjectFromBulletin = (sbj: Subject) => {
    deleteSubject(sbj.id);
    setSubjectNotice(`Matière "${sbj.name}" retirée du bulletin avec succès.`);
    setTimeout(() => setSubjectNotice(null), 3000);
  };

  const handleAddNewSubjectFromBulletin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    addSubject({
      name: newSubjectName.trim(),
      code: newSubjectName.trim().substring(0, 4).toUpperCase(),
      coefficient: Math.max(1, parseInt(newSubjectCoeff) || 1),
      level: selectedClass?.level || 'COLLEGE',
      category: 'DIVERS'
    });

    setSubjectNotice(`Matière "${newSubjectName.trim()}" ajoutée avec succès au bulletin !`);
    setNewSubjectName('');
    setTimeout(() => setSubjectNotice(null), 3000);
  };

  // Send to Parent WhatsApp/SMS Modal state
  const [sendParentModalData, setSendParentModalData] = useState<{
    isOpen: boolean;
    student?: Student;
    studentAverage?: number;
    studentRank?: string | number;
    studentMention?: string;
  }>({ isOpen: false });

  // Archives Tab Filter State
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [archiveYearFilter, setArchiveYearFilter] = useState<string>('ALL');
  const [archiveTrimesterFilter, setArchiveTrimesterFilter] = useState<string>('ALL');
  const [archiveClassFilter, setArchiveClassFilter] = useState<string>('ALL');

  const activeTemplate = currentSchool?.bulletinTemplate || settings.bulletinTemplate || defaultBulletinTemplate();
  const activeSignatureUrl = currentSchool?.signatureUrl || settings.signatureUrl;

  const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter(s => s.classId === selectedClass?.id);

  // Synchronisation automatique : quand on change de classe, afficher immédiatement le premier élève réel
  useEffect(() => {
    if (classStudents.length > 0) {
      if (!classStudents.some(s => s.id === previewStudentId)) {
        setPreviewStudentId(classStudents[0].id);
      }
    } else {
      setPreviewStudentId('SPECIMEN');
    }
  }, [selectedClassId, classStudents]);

  // Compute exact rankings for all students in selected class from 1st to last
  const classRankSummary = calculateClassRanks(
    classStudents,
    grades,
    subjects,
    selectedTrimester,
    activeTemplate
  );

  // Spécimen modèle d'élève officiel portant toutes les matières de l'école
  const specimenStudent: Student = useMemo(() => ({
    id: 'specimen-student',
    firstName: 'Élève Exemple',
    lastName: 'SPÉCIMEN OFFICIEL',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    email: 'specimen@ecole.educ',
    phone: currentSchool?.phone || settings.phone || '01 00 00 00 00',
    classId: selectedClass?.id || '',
    dateOfBirth: '2010-01-01',
    address: currentSchool?.address || settings.address,
    gender: 'M',
    status: 'INSCRIT',
    registrationNumber: 'MAT-SPEC-2025',
    parentName: 'Direction Pédagogique',
    parentPhone: currentSchool?.phone || settings.phone || '96 00 00 00',
    parentEmail: 'direction@ecole.educ',
    enrollmentDate: '2024-09-01',
    healthNotes: 'R.A.S',
    level: selectedClass?.level || 'COLLEGE'
  }), [selectedClass, currentSchool, settings]);

  const activeStudentForBulletin = previewStudentId === 'SPECIMEN'
    ? specimenStudent
    : (classStudents.find(s => s.id === previewStudentId) || classStudents[0] || specimenStudent);

  // Toutes les matières définies par l'établissement pour ce niveau
  const isSelectedPrimary = selectedClass ? isPrimaryClass(selectedClass) : false;
  const definedClassSubjects = useMemo(() => {
    const filtered = subjects.filter(s => {
      if (isSelectedPrimary) {
        return isPrimaryClass(s) || s.level === 'PRIMAIRE' || s.level === 'MATERNELLE' || s.id.startsWith('sbj-p-') || s.id.startsWith('sbj-mat-');
      }
      return !isPrimaryClass(s) && s.level !== 'PRIMAIRE' && s.level !== 'MATERNELLE' && !s.id.startsWith('sbj-p-') && !s.id.startsWith('sbj-mat-');
    });
    return filtered.length > 0 ? filtered : subjects;
  }, [subjects, isSelectedPrimary]);

  const currentBulletinRankData = useMemo(() => {
    const found = classRankSummary.rankings.find(r => r.student.id === activeStudentForBulletin.id);
    if (found) return found;

    return {
      student: activeStudentForBulletin,
      subjectResults: definedClassSubjects.map(s => ({
        subject: s,
        grades: [],
        average: 0,
        weightedAverage: 0,
        coefficient: s.coefficient || 1,
        appreciation: 'Non évalué'
      })),
      totalCoefficients: definedClassSubjects.reduce((sum, s) => sum + (s.coefficient || 1), 0) || 1,
      totalWeightedPoints: 0,
      overallAverage: 0,
      rank: activeStudentForBulletin.id === 'specimen-student' ? 'Modèle Vierge' : 'N/A',
      numericRank: 1,
      mention: activeStudentForBulletin.id === 'specimen-student' ? "SPÉCIMEN ÉCOLE" : "SANS DÉCISION",
      generalAppreciation: activeStudentForBulletin.id === 'specimen-student'
        ? "Format officiel du bulletin dressé pour la classe, portant l'ensemble des matières arrêtées par l'école."
        : "Aucune note enregistrée pour cet élève ce trimestre."
    };
  }, [classRankSummary, activeStudentForBulletin, definedClassSubjects]);

  // Grouped Subjects into Official Clusters (Scientifiques, Littéraires, Autres)
  const previewSubjectGroups = useMemo(() => {
    return groupSubjectResults(currentBulletinRankData.subjectResults);
  }, [currentBulletinRankData.subjectResults]);

  // Council Decision Mentions (Bénin standard)
  const previewCouncilDecision = useMemo(() => {
    return getCouncilDecisionMentions(
      currentBulletinRankData.overallAverage,
      selectedTrimester,
      selectedClass?.name || '',
      activeStudentForBulletin.status === 'EXCLU'
    );
  }, [currentBulletinRankData.overallAverage, selectedTrimester, selectedClass, activeStudentForBulletin]);

  // Previous trimesters calculations for student history bar
  const previewTri1Summary = useMemo(() => calculateClassRanks(classStudents, grades, subjects, 1, activeTemplate), [classStudents, grades, subjects, activeTemplate]);
  const previewTri1Student = previewTri1Summary.rankings.find(r => r.student.id === activeStudentForBulletin.id);
  const previewMoyTri1 = previewTri1Student?.overallAverage ?? (selectedTrimester === 1 ? currentBulletinRankData.overallAverage : 0);

  const previewTri2Summary = useMemo(() => calculateClassRanks(classStudents, grades, subjects, 2, activeTemplate), [classStudents, grades, subjects, activeTemplate]);
  const previewTri2Student = previewTri2Summary.rankings.find(r => r.student.id === activeStudentForBulletin.id);
  const previewMoyTri2 = previewTri2Student?.overallAverage ?? (selectedTrimester === 2 ? currentBulletinRankData.overallAverage : 0);

  const previewMoyAnnuelle = useMemo(() => {
    if (selectedTrimester === 3) {
      let sum = 0; let count = 0;
      if (previewMoyTri1 > 0) { sum += previewMoyTri1; count++; }
      if (previewMoyTri2 > 0) { sum += previewMoyTri2; count++; }
      if (currentBulletinRankData.overallAverage > 0) { sum += currentBulletinRankData.overallAverage; count++; }
      return count > 0 ? sum / count : currentBulletinRankData.overallAverage;
    } else if (selectedTrimester === 2) {
      const valid = [previewMoyTri1, currentBulletinRankData.overallAverage].filter(m => m > 0);
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : currentBulletinRankData.overallAverage;
    }
    return currentBulletinRankData.overallAverage;
  }, [selectedTrimester, previewMoyTri1, previewMoyTri2, currentBulletinRankData.overallAverage]);

  const previewAbsences = (attendance || []).filter(a => a.entityId === activeStudentForBulletin.id && a.status === 'ABSENT').length;
  const previewDelays = (attendance || []).filter(a => a.entityId === activeStudentForBulletin.id && a.status === 'RETARD').length;
  const isPreviewRedoublant = activeStudentForBulletin.status === 'TRANSFERE' || (activeStudentForBulletin.medicalNotes && activeStudentForBulletin.medicalNotes.toLowerCase().includes('redoubl'));

  const previewSchoolNameDisplay = (settings.schoolName && settings.schoolName !== 'GESTIONNAIRE SCOLAIRE') 
    ? settings.schoolName 
    : (currentSchool?.name || 'COMPLEXE SCOLAIRE LE TEMPLE DU SAVOIR');
  const previewSchoolMotto = currentSchool?.motto || settings.motto || 'SAVOIR - AGIR - ETRE - FAIRE';
  const previewSchoolArrêté = currentSchool?.officialCode || 'Arr: 417/MESFTPRIJ/DC/SGM/DESG/DEP/DPP/SGSI/SA du 05/12/2014';
  const previewSchoolCity = currentSchool?.city || (settings.city ? settings.city.split('-')[0].trim() : 'Godomey');
  const previewSchoolPhone = currentSchool?.phone || settings.phone || '+229 95 05 65 92 / 96 28 75 45';
  const previewDirectorName = currentSchool?.directorName || settings.directorName || 'Adébayo I. BAKARY';

  const handlePrintClassRanking = () => {
    window.print();
  };

  // Bulk Archive all students in the class
  const handleBulkArchiveClass = () => {
    let count = 0;
    classRankSummary.rankings.forEach(item => {
      archiveReportCard({
        studentId: item.student.id,
        studentName: `${item.student.lastName} ${item.student.firstName}`,
        registrationNumber: item.student.registrationNumber || 'MAT-N/A',
        photoUrl: item.student.photoUrl,
        classId: selectedClass?.id || item.student.classId,
        className: selectedClass?.name || 'Classe',
        trimester: selectedTrimester,
        academicYear: settings.academicYear || '2025-2026',
        overallAverage: item.overallAverage,
        rank: item.rank,
        totalStudentsInClass: classRankSummary.totalStudents,
        mention: item.mention,
        generalAppreciation: item.generalAppreciation,
        schoolName: currentSchool?.name || settings.schoolName,
        bulletinTemplateName: activeTemplate.templateName
      });
      count++;
    });

    setBulkArchiveMessage(`✅ ${count} bulletins de la classe ${selectedClass?.name} (Trimestre ${selectedTrimester}) ont été archivés définitivement !`);
    setTimeout(() => setBulkArchiveMessage(''), 5000);
  };

  // Télécharger le bulletin d'un élève en PDF
  const handleDownloadSinglePdf = (rankItem: typeof currentBulletinRankData) => {
    try {
      downloadSingleBulletinPdf({
        studentRank: rankItem,
        classSummary: classRankSummary,
        schoolClass: selectedClass,
        school: currentSchool,
        settings,
        trimester: selectedTrimester,
        template: activeTemplate,
        showSignature: showSignatureOnDoc
      });
      setDownloadNotice(`📥 Bulletin de ${rankItem.student.lastName} ${rankItem.student.firstName} téléchargé en PDF avec succès !`);
      setTimeout(() => setDownloadNotice(null), 4000);
    } catch (err) {
      console.error('Erreur lors du téléchargement du bulletin:', err);
    }
  };

  // Télécharger tous les bulletins de la classe en 1 seul PDF multi-pages
  const handleDownloadClassPdf = () => {
    try {
      if (classRankSummary.rankings.length === 0) {
        alert("Aucun élève dans cette classe à télécharger.");
        return;
      }
      downloadClassBulletinsPdf(
        classRankSummary.rankings,
        classRankSummary,
        selectedClass,
        currentSchool,
        settings,
        selectedTrimester,
        activeTemplate
      );
      setDownloadNotice(`📥 Tous les bulletins de la classe ${selectedClass?.name} (${classRankSummary.totalStudents} élèves) ont été téléchargés en PDF !`);
      setTimeout(() => setDownloadNotice(null), 4500);
    } catch (err) {
      console.error('Erreur lors du téléchargement des bulletins:', err);
    }
  };

  // Filter archived bulletins
  const filteredArchives = archivedReportCards.filter(card => {
    const matchesSearch = card.studentName.toLowerCase().includes(archiveSearch.toLowerCase()) ||
                          card.registrationNumber.toLowerCase().includes(archiveSearch.toLowerCase()) ||
                          card.className.toLowerCase().includes(archiveSearch.toLowerCase());
    const matchesYear = archiveYearFilter === 'ALL' || card.academicYear === archiveYearFilter;
    const matchesTrimester = archiveTrimesterFilter === 'ALL' || card.trimester.toString() === archiveTrimesterFilter;
    const matchesClass = archiveClassFilter === 'ALL' || card.classId === archiveClassFilter || card.className === archiveClassFilter;

    return matchesSearch && matchesYear && matchesTrimester && matchesClass;
  });

  // Extract unique academic years from archives
  const uniqueYears = Array.from(new Set(archivedReportCards.map(a => a.academicYear))).filter(Boolean);
  if (!uniqueYears.includes('2025-2026')) uniqueYears.push('2025-2026');
  if (!uniqueYears.includes('2024-2025')) uniqueYears.push('2024-2025');
  if (!uniqueYears.includes('2023-2024')) uniqueYears.push('2023-2024');

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center space-x-1 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-all mr-1 cursor-pointer"
                title="Retourner au Tableau de Bord"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-purple-600" />
                <span>Accueil</span>
              </button>
            )}
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <FileCheck className="h-6 w-6 text-purple-600" />
              <span>Centre des Bulletins & Archives Permanentes</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-extrabold uppercase border border-purple-200 dark:border-purple-800">
              {activeTemplate.templateName}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calcul des moyennes, classement officiel et conservation indéfinie des bulletins archivés année après année.
          </p>
        </div>

        {/* Action Buttons: Saisie des Notes, Télécharger Bulletins, Logo, IA WhatsApp, Scanner */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => {
              setInsertGradesStudent(activeStudentForBulletin.id === 'specimen-student' ? (classStudents[0] || null) : activeStudentForBulletin);
              setInsertGradesTargetSubject(null);
              setIsInsertGradesModalOpen(true);
            }}
            className="w-full md:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-700 hover:to-indigo-800 text-white font-black text-xs shadow-lg shadow-emerald-700/25 flex items-center justify-center space-x-2 transition-all shrink-0 cursor-pointer hover:scale-105 active:scale-95"
            title="Saisir ou corriger les notes d'évaluation (interrogations, devoirs, compositions) directement dans le bulletin"
          >
            <Edit3 className="h-4 w-4 text-emerald-200" />
            <span>📝 Saisir / Insérer les Notes</span>
          </button>

          <button
            onClick={handleDownloadClassPdf}
            className="w-full md:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white font-black text-xs shadow-lg shadow-blue-700/25 flex items-center justify-center space-x-2 transition-all shrink-0 cursor-pointer hover:scale-105 active:scale-95"
            title="Télécharger tous les bulletins de la classe en un document PDF complet"
          >
            <Download className="h-4 w-4 text-amber-300" />
            <span>📥 Télécharger Bulletins Classe (PDF)</span>
          </button>

          <button
            onClick={() => setIsLogoModalOpen(true)}
            className="w-full md:w-auto px-3.5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs border border-indigo-200 dark:border-indigo-800 shadow-sm flex items-center justify-center space-x-2 transition-all shrink-0 cursor-pointer"
            title="Importer ou changer le logo officiel qui figurera automatiquement sur tous les bulletins et épreuves Word"
          >
            <ImageIcon className="h-4 w-4 text-indigo-500" />
            <span>Logo École</span>
            {(currentSchool?.logoUrl || settings.logoUrl) && (
              <img
                src={currentSchool?.logoUrl || settings.logoUrl}
                alt="Logo"
                className="w-4 h-4 object-contain rounded-md bg-white p-0.5 ml-0.5"
              />
            )}
          </button>

          <button
            onClick={() => setShowAiWhatsAppModal(true)}
            className="w-full md:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-500 hover:to-indigo-600 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all shrink-0 cursor-pointer hover:scale-105"
          >
            <Bot className="h-4 w-4 text-amber-300 animate-pulse" />
            <span>📲 IA WhatsApp Notes aux Parents</span>
          </button>

          <button
            onClick={() => setIsScanTemplateModalOpen(true)}
            className="w-full md:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs shadow-lg shadow-purple-600/20 flex items-center justify-center space-x-2 transition-all shrink-0 cursor-pointer"
          >
            <Scan className="h-4 w-4" />
            <span>📸 Scanner / Modèle de Bulletin</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEW NAVIGATION TABS */}
      <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-2xl w-full max-w-xl text-xs font-black">
        <button
          onClick={() => setMainTab('GENERATOR')}
          className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            mainTab === 'GENERATOR'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>🏆 Classement & Direct</span>
        </button>

        <button
          onClick={() => setMainTab('ARCHIVES')}
          className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer relative ${
            mainTab === 'ARCHIVES'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderArchive className="h-4 w-4" />
          <span>🗄️ Archives Bulletins ({archivedReportCards.length})</span>
        </button>
      </div>

      {bulkArchiveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <span>{bulkArchiveMessage}</span>
          </div>
          <button
            onClick={() => setMainTab('ARCHIVES')}
            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] uppercase tracking-wider font-black hover:bg-emerald-700 transition-all cursor-pointer"
          >
            Consulter les Archives
          </button>
        </div>
      )}

      {downloadNotice && (
        <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/40 text-blue-900 dark:text-blue-200 font-black text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 animate-bounce" />
            <span>{downloadNotice}</span>
          </div>
          <button
            onClick={() => setDownloadNotice(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* TAB 1: GENERATOR & CLASS RANKING */}
      {mainTab === 'GENERATOR' && (
        <>
          {/* Class, Trimester & View Mode Selectors */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Sélectionner une Classe *
          </label>
          <select
            value={selectedClassId}
            onChange={e => {
              const newClassId = e.target.value;
              setSelectedClassId(newClassId);
              const clsStudents = students.filter(s => s.classId === newClassId);
              if (clsStudents.length > 0) {
                setPreviewStudentId(clsStudents[0].id);
              } else {
                setPreviewStudentId('SPECIMEN');
              }
              // Afficher immédiatement la liste de la classe comme demandé
              setViewMode('RANKING_TABLE');
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            {classes.map(c => {
              const count = students.filter(s => s.classId === c.id).length;
              return (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.level || 'Général'}) — {count} élève{count > 1 ? 's' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Trimestre d'Évaluation *
          </label>
          <select
            value={selectedTrimester}
            onChange={e => setSelectedTrimester(parseInt(e.target.value) as 1 | 2 | 3)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value={1}>1er Trimestre</option>
            <option value={2}>2ème Trimestre</option>
            <option value={3}>3ème Trimestre</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Format d'Affichage
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('RANKING_TABLE')}
              className={`py-1.5 px-2 rounded-lg font-extrabold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                viewMode === 'RANKING_TABLE'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListOrdered className="h-3.5 w-3.5" />
              <span className="truncate">📋 Liste Classe</span>
            </button>

            <button
              onClick={() => setViewMode('BULLETIN_PREVIEW')}
              className={`py-1.5 px-2 rounded-lg font-extrabold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                viewMode === 'BULLETIN_PREVIEW'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="truncate">📄 Format Bulletin</span>
            </button>

            <button
              onClick={() => setViewMode('CARDS')}
              className={`py-1.5 px-2 rounded-lg font-extrabold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span className="truncate">👥 Cartes Élèves</span>
            </button>
          </div>
        </div>
      </div>

      {/* Class Statistics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">Effectif Évalué</span>
            <strong className="text-base font-black text-slate-900 dark:text-white">
              {classRankSummary.totalStudents} élèves
            </strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">Moyenne Classe</span>
            <strong className="text-base font-black text-blue-700 dark:text-blue-400">
              {classRankSummary.classAverage.toFixed(2)} / 20
            </strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">Plus Forte Moyenne</span>
            <strong className="text-base font-black text-emerald-700 dark:text-emerald-400">
              {classRankSummary.highestAverage.toFixed(2)} / 20
            </strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">Taux de Réussite</span>
            <strong className="text-base font-black text-purple-700 dark:text-purple-400">
              {classRankSummary.passRate.toFixed(1)}% ({classRankSummary.passedCount} admis)
            </strong>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: FORMAT DU BULLETIN DRESSÉ (Portant toutes les matières de l'école, le filigrane et le logo en entête) */}
      {viewMode === 'BULLETIN_PREVIEW' && (
        <div className="space-y-4">
          
          {/* Barre d'outils et sélecteur de l'élève affiché */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg print:hidden">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setViewMode('RANKING_TABLE')}
                className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-black text-xs flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer mr-1"
                title="Revenir à la liste des élèves de la classe"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Liste de la Classe ({classStudents.length})</span>
              </button>

              <span className="text-xs font-black uppercase text-purple-300 flex items-center space-x-1.5">
                <FileCheck className="h-4 w-4 text-purple-400" />
                <span>Format du Bulletin Dressé :</span>
              </span>

              {/* Sélecteur de l'élève ou spécimen vierge avec boutons Précédent / Suivant */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const idx = classRankSummary.rankings.findIndex(r => r.student.id === previewStudentId);
                    if (idx > 0) {
                      setPreviewStudentId(classRankSummary.rankings[idx - 1].student.id);
                    }
                  }}
                  disabled={classRankSummary.rankings.findIndex(r => r.student.id === previewStudentId) <= 0}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Élève précédent"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>

                <select
                  value={previewStudentId}
                  onChange={e => setPreviewStudentId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-extrabold text-xs focus:ring-2 focus:ring-purple-500 cursor-pointer max-w-[260px] sm:max-w-xs truncate"
                >
                  {classRankSummary.rankings.map(r => (
                    <option key={r.student.id} value={r.student.id}>
                      {r.numericRank === 1 ? '🥇' : r.numericRank === 2 ? '🥈' : r.numericRank === 3 ? '🥉' : '👤'} {r.student.lastName.toUpperCase()} {r.student.firstName} (Mat: {r.student.registrationNumber}) — Rang {r.rank}
                    </option>
                  ))}
                  <option value="SPECIMEN">
                    📄 Spécimen Vierge (Modèle officiel sans nom)
                  </option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const idx = classRankSummary.rankings.findIndex(r => r.student.id === previewStudentId);
                    if (idx !== -1 && idx < classRankSummary.rankings.length - 1) {
                      setPreviewStudentId(classRankSummary.rankings[idx + 1].student.id);
                    }
                  }}
                  disabled={classRankSummary.rankings.findIndex(r => r.student.id === previewStudentId) >= classRankSummary.rankings.length - 1 || classRankSummary.rankings.findIndex(r => r.student.id === previewStudentId) === -1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Élève suivant"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSignatureOnDoc(!showSignatureOnDoc)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  showSignatureOnDoc
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
                title="Afficher ou masquer la signature et le cachet officiel"
              >
                {showSignatureOnDoc ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span>{showSignatureOnDoc ? 'Cachet Actif' : 'Cachet Masqué'}</span>
              </button>
            </div>

            {/* Actions rapides sur le bulletin dressé */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setInsertGradesStudent(activeStudentForBulletin.id === 'specimen-student' ? (classStudents[0] || null) : activeStudentForBulletin);
                  setInsertGradesTargetSubject(null);
                  setIsInsertGradesModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Saisir ou corriger directement les notes de cet élève"
              >
                <Edit3 className="h-3.5 w-3.5 text-emerald-200" />
                <span>📝 Saisir / Modifier les Notes</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadSinglePdf(currentBulletinRankData)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Télécharger le bulletin officiel de cet élève en document PDF"
              >
                <Download className="h-3.5 w-3.5" />
                <span>📥 Télécharger le Bulletin (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSubjectManagerModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                title="Modifier les coefficients, intitulés ou supprimer des matières du bulletin"
              >
                <Pencil className="h-3.5 w-3.5 text-amber-300" />
                <span>⚙️ Gérer les Matières</span>
              </button>

              <button
                type="button"
                onClick={() => setSendParentModalData({
                  isOpen: true,
                  student: activeStudentForBulletin.id === 'specimen-student' ? undefined : activeStudentForBulletin,
                  studentAverage: currentBulletinRankData.overallAverage,
                  studentRank: currentBulletinRankData.rank,
                  studentMention: currentBulletinRankData.mention
                })}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow transition-all cursor-pointer"
                title="Envoyer le lien du bulletin au parent par WhatsApp ou SMS"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>📲 WhatsApp Parent</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudentForBulletin(activeStudentForBulletin)}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                title="Imprimer ou exporter en PDF ce bulletin officiel"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Imprimer / PDF</span>
              </button>
            </div>
          </div>

          {/* Feedback message for subject actions */}
          {subjectNotice && (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{subjectNotice}</span>
            </div>
          )}

          {/* DOCUMENT BULLETIN OFFICIEL DRESSÉ (Norme Bénin) */}
          <div 
            className="p-4 sm:p-6 bg-white text-slate-900 rounded-3xl border border-slate-300 shadow-xl relative overflow-hidden text-xs leading-normal print:p-0 print:border-none print:shadow-none" 
            id="bulletin-document-view"
          >
            {/* Filigrane d'arrière-plan officiel type Wexomin */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.035] overflow-hidden select-none z-0">
              <div className="grid grid-cols-5 gap-6 p-2 text-[9px] font-black text-slate-800 uppercase tracking-widest rotate-[-18deg] select-none scale-110">
                {Array.from({ length: 120 }).map((_, i) => (
                  <span key={i}>WEXOMIN</span>
                ))}
              </div>
            </div>

            {/* Contenu du Bulletin au premier plan */}
            <div className="relative z-10">
              
              {/* 1. EN-TÊTE OFFICIEL BÉNIN */}
              <div className="grid grid-cols-12 gap-2 items-start border-b border-slate-800 pb-2 mb-2">
                {/* Logo de l'établissement à gauche */}
                <div className="col-span-3 flex flex-col items-center justify-center text-center">
                  <div 
                    className="relative group cursor-pointer" 
                    onClick={() => setIsLogoModalOpen(true)}
                    title="Cliquer pour changer ou importer le logo officiel de l'école"
                  >
                    <img
                      src={currentSchool?.logoUrl || settings.logoUrl || '/icon.svg'}
                      alt="Logo"
                      className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-full border-2 border-slate-800 p-1 bg-white shadow-xs"
                    />
                    <span className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity print:hidden shadow-xs">
                      <ImageIcon className="h-2 w-2" />
                    </span>
                  </div>
                  <p className="text-[8.5px] font-bold text-slate-700 uppercase tracking-tight mt-1 max-w-[130px] leading-tight">
                    {previewSchoolMotto}
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
                    {previewSchoolNameDisplay}
                  </h1>
                  <p className="text-[8.5px] font-bold text-slate-700">
                    {previewSchoolArrêté}
                  </p>
                  <p className="text-[9.5px] font-extrabold text-slate-900">
                    {previewSchoolCity}
                  </p>
                  <p className="text-[8.5px] font-semibold text-slate-700">
                    Tél: {previewSchoolPhone}
                  </p>
                </div>
              </div>

              {/* 2. BANDEAU TITRE DU BULLETIN */}
              <div className="text-center my-1.5 space-y-0.5">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 underline underline-offset-2 decoration-1">
                  BULLETIN DE NOTES
                </h2>
                <div className="flex items-center justify-center space-x-6 text-[10.5px] font-bold text-slate-900">
                  <span>ANNÉE SCOLAIRE : <strong className="font-black">{settings.academicYear || '2023-2024'}</strong></span>
                  <span>CLASSE : <strong className="font-black">{selectedClass?.name || '6ème'}</strong></span>
                  <span>
                    <strong className="text-xs font-black underline mr-1">{selectedTrimester}</strong> 
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
                        <td className="font-black uppercase text-slate-950 text-xs py-0.5">{activeStudentForBulletin.lastName}</td>
                      </tr>
                      <tr>
                        <td className="w-24 font-bold text-slate-700 py-0.5">Prénoms :</td>
                        <td className="font-extrabold text-slate-900 py-0.5">{activeStudentForBulletin.firstName}</td>
                      </tr>
                      <tr>
                        <td className="w-24 font-bold text-slate-700 py-0.5">N° Matricule :</td>
                        <td className="font-mono font-black text-slate-950 py-0.5">{activeStudentForBulletin.registrationNumber || '2361077'}</td>
                      </tr>
                      <tr>
                        <td className="w-24 font-bold text-slate-700 py-0.5">Sexe :</td>
                        <td className="font-black text-slate-950 py-0.5">{activeStudentForBulletin.gender || 'M'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Colonne droite (Nouveau / Redoublant & Effectif) */}
                <div className="col-span-4 border-l border-slate-400 pl-3 flex flex-col justify-center space-y-1.5 text-[10.5px] font-extrabold text-slate-900">
                  <div className="flex items-center space-x-2">
                    <span className="w-24">NOUVEAU</span>
                    <span className="w-4 h-4 border border-slate-900 flex items-center justify-center font-black text-[11px] bg-white">
                      {!isPreviewRedoublant ? '✓' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-24">REDOUBLANT</span>
                    <span className="w-4 h-4 border border-slate-900 flex items-center justify-center font-black text-[11px] bg-white">
                      {isPreviewRedoublant ? '✓' : ''}
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
                      <th className="p-1 border border-slate-700 w-11">DEV 1</th>
                      <th className="p-1 border border-slate-700 w-11">DEV 2</th>
                      <th className="p-1 border border-slate-700 w-12">COMPO</th>
                      <th className="p-1 border border-slate-700 w-14 font-black">MOY/20</th>
                      <th className="p-1 border border-slate-700 w-14 font-black bg-slate-300">Moy. Coef</th>
                      <th className="p-1 border border-slate-700 w-11">RANG</th>
                      <th className="p-1 border border-slate-700 text-left">APPRECIATIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewSubjectGroups.length > 0 ? (
                      previewSubjectGroups.map((group, gIdx) => (
                        <React.Fragment key={gIdx}>
                          {group.items.map((item, idx) => {
                            const interroAvgVal = item.interroAverage !== undefined ? item.interroAverage.toFixed(2) : (item.interro1 !== undefined ? item.interro1.toFixed(2) : '-');
                            const dev1Val = item.devoirMark !== undefined ? item.devoirMark.toFixed(2) : '-';
                            const dev2Val = item.devoir2Mark !== undefined ? item.devoir2Mark.toFixed(2) : '-';
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
                                          setInsertGradesStudent(activeStudentForBulletin.id === 'specimen-student' ? (classStudents[0] || null) : activeStudentForBulletin);
                                          setInsertGradesTargetSubject(item.subject);
                                          setIsInsertGradesModalOpen(true);
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
                                  {dev1Val}
                                </td>
                                <td className="p-1 border border-slate-700 text-center font-semibold text-slate-800">
                                  {dev2Val}
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
                            <td colSpan={6} className="p-1 border border-slate-700 bg-slate-50/50"></td>
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
                        <td colSpan={12} className="p-4 text-center text-slate-500 italic">
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
                        {currentBulletinRankData.totalCoefficients}
                      </td>
                      <td colSpan={6} className="p-1.5 border border-slate-700 text-right uppercase tracking-wider pr-3">
                        TOTAL GENERAL :
                      </td>
                      <td className="p-1.5 border border-slate-700 text-center font-black text-xs" colSpan={2}>
                        {currentBulletinRankData.totalWeightedPoints.toFixed(2)}
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
                  <span className="font-black text-slate-950 text-xs sm:text-sm">{currentBulletinRankData.overallAverage.toFixed(2)}</span>
                </div>
                <div className="p-1 leading-tight">
                  <span className="block text-slate-700 font-extrabold text-[9px] uppercase">RANG TRIM</span>
                  <span className="font-black text-slate-950 text-xs sm:text-sm">{currentBulletinRankData.rank}</span>
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
                        <td className="border border-slate-700 text-center font-black w-8 bg-slate-50">{previewCouncilDecision.felicitations ? 'X' : ''}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 px-2 py-0.5 font-bold text-slate-900">ENCOURAGEMENTS</td>
                        <td className="border border-slate-700 text-center font-black w-8 bg-slate-50">{previewCouncilDecision.encouragements ? 'X' : ''}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 px-2 py-0.5 font-bold text-slate-900">TABLEAU D'HONNEUR</td>
                        <td className="border border-slate-700 text-center font-black w-8 bg-slate-50">{previewCouncilDecision.tableauHonneur ? 'X' : ''}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 px-2 py-0.5 font-bold text-slate-900">AVERTISSEMENT</td>
                        <td className="border border-slate-700 text-center font-black w-8 bg-slate-50">{previewCouncilDecision.avertissement ? 'X' : ''}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 px-2 py-0.5 font-bold text-slate-900">BLÂME</td>
                        <td className="border border-slate-700 text-center font-black w-8 bg-slate-50">{previewCouncilDecision.blame ? 'X' : ''}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 px-2 py-0.5 font-bold text-slate-900">RENVOI</td>
                        <td className="border border-slate-700 text-center font-black w-8 bg-slate-50">{previewCouncilDecision.renvoi ? 'X' : ''}</td>
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
                      <strong className="font-black text-slate-950">{previewCouncilDecision.appreciationDirecteur}</strong>
                    </div>
                    <div className="flex items-center">
                      <span className="text-slate-900 font-black w-20 uppercase">DÉCISION :</span>
                      <strong className="font-black uppercase text-blue-950 text-xs">{previewCouncilDecision.decision}</strong>
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
                      {previewSchoolCity.toUpperCase()}, le {new Date().toLocaleDateString('fr-FR')}
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
                      {previewDirectorName}
                    </p>
                  </div>
                </div>

              </div>

              {/* 7. BANDEAU HISTORIQUE DES TRIMESTRES & DISCIPLINE (ABSENCES / RETARDS) */}
              <div className="border border-slate-800 p-1.5 text-[10px] sm:text-[10.5px] font-bold text-slate-900 bg-slate-50 space-y-1">
                <div className="flex flex-wrap items-center justify-between px-1">
                  <span>Moy 1er Tri : <strong className="font-black text-slate-950">{previewMoyTri1 > 0 ? previewMoyTri1.toFixed(2) : '-'}</strong></span>
                  <span>Moy 2e Tri : <strong className="font-black text-slate-950">{previewMoyTri2 > 0 ? previewMoyTri2.toFixed(2) : '-'}</strong></span>
                  <span>Moy Annuelle : <strong className="font-black text-blue-950 text-[11px]">{previewMoyAnnuelle > 0 ? previewMoyAnnuelle.toFixed(2) : '-'}</strong></span>
                  <span>Rang : <strong className="font-black text-purple-950 text-[11px]">{currentBulletinRankData.rank}</strong></span>
                </div>
                <div className="flex items-center justify-between px-1 border-t border-slate-300 pt-1 text-[10px] text-slate-700">
                  <span>Nbre d'absences : <strong className="text-slate-950 font-black">{previewAbsences}</strong></span>
                  <span>Nbre de retards : <strong className="text-slate-950 font-black">{previewDelays}</strong></span>
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

            </div>
          </div>

        </div>
      )}

      {/* VIEW MODE 2: OFFICIAL CLASS RANKING TABLE (Du 1er au Dernier) */}
      {viewMode === 'RANKING_TABLE' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/80">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span>Liste des Élèves — {selectedClass?.name} ({classRankSummary.totalStudents} élèves • Trimestre {selectedTrimester})</span>
                </h3>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300 font-extrabold mt-0.5">
                👉 Cliquez sur n'importe quel élève de la classe pour faire figurer et imprimer son bulletin officiel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setInsertGradesStudent(classStudents[0] || null);
                  setInsertGradesTargetSubject(null);
                  setIsInsertGradesModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Saisir ou corriger les notes de la classe entière"
              >
                <Edit3 className="h-4 w-4 text-emerald-200" />
                <span>📝 Saisir les Notes de la Classe</span>
              </button>

              <button
                onClick={handleDownloadClassPdf}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-blue-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Télécharger tous les bulletins de la classe en un document PDF complet"
              >
                <Download className="h-4 w-4" />
                <span>📥 Télécharger Tous les Bulletins (PDF)</span>
              </button>

              <button
                onClick={() => setSendParentModalData({
                  isOpen: true,
                  student: undefined // triggers class bulk mode
                })}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                title="Envoyer les liens des bulletins par WhatsApp ou SMS à tous les parents"
              >
                <MessageCircle className="h-4 w-4" />
                <span>📲 Envoi Groupé Bulletins (WhatsApp / SMS)</span>
              </button>

              <button
                onClick={handleBulkArchiveClass}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow transition-all cursor-pointer"
              >
                <Archive className="h-4 w-4" />
                <span>📥 Archiver Tout le Trimestre</span>
              </button>

              <button
                onClick={handlePrintClassRanking}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 shadow cursor-pointer"
              >
                <Printer className="h-4 w-4 text-purple-400" />
                <span>Imprimer Procès-Verbal</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5 text-center w-20">Rang</th>
                  <th className="p-3.5">Élève & Matricule</th>
                  <th className="p-3.5 text-center">Sexe</th>
                  <th className="p-3.5 text-center">Moyenne Générale</th>
                  <th className="p-3.5 text-center">Points Coeff.</th>
                  <th className="p-3.5 text-center">Décision / Mention</th>
                  <th className="p-3.5 text-right pr-6">Affichage & Actions Bulletins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {classRankSummary.rankings.length > 0 ? (
                  classRankSummary.rankings.map((rankItem) => {
                    const isTop3 = rankItem.numericRank <= 3;
                    const trophyBadge = rankItem.numericRank === 1 ? '🥇' : rankItem.numericRank === 2 ? '🥈' : rankItem.numericRank === 3 ? '🥉' : null;

                    return (
                      <tr
                        key={rankItem.student.id}
                        onClick={() => {
                          setPreviewStudentId(rankItem.student.id);
                          setViewMode('BULLETIN_PREVIEW');
                        }}
                        className={`hover:bg-purple-50/80 dark:hover:bg-purple-950/40 cursor-pointer transition-all ${
                          isTop3 ? 'bg-amber-500/5' : ''
                        } ${previewStudentId === rankItem.student.id ? 'ring-2 ring-purple-500/40 bg-purple-50/40 dark:bg-purple-950/20' : ''}`}
                        title={`Cliquer pour faire figurer le bulletin officiel de ${rankItem.student.lastName} ${rankItem.student.firstName}`}
                      >
                        {/* Rank Badge */}
                        <td className="p-3.5 text-center font-black">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-black shadow-sm ${
                            rankItem.numericRank === 1
                              ? 'bg-amber-500 text-white ring-2 ring-amber-400'
                              : rankItem.numericRank === 2
                              ? 'bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-white'
                              : rankItem.numericRank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {trophyBadge && <span>{trophyBadge}</span>}
                            <span>{rankItem.rank}</span>
                          </span>
                        </td>

                        {/* Student Info */}
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            <img
                              src={rankItem.student.photoUrl}
                              alt={rankItem.student.firstName}
                              className="h-10 w-10 rounded-xl object-cover ring-2 ring-purple-500/20"
                            />
                            <div>
                              <p className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
                                <span>{rankItem.student.lastName} {rankItem.student.firstName}</span>
                              </p>
                              <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                {rankItem.student.registrationNumber}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Gender */}
                        <td className="p-3.5 text-center font-bold text-slate-600 dark:text-slate-400">
                          {rankItem.student.gender}
                        </td>

                        {/* Average */}
                        <td className="p-3.5 text-center">
                          <span className="text-base font-black text-purple-900 dark:text-purple-300">
                            {rankItem.overallAverage.toFixed(2)} / 20
                          </span>
                        </td>

                        {/* Total Points */}
                        <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                          <span>{rankItem.totalWeightedPoints.toFixed(2)} pts</span>
                        </td>

                        {/* Mention / Status */}
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            rankItem.overallAverage >= 14
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : rankItem.overallAverage >= 10
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          }`}>
                            {rankItem.mention}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="p-3.5 text-right pr-6 space-x-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setPreviewStudentId(rankItem.student.id);
                              setViewMode('BULLETIN_PREVIEW');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs inline-flex items-center space-x-1 shadow-md shadow-purple-600/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title={`Faire figurer le bulletin officiel de ${rankItem.student.firstName}`}
                          >
                            <FileText className="h-3.5 w-3.5 text-purple-200" />
                            <span>📄 Bulletin</span>
                          </button>

                          <button
                            onClick={() => {
                              setInsertGradesStudent(rankItem.student);
                              setInsertGradesTargetSubject(null);
                              setIsInsertGradesModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center space-x-1 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title={`Saisir ou modifier les notes de ${rankItem.student.firstName}`}
                          >
                            <Edit3 className="h-3.5 w-3.5 text-emerald-200" />
                            <span>📝 Notes</span>
                          </button>

                          <button
                            onClick={() => handleDownloadSinglePdf(rankItem)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs inline-flex items-center space-x-1 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title={`Télécharger le bulletin officiel de ${rankItem.student.firstName} en PDF`}
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>📥 PDF</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStudentForBulletin(rankItem.student);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs inline-flex items-center space-x-1 transition-all cursor-pointer"
                            title="Imprimer ou exporter en PDF ce bulletin"
                          >
                            <Printer className="h-3.5 w-3.5 text-purple-600" />
                            <span>Imprimer</span>
                          </button>

                          <button
                            onClick={() => setSendParentModalData({
                              isOpen: true,
                              student: rankItem.student,
                              studentAverage: rankItem.overallAverage,
                              studentRank: rankItem.rank,
                              studentMention: rankItem.mention
                            })}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center space-x-1 shadow transition-all cursor-pointer"
                            title="Envoyer le lien du bulletin au parent par WhatsApp ou SMS"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>📲 WhatsApp</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                      Aucun élève trouvé dans cette classe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* VIEW MODE 2: STUDENT CARDS */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classRankSummary.rankings.map(rankItem => (
            <div
              key={rankItem.student.id}
              onClick={() => {
                setSelectedStudentForBulletin(rankItem.student);
                setPreviewStudentId(rankItem.student.id);
              }}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={rankItem.student.photoUrl}
                    alt={rankItem.student.firstName}
                    className="h-12 w-12 rounded-xl object-cover ring-2 ring-purple-500/20"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {rankItem.student.lastName} {rankItem.student.firstName}
                    </h4>
                    <p className="text-[10px] font-bold text-purple-600">{rankItem.student.registrationNumber}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-black text-xs">
                    RANG: {rankItem.rank}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Moyenne Trimestre {selectedTrimester}</p>
                  <p className="text-xl font-black text-purple-700 dark:text-purple-400">
                    {rankItem.overallAverage.toFixed(2)} / 20
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    rankItem.overallAverage >= 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {rankItem.mention}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setSendParentModalData({
                    isOpen: true,
                    student: rankItem.student,
                    studentAverage: rankItem.overallAverage,
                    studentRank: rankItem.rank,
                    studentMention: rankItem.mention
                  })}
                  className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow transition-all cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>📲 WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedStudentForBulletin(rankItem.student);
                    setPreviewStudentId(rankItem.student.id);
                  }}
                  className="py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>📄 Bulletin</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {/* TAB 2: PERMANENT ARCHIVES VIEW */}
      {mainTab === 'ARCHIVES' && (
        <div className="space-y-6">
          
          {/* Permanent Conservation Info Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 text-white space-y-2 shadow-xl">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Conservation Pérénne à Vie des Bulletins Impimés
              </h3>
            </div>
            <p className="text-xs text-purple-200/90 leading-relaxed">
              Même après des années et après l'impression initiale, la plateforme conserve automatiquement une copie numérique intégrale de chaque bulletin généré. Vous pouvez à tout moment rechercher, consulter et ré-imprimer le bulletin de n'importe quel élève, quelle que soit son année académique passée.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            
            {/* Search */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Rechercher un Élève / Matricule
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={e => setArchiveSearch(e.target.value)}
                  placeholder="Nom, prénom, matricule..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Année Scolaire Archivée
              </label>
              <select
                value={archiveYearFilter}
                onChange={e => setArchiveYearFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">📅 Toutes les Années</option>
                {uniqueYears.map(yr => (
                  <option key={yr} value={yr}>Année Scolaire {yr}</option>
                ))}
              </select>
            </div>

            {/* Trimester */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Trimestre
              </label>
              <select
                value={archiveTrimesterFilter}
                onChange={e => setArchiveTrimesterFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">Tous les Trimestres</option>
                <option value="1">1er Trimestre</option>
                <option value="2">2ème Trimestre</option>
                <option value="3">3ème Trimestre</option>
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Classe
              </label>
              <select
                value={archiveClassFilter}
                onChange={e => setArchiveClassFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">Toutes les Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Archived Bulletins Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                <FolderArchive className="h-4 w-4 text-purple-600" />
                <span>Registre des Bulletins Archivés ({filteredArchives.length} trouvés)</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5">Élève & Matricule</th>
                    <th className="p-3.5">Classe & Année</th>
                    <th className="p-3.5 text-center">Trimestre</th>
                    <th className="p-3.5 text-center">Moyenne & Rang</th>
                    <th className="p-3.5 text-center">Mention</th>
                    <th className="p-3.5 text-center">Date d'Archivage</th>
                    <th className="p-3.5 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredArchives.length > 0 ? (
                    filteredArchives.map((arch) => {
                      // Find student object to trigger modal
                      const targetStudent = students.find(s => s.id === arch.studentId) || {
                        id: arch.studentId,
                        firstName: arch.studentName.split(' ').slice(1).join(' ') || arch.studentName,
                        lastName: arch.studentName.split(' ')[0] || '',
                        registrationNumber: arch.registrationNumber,
                        classId: arch.classId,
                        photoUrl: arch.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                        gender: 'M',
                        dateOfBirth: '2008-01-01',
                        parentPhone: '',
                        parentName: '',
                        status: 'ACTIF'
                      } as Student;

                      return (
                        <tr key={arch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center space-x-3">
                              <img
                                src={arch.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                                alt={arch.studentName}
                                className="h-9 w-9 rounded-xl object-cover ring-2 ring-purple-500/20 shrink-0"
                              />
                              <div>
                                <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {arch.studentName}
                                </p>
                                <p className="text-[10px] font-mono text-purple-600 font-bold">
                                  {arch.registrationNumber}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <p className="font-extrabold text-slate-900 dark:text-white">{arch.className}</p>
                            <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-black">
                              Année {arch.academicYear}
                            </span>
                          </td>

                          <td className="p-3.5 text-center font-black">
                            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                              Trimestre {arch.trimester}
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            <p className="text-sm font-black text-purple-900 dark:text-purple-300">
                              {arch.overallAverage.toFixed(2)} / 20
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold">
                              Rang : {arch.rank} sur {arch.totalStudentsInClass}
                            </p>
                          </td>

                          <td className="p-3.5 text-center">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {arch.mention}
                            </span>
                          </td>

                          <td className="p-3.5 text-center text-[10px] text-slate-500 font-mono">
                            {arch.printedAt ? new Date(arch.printedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Archive Pérénne'}
                          </td>

                          <td className="p-3.5 text-right pr-6 space-x-2">
                            <button
                              onClick={() => setSelectedStudentForBulletin(targetStudent)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs inline-flex items-center space-x-1.5 shadow transition-all cursor-pointer"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Re-Imprimer / PDF</span>
                            </button>

                            <button
                              onClick={() => deleteArchivedReportCard(arch.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors inline-block cursor-pointer"
                              title="Supprimer cette archive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                        <FolderArchive className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto" />
                        <p className="font-bold text-sm">Aucun bulletin archivé trouvé selon vos critères.</p>
                        <p className="text-xs text-slate-400">Imprimez ou cliquez sur "Archiver Tout le Trimestre" pour conserver les bulletins à vie.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: Print Individual Bulletin */}
      {selectedStudentForBulletin && (
        <PrintBulletinModal
          isOpen={!!selectedStudentForBulletin}
          onClose={() => setSelectedStudentForBulletin(null)}
          student={selectedStudentForBulletin}
          classObj={classes.find(c => c.id === selectedStudentForBulletin.classId) || classes[0]}
          trimester={selectedTrimester}
        />
      )}

      {/* MODAL 2: Scan & Customize Bulletin Template */}
      {isScanTemplateModalOpen && (
        <ScanBulletinTemplateModal
          isOpen={isScanTemplateModalOpen}
          onClose={() => setIsScanTemplateModalOpen(false)}
        />
      )}

      {/* MODAL 3: Send Bulletin Link to Parent (WhatsApp / SMS) */}
      {sendParentModalData.isOpen && (
        <SendBulletinParentModal
          isOpen={sendParentModalData.isOpen}
          onClose={() => setSendParentModalData({ isOpen: false })}
          student={sendParentModalData.student}
          classObj={selectedClass}
          trimester={selectedTrimester}
          studentAverage={sendParentModalData.studentAverage}
          studentRank={sendParentModalData.studentRank}
          totalStudentsInClass={classRankSummary.totalStudents}
          studentMention={sendParentModalData.studentMention}
        />
      )}

      {/* MODAL 4: AI Grades & Bulletin WhatsApp Dispatcher */}
      <AIGradesBulletinWhatsAppModal
        isOpen={showAiWhatsAppModal}
        onClose={() => setShowAiWhatsAppModal(false)}
        defaultClassId={selectedClassId}
      />

      {/* MODAL 5: School Logo Import Modal */}
      <SchoolLogoImportModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        initialContext="BULLETIN"
      />

      {/* MODAL 6: GESTION & MODIFICATION / SUPPRESSION DES MATIÈRES DU BULLETIN */}
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
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Gestion des Matières du Bulletin ({definedClassSubjects.length})</h3>
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

            {/* Content Area */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              
              {subjectNotice && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 rounded-xl font-bold flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{subjectNotice}</span>
                </div>
              )}

              {/* Formulaire d'ajout rapide d'une matière */}
              <form onSubmit={handleAddNewSubjectFromBulletin} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] block">
                  + Ajouter une nouvelle matière au bulletin
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nom de la matière (ex: Philosophie, Informatique...)"
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-extrabold focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="15"
                      required
                      placeholder="Coeff"
                      value={newSubjectCoeff}
                      onChange={e => setNewSubjectCoeff(e.target.value)}
                      className="w-20 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-extrabold text-center focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      title="Coefficient"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </form>

              {/* Liste des matières configurées */}
              <div>
                <span className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] block mb-2">
                  Matières figurant actuellement sur le bulletin dressé :
                </span>
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {definedClassSubjects.map(sbj => (
                    <div 
                      key={sbj.id} 
                      className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {sbj.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold">
                          Sigle : {sbj.code} • Niveau : {sbj.level || 'Secondaire'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
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
                          onClick={() => handleDeleteSubjectFromBulletin(sbj)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                          title="Supprimer cette matière du bulletin"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
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

      {/* MODAL MODIFICATION SPÉCIFIQUE D'UNE MATIÈRE DU BULLETIN */}
      {editingSubject && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingSubject(null);
          }}
        >
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">Modifier la Matière</h4>
                  <p className="text-[11px] text-slate-500">Mettre à jour l'intitulé ou le coefficient officiel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubject} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                  Intitulé officiel de la matière *
                </label>
                <input
                  type="text"
                  required
                  value={editSubjectName}
                  onChange={e => setEditSubjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  placeholder="Ex: Mathématiques, SVT..."
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                  Coefficient sur le bulletin * (1 à 15)
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  required
                  value={editSubjectCoeff}
                  onChange={e => setEditSubjectCoeff(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: Saisie et insertion directe des notes du bulletin */}
      {isInsertGradesModalOpen && (
        <InsertBulletinGradesModal
          isOpen={isInsertGradesModalOpen}
          onClose={() => {
            setIsInsertGradesModalOpen(false);
            setInsertGradesTargetSubject(null);
          }}
          student={insertGradesStudent || (activeStudentForBulletin.id === 'specimen-student' ? classStudents[0] : activeStudentForBulletin)}
          classStudents={classStudents}
          schoolClass={selectedClass}
          trimester={selectedTrimester}
          targetSubject={insertGradesTargetSubject}
          availableSubjects={definedClassSubjects}
          onSaved={() => {
            setDownloadNotice(`✅ Notes enregistrées et bulletin recalculé en direct !`);
            setTimeout(() => setDownloadNotice(null), 4000);
          }}
        />
      )}

    </div>
  );
};

