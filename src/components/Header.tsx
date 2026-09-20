import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { useGoogleAuth } from './GoogleAuthGate';
import { SchoolLogo } from './SchoolLogo';
import { InstallPwaModal } from './InstallPwaModal';
import { SubAppsShareModal } from './modals/SubAppsShareModal';
import { buildDirectSchoolAccessUrl } from '../lib/urlUtils';
import {
  Sparkles,
  Sun,
  Moon,
  Search,
  Bell,
  ChevronDown,
  Building2,
  Plus,
  Check,
  RefreshCw,
  Globe2,
  ShieldCheck,
  UserCheck,
  LogIn,
  LogOut,
  Smartphone,
  Lock,
  Unlock,
  KeyRound,
  Crown,
  Copy,
  CheckCircle2,
  LayoutDashboard,
  FileText,
  FileCheck
} from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  onOpenAiModal: () => void;
  onOpenCreateSchoolModal: () => void;
  onOpenCampaignModal?: () => void;
  onOpenLoginModal?: () => void;
  activeView?: string;
  onNavigate?: (view: string) => void;
  onOpenControlBox?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAiModal,
  onOpenCreateSchoolModal,
  onOpenCampaignModal,
  onOpenLoginModal,
  activeView,
  onNavigate,
  onOpenControlBox
}) => {
  const {
    schools,
    currentSchoolId,
    currentSchool,
    switchSchool,
    isSchoolUnlocked,
    lockSchool,
    unlockSchool,
    currentUser,
    switchRole,
    settings,
    updateSettings,
    resetToDefaultData,
    isAuthenticated,
    logoutUser
  } = useApp();

  const { gmailUser, signOutGoogle } = useGoogleAuth();

  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [copiedDirectLink, setCopiedDirectLink] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [showSubAppsModal, setShowSubAppsModal] = useState(false);

  const isPromoter = (currentUser?.email?.toLowerCase().trim() === 'mahounouvictor123@gmail.com') || 
    (gmailUser?.email?.toLowerCase().trim() === 'mahounouvictor123@gmail.com') ||
    (typeof window !== 'undefined' && localStorage.getItem('GESTIONNAIRE_PROMOTER_AUTH') === 'true');

  const baseRolesList: { role: UserRole; label: string; desc: string; iconColor: string }[] = [
    { role: 'DIRECTEUR', label: 'Directeur Général', desc: 'Superviseur total, décisions, paramétrages & codes', iconColor: 'bg-blue-600' },
    { role: 'CENSEUR', label: 'Censeur / Dir. Études', desc: 'Pédagogie, saisie notes, bulletins QR, discipline & examens', iconColor: 'bg-cyan-600' },
    { role: 'COMPTABLE', label: 'Comptable / Trésorier', desc: 'Scolarités, caisse, reçus, dépenses, cantine & salaires', iconColor: 'bg-emerald-600' },
    { role: 'SECRETAIRE', label: 'Secrétaire Administrative', desc: 'Inscriptions, scan OCR, cartes scolaires & courriers', iconColor: 'bg-amber-600' },
    { role: 'ENSEIGNANT', label: 'Enseignant', desc: 'Notes, cahier de texte, appel des absents', iconColor: 'bg-indigo-600' },
    { role: 'PARENT', label: 'Espace Parent', desc: 'Suivi enfants, bulletins, paiements', iconColor: 'bg-teal-600' },
    { role: 'ELEVE', label: 'Espace Élève', desc: 'Mes notes, mon emploi du temps, devoirs', iconColor: 'bg-pink-600' }
  ];

  const rolesList = isPromoter
    ? [
        { role: 'SUPER_ADMIN' as UserRole, label: 'Promoteur / Super Admin', desc: 'Gestion multi-écoles, passerelle FedaPay & réseau', iconColor: 'bg-purple-600' },
        ...baseRolesList
      ]
    : baseRolesList;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Brand Logo & Multi-School Dropdown Selector */}
          <div className="flex items-center space-x-3">
            <div 
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition-opacity"
              title="Aller au Tableau de bord"
            >
              <SchoolLogo variant="inline" />
            </div>

            {/* School Switcher Pill Dropdown & School Name Display */}
            <div className="relative flex items-center space-x-1.5">
              <button
                onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
                className="flex items-center space-x-2 px-3 py-1.5 text-xs font-black rounded-xl bg-emerald-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-emerald-300 dark:border-emerald-700/60 hover:border-emerald-500 transition-all cursor-pointer shadow-sm"
                title="Établissement actif - Cliquez pour changer d'école"
              >
                <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="inline-block font-extrabold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[200px] md:max-w-[260px] text-emerald-950 dark:text-emerald-200">
                  {settings.schoolName || currentSchool.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Quick Lock / Unlocked Status Badge */}
              {isSchoolUnlocked(currentSchoolId) ? (
                <button
                  onClick={() => lockSchool(currentSchoolId)}
                  className="px-2 py-1 text-[10px] sm:text-xs font-extrabold rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                  title="Verrouiller la session de cet établissement (exiger le mot de passe)"
                >
                  <Lock className="h-3 w-3 text-amber-500" />
                  <span className="hidden sm:inline">Verrouiller</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    const pwd = currentSchool.accessPassword || 'Exc2#202';
                    unlockSchool(currentSchoolId, pwd);
                  }}
                  className="px-2.5 py-1 text-[10px] sm:text-xs font-black rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 hover:bg-rose-200 dark:hover:bg-rose-900 transition-all flex items-center space-x-1 shrink-0 cursor-pointer shadow-sm animate-pulse"
                  title="Cliquer pour déverrouiller cet établissement"
                >
                  <Lock className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                  <span className="inline">🔒 Verrouillé — Déverrouiller</span>
                </button>
              )}

              {/* School Switcher / Info Dropdown */}
              {showSchoolDropdown && (
                <div className="absolute left-0 mt-2 w-84 sm:w-96 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-2 space-y-3">
                  
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center space-x-1.5">
                      <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                        {isPromoter ? `Établissements (${schools.length})` : 'Mon Établissement'}
                      </span>
                    </div>
                  </div>

                  {/* Active School Quick Info Card */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img
                        src={currentSchool?.logoUrl}
                        alt={currentSchool?.name}
                        className="h-10 w-10 rounded-xl object-cover bg-white shadow-sm border border-emerald-300 dark:border-emerald-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-black uppercase">
                            Actif
                          </span>
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {currentSchool?.name}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {currentSchool?.city} • {currentSchool?.academicYear || '2025-2026'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const link = buildDirectSchoolAccessUrl(currentSchool);
                        navigator.clipboard.writeText(link);
                        setCopiedDirectLink(true);
                        setTimeout(() => setCopiedDirectLink(false), 3000);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] flex items-center space-x-1 shrink-0 shadow-sm transition-all cursor-pointer"
                      title="Copier le lien direct vers cet établissement"
                    >
                      {copiedDirectLink ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          <span>Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-white" />
                          <span>Lien Direct</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isPromoter ? (
                    <>
                      {/* School Search (if > 2 schools) */}
                      {schools.length > 2 && (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Filtrer parmi les écoles..."
                            value={schoolSearch}
                            onChange={(e) => setSchoolSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-transparent focus:border-emerald-500 text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                      )}

                      {/* List of Registered Schools for 1-Click Switching for Promoter */}
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {schools
                          .filter(s => 
                            !schoolSearch || 
                            s.name.toLowerCase().includes(schoolSearch.toLowerCase()) || 
                            s.city.toLowerCase().includes(schoolSearch.toLowerCase())
                          )
                          .map((sch) => {
                            const isCurrent = sch.id === currentSchoolId && activeView !== 'promoter-admin';
                            const unlocked = isSchoolUnlocked(sch.id);

                            return (
                              <div
                                key={sch.id}
                                onClick={() => {
                                  setShowSchoolDropdown(false);
                                  switchSchool(sch.id);
                                  if (activeView === 'promoter-admin' || activeView === 'schools-hub') {
                                    if (onNavigate) onNavigate('dashboard');
                                  }
                                }}
                                className={`w-full text-left p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                                  isCurrent
                                    ? 'bg-emerald-500 text-white shadow-sm font-black'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <img
                                    src={sch.logoUrl}
                                    alt={sch.name}
                                    className="h-7 w-7 rounded-lg object-cover bg-white shrink-0 border border-slate-200"
                                  />
                                  <div className="min-w-0">
                                    <p className={`text-xs truncate ${isCurrent ? 'text-white font-black' : 'font-extrabold text-slate-900 dark:text-white'}`}>
                                      {sch.name}
                                    </p>
                                    <p className={`text-[10px] truncate ${isCurrent ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                      {sch.city} • {sch.totalStudentsCount || 0} élèves
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 shrink-0">
                                  {!unlocked && <span className={`text-[10px] ${isCurrent ? 'text-white' : 'text-amber-600'}`}>🔒</span>}
                                  {isCurrent && <Check className="h-4 w-4 text-white shrink-0" />}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                      <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Espace d'Établissement Sécurisé & Autonome</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Votre école fonctionne dans un environnement hermétique et indépendant. Vos données scolaires et comptables sont isolées.
                      </p>
                    </div>
                  )}

                  {/* Quick School Views Shortcuts (Épreuves, Bulletins, Dashboard) */}
                  <div className="p-2 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider px-1">
                      Accès Rapide • {settings.schoolName || currentSchool.name}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSchoolDropdown(false);
                          if (onNavigate) onNavigate('dashboard');
                        }}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-800 dark:text-slate-200 font-extrabold text-[11px] flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer shadow-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      >
                        <LayoutDashboard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="truncate">Accueil</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowSchoolDropdown(false);
                          if (onNavigate) onNavigate('epreuves');
                        }}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-800 dark:text-slate-200 font-extrabold text-[11px] flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer shadow-xs hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      >
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="truncate">Épreuves</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowSchoolDropdown(false);
                          if (onNavigate) onNavigate('report-cards');
                        }}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 text-slate-800 dark:text-slate-200 font-extrabold text-[11px] flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer shadow-xs hover:bg-purple-50 dark:hover:bg-purple-950/40"
                      >
                        <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="truncate">Bulletins</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
                    <button
                      onClick={() => {
                        setShowSchoolDropdown(false);
                        onOpenCreateSchoolModal();
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>CRÉER UNE NOUVELLE ÉCOLE</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowSchoolDropdown(false);
                        onNavigate && onNavigate('settings');
                      }}
                      className="w-full py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-extrabold text-[11px] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Building2 className="h-3.5 w-3.5 text-slate-500" />
                      <span>Paramètres de l'École</span>
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Quick Search */}
          <div className="hidden lg:flex items-center flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un élève, enseignant..."
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            {/* Home / Accueil Vitrine Button */}
            {onNavigate && (
              <button
                onClick={() => onNavigate('landing')}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all"
                title="Page d'Accueil Officielle"
              >
                <Globe2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden xl:inline">Accueil Officiel</span>
              </button>
            )}

            {/* Connexion Portal Button */}
            {onOpenLoginModal && (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm transition-all"
                title="Ouvrir le portail de connexion"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Connexion</span>
              </button>
            )}

            {/* Prominent "CRÉER MON ÉCOLE" Button */}
            <button
              onClick={onOpenCreateSchoolModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              title="Enregistrer un nouvel établissement"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CRÉER MON ÉCOLE</span>
              <span className="sm:hidden">+ ÉCOLE</span>
            </button>

            {/* Boîte de Contrôle Master des Écoles (Accessible UNIQUEMENT pour mahounouvictor123@gmail.com) */}
            {isPromoter && (
              <button
                onClick={() => onOpenControlBox ? onOpenControlBox() : (onNavigate && onNavigate('control-box'))}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 text-white font-black text-xs shadow-md border border-purple-500/40 transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer"
                title="Boîte de contrôle à distance de toutes les écoles (mahounouvictor123@gmail.com)"
              >
                <Crown className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                <span className="hidden sm:inline">Boîte Contrôle Écoles</span>
                <span className="sm:hidden">Boîte</span>
              </button>
            )}

            {/* PWA Install / Home Screen Button */}
            <button
              onClick={() => setShowPwaModal(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer"
              title="Ajouter à l'écran d'accueil comme une application native"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-200" />
              <span className="hidden lg:inline">Écran d'Accueil</span>
              <span className="lg:hidden">App</span>
            </button>

            {/* Sub-Apps Parents & Profs Share Button */}
            <button
              onClick={() => setShowSubAppsModal(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs shadow-md transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer"
              title="Diffuser les liens d'accès direct et sous-applications pour Parents et Professeurs"
            >
              <Smartphone className="h-3.5 w-3.5 text-blue-200" />
              <span className="hidden xl:inline">Apps Parents & Profs</span>
              <span className="xl:hidden">Sous-Apps</span>
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAiModal}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">Assistant IA</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={settings.darkMode ? "Activer le Mode Clair" : "Activer le Mode Sombre"}
            >
              {settings.darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-ping" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h4>
                    <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">3 nouvelles</span>
                  </div>
                  <div className="mt-3 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                      <p className="font-bold text-blue-900 dark:text-blue-300">Bienvenue dans {currentSchool.name}</p>
                      <p className="mt-0.5 text-blue-800/80 dark:text-blue-300/80">Espace de gestion configuré et sécurisé pour l'année {settings.academicYear}.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Current User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className="flex items-center space-x-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-6 w-6 rounded-full object-cover border border-blue-500"
                />
                <div className="hidden md:block text-left">
                  <p className="text-[11px] font-black text-slate-900 dark:text-white leading-tight truncate max-w-[90px]">
                    {currentUser.name.split(' ')[0]}
                  </p>
                  <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase leading-tight">
                    {currentUser.role}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Role Dropdown */}
              {showRoleSelector && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 mb-2 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-extrabold truncate max-w-[170px]">
                        Établissement : {currentSchool.name}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                        isAuthenticated 
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}>
                        {isAuthenticated ? '● Connecté' : '○ Déconnecté'}
                      </span>
                    </div>

                    <div>
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{currentUser.name}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">{currentUser.email || currentUser.role.replace('_', ' ')}</p>
                      {gmailUser && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate mt-0.5" title={gmailUser.email}>
                          {gmailUser.provider === 'apple' ? ' Apple ID: ' : '📧 Auth: '}{gmailUser.email}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      {onOpenLoginModal && (
                        <button
                          onClick={() => {
                            setShowRoleSelector(false);
                            onOpenLoginModal();
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          <span>Connexion</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          signOutGoogle();
                          logoutUser();
                          lockSchool(currentSchoolId);
                          setShowRoleSelector(false);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-black text-xs flex items-center space-x-1 transition-all shrink-0 cursor-pointer"
                        title="Se déconnecter de cette session"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 my-1">
                    Changer de Rôle Utilisateur :
                  </div>

                  <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                    {rolesList.map(item => (
                      <button
                        key={item.role}
                        onClick={() => {
                          switchRole(item.role);
                          setShowRoleSelector(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-start space-x-2.5 transition-colors ${
                          currentUser.role === item.role
                            ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className={`h-2.5 w-2.5 mt-1.5 rounded-full ${item.iconColor}`} />
                        <div>
                          <p className="text-xs font-bold">{item.label}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (confirm("Réinitialiser les données aux valeurs par défaut de démonstration ?")) {
                          resetToDefaultData();
                          setShowRoleSelector(false);
                        }
                      }}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center space-x-1 font-bold"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Réinitialiser la Démo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <InstallPwaModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} />
      
      <SubAppsShareModal
        isOpen={showSubAppsModal}
        onClose={() => setShowSubAppsModal(false)}
        onNavigateToSubApp={(appType) => {
          setShowSubAppsModal(false);
          if (onNavigate) {
            onNavigate(appType === 'parent' ? 'parent-subapp' : 'teacher-subapp');
          }
        }}
      />
    </header>
  );
};
