import React, { useState, useRef } from 'react';
import { useApp } from '../../lib/store';
import { SchoolClass, TimetableSlot, Teacher, Subject } from '../../types';
import {
  X,
  Printer,
  Download,
  Calendar,
  Clock,
  BookOpen,
  User,
  Share2,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle2,
  Layers,
  Sparkles,
  Building2,
  FileText,
  FileDown,
  ChevronDown
} from 'lucide-react';
import {
  exportTimetableToPdf,
  exportTimetableToWord,
  exportTimetableToExcel,
  getTeacherDisplayName
} from '../../lib/timetableExportUtils';

interface PrintTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClassId?: string;
  initialTeacherId?: string;
  initialMode?: 'CLASS' | 'ALL_CLASSES' | 'TEACHER';
}

export const PrintTimetableModal: React.FC<PrintTimetableModalProps> = ({
  isOpen,
  onClose,
  initialClassId,
  initialTeacherId,
  initialMode = 'CLASS'
}) => {
  const {
    classes,
    subjects,
    teachers,
    timetable,
    settings,
    currentSchool
  } = useApp();

  const [exportMode, setExportMode] = useState<'CLASS' | 'ALL_CLASSES' | 'TEACHER'>(initialMode);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || classes[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(initialTeacherId || teachers[0]?.id || '');
  const [showSignature, setShowSignature] = useState(true);
  const [showSubjectSummary, setShowSubjectSummary] = useState(true);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const hours = ['08h00 - 10h00', '10h15 - 12h15', '13h30 - 15h30', '15h45 - 17h45'];

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const currentTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];

  // Get slots based on mode
  const getSlotsForClass = (clsId: string) => timetable.filter(t => t.classId === clsId);
  const getSlotsForTeacher = (teacherId: string) => {
    const tch = teachers.find(t => t.id === teacherId);
    return timetable.filter(t => 
      t.teacherId === teacherId || 
      (tch && t.customTeacher && t.customTeacher.toLowerCase().includes(tch.name.toLowerCase()))
    );
  };

  const activeSlots = exportMode === 'TEACHER' 
    ? getSlotsForTeacher(selectedTeacherId)
    : getSlotsForClass(selectedClassId);

  // Calculate subject volume hours for a class
  const getSubjectVolumeStats = (classSlots: TimetableSlot[]) => {
    const stats: { [key: string]: { name: string; hours: number; teacherName: string; color?: string } } = {};
    
    classSlots.forEach(slot => {
      const sbj = subjects.find(s => s.id === slot.subjectId);
      const tch = teachers.find(t => t.id === slot.teacherId);
      const name = sbj?.name || slot.customSubject || 'Matière';
      const teacherName = tch?.name || slot.customTeacher || 'Professeur attitré';
      
      if (!stats[name]) {
        stats[name] = {
          name,
          hours: 0,
          teacherName,
          color: sbj?.color
        };
      }
      stats[name].hours += 2; // Each slot is 2h standard
    });

    return Object.values(stats);
  };

  const subjectStats = getSubjectVolumeStats(activeSlots);
  const totalWeeklyHours = subjectStats.reduce((acc, s) => acc + s.hours, 0);

  // Export as PDF format (vector download)
  const handleDownloadPdf = () => {
    try {
      exportTimetableToPdf({
        mode: exportMode,
        currentClass,
        currentTeacher,
        classes,
        subjects,
        teachers,
        slots: exportMode === 'TEACHER' ? activeSlots : timetable,
        settings,
        currentSchool,
        showSignature,
        showSubjectSummary
      });
      setNoticeMsg('Emploi du temps téléchargé en fichier PDF avec succès !');
      setTimeout(() => setNoticeMsg(null), 3500);
    } catch (err: any) {
      console.error('Erreur téléchargement PDF:', err);
      setNoticeMsg('Erreur lors de la génération du fichier PDF.');
      setTimeout(() => setNoticeMsg(null), 3500);
    }
  };

  // Export as Microsoft Word (.doc) format
  const handleDownloadWord = () => {
    try {
      exportTimetableToWord({
        mode: exportMode,
        currentClass,
        currentTeacher,
        classes,
        subjects,
        teachers,
        slots: exportMode === 'TEACHER' ? activeSlots : timetable,
        settings,
        currentSchool,
        showSignature,
        showSubjectSummary
      });
      setNoticeMsg('Emploi du temps téléchargé en fichier Word (.doc) avec succès !');
      setTimeout(() => setNoticeMsg(null), 3500);
    } catch (err: any) {
      console.error('Erreur téléchargement Word:', err);
      setNoticeMsg('Erreur lors de la génération du fichier Word.');
      setTimeout(() => setNoticeMsg(null), 3500);
    }
  };

  // Export as CSV/Excel format
  const handleDownloadCsv = () => {
    try {
      exportTimetableToExcel({
        mode: exportMode,
        currentClass,
        currentTeacher,
        classes,
        subjects,
        teachers,
        slots: activeSlots,
        settings,
        currentSchool
      });
      setNoticeMsg('Fichier Tableur Excel/CSV téléchargé avec succès !');
      setTimeout(() => setNoticeMsg(null), 3500);
    } catch (err: any) {
      console.error('Erreur téléchargement Excel:', err);
      setNoticeMsg('Erreur lors de l\'export Excel.');
      setTimeout(() => setNoticeMsg(null), 3500);
    }
  };

  // WhatsApp formatted share text
  const handleShareWhatsApp = () => {
    let text = `📅 *EMPLOI DU TEMPS OFFICIEL*\n`;
    text += `🏫 *${currentSchool?.name || settings.schoolName}*\n`;
    text += `Année Scolaire : ${currentSchool?.academicYear || settings.academicYear}\n`;
    
    if (exportMode === 'TEACHER') {
      text += `👤 *Enseignant : ${getTeacherDisplayName(currentTeacher)}*\n\n`;
    } else {
      text += `🎓 *Classe : ${currentClass?.name}* (Salle : ${currentClass?.room || (currentClass as any)?.roomNumber || 'Salle 101'})\n\n`;
    }

    days.forEach(day => {
      const daySlots = activeSlots.filter(s => s.dayOfWeek === day || s.day === day);
      if (daySlots.length > 0) {
        text += `📌 *${day.toUpperCase()} :*\n`;
        daySlots.forEach(s => {
          const sbj = subjects.find(sub => sub.id === s.subjectId);
          const tch = teachers.find(t => t.id === s.teacherId);
          const cls = classes.find(c => c.id === s.classId);
          if (exportMode === 'TEACHER') {
            text += `  ⏰ ${s.startTime} - ${s.endTime} : ${sbj?.name || s.customSubject} (${cls?.name}) [${s.room || 'Salle'}]\n`;
          } else {
            text += `  ⏰ ${s.startTime} - ${s.endTime} : ${sbj?.name || s.customSubject} (${getTeacherDisplayName(tch) || s.customTeacher}) [${s.room || 'Salle'}]\n`;
          }
        });
        text += `\n`;
      }
    });

    text += `Discipline • Travail • Rigueur`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const activeSignatureUrl = currentSchool?.signatureUrl || settings.signatureUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl my-4 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Top Control Bar */}
        <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-amber-300">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  Télécharger l'Emploi du Temps
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase">
                  PDF &bull; Word &bull; Excel
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Téléchargement direct en fichier PDF ou Word (.doc) prêt pour affichage et distribution.
              </p>
            </div>
          </div>

          {/* Action Buttons: PDF, Word, Excel, WhatsApp, Impression */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Direct PDF Download */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md shadow-red-600/30 transition-all cursor-pointer active:scale-95"
              title="Télécharger directement l'emploi du temps au format PDF"
            >
              <FileDown className="h-4 w-4 text-red-200" />
              <span>Télécharger en PDF</span>
            </button>

            {/* Direct Word Download */}
            <button
              type="button"
              onClick={handleDownloadWord}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
              title="Télécharger au format Microsoft Word (.doc) modifiable"
            >
              <FileText className="h-4 w-4 text-blue-200" />
              <span>Télécharger Word (.doc)</span>
            </button>

            {/* Excel / CSV format */}
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              title="Exporter au format Excel / CSV"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Format Excel</span>
            </button>

            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              title="Partager le planning sur WhatsApp"
            >
              <Share2 className="h-4 w-4" />
              <span>WhatsApp</span>
            </button>

            {/* Physical Print Option */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center space-x-1.5 border border-slate-700 transition-all cursor-pointer"
              title="Envoyer vers une imprimante papier"
            >
              <Printer className="h-4 w-4 text-slate-300" />
              <span>Imprimer papier</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter & Customization Toolbar */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Mode Selector */}
          <div className="flex items-center space-x-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setExportMode('CLASS')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                exportMode === 'CLASS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Par Classe
            </button>
            <button
              type="button"
              onClick={() => setExportMode('TEACHER')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                exportMode === 'TEACHER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Par Enseignant
            </button>
            <button
              type="button"
              onClick={() => setExportMode('ALL_CLASSES')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                exportMode === 'ALL_CLASSES'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pack Toutes Classes
            </button>
          </div>

          {/* Contextual Target Dropdown */}
          <div className="flex items-center space-x-2">
            {exportMode === 'CLASS' && (
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-500">Classe :</span>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-extrabold text-blue-900 dark:text-blue-300 outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.roomNumber || 'Salle 101'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {exportMode === 'TEACHER' && (
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-500">Enseignant :</span>
                <select
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-extrabold text-blue-900 dark:text-blue-300 outline-none"
                >
                  {teachers.map(t => {
                    const isPri = t.id.startsWith('tch-p') || t.firstName.includes('Maître') || t.firstName.includes('Maîtresse');
                    return (
                      <option key={t.id} value={t.id}>
                        {isPri ? '🎒' : '👨‍🏫'} {t.name || `${t.firstName} ${t.lastName}`} ({t.qualification || t.subject || 'Enseignant'})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {exportMode === 'ALL_CLASSES' && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 font-black">
                {classes.length} classes générées successivement
              </span>
            )}
          </div>

          {/* Toggle Switches */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showSubjectSummary}
                onChange={e => setShowSubjectSummary(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Volume Horaire</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showSignature}
                onChange={e => setShowSignature(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Cachet & Signature</span>
            </label>
          </div>

        </div>

        {noticeMsg && (
          <div className="m-3 p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-xs font-black flex items-center space-x-2 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{noticeMsg}</span>
          </div>
        )}

        {/* Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 dark:bg-slate-950 flex justify-center">
          
          <div
            ref={printContainerRef}
            id="printable-timetable-doc"
            className="w-full max-w-4xl bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-300 print:border-none print:shadow-none print:m-0 print:p-6 print:w-full"
            style={{ minHeight: '29.7cm' }}
          >
            
            {/* Multi-Class Loop or Single Document */}
            {(exportMode === 'ALL_CLASSES' ? classes : [currentClass]).map((cls, classIndex) => {
              const classSlots = exportMode === 'TEACHER' ? activeSlots : getSlotsForClass(cls.id);
              const classStats = getSubjectVolumeStats(classSlots);
              const classTotalHours = classStats.reduce((acc, s) => acc + s.hours, 0);

              return (
                <div key={cls.id} className={classIndex > 0 ? 'page-break-before pt-10 mt-10 border-t-2 border-dashed border-slate-300' : ''}>
                  
                  {/* Official School Header */}
                  <div className="border-b-2 border-slate-900 pb-4 mb-6">
                    <div className="flex items-center justify-between gap-4">
                      
                      {/* Left: Ministry & Country */}
                      <div className="text-center w-52 text-[10px] uppercase font-bold leading-tight">
                        <p className="font-black text-[11px]">{currentSchool?.country || settings.country || 'RÉPUBLIQUE DU BÉNIN'}</p>
                        <p className="text-slate-600 font-serif italic text-[9px]">Fraternité - Justice - Travail</p>
                        <div className="w-12 h-0.5 bg-slate-900 mx-auto my-1"></div>
                        <p className="text-slate-700">MINISTÈRE DES ENSEIGNEMENTS SECONDAIRE, TECHNIQUE ET DE LA FORMATION PROFESSIONNELLE</p>
                      </div>

                      {/* Center: School Brand & Logo */}
                      <div className="text-center flex-1 px-2">
                        {currentSchool?.logoUrl && (
                          <img
                            src={currentSchool.logoUrl}
                            alt="Logo École"
                            className="h-14 w-14 object-contain mx-auto mb-1 rounded-full border border-slate-300"
                          />
                        )}
                        <h1 className="text-lg sm:text-xl font-black uppercase text-slate-950 tracking-tight">
                          {currentSchool?.name || settings.schoolName}
                        </h1>
                        <p className="text-[11px] font-bold text-blue-800 tracking-wide">
                          « {currentSchool?.motto || settings.motto || 'DISCIPLINE • TRAVAIL • SUCCÈS'} »
                        </p>
                        <p className="text-[10px] text-slate-600">
                          {currentSchool?.address || settings.address} - {currentSchool?.city || settings.city} &bull; Tél : {currentSchool?.phone || settings.phone}
                        </p>
                      </div>

                      {/* Right: Academic Year & Code */}
                      <div className="text-center w-48 text-[10px] font-bold leading-tight">
                        <div className="p-2 rounded-xl bg-slate-100 border border-slate-300 space-y-0.5">
                          <p className="text-slate-500 uppercase text-[9px]">Année Académique</p>
                          <p className="font-black text-xs text-blue-900">{currentSchool?.academicYear || settings.academicYear || '2025-2026'}</p>
                          <p className="text-[9px] text-slate-500 font-mono">Code : {currentSchool?.officialCode || 'DEC-BENIN'}</p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Document Title Banner */}
                  <div className="mb-6 text-center">
                    <div className="inline-block px-6 py-2 rounded-xl bg-slate-900 text-white font-black text-sm uppercase tracking-wider shadow-sm">
                      {exportMode === 'TEACHER' ? (
                        <span>EMPLOI DU TEMPS INDIVIDUEL — ENSEIGNANT : {currentTeacher?.name?.toUpperCase()}</span>
                      ) : (
                        <span>EMPLOI DU TEMPS OFFICIEL — CLASSE DE : {cls.name?.toUpperCase()}</span>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center justify-center space-x-4 text-xs font-bold text-slate-600">
                      {exportMode !== 'TEACHER' && (
                        <span>Salle de classe attitrée : <strong className="text-slate-900 font-black">{cls.roomNumber || 'Salle 101'}</strong></span>
                      )}
                      <span>Effectif : <strong className="text-slate-900 font-black">{cls.studentCount || 40} élèves</strong></span>
                      <span>Total Heures / Semaine : <strong className="text-blue-900 font-black">{classTotalHours}h</strong></span>
                    </div>
                  </div>

                  {/* High Quality Timetable Matrix Table */}
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-collapse border-2 border-slate-900 text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-white font-black text-center uppercase tracking-wider">
                          <th className="border-2 border-slate-900 p-2.5 w-32 bg-slate-950">
                            Horaires
                          </th>
                          {days.map(d => (
                            <th key={d} className="border-2 border-slate-900 p-2.5">
                              {d}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {hours.map((hourStr, hIdx) => {
                          const startH = hourStr.split(' - ')[0];

                          return (
                            <tr key={hourStr} className={hIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                              
                              {/* Hour Header */}
                              <td className="border-2 border-slate-900 p-2.5 font-black text-center bg-slate-100 text-slate-900 whitespace-nowrap">
                                <div className="text-xs">{hourStr}</div>
                                <span className="text-[9px] text-slate-500 font-medium font-mono">(2 heures)</span>
                              </td>

                              {/* Day Columns */}
                              {days.map(dayStr => {
                                const slot = classSlots.find(
                                  s => (s.dayOfWeek === dayStr || s.day === dayStr) &&
                                       (s.startTime === startH || s.startTime?.startsWith(startH.substring(0, 2)))
                                );

                                const sbj = subjects.find(s => s.id === slot?.subjectId);
                                const tch = teachers.find(t => t.id === slot?.teacherId);
                                const assignedClass = classes.find(c => c.id === slot?.classId);

                                return (
                                  <td
                                    key={dayStr}
                                    className="border-2 border-slate-900 p-2 text-center align-middle min-h-[64px] relative"
                                  >
                                    {slot ? (
                                      <div className="p-2 rounded-lg bg-blue-50 border border-blue-300 text-slate-900 space-y-0.5">
                                        <p className="font-black text-xs text-blue-950 uppercase leading-tight">
                                          {sbj?.name || slot.customSubject || 'Matière'}
                                        </p>
                                        
                                        {exportMode === 'TEACHER' ? (
                                          <p className="text-[10px] font-extrabold text-emerald-800">
                                            Classe : {assignedClass?.name || 'Général'}
                                          </p>
                                        ) : (
                                          <p className="text-[10px] font-bold text-slate-700 truncate">
                                            {tch?.name || slot.customTeacher || 'Professeur'}
                                          </p>
                                        )}

                                        <p className="text-[9px] font-mono text-slate-500">
                                          [{slot.room || cls.roomNumber || 'Salle 101'}]
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-slate-300 font-serif italic py-3">
                                        — Libre —
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Subject Summary & Hourly Volume */}
                  {showSubjectSummary && classStats.length > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-300">
                      <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 mb-2.5 flex items-center justify-between">
                        <span>Récapitulatif des Volumes Horaires Hebdomadaires ({cls.name})</span>
                        <span className="text-blue-900">Total : {classTotalHours} Heures / Semaine</span>
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        {classStats.map(st => (
                          <div key={st.name} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                            <div className="min-w-0 pr-1">
                              <p className="font-extrabold text-slate-900 truncate">{st.name}</p>
                              <p className="text-[9px] text-slate-500 truncate">{st.teacherName}</p>
                            </div>
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-black text-xs shrink-0">
                              {st.hours}h
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Official Signature & Stamps Footer */}
                  {showSignature && (
                    <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
                      <div>
                        <p className="font-black uppercase text-slate-900">Le Censeur / Dir. Études</p>
                        <p className="text-[10px] text-slate-500 italic mt-0.5">Visa Pédagogique</p>
                        <div className="h-16 flex items-center justify-center">
                          <span className="text-[10px] text-slate-400 font-serif italic">[Signature & Date]</span>
                        </div>
                      </div>

                      <div>
                        <p className="font-black uppercase text-slate-900">
                          {cls.level === 'PRIMAIRE'
                            ? 'Le Maître / La Maîtresse Titulaire'
                            : cls.level === 'MATERNELLE'
                            ? 'La Maîtresse de Maternelle'
                            : 'Le Conseil des Professeurs'}
                        </p>
                        <p className="text-[10px] text-slate-500 italic mt-0.5">Pour Information</p>
                        <div className="h-16 flex items-center justify-center">
                          <span className="text-[10px] text-slate-400 font-serif italic">[Vu & Approuvé]</span>
                        </div>
                      </div>

                      <div>
                        <p className="font-black uppercase text-slate-900">Le Directeur Général</p>
                        <p className="text-[10px] text-slate-500 italic mt-0.5">Cachet & Signature Officielle</p>
                        <div className="h-16 flex items-center justify-center">
                          {activeSignatureUrl ? (
                            <img
                              src={activeSignatureUrl}
                              alt="Signature Direction"
                              className="h-14 object-contain mx-auto"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-serif italic">[Cachet de l'Établissement]</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}

          </div>

        </div>

        {/* Sticky Action Footer */}
        <div className="p-3.5 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-extrabold text-slate-900 dark:text-white">Formats certifiés :</span>
            <span className="text-[11px] text-slate-500">Le PDF et Word intègrent l'en-tête officiel et les signatures.</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-black text-xs flex items-center space-x-2 shadow-md shadow-red-600/30 cursor-pointer transition-all"
              title="Télécharger directement le fichier PDF"
            >
              <FileDown className="h-4 w-4 text-red-200" />
              <span>Télécharger en PDF (.pdf)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadWord}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-black text-xs flex items-center space-x-2 shadow-md shadow-blue-600/30 cursor-pointer transition-all"
              title="Télécharger directement le fichier Word"
            >
              <FileText className="h-4 w-4 text-blue-200" />
              <span>Télécharger en Word (.doc)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="Format Excel / CSV"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Format Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
