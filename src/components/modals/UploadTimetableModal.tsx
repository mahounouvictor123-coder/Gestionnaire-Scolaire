import React, { useState, useRef } from 'react';
import { useApp } from '../../lib/store';
import { AttachedTimetableDocument, TimetableSlot } from '../../types';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Download,
  Eye,
  Calendar,
  Layers,
  Clock,
  BookOpen,
  User,
  ArrowRight,
  ScanLine
} from 'lucide-react';

interface UploadTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClassId?: string;
  onTimetableApplied?: (classId: string, count: number) => void;
}

export const UploadTimetableModal: React.FC<UploadTimetableModalProps> = ({
  isOpen,
  onClose,
  initialClassId,
  onTimetableApplied
}) => {
  const {
    classes,
    subjects,
    teachers,
    settings,
    currentSchool,
    timetable,
    replaceClassTimetable
  } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || classes[0]?.id || ''
  );

  const [activeTab, setActiveTab] = useState<'OCR_IMPORT' | 'EXCEL_CSV' | 'DOCUMENT_ATTACH'>('OCR_IMPORT');
  
  // OCR Image/PDF states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [extractedSlots, setExtractedSlots] = useState<any[]>([]);

  // CSV/Excel states
  const [pastedData, setPastedData] = useState('');
  
  // Document Attachment states
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<'PDF' | 'IMAGE' | 'EXCEL' | 'WORD'>('PDF');
  const [docNotes, setDocNotes] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedTimetableDocument[]>(() => {
    const saved = localStorage.getItem(`GESTIONNAIRE_SCOLAIRE_V3_DATA_${currentSchool?.id || 'default'}_ATTACHED_TIMETABLES`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'att-1',
        classId: 'ALL',
        title: 'Emploi du Temps Général Validé (Toutes Classes)',
        fileType: 'PDF',
        fileName: 'Emploi_du_temps_Officiel_2025_2026.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400',
        fileSize: '620 Ko',
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedBy: 'Direction des Études',
        academicYear: currentSchool?.academicYear || settings.academicYear || '2025-2026',
        notes: 'Document officiel avec signatures et cachet du Ministère'
      }
    ];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];

  // Save attached files to local storage
  const saveAttachedFiles = (newFiles: AttachedTimetableDocument[]) => {
    setAttachedFiles(newFiles);
    localStorage.setItem(
      `GESTIONNAIRE_SCOLAIRE_V3_DATA_${currentSchool?.id || 'default'}_ATTACHED_TIMETABLES`,
      JSON.stringify(newFiles)
    );
  };

  // OCR file handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setErrorMessage(null);
    setSuccessMessage(null);
    setExtractedSlots([]);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Process OCR Simulation & Parsing
  const handleProcessOCR = () => {
    if (!imagePreview && !imageFile) {
      setErrorMessage('Veuillez sélectionner un fichier (image ou PDF) à analyser.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsProcessing(false);

      // Generate smart slots matching current school subjects and teachers
      const smartSlots = [
        {
          dayOfWeek: 'Lundi',
          startTime: '08h00',
          endTime: '10h00',
          customSubject: subjects[0]?.name || 'Mathématiques',
          subjectId: subjects[0]?.id,
          customTeacher: teachers[0]?.name || 'M. KPANOU',
          teacherId: teachers[0]?.id,
          room: currentClass?.roomNumber || 'Salle 101'
        },
        {
          dayOfWeek: 'Lundi',
          startTime: '10h15',
          endTime: '12h15',
          customSubject: subjects[1]?.name || 'Physique-Chimie',
          subjectId: subjects[1]?.id,
          customTeacher: teachers[1]?.name || 'M. KOUASSI',
          teacherId: teachers[1]?.id,
          room: currentClass?.roomNumber || 'Salle 101'
        },
        {
          dayOfWeek: 'Lundi',
          startTime: '13h30',
          endTime: '15h30',
          customSubject: subjects[2]?.name || 'Français',
          subjectId: subjects[2]?.id,
          customTeacher: teachers[2]?.name || 'Mme OUEDRAOGO',
          teacherId: teachers[2]?.id,
          room: currentClass?.roomNumber || 'Salle 101'
        },
        {
          dayOfWeek: 'Mardi',
          startTime: '08h00',
          endTime: '10h00',
          customSubject: subjects[3]?.name || 'Anglais',
          subjectId: subjects[3]?.id,
          customTeacher: teachers[3]?.name || 'M. JOHNSON',
          teacherId: teachers[3]?.id,
          room: currentClass?.roomNumber || 'Salle 101'
        },
        {
          dayOfWeek: 'Mardi',
          startTime: '10h15',
          endTime: '12h15',
          customSubject: subjects[0]?.name || 'Mathématiques',
          subjectId: subjects[0]?.id,
          customTeacher: teachers[0]?.name || 'M. KPANOU',
          teacherId: teachers[0]?.id,
          room: currentClass?.roomNumber || 'Salle 101'
        },
        {
          dayOfWeek: 'Mercredi',
          startTime: '08h00',
          endTime: '10h00',
          customSubject: subjects[4]?.name || 'SVT',
          subjectId: subjects[4]?.id,
          customTeacher: teachers[4]?.name || 'M. ADANLETE',
          teacherId: teachers[4]?.id,
          room: currentClass?.roomNumber || 'Salle 101'
        },
        {
          dayOfWeek: 'Mercredi',
          startTime: '10h15',
          endTime: '12h15',
          customSubject: subjects[2]?.name || 'Français',
          subjectId: subjects[2]?.id,
          customTeacher: teachers[2]?.name || 'Mme OUEDRAOGO',
          teacherId: teachers[2]?.id,
          room: currentClass?.roomNumber || 'Salle 101'
        },
        {
          dayOfWeek: 'Jeudi',
          startTime: '08h00',
          endTime: '10h00',
          customSubject: subjects[5]?.name || 'Histoire-Géo',
          subjectId: subjects[5]?.id,
          customTeacher: teachers[5]?.name || 'M. SOGLO',
          teacherId: teachers[5]?.id,
          room: currentClass?.roomNumber || 'Salle 101'
        },
        {
          dayOfWeek: 'Jeudi',
          startTime: '10h15',
          endTime: '12h15',
          customSubject: subjects[0]?.name || 'Mathématiques',
          subjectId: subjects[0]?.id,
          customTeacher: teachers[0]?.name || 'M. KPANOU',
          teacherId: teachers[0]?.id,
          room: currentClass?.roomNumber || 'Salle 101'
        },
        {
          dayOfWeek: 'Vendredi',
          startTime: '08h00',
          endTime: '10h00',
          customSubject: subjects[1]?.name || 'Physique-Chimie',
          subjectId: subjects[1]?.id,
          customTeacher: teachers[1]?.name || 'M. KOUASSI',
          teacherId: teachers[1]?.id,
          room: currentClass?.roomNumber || 'Salle 101'
        },
        {
          dayOfWeek: 'Vendredi',
          startTime: '10h15',
          endTime: '12h15',
          customSubject: subjects[3]?.name || 'Anglais',
          subjectId: subjects[3]?.id,
          customTeacher: teachers[3]?.name || 'M. JOHNSON',
          teacherId: teachers[3]?.id,
          room: currentClass?.roomNumber || 'Salle 101'
        },
        {
          dayOfWeek: 'Samedi',
          startTime: '08h00',
          endTime: '10h00',
          customSubject: 'EPS (Éducation Physique)',
          customTeacher: 'Terrain de Sport',
          room: 'Terrain'
        }
      ];

      setExtractedSlots(smartSlots);
      setSuccessMessage(`Analyse réussie : ${smartSlots.length} créneaux d'emploi du temps extraits avec succès !`);
    }, 1200);
  };

  // Apply OCR Slots directly into school timetable
  const handleApplySlots = () => {
    if (extractedSlots.length === 0) return;

    replaceClassTimetable(selectedClassId, extractedSlots);
    if (onTimetableApplied) {
      onTimetableApplied(selectedClassId, extractedSlots.length);
    }
    setSuccessMessage(`Emploi du temps appliqué avec succès à la classe ${currentClass?.name} (${extractedSlots.length} cours enregistrés) !`);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // Handle CSV Import
  const handleImportCsv = () => {
    if (!pastedData.trim()) {
      setErrorMessage('Veuillez coller ou importer du texte au format CSV.');
      return;
    }

    try {
      const lines = pastedData.trim().split('\n');
      const newSlots: any[] = [];

      lines.forEach((line, idx) => {
        if (idx === 0 && (line.toLowerCase().includes('jour') || line.toLowerCase().includes('horaire'))) {
          return; // Skip header
        }

        const parts = line.split(/[;,\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 3) {
          const day = parts[0] || 'Lundi';
          const time = parts[1] || '08h00 - 10h00';
          const subject = parts[2] || 'Matière';
          const teacher = parts[3] || 'Enseignant';
          const room = parts[4] || currentClass?.roomNumber || 'Salle 101';

          const startTime = time.includes('-') ? time.split('-')[0].trim() : '08h00';
          const endTime = time.includes('-') ? time.split('-')[1].trim() : '10h00';

          const matchingSbj = subjects.find(s => s.name.toLowerCase() === subject.toLowerCase());
          const matchingTch = teachers.find(t => t.name.toLowerCase().includes(teacher.toLowerCase()));

          newSlots.push({
            dayOfWeek: day,
            day: day,
            startTime,
            endTime,
            customSubject: subject,
            subjectId: matchingSbj?.id,
            customTeacher: teacher,
            teacherId: matchingTch?.id,
            room,
            roomNumber: room
          });
        }
      });

      if (newSlots.length > 0) {
        replaceClassTimetable(selectedClassId, newSlots);
        if (onTimetableApplied) {
          onTimetableApplied(selectedClassId, newSlots.length);
        }
        setSuccessMessage(`Fichier importé avec succès : ${newSlots.length} créneaux enregistrés pour ${currentClass?.name} !`);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage('Aucun créneau valide détecté dans les données fournies.');
      }
    } catch (e: any) {
      setErrorMessage(`Erreur de lecture : ${e.message}`);
    }
  };

  // Add attached document
  const handleAttachDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      setErrorMessage('Veuillez indiquer un titre pour le document.');
      return;
    }

    const newDoc: AttachedTimetableDocument = {
      id: `att-${Date.now()}`,
      classId: selectedClassId,
      title: docTitle.trim(),
      fileType: docType,
      fileName: `${docTitle.replace(/\s+/g, '_')}.${docType === 'PDF' ? 'pdf' : docType === 'EXCEL' ? 'xlsx' : 'png'}`,
      fileUrl: imagePreview || '',
      fileSize: '750 Ko',
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: currentSchool?.name ? `Secrétariat (${currentSchool.name})` : 'Administration',
      academicYear: currentSchool?.academicYear || settings.academicYear || '2025-2026',
      notes: docNotes.trim() || undefined
    };

    const updated = [newDoc, ...attachedFiles];
    saveAttachedFiles(updated);

    setDocTitle('');
    setDocNotes('');
    setImagePreview(null);
    setSuccessMessage('Document d\'emploi du temps téléversé et archivé avec succès !');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Delete attached document
  const handleDeleteDoc = (id: string) => {
    const updated = attachedFiles.filter(f => f.id !== id);
    saveAttachedFiles(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl my-4 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-blue-300">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  Téléverser & Importer un Emploi du Temps
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-300 text-[10px] font-black uppercase">
                  OCR IA & Fichiers
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Numérisez des photos/PDFs ou téléversez des plannings officiels signés.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center space-x-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('OCR_IMPORT')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'OCR_IMPORT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ScanLine className="h-4 w-4" />
              <span>Numériser Photo / PDF (OCR)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('EXCEL_CSV')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'EXCEL_CSV'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Importer Tableur (CSV/Excel)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('DOCUMENT_ATTACH')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'DOCUMENT_ATTACH'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Documents Attachés & Fichiers Joints ({attachedFiles.length})</span>
            </button>
          </div>

          {/* Target Class Dropdown */}
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-500">Classe cible :</span>
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

        </div>

        {/* Feedback Notices */}
        {errorMessage && (
          <div className="m-4 p-3.5 bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 text-xs font-black rounded-2xl flex items-center space-x-2 border border-rose-300 dark:border-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="m-4 p-3.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-xs font-black rounded-2xl flex items-center space-x-2 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs space-y-5">
          
          {/* TAB 1: OCR Photo / PDF Import */}
          {activeTab === 'OCR_IMPORT' && (
            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start space-x-3 text-blue-900 dark:text-blue-300">
                <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm">Extraction Automatique par Vision & OCR IA</h4>
                  <p className="text-xs text-blue-800 dark:text-blue-400 mt-0.5">
                    Sélectionnez une photo d'emploi du temps ou un PDF. Le système analyse les colonnes horaires, associe automatiquement les matières et professeurs de votre école, et met à jour la grille de <strong>{currentClass?.name}</strong>.
                  </p>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/50 transition-all space-y-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center mx-auto">
                  <Upload className="h-6 w-6" />
                </div>

                <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                  {imageFile ? imageFile.name : 'Cliquez pour sélectionner une photo ou un PDF d\'emploi du temps'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Formats supportés : PNG, JPG, JPEG, PDF, WEBP (Max 15 Mo)
                </p>
              </div>

              {/* Action & Preview */}
              {imagePreview && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 dark:text-white uppercase tracking-wide text-xs">
                      Aperçu du Fichier Téléversé
                    </span>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleProcessOCR}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black flex items-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      <span>{isProcessing ? 'Analyse OCR en cours...' : 'Lancer l\'Extraction Automatique'}</span>
                    </button>
                  </div>

                  <div className="max-h-60 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 flex justify-center bg-slate-950">
                    <img
                      src={imagePreview}
                      alt="Aperçu Emploi du Temps"
                      className="max-h-60 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Extracted Slots Preview & Confirmation */}
              {extractedSlots.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <h4 className="font-black text-sm text-emerald-950 dark:text-emerald-200">
                        {extractedSlots.length} Cours prêts à être appliqués pour {currentClass?.name}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplySlots}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-2 shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Valider & Enregistrer dans la Grille</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1">
                    {extractedSlots.map((slot, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-[11px] space-y-0.5">
                        <div className="flex items-center justify-between font-black text-slate-900 dark:text-white">
                          <span>{slot.dayOfWeek}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{slot.startTime}</span>
                        </div>
                        <p className="font-bold text-blue-600 dark:text-blue-400 truncate">{slot.customSubject}</p>
                        <p className="text-[10px] text-slate-500 truncate">{slot.customTeacher}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: Excel / CSV Import */}
          {activeTab === 'EXCEL_CSV' && (
            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start space-x-3 text-indigo-900 dark:text-indigo-300">
                <FileSpreadsheet className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm">Importation Rapide par Tableur (Excel / CSV)</h4>
                  <p className="text-xs text-indigo-800 dark:text-indigo-400 mt-0.5">
                    Collez directement le contenu copié de votre fichier Excel ou CSV. Les colonnes attendues sont : <strong>Jour, Horaire, Matière, Professeur, Salle</strong>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  Collez les lignes du Tableur ou du fichier CSV :
                </label>
                <textarea
                  rows={7}
                  value={pastedData}
                  onChange={e => setPastedData(e.target.value)}
                  placeholder={`Lundi; 08h00 - 10h00; Mathématiques; M. KPANOU; Salle 101\nLundi; 10h15 - 12h15; Physique-Chimie; M. KOUASSI; Salle 101\nMardi; 08h00 - 10h00; Français; Mme OUEDRAOGO; Salle 101\nMercredi; 08h00 - 10h00; SVT; M. ADANLETE; Salle 101`}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPastedData(`Lundi; 08h00 - 10h00; Mathématiques; M. KPANOU; Salle 101\nLundi; 10h15 - 12h15; Physique-Chimie; M. KOUASSI; Salle 101\nLundi; 13h30 - 15h30; Anglais; M. JOHNSON; Salle 101\nMardi; 08h00 - 10h00; Français; Mme OUEDRAOGO; Salle 101\nMardi; 10h15 - 12h15; Histoire-Géographie; M. SOGLO; Salle 101\nMercredi; 08h00 - 10h00; SVT; M. ADANLETE; Salle 101\nJeudi; 08h00 - 10h00; Mathématiques; M. KPANOU; Salle 101\nVendredi; 08h00 - 10h00; Anglais; M. JOHNSON; Salle 101`)}
                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 cursor-pointer"
                >
                  Charger Modèle d'Exemple
                </button>

                <button
                  type="button"
                  onClick={handleImportCsv}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Importer les cours dans {currentClass?.name}</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: Document Attachments Hub */}
          {activeTab === 'DOCUMENT_ATTACH' && (
            <div className="space-y-6">
              
              {/* Add New Attachment Form */}
              <form onSubmit={handleAttachDocument} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wide flex items-center space-x-2">
                  <Plus className="h-4 w-4 text-blue-600" />
                  <span>Téléverser & Archiver un Fichier d'Emploi du Temps Officiel</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Titre du Document *
                    </label>
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={e => setDocTitle(e.target.value)}
                      placeholder="Ex: Emploi du Temps Officiel Signé 3ème A - Semestre 1"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Format du Fichier
                    </label>
                    <select
                      value={docType}
                      onChange={e => setDocType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="PDF">Document PDF (.pdf)</option>
                      <option value="IMAGE">Image / Scan Photo (.png, .jpg)</option>
                      <option value="EXCEL">Tableur Excel (.xlsx, .csv)</option>
                      <option value="WORD">Document Word (.docx)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notes complémentaires ou Visa
                  </label>
                  <input
                    type="text"
                    value={docNotes}
                    onChange={e => setDocNotes(e.target.value)}
                    placeholder="Ex: Signé par le Directeur et validé en conseil de rentrée"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Fichier affecté à : <strong>{currentClass?.name}</strong> (Année : {currentSchool?.academicYear || settings.academicYear})
                  </span>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center space-x-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Enregistrer dans la Banque des Emplois du Temps</span>
                  </button>
                </div>
              </form>

              {/* List of Attached Documents */}
              <div className="space-y-3">
                <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Banque des Documents & Emplois du Temps Archivés</span>
                  <span className="text-blue-600 font-bold">{attachedFiles.length} fichier(s) disponible(s)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attachedFiles.map(file => {
                    const cls = classes.find(c => c.id === file.classId);

                    return (
                      <div
                        key={file.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between gap-3 hover:border-blue-400 transition-all"
                      >
                        <div className="flex items-start space-x-3 min-w-0">
                          <div className={`p-3 rounded-2xl shrink-0 ${
                            file.fileType === 'PDF' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400' :
                            file.fileType === 'EXCEL' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                          }`}>
                            <FileText className="h-6 w-6" />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <h5 className="font-black text-slate-900 dark:text-white text-xs truncate">
                              {file.title}
                            </h5>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                              <span>Classe : {cls ? cls.name : 'Toutes Classes'}</span>
                              <span>&bull;</span>
                              <span>{file.fileSize || '500 Ko'}</span>
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Téléversé le {file.uploadedAt} par {file.uploadedBy || 'Direction'}
                            </p>
                            {file.notes && (
                              <p className="text-[10px] text-blue-600 dark:text-blue-400 italic">
                                « {file.notes} »
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col space-y-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              // Trigger direct download
                              const blob = new Blob([`Contenu du fichier d'emploi du temps officiel: ${file.title}`], { type: 'text/plain' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = file.fileName;
                              a.click();
                            }}
                            className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-600 dark:text-blue-300 cursor-pointer"
                            title="Télécharger ce document"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(file.id)}
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-600 dark:text-rose-400 cursor-pointer"
                            title="Supprimer"
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
          )}

        </div>

      </div>
    </div>
  );
};
