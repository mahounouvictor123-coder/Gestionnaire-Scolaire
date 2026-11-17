import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../lib/store';
import { SchoolLevel, Student } from '../../types';
import { StudentPhotoPicker, getDefaultAvatar } from '../StudentPhotoPicker';
import { clientFetch } from '../../services/clientFetch.ts';
import {
  parseStudentRosterText,
  cleanTitleCase,
  extractRosterTextFromFile
} from '../../lib/rosterParser';
import { 
  X, 
  UserPlus, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  ClipboardList, 
  ArrowDownAZ, 
  ArrowUpAZ, 
  Check, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  Layers,
  HelpCircle,
  Users,
  Camera,
  Image as ImageIcon,
  Upload,
  AlertCircle
} from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClassId?: string;
  initialMode?: 'SINGLE' | 'BULK_PASTE';
}

interface ParsedRow {
  id: string;
  registrationNumber: string;
  lastName: string;
  firstName: string;
  gender: 'M' | 'F';
  dateOfBirth: string;
  placeOfBirth: string;
  parentName: string;
  parentPhone: string;
  bloodGroup: string;
  photoUrl: string;
  selected: boolean;
}

function parsePastedTextLocally(rawText: string): ParsedRow[] {
  const parsed = parseStudentRosterText(rawText);
  const rows: ParsedRow[] = parsed.map((s, i) => ({
    id: `parsed-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    registrationNumber: s.registrationNumber || '',
    lastName: s.lastName,
    firstName: s.firstName,
    gender: s.gender,
    dateOfBirth: s.dateOfBirth,
    placeOfBirth: s.placeOfBirth || 'Cotonou',
    parentName: s.parentName || (s.lastName ? `M./Mme ${s.lastName}` : 'Parent / Tuteur'),
    parentPhone: s.parentPhone || '+229 97 00 00 00',
    bloodGroup: s.bloodGroup || 'O+',
    photoUrl: getDefaultAvatar(s.gender),
    selected: true
  }));

  // Tri alphabétique strict (A-Z par Nom puis Prénom)
  return rows.sort((a, b) =>
    a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) ||
    a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' })
  );
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ 
  isOpen, 
  onClose, 
  initialClassId,
  initialMode = 'SINGLE'
}) => {
  const { classes, addStudent, addBulkStudents } = useApp();

  const [mode, setMode] = useState<'SINGLE' | 'BULK_PASTE'>(initialMode);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Escape key handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Single Student State
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [classId, setClassId] = useState(initialClassId || classes[0]?.id || '');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [parentPhone, setParentPhone] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [parentName, setParentName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('2014-06-15');
  const [placeOfBirth, setPlaceOfBirth] = useState('Cotonou');
  const [parentEmail, setParentEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [photoUrl, setPhotoUrl] = useState(() => getDefaultAvatar('M'));
  const [isPhotoCustomized, setIsPhotoCustomized] = useState(false);

  // Bulk Paste State
  const [pastedText, setPastedText] = useState('');
  const [parsedStudents, setParsedStudents] = useState<ParsedRow[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [bulkErrorMessage, setBulkErrorMessage] = useState<string | null>(null);
  const [singleErrorMessage, setSingleErrorMessage] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Quick edit photo for a single parsed row in bulk mode
  const [rowEditingPhotoId, setRowEditingPhotoId] = useState<string | null>(null);

  // Sync mode & initialClassId when opening modal
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      if (initialClassId) {
        setClassId(initialClassId);
      } else if (!classId && classes[0]?.id) {
        setClassId(classes[0].id);
      }
      setBulkErrorMessage(null);
      setSingleErrorMessage(null);
    }
  }, [isOpen, initialMode, initialClassId, classes]);

  if (!isOpen) return null;

  // Filter classes based on selected level
  const filteredClasses = selectedLevel === 'ALL'
    ? classes
    : classes.filter(c => c.level === selectedLevel);

  const selectedClassObj = classes.find(c => c.id === classId) || classes[0];

  // Level change handler
  const handleLevelChange = (newLevel: string) => {
    setSelectedLevel(newLevel);
    const availableClasses = newLevel === 'ALL' 
      ? classes 
      : classes.filter(c => c.level === newLevel);
    
    if (availableClasses.length > 0) {
      setClassId(availableClasses[0].id);
    }
  };

  // Gender change handler
  const handleGenderChange = (newGender: 'M' | 'F') => {
    setGender(newGender);
    // If photo hasn't been explicitly custom uploaded, update default avatar to match gender
    if (!isPhotoCustomized) {
      setPhotoUrl(getDefaultAvatar(newGender));
    }
  };

  // 1. Single Student Submit
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim() || !firstName.trim() || !parentPhone.trim()) {
      setSingleErrorMessage("Veuillez remplir le Nom, Prénom et Numéro du parent.");
      return;
    }
    setSingleErrorMessage(null);

    const autoParentName = parentName.trim() || `M./Mme ${lastName.toUpperCase()}`;

    addStudent({
      ...(registrationNumber.trim() ? { registrationNumber: registrationNumber.trim().toUpperCase() } : {}),
      firstName: firstName.trim(),
      lastName: lastName.trim().toUpperCase(),
      gender,
      dateOfBirth,
      placeOfBirth,
      level: selectedClassObj?.level || 'PRIMAIRE',
      classId: classId || classes[0]?.id || 'cls-1',
      parentName: autoParentName,
      parentPhone: parentPhone.trim(),
      parentEmail,
      address: address || 'Résidence Principale',
      photoUrl: photoUrl || getDefaultAvatar(gender),
      status: 'ACTIF',
      enrollmentDate: new Date().toISOString().split('T')[0],
      bloodGroup
    } as any);

    setRegistrationNumber('');
    setLastName('');
    setFirstName('');
    setParentPhone('');
    setIsPhotoCustomized(false);
    setPhotoUrl(getDefaultAvatar('M'));
    onClose();
  };

  // Import file (.csv, .tsv, .txt, .docx) directly into Bulk Paste
  const handleBulkFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkErrorMessage(null);
    setAiSuccessMessage(null);

    try {
      const extractedText = await extractRosterTextFromFile(file);
      if (!extractedText.trim()) {
        setBulkErrorMessage(`Le fichier "${file.name}" semble vide ou illisible.`);
        return;
      }
      setPastedText(extractedText);
      const parsed = parsePastedTextLocally(extractedText);
      setParsedStudents(parsed);
      setSortOrder('ASC');
      if (parsed.length > 0) {
        const withMat = parsed.filter(p => p.registrationNumber).length;
        setAiSuccessMessage(
          `✅ Fichier "${file.name}" importé : ${parsed.length} élève(s) extrait(s) (${withMat} avec matricule) et classé(s) champ par champ (A ➔ Z).`
        );
      } else {
        setBulkErrorMessage("Aucune ligne élève valide n'a pu être extraite de ce fichier.");
      }
    } catch (err) {
      console.error('Erreur import fichier liste:', err);
      setBulkErrorMessage(`Impossible de lire le fichier "${file.name}". Utilisez un fichier .CSV, .TXT ou .DOCX.`);
    } finally {
      e.target.value = '';
    }
  };

  // 2. Local Instant Parse & Sort
  const handleLocalParse = () => {
    setBulkErrorMessage(null);
    if (!pastedText.trim()) {
      setBulkErrorMessage("Veuillez d'abord coller votre liste d'élèves ou importer un fichier.");
      return;
    }
    const parsed = parsePastedTextLocally(pastedText);
    setParsedStudents(parsed);
    setSortOrder('ASC');
    if (parsed.length === 0) {
      setBulkErrorMessage("Aucun élève valide détecté. Vérifiez le format de votre liste.");
      setAiSuccessMessage(null);
    } else {
      const withMat = parsed.filter(p => p.registrationNumber).length;
      setAiSuccessMessage(
        `✅ ${parsed.length} élève(s) extrait(s) (${withMat} matricule(s) détecté(s)) et trié(s) de A ➔ Z`
      );
    }
  };

  // 3. AI Powered Parse & Sort
  const handleAiParse = async () => {
    setBulkErrorMessage(null);
    if (!pastedText.trim()) {
      setBulkErrorMessage("Veuillez coller le texte ou importer un fichier (Excel, CSV, Word, WhatsApp).");
      return;
    }

    setIsAiProcessing(true);
    setAiSuccessMessage(null);

    try {
      const res = await clientFetch('/api/ai/scan-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: pastedText,
          targetClassName: selectedClassObj?.name || 'Classe Sélectionnée'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.students && Array.isArray(data.students) && data.students.length > 0) {
          const list: ParsedRow[] = data.students.map((s: any, idx: number) => {
            const detectedGender: 'M' | 'F' = (s.gender === 'F' || s.gender === 'f') ? 'F' : 'M';
            const cleanLast = (s.lastName || '').toUpperCase().trim();
            return {
              id: `ai-${Date.now()}-${idx}`,
              registrationNumber: (s.registrationNumber || s.matricule || '').toString().trim().toUpperCase(),
              lastName: cleanLast || 'SANS_NOM',
              firstName: s.firstName ? cleanTitleCase(s.firstName) : '',
              gender: detectedGender,
              dateOfBirth: s.dateOfBirth || '2012-05-15',
              placeOfBirth: s.placeOfBirth || 'Cotonou',
              parentName: s.parentName || (cleanLast ? `M./Mme ${cleanLast}` : 'Parent / Tuteur'),
              parentPhone: s.parentPhone || '+229 97 00 00 00',
              bloodGroup: s.bloodGroup || 'O+',
              photoUrl: getDefaultAvatar(detectedGender),
              selected: true
            };
          });

          // Strict sort A-Z
          const sorted = list.sort((a, b) => 
            a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) ||
            a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' })
          );

          const withMat = sorted.filter(p => p.registrationNumber).length;
          setParsedStudents(sorted);
          setSortOrder('ASC');
          setAiSuccessMessage(
            `✨ Extraction réussie : ${sorted.length} élève(s) classé(s) champ par champ (${withMat} matricule(s) identifié(s)) et trié(s) de A à Z`
          );
          setIsAiProcessing(false);
          return;
        }
      }
      // Fallback local if API doesn't return list
      const localParsed = parsePastedTextLocally(pastedText);
      setParsedStudents(localParsed);
      if (localParsed.length > 0) {
        const withMat = localParsed.filter(p => p.registrationNumber).length;
        setAiSuccessMessage(`✨ ${localParsed.length} élève(s) analysé(s) (${withMat} matricule(s)) et trié(s) de A ➔ Z`);
      } else {
        setBulkErrorMessage("Aucun élève valide n'a été détecté dans ce texte.");
      }
    } catch (err) {
      console.warn("Erreur AI, bascule sur parseur local:", err);
      const localParsed = parsePastedTextLocally(pastedText);
      setParsedStudents(localParsed);
      if (localParsed.length > 0) {
        setAiSuccessMessage(`✨ ${localParsed.length} élève(s) analysé(s) et trié(s) alphabétiquement (A ➔ Z)`);
      } else {
        setBulkErrorMessage("Impossible d'extraire des élèves depuis ce texte.");
      }
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Toggle sorting A-Z vs Z-A
  const handleToggleSort = () => {
    const newOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSortOrder(newOrder);
    setParsedStudents(prev => [...prev].sort((a, b) => {
      const cmp = a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) ||
                  a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' });
      return newOrder === 'ASC' ? cmp : -cmp;
    }));
  };

  // Toggle row selection
  const handleToggleSelectRow = (id: string) => {
    setParsedStudents(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    const allSelected = parsedStudents.every(p => p.selected);
    setParsedStudents(prev => prev.map(p => ({ ...p, selected: !allSelected })));
  };

  // Delete individual row
  const handleDeleteRow = (id: string) => {
    setParsedStudents(prev => prev.filter(p => p.id !== id));
  };

  // Delete all selected rows
  const handleDeleteSelectedRows = () => {
    const count = parsedStudents.filter(p => p.selected).length;
    if (count === 0) return;
    setParsedStudents(prev => prev.filter(p => !p.selected));
  };

  // Update row field
  const handleUpdateRow = (id: string, field: keyof ParsedRow, value: any) => {
    setParsedStudents(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        // If gender changed, update default photo
        if (field === 'gender') {
          updated.photoUrl = getDefaultAvatar(value as 'M' | 'F');
        }
        return updated;
      }
      return p;
    }));
  };

  // Add empty row manually
  const handleAddEmptyRow = () => {
    const newRow: ParsedRow = {
      id: `manual-${Date.now()}`,
      registrationNumber: '',
      lastName: 'NOUVEAU NOM',
      firstName: 'Prénom',
      gender: 'M',
      dateOfBirth: '2012-01-01',
      placeOfBirth: 'Cotonou',
      parentName: 'M./Mme NOUVEAU',
      parentPhone: '+229 97 00 00 00',
      bloodGroup: 'O+',
      photoUrl: getDefaultAvatar('M'),
      selected: true
    };
    setParsedStudents(prev => [...prev, newRow]);
  };

  // Load sample data
  const handleLoadSample = () => {
    const sample = `Matricule ; Nom ; Prénoms ; Sexe ; Date de naissance ; Téléphone Parent
2025-COL-001 ; KOUASSI ; Jean-Marc ; M ; 14/05/2011 ; +229 97 00 11 22
2025-COL-002 ; ADANLETE ; Bérénice ; F ; 22/11/2010 ; +229 95 33 44 55
2025-COL-003 ; DOSSOU ; Landry Emmanuel ; M ; 03/02/2011 ; +229 66 77 88 99
2025-COL-004 ; BOHOUN ; Chimène Aïcha ; F ; 18/08/2011 ; +229 97 10 20 30
2025-COL-005 ; ZINSOU ; Victoria Grace ; F ; 19/12/2010 ; +229 95 66 77 88`;
    setPastedText(sample);
    const parsed = parsePastedTextLocally(sample);
    setParsedStudents(parsed);
    setSortOrder('ASC');
    setBulkErrorMessage(null);
    setAiSuccessMessage(`✅ Exemple chargé : ${parsed.length} élève(s) avec matricules classés chaque information à sa place.`);
  };

  // 4. Save Bulk Students
  const handleSaveBulk = () => {
    setBulkErrorMessage(null);
    const selectedRows = parsedStudents.filter(p => p.selected);
    if (selectedRows.length === 0) {
      setBulkErrorMessage("Veuillez sélectionner au moins un élève à inscrire.");
      return;
    }

    if (!classId) {
      setBulkErrorMessage("Veuillez choisir la classe d'affectation.");
      return;
    }

    // Ensure list is strictly sorted A-Z before bulk insertion
    const sortedToInsert = [...selectedRows].sort((a, b) => 
      a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) ||
      a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' })
    );

    const formattedList = sortedToInsert.map(s => ({
      ...(s.registrationNumber.trim() ? { registrationNumber: s.registrationNumber.trim().toUpperCase() } : {}),
      firstName: s.firstName.trim(),
      lastName: s.lastName.trim().toUpperCase(),
      gender: s.gender,
      dateOfBirth: s.dateOfBirth,
      placeOfBirth: s.placeOfBirth,
      level: selectedClassObj?.level || 'LYCEE',
      classId: classId,
      parentName: s.parentName || `M./Mme ${s.lastName}`,
      parentPhone: s.parentPhone || '+229 97 00 00 00',
      parentEmail: '',
      address: 'Résidence Principale',
      photoUrl: s.photoUrl || getDefaultAvatar(s.gender),
      status: 'ACTIF' as const,
      enrollmentDate: new Date().toISOString().split('T')[0],
      bloodGroup: s.bloodGroup || 'O+'
    }));

    addBulkStudents(formattedList);
    setPastedText('');
    setParsedStudents([]);
    setAiSuccessMessage(null);
    onClose();
  };

  const selectedCount = parsedStudents.filter(p => p.selected).length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full overflow-hidden my-auto flex flex-col transition-all max-h-[94vh] ${
        mode === 'BULK_PASTE' ? 'max-w-5xl' : 'max-w-xl'
      }`}>
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-indigo-700/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-amber-300 border border-white/20">
              {mode === 'BULK_PASTE' ? <ClipboardList className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">
                {mode === 'BULK_PASTE' ? 'Inscription par Copier-Coller (IA & Photos A-Z)' : 'Inscription d\'un Élève avec Photo d\'Identité'}
              </h3>
              <p className="text-xs text-blue-200">
                {mode === 'BULK_PASTE' 
                  ? 'Import massif avec attribution de photos et tri alphabétique instantané' 
                  : 'Prise de photo en direct (webcam), import de fichier ou galerie d\'avatars'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto bg-slate-200/80 dark:bg-slate-900/80 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('SINGLE')}
              className={`px-4 py-2 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                mode === 'SINGLE'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Saisie Unique + Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('BULK_PASTE')}
              className={`px-4 py-2 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                mode === 'BULK_PASTE'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5 text-amber-300" />
              <span>📋 Copier-Coller en Masse (IA)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <Camera className="h-3.5 w-3.5 text-emerald-500" />
            <span>Webcam & Téléversement Inclus</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Destination Class Header (Used for both modes) */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Level / Cycle */}
              <div>
                <label className="block text-[11px] font-black uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                  1. Cycle / Niveau Pédagogique *
                </label>
                <select
                  value={selectedLevel}
                  onChange={e => handleLevelChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                >
                  <option value="ALL">🏫 Tous les Niveaux ({classes.length} classes)</option>
                  <option value="PRIMAIRE">🎒 PRIMAIRE ({classes.filter(c => c.level === 'PRIMAIRE').length} classes)</option>
                  <option value="MATERNELLE">🧸 MATERNELLE ({classes.filter(c => c.level === 'MATERNELLE').length} classes)</option>
                  <option value="COLLEGE">🏫 COLLÈGE ({classes.filter(c => c.level === 'COLLEGE').length} classes)</option>
                  <option value="LYCEE">🎓 LYCÉE ({classes.filter(c => c.level === 'LYCEE').length} classes)</option>
                  <option value="FORMATION">⚙️ FORMATION PRO ({classes.filter(c => c.level === 'FORMATION').length} classes)</option>
                </select>
              </div>

              {/* Destination Class */}
              <div>
                <label className="block text-[11px] font-black uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                  2. Classe d'Affectation *
                </label>
                <select
                  required
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                >
                  {filteredClasses.length === 0 ? (
                    <option value="">Aucune classe dans ce niveau</option>
                  ) : (
                    filteredClasses.map(c => (
                      <option key={c.id} value={c.id}>
                        🏫 {c.name} {c.stream ? `[${c.stream}]` : ''} ({c.level})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MODE 1: SINGLE STUDENT FORM WITH PHOTO PICKER & CAMERA */}
          {/* ========================================================================= */}
          {mode === 'SINGLE' && (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              
              {/* PHOTO PICKER / CAMERA / UPLOAD COMPONENT */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                  3. Photo d'Identité de l'Élève *
                </label>
                <StudentPhotoPicker
                  photoUrl={photoUrl}
                  onChange={(newUrl) => {
                    setPhotoUrl(newUrl);
                    setIsPhotoCustomized(true);
                  }}
                  gender={gender}
                  studentName={`${firstName} ${lastName}`}
                />
              </div>

              {/* IDENTITY FIELDS */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                  4. Identité et Coordonnées de l'Élève
                </label>

                {singleErrorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{singleErrorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Numéro Matricule (Optionnel — Auto-généré si vide)
                  </label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={e => setRegistrationNumber(e.target.value.toUpperCase())}
                    placeholder="ex: 2025-COL-001 ou 2361077"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nom */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Nom de Famille (Majuscules) *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value.toUpperCase())}
                      placeholder="ex: KOUASSI"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-sm focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                  </div>

                  {/* Prénom */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Prénom(s) *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="ex: Jean-Marc"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Sexe */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Sexe (Genre) *
                    </label>
                    <select
                      value={gender}
                      onChange={e => handleGenderChange(e.target.value as 'M' | 'F')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="M">Masculin (Garçon)</option>
                      <option value="F">Féminin (Fille)</option>
                    </select>
                  </div>

                  {/* Téléphone Parent */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Téléphone du Parent / Tuteur *
                    </label>
                    <input
                      type="tel"
                      required
                      value={parentPhone}
                      onChange={e => setParentPhone(e.target.value)}
                      placeholder="ex: +229 97 00 11 22"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm text-emerald-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Advanced Accordion */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <span>⚙️ Informations complémentaires (Date, Lieu de naissance, Groupe Sanguin...)</span>
                  {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in">
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Nom du Tuteur / Parent</label>
                      <input
                        type="text"
                        value={parentName}
                        onChange={e => setParentName(e.target.value)}
                        placeholder={`ex: M. ${lastName || 'KOUASSI'}`}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Date de Naissance</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={e => setDateOfBirth(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Lieu de Naissance</label>
                      <input
                        type="text"
                        value={placeOfBirth}
                        onChange={e => setPlaceOfBirth(e.target.value)}
                        placeholder="ex: Cotonou"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Groupe Sanguin</label>
                      <select
                        value={bloodGroup}
                        onChange={e => setBloodGroup(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Email du Parent</label>
                      <input
                        type="email"
                        value={parentEmail}
                        onChange={e => setParentEmail(e.target.value)}
                        placeholder="ex: parent@gmail.com"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Adresse de Résidence</label>
                      <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="ex: Cotonou, Quartier Akpakpa"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Action */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center space-x-2 cursor-pointer transition-all transform hover:scale-[1.01]"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Valider l'Inscription avec Photo</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: COPIER-COLLER EN MASSE AVEC IA ET TRI ALPHABÉTIQUE */}
          {/* ========================================================================= */}
          {mode === 'BULK_PASTE' && (
            <div className="space-y-4">
              
              {/* Instructions Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start space-x-3 text-xs">
                <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-amber-900 dark:text-amber-200">
                  <p className="font-extrabold">
                    Collez directement le texte copié depuis Excel, Word, un PDF, WhatsApp ou un registre manuscrit.
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    L'algorithme IA sépare automatiquement les Noms et Prénoms, associe des photos d'identité correspondantes aux garçons et filles, puis <strong>trie l'intégralité de la classe par ordre alphabétique strict (A ➔ Z)</strong>.
                  </p>
                </div>
              </div>

              {/* Paste Textarea & File Import */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                    Zone de Copier-Coller ou Import de Fichier (.CSV, .TXT, .DOCX) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      ref={bulkFileInputRef}
                      type="file"
                      accept=".csv,.tsv,.txt,.docx"
                      onChange={handleBulkFileImport}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => bulkFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-black flex items-center space-x-1 hover:bg-blue-100 cursor-pointer"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Importer Fichier (CSV/Word)</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 cursor-pointer"
                    >
                      Exemple avec Matricules
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => { setPastedText(''); setParsedStudents([]); setAiSuccessMessage(null); setBulkErrorMessage(null); }}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      Effacer
                    </button>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder={`Collez votre tableau Excel/Word/CSV (avec ou sans ligne d'en-tête) :\nExemples :\nMatricule ; Nom ; Prénoms ; Sexe ; Date ; Tél\n2025-COL-001 ; ADANLETE ; Jean-Baptiste ; M ; 14/05/2010 ; +229 97 45 12 00\nOu sans en-tête :\n2361077 | KOUASSI | Jean-Marc\n2361078 ADANLETE Bérénice F 22/11/2010`}
                  className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 leading-relaxed shadow-inner"
                />
              </div>

              {/* Action Buttons for Parse & Sort */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAiParse}
                    disabled={isAiProcessing || !pastedText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50 transition-all transform hover:scale-[1.01]"
                  >
                    {isAiProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-amber-300" />
                    )}
                    <span>{isAiProcessing ? 'Analyse & Classement en cours...' : '⚡ Extraire & Classer chaque champ (A ➔ Z)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLocalParse}
                    disabled={!pastedText.trim()}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowDownAZ className="h-4 w-4 text-blue-600" />
                    <span>Extraction Locale Instantanée</span>
                  </button>
                </div>

                {parsedStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleSort}
                    className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-black text-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    {sortOrder === 'ASC' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
                    <span>Ordre : {sortOrder === 'ASC' ? 'A ➔ Z (Croissant)' : 'Z ➔ A (Décroissant)'}</span>
                  </button>
                )}
              </div>

              {/* Error Message */}
              {bulkErrorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{bulkErrorMessage}</span>
                </div>
              )}

              {/* Status Message */}
              {aiSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{aiSuccessMessage}</span>
                </div>
              )}

              {/* Parsed Students Table Preview */}
              {parsedStudents.length > 0 && (
                <div className="space-y-2.5 border-t border-slate-200 dark:border-slate-800 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-900 dark:text-white">
                        {parsedStudents.length} Élève(s) dans la liste ({selectedCount} sélectionné(s))
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-extrabold text-[10px]">
                        Photos + Ordre Alphabétique A-Z
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        {parsedStudents.every(p => p.selected) ? 'Tout décocher' : 'Tout cocher'}
                      </button>
                      {parsedStudents.some(p => p.selected) && (
                        <>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={handleDeleteSelectedRows}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1 cursor-pointer bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800"
                            title="Supprimer les élèves cochés de la liste"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Supprimer cochés ({parsedStudents.filter(p => p.selected).length})</span>
                          </button>
                        </>
                      )}
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleAddEmptyRow}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Ajouter une ligne</span>
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase text-[9px] sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2 w-8 text-center">
                            <input
                              type="checkbox"
                              checked={parsedStudents.length > 0 && parsedStudents.every(p => p.selected)}
                              onChange={handleToggleSelectAll}
                              className="rounded text-indigo-600 cursor-pointer"
                            />
                          </th>
                          <th className="p-2 w-8 text-center">N°</th>
                          <th className="p-2 w-12 text-center">Photo</th>
                          <th className="p-2 w-28">N° Matricule</th>
                          <th className="p-2">Nom de Famille (A-Z)</th>
                          <th className="p-2">Prénom(s)</th>
                          <th className="p-2 w-16">Genre</th>
                          <th className="p-2">Date Naiss.</th>
                          <th className="p-2">Contact Parent</th>
                          <th className="p-2 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {parsedStudents.map((row, idx) => (
                          <tr key={row.id} className={row.selected ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'opacity-40 bg-slate-50 dark:bg-slate-800/20'}>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={() => handleToggleSelectRow(row.id)}
                                className="rounded text-indigo-600 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 text-center font-black text-slate-400">
                              {(idx + 1).toString().padStart(2, '0')}
                            </td>
                            {/* Photo Column */}
                            <td className="p-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => setRowEditingPhotoId(rowEditingPhotoId === row.id ? null : row.id)}
                                className="relative rounded-full overflow-hidden w-8 h-8 mx-auto ring-2 ring-indigo-500/30 hover:ring-indigo-500 cursor-pointer group"
                                title="Changer la photo de cet élève"
                              >
                                <img
                                  src={row.photoUrl}
                                  alt={row.firstName || row.lastName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Camera className="h-3 w-3 text-white" />
                                </div>
                              </button>
                            </td>
                            {/* Matricule Column */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.registrationNumber}
                                placeholder="Auto"
                                onChange={e => handleUpdateRow(row.id, 'registrationNumber', e.target.value.toUpperCase())}
                                className="w-full px-2 py-1 rounded bg-indigo-50/70 dark:bg-indigo-950/40 font-mono font-bold text-[10px] text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase placeholder:text-slate-400"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.lastName}
                                onChange={e => handleUpdateRow(row.id, 'lastName', e.target.value.toUpperCase())}
                                className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 uppercase"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.firstName}
                                placeholder="Prénom(s)"
                                onChange={e => handleUpdateRow(row.id, 'firstName', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={row.gender}
                                onChange={e => handleUpdateRow(row.id, 'gender', e.target.value as 'M' | 'F')}
                                className="w-full px-1 py-1 rounded bg-slate-50 dark:bg-slate-800 font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                              >
                                <option value="M">M</option>
                                <option value="F">F</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="date"
                                value={row.dateOfBirth}
                                onChange={e => handleUpdateRow(row.id, 'dateOfBirth', e.target.value)}
                                className="w-full px-1 py-1 rounded bg-slate-50 dark:bg-slate-800 text-[10px] border border-slate-200 dark:border-slate-700"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.parentPhone}
                                onChange={e => handleUpdateRow(row.id, 'parentPhone', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-emerald-600 border border-slate-200 dark:border-slate-700"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 cursor-pointer"
                                title="Supprimer cette ligne"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Popover for changing photo of an individual row */}
                  {rowEditingPhotoId && (
                    <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-indigo-900 dark:text-indigo-200">
                          Changer la photo de : {parsedStudents.find(p => p.id === rowEditingPhotoId)?.firstName} {parsedStudents.find(p => p.id === rowEditingPhotoId)?.lastName}
                        </span>
                        <button
                          type="button"
                          onClick={() => setRowEditingPhotoId(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <StudentPhotoPicker
                        photoUrl={parsedStudents.find(p => p.id === rowEditingPhotoId)?.photoUrl || ''}
                        onChange={(newPhoto) => {
                          handleUpdateRow(rowEditingPhotoId, 'photoUrl', newPhoto);
                        }}
                        gender={parsedStudents.find(p => p.id === rowEditingPhotoId)?.gender || 'M'}
                        studentName={parsedStudents.find(p => p.id === rowEditingPhotoId)?.firstName}
                      />
                    </div>
                  )}

                </div>
              )}

              {/* Bulk Submit Action */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Fermer
                </button>

                <button
                  type="button"
                  onClick={handleSaveBulk}
                  disabled={parsedStudents.length === 0 || selectedCount === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50 transition-all transform hover:scale-[1.01]"
                >
                  <Check className="h-4 w-4" />
                  <span>
                    Inscrire les {selectedCount} élève(s) avec Photos (Ordre A ➔ Z)
                  </span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
