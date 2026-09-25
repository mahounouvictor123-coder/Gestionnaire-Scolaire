import React, { useState, useRef } from 'react';
import { useApp } from '../../lib/store';
import { Student, SchoolClass } from '../../types';
import { calculateClassRanks, defaultBulletinTemplate } from '../../lib/gradingUtils';
import { SendBulletinParentModal } from './SendBulletinParentModal';
import { X, Printer, Download, GraduationCap, CheckCircle2, Award, Trophy, PenTool, Upload, Eye, EyeOff, Sparkles, MessageCircle, Smartphone } from 'lucide-react';

const PRESET_SIGNATURES = [
  { name: 'Signature 1 (Encre Bleue)', url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=200' },
  { name: 'Signature 2 (Manuscrite)', url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200' },
  { name: 'Signature 3 (Officielle)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' }
];

interface PrintBulletinModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  classObj: SchoolClass;
  trimester: 1 | 2 | 3;
}

export const PrintBulletinModal: React.FC<PrintBulletinModalProps> = ({
  isOpen,
  onClose,
  student,
  classObj,
  trimester
}) => {
  const { settings, updateSettings, subjects, grades, students, currentSchool, updateSchool, archiveReportCard } = useApp();
  const [showSignatureControls, setShowSignatureControls] = useState(false);
  const [showSignatureOnDoc, setShowSignatureOnDoc] = useState(true);
  const [isSendParentModalOpen, setIsSendParentModalOpen] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
              onClick={() => setShowSignatureControls(!showSignatureControls)}
              className="ml-2 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] rounded-lg flex items-center space-x-1 transition-colors"
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
        <div className="p-8 sm:p-10 bg-white text-slate-900 font-sans print:p-0 print:m-0" id="bulletin-document">
          
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-blue-900 pb-4 mb-6">
            <div className="flex items-center space-x-4">
              <img
                src={currentSchool?.logoUrl || settings.logoUrl}
                alt={currentSchool?.name || settings.schoolName}
                className="h-20 w-20 object-cover rounded-xl ring-2 ring-blue-900/20"
              />
              <div>
                <h1 className="text-xl font-extrabold text-blue-900 uppercase tracking-tight">
                  {(settings.schoolName && settings.schoolName !== 'GESTIONNAIRE SCOLAIRE') ? settings.schoolName : (currentSchool?.name || 'ÉTABLISSEMENT SCOLAIRE')}
                </h1>
                <p className="text-xs font-semibold text-emerald-700 italic">{currentSchool?.motto || settings.motto}</p>
                <p className="text-xs text-slate-600 mt-1">{currentSchool?.address || settings.address} • Tel: {currentSchool?.phone || settings.phone}</p>
                <p className="text-xs text-slate-500">{currentSchool?.city} ({currentSchool?.country || 'Afrique'})</p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-blue-900 text-white font-black text-sm px-4 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">
                {activeTemplate.headerTitle || `BULLETIN TRIMESTRE ${trimester}`}
              </div>
              <p className="text-xs font-bold text-slate-700 mt-2">Année Académique : {settings.academicYear}</p>
              <p className="text-[11px] font-extrabold text-indigo-800 mt-0.5">
                Trimestre {trimester}
              </p>
            </div>
          </div>

          {/* Student Info Box with Prominent Rank Display */}
          <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-xs">
            <div>
              <p className="text-slate-500 font-bold uppercase text-[10px]">Identité de l'Élève</p>
              <p className="font-extrabold text-sm text-slate-900 uppercase">{student.lastName} {student.firstName}</p>
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
                <th className="p-2 border border-slate-300">Matières</th>
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
                      <div>{item.subject.name}</div>
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
                      {item.average.toFixed(2)}
                    </td>
                    {activeTemplate.columns.showSubjectRank && (
                      <td className="p-2 border border-slate-300 text-center font-extrabold text-purple-700">
                        {item.subjectRank || '-'}
                      </td>
                    )}
                    {activeTemplate.columns.showTeacherAppreciation && (
                      <td className="p-2 border border-slate-300 italic text-slate-700">
                        {item.appreciation}
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
    </div>
  );
};

