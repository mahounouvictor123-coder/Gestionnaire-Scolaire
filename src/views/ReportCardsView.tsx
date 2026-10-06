import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Student } from '../types';
import { PrintBulletinModal } from '../components/modals/PrintBulletinModal';
import { ScanBulletinTemplateModal } from '../components/modals/ScanBulletinTemplateModal';
import { SendBulletinParentModal } from '../components/modals/SendBulletinParentModal';
import { AIGradesBulletinWhatsAppModal } from '../components/modals/AIGradesBulletinWhatsAppModal';
import { SchoolLogoImportModal } from '../components/modals/SchoolLogoImportModal';
import { calculateClassRanks, defaultBulletinTemplate } from '../lib/gradingUtils';
import {
  FileCheck,
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
  Image as ImageIcon
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
    currentSchool,
    archivedReportCards,
    archiveReportCard,
    deleteArchivedReportCard
  } = useApp();

  const [mainTab, setMainTab] = useState<'GENERATOR' | 'ARCHIVES'>('GENERATOR');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(settings.currentTrimester);
  const [selectedStudentForBulletin, setSelectedStudentForBulletin] = useState<Student | null>(null);
  const [isScanTemplateModalOpen, setIsScanTemplateModalOpen] = useState(false);
  const [showAiWhatsAppModal, setShowAiWhatsAppModal] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'CARDS' | 'RANKING_TABLE'>('RANKING_TABLE');
  const [bulkArchiveMessage, setBulkArchiveMessage] = useState<string>('');

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

  const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter(s => s.classId === selectedClassId);

  // Compute exact rankings for all students in selected class from 1st to last
  const classRankSummary = calculateClassRanks(
    classStudents,
    grades,
    subjects,
    selectedTrimester,
    activeTemplate
  );

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
            Sélectionner la Classe *
          </label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            {classes.map(c => (
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
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('RANKING_TABLE')}
              className={`py-1.5 px-3 rounded-lg font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
                viewMode === 'RANKING_TABLE'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="h-4 w-4" />
              <span>Classement</span>
            </button>

            <button
              onClick={() => setViewMode('CARDS')}
              className={`py-1.5 px-3 rounded-lg font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
                viewMode === 'CARDS'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Grid className="h-4 w-4" />
              <span>Cards Élèves</span>
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

      {/* VIEW MODE 1: OFFICIAL CLASS RANKING TABLE (Du 1er au Dernier) */}
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

    </div>
  );
};

