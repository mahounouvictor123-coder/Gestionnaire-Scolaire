import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { StaffRoleConfig, StaffRoleType } from '../types';
import { defaultStaffRolePermissions } from '../data/initialData';
import { SchoolLogo } from './SchoolLogo';
import { buildStaffRoleAccessUrl } from '../lib/urlUtils';
import {
  ShieldCheck,
  KeyRound,
  Users,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  Copy,
  Printer,
  Sparkles,
  BookOpen,
  Wallet,
  FileText,
  MessageSquare,
  Building2,
  GraduationCap,
  ClipboardList,
  FileCheck,
  CalendarCheck,
  Calendar,
  Award,
  CreditCard,
  Zap,
  UtensilsCrossed,
  Bus,
  BookMarked,
  Settings,
  ScanLine,
  Eye,
  EyeOff,
  UserCheck,
  Check,
  AlertCircle,
  Share2,
  ExternalLink,
  Phone,
  Edit3,
  CheckSquare,
  Square,
  Sliders,
  Send
} from 'lucide-react';

interface ModuleOption {
  id: string;
  name: string;
  category: 'PEDAGOGIE' | 'FINANCE' | 'ADMINISTRATION' | 'SERVICES';
  icon: React.ElementType;
  description: string;
}

export const AVAILABLE_MODULES: ModuleOption[] = [
  // Pédagogie
  { id: 'classes', name: 'Classes & Groupes', category: 'PEDAGOGIE', icon: Building2, description: 'Gestion des salles et filières' },
  { id: 'subjects', name: 'Matières & Coefficients', category: 'PEDAGOGIE', icon: BookOpen, description: 'Configuration du programme d’études' },
  { id: 'grades', name: 'Saisie Notes & Moyennes', category: 'PEDAGOGIE', icon: ClipboardList, description: 'Saisie et calcul des notes trimestrielles' },
  { id: 'report-cards', name: 'Bulletins Trimestriels QR', category: 'PEDAGOGIE', icon: FileCheck, description: 'Impression et génération des bulletins' },
  { id: 'attendance', name: 'Présences & Discipline', category: 'PEDAGOGIE', icon: CalendarCheck, description: 'Absences, retards et avertissements' },
  { id: 'timetable', name: 'Emplois du Temps', category: 'PEDAGOGIE', icon: Calendar, description: 'Planning hebdomadaire des cours' },
  { id: 'exams', name: 'Conseils & Examens', category: 'PEDAGOGIE', icon: Award, description: 'Délibérations et rangs officiels' },
  { id: 'epreuves', name: 'Épreuves Word IA', category: 'PEDAGOGIE', icon: FileText, description: 'Générateur de sujets et corrigés' },
  { id: 'teachers', name: 'Gestion Enseignants', category: 'PEDAGOGIE', icon: GraduationCap, description: 'Corps professoral et attributions' },

  // Finance
  { id: 'accounting', name: 'Comptabilité & Caisse', category: 'FINANCE', icon: Wallet, description: 'Grand livre, dépenses et trésorerie' },
  { id: 'payments', name: 'Frais de Scolarité', category: 'FINANCE', icon: CreditCard, description: 'Encaissements, relances et reçus officiels' },
  { id: 'subscriptions', name: 'Plans d’Abonnement', category: 'FINANCE', icon: Zap, description: 'Gestion de la licence de l’école' },

  // Administration
  { id: 'students', name: 'Inscriptions & Fiches Élèves', category: 'ADMINISTRATION', icon: Users, description: 'Dossiers scolaires et matricules' },
  { id: 'scan-roster', name: 'Scan OCR Listes de Classe', category: 'ADMINISTRATION', icon: ScanLine, description: 'Numérisation automatique par IA' },
  { id: 'documents', name: 'Documents & Cartes Scolaires', category: 'ADMINISTRATION', icon: FileText, description: 'Certificats de scolarité et badges' },

  // Services & Outils
  { id: 'communication', name: 'SMS & WhatsApp Parents', category: 'SERVICES', icon: MessageSquare, description: 'Envoi groupé des alertes aux familles' },
  { id: 'canteen', name: 'Service Cantine', category: 'SERVICES', icon: UtensilsCrossed, description: 'Suivi des repas et souscriptions' },
  { id: 'transport', name: 'Service Transport', category: 'SERVICES', icon: Bus, description: 'Lignes et arrêts de bus' },
  { id: 'library', name: 'Bibliothèque Scolaire', category: 'SERVICES', icon: BookMarked, description: 'Prêts et inventaire des livres' },
  { id: 'ai-studio', name: 'Assistant IA Gemini Pro', category: 'SERVICES', icon: Sparkles, description: 'Outils d’assistance et rédaction' },
  { id: 'settings', name: 'Paramètres Établissement', category: 'SERVICES', icon: Settings, description: 'Configuration générale et codes (Directeur)' }
];

