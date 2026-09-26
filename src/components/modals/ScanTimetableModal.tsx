import React, { useState, useRef } from 'react';
import { useApp } from '../../lib/store';
import { TimetableSlot } from '../../types';
import { clientFetch } from '../../services/clientFetch.ts';
import {
  ScanLine,
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  User,
  Building2,
  RefreshCw,
  FileText,
  Check,
  X,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ScanTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClassId?: string;
  onTimetableApplied?: (classId: string, count: number) => void;
}

interface ExtractedSlot {
  dayOfWeek: string;
  day?: string;
  startTime: string;
  endTime: string;
  customSubject: string;
  subjectId?: string;
  customTeacher?: string;
  teacherId?: string;
  room?: string;
  notes?: string;
}

export const ScanTimetableModal: React.FC<ScanTimetableModalProps> = ({
  isOpen,
  onClose,
  initialClassId,
  onTimetableApplied
}) => {
  const { classes, subjects, teachers, replaceClassTimetable } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || classes[0]?.id || ''
  );

  const [activeTab, setActiveTab] = useState<'IMAGE' | 'TEXT' | 'DEMO'>('IMAGE');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractionSummary, setExtractionSummary] = useState<string | null>(null);
  const [detectedClassName, setDetectedClassName] = useState<string | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(95);

  const [extractedSlots, setExtractedSlots] = useState<ExtractedSlot[]>([]);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];

  // Sample SVG African / Francophone school timetable for demonstration
  const sampleTimetableSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="700" height="460" viewBox="0 0 700 460" fill="none"><rect width="700" height="460" fill="%23FFFFFF"/><rect x="15" y="15" width="670" height="430" rx="8" stroke="%231E293B" stroke-width="2"/><text x="35" y="45" font-family="sans-serif" font-size="16" font-weight="bold" fill="%230F172A">COMPLEXE SCOLAIRE EXCELLENCE - EMPLOI DU TEMPS OFFICIEL</text><text x="35" y="68" font-family="sans-serif" font-size="13" font-weight="bold" fill="%232563EB">CLASSE : 3ème A | ANNEE SCOLAIRE 2025-2026 | SALLE 101</text><line x1="35" y1="80" x2="665" y2="80" stroke="%23CBD5E1" stroke-width="1.5"/><rect x="35" y="90" width="630" height="30" fill="%231E3A8A"/><text x="45" y="110" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23FFFFFF">HORAIRES</text><text x="140" y="110" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23FFFFFF">LUNDI</text><text x="235" y="110" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23FFFFFF">MARDI</text><text x="330" y="110" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23FFFFFF">MERCREDI</text><text x="425" y="110" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23FFFFFF">JEUDI</text><text x="520" y="110" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23FFFFFF">VENDREDI</text><text x="605" y="110" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23FFFFFF">SAMEDI</text><rect x="35" y="125" width="630" height="70" fill="%23F8FAFC" stroke="%23E2E8F0"/><text x="40" y="160" font-family="sans-serif" font-size="10" font-weight="bold" fill="%230F172A">08h00 - 10h00</text><text x="135" y="150" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Mathématiques</text><text x="135" y="165" font-family="sans-serif" font-size="9" fill="%23475569">M. KPANOU</text><text x="230" y="150" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Français</text><text x="230" y="165" font-family="sans-serif" font-size="9" fill="%23475569">Mme OUEDRAOGO</text><text x="325" y="150" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">SVT</text><text x="325" y="165" font-family="sans-serif" font-size="9" fill="%23475569">M. ADANLETE</text><text x="420" y="150" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Histoire-Géo</text><text x="420" y="165" font-family="sans-serif" font-size="9" fill="%23475569">M. SOGLO</text><text x="515" y="150" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Anglais</text><text x="515" y="165" font-family="sans-serif" font-size="9" fill="%23475569">M. JOHNSON</text><text x="600" y="150" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23059669">EPS</text><text x="600" y="165" font-family="sans-serif" font-size="9" fill="%23475569">Terrain Sport</text><rect x="35" y="200" width="630" height="70" fill="%23FFFFFF" stroke="%23E2E8F0"/><text x="40" y="235" font-family="sans-serif" font-size="10" font-weight="bold" fill="%230F172A">10h15 - 12h15</text><text x="135" y="225" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Physique-Chimie</text><text x="135" y="240" font-family="sans-serif" font-size="9" fill="%23475569">M. KOUASSI</text><text x="230" y="225" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Mathématiques</text><text x="230" y="240" font-family="sans-serif" font-size="9" fill="%23475569">M. KPANOU</text><text x="325" y="225" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Français</text><text x="325" y="240" font-family="sans-serif" font-size="9" fill="%23475569">Mme OUEDRAOGO</text><text x="420" y="225" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">SVT</text><text x="420" y="240" font-family="sans-serif" font-size="9" fill="%23475569">M. ADANLETE</text><text x="515" y="225" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Physique-Chimie</text><text x="515" y="240" font-family="sans-serif" font-size="9" fill="%23475569">M. KOUASSI</text><text x="600" y="235" font-family="sans-serif" font-size="10" fill="%2394A3B8">-- LIBRE --</text><rect x="35" y="275" width="630" height="70" fill="%23F8FAFC" stroke="%23E2E8F0"/><text x="40" y="310" font-family="sans-serif" font-size="10" font-weight="bold" fill="%230F172A">13h30 - 15h30</text><text x="135" y="300" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Anglais</text><text x="135" y="315" font-family="sans-serif" font-size="9" fill="%23475569">M. JOHNSON</text><text x="230" y="300" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Histoire-Géo</text><text x="230" y="315" font-family="sans-serif" font-size="9" fill="%23475569">M. SOGLO</text><text x="325" y="310" font-family="sans-serif" font-size="10" fill="%2394A3B8">-- LIBRE --</text><text x="420" y="300" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Français</text><text x="420" y="315" font-family="sans-serif" font-size="9" fill="%23475569">Mme OUEDRAOGO</text><text x="515" y="300" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Philosophie</text><text x="515" y="315" font-family="sans-serif" font-size="9" fill="%23475569">M. DOSSEH</text><text x="600" y="310" font-family="sans-serif" font-size="10" fill="%2394A3B8">-- LIBRE --</text><rect x="35" y="350" width="630" height="70" fill="%23FFFFFF" stroke="%23E2E8F0"/><text x="40" y="385" font-family="sans-serif" font-size="10" font-weight="bold" fill="%230F172A">15h45 - 17h45</text><text x="135" y="375" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Informatique</text><text x="135" y="390" font-family="sans-serif" font-size="9" fill="%23475569">Labo Info</text><text x="230" y="375" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Allemand / Espagnol</text><text x="230" y="390" font-family="sans-serif" font-size="9" fill="%23475569">Salle Langues</text><text x="325" y="385" font-family="sans-serif" font-size="10" fill="%2394A3B8">-- LIBRE --</text><text x="420" y="375" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Mathématiques</text><text x="420" y="390" font-family="sans-serif" font-size="9" fill="%23475569">M. KPANOU</text><text x="515" y="375" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231E293B">Étude / Devoirs</text><text x="515" y="390" font-family="sans-serif" font-size="9" fill="%23475569">Surveillant</text><text x="600" y="385" font-family="sans-serif" font-size="10" fill="%2394A3B8">-- LIBRE --</text></svg>`;

  const sampleTimetableText = `COMPLEXE SCOLAIRE EXCELLENCE - EMPLOI DU TEMPS
CLASSE : 3ème A | SALLE : Salle 101 | ANNEE : 2025-2026

LUNDI :
- 08h00 - 10h00 : Mathématiques (M. KPANOU)
- 10h15 - 12h15 : Physique-Chimie (M. KOUASSI)
- 13h30 - 15h30 : Anglais (M. JOHNSON)
- 15h45 - 17h45 : Informatique (Labo Info)

MARDI :
- 08h00 - 10h00 : Français (Mme OUEDRAOGO)
- 10h15 - 12h15 : Mathématiques (M. KPANOU)
- 13h30 - 15h30 : Histoire-Géographie (M. SOGLO)
- 15h45 - 17h45 : Allemand / Espagnol (Salle Langues)

MERCREDI :
- 08h00 - 10h00 : SVT (M. ADANLETE)
- 10h15 - 12h15 : Français (Mme OUEDRAOGO)

JEUDI :
- 08h00 - 10h00 : Histoire-Géographie (M. SOGLO)
- 10h15 - 12h15 : SVT (M. ADANLETE)
- 13h30 - 15h30 : Français (Mme OUEDRAOGO)
- 15h45 - 17h45 : Mathématiques (M. KPANOU)

VENDREDI :
- 08h00 - 10h00 : Anglais (M. JOHNSON)
- 10h15 - 12h15 : Physique-Chimie (M. KOUASSI)
- 13h30 - 15h30 : Philosophie / ECM (M. DOSSEH)
- 15h45 - 17h45 : Étude Dirigée / Soutien (Surveillant)

SAMEDI :
- 08h00 - 10h00 : EPS (Terrain de Sport)`;

  // File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI OCR Scan Trigger
  const handleProcessScan = async () => {
    let imagePayload = null;
    let textPayload = null;

    if (activeTab === 'IMAGE') {
      if (!imagePreview) {
        setErrorMessage("Veuillez sélectionner ou déposer une photo de l'emploi du temps.");
        return;
      }
      imagePayload = imagePreview;
    } else if (activeTab === 'TEXT') {
      if (!pastedText.trim()) {
        setErrorMessage("Veuillez coller le texte ou le tableau de l'emploi du temps.");
        return;
      }
      textPayload = pastedText;
    } else if (activeTab === 'DEMO') {
      imagePayload = sampleTimetableSvg;
      textPayload = sampleTimetableText;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const targetClassObj = classes.find(c => c.id === selectedClassId);

      const response = await clientFetch('/api/ai/scan-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: imagePayload,
          textContent: textPayload,
          targetClassName: targetClassObj?.name || '3ème A',
          targetClassLevel: targetClassObj?.level || 'Secondaire',
          availableSubjects: subjects.map(s => ({ id: s.id, name: s.name, code: s.code })),
          availableTeachers: teachers.map(t => ({ id: t.id, lastName: t.lastName, firstName: t.firstName, specialty: t.specialty }))
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const slotsList = Array.isArray(data.slots) ? data.slots : [];
      setExtractedSlots(slotsList);
      setExtractionSummary(data.summary || `${slotsList.length} cours détectés`);
      setDetectedClassName(data.detectedClassName || targetClassObj?.name || null);
      setConfidenceScore(data.confidenceScore || 95);

      // Auto-match class if detected class matches one in database
      if (data.detectedClassName) {
        const found = classes.find(c => 
          c.name.toLowerCase().trim() === data.detectedClassName.toLowerCase().trim() ||
          c.name.toLowerCase().includes(data.detectedClassName.toLowerCase().trim())
        );
        if (found) {
          setSelectedClassId(found.id);
        }
      }
    } catch (err: any) {
      console.error("Erreur Scan OCR Timetable:", err);
      setErrorMessage(err.message || "Impossible de numériser l'emploi du temps. Veuillez vérifier le document et réessayer.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply slots to store and database
  const handleApplyToClass = () => {
    if (!selectedClassId) {
      setErrorMessage("Veuillez sélectionner la classe à laquelle attribuer cet emploi du temps.");
      return;
    }

    if (extractedSlots.length === 0) {
      setErrorMessage("Aucun cours à enregistrer.");
      return;
    }

    // Convert and save
    const formattedSlots: Omit<TimetableSlot, 'id' | 'classId'>[] = extractedSlots.map(slot => {
      // Find subject match
      let sbjId = slot.subjectId;
      if (!sbjId && slot.customSubject) {
        const foundSbj = subjects.find(s => 
          s.name.toLowerCase().trim() === slot.customSubject.toLowerCase().trim() ||
          s.code.toLowerCase().trim() === slot.customSubject.toLowerCase().trim()
        );
        if (foundSbj) sbjId = foundSbj.id;
      }

      // Find teacher match
      let tchId = slot.teacherId;
      if (!tchId && slot.customTeacher) {
        const foundTch = teachers.find(t => 
          `${t.lastName} ${t.firstName}`.toLowerCase().includes(slot.customTeacher!.toLowerCase().trim()) ||
          slot.customTeacher!.toLowerCase().includes(t.lastName.toLowerCase().trim())
        );
        if (foundTch) tchId = foundTch.id;
      }

      return {
        dayOfWeek: slot.dayOfWeek || slot.day || 'Lundi',
        day: slot.dayOfWeek || slot.day || 'Lundi',
        startTime: slot.startTime || '08h00',
        endTime: slot.endTime || '10h00',
        customSubject: slot.customSubject,
        subjectId: sbjId,
        customTeacher: slot.customTeacher,
        teacherId: tchId,
        room: slot.room || currentClass?.roomNumber || 'Salle 101',
        roomNumber: slot.room || currentClass?.roomNumber || 'Salle 101',
        notes: slot.notes || ''
      };
    });

    replaceClassTimetable(selectedClassId, formattedSlots);
    setIsSaveSuccess(true);

    if (onTimetableApplied) {
      onTimetableApplied(selectedClassId, formattedSlots.length);
    }

    setTimeout(() => {
      setIsSaveSuccess(false);
      onClose();
    }, 1500);
  };

  const handleUpdateSlotField = (index: number, field: keyof ExtractedSlot, value: string) => {
    setExtractedSlots(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleDeleteSlot = (index: number) => {
    setExtractedSlots(prev => prev.filter((_, i) => i !== index));
  };

  const daysOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 border border-blue-400/40 rounded-2xl text-blue-300">
              <ScanLine className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black tracking-tight">Scanner un Emploi du Temps (OCR IA)</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-extrabold text-[10px] uppercase">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-xs text-blue-200/80 font-medium">
                Numérisez une photo, un tableau ou du texte : l'IA extrait tous les cours et remplit automatiquement les cases de la classe.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Success Banner */}
          {isSaveSuccess && (
            <div className="p-4 bg-emerald-500 text-white rounded-2xl flex items-center space-x-3 shadow-lg animate-in slide-in-from-top">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <div>
                <p className="font-extrabold text-sm">Emploi du temps appliqué avec succès !</p>
                <p className="text-xs opacity-90">Toutes les cases horaires de la classe <span className="underline">{currentClass?.name}</span> ont été renseignées automatiquement.</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl flex items-start space-x-2 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Target Class Selector */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  1. Classe de Destination à Remplir *
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-[11px] font-bold text-slate-500">Attribuer à :</label>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 font-black text-xs text-blue-950 dark:text-blue-200 shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      🏫 {c.name} ({c.level || 'Secondaire'} - {c.roomNumber || 'Salle 101'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {detectedClassName && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-between">
                <span>🎯 Classe détectée dans le document : <strong>{detectedClassName}</strong></span>
                {detectedClassName.toLowerCase().includes(currentClass?.name.toLowerCase()) ? (
                  <span className="text-emerald-600 font-extrabold flex items-center space-x-1">
                    <Check className="h-3.5 w-3.5" />
                    <span>Correspondance exacte</span>
                  </span>
                ) : (
                  <span className="text-amber-600 text-[10px]">Vérifiez la classe sélectionnée ci-dessus</span>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Document Input Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center space-x-2">
                <Upload className="h-4 w-4 text-indigo-600" />
                <span>2. Source du Document / Photo</span>
              </label>

              {/* Mode Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('IMAGE')}
                  className={`px-3 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                    activeTab === 'IMAGE'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Photo / Scan Image
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('TEXT')}
                  className={`px-3 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                    activeTab === 'TEXT'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Texte / Copier-Coller
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('DEMO');
                    setImagePreview(sampleTimetableSvg);
                  }}
                  className={`px-3 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                    activeTab === 'DEMO'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
                  }`}
                >
                  ⚡ Démo Rapide
                </button>
              </div>
            </div>

            {/* Tab 1: Image / Photo Upload */}
            {activeTab === 'IMAGE' && (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-3xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="relative inline-block max-h-56 overflow-hidden rounded-2xl border border-slate-200 shadow-md">
                      <img src={imagePreview} alt="Aperçu Emploi du temps" className="max-h-56 w-auto object-contain mx-auto" />
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                      Cliquez ou glissez une autre photo pour remplacer l'image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Camera className="h-6 w-6" />
                    </div>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                      Cliquez pour choisir une photo ou glissez-déposez le fichier ici
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Prend en charge les photos de tableau, copies imprimées, captures d'écran (JPG, PNG, WebP)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Text / Paste */}
            {activeTab === 'TEXT' && (
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder="Collez ici le texte brut de l'emploi du temps ou la liste des cours par jour (ex: Lundi 08h-10h Maths M. KPANOU, 10h15-12h15 Français...)"
                  className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  Astuce : Vous pouvez copier-coller directement depuis WhatsApp, Word, Excel ou un email.
                </p>
              </div>
            )}

            {/* Tab 3: Demo */}
            {activeTab === 'DEMO' && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-300 font-extrabold">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Exemple d'Emploi du Temps Officiel (Afrique Francophone) prêt à tester</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-blue-200 shadow-sm max-h-44 bg-white">
                  <img src={sampleTimetableSvg} alt="Demo Emploi du Temps" className="w-full object-contain" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Cliquez ci-dessous sur <strong>« Lancer la Numérisation OCR IA »</strong> pour voir l'IA extraire instantanément tous les cours du Lundi au Samedi.
                </p>
              </div>
            )}

            {/* Action Trigger Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleProcessScan}
                disabled={isProcessing}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 active:scale-[0.99] text-white font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Numérisation & Découpage OCR par Gemini 3.7 Flash en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-amber-300" />
                    <span>Lancer la Numérisation & l'Extraction des Cases</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 3: Extracted Slots Preview & Attribution */}
          {extractedSlots.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Résultat de l'Extraction ({extractedSlots.length} cours détectés)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {extractionSummary} • Score de confiance : <strong className="text-emerald-600">{confidenceScore}%</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleApplyToClass}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Attribuer à « {currentClass?.name} » & Remplir la Grille</span>
                </button>
              </div>

              {/* Slots List / Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                      <tr>
                        <th className="p-2.5 font-extrabold text-slate-700 dark:text-slate-300 w-24">Jour</th>
                        <th className="p-2.5 font-extrabold text-slate-700 dark:text-slate-300 w-32">Horaires</th>
                        <th className="p-2.5 font-extrabold text-slate-700 dark:text-slate-300">Matière</th>
                        <th className="p-2.5 font-extrabold text-slate-700 dark:text-slate-300">Enseignant</th>
                        <th className="p-2.5 font-extrabold text-slate-700 dark:text-slate-300 w-24">Salle</th>
                        <th className="p-2.5 font-extrabold text-slate-700 dark:text-slate-300 w-10 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {extractedSlots.map((slot, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-2.5 font-extrabold text-blue-900 dark:text-blue-300">
                            <select
                              value={slot.dayOfWeek || slot.day}
                              onChange={e => handleUpdateSlotField(idx, 'dayOfWeek', e.target.value)}
                              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                            >
                              {daysOrder.map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={slot.startTime}
                                onChange={e => handleUpdateSlotField(idx, 'startTime', e.target.value)}
                                className="w-14 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 text-center text-xs font-bold"
                              />
                              <span>-</span>
                              <input
                                type="text"
                                value={slot.endTime}
                                onChange={e => handleUpdateSlotField(idx, 'endTime', e.target.value)}
                                className="w-14 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 text-center text-xs font-bold"
                              />
                            </div>
                          </td>
                          <td className="p-2.5 font-extrabold text-slate-900 dark:text-white">
                            <input
                              type="text"
                              value={slot.customSubject}
                              onChange={e => handleUpdateSlotField(idx, 'customSubject', e.target.value)}
                              className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                            />
                          </td>
                          <td className="p-2.5 text-slate-700 dark:text-slate-300">
                            <input
                              type="text"
                              value={slot.customTeacher || ''}
                              onChange={e => handleUpdateSlotField(idx, 'customTeacher', e.target.value)}
                              placeholder="Nom Enseignant"
                              className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                            />
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400">
                            <input
                              type="text"
                              value={slot.room || ''}
                              onChange={e => handleUpdateSlotField(idx, 'room', e.target.value)}
                              placeholder="Salle"
                              className="w-20 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteSlot(idx)}
                              className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                              title="Retirer ce cours"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Final Action */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setExtractedSlots([])}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 text-xs font-bold underline cursor-pointer"
                >
                  Réinitialiser l'extraction
                </button>

                <button
                  type="button"
                  onClick={handleApplyToClass}
                  className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-xs sm:text-sm flex items-center space-x-2 shadow-xl shadow-emerald-600/30 cursor-pointer"
                >
                  <span>Confirmer & Remplir Automatiquement la Classe {currentClass?.name}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
