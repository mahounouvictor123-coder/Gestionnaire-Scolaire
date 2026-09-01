import React, { useState, useRef } from 'react';
import { useApp } from '../lib/store';
import {
  GraduationCap,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Plus,
  Trash2,
  BookOpen,
  Search,
  CheckCircle2,
  Award,
  Sparkles,
  School,
  Building2,
  Info,
  UserCheck,
  Camera,
  Upload,
  Image as ImageIcon,
  Edit2,
  X,
  Check,
  User,
  ShieldCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Teacher } from '../types';

// Preset avatar photos for quick selection
const PRESET_AVATARS = [
  {
    label: "Maître / Homme 1",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250"
  },
  {
    label: "Maître / Homme 2",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250"
  },
  {
    label: "Maître / Homme 3",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
  },
  {
    label: "Maîtresse / Femme 1",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250"
  },
  {
    label: "Maîtresse / Femme 2",
    url: "https://images.unsplash.com/photo-1580894732488-ea9a0a03006a?auto=format&fit=crop&q=80&w=250"
  },
  {
    label: "Maîtresse / Femme 3",
    url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=250"
  }
];

export function getTeacherCategory(t: Teacher): 'MATERNELLE' | 'PRIMAIRE' | 'COLLEGE' | 'LYCEE' {
  // 1. Direct explicit cycle or specialty
  if (t.cycle === 'MATERNELLE' || t.specialty === 'MATERNELLE') return 'MATERNELLE';
  if (t.cycle === 'PRIMAIRE' || t.specialty === 'PRIMAIRE') return 'PRIMAIRE';
  if (t.cycle === 'LYCEE' || t.specialty === 'LYCEE') return 'LYCEE';
  if (t.cycle === 'COLLEGE' || t.specialty === 'COLLEGE') return 'COLLEGE';

  // 2. Explicit teacherTitle
  if (t.teacherTitle === 'MAITRE' || t.teacherTitle === 'MAITRESSE') {
    if (t.qualification?.toLowerCase().includes('maternelle') || (t.subjects || []).some(s => s.toLowerCase().includes('maternelle'))) {
      return 'MATERNELLE';
    }
    return 'PRIMAIRE';
  }

  const lowerName = `${t.firstName} ${t.lastName}`.toLowerCase();
  const lowerQualif = (t.qualification || '').toLowerCase();
  const lowerSubjects = (t.subjects || []).join(' ').toLowerCase();

  // 3. Maternelle detection
  if (
    t.id.startsWith('tch-p1') ||
    lowerSubjects.includes('maternelle') ||
    lowerSubjects.includes('éveil') ||
    lowerSubjects.includes('petite section') ||
    lowerSubjects.includes('moyenne section') ||
    lowerSubjects.includes('grande section') ||
    lowerQualif.includes('maternelle') ||
    lowerQualif.includes('éducatrice')
  ) {
    return 'MATERNELLE';
  }

  // 4. Primaire detection (Maître / Maîtresse, Instituteur, CI, CP, CE1, CE2, CM1, CM2, etc.)
  if (
    t.id.startsWith('tch-p') ||
    lowerName.includes('maître') ||
    lowerName.includes('maitre') ||
    lowerName.includes('maîtresse') ||
    lowerName.includes('maitresse') ||
    lowerQualif.includes('instituteur') ||
    lowerQualif.includes('institutrice') ||
    lowerQualif.includes('ceap') ||
    lowerQualif.includes('cappe') ||
    lowerQualif.includes('cap') ||
    lowerSubjects.includes('ci') ||
    lowerSubjects.includes('cp') ||
    lowerSubjects.includes('ce1') ||
    lowerSubjects.includes('ce2') ||
    lowerSubjects.includes('cm1') ||
    lowerSubjects.includes('cm2') ||
    lowerSubjects.includes('primaire') ||
    lowerSubjects.includes('fondamental')
  ) {
    return 'PRIMAIRE';
  }

  // 5. Lycée detection
  if (
    t.cycle === 'LYCEE' ||
    lowerSubjects.includes('lycée') ||
    lowerSubjects.includes('terminale') ||
    lowerSubjects.includes('tle') ||
    lowerSubjects.includes('1ère') ||
    lowerSubjects.includes('première') ||
    lowerSubjects.includes('2nde') ||
    lowerSubjects.includes('seconde') ||
    lowerSubjects.includes('philosophie') ||
    lowerQualif.includes('lycée') ||
    lowerQualif.includes('agrégation') ||
    lowerQualif.includes('agrégé')
  ) {
    return 'LYCEE';
  }

  // 6. Secondary / Collège default
  return 'COLLEGE';
}

