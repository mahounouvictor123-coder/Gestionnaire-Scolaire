import React, { useState, useMemo } from 'react';
import { useApp } from '../../lib/store';
import { useGoogleAuth } from '../GoogleAuthGate';
import { School } from '../../types';
import { buildDirectSchoolAccessUrl } from '../../lib/urlUtils';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Trash2,
  Search,
  Building2,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  Key,
  X,
  Sliders,
  Sparkles,
  Crown,
  ChevronRight,
  LogIn,
  Check,
  Zap,
  Globe,
  Plus,
  Smartphone,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface PromoterSchoolsControlBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
  onOpenCreateSchoolModal?: () => void;
}

const AUTHORIZED_GMAIL = 'mahounouvictor123@gmail.com';

export const PromoterSchoolsControlBoxModal: React.FC<PromoterSchoolsControlBoxModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenCreateSchoolModal
}) => {
  const {
    schools,
    currentSchoolId,
    switchSchool,
    deleteSchool,
    toggleSchoolBlockStatus,
    updateSchool,
    toggleSchoolAccessProtection,
    adminSetSchoolSubscription,
    currentUser,
    loginUser,
    isSchoolUnlocked
  } = useApp();

  const { gmailUser, signOutGoogle } = useGoogleAuth();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');

  // Action States
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [schoolToBlock, setSchoolToBlock] = useState<School | null>(null);
  const [customBlockReason, setCustomBlockReason] = useState("Abonnement requis - Accès suspendu à distance par le Promoteur Général");
  const [copiedSchoolId, setCopiedSchoolId] = useState<string | null>(null);
  const [editingPasswordSchoolId, setEditingPasswordSchoolId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Direct Victor Email Identification if needed
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Check if active user is strictly mahounouvictor123@gmail.com
  const isAuthorizedMaster = useMemo(() => {
    const gmailAuthEmail = gmailUser?.email?.toLowerCase().trim();
    const currentAuthEmail = currentUser?.email?.toLowerCase().trim();
    const storedAuthEmail = typeof window !== 'undefined' ? localStorage.getItem('GESTIONNAIRE_MASTER_EMAIL') : null;
    const isPromoterAuthFlag = typeof window !== 'undefined' && localStorage.getItem('GESTIONNAIRE_PROMOTER_AUTH') === 'true';

    return (
      gmailAuthEmail === AUTHORIZED_GMAIL ||
      currentAuthEmail === AUTHORIZED_GMAIL ||
      storedAuthEmail === AUTHORIZED_GMAIL ||
      isPromoterAuthFlag
    );
  }, [gmailUser, currentUser]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleAuthorizeDirectly = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    // Master authorization for Victor Mahounou
    loginUser(AUTHORIZED_GMAIL, 'Victor Mahounou', 'SUPER_ADMIN');
    localStorage.setItem('GESTIONNAIRE_MASTER_EMAIL', AUTHORIZED_GMAIL);
    localStorage.setItem('GESTIONNAIRE_PROMOTER_AUTH', 'true');
    showNotification("Authentification réussie en tant que Promoteur Master.");
  };

  // Filter schools
  const filteredSchools = schools.filter(school => {
    const matchesSearch =
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (school.city && school.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (school.directorName && school.directorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (school.phone && school.phone.includes(searchTerm)) ||
      (school.id && school.id.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'ACTIVE') {
      return !school.isBlocked && school.isValidatedByPromoter !== false;
    }
    if (statusFilter === 'BLOCKED') {
      return school.isBlocked || school.isValidatedByPromoter === false;
    }
    return true;
  });

  const totalStudents = schools.reduce((acc, s) => acc + (s.totalStudentsCount || 0), 0);
  const totalBlocked = schools.filter(s => s.isBlocked || s.isValidatedByPromoter === false).length;
  const totalActive = schools.length - totalBlocked;

  // Handle Block / Unblock
  const handleConfirmBlock = (school: School) => {
    toggleSchoolBlockStatus(school.id, true, customBlockReason);
    setSchoolToBlock(null);
    showNotification(`⛔ L'établissement « ${school.name} » a été verrouillé à distance.`);
  };

  const handleUnblock = (school: School) => {
    toggleSchoolBlockStatus(school.id, false);
    // Also extend trial/access date to ensure it opens immediately
    updateSchool(school.id, {
      isBlocked: false,
      isValidatedByPromoter: true,
      dailyAccessPaidUntil: '2099-12-31'
    });
    showNotification(`✅ L'établissement « ${school.name} » a été débloqué avec succès.`);
  };

  // Handle Delete
  const handleConfirmDelete = () => {
    if (!schoolToDelete) return;
    const deletedName = schoolToDelete.name;
    deleteSchool(schoolToDelete.id);
    setSchoolToDelete(null);
    setDeleteConfirmationText('');
    showNotification(`🗑️ L'établissement « ${deletedName} » a été définitivement supprimé.`);
  };

  // Copy direct link
  const handleCopyDirectLink = (school: School) => {
    const url = buildDirectSchoolAccessUrl(school);
    navigator.clipboard.writeText(url);
    setCopiedSchoolId(school.id);
    setTimeout(() => setCopiedSchoolId(null), 2500);
    showNotification(`🔗 Lien direct copié pour « ${school.name} » !`);
  };

  // Save new password
  const handleSavePassword = (schoolId: string) => {
    if (newPasswordInput.trim().length >= 4) {
      updateSchool(schoolId, { accessPassword: newPasswordInput.trim() });
      setEditingPasswordSchoolId(null);
      setNewPasswordInput('');
      showNotification("Mot de passe d'accès mis à jour avec succès.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-4 sm:p-6 border-b border-purple-900/50 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center space-x-3 sm:space-x-3.5 relative z-10">
            {/* Back Arrow button */}
            <button
              onClick={onClose}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer group"
              title="Retourner à l'Espace École"
            >
              <ArrowLeft className="h-4 w-4 text-amber-300 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Retour École</span>
            </button>

            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-lg shadow-amber-500/20 text-slate-950 flex items-center justify-center shrink-0">
              <Crown className="h-5 w-5 sm:h-6 sm:w-6 font-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Boîte Contrôle & Télécommande</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase bg-purple-500/30 text-purple-200 border border-purple-400/40">
                  Master Box
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-purple-200/80 font-medium mt-0.5 flex items-center gap-1">
                <span className="hidden sm:inline">Accès exclusif :</span>
                <span className="font-mono font-bold text-amber-300 bg-black/30 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
                  {AUTHORIZED_GMAIL}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 relative z-10">
            {/* Red Exit Cross Button */}
            <button
              onClick={onClose}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-950/60 border border-rose-400/30 transition-all cursor-pointer"
              title="Fermer la boîte de contrôle et sortir"
              aria-label="Fermer et Sortir"
            >
              <X className="h-4 w-4" />
              <span>Sortir</span>
            </button>
          </div>
        </div>

        {/* Action Success Toast */}
        {actionSuccessMsg && (
          <div className="bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shrink-0 animate-in slide-in-from-top-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)} className="text-white hover:text-emerald-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Security Gate Check if not Victor Mahounou */}
        {!isAuthorizedMaster ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-6 max-w-md mx-auto">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-3xl text-rose-600">
              <ShieldAlert className="h-14 w-14 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Accès Strictement Réservé
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Cette boîte de commande permet le contrôle à distance, le blocage et la suppression d'écoles. Elle est exclusivement réservée à l'adresse Gmail :
              </p>
              <p className="font-mono text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 inline-block">
                {AUTHORIZED_GMAIL}
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl w-full">
                {authError}
              </div>
            )}

            <div className="w-full space-y-3">
              <button
                onClick={handleAuthorizeDirectly}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Crown className="h-4 w-4" />
                <span>Ouvrir en tant que {AUTHORIZED_GMAIL}</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                Annuler et Retourner
              </button>
            </div>
          </div>
        ) : (
          /* Main Control Box Content */
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">

            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Écoles</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{schools.length}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Écoles Actives</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{totalActive}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Écoles Bloquées</p>
                  <p className="text-xl font-black text-rose-600 dark:text-rose-400">{totalBlocked}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Élèves Gérés</p>
                  <p className="text-xl font-black text-purple-600 dark:text-purple-400">{totalStudents}</p>
                </div>
              </div>
            </div>

            {/* Super-Promoteur Parent Subscriptions Management Hub Button */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border-2 border-purple-500/50 shadow-xl shadow-purple-950/40 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                    Nouveau • Promoteur
                  </span>
                  <span className="text-sm font-black text-purple-200">
                    Abonnements Application Parents
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    60% Promoteur (600F / 5 400F) • 30% École (300F / 2 700F)
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Activer les parents à distance par téléphone, générer les reçus officiels (1 000F / 9 000F), envoyer directement le code par WhatsApp et suivre la caisse financière.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigate) {
                    onNavigate('super-promoteur');
                  }
                }}
                className="w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0 border border-amber-200"
              >
                <Smartphone className="h-4 w-4 text-slate-950" />
                <span>Gérer les Abonnements Parents</span>
                <ArrowRight className="h-4 w-4 text-slate-950" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, ville, directeur, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      statusFilter === 'ALL'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Toutes ({schools.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      statusFilter === 'ACTIVE'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Actives ({totalActive})
                  </button>
                  <button
                    onClick={() => setStatusFilter('BLOCKED')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      statusFilter === 'BLOCKED'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Bloquées ({totalBlocked})
                  </button>
                </div>

                {onOpenCreateSchoolModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreateSchoolModal();
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Nouvelle École</span>
                  </button>
                )}
              </div>
            </div>

            {/* School List Cards */}
            <div className="space-y-3">
              {filteredSchools.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                  <Building2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold">Aucun établissement ne correspond à votre recherche.</p>
                </div>
              ) : (
                filteredSchools.map((school) => {
                  const isBlocked = school.isBlocked || school.isValidatedByPromoter === false;
                  const isCurrent = school.id === currentSchoolId;
                  const isEditingPassword = editingPasswordSchoolId === school.id;

                  return (
                    <div
                      key={school.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isBlocked
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                          : isCurrent
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 shadow-sm'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* School Basic Info */}
                        <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                          <img
                            src={school.logoUrl || '/icon.svg'}
                            alt={school.name}
                            className="h-12 w-12 rounded-2xl object-cover bg-white shrink-0 border border-slate-200 shadow-xs"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                                {school.name}
                              </h3>
                              
                              {/* Status Badge */}
                              {isBlocked ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center space-x-1">
                                  <Lock className="h-3 w-3" />
                                  <span>ACCÈS BLOQUÉ</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  <span>ACTIF & DÉBLOQUÉ</span>
                                </span>
                              )}

                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-indigo-600 text-white">
                                  ÉCOLE ACTIVE ACTUELLE
                                </span>
                              )}

                              {school.dailyAccessPaidUntil && (
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                                  Licence jusqu'au : {school.dailyAccessPaidUntil}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap gap-y-1">
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                <span>{school.city || 'Non renseigné'}</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center space-x-1">
                                <Users className="h-3.5 w-3.5 text-slate-400" />
                                <span className="font-bold text-slate-700 dark:text-slate-300">{school.totalStudentsCount || 0} élèves</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center space-x-1">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                <span>{school.phone || 'Non renseigné'}</span>
                              </span>
                              {school.directorName && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">Dir: <strong className="text-slate-700 dark:text-slate-300">{school.directorName}</strong></span>
                                </>
                              )}
                            </div>

                            {/* Block Reason Note if Blocked */}
                            {isBlocked && (
                              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                <span>Motif de suspension : {school.blockReason || "Abonnement requis / Bloqué à distance"}</span>
                              </p>
                            )}

                            {/* Password management inline */}
                            <div className="mt-2 flex items-center space-x-2 text-xs">
                              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                Mot de passe d'accès :
                              </span>
                              {isEditingPassword ? (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="text"
                                    value={newPasswordInput}
                                    onChange={(e) => setNewPasswordInput(e.target.value)}
                                    placeholder="Nouveau code"
                                    className="px-2 py-0.5 text-xs rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 text-slate-900 dark:text-white w-28 font-mono outline-none"
                                  />
                                  <button
                                    onClick={() => handleSavePassword(school.id)}
                                    className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                    title="Enregistrer"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingPasswordSchoolId(null)}
                                    className="p-1 rounded-md bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                                    title="Annuler"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded text-[11px]">
                                    {school.accessPassword || '12345678'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingPasswordSchoolId(school.id);
                                      setNewPasswordInput(school.accessPassword || '12345678');
                                    }}
                                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                                  >
                                    Modifier
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Remote Control Action Buttons */}
                        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-700">
                          
                          {/* 1. SWITCH / PRENDRE LE CONTRÔLE */}
                          <button
                            onClick={() => {
                              switchSchool(school.id);
                              onClose();
                              if (onNavigate) onNavigate('dashboard');
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                            title="Basculer immédiatement sur cette école pour administrer ses données"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Prendre le contrôle</span>
                          </button>

                          {/* 2. COPIER LIEN DIRECT */}
                          <button
                            onClick={() => handleCopyDirectLink(school)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                            title="Copier le lien direct vers cette école"
                          >
                            {copiedSchoolId === school.id ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>

                          {/* 3. BLOQUER / DÉBLOQUER À DISTANCE */}
                          {isBlocked ? (
                            <button
                              onClick={() => handleUnblock(school)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                              title="Débloquer l'accès à distance pour cet établissement"
                            >
                              <Unlock className="h-3.5 w-3.5" />
                              <span>Débloquer l'école</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSchoolToBlock(school)}
                              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                              title="Suspendre et bloquer l'accès à distance pour cet établissement"
                            >
                              <Lock className="h-3.5 w-3.5" />
                              <span>Bloquer à distance</span>
                            </button>
                          )}

                          {/* 4. SUPPRIMER DÉFINITIVEMENT */}
                          <button
                            onClick={() => setSchoolToDelete(school)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition-all cursor-pointer"
                            title="Supprimer définitivement cet établissement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Actions Footer for Promoter */}
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-purple-900 dark:text-purple-300">
                <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />
                <span>
                  <strong>Télécommande Centralisée</strong> : Tout blocage ou déblocage prend effet immédiatement dans le navigateur et sur le cloud.
                </span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                {onNavigate && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('promoter-admin');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-all cursor-pointer"
                  >
                    Ouvrir Console Complète
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirm Block */}
        {schoolToBlock && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center space-x-3 text-amber-600">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-2xl">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-base">
                    Bloquer l'accès à distance
                  </h4>
                  <p className="text-xs text-slate-500">Établissement : {schoolToBlock.name}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Dès que vous validez, l'accès à la plateforme sera <strong>immédiatement verrouillé</strong> pour cet établissement. Les directeurs, enseignants et personnels ne pourront plus se connecter sans votre autorisation.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Motif du blocage affiché à l'école :
                </label>
                <select
                  value={customBlockReason}
                  onChange={(e) => setCustomBlockReason(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none mb-2"
                >
                  <option value="Abonnement requis - Accès suspendu à distance par le Promoteur Général">
                    Abonnement requis - Accès suspendu à distance par le Promoteur
                  </option>
                  <option value="Période d'essai expirée - Veuillez contacter le Promoteur au +229 97 00 00 00">
                    Période d'essai expirée - Contacter le Promoteur
                  </option>
                  <option value="Facture impayée - Suspension administrative temporaire">
                    Facture impayée - Suspension administrative temporaire
                  </option>
                  <option value="Contrôle technique en cours - Réouverture prochaine">
                    Contrôle technique en cours - Réouverture prochaine
                  </option>
                </select>
                <input
                  type="text"
                  value={customBlockReason}
                  onChange={(e) => setCustomBlockReason(e.target.value)}
                  placeholder="Ou saisissez un motif personnalisé..."
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setSchoolToBlock(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleConfirmBlock(schoolToBlock)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  Confirmer le Blocage
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirm Delete */}
        {schoolToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-2xl">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-base">
                    Suppression Définitive
                  </h4>
                  <p className="text-xs text-rose-600 font-bold">{schoolToDelete.name}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                ⚠️ <strong>Attention irréversible</strong> : Cette action supprimera définitivement cet établissement, ses données locales et son enregistrement dans le cloud.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Tapez « <span className="font-mono text-rose-600 font-black">{schoolToDelete.name}</span> » pour confirmer :
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Nom exact de l'école..."
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => {
                    setSchoolToDelete(null);
                    setDeleteConfirmationText('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  disabled={deleteConfirmationText.trim().toLowerCase() !== schoolToDelete.name.trim().toLowerCase()}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  Supprimer Définitivement
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Footer Exit Bar */}
        <div className="p-3.5 bg-slate-100 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-amber-500" />
            <span>← Retourner à l'Espace École</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-black shadow-md transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span>Fermer la Boîte (Sortir)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
