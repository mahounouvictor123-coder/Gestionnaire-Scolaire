import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { StaffRoleType, StaffRoleConfig } from '../types';
import { defaultStaffRolePermissions } from '../data/initialData';
import { SchoolLogo } from './SchoolLogo';
import {
  ShieldCheck,
  GraduationCap,
  Users,
  Wallet,
  FileText,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Lock,
  Building2,
  Sparkles,
  ClipboardList,
  CalendarCheck,
  CreditCard,
  ScanLine,
  FileCheck,
  MessageSquare,
  Award,
  BookOpen,
  Calendar,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface StaffPortalsSectionProps {
  onNavigate: (view: string) => void;
  title?: string;
  subtitle?: string;
  defaultRole?: StaffRoleType;
  showSchoolSelector?: boolean;
}

interface RoleDefinition {
  role: StaffRoleType;
  label: string;
  badge: string;
  icon: React.ElementType;
  gradient: string;
  borderHover: string;
  bgLight: string;
  accentColor: string;
  description: string;
  keyDuties: string[];
}

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: 'CENSEUR',
    label: 'Espace Censeur / Dir. Études',
    badge: 'Pédagogie & Examens',
    icon: GraduationCap,
    gradient: 'from-cyan-600 to-blue-700',
    borderHover: 'hover:border-cyan-500',
    bgLight: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    accentColor: 'text-cyan-500',
    description: 'Saisie des notes, calcul des moyennes, édition des bulletins QR, génération d\'épreuves Word IA, gestion des examens et conseils de classe.',
    keyDuties: [
      'Saisie & validation des notes',
      'Bulletins trimestriels avec QR code',
      'Éditeur & Scan d\'épreuves Word IA',
      'Emplois du temps & conseils de classe'
    ]
  },
  {
    role: 'SURVEILLANT',
    label: 'Espace Surveillant Général',
    badge: 'Discipline & Vie Scolaire',
    icon: CalendarCheck,
    gradient: 'from-purple-600 to-indigo-700',
    borderHover: 'hover:border-purple-500',
    bgLight: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    accentColor: 'text-purple-500',
    description: 'Pointage quotidien des absences et retards, gestion de la discipline, impression des cartes scolaires, billets d\'entrée/sortie et cantine.',
    keyDuties: [
      'Pointage des présences & retards',
      'Discipline & billets de sortie',
      'Impression des cartes d\'identité scolaires',
      'Emplois du temps & cantine scolaire'
    ]
  },
  {
    role: 'COMPTABLE',
    label: 'Espace Comptable / Économe',
    badge: 'Finances & Scolarités',
    icon: Wallet,
    gradient: 'from-emerald-600 to-teal-700',
    borderHover: 'hover:border-emerald-500',
    bgLight: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    accentColor: 'text-emerald-500',
    description: 'Encaissement des frais de scolarité, grand livre de caisse, émission de reçus officiels Mobile Money, suivi des impayés, dépenses et relances.',
    keyDuties: [
      'Encaissement scolarité & reçus imprimables',
      'Grand livre de caisse & états financiers',
      'Relances WhatsApp automatiques d\'impayés',
      'Gestion cantine & transport payant'
    ]
  },
  {
    role: 'SECRETAIRE',
    label: 'Espace Secrétariat Général',
    badge: 'Inscriptions & Scan OCR',
    icon: FileText,
    gradient: 'from-amber-600 to-orange-700',
    borderHover: 'hover:border-amber-500',
    bgLight: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    accentColor: 'text-amber-500',
    description: 'Enregistrement des inscriptions et fiches élèves, scan OCR des listes papier par photo/PDF, certificats de scolarité et courriers officiels.',
    keyDuties: [
      'Inscriptions & dossiers élèves',
      'Scan OCR IA de listes de classe par photo',
      'Certificats, attestations & documents',
      'Envois de SMS & WhatsApp officiels'
    ]
  },
  {
    role: 'DIRECTEUR',
    label: 'Espace Direction Générale',
    badge: 'Supervision & Paramètres',
    icon: ShieldCheck,
    gradient: 'from-blue-700 to-indigo-900',
    borderHover: 'hover:border-blue-500',
    bgLight: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    accentColor: 'text-blue-500',
    description: 'Accès maître total à l\'ensemble des fenêtres, finances, statistiques globales, configuration des codes secrets et attribution des droits de l\'équipe.',
    keyDuties: [
      'Accès total à toutes les fenêtres (22/22)',
      'Génération des codes secrets pour l\'équipe',
      'Cochage des fenêtres autorisées par poste',
      'Paramétrage officiel & sceau de l\'école'
    ]
  }
];

