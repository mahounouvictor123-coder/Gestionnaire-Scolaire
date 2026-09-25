import React, { useState, useMemo } from 'react';
import { useApp } from '../lib/store';
import { SchoolLevel, SchoolClass, TuitionTranche } from '../types';
import { ConfigureClassFeesModal } from '../components/modals/ConfigureClassFeesModal';
import { 
  Building2, 
  Users, 
  Plus, 
  ShieldCheck, 
  DollarSign, 
  ScanLine, 
  Sparkles, 
  Filter, 
  Award,
  Edit2,
  Trash2,
  Copy,
  Search,
  BookOpen,
  CheckCircle2,
  X,
  Layers,
  GraduationCap,
  Calendar,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface ClassesViewProps {
  onNavigateToScanRoster?: (classId?: string) => void;
}

// Comprehensive catalog of African/Francophone high school & technical streams
const POPULAR_SERIES_PRESETS = [
  // Séries Générales
  { label: 'Série A (Littéraire / A4)', stream: 'Série A - Littéraire', level: 'LYCEE' as SchoolLevel, defaultFee: 120000, exam: 'BAC A' },
  { label: 'Série B (Éco & Social)', stream: 'Série B - Économique', level: 'LYCEE' as SchoolLevel, defaultFee: 125000, exam: 'BAC B' },
  { label: 'Série C (Maths & PC)', stream: 'Série C - Mathématiques', level: 'LYCEE' as SchoolLevel, defaultFee: 135000, exam: 'BAC C' },
  { label: 'Série D (Sciences & SVT)', stream: 'Série D - Scientifique', level: 'LYCEE' as SchoolLevel, defaultFee: 130000, exam: 'BAC D' },
  // Séries Techniques & Tertiaires (G & F)
  { label: 'Série G1 (Secrétariat & Bureautique)', stream: 'Technique G1 - Secrétariat', level: 'LYCEE' as SchoolLevel, defaultFee: 130000, exam: 'BAC G1' },
  { label: 'Série G2 (Comptabilité & Gestion)', stream: 'Technique G2 - Gestion/Compta', level: 'LYCEE' as SchoolLevel, defaultFee: 135000, exam: 'BAC G2' },
  { label: 'Série G3 (Techniques Commerciales)', stream: 'Technique G3 - Commerce', level: 'LYCEE' as SchoolLevel, defaultFee: 130000, exam: 'BAC G3' },
  { label: 'Série F1 (Construction Mécanique)', stream: 'Industrielle F1 - Mécanique', level: 'LYCEE' as SchoolLevel, defaultFee: 140000, exam: 'BAC F1' },
  { label: 'Série F2 (Électronique)', stream: 'Industrielle F2 - Électronique', level: 'LYCEE' as SchoolLevel, defaultFee: 140000, exam: 'BAC F2' },
  { label: 'Série F3 (Électrotechnique)', stream: 'Industrielle F3 - Électrotechnique', level: 'LYCEE' as SchoolLevel, defaultFee: 140000, exam: 'BAC F3' },
  { label: 'Série F4 (Génie Civil & Bâtiment)', stream: 'Industrielle F4 - Génie Civil', level: 'LYCEE' as SchoolLevel, defaultFee: 145000, exam: 'BAC F4' },
  { label: 'Série E (Maths & Technologie)', stream: 'Technologique E', level: 'LYCEE' as SchoolLevel, defaultFee: 140000, exam: 'BAC E' },
  { label: 'Série Hôtellerie & Tourisme (HR)', stream: 'Hôtellerie-Restauration', level: 'LYCEE' as SchoolLevel, defaultFee: 150000, exam: 'BAC HR' },
  // Collège & Fondamental
  { label: 'Collège - Tronc Commun', stream: 'Enseignement Général', level: 'COLLEGE' as SchoolLevel, defaultFee: 85000, exam: 'BEPC' },
  { label: 'Primaire - Cursus Général', stream: 'Enseignement Primaire', level: 'PRIMAIRE' as SchoolLevel, defaultFee: 50000, exam: 'CEP' },
  { label: 'Maternelle - Éveil & Petite Enfance', stream: 'Petite / Moyenne / Grande Section', level: 'MATERNELLE' as SchoolLevel, defaultFee: 45000, exam: null }
];

export const ClassesView: React.FC<ClassesViewProps> = ({ onNavigateToScanRoster }) => {
  const { classes, addClass, updateClass, deleteClass, students, teachers, settings } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [targetFeeClassId, setTargetFeeClassId] = useState<string | undefined>(undefined);

  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'ALL' | SchoolLevel | 'G2' | 'TECHNIQUE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Form State
  const [name, setName] = useState('');
  const [level, setLevel] = useState<SchoolLevel>('LYCEE');
  const [stream, setStream] = useState('Série D - Scientifique');
  const [capacity, setCapacity] = useState('60');
  const [roomNumber, setRoomNumber] = useState('Salle 101');
  const [tuitionFee, setTuitionFee] = useState('130000');
  const [tranche1, setTranche1] = useState('52000');
  const [dueDate1, setDueDate1] = useState('30 Novembre');
  const [tranche2, setTranche2] = useState('45500');
  const [dueDate2, setDueDate2] = useState('28 Février');
  const [tranche3, setTranche3] = useState('32500');
  const [dueDate3, setDueDate3] = useState('31 Mai');
  const [mainTeacherId, setMainTeacherId] = useState('');

  const recalculateTranches = (totalVal: number, mode: '40_35_25' | '50_30_20' | '33_33_34' = '40_35_25') => {
    let t1 = 0, t2 = 0, t3 = 0;
    if (mode === '40_35_25') {
      t1 = Math.round(totalVal * 0.4);
      t2 = Math.round(totalVal * 0.35);
      t3 = totalVal - (t1 + t2);
    } else if (mode === '50_30_20') {
      t1 = Math.round(totalVal * 0.5);
      t2 = Math.round(totalVal * 0.3);
      t3 = totalVal - (t1 + t2);
    } else {
      t1 = Math.round(totalVal / 3);
      t2 = Math.round(totalVal / 3);
      t3 = totalVal - (t1 + t2);
    }
    setTranche1(t1.toString());
    setTranche2(t2.toString());
    setTranche3(t3.toString());
  };

  const handleTuitionFeeChange = (valStr: string) => {
    setTuitionFee(valStr);
    const num = parseFloat(valStr) || 0;
    recalculateTranches(num, '40_35_25');
  };

  const openCreateModal = (presetLevel: SchoolLevel = 'LYCEE') => {
    setEditingClassId(null);
    setLevel(presetLevel);
    setName('');
    setStream(presetLevel === 'LYCEE' ? 'Série D - Scientifique' : presetLevel === 'COLLEGE' ? 'Enseignement Général' : 'Général');
    setCapacity('60');
    setRoomNumber(`Salle ${presetLevel.charAt(0)}-1`);
    const initialFee = presetLevel === 'LYCEE' ? 130000 : presetLevel === 'COLLEGE' ? 85000 : 50000;
    setTuitionFee(initialFee.toString());
    recalculateTranches(initialFee, '40_35_25');
    setDueDate1('30 Novembre');
    setDueDate2('28 Février');
    setDueDate3('31 Mai');
    setMainTeacherId(teachers[0]?.id || '');
    setShowModal(true);
  };

  const openEditModal = (cls: SchoolClass) => {
    setEditingClassId(cls.id);
    setName(cls.name);
    setLevel(cls.level);
    setStream(cls.stream || '');
    setCapacity(cls.capacity?.toString() || '60');
    setRoomNumber(cls.room || 'Salle 1');
    const total = cls.tuitionFee || 100000;
    setTuitionFee(total.toString());

    if (cls.tranches && cls.tranches.length >= 3) {
      setTranche1(cls.tranches[0]?.amount?.toString() || Math.round(total * 0.4).toString());
      setDueDate1(cls.tranches[0]?.dueDate || '30 Novembre');
      setTranche2(cls.tranches[1]?.amount?.toString() || Math.round(total * 0.35).toString());
      setDueDate2(cls.tranches[1]?.dueDate || '28 Février');
      setTranche3(cls.tranches[2]?.amount?.toString() || (total - (Number(cls.tranches[0]?.amount || 0) + Number(cls.tranches[1]?.amount || 0))).toString());
      setDueDate3(cls.tranches[2]?.dueDate || '31 Mai');
    } else {
      recalculateTranches(total, '40_35_25');
      setDueDate1('30 Novembre');
      setDueDate2('28 Février');
      setDueDate3('31 Mai');
    }

    setMainTeacherId(cls.mainTeacherId || teachers[0]?.id || '');
    setShowModal(true);
  };

  const handleDuplicate = (cls: SchoolClass) => {
    const newName = `${cls.name} (Section B)`;
    addClass({
      name: newName,
      level: cls.level,
      stream: cls.stream,
      capacity: cls.capacity || 60,
      studentCount: 0,
      mainTeacherId: cls.mainTeacherId || teachers[0]?.id,
      room: `${cls.room || 'Salle'} B`,
      tuitionFee: cls.tuitionFee || 100000,
      tranches: cls.tranches
    });
  };

  const handleDelete = (cls: SchoolClass) => {
    const count = students.filter(s => s.classId === cls.id).length;
    if (count > 0) {
      if (!confirm(`Cette classe contient ${count} élève(s). Êtes-vous sûr de vouloir supprimer la classe "${cls.name}" ? Les élèves perdront leur attribution de classe.`)) {
        return;
      }
    } else {
      if (!confirm(`Supprimer la classe "${cls.name}" ?`)) {
        return;
      }
    }
    deleteClass(cls.id);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Veuillez saisir le nom de la classe.");
      return;
    }

    const tFee = parseFloat(tuitionFee) || 0;
    const t1Num = parseFloat(tranche1) || Math.round(tFee * 0.4);
    const t2Num = parseFloat(tranche2) || Math.round(tFee * 0.35);
    const t3Num = parseFloat(tranche3) || Math.max(0, tFee - (t1Num + t2Num));

    const tranchesList: TuitionTranche[] = [
      {
        id: `${editingClassId || 'new'}-t1`,
        name: '1ère Tranche',
        amount: t1Num,
        dueDate: dueDate1.trim() || '30 Novembre',
        description: 'Rentrée & 1er Trimestre'
      },
      {
        id: `${editingClassId || 'new'}-t2`,
        name: '2ème Tranche',
        amount: t2Num,
        dueDate: dueDate2.trim() || '28 Février',
        description: '2ème Trimestre'
      },
      {
        id: `${editingClassId || 'new'}-t3`,
        name: '3ème Tranche',
        amount: t3Num,
        dueDate: dueDate3.trim() || '31 Mai',
        description: '3ème Trimestre'
      }
    ];

    const classData = {
      name: name.trim(),
      level,
      stream: stream.trim() || 'Général',
      capacity: parseInt(capacity) || 50,
      studentCount: editingClassId ? (classes.find(c => c.id === editingClassId)?.studentCount || 0) : 0,
      mainTeacherId: mainTeacherId || teachers[0]?.id,
      room: roomNumber.trim() || 'Salle 1',
      tuitionFee: tFee,
      tranches: tranchesList
    };

    if (editingClassId) {
      updateClass(editingClassId, classData);
    } else {
      addClass(classData);
    }

    setShowModal(false);
  };

  // Quick Preset Selection Helper
  const applyPreset = (preset: typeof POPULAR_SERIES_PRESETS[0]) => {
    setLevel(preset.level);
    setStream(preset.stream);
    setTuitionFee(preset.defaultFee.toString());
    if (!name) {
      if (preset.exam?.includes('BAC G1')) setName('Terminale G1 (Secrétariat & Bureautique)');
      else if (preset.exam?.includes('BAC G2')) setName('Terminale G2 (Comptabilité & Gestion)');
      else if (preset.exam?.includes('BAC G3')) setName('Terminale G3 (Techniques Commerciales)');
      else if (preset.exam?.includes('BAC F')) setName(`Terminale ${preset.exam.replace('BAC ', '')} (Industrielle)`);
      else if (preset.exam?.includes('BAC A')) setName('Terminale A4 (Littéraire)');
      else if (preset.exam?.includes('BAC C')) setName('Terminale C (Scientifique Maths/PC)');
      else if (preset.exam?.includes('BAC D')) setName('Terminale D (Scientifique SVT)');
      else if (preset.exam === 'BEPC') setName('3ème (Préparation BEPC)');
      else if (preset.exam === 'CEP') setName('CM2 (Préparation CEP)');
    }
  };

  const handleAddLyceePack = () => {
    const lyceePresets: Omit<SchoolClass, 'id'>[] = [
      { name: "2nde A (Seconde Littéraire)", level: "LYCEE", stream: "Série A - Littéraire", room: "Salle L1", capacity: 80, studentCount: 0, tuitionFee: 110000 },
      { name: "2nde C (Seconde Scientifique)", level: "LYCEE", stream: "Série C - Scientifique", room: "Salle L2", capacity: 80, studentCount: 0, tuitionFee: 115000 },
      { name: "2nde G2 (Seconde Technique - Gestion & Compta)", level: "LYCEE", stream: "Technique G2 - Gestion", room: "Salle G1", capacity: 80, studentCount: 0, tuitionFee: 120000 },
      { name: "1ère A4 (Première Littéraire)", level: "LYCEE", stream: "Série A - Littéraire", room: "Salle L3", capacity: 80, studentCount: 0, tuitionFee: 120000 },
      { name: "1ère D (Première Scientifique SVT)", level: "LYCEE", stream: "Série D - Scientifique", room: "Salle L4", capacity: 80, studentCount: 0, tuitionFee: 125000 },
      { name: "1ère C (Maths & Physique)", level: "LYCEE", stream: "Série C - Mathématiques", room: "Salle L5", capacity: 70, studentCount: 0, tuitionFee: 125000 },
      { name: "1ère G2 (Première Technique - Gestion & Compta)", level: "LYCEE", stream: "Technique G2 - Gestion", room: "Salle G2", capacity: 80, studentCount: 0, tuitionFee: 130000 },
      { name: "Terminale A (Baccalauréat Littéraire)", level: "LYCEE", stream: "Série A - Littéraire", room: "Salle T1", capacity: 80, studentCount: 0, tuitionFee: 135000 },
      { name: "Terminale B (Bac Économique & Social)", level: "LYCEE", stream: "Série B - Économique", room: "Salle T2", capacity: 70, studentCount: 0, tuitionFee: 135000 },
      { name: "Terminale C (Bac Mathématiques & PC)", level: "LYCEE", stream: "Série C - Mathématiques", room: "Salle T3", capacity: 70, studentCount: 0, tuitionFee: 145000 },
      { name: "Terminale D (Bac Sciences & SVT)", level: "LYCEE", stream: "Série D - Scientifique", room: "Salle T4", capacity: 80, studentCount: 0, tuitionFee: 140000 },
      { name: "Terminale G2 (Bac Technique - Gestion & Comptabilité)", level: "LYCEE", stream: "Technique G2 - Gestion/Compta", room: "Salle G3", capacity: 80, studentCount: 0, tuitionFee: 145000 }
    ];

    const existingNames = new Set(classes.map(c => c.name.toLowerCase().trim()));
    const toAdd = lyceePresets.filter(p => !existingNames.has(p.name.toLowerCase().trim()));

    if (toAdd.length === 0) {
      alert("Toutes les classes du cycle Lycée & Série G2 (2nde à Terminale) sont déjà créées.");
      return;
    }

    toAdd.forEach(p => addClass(p));
  };

  const handleAddPrimairePack = () => {
    const primaryPresets: Omit<SchoolClass, 'id'>[] = [
      { name: "CI (Cours d'Initiation)", level: "PRIMAIRE", stream: "Cursus Fondamental Primaire", room: "Salle P1", capacity: 45, studentCount: 0, tuitionFee: 50000 },
      { name: "CP (Cours Préparatoire)", level: "PRIMAIRE", stream: "Cursus Fondamental Primaire", room: "Salle P2", capacity: 45, studentCount: 0, tuitionFee: 50000 },
      { name: "CE1 (Cours Élémentaire 1)", level: "PRIMAIRE", stream: "Cursus Fondamental Primaire", room: "Salle P3", capacity: 45, studentCount: 0, tuitionFee: 55000 },
      { name: "CE2 (Cours Élémentaire 2)", level: "PRIMAIRE", stream: "Cursus Fondamental Primaire", room: "Salle P4", capacity: 45, studentCount: 0, tuitionFee: 55000 },
      { name: "CM1 (Cours Moyen 1)", level: "PRIMAIRE", stream: "Cursus Fondamental Primaire", room: "Salle P5", capacity: 45, studentCount: 0, tuitionFee: 60000 },
      { name: "CM2 (Cours Moyen 2 - Examen CEP)", level: "PRIMAIRE", stream: "Examen CEP & Entrée en 6ème", room: "Salle P6", capacity: 45, studentCount: 0, tuitionFee: 65000 }
    ];

    const existingNames = new Set(classes.map(c => c.name.toLowerCase().trim()));
    const toAdd = primaryPresets.filter(p => !existingNames.has(p.name.toLowerCase().trim()));

    if (toAdd.length === 0) {
      alert("Toutes les classes du cycle Primaire (CI à CM2) sont déjà créées.");
      return;
    }

    toAdd.forEach(p => addClass(p));
  };

  const handleAddG2Pack = () => {
    const g2Presets: Omit<SchoolClass, 'id'>[] = [
      { name: "2nde G2 (Seconde Technique - Gestion & Compta)", level: "LYCEE", stream: "Technique G2 - Gestion", room: "Salle G1", capacity: 80, studentCount: 0, tuitionFee: 120000 },
      { name: "1ère G2 (Première Technique - Gestion & Compta)", level: "LYCEE", stream: "Technique G2 - Gestion", room: "Salle G2", capacity: 80, studentCount: 0, tuitionFee: 130000 },
      { name: "Terminale G2 (Bac Technique - Gestion & Comptabilité)", level: "LYCEE", stream: "Technique G2 - Gestion/Compta", room: "Salle G3", capacity: 80, studentCount: 0, tuitionFee: 145000 }
    ];

    const existingNames = new Set(classes.map(c => c.name.toLowerCase().trim()));
    const toAdd = g2Presets.filter(p => !existingNames.has(p.name.toLowerCase().trim()));

    if (toAdd.length === 0) {
      alert("Toutes les classes de la Série G2 sont déjà créées.");
      return;
    }

    toAdd.forEach(p => addClass(p));
  };

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      // Level Filter
      if (selectedLevelFilter === 'G2') {
        const isG2 = cls.name.toLowerCase().includes('g2') || (cls.stream && cls.stream.toLowerCase().includes('g2'));
        if (!isG2) return false;
      } else if (selectedLevelFilter === 'TECHNIQUE') {
        const isTech = cls.name.toLowerCase().includes('g1') || 
                       cls.name.toLowerCase().includes('g2') || 
                       cls.name.toLowerCase().includes('g3') || 
                       cls.name.toLowerCase().includes('f1') || 
                       cls.name.toLowerCase().includes('f2') || 
                       cls.name.toLowerCase().includes('f3') || 
                       cls.name.toLowerCase().includes('f4') ||
                       (cls.stream && (cls.stream.toLowerCase().includes('technique') || cls.stream.toLowerCase().includes('industrielle')));
        if (!isTech) return false;
      } else if (selectedLevelFilter !== 'ALL') {
        if (cls.level !== selectedLevelFilter) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return cls.name.toLowerCase().includes(q) || 
               (cls.stream && cls.stream.toLowerCase().includes(q)) ||
               (cls.room && cls.room.toLowerCase().includes(q));
      }

      return true;
    });
  }, [classes, selectedLevelFilter, searchTerm]);

  const countByLevel = {
    ALL: classes.length,
    MATERNELLE: classes.filter(c => c.level === 'MATERNELLE').length,
    PRIMAIRE: classes.filter(c => c.level === 'PRIMAIRE').length,
    COLLEGE: classes.filter(c => c.level === 'COLLEGE').length,
    LYCEE: classes.filter(c => c.level === 'LYCEE').length,
    G2: classes.filter(c => c.name.toLowerCase().includes('g2') || (c.stream && c.stream.toLowerCase().includes('g2'))).length,
    TECHNIQUE: classes.filter(c => 
      c.name.toLowerCase().includes('g1') || 
      c.name.toLowerCase().includes('g2') || 
      c.name.toLowerCase().includes('g3') || 
      c.name.toLowerCase().includes('f1') || 
      c.name.toLowerCase().includes('f2') || 
      c.name.toLowerCase().includes('f3') || 
      c.name.toLowerCase().includes('f4') ||
      (c.stream && (c.stream.toLowerCase().includes('technique') || c.stream.toLowerCase().includes('industrielle')))
    ).length
  };

  const hasLycee = classes.some(c => c.level === 'LYCEE' || c.name.toLowerCase().includes('terminale') || c.name.toLowerCase().includes('tle'));
  const hasG2 = countByLevel.G2 > 0;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-indigo-600" />
            <span>Gestion des Classes & Séries Pédagogiques</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Créez manuellement toutes vos classes avec leurs séries (Générales A, B, C, D et Techniques G1, G2, G3, F1-F4).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setTargetFeeClassId(undefined);
              setShowFeesModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
          >
            <DollarSign className="h-4 w-4" />
            <span>💰 Barème & Tranches (T1, T2, T3)</span>
          </button>

          <button
            onClick={handleAddPrimairePack}
            className="px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-900 dark:text-amber-300 font-extrabold text-xs flex items-center space-x-1.5 border border-amber-200 dark:border-amber-800 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>🎒 + Pack Primaire</span>
          </button>

          {!hasLycee && (
            <button
              onClick={handleAddLyceePack}
              className="px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-extrabold text-xs flex items-center space-x-1.5 border border-purple-200 dark:border-purple-800 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>+ Pack Lycée</span>
            </button>
          )}

          {!hasG2 && (
            <button
              onClick={handleAddG2Pack}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center space-x-1.5 border border-emerald-200 dark:border-emerald-800 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>+ Série G2</span>
            </button>
          )}

          <button
            onClick={() => openCreateModal('LYCEE')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Créer une Classe</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedLevelFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
              selectedLevelFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Toutes</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedLevelFilter === 'ALL' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
              {countByLevel.ALL}
            </span>
          </button>

          <button
            onClick={() => setSelectedLevelFilter('MATERNELLE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
              selectedLevelFilter === 'MATERNELLE'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Maternelle</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800">
              {countByLevel.MATERNELLE}
            </span>
          </button>

          <button
            onClick={() => setSelectedLevelFilter('PRIMAIRE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
              selectedLevelFilter === 'PRIMAIRE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Primaire</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800">
              {countByLevel.PRIMAIRE}
            </span>
          </button>

          <button
            onClick={() => setSelectedLevelFilter('COLLEGE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
              selectedLevelFilter === 'COLLEGE'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Collège</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800">
              {countByLevel.COLLEGE}
            </span>
          </button>

          <button
            onClick={() => setSelectedLevelFilter('LYCEE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
              selectedLevelFilter === 'LYCEE'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Lycée Général</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800">
              {countByLevel.LYCEE}
            </span>
          </button>

          <button
            onClick={() => setSelectedLevelFilter('G2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
              selectedLevelFilter === 'G2'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40'
            }`}
          >
            <span>Série G2 (Compta)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100 dark:bg-teal-900">
              {countByLevel.G2}
            </span>
          </button>

          <button
            onClick={() => setSelectedLevelFilter('TECHNIQUE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
              selectedLevelFilter === 'TECHNIQUE'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <span>Toutes Séries Tech</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-900">
              {countByLevel.TECHNIQUE}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="w-full md:w-64 relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher classe, série (ex: G2, A4, C)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Building2 className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="font-black text-base text-slate-700 dark:text-slate-300">Aucune classe trouvée</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Créez une nouvelle classe avec sa série en cliquant sur le bouton ci-dessous.
          </p>
          <button
            onClick={() => openCreateModal('LYCEE')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une Classe</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map(cls => {
            const count = students.filter(s => s.classId === cls.id).length;
            const mainTeacher = teachers.find(t => t.id === cls.mainTeacherId || (t.classIds && t.classIds.includes(cls.id)));
            const percent = Math.min(100, Math.round((count / (cls.capacity || 50)) * 100));
            
            const isG2 = cls.name.toLowerCase().includes('g2') || (cls.stream && cls.stream.toLowerCase().includes('g2'));
            const isG1 = cls.name.toLowerCase().includes('g1') || (cls.stream && cls.stream.toLowerCase().includes('g1'));
            const isG3 = cls.name.toLowerCase().includes('g3') || (cls.stream && cls.stream.toLowerCase().includes('g3'));
            const isTech = cls.name.toLowerCase().includes('f1') || cls.name.toLowerCase().includes('f2') || cls.name.toLowerCase().includes('f3') || cls.name.toLowerCase().includes('f4');

            const isExamClass = cls.name.toLowerCase().includes('terminale') || cls.name.toLowerCase().includes('tle') || cls.name.toLowerCase().includes('3ème') || cls.name.toLowerCase().includes('cm2');
            
            const examBadge = isG2
              ? 'BAC G2'
              : isG1
              ? 'BAC G1'
              : isG3
              ? 'BAC G3'
              : isTech
              ? 'BAC TECHNIQUE'
              : (cls.name.toLowerCase().includes('terminale') || cls.name.toLowerCase().includes('tle')) 
              ? 'BAC' 
              : cls.name.toLowerCase().includes('3ème') 
              ? 'BEPC' 
              : cls.name.toLowerCase().includes('cm2') 
              ? 'CEP' 
              : null;

            return (
              <div
                key={cls.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3.5 relative overflow-hidden flex flex-col justify-between"
              >
                {examBadge && (
                  <div className={`absolute top-0 right-0 text-white text-[9px] font-black px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider flex items-center space-x-1 shadow-sm ${
                    isG2 ? 'bg-emerald-600' : isG1 ? 'bg-blue-600' : isG3 ? 'bg-teal-600' : isTech ? 'bg-rose-600' : 'bg-amber-500'
                  }`}>
                    <Award className="h-3 w-3" />
                    <span>{examBadge}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="pr-16">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                      {cls.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                        cls.level === 'LYCEE' 
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                          : cls.level === 'COLLEGE'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          : cls.level === 'PRIMAIRE'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}>
                        {cls.level}
                      </span>
                      {cls.stream && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isG2 ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                               : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {cls.stream}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
                    <span>Salle de cours :</span>
                    <span className="text-slate-800 dark:text-slate-200 font-black">{cls.room || 'Non assignée'}</span>
                  </div>

                  {/* Attendance capacity bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-600 dark:text-slate-400">Effectif Actuel</span>
                      <span className="text-slate-900 dark:text-white font-black">{count} / {cls.capacity || 50} élèves ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${percent >= 90 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <p className="flex justify-between">
                      <span className="font-bold text-slate-500">
                        {cls.level === 'PRIMAIRE' 
                          ? 'Maître(sse) Titulaire :' 
                          : cls.level === 'MATERNELLE'
                          ? 'Maîtresse / Éducatrice :'
                          : 'Prof. Principal :'}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {mainTeacher 
                          ? `${mainTeacher.lastName} ${mainTeacher.firstName}` 
                          : cls.level === 'PRIMAIRE' || cls.level === 'MATERNELLE'
                          ? 'Maître(sse) titulaire'
                          : 'Professeur assigné'}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-bold text-slate-500">Frais Annuel :</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {cls.tuitionFee?.toLocaleString()} {settings.currency}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetFeeClassId(cls.id);
                        setShowFeesModal(true);
                      }}
                      className="py-1.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] flex items-center justify-center space-x-1 transition-all cursor-pointer border border-emerald-200/50"
                      title="Modifier les Frais & Tranches de cette classe"
                    >
                      <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Frais & Tranches</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(cls)}
                      className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center space-x-1 transition-all cursor-pointer"
                      title="Modifier les paramètres de la classe"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Modifier</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(cls)}
                      className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center space-x-1 transition-all cursor-pointer"
                      title="Dupliquer pour créer une Section B"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Dupliquer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(cls)}
                      className="py-1.5 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center justify-center space-x-1 transition-all cursor-pointer"
                      title="Supprimer la classe"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Supprimer</span>
                    </button>
                  </div>

                  {onNavigateToScanRoster && (
                    <button
                      onClick={() => onNavigateToScanRoster(cls.id)}
                      className="w-full py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-colors border border-blue-200/60 dark:border-blue-800/60 cursor-pointer"
                    >
                      <ScanLine className="h-3.5 w-3.5 text-blue-600" />
                      <span>Inscrire / Scanner Élèves (IA)</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* COMPREHENSIVE MANUAL CLASS & SERIES CREATION / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-800 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-amber-300">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    {editingClassId ? 'Modifier la Classe & Série' : 'Créer Manuellement une Classe & Série'}
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Définissez la filière, la série, les frais et les caractéristiques de la classe.
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* Quick Series Presets Bar */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <label className="font-black uppercase text-[10px] text-indigo-900 dark:text-indigo-300 flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Modèles de Séries Africaines & Francophones (1-Clic) :</span>
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                  {POPULAR_SERIES_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-[10px] transition-all cursor-pointer shadow-xs"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cycle & Stream Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    Cycle / Niveau Pédagogique *
                  </label>
                  <select
                    value={level}
                    onChange={e => setLevel(e.target.value as SchoolLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="MATERNELLE">Maternelle (Éveil, PS, MS, GS)</option>
                    <option value="PRIMAIRE">Primaire (CI, CP, CE1, CE2, CM1, CM2)</option>
                    <option value="COLLEGE">Collège (6ème, 5ème, 4ème, 3ème)</option>
                    <option value="LYCEE">Lycée Général & Technique (2nde, 1ère, Tle)</option>
                    <option value="FORMATION">Formation Professionnelle (CAP, BEP, BT)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    Filière / Série Pédagogique *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Série G2 (Comptabilité), Série D, Série A4, F3..."
                    value={stream}
                    onChange={e => setStream(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Class Name */}
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  Intitulé / Nom de la Classe *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Terminale G2 (Comptabilité & Gestion), 1ère A4, 2nde C..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Details (Room, Capacity, Tuition Fee) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    Salle de Classe
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Salle B-12"
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    Capacité Maximale
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    placeholder="ex: 60"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    Frais de Scolarité Annuelle Totale ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="ex: 130000"
                    value={tuitionFee}
                    onChange={e => handleTuitionFeeChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-slate-900 dark:text-white font-black text-sm text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              {/* TRANCHES DE SCOLARITÉ SPÉCIFIQUES À CETTE CLASSE */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-black uppercase text-[10px] text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                    <span>Échelonnement des 3 Tranches de cette classe :</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-bold text-slate-500">Répartir :</span>
                    <button
                      type="button"
                      onClick={() => recalculateTranches(parseFloat(tuitionFee) || 0, '40_35_25')}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-[10px] hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
                    >
                      40% / 35% / 25%
                    </button>
                    <button
                      type="button"
                      onClick={() => recalculateTranches(parseFloat(tuitionFee) || 0, '50_30_20')}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-[10px] hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
                    >
                      50% / 30% / 20%
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Tranche 1 */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-indigo-600 dark:text-indigo-400">1ère Tranche</span>
                      <span className="text-[10px] text-slate-400">Rentrée</span>
                    </div>
                    <input
                      type="number"
                      step="500"
                      value={tranche1}
                      onChange={e => {
                        setTranche1(e.target.value);
                        const t1 = parseFloat(e.target.value) || 0;
                        const t2 = parseFloat(tranche2) || 0;
                        const t3 = parseFloat(tranche3) || 0;
                        setTuitionFee((t1 + t2 + t3).toString());
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-xs text-slate-900 dark:text-white font-mono"
                      placeholder="Montant T1"
                    />
                    <input
                      type="text"
                      value={dueDate1}
                      onChange={e => setDueDate1(e.target.value)}
                      placeholder="Date ex: 30 Nov"
                      className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300"
                    />
                  </div>

                  {/* Tranche 2 */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-indigo-600 dark:text-indigo-400">2ème Tranche</span>
                      <span className="text-[10px] text-slate-400">Trimestre 2</span>
                    </div>
                    <input
                      type="number"
                      step="500"
                      value={tranche2}
                      onChange={e => {
                        setTranche2(e.target.value);
                        const t1 = parseFloat(tranche1) || 0;
                        const t2 = parseFloat(e.target.value) || 0;
                        const t3 = parseFloat(tranche3) || 0;
                        setTuitionFee((t1 + t2 + t3).toString());
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-xs text-slate-900 dark:text-white font-mono"
                      placeholder="Montant T2"
                    />
                    <input
                      type="text"
                      value={dueDate2}
                      onChange={e => setDueDate2(e.target.value)}
                      placeholder="Date ex: 28 Fév"
                      className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300"
                    />
                  </div>

                  {/* Tranche 3 */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-indigo-600 dark:text-indigo-400">3ème Tranche</span>
                      <span className="text-[10px] text-slate-400">Trimestre 3</span>
                    </div>
                    <input
                      type="number"
                      step="500"
                      value={tranche3}
                      onChange={e => {
                        setTranche3(e.target.value);
                        const t1 = parseFloat(tranche1) || 0;
                        const t2 = parseFloat(tranche2) || 0;
                        const t3 = parseFloat(e.target.value) || 0;
                        setTuitionFee((t1 + t2 + t3).toString());
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-xs text-slate-900 dark:text-white font-mono"
                      placeholder="Montant T3"
                    />
                    <input
                      type="text"
                      value={dueDate3}
                      onChange={e => setDueDate3(e.target.value)}
                      placeholder="Date ex: 31 Mai"
                      className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] px-1 font-bold">
                  <span className="text-slate-500">Total Somme des 3 tranches :</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    {((parseFloat(tranche1) || 0) + (parseFloat(tranche2) || 0) + (parseFloat(tranche3) || 0)).toLocaleString()} {settings.currency}
                  </span>
                </div>
              </div>

              {/* Main Teacher assignment */}
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  {level === 'PRIMAIRE'
                    ? 'Maître / Maîtresse Titulaire Assigné(e)'
                    : level === 'MATERNELLE'
                    ? 'Maîtresse / Éducatrice Titulaire Assignée'
                    : 'Professeur Principal Assigné'}
                </label>
                <select
                  value={mainTeacherId}
                  onChange={e => setMainTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                >
                  <option value="">
                    {level === 'PRIMAIRE'
                      ? '-- Sélectionner un Maître / Maîtresse du Primaire --'
                      : level === 'MATERNELLE'
                      ? '-- Sélectionner une Maîtresse de Maternelle --'
                      : '-- Sélectionner un Professeur du Secondaire --'}
                  </option>
                  {teachers
                    .filter(t => {
                      const isPri = t.cycle === 'PRIMAIRE' || t.specialty === 'PRIMAIRE' || t.teacherTitle === 'MAITRE' || t.teacherTitle === 'MAITRESSE' || t.id.startsWith('tch-p') || t.firstName.includes('Maître') || t.firstName.includes('Maîtresse') || (t.qualification || '').toLowerCase().includes('instituteur');
                      const isMat = t.cycle === 'MATERNELLE' || t.specialty === 'MATERNELLE' || t.id === 'tch-p1' || (t.qualification || '').toLowerCase().includes('maternelle');

                      if (level === 'PRIMAIRE') return isPri && !isMat;
                      if (level === 'MATERNELLE') return isMat;
                      return !isPri && !isMat; // Secondaire (Collège / Lycée)
                    })
                    .map(t => {
                      const isPri = t.cycle === 'PRIMAIRE' || t.specialty === 'PRIMAIRE' || t.teacherTitle === 'MAITRE' || t.teacherTitle === 'MAITRESSE' || t.id.startsWith('tch-p') || t.firstName.includes('Maître') || t.firstName.includes('Maîtresse');
                      const isMat = t.cycle === 'MATERNELLE' || t.specialty === 'MATERNELLE' || (t.qualification || '').toLowerCase().includes('maternelle');
                      const icon = isMat ? '🧸' : isPri ? '🎒' : '👨‍🏫';
                      return (
                        <option key={t.id} value={t.id}>
                          {icon} {t.lastName} {t.firstName} — {t.qualification || 'Enseignant Titulaire'}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-600/20 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{editingClassId ? 'Enregistrer les Modifications' : 'Créer la Classe'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURATION DES FRAIS & TRANCHES PAR CLASSE */}
      <ConfigureClassFeesModal
        isOpen={showFeesModal}
        onClose={() => setShowFeesModal(false)}
        targetClassId={targetFeeClassId}
      />

    </div>
  );
};


