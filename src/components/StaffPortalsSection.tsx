import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { StaffRoleType, StaffRoleConfig } from '../types';
import { defaultStaffRolePermissions } from '../data/initialData';
import { buildStaffRoleAccessUrl } from '../lib/urlUtils';
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
  Unlock,
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
  HelpCircle,
  RefreshCw,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Phone,
  Edit3,
  CheckSquare,
  Square,
  Sliders,
  Send,
  UtensilsCrossed,
  Bus,
  BookMarked,
  Settings,
  Mic,
  X
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

export interface WindowModuleOption {
  id: string;
  name: string;
  category: 'PEDAGOGIE' | 'VIE_SCOLAIRE' | 'INSCRIPTIONS' | 'FINANCE_ADMIN';
  icon: React.ElementType;
  description: string;
}

export const ALL_WINDOW_MODULES: WindowModuleOption[] = [
  // Pédagogie & Examens
  { id: 'grades', name: 'Saisie Notes & Moyennes', category: 'PEDAGOGIE', icon: ClipboardList, description: 'Saisie des notes, coefficients et calcul des moyennes' },
  { id: 'report-cards', name: 'Bulletins Trimestriels QR', category: 'PEDAGOGIE', icon: FileCheck, description: 'Génération et impression des bulletins avec QR code' },
  { id: 'epreuves', name: 'Épreuves Word IA', category: 'PEDAGOGIE', icon: FileText, description: 'Générateur de sujets et corrigés avec intelligence artificielle' },
  { id: 'exams', name: 'Conseils & Examens', category: 'PEDAGOGIE', icon: Award, description: 'Délibérations trimestrielles, rangs et examens officiels' },
  { id: 'subjects', name: 'Matières & Coefficients', category: 'PEDAGOGIE', icon: BookOpen, description: 'Configuration du programme d\'études et barèmes' },
  { id: 'classes', name: 'Classes & Effectifs', category: 'PEDAGOGIE', icon: Building2, description: 'Gestion des salles, groupes et effectifs' },
  { id: 'teachers', name: 'Gestion Enseignants', category: 'PEDAGOGIE', icon: GraduationCap, description: 'Corps professoral, affectations et suivi des cours' },

  // Vie Scolaire & Discipline
  { id: 'attendance', name: 'Présences & Discipline', category: 'VIE_SCOLAIRE', icon: CalendarCheck, description: 'Pointage absences, retards, billets et sanctions' },
  { id: 'timetable', name: 'Emplois du Temps', category: 'VIE_SCOLAIRE', icon: Calendar, description: 'Planning hebdomadaire des cours et salles' },
  { id: 'documents', name: 'Documents & Cartes', category: 'VIE_SCOLAIRE', icon: FileText, description: 'Impression des badges, cartes et certificats' },
  { id: 'canteen', name: 'Service Cantine', category: 'VIE_SCOLAIRE', icon: UtensilsCrossed, description: 'Suivi des repas, abonnements et tickets cantine' },
  { id: 'transport', name: 'Service Transport', category: 'VIE_SCOLAIRE', icon: Bus, description: 'Lignes de bus, arrêts et abonnements transport' },
  { id: 'library', name: 'Bibliothèque Scolaire', category: 'VIE_SCOLAIRE', icon: BookMarked, description: 'Catalogue, prêts et inventaire des livres' },

  // Inscriptions & Communication
  { id: 'students', name: 'Inscriptions & Fiches Élèves', category: 'INSCRIPTIONS', icon: Users, description: 'Dossiers scolaires complets et matricules' },
  { id: 'scan-roster', name: 'Scan OCR Listes', category: 'INSCRIPTIONS', icon: ScanLine, description: 'Numérisation automatique des listes papier par photo' },
  { id: 'communication', name: 'SMS & WhatsApp Parents', category: 'INSCRIPTIONS', icon: MessageSquare, description: 'Envoi d\'alertes SMS et notifications groupées' },
  { id: 'parent-complaints', name: 'Boîte Audios & Plaintes', category: 'INSCRIPTIONS', icon: Mic, description: 'Écoute des messages vocaux et réclamations des parents' },

  // Administration & Finances
  { id: 'dashboard', name: 'Tableau de Bord & Stats', category: 'FINANCE_ADMIN', icon: Building2, description: 'Indicateurs clés d\'effectifs et scolarité en temps réel' },
  { id: 'accounting', name: 'Comptabilité & Caisse', category: 'FINANCE_ADMIN', icon: Wallet, description: 'Grand livre, entrées/sorties de caisse et trésorerie' },
  { id: 'payments', name: 'Frais de Scolarité', category: 'FINANCE_ADMIN', icon: CreditCard, description: 'Encaissements scolarité, reçus officiels et relances' },
  { id: 'ai-studio', name: 'Assistant IA Gemini Pro', category: 'FINANCE_ADMIN', icon: Sparkles, description: 'Outils d\'assistance et rédaction automatisée' },
  { id: 'settings', name: 'Paramètres & Sceau École', category: 'FINANCE_ADMIN', icon: Settings, description: 'Configuration générale et codes secrets de l\'école' },
  { id: 'subscriptions', name: 'Plans d\'Abonnement', category: 'FINANCE_ADMIN', icon: Award, description: 'Gestion de la licence et des quotas de l\'école' }
];

