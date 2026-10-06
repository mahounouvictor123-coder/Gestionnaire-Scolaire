import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { useGoogleAuth } from './GoogleAuthGate';
import { SchoolLogo } from './SchoolLogo';
import { defaultStaffRolePermissions } from '../data/initialData';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  ClipboardList,
  FileCheck,
  CreditCard,
  Wallet,
  CalendarCheck,
  Calendar,
  BookMarked,
  UtensilsCrossed,
  Bus,
  FileText,
  MessageSquare,
  Sparkles,
  Settings,
  HeartHandshake,
  UserCheck2,
  ShieldCheck,
  Award,
  ScanLine,
  Zap,
  Home,
  Crown,
  Mic,
  Monitor,
  Download,
  Smartphone,
  Camera
} from 'lucide-react';
import { UserRole } from '../types';
import { InstallPwaModal } from './InstallPwaModal';
import { SchoolLogoImportModal } from './modals/SchoolLogoImportModal';
import { triggerAutoInstall, isDesktopPC, isAppInstalled } from '../lib/pwaInstallManager';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenControlBox?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  roles?: UserRole[];
  category?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onOpenControlBox }) => {
  const { currentUser, settings, currentSchool, parentComplaints } = useApp();
  const { gmailUser } = useGoogleAuth();

  const isPromoter = (currentUser?.email?.toLowerCase().trim() === 'mahounouvictor123@gmail.com') || 
    (gmailUser?.email?.toLowerCase().trim() === 'mahounouvictor123@gmail.com') ||
    (typeof window !== 'undefined' && localStorage.getItem('GESTIONNAIRE_PROMOTER_AUTH') === 'true');

  const unreadComplaintsCount = (parentComplaints || []).filter(
    c => !c.read && (!c.schoolId || c.schoolId === currentSchool.id)
  ).length;

  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const isPC = isDesktopPC();
  const installed = isAppInstalled();

  const handleSidebarAppInstall = async () => {
    const res = await triggerAutoInstall();
    if (res.success && res.outcome === 'accepted') return;
    setShowInstallModal(true);
  };

  const navItems: NavItem[] = [
    // Pôle Accueil
    { id: 'landing', label: 'Accueil Officiel', icon: Home, badge: 'Vitrine', category: 'Pôle Accueil' },
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, category: 'Pôle Accueil' },
    
    // 🏢 ESPACE DIRECTION
    { id: 'quiz-week', label: 'Supervision Quiz Week', icon: Sparkles, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'ENSEIGNANT'], badge: 'Contrôle IA', category: '🏢 ESPACE DIRECTION' },
    { id: 'accounting', label: 'Comptabilité & Caisse', icon: Wallet, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'COMPTABLE'], category: '🏢 ESPACE DIRECTION' },
    { id: 'payments', label: 'Frais de Scolarité', icon: CreditCard, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'COMPTABLE', 'PARENT'], category: '🏢 ESPACE DIRECTION' },
    { id: 'subscriptions', label: "Plans d'Abonnement", icon: Zap, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'COMPTABLE'], badge: 'SaaS Pro', category: '🏢 ESPACE DIRECTION' },
    { id: 'teachers', label: 'Maîtres & Professeurs', icon: GraduationCap, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'SECRETAIRE'], category: '🏢 ESPACE DIRECTION' },
    { id: 'settings', label: 'Paramètres Établissement', icon: Settings, roles: ['SUPER_ADMIN', 'DIRECTEUR'], category: '🏢 ESPACE DIRECTION' },

    // 📝 ESPACE SECRÉTARIAT & PÉDAGOGIE
    { id: 'students', label: 'Inscriptions & Fiches Élèves', icon: Users, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'SURVEILLANT', 'SECRETAIRE', 'COMPTABLE'], category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'scan-roster', label: 'Scan OCR Listes de Classe', icon: ScanLine, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'SECRETAIRE', 'ENSEIGNANT'], badge: 'OCR IA', category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'classes', label: 'Classes & Groupes', icon: Building2, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'SURVEILLANT', 'SECRETAIRE', 'ENSEIGNANT'], category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'subjects', label: 'Matières & Coefficients', icon: BookOpen, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'ENSEIGNANT'], category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'grades', label: 'Saisie Notes & Moyennes', icon: ClipboardList, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'ENSEIGNANT', 'SECRETAIRE'], category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'report-cards', label: 'Bulletins Trimestriels QR', icon: FileCheck, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'SECRETAIRE', 'ENSEIGNANT', 'PARENT', 'ELEVE'], category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'attendance', label: 'Présences & Discipline', icon: CalendarCheck, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'SURVEILLANT', 'SECRETAIRE', 'ENSEIGNANT'], category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'timetable', label: 'Emplois du Temps', icon: Calendar, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'SURVEILLANT', 'SECRETAIRE', 'ENSEIGNANT', 'ELEVE', 'PARENT'], category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'epreuves', label: 'Espace Épreuves Word IA', icon: FileText, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'ENSEIGNANT'], badge: 'Word IA', category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'documents', label: 'Documents & Cartes Scolaires', icon: FileText, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'SURVEILLANT', 'SECRETAIRE', 'PARENT', 'ELEVE'], category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'communication', label: 'Envoi SMS & WhatsApp', icon: MessageSquare, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'SURVEILLANT', 'COMPTABLE', 'SECRETAIRE', 'ENSEIGNANT'], category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'parent-complaints', label: 'Boîte Audios & Plaintes', icon: Mic, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'CENSEUR', 'SURVEILLANT', 'SECRETAIRE'], badge: unreadComplaintsCount > 0 ? `${unreadComplaintsCount} direct` : 'Direct', category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'canteen', label: 'Service Cantine', icon: UtensilsCrossed, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'SURVEILLANT', 'COMPTABLE', 'SECRETAIRE', 'PARENT', 'ELEVE'], category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'transport', label: 'Service Transport', icon: Bus, roles: ['SUPER_ADMIN', 'DIRECTEUR', 'COMPTABLE', 'SECRETAIRE', 'PARENT', 'ELEVE'], category: '📝 ESPACE SECRÉTARIAT' },
    { id: 'library', label: 'Bibliothèque', icon: BookMarked, category: '📝 ESPACE SECRÉTARIAT' },

    // Dedicated Portals
    { id: 'student-portal', label: 'Espace Élève', icon: UserCheck2, roles: ['ELEVE', 'SUPER_ADMIN', 'DIRECTEUR'], badge: 'Propre', category: '👥 PORTAILS UTILISATEURS' }
  ];

  const isPromoterAuth = localStorage.getItem('GESTIONNAIRE_PROMOTER_AUTH') === 'true';

  // Retrieve active staff permissions configured by director for this school
  const staffConfigs = currentSchool?.staffRolePermissions || settings.staffRolePermissions || defaultStaffRolePermissions;
  const currentStaffConfig = staffConfigs.find(c => c.role === currentUser.role);

  // Filter items allowed for user role, custom staff permissions, and promoter status
  const allowedItems = navItems.filter(item => {
    // Strictly hide Promoter Secret Overview & Multi-School Hub from non-promoters
    if (item.id === 'promoter-admin' || item.id === 'schools-hub') {
      return isPromoter;
    }

    // Super Admin or Promoter has universal access to all school modules & views
    if (isPromoter || currentUser.role === 'SUPER_ADMIN') {
      return true;
    }

    // Director has full access to their school, but NOT to promoter-admin or schools-hub
    if (currentUser.role === 'DIRECTEUR') {
      return true;
    }

    // Always allow basic public views
    if (item.id === 'landing' || item.id === 'dashboard') {
      return true;
    }

    // Strictly enforce role-based view partitioning for staff members
    if (['CENSEUR', 'SURVEILLANT', 'COMPTABLE', 'SECRETAIRE'].includes(currentUser.role)) {
      const activeStaffConfig = currentStaffConfig || defaultStaffRolePermissions.find(d => d.role === currentUser.role);
      if (!activeStaffConfig) return false;
      if (activeStaffConfig.allowedViews.includes('*')) return true;
      return activeStaffConfig.allowedViews.includes(item.id);
    }

    if (!item.roles) return true;
    return item.roles.includes(currentUser.role);
  });

  // Group by category
  const categories = Array.from(new Set(allowedItems.map(i => i.category || 'Général')));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      
      {/* Brand Logo Card in Sidebar */}
      <div 
        onClick={() => setIsLogoModalOpen(true)}
        className="p-3 mx-3 mt-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-indigo-600 transition-colors group"
        title="Cliquer pour importer ou modifier le logo officiel (bulletins & épreuves Word)"
      >
        <div className="flex items-center space-x-2.5 truncate">
          <SchoolLogo variant="badge" size="sm" />
          <div className="leading-none truncate">
            <p className="font-black text-xs text-white group-hover:text-indigo-300 transition-colors truncate">
              {settings.schoolName || 'ÉTABLISSEMENT SCOLAIRE'}
            </p>
            <p className="text-[9px] font-bold text-indigo-400 mt-1 uppercase tracking-wider truncate">
              {settings.motto || 'DISCIPLINE • TRAVAIL • RIGUEUR'}
            </p>
          </div>
        </div>
        <span className="p-1 rounded-lg bg-indigo-950 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Camera className="h-3 w-3" />
        </span>
      </div>

      {/* Current Active Role Card */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700/60 shadow-inner">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Rôle Actif</span>
        </div>
        <p className="mt-1 text-sm font-extrabold text-blue-400 truncate">
          {currentUser.role.replace('_', ' ')}
        </p>
        <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
        {categories.map(cat => {
          const catItems = allowedItems.filter(i => (i.category || 'Général') === cat);
          return (
            <div key={cat} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {cat}
              </p>
              {catItems.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bouton d'installation sur PC / Mobile avec logo */}
      {!installed && (
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={handleSidebarAppInstall}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-bold transition-all shadow-md group cursor-pointer"
            title={isPC ? "Installer l'application sur votre PC (Bureau & Barre des tâches) avec son logo" : "Ajouter à l'écran d'accueil"}
          >
            <div className="flex items-center space-x-2 truncate">
              {isPC ? (
                <Monitor className="h-4 w-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              ) : (
                <Smartphone className="h-4 w-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              )}
              <span className="truncate">{isPC ? "Installer l'App PC" : "Installer l'App"}</span>
            </div>
            <Download className="h-3.5 w-3.5 text-emerald-400 shrink-0 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Footer info */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
          <span>Version 3.8.2</span>
          <span className="text-emerald-500 font-medium">● En ligne</span>
        </div>
      </div>

      <InstallPwaModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        appName={settings.schoolName || 'GESTIONNAIRE SCOLAIRE'}
      />

      <SchoolLogoImportModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
      />
    </aside>
  );
};