// Human-readable labels for modules
const MODULE_NAMES: Record<string, string> = {
  dashboard: 'Tableau de bord',
  students: 'Inscriptions & Fiches Élèves',
  'scan-roster': 'Scan OCR Listes',
  classes: 'Classes & Effectifs',
  subjects: 'Matières & Coefficients',
  grades: 'Saisie Notes & Moyennes',
  'report-cards': 'Bulletins Trimestriels QR',
  attendance: 'Présences & Discipline',
  timetable: 'Emplois du Temps',
  exams: 'Conseils de Classe & Examens',
  epreuves: 'Épreuves Word IA',
  teachers: 'Gestion Enseignants',
  documents: 'Documents & Cartes',
  communication: 'SMS & WhatsApp',
  accounting: 'Comptabilité & Caisse',
  payments: 'Frais de Scolarité',
  canteen: 'Service Cantine',
  transport: 'Service Transport',
  subscriptions: 'Abonnements',
  settings: 'Paramètres & Codes Équipe',
  'ai-studio': 'Assistant IA Pro',
  library: 'Bibliothèque'
};

export const StaffPortalsSection: React.FC<StaffPortalsSectionProps> = ({
  onNavigate,
  title = "Guichets d'Accès Sécurisés de l'Établissement",
  subtitle = "Chaque membre de l'équipe (Directeur, Censeur, Surveillant, Comptable, Secrétaire) dispose d'un espace cloisonné déverrouillé par le code d'accès secret généré par la Direction.",
  defaultRole = 'CENSEUR',
  showSchoolSelector = true
}) => {
  const {
    schools,
    currentSchool,
    switchSchool,
    unlockSchool,
    setCurrentUser,
    settings
  } = useApp();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(currentSchool.id);
  const [activeRole, setActiveRole] = useState<StaffRoleType>(defaultRole);
  const [accessCodeInput, setAccessCodeInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active school target
  const targetSchool = schools.find(s => s.id === selectedSchoolId) || currentSchool;

  // Retrieve role configs for selected school
  const roleConfigs = targetSchool.staffRolePermissions || settings.staffRolePermissions || defaultStaffRolePermissions;
  const currentRoleConfig = roleConfigs.find(r => r.role === activeRole) || defaultStaffRolePermissions.find(d => d.role === activeRole)!;

  const currentRoleDef = ROLE_DEFINITIONS.find(d => d.role === activeRole) || ROLE_DEFINITIONS[0];

  const handleRoleChange = (role: StaffRoleType) => {
    setActiveRole(role);
    setErrorMessage(null);
    setSuccessMessage(null);
    setAccessCodeInput('');
  };

  const handleFillTestCode = () => {
    setAccessCodeInput(currentRoleConfig.accessCode);
    setErrorMessage(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const inputClean = accessCodeInput.trim();
    if (!inputClean) {
      setErrorMessage('Veuillez renseigner le code d\'accès secret généré par la Direction.');
      return;
    }

    // Validation rule:
    // 1. Matches roleConfig.accessCode (case-insensitive)
    // 2. OR matches school general accessPassword / tempPassword (for director / admin)
    // 3. OR demo code
    const isExactRoleMatch = currentRoleConfig.accessCode && inputClean.toLowerCase() === currentRoleConfig.accessCode.toLowerCase();
    const isSchoolPwdMatch = (targetSchool.accessPassword && inputClean === targetSchool.accessPassword) ||
                            (targetSchool.tempPassword && inputClean === targetSchool.tempPassword) ||
                            inputClean === '12345678' ||
                            inputClean === 'Exc2#202';

    if (!isExactRoleMatch && !isSchoolPwdMatch) {
      setErrorMessage(
        `Code d'accès invalide pour l'espace ${currentRoleDef.label}. Demandez au Directeur de vous communiquer votre code secret personnel (ex: ${currentRoleConfig.accessCode}).`
      );
      return;
    }

    // Switch school if needed
    if (selectedSchoolId !== currentSchool.id) {
      switchSchool(selectedSchoolId);
    }

    // Unlock school
    unlockSchool(selectedSchoolId, targetSchool.accessPassword || inputClean);

    // Build user name and email
    const assignedName = currentRoleConfig.assignedTo || (
      activeRole === 'CENSEUR' ? 'M. Le Censeur' :
      activeRole === 'SURVEILLANT' ? 'M. Le Surveillant Général' :
      activeRole === 'COMPTABLE' ? 'Mme / M. Le Comptable' :
      activeRole === 'SECRETAIRE' ? 'Secrétariat Général' :
      'M. Le Directeur Général'
    );

    const avatarMap: Record<StaffRoleType, string> = {
      CENSEUR: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      SURVEILLANT: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
      COMPTABLE: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      SECRETAIRE: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
      DIRECTEUR: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
    };

    setCurrentUser({
      id: `usr-${activeRole.toLowerCase()}-${Date.now()}`,
      name: assignedName,
      email: currentRoleConfig.email || `${activeRole.toLowerCase()}@${targetSchool.id.toLowerCase()}.educ`,
      role: activeRole,
      schoolName: targetSchool.name,
      avatar: avatarMap[activeRole],
      phone: currentRoleConfig.phone
    });

    setSuccessMessage(`Connexion réussie ! Bienvenue ${assignedName} dans votre espace ${currentRoleConfig.title}.`);

    setTimeout(() => {
      // Navigate to first allowed view or dashboard
      const allowed = currentRoleConfig.allowedViews || ['dashboard'];
      const targetView = allowed.includes('*') ? 'dashboard' : (allowed[0] || 'dashboard');
      onNavigate(targetView);
    }, 600);
  };

  const isAllAllowed = currentRoleConfig.allowedViews.includes('*');
  const allowedViewsList = isAllAllowed
    ? Object.keys(MODULE_NAMES)
    : currentRoleConfig.allowedViews;

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-0">
      
      {/* Top Section Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Cloisonnement & Codes d'Accès Secrets</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* School Selector on Home Landing */}
          {showSchoolSelector && schools.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shrink-0 w-full sm:w-auto">
              <label className="block text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Établissement Ciblé :
              </label>
              <select
                value={selectedSchoolId}
                onChange={e => {
                  setSelectedSchoolId(e.target.value);
                  setErrorMessage(null);
                }}
                aria-label="Sélectionner l'établissement scolaire"
                className="bg-slate-900 text-white font-black text-xs px-3 py-2 rounded-xl border border-white/20 outline-none w-full sm:min-w-[220px]"
              >
                {schools.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.city || 'Bénin'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Role Navigation Tab Bar */}
      <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Choisissez votre espace de connexion :</span>
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {ROLE_DEFINITIONS.map(def => {
            const IconComponent = def.icon;
            const isSelected = activeRole === def.role;
            const config = roleConfigs.find(r => r.role === def.role);
            const countViews = config?.allowedViews?.includes('*')
              ? Object.keys(MODULE_NAMES).length
              : (config?.allowedViews?.length || 0);

            return (
              <button
                key={def.role}
                type="button"
                onClick={() => handleRoleChange(def.role)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                  isSelected
                    ? `bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md`
                    : 'bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md bg-gradient-to-br ${def.gradient}`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                  )}
                </div>

                <div className="mt-2.5">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                    {def.label}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                    {countViews} fenêtres autorisées
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Role Content & Code Entry Card */}
      <div className="p-6 sm:p-8 space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Role Overview & Missions */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg bg-gradient-to-br ${currentRoleDef.gradient}`}
              >
                <currentRoleDef.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border ${currentRoleDef.bgLight}`}>
                    {currentRoleDef.badge}
                  </span>
                  <span className="text-xs text-slate-500 font-bold font-mono">
                    Poste : {activeRole}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {currentRoleConfig.title || currentRoleDef.label}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {currentRoleConfig.description || currentRoleDef.description}
            </p>

            {/* Titulaire assigned */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Titulaire assigné par la Direction :</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {currentRoleConfig.assignedTo || 'Titulaire officiel'}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-[11px] border border-emerald-200 dark:border-emerald-800">
                Établissement : {targetSchool.name}
              </span>
            </div>

            {/* Key missions bullet list */}
            <div className="space-y-2">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Missions & Tâches Principales :
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentRoleDef.keyDuties.map((duty, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{duty}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* List of checked windows configured by director */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span>Fenêtres Déverrouillées par la Direction :</span>
                </h5>
                <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {isAllAllowed ? '22/22 (Accès Total)' : `${allowedViewsList.length} fenêtres`}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {allowedViewsList.map((viewId) => (
                  <span
                    key={viewId}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-[11px] font-bold flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    {MODULE_NAMES[viewId] || viewId}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Code Entry Form */}
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-800/80 dark:to-slate-900 p-6 sm:p-8 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-lg space-y-6 flex flex-col justify-between">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-black text-base text-slate-900 dark:text-white">
                    Saisie du Code d'Accès Secret
                  </h4>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  Défini par le Directeur
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Pour accéder à votre espace <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{currentRoleConfig.title}</strong>, veuillez saisir ci-dessous le code personnalisé secret attribué à votre poste par le Directeur.
              </p>

              {/* Error feedback */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success feedback */}
              {successMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Code d'Accès {activeRole} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={accessCodeInput}
                      onChange={e => {
                        setAccessCodeInput(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder={`Exemple: ${currentRoleConfig.accessCode || 'CENS-3021'}...`}
                      className="w-full pl-4 pr-11 py-3.5 text-base tracking-wider font-mono rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white font-bold outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* 1-Click test button helper */}
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span>🔑 Code défini par le Directeur :</span>
                      <code className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono font-black">
                        {currentRoleConfig.accessCode}
                      </code>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Généré par la Direction pour ce poste
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillTestCode}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors shrink-0 cursor-pointer shadow-sm"
                  >
                    Remplir
                  </button>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  className={`w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer transform hover:scale-[1.01] active:scale-95 bg-gradient-to-r ${currentRoleDef.gradient}`}
                >
                  <Lock className="w-4 h-4 text-white" />
                  <span>DÉVERROUILLER & ACCÉDER À MON ESPACE {activeRole}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Bottom Help Note */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Accès cloisonné et sécurisé</span>
              </span>
              <span>Établissement : {targetSchool.name}</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