interface StaffAccessCodeManagerProps {
  staffRoles: StaffRoleConfig[];
  onChangeStaffRoles: (updated: StaffRoleConfig[]) => void;
  onSave?: () => void;
}

export const StaffAccessCodeManager: React.FC<StaffAccessCodeManagerProps> = ({
  staffRoles,
  onChangeStaffRoles,
  onSave
}) => {
  const { currentSchool, settings, updateSettings, updateSchool } = useApp();
  const [selectedRole, setSelectedRole] = useState<StaffRoleType>('CENSEUR');
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLinkRole, setCopiedLinkRole] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printFilterRole, setPrintFilterRole] = useState<StaffRoleType | 'ALL'>('ALL');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'TABLE' | 'MATRIX'>('TABLE');

  // Ensure all 5 roles exist (DIRECTEUR, CENSEUR, SURVEILLANT, COMPTABLE, SECRETAIRE)
  const rolesList: StaffRoleConfig[] = defaultStaffRolePermissions.map(def => {
    const found = staffRoles.find(r => r.role === def.role);
    return found ? found : def;
  });

  const activeConfig = rolesList.find(r => r.role === selectedRole) || rolesList[1];

  // Update a specific role configuration and persist across all state tiers
  const updateRoleConfig = (role: StaffRoleType, patch: Partial<StaffRoleConfig>) => {
    const updated = rolesList.map(r => (r.role === role ? { ...r, ...patch } : r));
    onChangeStaffRoles(updated);
    updateSettings({ staffRolePermissions: updated });
    updateSchool(currentSchool.id, { staffRolePermissions: updated });
  };

  // Generate a random code for a specific role while keeping all pre-filled info intact
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
    const target = rolesList.find(r => r.role === role);
    
    updateRoleConfig(role, { 
      accessCode: newCode,
      lastGeneratedAt: new Date().toISOString()
    });

    setSyncFeedback(`🎲 Nouveau code secret "${newCode}" généré pour ${target?.title || role}. Les informations pré-remplies sont scrupuleusement conservées !`);
    setTimeout(() => setSyncFeedback(null), 4500);
  };

  // Generate brand new codes for the entire table in 1-click while PRESERVING names, phones, and settings
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

    onChangeStaffRoles(updated);
    updateSettings({ staffRolePermissions: updated });
    updateSchool(currentSchool.id, { staffRolePermissions: updated });

    setSyncFeedback(`⚡ Tous les codes d'accès ont été générés avec succès pour les 5 postes (Censeur, Secrétaire, Surveillant, Comptable, Directeur). Toutes les inscriptions et informations pré-remplies sont conservées intactes !`);
    setTimeout(() => setSyncFeedback(null), 6000);
  };

  // Manual save confirmation
  const handleSaveAll = () => {
    updateSettings({ staffRolePermissions: rolesList });
    updateSchool(currentSchool.id, { staffRolePermissions: rolesList });
    if (onSave) onSave();
    setSyncFeedback(`💾 Configuration complète enregistrée et synchronisée avec succès à tous les niveaux (Local, Établissement, Registre et Cloud) !`);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  const toggleModule = (role: StaffRoleType, moduleId: string) => {
    const target = rolesList.find(r => r.role === role);
    if (!target) return;

    if (target.allowedViews.includes('*')) {
      const allModuleIds = AVAILABLE_MODULES.map(m => m.id);
      const newAllowed = allModuleIds.filter(id => id !== moduleId);
      updateRoleConfig(role, { allowedViews: newAllowed });
      return;
    }

    let nextAllowed: string[];
    if (target.allowedViews.includes(moduleId)) {
      nextAllowed = target.allowedViews.filter(id => id !== moduleId);
    } else {
      nextAllowed = [...target.allowedViews, moduleId];
    }
    updateRoleConfig(role, { allowedViews: nextAllowed });
  };

  const selectAllModules = (role: StaffRoleType) => {
    if (role === 'DIRECTEUR') {
      updateRoleConfig(role, { allowedViews: ['*'] });
    } else {
      const allIds = AVAILABLE_MODULES.map(m => m.id);
      updateRoleConfig(role, { allowedViews: allIds });
    }
  };

  const deselectAllModules = (role: StaffRoleType) => {
    updateRoleConfig(role, { allowedViews: ['dashboard'] });
  };

  const resetRoleToDefault = (role: StaffRoleType) => {
    const def = defaultStaffRolePermissions.find(d => d.role === role);
    if (def) {
      updateRoleConfig(role, {
        allowedViews: [...def.allowedViews],
        title: def.title,
        description: def.description,
        accessCode: def.accessCode
      });
    }
  };

  const copyToClipboard = (code: string, roleName: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const copyRoleDirectLink = (roleConfig: StaffRoleConfig) => {
    const url = buildStaffRoleAccessUrl(
      {
        id: currentSchool.id,
        name: settings.schoolName || currentSchool.name,
        city: settings.city || currentSchool.city
      },
      roleConfig.role,
      roleConfig.accessCode,
      roleConfig.assignedTo
    );
    navigator.clipboard.writeText(url);
    setCopiedLinkRole(roleConfig.role);
    setTimeout(() => setCopiedLinkRole(null), 3500);
  };

  const toggleCodeVisibility = (role: string) => {
    setShowCodes(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const isModuleChecked = (roleConfig: StaffRoleConfig, moduleId: string) => {
    if (roleConfig.allowedViews.includes('*')) return true;
    return roleConfig.allowedViews.includes(moduleId);
  };

  const countAllowedModules = (roleConfig: StaffRoleConfig) => {
    if (roleConfig.allowedViews.includes('*')) return AVAILABLE_MODULES.length;
    return AVAILABLE_MODULES.filter(m => roleConfig.allowedViews.includes(m.id)).length;
  };

  const getRoleBadgeColor = (role: StaffRoleType) => {
    switch (role) {
      case 'DIRECTEUR':
        return 'bg-blue-600 text-white';
      case 'CENSEUR':
        return 'bg-cyan-600 text-white';
      case 'SURVEILLANT':
        return 'bg-purple-600 text-white';
      case 'COMPTABLE':
        return 'bg-emerald-600 text-white';
      case 'SECRETAIRE':
        return 'bg-amber-600 text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  const getRoleCardBorder = (role: StaffRoleType, isSelected: boolean) => {
    if (!isSelected) return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-85 hover:opacity-100';
    switch (role) {
      case 'DIRECTEUR':
        return 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20';
      case 'CENSEUR':
        return 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 ring-2 ring-cyan-500/20';
      case 'SURVEILLANT':
        return 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 ring-2 ring-purple-500/20';
      case 'COMPTABLE':
        return 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20';
      case 'SECRETAIRE':
        return 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 ring-2 ring-amber-500/20';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-white uppercase tracking-wider">
                Exclusivité Direction Générale
              </span>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Conservation Intégrale des Données & Inscriptions</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black flex items-center space-x-2.5">
              <ShieldCheck className="h-7 w-7 text-emerald-400 shrink-0" />
              <span>Tableau de Génération des Codes d'Accès de l'Équipe</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Définissez ou générez en un clic les codes secrets personnels pour chaque poste de votre équipe (<strong className="text-white">Censeur, Secrétaire, Surveillant, Comptable, Directeur</strong>). Toutes les informations pré-remplies, coordonnées des collaborateurs et dossiers d'élèves sont conservées avec une exactitude absolue.
            </p>
          </div>

          {/* Quick Actions in Banner */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={generateAllCodesInOneClick}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs flex items-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer shadow-lg shadow-amber-500/20"
              title="Générer automatiquement des codes uniques pour les 5 postes tout en conservant les noms et téléphones"
            >
              <Zap className="h-4 w-4 fill-white" />
              <span>⚡ Générer Tous les Codes (1-Clic)</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              title="Enregistrer et propager la configuration sur tous les niveaux"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Enregistrer & Sauvegarder</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md"
              title="Générer les fiches de codes d'accès individuelles"
            >
              <Printer className="h-4 w-4 text-amber-300" />
              <span className="hidden sm:inline">Imprimer Fiches</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 flex items-start justify-between shadow-sm animate-fade-in">
          <div className="flex items-start space-x-3 text-xs font-black">
            <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p>{syncFeedback}</p>
              <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                Statut : Synchronisé dans le registre de l'école, le stockage local et le Cloud.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer ml-3"
          >
            Fermer
          </button>
        </div>
      )}

      {/* View Switcher Tabs: Table View vs Matrix Permissions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('TABLE')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'TABLE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>📋 Tableau Général des Postes & Codes ({rolesList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MATRIX')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'MATRIX'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>🔐 Matrice des 22 Fenêtres & Droits d'Accès</span>
          </button>
        </div>

        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2">
          Établissement : <strong className="text-slate-900 dark:text-white">{settings.schoolName || currentSchool.name}</strong>
        </span>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: MASTER TABLE VIEW (TABLEAU COMPLET CENSEUR, SECRETAIRE, ETC.) */}
      {/* ========================================================================= */}
      {activeTab === 'TABLE' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
          
          {/* Table Header Description */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Registre Officiel des Postes & Codes Secrets de la Direction</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Renseignez directement le nom et numéro de chaque collaborateur. Cliquez sur « 🎲 Générer » ou saisissez un code sur mesure.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-[11px] font-black shrink-0 w-fit">
              5 Postes Opérationnels
            </span>
          </div>

          {/* Master Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 min-w-[170px]">Rôle & Titre Officiel</th>
                  <th className="py-3 px-4 min-w-[210px]">Titulaire Assigné (Nom Pré-rempli)</th>
                  <th className="py-3 px-4 min-w-[160px]">WhatsApp / Téléphone</th>
                  <th className="py-3 px-4 min-w-[240px]">Code Secret d'Accès</th>
                  <th className="py-3 px-4 min-w-[140px]">Droits & Fenêtres</th>
                  <th className="py-3 px-4 min-w-[100px]">Statut</th>
                  <th className="py-3 px-4 min-w-[170px] text-right">Partage & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rolesList.map(item => {
                  const allowedCount = countAllowedModules(item);
                  const isFullAccess = item.role === 'DIRECTEUR' || item.allowedViews.includes('*');
                  const isViewingCode = showCodes[item.role];

                  return (
                    <tr
                      key={item.role}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Role & Title */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-1">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase inline-block ${getRoleBadgeColor(item.role)}`}>
                            {item.role === 'DIRECTEUR' && '👑 '}
                            {item.role === 'CENSEUR' && '🎓 '}
                            {item.role === 'SURVEILLANT' && '👮 '}
                            {item.role === 'COMPTABLE' && '💰 '}
                            {item.role === 'SECRETAIRE' && '📝 '}
                            {item.role}
                          </span>
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs leading-tight">
                            {item.title}
                          </p>
                        </div>
                      </td>

                      {/* Assigned Staff Name */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="relative">
                          <input
                            type="text"
                            value={item.assignedTo || ''}
                            onChange={e => updateRoleConfig(item.role, { assignedTo: e.target.value })}
                            placeholder={`Nom du ${item.role.toLowerCase()}...`}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </td>

                      {/* WhatsApp / Phone */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="relative">
                          <input
                            type="text"
                            value={item.phone || ''}
                            onChange={e => updateRoleConfig(item.role, { phone: e.target.value })}
                            placeholder="+229 97 00 00 00"
                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-slate-900 dark:text-white focus:bg-white focus:border-emerald-500"
                          />
                        </div>
                      </td>

                      {/* Access Code Input with Generate and Toggle buttons */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center space-x-1.5">
                          <div className="relative flex-1">
                            <input
                              type={isViewingCode ? 'text' : 'password'}
                              value={item.accessCode}
                              onChange={e => updateRoleConfig(item.role, { accessCode: e.target.value.toUpperCase() })}
                              placeholder="CODE-XXXX"
                              className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border-2 border-blue-300 dark:border-blue-700 font-mono font-black text-xs text-slate-900 dark:text-white tracking-wider uppercase focus:bg-white focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => toggleCodeVisibility(item.role)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              title={isViewingCode ? 'Masquer le code' : 'Afficher le code'}
                            >
                              {isViewingCode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>

                          {/* Quick Random Generate Button */}
                          <button
                            type="button"
                            onClick={() => generateRandomCode(item.role)}
                            title="Générer un nouveau code aléatoire"
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer transition-colors shadow-xs"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>

                          {/* Quick Copy Code Button */}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.accessCode, item.title)}
                            title="Copier le code secret"
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600 cursor-pointer transition-colors shadow-xs"
                          >
                            {copiedCode === item.accessCode ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Permissions / Module Count */}
                      <td className="py-3.5 px-4 align-middle">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRole(item.role);
                            setActiveTab('MATRIX');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center space-x-1.5 transition-colors cursor-pointer"
                          title="Cliquez pour ajuster les fenêtres autorisées"
                        >
                          <Sliders className="h-3 w-3 text-indigo-500" />
                          <span>{isFullAccess ? 'Accès Total (22/22)' : `${allowedCount}/22 fenêtres`}</span>
                        </button>
                      </td>

                      {/* Enabled / Disabled Toggle */}
                      <td className="py-3.5 px-4 align-middle">
                        <button
                          type="button"
                          onClick={() => updateRoleConfig(item.role, { isEnabled: !item.isEnabled })}
                          className={`px-2.5 py-1 rounded-xl font-extrabold text-[10px] uppercase flex items-center space-x-1 transition-all cursor-pointer ${
                            item.isEnabled
                              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                          }`}
                        >
                          {item.isEnabled ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Actif</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" />
                              <span>Bloqué</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Quick Share Actions */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Copy Direct Link */}
                          <button
                            type="button"
                            onClick={() => copyRoleDirectLink(item)}
                            title="Copier le lien d'accès direct déverrouillé pour ce collaborateur"
                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center space-x-1 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
                          >
                            {copiedLinkRole === item.role ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Lien Copié</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="h-3.5 w-3.5" />
                                <span>Lien</span>
                              </>
                            )}
                          </button>

                          {/* WhatsApp Direct Share */}
                          <a
                            href={`https://wa.me/${(item.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Bonjour ${item.assignedTo || item.title},\n\nVoici vos identifiants d'accès officiels à votre espace "${item.title}" pour l'établissement "${settings.schoolName || currentSchool.name}" :\n\n🔗 *Lien direct d'accès :*\n${buildStaffRoleAccessUrl(
                                {
                                  id: currentSchool.id,
                                  name: settings.schoolName || currentSchool.name,
                                  city: settings.city || currentSchool.city
                                },
                                item.role,
                                item.accessCode,
                                item.assignedTo
                              )}\n\n🔑 *Votre Code Secret personnel défini par la Direction :* *${item.accessCode}*\n\nVos fenêtres de travail ont été configurées par la Direction.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Envoyer instantanément par WhatsApp au collaborateur"
                            className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center justify-center shadow-xs"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Guidance */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>
                Toute modification dans ce tableau est enregistrée en direct et conservée pour l'ensemble des modules.
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSaveAll}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Enregistrer Maintenant</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: MATRIX VIEW (22 MODULES & PERMISSIONS PAR RÔLE)               */}
      {/* ========================================================================= */}
      {activeTab === 'MATRIX' && (
        <div className="space-y-6">
          
          {/* Role Selector Badges for Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {rolesList.map(item => {
              const isSelected = selectedRole === item.role;
              const allowedCount = countAllowedModules(item);
              const isFullAccess = item.role === 'DIRECTEUR' || item.allowedViews.includes('*');

              return (
                <div
                  key={item.role}
                  onClick={() => setSelectedRole(item.role)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm relative ${getRoleCardBorder(
                    item.role,
                    isSelected
                  )}`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${getRoleBadgeColor(item.role)}`}>
                      {item.role === 'DIRECTEUR' && '👑 '}
                      {item.role === 'CENSEUR' && '🎓 '}
                      {item.role === 'SURVEILLANT' && '👮 '}
                      {item.role === 'COMPTABLE' && '💰 '}
                      {item.role === 'SECRETAIRE' && '📝 '}
                      {item.role}
                    </span>

                    <div className="flex items-center space-x-1">
                      {item.isEnabled ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" title="Rôle Actif" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" title="Rôle Désactivé" />
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Titulaire : <span className="font-bold text-slate-700 dark:text-slate-300">{item.assignedTo || 'Non assigné'}</span>
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px] tracking-wide">
                      🔑 {showCodes[item.role] ? item.accessCode : '••••••'}
                    </div>
                    <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400">
                      {isFullAccess ? 'Accès Total' : `${allowedCount}/22`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Matrix Detail Editor for Active Role */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            {/* Header of Active Role Config */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5 flex-wrap gap-1">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${getRoleBadgeColor(activeConfig.role)}`}>
                    Poste : {activeConfig.role}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {activeConfig.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
                  {activeConfig.description}
                </p>
              </div>

              {/* Matrix Action Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectAllModules(activeConfig.role)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 hover:text-emerald-700 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Tout Cocher
                </button>
                <button
                  type="button"
                  onClick={() => deselectAllModules(activeConfig.role)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-700 dark:text-slate-300 hover:text-rose-700 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Tout Décocher
                </button>
                <button
                  type="button"
                  onClick={() => resetRoleToDefault(activeConfig.role)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer"
                >
                  Configuration Recommandée
                </button>
              </div>
            </div>

            {/* Modules Grid Partitioned by Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              
              {/* Category 1: Pédagogie */}
              <div className="p-4 rounded-2xl bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-800 dark:text-cyan-300 pb-2 border-b border-cyan-200/50 dark:border-cyan-800/50">
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <h4 className="font-black text-xs uppercase tracking-wider">📚 Pédagogie & Notes</h4>
                </div>
                <div className="space-y-2">
                  {AVAILABLE_MODULES.filter(m => m.category === 'PEDAGOGIE').map(mod => {
                    const checked = isModuleChecked(activeConfig, mod.id);
                    const IconComponent = mod.icon;
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          checked
                            ? 'bg-white dark:bg-slate-800 border-cyan-300 dark:border-cyan-700 shadow-xs'
                            : 'bg-white/40 dark:bg-slate-900/40 border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModule(activeConfig.role, mod.id)}
                          className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                        />
                        <div className="text-xs">
                          <div className="flex items-center space-x-1.5">
                            <IconComponent className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                            <span className="font-bold text-slate-900 dark:text-white leading-tight">{mod.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{mod.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Category 2: Finances */}
              <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 pb-2 border-b border-emerald-200/50 dark:border-emerald-800/50">
                  <Wallet className="h-4 w-4 shrink-0" />
                  <h4 className="font-black text-xs uppercase tracking-wider">💰 Finances & Caisse</h4>
                </div>
                <div className="space-y-2">
                  {AVAILABLE_MODULES.filter(m => m.category === 'FINANCE').map(mod => {
                    const checked = isModuleChecked(activeConfig, mod.id);
                    const IconComponent = mod.icon;
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          checked
                            ? 'bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-700 shadow-xs'
                            : 'bg-white/40 dark:bg-slate-900/40 border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModule(activeConfig.role, mod.id)}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <div className="text-xs">
                          <div className="flex items-center space-x-1.5">
                            <IconComponent className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-900 dark:text-white leading-tight">{mod.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{mod.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Category 3: Administration */}
              <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-3">
                <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 pb-2 border-b border-amber-200/50 dark:border-amber-800/50">
                  <Users className="h-4 w-4 shrink-0" />
                  <h4 className="font-black text-xs uppercase tracking-wider">📝 Administration</h4>
                </div>
                <div className="space-y-2">
                  {AVAILABLE_MODULES.filter(m => m.category === 'ADMINISTRATION').map(mod => {
                    const checked = isModuleChecked(activeConfig, mod.id);
                    const IconComponent = mod.icon;
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          checked
                            ? 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700 shadow-xs'
                            : 'bg-white/40 dark:bg-slate-900/40 border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModule(activeConfig.role, mod.id)}
                          className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                        />
                        <div className="text-xs">
                          <div className="flex items-center space-x-1.5">
                            <IconComponent className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span className="font-bold text-slate-900 dark:text-white leading-tight">{mod.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{mod.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Category 4: Services & Outils */}
              <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-800 dark:text-indigo-300 pb-2 border-b border-indigo-200/50 dark:border-indigo-800/50">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <h4 className="font-black text-xs uppercase tracking-wider">📢 Services & Outils</h4>
                </div>
                <div className="space-y-2">
                  {AVAILABLE_MODULES.filter(m => m.category === 'SERVICES').map(mod => {
                    const checked = isModuleChecked(activeConfig, mod.id);
                    const IconComponent = mod.icon;
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          checked
                            ? 'bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-700 shadow-xs'
                            : 'bg-white/40 dark:bg-slate-900/40 border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModule(activeConfig.role, mod.id)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <div className="text-xs">
                          <div className="flex items-center space-x-1.5">
                            <IconComponent className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span className="font-bold text-slate-900 dark:text-white leading-tight">{mod.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{mod.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Printable Slips Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <Printer className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Fiches Confidentielles des Codes d'Accès Équipe
                  </h3>
                  <p className="text-xs text-slate-500">
                    Générez et imprimez les identifiants officiels à remettre sous pli à vos collaborateurs.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-md cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer Maintenant</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold text-slate-500">Filtrer par rôle :</span>
              <button
                type="button"
                onClick={() => setPrintFilterRole('ALL')}
                className={`px-3 py-1 rounded-lg font-bold ${
                  printFilterRole === 'ALL' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                Tous les 5 Postes
              </button>
              {rolesList.map(r => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => setPrintFilterRole(r.role)}
                  className={`px-3 py-1 rounded-lg font-bold ${
                    printFilterRole === r.role ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {r.role}
                </button>
              ))}
            </div>

            {/* Slips Grid (Print View) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              {rolesList
                .filter(r => printFilterRole === 'ALL' || printFilterRole === r.role)
                .map(item => {
                  const allowedList = AVAILABLE_MODULES.filter(m => isModuleChecked(item, m.id));

                  return (
                    <div
                      key={item.role}
                      className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 space-y-4 relative"
                    >
                      {/* Slip Header */}
                      <div className="flex items-start justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-2.5">
                          <SchoolLogo variant="badge" size="sm" />
                          <div>
                            <p className="font-black text-xs text-slate-900 dark:text-white uppercase leading-tight">
                              {settings.schoolName || currentSchool.name}
                            </p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                              Fiche d'Identifiants Confidentiels • {settings.academicYear || '2025-2026'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${getRoleBadgeColor(item.role)}`}>
                          {item.role}
                        </span>
                      </div>

                      {/* Staff & Role Info */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Fonction Officielle</p>
                          <p className="font-extrabold text-slate-900 dark:text-white">{item.title}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Titulaire Assigné</p>
                          <p className="font-extrabold text-slate-900 dark:text-white">{item.assignedTo || 'Non renseigné'}</p>
                          {item.phone && (
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Tél : {item.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Secret Code Highlight Box */}
                      <div className="p-3.5 rounded-xl bg-slate-900 text-white text-center space-y-1">
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                          CODE SECRET D'ACCÈS DU POSTE
                        </p>
                        <p className="text-xl font-black font-mono tracking-widest text-white">
                          {item.accessCode}
                        </p>
                        <p className="text-[9px] text-slate-400">
                          Ce code est strictement personnel et confidentiel. Ne pas divulguer.
                        </p>
                      </div>

                      {/* Allowed Windows Checklist */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Fenêtres & Droits Autorisés ({allowedList.length}) :
                        </p>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                          {item.allowedViews.includes('*') ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                              ✅ Plein Pouvoir : Accès Intégral à Toutes les Fenêtres
                            </span>
                          ) : (
                            allowedList.map(mod => (
                              <span
                                key={mod.id}
                                className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-[10px] font-medium"
                              >
                                ✓ {mod.name}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Direct Link Share Row for the slip */}
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2 text-[10px] print:hidden">
                        <div className="truncate text-blue-900 dark:text-blue-200 font-medium">
                          <span className="font-bold">Lien direct : </span>
                          <span className="font-mono text-[9px]">{buildStaffRoleAccessUrl({ id: currentSchool.id }, item.role, item.accessCode, item.assignedTo)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyRoleDirectLink(item)}
                          className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shrink-0 flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedLinkRole === item.role ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-300" />
                              <span>Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Signature row */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[9px] text-slate-500 font-bold">
                        <span>Fait à {settings.city || currentSchool.city || 'Cotonou'}</span>
                        <span>Visa & Signature du Directeur</span>
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