export const TeachersView: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, settings, currentSchool, classes } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'PRIMAIRE' | 'MATERNELLE' | 'COLLEGE' | 'LYCEE'>('PRIMAIRE');
  const [searchTerm, setSearchTerm] = useState('');

  // Add teacher form state
  const [teacherType, setTeacherType] = useState<'MAITRE' | 'MAITRESSE' | 'MAITRESSE_MAT' | 'PROF_COLLEGE' | 'PROF_LYCEE'>('MAITRE');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState('220000');
  const [qualification, setQualification] = useState('Instituteur d\'État Titulaire (CEAP / CAP)');
  const [subjectsStr, setSubjectsStr] = useState('Communication Écrite, Lecture, Mathématiques, EST, ES, EA, Sport');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>(PRESET_AVATARS[0].url);
  const [customPhotoSelected, setCustomPhotoSelected] = useState<boolean>(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Edit teacher modal state
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [editQualification, setEditQualification] = useState('');
  const [editSubjectsStr, setEditSubjectsStr] = useState('');
  const [editCycle, setEditCycle] = useState<'PRIMAIRE' | 'MATERNELLE' | 'COLLEGE' | 'LYCEE'>('PRIMAIRE');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIF' | 'CONGE' | 'INACTIF'>('ACTIF');

  // Hidden file inputs for direct photo uploads
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);
  const [targetQuickTeacherId, setTargetQuickTeacherId] = useState<string | null>(null);

  // Handle local image file upload (converts to Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'ADD' | 'EDIT' | 'QUICK') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (target === 'ADD') {
        setPhotoUrl(base64);
        setCustomPhotoSelected(true);
      } else if (target === 'EDIT') {
        setEditPhotoUrl(base64);
      } else if (target === 'QUICK' && targetQuickTeacherId) {
        updateTeacher(targetQuickTeacherId, { photoUrl: base64 });
        setNoticeMsg("Photo de l'enseignant mise à jour avec succès !");
        setTimeout(() => setNoticeMsg(null), 3500);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Filter logic using robust getTeacherCategory - STRICT SEPARATION
  const filteredTeachers = teachers.filter(t => {
    const category = getTeacherCategory(t);

    if (filterLevel === 'MATERNELLE' && category !== 'MATERNELLE') return false;
    if (filterLevel === 'PRIMAIRE' && category !== 'PRIMAIRE') return false;
    if (filterLevel === 'COLLEGE' && category !== 'COLLEGE') return false;
    if (filterLevel === 'LYCEE' && category !== 'LYCEE') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = `${t.firstName} ${t.lastName}`.toLowerCase().includes(q);
      const matchSubject = (t.subjects || []).some(s => s.toLowerCase().includes(q));
      const matchQualif = (t.qualification || '').toLowerCase().includes(q);
      return matchName || matchSubject || matchQualif;
    }

    return true;
  });

  const handleTypeChange = (type: 'MAITRE' | 'MAITRESSE' | 'MAITRESSE_MAT' | 'PROF_COLLEGE' | 'PROF_LYCEE') => {
    setTeacherType(type);
    if (type === 'MAITRE') {
      setQualification("Instituteur d'État Titulaire (CEAP / CAP)");
      setSubjectsStr("Communication Écrite, Lecture, Mathématiques, EST, ES, EA, Sport");
      if (!customPhotoSelected) setPhotoUrl(PRESET_AVATARS[0].url);
    } else if (type === 'MAITRESSE') {
      setQualification("Institutrice Titulaire (Certifiée CEAP / CAP)");
      setSubjectsStr("Communication Écrite, Lecture, Mathématiques, EST, ES, EA, Sport");
      if (!customPhotoSelected) setPhotoUrl(PRESET_AVATARS[3].url);
    } else if (type === 'MAITRESSE_MAT') {
      setQualification("Maîtresse de Maternelle / Éducatrice Petite Enfance");
      setSubjectsStr("Maternelle, Éveil Sensoriel, Graphisme, Langage");
      if (!customPhotoSelected) setPhotoUrl(PRESET_AVATARS[4].url);
    } else if (type === 'PROF_COLLEGE') {
      setQualification("BAPES / CAPES - Professeur Certifié de Collège");
      setSubjectsStr("Français, Histoire-Géographie");
      if (!customPhotoSelected) setPhotoUrl(PRESET_AVATARS[1].url);
    } else if (type === 'PROF_LYCEE') {
      setQualification("CAPES / Agrégation - Professeur de Lycée");
      setSubjectsStr("Mathématiques, Sciences Physiques");
      if (!customPhotoSelected) setPhotoUrl(PRESET_AVATARS[2].url);
    }
  };

  const handleOpenAddWithType = (type: 'MAITRE' | 'MAITRESSE' | 'MAITRESSE_MAT' | 'PROF_COLLEGE' | 'PROF_LYCEE') => {
    handleTypeChange(type);
    setShowAddForm(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    let computedPrefix = '';
    let assignedCycle: 'PRIMAIRE' | 'MATERNELLE' | 'COLLEGE' | 'LYCEE' = 'PRIMAIRE';
    let assignedTitle: 'MAITRE' | 'MAITRESSE' | 'PROFESSEUR' = 'MAITRE';

    if (teacherType === 'MAITRE') {
      assignedCycle = 'PRIMAIRE';
      assignedTitle = 'MAITRE';
      if (!firstName.toLowerCase().startsWith('maître') && !firstName.toLowerCase().startsWith('maitre')) {
        computedPrefix = 'Maître ';
      }
    } else if (teacherType === 'MAITRESSE') {
      assignedCycle = 'PRIMAIRE';
      assignedTitle = 'MAITRESSE';
      if (!firstName.toLowerCase().startsWith('maîtresse') && !firstName.toLowerCase().startsWith('maitresse')) {
        computedPrefix = 'Maîtresse ';
      }
    } else if (teacherType === 'MAITRESSE_MAT') {
      assignedCycle = 'MATERNELLE';
      assignedTitle = 'MAITRESSE';
      if (!firstName.toLowerCase().startsWith('maîtresse') && !firstName.toLowerCase().startsWith('maitresse')) {
        computedPrefix = 'Maîtresse ';
      }
    } else if (teacherType === 'PROF_COLLEGE') {
      assignedCycle = 'COLLEGE';
      assignedTitle = 'PROFESSEUR';
      if (!firstName.toLowerCase().startsWith('prof.')) {
        computedPrefix = 'Prof. ';
      }
    } else if (teacherType === 'PROF_LYCEE') {
      assignedCycle = 'LYCEE';
      assignedTitle = 'PROFESSEUR';
      if (!firstName.toLowerCase().startsWith('prof.')) {
        computedPrefix = 'Prof. ';
      }
    }

    const fullFirstName = `${computedPrefix}${firstName.trim()}`;
    const cleanLastName = lastName.trim().toUpperCase();

    // Default class linking if none selected
    let targetClassIds: string[] = [];
    if (selectedClassId) {
      targetClassIds = [selectedClassId];
    } else if (classes.length > 0) {
      if (assignedCycle === 'PRIMAIRE') {
        const primCls = classes.find(c => c.level === 'PRIMAIRE');
        if (primCls) targetClassIds = [primCls.id];
      } else if (assignedCycle === 'MATERNELLE') {
        const matCls = classes.find(c => c.level === 'MATERNELLE');
        if (matCls) targetClassIds = [matCls.id];
      } else {
        const secCls = classes.find(c => c.level === 'COLLEGE' || c.level === 'LYCEE' || c.level === 'SECONDAIRE');
        if (secCls) targetClassIds = [secCls.id];
      }
    }

    addTeacher({
      firstName: fullFirstName,
      lastName: cleanLastName,
      email: email || `${firstName.toLowerCase().replace(/\s+/g, '')}.${cleanLastName.toLowerCase()}@${(currentSchool?.name || settings.schoolName || 'ecole').toLowerCase().replace(/[^a-z0-9]/g, '')}.bj`,
      phone: phone || "01 96 00 11 22",
      photoUrl: photoUrl || PRESET_AVATARS[0].url,
      subjects: subjectsStr.split(',').map(s => s.trim()).filter(Boolean),
      classIds: targetClassIds,
      salary: parseFloat(salary) || 220000,
      hireDate: new Date().toISOString().split('T')[0],
      status: 'ACTIF',
      qualification,
      specialty: assignedCycle,
      cycle: assignedCycle,
      teacherTitle: assignedTitle
    });

    // Automatically switch active tab to match newly created teacher's cycle
    setFilterLevel(assignedCycle);

    setFirstName('');
    setLastName('');
    setCustomPhotoSelected(false);
    setShowAddForm(false);

    const cycleLabel = assignedCycle === 'PRIMAIRE' 
      ? 'Espace Primaire (Maîtres & Maîtresses)' 
      : assignedCycle === 'MATERNELLE' 
      ? 'Espace Maternelle (Maîtresses d\'Éveil)' 
      : assignedCycle === 'COLLEGE'
      ? 'Espace Collège (Professeurs)'
      : 'Espace Lycée (Professeurs)';

    setNoticeMsg(`✅ ${fullFirstName} ${cleanLastName} a été inscrit(e) avec succès et ajouté(e) automatiquement dans l'${cycleLabel} !`);
    setTimeout(() => setNoticeMsg(null), 6000);
  };

  const openEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    setEditFirstName(t.firstName);
    setEditLastName(t.lastName);
    setEditEmail(t.email);
    setEditPhone(t.phone);
    setEditSalary(t.salary.toString());
    setEditQualification(t.qualification || '');
    setEditSubjectsStr((t.subjects || []).join(', '));
    setEditCycle(getTeacherCategory(t));
    setEditPhotoUrl(t.photoUrl || PRESET_AVATARS[0].url);
    setEditStatus(t.status || 'ACTIF');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    let assignedTitle: 'MAITRE' | 'MAITRESSE' | 'PROFESSEUR' = 'PROFESSEUR';
    if (editCycle === 'PRIMAIRE') {
      assignedTitle = editFirstName.toLowerCase().includes('maîtresse') || editFirstName.toLowerCase().includes('maitresse') ? 'MAITRESSE' : 'MAITRE';
    } else if (editCycle === 'MATERNELLE') {
      assignedTitle = 'MAITRESSE';
    }

    updateTeacher(editingTeacher.id, {
      firstName: editFirstName.trim(),
      lastName: editLastName.trim().toUpperCase(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      salary: parseFloat(editSalary) || editingTeacher.salary,
      qualification: editQualification.trim(),
      subjects: editSubjectsStr.split(',').map(s => s.trim()).filter(Boolean),
      cycle: editCycle,
      specialty: editCycle,
      teacherTitle: assignedTitle,
      photoUrl: editPhotoUrl,
      status: editStatus
    });

    setEditingTeacher(null);
    setNoticeMsg(`Les informations et la photo de ${editFirstName} ${editLastName} ont été mises à jour !`);
    setTimeout(() => setNoticeMsg(null), 4000);
  };

  // Accurate dynamic counts using getTeacherCategory
  const countPrimaire = teachers.filter(t => getTeacherCategory(t) === 'PRIMAIRE').length;
  const countMaternelle = teachers.filter(t => getTeacherCategory(t) === 'MATERNELLE').length;
  const countCollege = teachers.filter(t => getTeacherCategory(t) === 'COLLEGE').length;
  const countLycee = teachers.filter(t => getTeacherCategory(t) === 'LYCEE').length;

  // Filter available classes for teacher creation based on selected type
  const availableClassesForType = classes.filter(c => {
    if (teacherType === 'MAITRE' || teacherType === 'MAITRESSE') return c.level === 'PRIMAIRE';
    if (teacherType === 'MAITRESSE_MAT') return c.level === 'MATERNELLE';
    if (teacherType === 'PROF_COLLEGE') return c.level === 'COLLEGE' || c.level === 'SECONDAIRE';
    if (teacherType === 'PROF_LYCEE') return c.level === 'LYCEE' || c.level === 'SECONDAIRE';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Hidden file input for 1-click photo update */}
      <input
        type="file"
        ref={quickFileInputRef}
        onChange={e => handlePhotoUpload(e, 'QUICK')}
        accept="image/*"
        className="hidden"
      />

      {/* Header with Terminology Reminder */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Corps Enseignant & Pédagogique ({teachers.length} Enseignants)
              </h2>
              <p className="text-xs text-slate-500 font-bold">
                {currentSchool?.name || settings.schoolName} &bull; Espaces Séparés : Maîtres (Primaire) vs Professeurs (Secondaire)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenAddWithType('MAITRE')}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>+ Inscrire un Maître (Primaire)</span>
          </button>

          <button
            onClick={() => handleOpenAddWithType('PROF_COLLEGE')}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>+ Inscrire un Professeur (Secondaire)</span>
          </button>
        </div>
      </div>

      {noticeMsg && (
        <div className="p-4 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-black text-xs rounded-2xl border border-emerald-300 dark:border-emerald-800 flex items-center space-x-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{noticeMsg}</span>
        </div>
      )}

      {/* Info Badge Explaining Official Distinction */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start space-x-3 text-xs text-emerald-950 dark:text-emerald-200">
        <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-black text-emerald-950 dark:text-emerald-100">
            Cloisonnement des Espaces Pédagogiques :
          </p>
          <p className="leading-relaxed">
            Lorsque vous inscrivez un <strong>Maître</strong> ou une <strong>Maîtresse</strong>, il/elle s'ajoute <strong>directement et exclusivement dans l'Espace Primaire</strong> (sans aucun mélange avec les professeurs du secondaire). Les professeurs de Collège et Lycée disposent quant à eux de leur propre espace dédié.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterLevel('PRIMAIRE')}
            className={`px-3.5 py-2 rounded-xl font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              filterLevel === 'PRIMAIRE'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/30'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <span>🎒 Espace Primaire (Maîtres & Maîtresses)</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-700/40 text-[10px] font-black">
              {countPrimaire}
            </span>
          </button>

          <button
            onClick={() => setFilterLevel('MATERNELLE')}
            className={`px-3.5 py-2 rounded-xl font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              filterLevel === 'MATERNELLE'
                ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-500/30'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800'
            }`}
          >
            <span>🧸 Espace Maternelle (Maîtresses)</span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-700/40 text-[10px] font-black">
              {countMaternelle}
            </span>
          </button>

          <button
            onClick={() => setFilterLevel('COLLEGE')}
            className={`px-3.5 py-2 rounded-xl font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              filterLevel === 'COLLEGE'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500/30'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800'
            }`}
          >
            <span>🏫 Espace Secondaire (Collège)</span>
            <span className="px-1.5 py-0.5 rounded-md bg-blue-700/40 text-[10px] font-black">
              {countCollege}
            </span>
          </button>

          {countLycee > 0 && (
            <button
              onClick={() => setFilterLevel('LYCEE')}
              className={`px-3.5 py-2 rounded-xl font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                filterLevel === 'LYCEE'
                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-500/30'
                  : 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800'
              }`}
            >
              <span>🎓 Espace Secondaire (Lycée)</span>
              <span className="px-1.5 py-0.5 rounded-md bg-purple-700/40 text-[10px] font-black">
                {countLycee}
              </span>
            </button>
          )}

          <button
            onClick={() => setFilterLevel('ALL')}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              filterLevel === 'ALL'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Tous ({teachers.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="w-full lg:w-72 relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, matière, grade..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Active Space Banner Indicator */}
      {filterLevel === 'PRIMAIRE' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white border border-emerald-600/50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-lg">
              🎒
            </div>
            <div>
              <h3 className="font-black text-sm text-white">
                ESPACE EXCLUSIF DU PRIMAIRE — {countPrimaire} Maîtres & Maîtresses
              </h3>
              <p className="text-xs text-emerald-200 font-medium">
                Cet espace regroupe exclusivement les instituteurs et institutrices titulaires des classes CI, CP, CE1, CE2, CM1, CM2. Aucun professeur du secondaire n'est mélangé ici.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenAddWithType('MAITRE')}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 shadow-sm transition-all cursor-pointer"
          >
            + Inscrire un Maître
          </button>
        </div>
      )}

      {filterLevel === 'COLLEGE' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white border border-blue-600/50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500 text-white font-black text-lg">
              🏫
            </div>
            <div>
              <h3 className="font-black text-sm text-white">
                ESPACE EXCLUSIF DU SECONDAIRE (COLLÈGE) — {countCollege} Professeurs Certifiés
              </h3>
              <p className="text-xs text-blue-200 font-medium">
                Cet espace regroupe exclusivement les professeurs spécialisés par matière (Français, Maths, PCT, SVT, Anglais, Histoire-Géo, EPS).
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenAddWithType('PROF_COLLEGE')}
            className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs shrink-0 shadow-sm transition-all cursor-pointer"
          >
            + Inscrire un Professeur
          </button>
        </div>
      )}

      {/* Add Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500 dark:border-emerald-500 shadow-2xl space-y-5 text-xs animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <Plus className="h-4 w-4 text-emerald-600" />
                <span>Formulaire d'Inscription d'un Enseignant</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">
                L'enseignant sera automatiquement intégré dans son espace dédié (Primaire ou Secondaire)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 font-black p-1 text-base cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Type Selector (Maître / Maîtresse vs Professeur) */}
          <div className="space-y-1.5">
            <label className="block font-black text-slate-800 dark:text-slate-200">
              1. Choix du Statut & Espace d'Affectation *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('MAITRE')}
                className={`p-3 rounded-2xl border-2 text-left font-black transition-all cursor-pointer ${
                  teacherType === 'MAITRE'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                }`}
              >
                <div className="text-emerald-700 dark:text-emerald-400 font-black text-[11px] flex items-center space-x-1">
                  <span>🎒</span>
                  <span>ESPACE PRIMAIRE</span>
                </div>
                <div className="text-xs font-black mt-1">Maître d'École</div>
                <div className="text-[10px] text-slate-500 font-normal">Instituteur Titulaire CI-CM2</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('MAITRESSE')}
                className={`p-3 rounded-2xl border-2 text-left font-black transition-all cursor-pointer ${
                  teacherType === 'MAITRESSE'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                }`}
              >
                <div className="text-emerald-700 dark:text-emerald-400 font-black text-[11px] flex items-center space-x-1">
                  <span>🎒</span>
                  <span>ESPACE PRIMAIRE</span>
                </div>
                <div className="text-xs font-black mt-1">Maîtresse d'École</div>
                <div className="text-[10px] text-slate-500 font-normal">Institutrice Titulaire CI-CM2</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('MAITRESSE_MAT')}
                className={`p-3 rounded-2xl border-2 text-left font-black transition-all cursor-pointer ${
                  teacherType === 'MAITRESSE_MAT'
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                }`}
              >
                <div className="text-amber-700 dark:text-amber-400 font-black text-[11px] flex items-center space-x-1">
                  <span>🧸</span>
                  <span>MATERNELLE</span>
                </div>
                <div className="text-xs font-black mt-1">Maîtresse d'Éveil</div>
                <div className="text-[10px] text-slate-500 font-normal">Petite, Moyenne & Grande</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('PROF_COLLEGE')}
                className={`p-3 rounded-2xl border-2 text-left font-black transition-all cursor-pointer ${
                  teacherType === 'PROF_COLLEGE'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                <div className="text-blue-700 dark:text-blue-400 font-black text-[11px] flex items-center space-x-1">
                  <span>🏫</span>
                  <span>SECONDAIRE COLLÈGE</span>
                </div>
                <div className="text-xs font-black mt-1">Professeur Collège</div>
                <div className="text-[10px] text-slate-500 font-normal">6ème à la 3ème</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('PROF_LYCEE')}
                className={`p-3 rounded-2xl border-2 text-left font-black transition-all cursor-pointer ${
                  teacherType === 'PROF_LYCEE'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-950 dark:text-purple-100 ring-2 ring-purple-500/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                }`}
              >
                <div className="text-purple-700 dark:text-purple-400 font-black text-[11px] flex items-center space-x-1">
                  <span>🎓</span>
                  <span>SECONDAIRE LYCÉE</span>
                </div>
                <div className="text-xs font-black mt-1">Professeur Lycée</div>
                <div className="text-[10px] text-slate-500 font-normal">2nde, 1ère, Terminale</div>
              </button>
            </div>
          </div>

          {/* Section 2: Photo de l'Enseignant (Upload manuel ou sélection) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-black text-slate-800 dark:text-slate-200">
                2. Photo de l'Enseignant (Importation Manuelle ou Présélection)
              </label>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                JPG / PNG / Caméra
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Photo Preview */}
              <div className="relative group">
                <img
                  src={photoUrl}
                  alt="Aperçu Enseignant"
                  className="h-20 w-20 rounded-2xl object-cover ring-4 ring-emerald-500/30 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => addFileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-black"
                >
                  <Camera className="h-4 w-4 mb-0.5" />
                  <span>Changer</span>
                </button>
              </div>

              {/* Upload Action */}
              <div className="flex-1 space-y-2 w-full">
                <input
                  type="file"
                  ref={addFileInputRef}
                  onChange={e => handlePhotoUpload(e, 'ADD')}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addFileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Importer une Photo de l'appareil</span>
                  </button>

                  <span className="text-[11px] text-slate-400 font-bold">ou choisir un avatar :</span>
                </div>

                {/* Preset Avatars Row */}
                <div className="flex items-center space-x-2 pt-1 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPhotoUrl(av.url);
                        setCustomPhotoSelected(true);
                      }}
                      className={`relative rounded-xl p-0.5 border-2 transition-all cursor-pointer shrink-0 ${
                        photoUrl === av.url ? 'border-emerald-600 scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={av.label}
                    >
                      <img src={av.url} alt={av.label} className="h-9 w-9 rounded-lg object-cover" />
                      {photoUrl === av.url && (
                        <span className="absolute -top-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Informations Personnelles & Professionnelles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                Prénom de l'Enseignant *
              </label>
              <input
                type="text"
                required
                placeholder={teacherType === 'MAITRE' ? 'ex: Paulin' : teacherType === 'MAITRESSE' ? 'ex: Aïcha' : 'ex: Anicet'}
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                Nom de Famille *
              </label>
              <input
                type="text"
                required
                placeholder="ex: MENSAH, DOSSOU..."
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                Diplôme & Titre Pédagogique
              </label>
              <input
                type="text"
                value={qualification}
                onChange={e => setQualification(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                Numéro de Téléphone
              </label>
              <input
                type="text"
                placeholder="ex: 01 96 00 11 22"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                Adresse Email Professionnelle
              </label>
              <input
                type="email"
                placeholder="ex: enseignant@groupe-excellence.bj"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                Salaire Mensuel ({settings.currency})
              </label>
              <input
                type="number"
                step="5000"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                Matières / Niveaux Enseignés (séparés par des virgules)
              </label>
              <input
                type="text"
                value={subjectsStr}
                onChange={e => setSubjectsStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                Classe Titulaire / Affectation
              </label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Sélectionner une classe...</option>
                {availableClassesForType.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Inscrire & Ajouter dans l'Espace Dédié</span>
            </button>
          </div>
        </form>
      )}

      {/* Teachers Grid Display */}
      {filteredTeachers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <GraduationCap className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="font-black text-base text-slate-700 dark:text-slate-300">
            Aucun enseignant dans cet espace
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {filterLevel === 'PRIMAIRE'
              ? 'Aucun Maître ou Maîtresse du Primaire enregistré pour le moment. Cliquez ci-dessous pour inscrire le premier Maître du Primaire.'
              : filterLevel === 'MATERNELLE'
              ? 'Aucune Maîtresse de Maternelle enregistrée pour le moment.'
              : 'Aucun Professeur du Secondaire enregistré pour ce cycle.'}
          </p>
          <button
            onClick={() => handleOpenAddWithType(filterLevel === 'PRIMAIRE' ? 'MAITRE' : filterLevel === 'MATERNELLE' ? 'MAITRESSE_MAT' : 'PROF_COLLEGE')}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs inline-flex items-center space-x-1.5 shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Inscrire un enseignant</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map(tch => {
            const category = getTeacherCategory(tch);
            const isMaternelle = category === 'MATERNELLE';
            const isPrimaire = category === 'PRIMAIRE';
            const isLycee = category === 'LYCEE';

            const badgeLabel = isMaternelle 
              ? '🧸 Maîtresse de Maternelle' 
              : isPrimaire 
              ? (tch.firstName.toLowerCase().includes('maîtresse') || (tch.qualification || '').toLowerCase().includes('institutrice') ? '🎒 Maîtresse (Primaire)' : '🎒 Maître Titulaire (Primaire)')
              : isLycee
              ? '🎓 Professeur de Lycée'
              : '🏫 Professeur de Collège';

            const badgeClass = isMaternelle
              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              : isPrimaire
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : isLycee
              ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
              : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';

            return (
              <div
                key={tch.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 relative group hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start space-x-3">
                    {/* Photo with 1-click Change Camera overlay */}
                    <div className="relative group/avatar shrink-0">
                      <img
                        src={tch.photoUrl || PRESET_AVATARS[0].url}
                        alt={tch.firstName}
                        className="h-14 w-14 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-sm bg-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setTargetQuickTeacherId(tch.id);
                          quickFileInputRef.current?.click();
                        }}
                        className="absolute inset-0 bg-slate-950/70 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-[9px] font-black"
                        title="Changer la photo de ce maître / professeur"
                      >
                        <Camera className="h-3.5 w-3.5 mb-0.5 text-emerald-400" />
                        <span>Photo</span>
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 pr-12">
                      <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider mb-1 ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                        {tch.firstName} {tch.lastName}
                      </h4>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold truncate">
                        {tch.qualification || (isPrimaire ? 'Instituteur Titulaire' : 'Professeur Certifié')}
                      </p>
                    </div>

                    {/* Top right actions */}
                    <div className="flex items-center space-x-1 absolute top-4 right-4">
                      <button
                        onClick={() => openEditModal(tch)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Modifier les informations ou la photo"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Êtes-vous sûr de vouloir supprimer l'enseignant ${tch.firstName} ${tch.lastName} ?`)) {
                            deleteTeacher(tch.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Supprimer l'enseignant"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold">{tch.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-semibold">{tch.email}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-bold text-slate-500">Rémunération :</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {tch.salary?.toLocaleString()} {settings.currency} / mois
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-1">
                  {(tch.subjects || []).map((s, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${
                        isPrimaire 
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40' 
                          : isMaternelle
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                      }`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                  <Edit2 className="h-4 w-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Modifier les Informations & Photo
                </h3>
              </div>
              <button
                onClick={() => setEditingTeacher(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Photo Edit Section */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
                <img
                  src={editPhotoUrl || PRESET_AVATARS[0].url}
                  alt="Aperçu"
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-blue-500/30 shrink-0"
                />
                <div className="space-y-1.5 flex-1">
                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={e => handlePhotoUpload(e, 'EDIT')}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Changer la Photo (Fichier / Caméra)</span>
                  </button>
                  <p className="text-[10px] text-slate-400">Importez une nouvelle photo pour cet enseignant.</p>
                </div>
              </div>

              {/* Cycle Assignment */}
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  Espace & Cycle d'Enseignement *
                </label>
                <select
                  value={editCycle}
                  onChange={e => setEditCycle(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="PRIMAIRE">🎒 Espace Primaire (Maître / Maîtresse)</option>
                  <option value="MATERNELLE">🧸 Espace Maternelle (Maîtresse d'Éveil)</option>
                  <option value="COLLEGE">🏫 Espace Collège (Professeur Certifié)</option>
                  <option value="LYCEE">🎓 Espace Lycée (Professeur de Lycée)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={e => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    Nom de Famille *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={e => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    Salaire Mensuel ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={editSalary}
                    onChange={e => setEditSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  Diplôme & Titre Pédagogique
                </label>
                <input
                  type="text"
                  value={editQualification}
                  onChange={e => setEditQualification(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  Matières / Niveaux (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={editSubjectsStr}
                  onChange={e => setEditSubjectsStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer shadow-md"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
