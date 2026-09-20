import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { School } from '../types';
import { SchoolPasswordModal } from '../components/modals/SchoolPasswordModal';
import {
  Building2,
  Plus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Users,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Award,
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  KeyRound,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Save
} from 'lucide-react';

interface MultiSchoolHubViewProps {
  onNavigate: (view: string) => void;
  onOpenCreateSchoolModal: () => void;
}

export const MultiSchoolHubView: React.FC<MultiSchoolHubViewProps> = ({
  onNavigate,
  onOpenCreateSchoolModal
}) => {
  const {
    schools,
    currentSchoolId,
    currentSchool,
    switchSchool,
    updateSchool,
    deleteSchool,
    isSchoolUnlocked,
    toggleSchoolAccessProtection,
    currentUser
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState<'ALL' | 'PRIMAIRE' | 'SECONDAIRE'>('ALL');
  const [selectedSchoolToUnlock, setSelectedSchoolToUnlock] = useState<School | null>(null);
  const [adminControlMode, setAdminControlMode] = useState(true);

  // Edit school modal state
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editName, setEditName] = useState('');
  const [editMotto, setEditMotto] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSchoolType, setEditSchoolType] = useState('');
  const [editDirectorName, setEditDirectorName] = useState('');

  // Delete school modal state
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const isPromoter = (currentUser?.email?.toLowerCase().trim() === 'mahounouvictor123@gmail.com') ||
    (typeof window !== 'undefined' && localStorage.getItem('GESTIONNAIRE_PROMOTER_AUTH') === 'true');

  const openEditModal = (s: School, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSchool(s);
    setEditName(s.name);
    setEditMotto(s.motto || '');
    setEditCity(s.city || '');
    setEditAddress(s.address || '');
    setEditPhone(s.phone || '');
    setEditEmail(s.email || '');
    setEditSchoolType(s.schoolType || 'Groupe Scolaire');
    setEditDirectorName(s.directorName || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool || !editName.trim()) return;

    updateSchool(editingSchool.id, {
      name: editName.trim(),
      motto: editMotto.trim(),
      city: editCity.trim(),
      address: editAddress.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      schoolType: editSchoolType.trim(),
      directorName: editDirectorName.trim()
    });

    setNoticeMessage(`Le nom et les informations de « ${editName.trim()} » ont été mis à jour avec succès !`);
    setTimeout(() => setNoticeMessage(null), 4000);
    setEditingSchool(null);
  };

  const openDeleteModal = (s: School, e: React.MouseEvent) => {
    e.stopPropagation();
    if (schools.length <= 1) {
      alert('Impossible de supprimer le seul établissement actif du hub.');
      return;
    }
    setDeletingSchool(s);
    setDeleteConfirmInput('');
  };

  const handleConfirmDelete = () => {
    if (!deletingSchool) return;
    if (deleteConfirmInput.trim().toLowerCase() !== deletingSchool.name.trim().toLowerCase()) {
      alert('Le nom saisi ne correspond pas exactement au nom de l\'école à supprimer.');
      return;
    }

    const schoolTitle = deletingSchool.name;
    deleteSchool(deletingSchool.id);
    setDeletingSchool(null);
    setDeleteConfirmInput('');
    setNoticeMessage(`L'établissement « ${schoolTitle} » a été supprimé du système.`);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  if (!isPromoter) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-300">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
            <Building2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Espace Scolaire Dédié : {currentSchool?.name}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Vous êtes connecté sur la plateforme exclusive de votre établissement. Vos données, paramètres, fiches élèves et tableaux de bord sont strictement isolés et autonomes.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500">Nom de l'École :</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{currentSchool?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500">Ville / Localité :</span>
              <span className="font-bold text-slate-900 dark:text-white">{currentSchool?.city}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500">Code Agrément :</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{currentSchool?.officialCode}</span>
            </div>
          </div>

          {/* Separation overview in dedicated school screen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1 text-xs">
              <div className="flex items-center space-x-1.5 text-emerald-800 dark:text-emerald-300 font-black">
                <span>🎒</span>
                <span>COURS MATERNELLE & PRIMAIRE</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                Administration : <span className="text-emerald-700 dark:text-emerald-400">Directeur(rice) • Secrétaire • Maîtres / Maîtresses</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1 text-xs">
              <div className="flex items-center space-x-1.5 text-blue-800 dark:text-blue-300 font-black">
                <span>🏫</span>
                <span>COURS SECONDAIRE</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                Administration : <span className="text-blue-700 dark:text-blue-400">Proviseur • Censeur • Surveillant • Professeurs</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>ACCÉDER À MON TABLEAU DE BORD</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const filteredSchools = schools.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.motto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.schoolType && s.schoolType.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (cycleFilter === 'PRIMAIRE') {
      return (s.primaryTeachersCount && s.primaryTeachersCount > 0) ||
        (s.schoolType?.toLowerCase().includes('primaire') || s.schoolType?.toLowerCase().includes('maternelle') || s.schoolType?.toLowerCase().includes('complexe'));
    }
    if (cycleFilter === 'SECONDAIRE') {
      return (s.secondaryProfessorsCount && s.secondaryProfessorsCount > 0) ||
        (s.schoolType?.toLowerCase().includes('secondaire') || s.schoolType?.toLowerCase().includes('lycée') || s.schoolType?.toLowerCase().includes('collège') || s.schoolType?.toLowerCase().includes('complexe'));
    }
    return true;
  });

  const handleSelectSchool = (school: School) => {
    const unlocked = isSchoolUnlocked(school.id);
    if (unlocked) {
      switchSchool(school.id);
      onNavigate('dashboard');
    } else {
      setSelectedSchoolToUnlock(school);
    }
  };

  const handlePasswordSuccess = () => {
    if (selectedSchoolToUnlock) {
      switchSchool(selectedSchoolToUnlock.id);
      setSelectedSchoolToUnlock(null);
      onNavigate('dashboard');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Exit Navigation Bar */}
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3 sm:p-4 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-900/40 border border-blue-400/30 transition-all transform hover:scale-[1.02] cursor-pointer group"
            title="Revenir au Tableau de Bord de l'École"
          >
            <ArrowLeft className="h-4 w-4 text-amber-300 group-hover:-translate-x-1 transition-transform" />
            <span>← Retour École (Tableau de Bord)</span>
          </button>

          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <Building2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Gestion Multi-Établissements</span>
          </span>
        </div>

        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-950/60 border border-rose-400/30 transition-all transform hover:scale-105 cursor-pointer"
          title="Fermer l'espace multi-écoles et sortir"
          aria-label="Fermer et Sortir"
        >
          <X className="h-4 w-4" />
          <span>Sortir</span>
        </button>
      </div>

      {/* Hero Welcome Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-emerald-950 p-8 sm:p-10 text-white overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-extrabold tracking-wide uppercase">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Portail Multi-Établissements Sécurisé</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Plateforme de Gestion Multi-Écoles & Réseau Scolaire
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
            Chaque établissement dispose d'un espace de gestion entièrement cloisonné et autonome. Sélectionnez une école ci-dessous, modifiez son nom ou créez un nouvel établissement.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onOpenCreateSchoolModal}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Plus className="h-5 w-5" />
              <span>CRÉER MON ÉCOLE</span>
            </button>

            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>Données confidentielles protégées par école</span>
            </div>
          </div>
        </div>
      </div>

      {noticeMessage && (
        <div className="p-4 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-black text-xs rounded-2xl border border-emerald-300 dark:border-emerald-800 flex items-center space-x-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Quick Search & Stats bar */}
      <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une école, ville ou type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 text-slate-900 dark:text-white outline-none font-bold"
            />
          </div>

          <div className="flex flex-wrap items-center space-x-3 text-xs font-bold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => onNavigate('promoter-admin')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
              title="Espace réservé exclusivement au Promoteur Général de la plateforme"
            >
              <ShieldCheck className="h-4 w-4 text-slate-950" />
              <span>👑 Espace Promoteur (Gmail)</span>
            </button>

            <span className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              Écoles enregistrées : <strong className="text-blue-600 dark:text-blue-400">{schools.length}</strong>
            </span>

            <button
              onClick={onOpenCreateSchoolModal}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Créer une École</span>
            </button>
          </div>
        </div>

        {/* Cycle Filter Selection Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setCycleFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              cycleFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            🏛️ Tous les Établissements ({schools.length})
          </button>

          <button
            onClick={() => setCycleFilter('PRIMAIRE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              cycleFilter === 'PRIMAIRE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span>🎒</span>
            <span>Cours Maternelle & Primaire</span>
          </button>

          <button
            onClick={() => setCycleFilter('SECONDAIRE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              cycleFilter === 'SECONDAIRE'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100'
            }`}
          >
            <span>🏫</span>
            <span>Cours Secondaire (Collège & Lycée)</span>
          </button>
        </div>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchools.map((school) => {
          const isSelected = school.id === currentSchoolId;
          const isUnlocked = isSchoolUnlocked(school.id);
          const isProtectedByPassword = !!school.accessPassword;

          return (
            <div
              key={school.id}
              className={`group relative rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Badges */}
              <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5">
                {!isProtectedByPassword ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Accès Libre</span>
                  </span>
                ) : isUnlocked ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1">
                    <Unlock className="h-3 w-3" />
                    <span>Déverrouillé</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[10px] font-black border border-rose-300 dark:border-rose-800 flex items-center space-x-1">
                    <Lock className="h-3 w-3" />
                    <span>Protégé</span>
                  </span>
                )}

                {isSelected && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Actif</span>
                  </span>
                )}
              </div>

              {/* School Header Card */}
              <div className="p-6 space-y-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={school.logoUrl}
                    alt={school.name}
                    className="h-16 w-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 bg-slate-50"
                  />
                  <div className="space-y-1 min-w-0 flex-1 pr-12">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="inline-block text-[10px] font-extrabold uppercase tracking-wide text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900 truncate max-w-full">
                        {school.schoolType || 'Établissement Scolaire'}
                      </span>
                      <span className="inline-flex items-center space-x-1 text-[10px] font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                        <span>{school.countryFlag || '🌍'}</span>
                        <span>{school.country || 'Afrique'}</span>
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {school.name}
                    </h3>
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic line-clamp-1">
                  « {school.motto} »
                </p>

                {/* Directory Meta Info */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{school.city} • {school.address}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{school.phone}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Award className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Directeur: <strong>{school.directorName}</strong></span>
                  </div>
                </div>

                {/* Dual-Cycle Official Separation & Administration Blocks */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  {/* Primaire & Maternelle Pole */}
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center space-x-1">
                        <span>🎒</span>
                        <span>COURS MATERNELLE & PRIMAIRE</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                        {school.primaryTeachersCount || 0} Maîtres(ses)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      <span className="font-bold text-slate-700 dark:text-slate-200">Administration Primaire : </span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">Directeur</span> • <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">Secrétaire</span> • <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">Maîtres & Maîtresses</span>
                    </div>
                  </div>

                  {/* Secondaire Pole */}
                  <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-blue-800 dark:text-blue-300 text-[11px] flex items-center space-x-1">
                        <span>🏫</span>
                        <span>COURS SECONDAIRE (Collège & Lycée)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200">
                        {school.secondaryProfessorsCount || 0} Professeurs
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      <span className="font-bold text-slate-700 dark:text-slate-200">Administration Secondaire : </span>
                      <span className="text-blue-700 dark:text-blue-400 font-extrabold">Proviseur</span> • <span className="text-blue-700 dark:text-blue-400 font-extrabold">Censeur</span> • <span className="text-blue-700 dark:text-blue-400 font-extrabold">Surveillant</span> • <span className="text-blue-700 dark:text-blue-400 font-extrabold">Professeurs</span>
                    </div>
                  </div>
                </div>

                {/* Public Numbers */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="block text-base font-black text-slate-900 dark:text-white">
                      {school.totalStudentsCount || 0}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Élèves Total
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                    <span className="block text-base font-black text-emerald-600 dark:text-emerald-400">
                      {school.primaryTeachersCount || 0}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      Maîtres(ses)
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                    <span className="block text-base font-black text-blue-600 dark:text-blue-400">
                      {school.secondaryProfessorsCount || 0}
                    </span>
                    <span className="text-[9px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                      Professeurs
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Access Control & Quick Edit/Delete Bar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Gestion de l'École
                  </span>
                  
                  {/* Edit & Delete Action Buttons on School Card */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={(e) => openEditModal(school, e)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer"
                      title="Modifier le nom et les informations de cette école"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Modifier</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => openDeleteModal(school, e)}
                      disabled={schools.length <= 1}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                      title="Supprimer cette école"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {adminControlMode && (
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <span>👑 Accès Admin</span>
                      <span className={isProtectedByPassword ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                        {isProtectedByPassword ? '🔒 Protégé par MDP' : '🟢 Accès Libre'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSchoolAccessProtection(school.id, false)}
                        className={`py-1 px-2 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                          !isProtectedByPassword
                            ? 'bg-emerald-600 text-white ring-1 ring-emerald-500/50 shadow-xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Accès Libre</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSchoolAccessProtection(school.id, true)}
                        className={`py-1 px-2 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                          isProtectedByPassword
                            ? 'bg-rose-600 text-white ring-1 ring-rose-500/50 shadow-xs'
                            : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                        <span>Bloquer par MDP</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Action */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleSelectSchool(school)}
                  className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    isUnlocked
                      ? isSelected
                        ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                        : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                  }`}
                >
                  {!isUnlocked ? (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Déverrouiller avec le Mot de Passe (8 car.)</span>
                    </>
                  ) : (
                    <>
                      <span>{isSelected ? 'Gérer cette École' : "Accéder à l'Espace de cet Établissement"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Edit School Modal */}
      {editingSchool && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                  <Edit2 className="h-4 w-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Modifier le Nom & Coordonnées de l'École
                </h3>
              </div>
              <button
                onClick={() => setEditingSchool(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  Nom de l'Établissement Scolaire *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Ex: GROUPE SCOLAIRE L'EXCELLENCE"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Type d'Établissement</label>
                  <input
                    type="text"
                    value={editSchoolType}
                    onChange={e => setEditSchoolType(e.target.value)}
                    placeholder="Ex: Groupe Scolaire, Lycée, Collège..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Nom du Directeur</label>
                  <input
                    type="text"
                    value={editDirectorName}
                    onChange={e => setEditDirectorName(e.target.value)}
                    placeholder="Ex: M. Paulin MENSAH"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Devise de l'École (Motto)</label>
                <input
                  type="text"
                  value={editMotto}
                  onChange={e => setEditMotto(e.target.value)}
                  placeholder="Ex: Travail - Discipline - Succès"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Ville</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={e => setEditCity(e.target.value)}
                    placeholder="Ex: Abidjan, Cotonou, Lomé..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="Ex: +225 07 00 00 00"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Adresse Géographique</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  placeholder="Ex: Cocody Angré 8ème Tranche"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="pt-3 flex space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSchool(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-extrabold text-white shadow-md cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Save className="h-4 w-4" />
                  <span>Enregistrer les Changements</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete School Modal */}
      {deletingSchool && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-rose-200 dark:border-rose-900 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Confirmation de Suppression
                </h3>
              </div>
              <button
                onClick={() => { setDeletingSchool(null); setDeleteConfirmInput(''); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p className="leading-relaxed">
                Êtes-vous certain de vouloir supprimer définitivement l'école <strong className="text-slate-900 dark:text-white">« {deletingSchool.name} »</strong> ?
              </p>
              
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-[11px] font-bold">
                Pour confirmer la suppression, veuillez saisir le nom exact ci-dessous :
                <span className="block mt-1 font-mono text-xs text-rose-950 dark:text-rose-100 font-black">{deletingSchool.name}</span>
              </div>

              <input
                type="text"
                value={deleteConfirmInput}
                onChange={e => setDeleteConfirmInput(e.target.value)}
                placeholder="Tapez le nom de l'école ici..."
                className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-3 flex space-x-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setDeletingSchool(null); setDeleteConfirmInput(''); }}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmInput.trim().toLowerCase() !== deletingSchool.name.trim().toLowerCase()}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold text-white shadow-md cursor-pointer flex items-center justify-center space-x-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Confirmer la Suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Unlock Modal */}
      {selectedSchoolToUnlock && (
        <SchoolPasswordModal
          isOpen={true}
          school={selectedSchoolToUnlock}
          onSuccess={handlePasswordSuccess}
          onCancel={() => setSelectedSchoolToUnlock(null)}
        />
      )}

    </div>
  );
};