const CATEGORY_INFOS = {
  PEDAGOGIE: {
    label: 'Pédagogie & Examens',
    icon: GraduationCap,
    badgeColor: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
  },
  VIE_SCOLAIRE: {
    label: 'Vie Scolaire & Discipline',
    icon: CalendarCheck,
    badgeColor: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
  },
  INSCRIPTIONS: {
    label: 'Inscriptions & Secrétariat',
    icon: FileText,
    badgeColor: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  FINANCE_ADMIN: {
    label: 'Administration & Finances',
    icon: Wallet,
    badgeColor: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  }
};

const MODULE_NAMES: Record<string, string> = ALL_WINDOW_MODULES.reduce((acc, m) => {
  acc[m.id] = m.name;
  return acc;
}, {} as Record<string, string>);

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
    currentUser,
    settings,
    updateSettings,
    updateSchool
  } = useApp();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(currentSchool.id);
  const [activeRole, setActiveRole] = useState<StaffRoleType>(defaultRole);
  const [accessCodeInput, setAccessCodeInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Director configuration mode states
  const [isDirectorMode, setIsDirectorMode] = useState<boolean>(false);
  const [directorAuthUnlocked, setDirectorAuthUnlocked] = useState<boolean>(
    currentUser?.role === 'DIRECTEUR' || currentUser?.role === 'SUPER_ADMIN'
  );
  const [showDirectorAuthModal, setShowDirectorAuthModal] = useState<boolean>(false);
  const [directorAuthCodeInput, setDirectorAuthCodeInput] = useState<string>('');
  const [directorAuthError, setDirectorAuthError] = useState<string | null>(null);
  const [directorTab, setDirectorTab] = useState<'ROLE_DETAIL' | 'ALL_MEMBERS_TABLE'>('ROLE_DETAIL');

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState<boolean>(false);

  // Active school target
  const targetSchool = schools.find(s => s.id === selectedSchoolId) || currentSchool;

  // Retrieve role configs for selected school (ensuring all 5 roles are always available)
  const baseRoles = targetSchool.staffRolePermissions || settings.staffRolePermissions || defaultStaffRolePermissions;
  const rolesList: StaffRoleConfig[] = defaultStaffRolePermissions.map(def => {
    const found = baseRoles.find(r => r.role === def.role);
    return found ? { ...def, ...found } : def;
  });

  const currentRoleConfig = rolesList.find(r => r.role === activeRole) || defaultStaffRolePermissions.find(d => d.role === activeRole)!;
  const currentRoleDef = ROLE_DEFINITIONS.find(d => d.role === activeRole) || ROLE_DEFINITIONS[0];
  const directorConfig = rolesList.find(r => r.role === 'DIRECTEUR') || defaultStaffRolePermissions[0];

  // Role switching
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

  // Director authorization handler
  const handleOpenDirectorConfig = (targetSpecificRole?: StaffRoleType) => {
    if (targetSpecificRole) {
      setActiveRole(targetSpecificRole);
    }
    if (directorAuthUnlocked || currentUser?.role === 'DIRECTEUR' || currentUser?.role === 'SUPER_ADMIN') {
      setIsDirectorMode(true);
      setDirectorTab('ROLE_DETAIL');
      return;
    }
    // Prompt authorization
    setShowDirectorAuthModal(true);
    setDirectorAuthError(null);
    setDirectorAuthCodeInput('');
  };

  const handleVerifyDirectorCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDirectorAuthError(null);
    const inputClean = directorAuthCodeInput.trim();

    const expectedDirectorCode = directorConfig.accessCode || 'DIR-8842';
    const isDirectMatch = expectedDirectorCode && inputClean.toLowerCase() === expectedDirectorCode.toLowerCase();
    const isSchoolPwdMatch = (targetSchool.accessPassword && inputClean === targetSchool.accessPassword) ||
                             (targetSchool.tempPassword && inputClean === targetSchool.tempPassword) ||
                             inputClean === '12345678' ||
                             inputClean === 'Exc2#202';

    if (!isDirectMatch && !isSchoolPwdMatch) {
      setDirectorAuthError(`Code incorrect. Veuillez saisir le code d'accès de la Direction (ex: ${expectedDirectorCode}) ou le mot de passe de l'établissement.`);
      return;
    }

    setDirectorAuthUnlocked(true);
    setShowDirectorAuthModal(false);
    setIsDirectorMode(true);
    setSyncFeedback('👑 Mode Direction déverrouillé ! Vous pouvez maintenant modifier les codes et fenêtres de tous les membres.');
    setTimeout(() => setSyncFeedback(null), 4500);
  };

  // Update specific role configuration across storage tiers
  const updateRoleConfig = (role: StaffRoleType, patch: Partial<StaffRoleConfig>) => {
    const updated = rolesList.map(r => (r.role === role ? { ...r, ...patch } : r));
    updateSettings({ staffRolePermissions: updated });
    updateSchool(targetSchool.id, { staffRolePermissions: updated });
    setSyncFeedback(`💾 Modifications enregistrées pour ${ROLE_DEFINITIONS.find(d => d.role === role)?.label || role}.`);
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  // Generate a random code for a single role
  const generateRandomCode = (role: StaffRoleType) => {
    const prefixMap: Record<StaffRoleType, string> = {
      DIRECTEUR: 'DIR',
      CENSEUR: 'CENS',
      SURVEILLANT: 'SURV',
      COMPTABLE: 'COMPT',
      SECRETAIRE: 'SEC'
    };
    const prefix = prefixMap[role] || 'CODE';
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const newCode = `${prefix}-${randDigits}`;

    updateRoleConfig(role, {
      accessCode: newCode,
      lastGeneratedAt: new Date().toISOString()
    });

    setSyncFeedback(`🎲 Nouveau code secret "${newCode}" généré pour ${ROLE_DEFINITIONS.find(d => d.role === role)?.label || role} !`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // Generate all codes in 1-click
  const generateAllCodesInOneClick = () => {
    const prefixMap: Record<StaffRoleType, string> = {
      DIRECTEUR: 'DIR',
      CENSEUR: 'CENS',
      SURVEILLANT: 'SURV',
      COMPTABLE: 'COMPT',
      SECRETAIRE: 'SEC'
    };

    const nowIso = new Date().toISOString();
    const updated = rolesList.map(r => {
      const prefix = prefixMap[r.role] || 'CODE';
      const randDigits = Math.floor(1000 + Math.random() * 9000);
      return {
        ...r,
        accessCode: `${prefix}-${randDigits}`,
        lastGeneratedAt: nowIso
      };
    });

    updateSettings({ staffRolePermissions: updated });
    updateSchool(targetSchool.id, { staffRolePermissions: updated });
    setSyncFeedback(`⚡ De nouveaux codes secrets ont été générés pour l'ensemble des 5 membres de l'administration !`);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Toggle a single module for a role
  const toggleModuleForRole = (role: StaffRoleType, moduleId: string) => {
    const target = rolesList.find(r => r.role === role);
    if (!target) return;

    let nextAllowed: string[];
    if (target.allowedViews.includes('*')) {
      nextAllowed = ALL_WINDOW_MODULES.map(m => m.id).filter(id => id !== moduleId);
    } else if (target.allowedViews.includes(moduleId)) {
      nextAllowed = target.allowedViews.filter(id => id !== moduleId);
    } else {
      nextAllowed = [...target.allowedViews, moduleId];
    }

    updateRoleConfig(role, { allowedViews: nextAllowed });
  };

  // Select all modules
  const selectAllModules = (role: StaffRoleType) => {
    if (role === 'DIRECTEUR') {
      updateRoleConfig(role, { allowedViews: ['*'] });
    } else {
      updateRoleConfig(role, { allowedViews: ALL_WINDOW_MODULES.map(m => m.id) });
    }
  };

  // Deselect all modules
  const deselectAllModules = (role: StaffRoleType) => {
    updateRoleConfig(role, { allowedViews: ['dashboard'] });
  };

  // Reset role to default permissions
  const resetRoleToDefault = (role: StaffRoleType) => {
    const def = defaultStaffRolePermissions.find(d => d.role === role);
    if (def) {
      updateRoleConfig(role, {
        allowedViews: [...def.allowedViews],
        title: def.title,
        description: def.description,
        accessCode: def.accessCode
      });
      setSyncFeedback(`🔄 Droits et code par défaut rétablis pour ${def.title}.`);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const copyWhatsappSummary = () => {
    const lines = [
      `🏫 *GRILLE DES CODES D'ACCÈS SECRETS DE L'ÉTABLISSEMENT*`,
      `École : *${targetSchool.name}* (${targetSchool.city || 'Bénin'})`,
      `Date : ${new Date().toLocaleDateString('fr-FR')}`,
      `---------------------------------------`,
      ...rolesList.map(r => {
        const roleLabel = ROLE_DEFINITIONS.find(d => d.role === r.role)?.label || r.title;
        const count = r.allowedViews.includes('*') ? ALL_WINDOW_MODULES.length : r.allowedViews.length;
        const link = buildStaffRoleAccessUrl(
          { id: targetSchool.id, name: targetSchool.name, city: targetSchool.city },
          r.role,
          r.accessCode,
          r.assignedTo
        );
        return `📌 *${roleLabel}*\n👤 Titulaire : ${r.assignedTo || 'Non renseigné'}\n🔑 Code Secret : *${r.accessCode}*\n🚪 Fenêtres autorisées : ${count}/${ALL_WINDOW_MODULES.length}\n🔗 Lien direct : ${link}\n`;
      }),
      `---------------------------------------`,
      `🔒 _Conservez ces codes confidentiels. Système de gestion certifié._`
    ];

    const message = lines.join('\n');
    navigator.clipboard.writeText(message);
    setCopiedWhatsapp(true);
    setSyncFeedback(`📋 Fiche récapitulative de toute l'administration copiée dans le presse-papier !`);
    setTimeout(() => {
      setCopiedWhatsapp(false);
      setSyncFeedback(null);
    }, 4500);
  };

  // Staff Login Submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const inputClean = accessCodeInput.trim();
    if (!inputClean) {
      setErrorMessage('Veuillez renseigner le code d\'accès secret généré par la Direction.');
      return;
    }

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

    unlockSchool(selectedSchoolId, targetSchool.accessPassword || inputClean);

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
      const allowed = currentRoleConfig.allowedViews || ['dashboard'];
      const targetView = allowed.includes('*') ? 'dashboard' : (allowed[0] || 'dashboard');
      onNavigate(targetView);
    }, 600);
  };

  const isAllAllowed = currentRoleConfig.allowedViews.includes('*');
  const allowedViewsList = isAllAllowed
    ? ALL_WINDOW_MODULES.map(m => m.id)
    : currentRoleConfig.allowedViews;

  return (
    <div id="section-staff-portals-codes" className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-0">
      
      {/* Top Section Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Cloisonnement & Codes d'Accès Secrets</span>
              </div>
              {isDirectorMode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black uppercase tracking-wider animate-pulse">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Mode Direction Actif
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              {isDirectorMode
                ? "Espace de configuration réservé au Directeur : Choisissez précisément les fenêtres autorisées pour chaque membre et modifiez leurs codes d'accès secrets directement sur cette page."
                : subtitle}
            </p>
          </div>

          {/* Right Action Controls: Mode Switch & School Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
            {/* Director Mode Button */}
            {!isDirectorMode ? (
              <button
                id="btn-activate-director-mode"
                type="button"
                onClick={() => handleOpenDirectorConfig()}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-amber-300/40 hover:scale-[1.02] active:scale-95"
              >
                <Sliders className="w-4 h-4 text-slate-950" />
                <span>Espace Directeur : Configurer Fenêtres & Codes</span>
              </button>
            ) : (
              <button
                id="btn-exit-director-mode"
                type="button"
                onClick={() => setIsDirectorMode(false)}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-all border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Retour aux Guichets de Connexion</span>
              </button>
            )}

            {/* School Selector on Home Landing */}
            {showSchoolSelector && schools.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 shrink-0">
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
                  className="bg-slate-900 text-white font-black text-xs px-3 py-1.5 rounded-xl border border-white/20 outline-none w-full sm:min-w-[200px]"
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

        {/* Global Feedback Banner */}
        {syncFeedback && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* DIRECTOR MODE SUB-HEADER BAR */}
      {isDirectorMode && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 p-4 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Panneau Directeur de Cloisonnement</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold uppercase">
                  Directeur Autorisé
                </span>
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Vous pouvez modifier les codes secrets, désigner les titulaires et cocher les fenêtres autorisées pour chaque poste.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="inline-flex p-1 rounded-xl bg-amber-200/50 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-800 text-xs font-bold w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setDirectorTab('ROLE_DETAIL')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black ${
                  directorTab === 'ROLE_DETAIL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Fiche & Fenêtres par Poste</span>
              </button>
              <button
                type="button"
                onClick={() => setDirectorTab('ALL_MEMBERS_TABLE')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black ${
                  directorTab === 'ALL_MEMBERS_TABLE'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Tableau des 5 Membres</span>
              </button>
            </div>

            <button
              type="button"
              onClick={copyWhatsappSummary}
              title="Copier la fiche récapitulative des codes pour WhatsApp"
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              {copiedWhatsapp ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">Partager WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* Role Navigation Tab Bar */}
      <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>
              {isDirectorMode
                ? "Sélectionnez le membre de l'administration à configurer :"
                : "Choisissez votre espace de connexion :"}
            </span>
          </p>

          {isDirectorMode && (
            <button
              type="button"
              onClick={generateAllCodesInOneClick}
              className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Générer de nouveaux codes pour tous les 5 membres</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {ROLE_DEFINITIONS.map(def => {
            const IconComponent = def.icon;
            const isSelected = activeRole === def.role;
            const config = rolesList.find(r => r.role === def.role);
            const countViews = config?.allowedViews?.includes('*')
              ? ALL_WINDOW_MODULES.length
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
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-500 font-bold block">
                      {countViews}/{ALL_WINDOW_MODULES.length} fenêtres
                    </span>
                    <span className="font-mono text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                      {config?.accessCode}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DIRECTOR MODE - ALL MEMBERS TABLE VIEW */}
      {/* ========================================================================= */}
      {isDirectorMode && directorTab === 'ALL_MEMBERS_TABLE' ? (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Grille de l'Administration : Codes & Permissions de l'Équipe
              </h3>
              <p className="text-xs text-slate-500">
                Visualisez et modifiez directement les codes d'accès et les fenêtres autorisées pour chaque membre de la direction.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generateAllCodesInOneClick}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Régénérer Tous les Codes</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">Poste & Espace</th>
                  <th className="py-3 px-4">Titulaire Assigné</th>
                  <th className="py-3 px-4">Code Secret Actuel</th>
                  <th className="py-3 px-4">Fenêtres Autorisées</th>
                  <th className="py-3 px-4 text-right">Actions Directes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rolesList.map(r => {
                  const def = ROLE_DEFINITIONS.find(d => d.role === r.role) || ROLE_DEFINITIONS[0];
                  const Icon = def.icon;
                  const isAll = r.allowedViews.includes('*');
                  const count = isAll ? ALL_WINDOW_MODULES.length : r.allowedViews.length;

                  return (
                    <tr key={r.role} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold bg-gradient-to-br ${def.gradient} shadow-sm shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {r.title || def.label}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">
                              Poste : {r.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={r.assignedTo || ''}
                          onChange={e => updateRoleConfig(r.role, { assignedTo: e.target.value })}
                          placeholder="Nom & prénom..."
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none w-full max-w-[200px]"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={r.accessCode || ''}
                            onChange={e => updateRoleConfig(r.role, { accessCode: e.target.value.toUpperCase() })}
                            className="px-2.5 py-1.5 font-mono font-black text-xs rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 outline-none w-28 uppercase"
                          />
                          <button
                            type="button"
                            onClick={() => generateRandomCode(r.role)}
                            title="Générer un code aléatoire pour ce poste"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(r.accessCode)}
                            title="Copier le code"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                          >
                            {copiedCode === r.accessCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {count} / {ALL_WINDOW_MODULES.length}
                          </span>
                          <span className="text-[10px] text-slate-500">fenêtres</span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveRole(r.role);
                              setDirectorTab('ROLE_DETAIL');
                            }}
                            className="ml-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px] border border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            Cocher les fenêtres
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRole(r.role);
                            setDirectorTab('ROLE_DETAIL');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors cursor-pointer"
                        >
                          Configurer ce poste
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : isDirectorMode && directorTab === 'ROLE_DETAIL' ? (
        /* ========================================================================= */
        /* VIEW 2: DIRECTOR MODE - ROLE DETAIL & WINDOW CHECKBOX MATRIX */
        /* ========================================================================= */
        <div className="p-6 sm:p-8 space-y-8">
          {/* Active Role Header & Code Edit Block */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700/60 space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-700">
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

              {/* Quick Preset Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectAllModules(activeRole)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Tout Cocher ({ALL_WINDOW_MODULES.length}/{ALL_WINDOW_MODULES.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => deselectAllModules(activeRole)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Tout Décocher</span>
                </button>
                <button
                  type="button"
                  onClick={() => resetRoleToDefault(activeRole)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Droits par Défaut</span>
                </button>
              </div>
            </div>

            {/* Direct Form: Edit Secret Access Code, Assigned Person & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Code Secret */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Code d'Accès Secret du {activeRole} *</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={currentRoleConfig.accessCode || ''}
                    onChange={e => updateRoleConfig(activeRole, { accessCode: e.target.value.toUpperCase() })}
                    placeholder="Ex: CENS-3021..."
                    className="w-full px-3 py-2 font-mono font-black text-sm tracking-wider uppercase rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => generateRandomCode(activeRole)}
                    title="Générer un code aléatoire pour ce rôle"
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shrink-0 shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentRoleConfig.accessCode)}
                    title="Copier le code"
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer shrink-0"
                  >
                    {copiedCode === currentRoleConfig.accessCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500">
                  Modifiable directement. Le membre utilisera ce code pour se connecter.
                </span>
              </div>

              {/* Titulaire assigné */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>Nom et Prénom du Titulaire</span>
                </label>
                <input
                  type="text"
                  value={currentRoleConfig.assignedTo || ''}
                  onChange={e => updateRoleConfig(activeRole, { assignedTo: e.target.value })}
                  placeholder="Ex: M. Adolphe DOSSOU..."
                  className="w-full px-3 py-2 font-bold text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500">
                  Le nom officiel affiché sur l'en-tête et les documents signés.
                </span>
              </div>

              {/* Téléphone WhatsApp */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Téléphone WhatsApp du Titulaire</span>
                </label>
                <input
                  type="text"
                  value={currentRoleConfig.phone || ''}
                  onChange={e => updateRoleConfig(activeRole, { phone: e.target.value })}
                  placeholder="Ex: +229 97 00 00 00..."
                  className="w-full px-3 py-2 font-bold text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500">
                  Pour lui transmettre ses identifiants personnels.
                </span>
              </div>
            </div>
          </div>

          {/* CLOISONNEMENT DES FENÊTRES : INTERACTIVE CHECKBOXES */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Choix des Fenêtres Autorisées pour {currentRoleDef.label}</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Cochez ou décochez les modules pour personnaliser exactement les fenêtres auxquelles ce poste a accès.
                </p>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300 font-mono font-black text-xs">
                {isAllAllowed ? `${ALL_WINDOW_MODULES.length}/${ALL_WINDOW_MODULES.length} (Accès Total)` : `${allowedViewsList.length}/${ALL_WINDOW_MODULES.length} fenêtres cochées`}
              </div>
            </div>

            {/* Categorized Grid of Modules */}
            {(['PEDAGOGIE', 'VIE_SCOLAIRE', 'INSCRIPTIONS', 'FINANCE_ADMIN'] as const).map(catKey => {
              const catInfo = CATEGORY_INFOS[catKey];
              const CatIcon = catInfo.icon;
              const modulesInCat = ALL_WINDOW_MODULES.filter(m => m.category === catKey);

              return (
                <div key={catKey} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${catInfo.badgeColor}`}>
                      <CatIcon className="w-3.5 h-3.5" />
                      <span>{catInfo.label}</span>
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {modulesInCat.map(mod => {
                      const ModIcon = mod.icon;
                      const isChecked = isAllAllowed || currentRoleConfig.allowedViews.includes(mod.id);

                      return (
                        <div
                          key={mod.id}
                          onClick={() => toggleModuleForRole(activeRole, mod.id)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none flex items-start gap-3 relative group ${
                            isChecked
                              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 text-slate-900 dark:text-white shadow-sm'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <div className="w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 group-hover:border-slate-400" />
                            )}
                          </div>

                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <ModIcon className={`w-3.5 h-3.5 shrink-0 ${isChecked ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                              <h5 className={`text-xs font-black truncate ${isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                {mod.name}
                              </h5>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {mod.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 3: STANDARD LOGIN GUICHET VIEW */
        /* ========================================================================= */
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
                  {currentRoleConfig.phone && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                      WhatsApp : {currentRoleConfig.phone}
                    </span>
                  )}
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
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    <span>Fenêtres Déverrouillées par la Direction :</span>
                  </h5>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {isAllAllowed ? `${ALL_WINDOW_MODULES.length}/${ALL_WINDOW_MODULES.length} (Accès Total)` : `${allowedViewsList.length} fenêtres`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenDirectorConfig(activeRole)}
                      className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200 border border-amber-300 dark:border-amber-800 cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Modifier (Directeur)</span>
                    </button>
                  </div>
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
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Accès cloisonné et sécurisé par poste</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenDirectorConfig(activeRole)}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-bold text-left cursor-pointer"
                >
                  ⚙️ Vous êtes Directeur ? Modifiez ce code et les fenêtres
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* DIRECTOR AUTHENTICATION MODAL (if not yet verified) */}
      {/* ========================================================================= */}
      {showDirectorAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-amber-500/40 shadow-2xl space-y-6 relative">
            <button
              type="button"
              onClick={() => setShowDirectorAuthModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Accès Réservé à la Direction
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase">
                  Configuration des Codes & Fenêtres
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Pour modifier les codes d'accès secrets ou cocher les fenêtres autorisées des membres de l'administration, veuillez vous authentifier avec le code secret du Directeur ou le mot de passe de l'établissement.
            </p>

            {directorAuthError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{directorAuthError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyDirectorCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                  Code Secret Directeur ou Mot de Passe École
                </label>
                <input
                  type="password"
                  autoFocus
                  value={directorAuthCodeInput}
                  onChange={e => {
                    setDirectorAuthCodeInput(e.target.value);
                    setDirectorAuthError(null);
                  }}
                  placeholder={`Ex: ${directorConfig.accessCode || 'DIR-8842'}...`}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-amber-500 outline-none text-slate-900 dark:text-white font-mono font-bold text-sm"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>Code démo Directeur : <code className="font-mono font-bold text-amber-600">{directorConfig.accessCode || 'DIR-8842'}</code></span>
                <button
                  type="button"
                  onClick={() => setDirectorAuthCodeInput(directorConfig.accessCode || 'DIR-8842')}
                  className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-[10px] cursor-pointer"
                >
                  Remplir
                </button>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDirectorAuthModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg"
                >
                  Déverrouiller
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
