import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../lib/store';
import { Student, Subject } from '../types';
import { isPrimaryClass } from '../lib/schoolUtils';
import { PrintBulletinModal } from '../components/modals/PrintBulletinModal';
import { ScanBulletinTemplateModal } from '../components/modals/ScanBulletinTemplateModal';
import { SendBulletinParentModal } from '../components/modals/SendBulletinParentModal';
import { AIGradesBulletinWhatsAppModal } from '../components/modals/AIGradesBulletinWhatsAppModal';
import { SchoolLogoImportModal } from '../components/modals/SchoolLogoImportModal';
import { calculateClassRanks, defaultBulletinTemplate } from '../lib/gradingUtils';
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
  Image as ImageIcon,
  PenTool,
  Eye,
  EyeOff,
  Pencil,
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
    archivedReportCards,
    archiveReportCard,
    deleteArchivedReportCard
  } = useApp();

  // EXCLUSION STRICTE DES CLASSES DU PRIMAIRE : seules les classes secondaires (Collège & Lycée) sont retenues
  const secondaryClasses = useMemo(() => {
    return classes.filter(c => !isPrimaryClass(c));
  }, [classes]);

  const [mainTab, setMainTab] = useState<'GENERATOR' | 'ARCHIVES'>('GENERATOR');
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    const sec = classes.filter(c => !isPrimaryClass(c));
    return sec[0]?.id || classes[0]?.id || '';
  });

  // Maintenir la classe sélectionnée dans le périmètre secondaire
  useEffect(() => {
    if (secondaryClasses.length > 0 && !secondaryClasses.some(c => c.id === selectedClassId)) {
      setSelectedClassId(secondaryClasses[0].id);
    }
  }, [secondaryClasses, selectedClassId]);

  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(settings.currentTrimester);
  const [selectedStudentForBulletin, setSelectedStudentForBulletin] = useState<Student | null>(null);
  const [isScanTemplateModalOpen, setIsScanTemplateModalOpen] = useState(false);
  const [showAiWhatsAppModal, setShowAiWhatsAppModal] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  
  // Format d'affichage par défaut : BULLETIN_PREVIEW (Format officiel dressé)
  const [viewMode, setViewMode] = useState<'BULLETIN_PREVIEW' | 'RANKING_TABLE' | 'CARDS'>('BULLETIN_PREVIEW');
  // Sélectionner par défaut le premier élève réel de la classe
  const [previewStudentId, setPreviewStudentId] = useState<string>(() => {
    const sec = classes.filter(c => !isPrimaryClass(c));
    const firstCls = sec[0] || classes[0];
    const firstSts = students.filter(s => s.classId === firstCls?.id);
    return firstSts[0]?.id || 'SPECIMEN';
  });
  const [showSignatureOnDoc, setShowSignatureOnDoc] = useState(true);
  const [bulkArchiveMessage, setBulkArchiveMessage] = useState<string>('');

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

  const selectedClass = secondaryClasses.find(c => c.id === selectedClassId) || secondaryClasses[0] || classes[0];
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

  // Compute exact rankings for all students in selected secondary class from 1st to last
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

  // Toutes les matières du secondaire définies par l'établissement
  const definedSecondarySubjects = useMemo(() => {
    return subjects.filter(s =>
      !isPrimaryClass(s) &&
      s.level !== 'PRIMAIRE' &&
      s.level !== 'MATERNELLE' &&
      !s.id.startsWith('sbj-p-') &&
      !s.id.startsWith('sbj-mat-')
    );
  }, [subjects]);

  const currentBulletinRankData = useMemo(() => {
    const found = classRankSummary.rankings.find(r => r.student.id === activeStudentForBulletin.id);
    if (found) return found;

    return {
      student: activeStudentForBulletin,
      subjectResults: definedSecondarySubjects.map(s => ({
        subject: s,
        grades: [],
        average: 0,
        weightedAverage: 0,
        coefficient: s.coefficient || 1,
        appreciation: 'Non évalué'
      })),
      totalCoefficients: definedSecondarySubjects.reduce((sum, s) => sum + (s.coefficient || 1), 0) || 1,
      totalWeightedPoints: 0,
      overallAverage: 0,
      rank: activeStudentForBulletin.id === 'specimen-student' ? 'Modèle Vierge' : 'N/A',
      numericRank: 1,
      mention: activeStudentForBulletin.id === 'specimen-student' ? "SPÉCIMEN ÉCOLE" : "SANS DÉCISION",
      generalAppreciation: activeStudentForBulletin.id === 'specimen-student'
        ? "Format officiel du bulletin dressé pour la classe, portant l'ensemble des matières arrêtées par l'école."
        : "Aucune note enregistrée pour cet élève ce trimestre."
    };
  }, [classRankSummary, activeStudentForBulletin, definedSecondarySubjects]);

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

        {/* Action Buttons: Scan Bulletin Model & AI WhatsApp Dispatcher */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
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

      {/* TAB 1: GENERATOR & CLASS RANKING */}
      {mainTab === 'GENERATOR' && (
        <>
          {/* Class, Trimester & View Mode Selectors */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Sélectionner la Classe (Secondaire) *
          </label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            {secondaryClasses.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level}) — {c.studentCount || 0} élèves
              </option>
            ))}
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
              onClick={() => setViewMode('BULLETIN_PREVIEW')}
              className={`py-1.5 px-2 rounded-lg font-extrabold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                viewMode === 'BULLETIN_PREVIEW'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="truncate">📄 Bulletin Dressé</span>
            </button>

            <button
              onClick={() => setViewMode('RANKING_TABLE')}
              className={`py-1.5 px-2 rounded-lg font-extrabold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                viewMode === 'RANKING_TABLE'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListOrdered className="h-3.5 w-3.5" />
              <span className="truncate">🏆 Classement</span>
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
              <span className="truncate">👥 Cards Élèves</span>
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
              <span className="text-xs font-black uppercase text-purple-300 flex items-center space-x-1.5">
                <FileCheck className="h-4 w-4 text-purple-400" />
                <span>Format du Bulletin Dressé :</span>
              </span>

              {/* Sélecteur de l'élève ou spécimen vierge */}
              <div className="flex items-center space-x-1.5">
                <label className="text-[11px] text-slate-300 font-bold">Élève :</label>
                <select
                  value={previewStudentId}
                  onChange={e => setPreviewStudentId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-extrabold text-xs focus:ring-2 focus:ring-purple-500 cursor-pointer max-w-[280px] sm:max-w-md truncate"
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

          {/* DOCUMENT BULLETIN OFFICIEL DRESSÉ */}
          <div 
            className="p-8 sm:p-10 bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden print:p-0 print:border-none print:shadow-none" 
            id="bulletin-document-view"
          >
            {/* Filigrane (Watermark) officiel portant en filigrane le nom de l'école */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden select-none z-0">
              <div className="text-center transform -rotate-25 opacity-[0.05] font-black text-slate-900 uppercase text-4xl sm:text-6xl md:text-7xl tracking-widest leading-relaxed select-none">
                {(settings.schoolName && settings.schoolName !== 'GESTIONNAIRE SCOLAIRE') ? settings.schoolName : (currentSchool?.name || 'ÉTABLISSEMENT SCOLAIRE')}
              </div>
            </div>

            {/* Contenu du Bulletin au premier plan */}
            <div className="relative z-10 space-y-6">
              
              {/* Entête Officielle avec Logo de l'École */}
              <div className="flex items-start justify-between border-b-2 border-blue-900 pb-4">
                <div className="flex items-center space-x-4">
                  <div 
                    className="relative group cursor-pointer shrink-0" 
                    onClick={() => setIsLogoModalOpen(true)}
                    title="Cliquer pour changer ou importer le logo officiel de l'école"
                  >
                    <img
                      src={currentSchool?.logoUrl || settings.logoUrl || '/icon.svg'}
                      alt={currentSchool?.name || settings.schoolName}
                      className="h-20 w-20 object-contain rounded-xl ring-2 ring-blue-900/20 bg-white p-1"
                    />
                    <span className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity print:hidden shadow-md">
                      <ImageIcon className="h-2.5 w-2.5" />
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
                    {activeTemplate.headerTitle || `BULLETIN TRIMESTRE ${selectedTrimester}`}
                  </div>
                  <p className="text-xs font-bold text-slate-700">Année Académique : {settings.academicYear}</p>
                  <p className="text-[11px] font-extrabold text-indigo-800">
                    Trimestre {selectedTrimester} • Classe de {selectedClass?.name}
                  </p>
                  <div className="mt-1 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 inline-block text-left shadow-xs">
                    <span className="text-[10px] uppercase font-black text-blue-700 block">Élève Titulaire :</span>
                    <strong className="text-sm font-black text-blue-950 uppercase tracking-wide">
                      {activeStudentForBulletin.lastName.toUpperCase()} {activeStudentForBulletin.firstName}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Bandeau d'Identification de l'Élève & Rang - NOM DE L'ÉLÈVE BIEN VISIBLE */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                <div className="flex items-center space-x-3">
                  <img
                    src={activeStudentForBulletin.photoUrl}
                    alt={activeStudentForBulletin.firstName}
                    className="h-12 w-12 rounded-xl object-cover ring-2 ring-blue-900/30 shrink-0"
                  />
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[10px]">Nom & Prénoms de l'Élève</p>
                    <p className="font-black text-base text-blue-950 uppercase tracking-tight">
                      {activeStudentForBulletin.lastName.toUpperCase()} {activeStudentForBulletin.firstName}
                    </p>
                    <p className="text-slate-600 font-bold text-xs mt-0.5">
                      Matricule : <span className="text-blue-700 font-black">{activeStudentForBulletin.registrationNumber}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-slate-500 font-bold uppercase text-[10px]">Classe & Sexe</p>
                  <p className="font-bold text-slate-900">{selectedClass?.name || activeStudentForBulletin.level}</p>
                  <p className="text-slate-600 mt-0.5">
                    Sexe : {activeStudentForBulletin.gender} | Né(e) le : {activeStudentForBulletin.dateOfBirth}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 font-bold uppercase text-[10px]">Classement dans la Classe</p>
                  <p className="font-black text-base text-purple-900 flex items-center space-x-1">
                    <Trophy className="h-4 w-4 text-amber-500 inline" />
                    <span>RANG : {currentBulletinRankData.rank}</span>
                  </p>
                  <p className="text-slate-600 font-semibold text-[11px]">
                    sur {classRankSummary.totalStudents || 1} élève(s)
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 font-bold uppercase text-[10px]">Responsable Légal</p>
                  <p className="font-bold text-slate-900">{activeStudentForBulletin.parentName}</p>
                  <p className="text-slate-600 mt-0.5">Tél : {activeStudentForBulletin.parentPhone}</p>
                </div>
              </div>

              {/* Tableau de toutes les matières arrêtées par l'école avec possibilité de modifier ou supprimer */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-blue-900 text-white font-bold uppercase tracking-wider text-left">
                      <th className="p-2 border border-slate-300">
                        <div className="flex items-center justify-between">
                          <span>Matières Définies par l'École</span>
                          <button
                            type="button"
                            onClick={() => setShowSubjectManagerModal(true)}
                            className="px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white font-extrabold text-[10px] inline-flex items-center space-x-1 transition-all cursor-pointer print:hidden"
                            title="Modifier les coefficients ou supprimer des matières"
                          >
                            <Pencil className="h-3 w-3 text-amber-300" />
                            <span>⚙️ Modifier / Supprimer</span>
                          </button>
                        </div>
                      </th>
                      {activeTemplate.columns.showCoefficients && (
                        <th className="p-2 border border-slate-300 text-center w-16">Coeff</th>
                      )}
                      {activeTemplate.columns.showInterroAverage && (
                        <th className="p-2 border border-slate-300 text-center w-20">Interro</th>
                      )}
                      {activeTemplate.columns.showDevoirMark && (
                        <th className="p-2 border border-slate-300 text-center w-20">Devoir</th>
                      )}
                      {activeTemplate.columns.showCompoMark && (
                        <th className="p-2 border border-slate-300 text-center w-20">Compo</th>
                      )}
                      <th className="p-2 border border-slate-300 text-center w-24">Moy. /20</th>
                      {activeTemplate.columns.showSubjectRank && (
                        <th className="p-2 border border-slate-300 text-center w-20">Rang</th>
                      )}
                      {activeTemplate.columns.showTeacherAppreciation && (
                        <th className="p-2 border border-slate-300">Appréciation Enseignant</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {currentBulletinRankData.subjectResults.length > 0 ? (
                      currentBulletinRankData.subjectResults.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-2 border border-slate-300 font-bold text-slate-900">
                            <div className="flex items-center justify-between group">
                              <span>{item.subject.name}</span>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 print:hidden">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSubject(item.subject)}
                                  className="p-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 cursor-pointer"
                                  title={`Modifier "${item.subject.name}" (nom ou coefficient)`}
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubjectFromBulletin(item.subject)}
                                  className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                                  title={`Supprimer "${item.subject.name}"`}
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
                              {item.grades.length > 0 && item.interroAverage !== undefined
                                ? item.interroAverage.toFixed(2)
                                : '-'}
                            </td>
                          )}
                          {activeTemplate.columns.showDevoirMark && (
                            <td className="p-2 border border-slate-300 text-center">
                              {item.grades.length > 0 && item.devoirMark !== undefined
                                ? item.devoirMark.toFixed(2)
                                : '-'}
                            </td>
                          )}
                          {activeTemplate.columns.showCompoMark && (
                            <td className="p-2 border border-slate-300 text-center">
                              {item.grades.length > 0 && item.compoMark !== undefined
                                ? item.compoMark.toFixed(2)
                                : '-'}
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
                              {item.grades.length > 0 ? item.appreciation : '-'}
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-500 italic">
                          Aucune matière configurée pour cette classe.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-extrabold text-slate-900">
                      <td className="p-2 border border-slate-300">TOTAL GÉNÉRAL</td>
                      {activeTemplate.columns.showCoefficients && (
                        <td className="p-2 border border-slate-300 text-center">
                          {currentBulletinRankData.totalCoefficients}
                        </td>
                      )}
                      <td 
                        colSpan={(activeTemplate.columns.showInterroAverage ? 1 : 0) + (activeTemplate.columns.showDevoirMark ? 1 : 0) + (activeTemplate.columns.showCompoMark ? 1 : 0) + 1} 
                        className="p-2 border border-slate-300 text-center text-sm font-black text-blue-900"
                      >
                        MOYENNE : {currentBulletinRankData.overallAverage > 0 ? `${currentBulletinRankData.overallAverage.toFixed(2)} / 20` : '- / 20'}
                      </td>
                      {activeTemplate.columns.showSubjectRank && (
                        <td className="p-2 border border-slate-300 text-center font-black text-purple-900">
                          {currentBulletinRankData.rank}
                        </td>
                      )}
                      {activeTemplate.columns.showTeacherAppreciation && (
                        <td className="p-2 border border-slate-300 text-emerald-800 font-extrabold uppercase">
                          {currentBulletinRankData.mention}
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Ligne de Statistiques de la Classe */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 font-bold">
                <div>Moyenne Classe : <span className="font-black text-slate-900">{classRankSummary.classAverage.toFixed(2)} / 20</span></div>
                <div>Plus Forte Moy. : <span className="font-black text-emerald-700">{classRankSummary.highestAverage.toFixed(2)} / 20</span></div>
                <div>Plus Faible Moy. : <span className="font-black text-red-700">{classRankSummary.lowestAverage.toFixed(2)} / 20</span></div>
                <div>Taux de Réussite : <span className="font-black text-purple-700">{classRankSummary.passRate.toFixed(1)}%</span></div>
              </div>

              {/* Appréciation du Conseil & Signature / Cachet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-200 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-blue-900 uppercase">Appréciation Générale du Conseil de Classe</h4>
                  <p className="italic text-slate-700 leading-relaxed">
                    "{currentBulletinRankData.generalAppreciation}"
                  </p>
                  <div className="pt-2 flex items-center space-x-2 text-[11px] text-slate-500">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Décision du Conseil : <strong>{currentBulletinRankData.mention}</strong></span>
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

            </div>
          </div>

        </div>
      )}

      {/* VIEW MODE 2: OFFICIAL CLASS RANKING TABLE (Du 1er au Dernier) */}
      {viewMode === 'RANKING_TABLE' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/80">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>Classement Général Officiel — {selectedClass?.name} (Trimestre {selectedTrimester})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tableau du 1er au dernier élève selon la formule "{activeTemplate.templateName}"
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                  <th className="p-3.5 text-right pr-6">Actions Bulletins & Parents</th>
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
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          isTop3 ? 'bg-amber-500/5' : ''
                        }`}
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
                              <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {rankItem.student.lastName} {rankItem.student.firstName}
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
                        <td className="p-3.5 text-right pr-6 space-x-2">
                          <button
                            onClick={() => setSendParentModalData({
                              isOpen: true,
                              student: rankItem.student,
                              studentAverage: rankItem.overallAverage,
                              studentRank: rankItem.rank,
                              studentMention: rankItem.mention
                            })}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow transition-all cursor-pointer"
                            title="Envoyer le lien du bulletin au parent par WhatsApp ou SMS"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>📲 WhatsApp / SMS</span>
                          </button>

                          <button
                            onClick={() => setSelectedStudentForBulletin(rankItem.student)}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow transition-all cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Imprimer</span>
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
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-purple-300 transition-all"
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

              <div className="grid grid-cols-2 gap-2 pt-1">
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
                  onClick={() => setSelectedStudentForBulletin(rankItem.student)}
                  className="py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow transition-all cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimer</span>
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
                <option value="ALL">Toutes les Classes Secondaires</option>
                {secondaryClasses.map(c => (
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
                  <h3 className="font-black text-base">Gestion des Matières du Bulletin ({definedSecondarySubjects.length})</h3>
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

              {/* Liste des matières du secondaire configurées */}
              <div>
                <span className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] block mb-2">
                  Matières figurant actuellement sur le bulletin dressé :
                </span>
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {definedSecondarySubjects.map(sbj => (
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

    </div>
  );
};

