import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  KeyRound,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  BookOpen,
  Layers,
  ArrowRight,
  FileText,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Lock,
  Unlock,
  Zap,
  Edit3
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { School, SchoolClass, SchoolLevel, TuitionTranche } from '../../types';

interface CompleteSchoolSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSchool: School;
  onNavigate?: (view: string) => void;
}

export function CompleteSchoolSetupModal({
  isOpen,
  onClose,
  targetSchool,
  onNavigate
}: CompleteSchoolSetupModalProps) {
  const {
    updateSchool,
    switchSchool,
    unlockSchool,
    currentSchoolId,
    classes: currentClasses
  } = useApp();

  const [activeTab, setActiveTab] = useState<'classes' | 'tranches' | 'security'>('classes');

  // Local state for editable fields
  const [passwordInput, setPasswordInput] = useState(targetSchool.accessPassword || '12345678');
  const [isPasswordProtected, setIsPasswordProtected] = useState(
    targetSchool.isPasswordProtected ?? false
  );

  // Local state for classes list
  const [classList, setClassList] = useState<SchoolClass[]>([]);

  // Local state for new class input form
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState<SchoolLevel>('PRIMAIRE');
  const [newClassStream, setNewClassStream] = useState('Général');
  const [newClassTuitionFee, setNewClassTuitionFee] = useState<number>(50000);
  const [newClassRegFee, setNewClassRegFee] = useState<number>(10000);

  // Global tranches template state
  const [tranches, setTranches] = useState<TuitionTranche[]>([
    {
      id: 'tr-1',
      name: '1ère Tranche (Rentrée & Inscription)',
      amount: 25000,
      dueDate: '2025-10-15',
      description: 'À régler lors de l\'inscription ou au premier mois'
    },
    {
      id: 'tr-2',
      name: '2ème Tranche (Deuxième Trimestre)',
      amount: 15000,
      dueDate: '2026-01-15',
      description: 'Échéance mi-Janvier'
    },
    {
      id: 'tr-3',
      name: '3ème Tranche (Troisième Trimestre)',
      amount: 10000,
      dueDate: '2026-04-15',
      description: 'Échéance mi-Avril'
    }
  ]);

  const [newTrancheName, setNewTrancheName] = useState('');
  const [newTrancheAmount, setNewTrancheAmount] = useState<number>(15000);
  const [newTrancheDueDate, setNewTrancheDueDate] = useState('');

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Load classes from storage for targetSchool when opened
  useEffect(() => {
    if (!isOpen || !targetSchool) return;

    setPasswordInput(targetSchool.accessPassword || '12345678');
    setIsPasswordProtected(targetSchool.isPasswordProtected ?? false);

    // If targetSchool is currently active school, use currentClasses from store
    const isCurrent = targetSchool.id === currentSchoolId;
    let loadedClasses: SchoolClass[] = [];

    if (isCurrent) {
      loadedClasses = currentClasses;
    } else {
      const savedKey = `GESTIONNAIRE_SCOLAIRE_DATA_${targetSchool.id}_CLASSES`;
      const raw = localStorage.getItem(savedKey);
      if (raw) {
        try {
          loadedClasses = JSON.parse(raw);
        } catch {
          loadedClasses = [];
        }
      }
    }

    if (loadedClasses.length > 0) {
      setClassList(loadedClasses);
    } else {
      // Default initial classes for new school (CI jusqu'en Terminale)
      const defaultInitial: SchoolClass[] = [
        { id: `cls-${Date.now()}-1`, name: 'CI (Cours Initiatique)', level: 'PRIMAIRE', stream: 'Primaire', room: 'Salle 1', capacity: 50, studentCount: 0, tuitionFee: 40000, registrationFee: 10000 },
        { id: `cls-${Date.now()}-2`, name: 'CP (Cours Préparatoire)', level: 'PRIMAIRE', stream: 'Primaire', room: 'Salle 2', capacity: 50, studentCount: 0, tuitionFee: 40000, registrationFee: 10000 },
        { id: `cls-${Date.now()}-3`, name: 'CE1 (Cours Élémentaire 1)', level: 'PRIMAIRE', stream: 'Primaire', room: 'Salle 3', capacity: 50, studentCount: 0, tuitionFee: 45000, registrationFee: 10000 },
        { id: `cls-${Date.now()}-4`, name: 'CE2 (Cours Élémentaire 2)', level: 'PRIMAIRE', stream: 'Primaire', room: 'Salle 4', capacity: 50, studentCount: 0, tuitionFee: 45000, registrationFee: 10000 },
        { id: `cls-${Date.now()}-5`, name: 'CM1 (Cours Moyen 1)', level: 'PRIMAIRE', stream: 'Primaire', room: 'Salle 5', capacity: 50, studentCount: 0, tuitionFee: 50000, registrationFee: 10000 },
        { id: `cls-${Date.now()}-6`, name: 'CM2 (Classe d\'Examen CEP)', level: 'PRIMAIRE', stream: 'Primaire Examen', room: 'Salle 6', capacity: 50, studentCount: 0, tuitionFee: 55000, registrationFee: 10000 },
        { id: `cls-${Date.now()}-7`, name: '6ème Générale', level: 'COLLEGE', stream: 'Général', room: 'Salle C1', capacity: 60, studentCount: 0, tuitionFee: 65000, registrationFee: 15000 },
        { id: `cls-${Date.now()}-8`, name: '5ème Générale', level: 'COLLEGE', stream: 'Général', room: 'Salle C2', capacity: 60, studentCount: 0, tuitionFee: 70000, registrationFee: 15000 },
        { id: `cls-${Date.now()}-9`, name: '4ème Générale', level: 'COLLEGE', stream: 'Général', room: 'Salle C3', capacity: 60, studentCount: 0, tuitionFee: 75000, registrationFee: 15000 },
        { id: `cls-${Date.now()}-10`, name: '3ème (Examen BEPC)', level: 'COLLEGE', stream: 'Général Examen', room: 'Salle C4', capacity: 60, studentCount: 0, tuitionFee: 85000, registrationFee: 15000 },
        { id: `cls-${Date.now()}-11`, name: '2nde A (Littéraire)', level: 'LYCEE', stream: 'Littéraire', room: 'Salle L1', capacity: 60, studentCount: 0, tuitionFee: 95000, registrationFee: 20000 },
        { id: `cls-${Date.now()}-12`, name: '2nde C (Scientifique)', level: 'LYCEE', stream: 'Scientifique', room: 'Salle L2', capacity: 60, studentCount: 0, tuitionFee: 100000, registrationFee: 20000 },
        { id: `cls-${Date.now()}-13`, name: '2nde G2 (Technique & Gestion)', level: 'LYCEE', stream: 'Technique G2', room: 'Salle G1', capacity: 60, studentCount: 0, tuitionFee: 105000, registrationFee: 20000 },
        { id: `cls-${Date.now()}-14`, name: '1ère A4 (Littéraire)', level: 'LYCEE', stream: 'Littéraire', room: 'Salle L3', capacity: 60, studentCount: 0, tuitionFee: 105000, registrationFee: 20000 },
        { id: `cls-${Date.now()}-15`, name: '1ère D (Scientifique SVT)', level: 'LYCEE', stream: 'Scientifique', room: 'Salle L4', capacity: 60, studentCount: 0, tuitionFee: 110000, registrationFee: 20000 },
        { id: `cls-${Date.now()}-16`, name: '1ère C (Maths & Physiques)', level: 'LYCEE', stream: 'Scientifique', room: 'Salle L5', capacity: 60, studentCount: 0, tuitionFee: 110000, registrationFee: 20000 },
        { id: `cls-${Date.now()}-17`, name: '1ère G2 (Technique - Comptabilité & Gestion)', level: 'LYCEE', stream: 'Technique G2', room: 'Salle G2', capacity: 60, studentCount: 0, tuitionFee: 115000, registrationFee: 20000 },
        { id: `cls-${Date.now()}-18`, name: 'Tle A4 (Bac Littéraire)', level: 'LYCEE', stream: 'Examen BAC', room: 'Salle T1', capacity: 60, studentCount: 0, tuitionFee: 125000, registrationFee: 20000 },
        { id: `cls-${Date.now()}-19`, name: 'Tle B (Bac Économique)', level: 'LYCEE', stream: 'Examen BAC', room: 'Salle T2', capacity: 60, studentCount: 0, tuitionFee: 125000, registrationFee: 20000 },
        { id: `cls-${Date.now()}-20`, name: 'Tle C (Bac Mathématiques & PC)', level: 'LYCEE', stream: 'Examen BAC', room: 'Salle T3', capacity: 60, studentCount: 0, tuitionFee: 135000, registrationFee: 20000 },
        { id: `cls-${Date.now()}-21`, name: 'Tle D (Bac Scientifique SVT)', level: 'LYCEE', stream: 'Examen BAC', room: 'Salle T4', capacity: 60, studentCount: 0, tuitionFee: 130000, registrationFee: 20000 },
        { id: `cls-${Date.now()}-22`, name: 'Tle G2 (Bac Technique - Gestion & Comptabilité)', level: 'LYCEE', stream: 'Examen BAC G2', room: 'Salle G3', capacity: 60, studentCount: 0, tuitionFee: 135000, registrationFee: 20000 }
      ];
      setClassList(defaultInitial);
    }
  }, [isOpen, targetSchool, currentSchoolId, currentClasses]);

  if (!isOpen || !targetSchool) return null;

  // Add Preset Packs
  const handleAddPresetPack = (packType: 'PRIMAIRE' | 'COLLEGE' | 'LYCEE' | 'MATERNELLE' | 'TECHNIQUE_G2') => {
    let presets: Omit<SchoolClass, 'id'>[] = [];
    if (packType === 'MATERNELLE') {
      presets = [
        { name: 'Petite Section Maternelle', level: 'MATERNELLE', stream: 'Maternelle', room: 'Bât. Mat A', capacity: 40, studentCount: 0, tuitionFee: 50000, registrationFee: 10000 },
        { name: 'Moyenne Section Maternelle', level: 'MATERNELLE', stream: 'Maternelle', room: 'Bât. Mat B', capacity: 40, studentCount: 0, tuitionFee: 50000, registrationFee: 10000 },
        { name: 'Grande Section Maternelle', level: 'MATERNELLE', stream: 'Maternelle', room: 'Bât. Mat C', capacity: 40, studentCount: 0, tuitionFee: 50000, registrationFee: 10000 }
      ];
    } else if (packType === 'PRIMAIRE') {
      presets = [
        { name: 'CI (Cours Initiatique)', level: 'PRIMAIRE', stream: 'Primaire', room: 'Salle A1', capacity: 50, studentCount: 0, tuitionFee: 40000, registrationFee: 10000 },
        { name: 'CP (Cours Préparatoire)', level: 'PRIMAIRE', stream: 'Primaire', room: 'Salle A2', capacity: 50, studentCount: 0, tuitionFee: 40000, registrationFee: 10000 },
        { name: 'CE1 (Cours Élémentaire 1)', level: 'PRIMAIRE', stream: 'Primaire', room: 'Salle A3', capacity: 50, studentCount: 0, tuitionFee: 45000, registrationFee: 10000 },
        { name: 'CE2 (Cours Élémentaire 2)', level: 'PRIMAIRE', stream: 'Primaire', room: 'Salle A4', capacity: 50, studentCount: 0, tuitionFee: 45000, registrationFee: 10000 },
        { name: 'CM1 (Cours Moyen 1)', level: 'PRIMAIRE', stream: 'Primaire', room: 'Salle A5', capacity: 50, studentCount: 0, tuitionFee: 50000, registrationFee: 10000 },
        { name: 'CM2 (Classe d\'Examen CEP)', level: 'PRIMAIRE', stream: 'Primaire Examen', room: 'Salle A6', capacity: 50, studentCount: 0, tuitionFee: 55000, registrationFee: 10000 }
      ];
    } else if (packType === 'COLLEGE') {
      presets = [
        { name: '6ème Général', level: 'COLLEGE', stream: 'Général', room: 'Salle C1', capacity: 60, studentCount: 0, tuitionFee: 65000, registrationFee: 15000 },
        { name: '5ème Général', level: 'COLLEGE', stream: 'Général', room: 'Salle C2', capacity: 60, studentCount: 0, tuitionFee: 70000, registrationFee: 15000 },
        { name: '4ème Général', level: 'COLLEGE', stream: 'Général', room: 'Salle C3', capacity: 60, studentCount: 0, tuitionFee: 75000, registrationFee: 15000 },
        { name: '3ème BEPC', level: 'COLLEGE', stream: 'Examen', room: 'Salle C4', capacity: 60, studentCount: 0, tuitionFee: 85000, registrationFee: 15000 }
      ];
    } else if (packType === 'LYCEE') {
      presets = [
        { name: '2nde A (Littéraire)', level: 'LYCEE', stream: 'Littéraire', room: 'Salle L1', capacity: 60, studentCount: 0, tuitionFee: 95000, registrationFee: 20000 },
        { name: '2nde C (Scientifique)', level: 'LYCEE', stream: 'Scientifique', room: 'Salle L2', capacity: 60, studentCount: 0, tuitionFee: 100000, registrationFee: 20000 },
        { name: '2nde S (Sciences Générales)', level: 'LYCEE', stream: 'Scientifique', room: 'Salle L3', capacity: 60, studentCount: 0, tuitionFee: 100000, registrationFee: 20000 },
        { name: '2nde G2 (Technique - Gestion & Comptabilité)', level: 'LYCEE', stream: 'Technique G2', room: 'Salle G1', capacity: 60, studentCount: 0, tuitionFee: 105000, registrationFee: 20000 },
        { name: '1ère A4 (Littéraire & Philo)', level: 'LYCEE', stream: 'Littéraire', room: 'Salle L4', capacity: 60, studentCount: 0, tuitionFee: 105000, registrationFee: 20000 },
        { name: '1ère C (Maths & Physique)', level: 'LYCEE', stream: 'Scientifique', room: 'Salle L5', capacity: 60, studentCount: 0, tuitionFee: 110000, registrationFee: 20000 },
        { name: '1ère D (Sciences de la Vie & Terre)', level: 'LYCEE', stream: 'Scientifique', room: 'Salle L6', capacity: 60, studentCount: 0, tuitionFee: 110000, registrationFee: 20000 },
        { name: '1ère G2 (Technique - Comptabilité & Gestion)', level: 'LYCEE', stream: 'Technique G2', room: 'Salle G2', capacity: 60, studentCount: 0, tuitionFee: 115000, registrationFee: 20000 },
        { name: 'Tle A4 (Baccalauréat Littéraire)', level: 'LYCEE', stream: 'Examen BAC', room: 'Salle T1', capacity: 60, studentCount: 0, tuitionFee: 125000, registrationFee: 20000 },
        { name: 'Tle B (Baccalauréat Économique)', level: 'LYCEE', stream: 'Examen BAC', room: 'Salle T2', capacity: 60, studentCount: 0, tuitionFee: 125000, registrationFee: 20000 },
        { name: 'Tle C (Baccalauréat Maths & PC)', level: 'LYCEE', stream: 'Examen BAC', room: 'Salle T3', capacity: 60, studentCount: 0, tuitionFee: 135000, registrationFee: 20000 },
        { name: 'Tle D (Baccalauréat Biologie/Chimie)', level: 'LYCEE', stream: 'Examen BAC', room: 'Salle T4', capacity: 60, studentCount: 0, tuitionFee: 130000, registrationFee: 20000 },
        { name: 'Tle G2 (Bac Technique - Gestion & Comptabilité)', level: 'LYCEE', stream: 'Examen BAC G2', room: 'Salle G3', capacity: 60, studentCount: 0, tuitionFee: 135000, registrationFee: 20000 }
      ];
    } else if (packType === 'TECHNIQUE_G2') {
      presets = [
        { name: '2nde G2 (Technique - Gestion & Comptabilité)', level: 'LYCEE', stream: 'Technique G2', room: 'Salle G1', capacity: 60, studentCount: 0, tuitionFee: 105000, registrationFee: 20000 },
        { name: '1ère G2 (Technique - Comptabilité & Gestion)', level: 'LYCEE', stream: 'Technique G2', room: 'Salle G2', capacity: 60, studentCount: 0, tuitionFee: 115000, registrationFee: 20000 },
        { name: 'Tle G2 (Bac Technique - Gestion & Comptabilité)', level: 'LYCEE', stream: 'Examen BAC G2', room: 'Salle G3', capacity: 60, studentCount: 0, tuitionFee: 135000, registrationFee: 20000 }
      ];
    }

    const newClassesWithIds: SchoolClass[] = presets.map((p, idx) => ({
      ...p,
      id: `cls-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      tranches: tranches
    }));

    // Filter out duplicates by name
    const existingNames = new Set(classList.map(c => c.name.trim().toLowerCase()));
    const filteredToAdd = newClassesWithIds.filter(c => !existingNames.has(c.name.trim().toLowerCase()));

    setClassList(prev => [...prev, ...filteredToAdd]);
  };

  // Add individual custom class
  const handleAddIndividualClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newClassObj: SchoolClass = {
      id: `cls-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: newClassName.trim(),
      level: newClassLevel,
      stream: newClassStream.trim() || 'Général',
      room: 'Salle Principale',
      capacity: 50,
      studentCount: 0,
      tuitionFee: Number(newClassTuitionFee) || 50000,
      registrationFee: Number(newClassRegFee) || 10000,
      tranches: tranches
    };

    setClassList(prev => [...prev, newClassObj]);
    setNewClassName('');
  };

  const handleDeleteClass = (classId: string) => {
    setClassList(prev => prev.filter(c => c.id !== classId));
  };

  const handleUpdateClassTuition = (classId: string, tuitionFee: number, regFee: number) => {
    setClassList(prev =>
      prev.map(c => (c.id === classId ? { ...c, tuitionFee, registrationFee: regFee } : c))
    );
  };

  // Tranches management
  const handleAddTranche = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrancheName.trim()) return;

    const newTr: TuitionTranche = {
      id: `tr-${Date.now()}`,
      name: newTrancheName.trim(),
      amount: Number(newTrancheAmount) || 10000,
      dueDate: newTrancheDueDate || 'À la rentrée'
    };

    const updatedTranches = [...tranches, newTr];
    setTranches(updatedTranches);
    setNewTrancheName('');

    // Attach to all classes
    setClassList(prev => prev.map(c => ({ ...c, tranches: updatedTranches })));
  };

  const handleDeleteTranche = (trancheId: string) => {
    const updatedTranches = tranches.filter(t => t.id !== trancheId);
    setTranches(updatedTranches);

    // Attach to all classes
    setClassList(prev => prev.map(c => ({ ...c, tranches: updatedTranches })));
  };

  // Save all settings and classes to local storage & store
  const saveAllConfiguration = () => {
    const validPwd = passwordInput.trim().length === 8 ? passwordInput.trim() : targetSchool.accessPassword || '12345678';

    // 1. Update School metadata
    updateSchool(targetSchool.id, {
      accessPassword: validPwd,
      isPasswordProtected: isPasswordProtected
    });

    // Unlock school in session
    unlockSchool(targetSchool.id);

    // 2. Attach current tranches to classes that don't have tranches yet
    const finalClasses = classList.map(c => ({
      ...c,
      tranches: c.tranches && c.tranches.length > 0 ? c.tranches : tranches
    }));

    // 3. Save classes to scoped local storage key
    const classStorageKey = `GESTIONNAIRE_SCOLAIRE_DATA_${targetSchool.id}_CLASSES`;
    localStorage.setItem(classStorageKey, JSON.stringify(finalClasses));

    // Save settings / tranches config
    const settingsStorageKey = `GESTIONNAIRE_SCOLAIRE_DATA_${targetSchool.id}_SETTINGS`;
    const existingSettingsRaw = localStorage.getItem(settingsStorageKey);
    let existingSettings = existingSettingsRaw ? JSON.parse(existingSettingsRaw) : {};
    existingSettings.accessPassword = validPwd;
    existingSettings.tuitionTranches = tranches;
    localStorage.setItem(settingsStorageKey, JSON.stringify(existingSettings));

    setSaveSuccessMsg('✅ Informations et tranches de scolarité enregistrées avec succès !');
    return finalClasses;
  };

  // Actions for direct direction to Accounting, Bulletins, or Dashboard
  const handleSaveAndGoToAccounting = () => {
    saveAllConfiguration();
    switchSchool(targetSchool.id);
    unlockSchool(targetSchool.id);
    onClose();
    if (onNavigate) {
      onNavigate('payments');
    }
  };

  const handleSaveAndGoToBulletins = () => {
    saveAllConfiguration();
    switchSchool(targetSchool.id);
    unlockSchool(targetSchool.id);
    onClose();
    if (onNavigate) {
      onNavigate('bulletins');
    }
  };

  const handleSaveAndGoToDashboard = () => {
    saveAllConfiguration();
    switchSchool(targetSchool.id);
    unlockSchool(targetSchool.id);
    onClose();
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/30 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Zap className="h-6 w-6 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wide flex items-center space-x-2">
                <span>⚡ CONFIGURATION COMPLÈTE DE L'ÉCOLE</span>
              </h3>
              <p className="text-xs text-amber-300 font-bold">
                Établissement : <strong className="text-white">{targetSchool.name}</strong> ({targetSchool.city}) • Code ID : <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">{targetSchool.id}</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="p-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'classes'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>1. Liste des Classes ({classList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tranches')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'tranches'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>2. Tranches de Scolarité ({tranches.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <KeyRound className="h-4 w-4" />
              <span>3. Mot de Passe Secret</span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden sm:inline px-2">
            Devise : <strong className="text-slate-900 dark:text-white font-black">{targetSchool.currency || 'FCFA'}</strong>
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {saveSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: LISTE DE CHAQUE CLASSE */}
          {activeTab === 'classes' && (
            <div className="space-y-5">
              {/* Preset Quick Add Buttons */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-300 flex items-center space-x-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>Packs Rapides d'Ajout Automatique de Classes :</span>
                  </h4>
                  <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold">Gagnez du temps en 1 clic</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddPresetPack('MATERNELLE')}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-600 hover:text-white border border-amber-200 dark:border-amber-800 text-xs font-black text-amber-900 dark:text-amber-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Maternelle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddPresetPack('PRIMAIRE')}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:border-emerald-800 text-xs font-black text-emerald-900 dark:text-emerald-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Primaire (CI-CM2)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddPresetPack('COLLEGE')}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-800 text-xs font-black text-blue-900 dark:text-blue-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Collège (6e-3e)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddPresetPack('LYCEE')}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white border border-indigo-200 dark:border-indigo-800 text-xs font-black text-indigo-900 dark:text-indigo-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Lycée Général</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddPresetPack('TECHNIQUE_G2')}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-600 hover:text-white border border-purple-200 dark:border-purple-800 text-xs font-black text-purple-900 dark:text-purple-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Série G2 (Compta)</span>
                  </button>
                </div>
              </div>

              {/* Custom Class Add Form */}
              <form onSubmit={handleAddIndividualClass} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  <span>Ajouter une Classe Personnalisée :</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nom de la Classe *</label>
                    <input
                      type="text"
                      required
                      value={newClassName}
                      onChange={e => setNewClassName(e.target.value)}
                      placeholder="ex: 6ème A, Tle D..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Niveau *</label>
                    <select
                      value={newClassLevel}
                      onChange={e => setNewClassLevel(e.target.value as SchoolLevel)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="MATERNELLE">Maternelle</option>
                      <option value="PRIMAIRE">Primaire</option>
                      <option value="COLLEGE">Collège</option>
                      <option value="LYCEE">Lycée</option>
                      <option value="UNIVERSITE">Université / Supérieur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Frais Annuel Scolarité ({targetSchool.currency || 'FCFA'}) *</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={newClassTuitionFee}
                      onChange={e => setNewClassTuitionFee(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wide cursor-pointer transition-all shadow-md flex items-center justify-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ajouter Classe</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Table / List of Registered Classes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    <span>Classes Enregistrées pour cette École ({classList.length}) :</span>
                  </h4>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    Scolarité Totale Moyenne : {classList.length > 0 ? Math.round(classList.reduce((a, b) => a + (b.tuitionFee || 0), 0) / classList.length).toLocaleString() : 0} {targetSchool.currency || 'FCFA'}
                  </span>
                </div>

                {classList.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
                    Aucune classe configurée pour le moment. Cliquez sur un <strong>Pack Rapide</strong> ci-dessus pour générer les classes.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                    {classList.map((cls, idx) => (
                      <div
                        key={cls.id || idx}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm hover:border-indigo-400 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono font-black text-xs">
                              {cls.name}
                            </span>
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {cls.level}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                            <span>Scolarité : <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{(cls.tuitionFee || 0).toLocaleString()} {targetSchool.currency || 'FCFA'}</strong></span>
                            <span>• Inscription : <strong className="font-mono text-indigo-600 dark:text-indigo-400">{(cls.registrationFee || 10000).toLocaleString()} {targetSchool.currency || 'FCFA'}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteClass(cls.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            title="Supprimer cette classe"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TRANCHES DE SCOLARITÉ & ÉCHÉANCES */}
          {activeTab === 'tranches' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
                <h4 className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  <span>Découpage des Frais de Scolarité en Tranches de Paiement :</span>
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-400">
                  Définissez ici les périodes d'échéances et montants des tranches. Ces données sont directement transmises au module de <strong>Comptabilité & Reçus</strong>.
                </p>
              </div>

              {/* Add Tranche Form */}
              <form onSubmit={handleAddTranche} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Plus className="h-4 w-4 text-amber-500" />
                  <span>Ajouter une Tranche de Paiement / Acompte :</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nom / Libellé de la Tranche *</label>
                    <input
                      type="text"
                      required
                      value={newTrancheName}
                      onChange={e => setNewTrancheName(e.target.value)}
                      placeholder="ex: 1ère Tranche (Rentrée), 2ème Tranche..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date d'Échéance Limite *</label>
                    <input
                      type="date"
                      required
                      value={newTrancheDueDate}
                      onChange={e => setNewTrancheDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wide cursor-pointer transition-all shadow-md flex items-center justify-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ajouter Tranche</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Tranches List */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  <span>Tranches d'Échéance Configurées ({tranches.length}) :</span>
                </h4>

                <div className="space-y-2">
                  {tranches.map((tr, idx) => (
                    <div
                      key={tr.id || idx}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="h-7 w-7 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-black text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <strong className="block text-xs font-black text-slate-900 dark:text-white">
                            {tr.name}
                          </strong>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Période d'Échéance Limite : <strong className="text-amber-700 dark:text-amber-400 font-mono font-bold">{tr.dueDate || 'Non définie'}</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTranche(tr.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        title="Supprimer la tranche"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MOT DE PASSE SECRET DU TABLEAU DE BORD */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <KeyRound className="h-4 w-4 text-emerald-500" />
                  <span>Mot de Passe Secret d'Accès de l'École :</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Mot de passe Secret (Exactement 8 caractères) :
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder="ex: Exc2#202"
                      className="w-full sm:w-80 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-base text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPasswordProtected(!isPasswordProtected)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 transition-all cursor-pointer ${
                        isPasswordProtected
                          ? 'bg-rose-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isPasswordProtected ? (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>🔴 Accès Exige le Mot de Passe</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4" />
                          <span>🟢 Accès Libre Direct Accordé</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold block">🔑 Clé d'Accès Promoteur Attribuée :</span>
                <code className="font-mono text-sm font-black bg-amber-200 dark:bg-amber-900 px-2 py-1 rounded inline-block text-amber-950 dark:text-amber-100">
                  {targetSchool.validationToken || `PROM-2026-${Math.floor(1000 + Math.random() * 9000)}`}
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer - Action Direct Redirection Buttons */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white border-t border-slate-800 shrink-0 space-y-3">
          <div className="text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center space-x-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span>⚡ ENREGISTRER ET DIRIger DIRECTEMENT VERS UN MODULE :</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Button 1: Comptabilité */}
            <button
              type="button"
              onClick={handleSaveAndGoToAccounting}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 cursor-pointer transition-all transform hover:scale-[1.02]"
            >
              <CreditCard className="h-4 w-4" />
              <span>💳 Aller à la Comptabilité</span>
            </button>

            {/* Button 2: Bulletins */}
            <button
              type="button"
              onClick={handleSaveAndGoToBulletins}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer transition-all transform hover:scale-[1.02]"
            >
              <FileText className="h-4 w-4" />
              <span>📊 Générer les Bulletins</span>
            </button>

            {/* Button 3: Dashboard */}
            <button
              type="button"
              onClick={handleSaveAndGoToDashboard}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer transition-all"
            >
              <Building2 className="h-4 w-4 text-amber-400" />
              <span>🚀 Ouvrir le Tableau</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
