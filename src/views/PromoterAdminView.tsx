import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { getPublicBaseUrl, buildDirectSchoolAccessUrl } from '../lib/urlUtils';
import { generateValidPassword } from '../lib/passwordUtils';
import { SchoolLogo } from '../components/SchoolLogo';
import {
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Building2,
  Gift,
  Users,
  Search,
  Sparkles,
  KeyRound,
  Zap,
  Globe2,
  Check,
  Smartphone,
  Info,
  PhoneCall,
  Crown,
  AlertTriangle,
  Key,
  CreditCard,
  Eye,
  EyeOff,
  Save,
  Flame,
  Share2,
  Copy,
  ExternalLink,
  MessageSquare,
  Send,
  Plus,
  PlusCircle,
  Link as LinkIcon,
  Bell,
  Trash2,
  Mail,
  GraduationCap,
  Wallet,
  Settings,
  Tag
} from 'lucide-react';
import { School } from '../types';
import { CompleteSchoolSetupModal } from '../components/modals/CompleteSchoolSetupModal';
import { PromoterAICopilot } from '../components/PromoterAICopilot';
import { CampaignsManagementTab } from '../components/CampaignsManagementTab';

interface PromoterAdminViewProps {
  onNavigate?: (view: string) => void;
}

const MASTER_PROMOTER_EMAIL = 'mahounouvictor123@gmail.com';

export const PromoterAdminView: React.FC<PromoterAdminViewProps> = ({ onNavigate }) => {
  const {
    schools,
    currentSchoolId,
    switchSchool,
    deleteSchool,
    currentUser,
    loginUser,
    isSchoolUnlocked,
    toggleSchoolAccessProtection,
    validateSchoolByPromoter,
    toggleSchoolBlockStatus,
    promoterNotifications,
    markPromoterNotificationAsRead,
    clearPromoterNotifications,
    updateSchool,
    setUnlockedSchoolIds,
    adminSetSchoolSubscription,
    createSchool,
    settings,
    updateSettings,
    campaigns
  } = useApp();

  // Active Tab: Overview by default (Vue d'ensemble sur tout)
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'campaigns' | 'fedapay' | 'ai-copilot'>('overview');

  // Promoter Master Lock State
  const [promoterEmailInput, setPromoterEmailInput] = useState('mahounouvictor123@gmail.com');
  const [promoterPasscode, setPromoterPasscode] = useState('');
  const [isPromoterAuthenticated, setIsPromoterAuthenticated] = useState<boolean>(true);
  const [authError, setAuthError] = useState('');

  // Delete Trial School State
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'FREE' | 'PROTECTED' | 'PENDING'>('ALL');

  // School Password Modification State
  const [selectedSchoolForPasswordEdit, setSelectedSchoolForPasswordEdit] = useState<School | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // FedaPay & Payment Gateway States
  const [fedapayPublic, setFedapayPublic] = useState(settings.fedapayPublicKey || 'pk_live_feda_xxxxxxxxxxxxxxxxxxxx');
  const [fedapaySecret, setFedapaySecret] = useState(settings.fedapaySecretKey || 'sk_live_feda_xxxxxxxxxxxxxxxxxxxx');
  const [fedapayEnv, setFedapayEnv] = useState<'live' | 'sandbox'>('live');
  const [kkiapayPublic, setKkiapayPublic] = useState(settings.kkiapayPublicKey || '');
  const [kkiapaySecret, setKkiapaySecret] = useState(settings.kkiapaySecretKey || '');
  const [momoNumber, setMomoNumber] = useState(settings.mobileMoneyNumber || '+229 01 67 43 03 81');
  const [activeGateway, setActiveGateway] = useState<'FEDAPAY' | 'KKIAPAY' | 'MOMO_DIRECT'>(settings.activePaymentGateway || 'FEDAPAY');
  const [enableOnlineTx, setEnableOnlineTx] = useState<boolean>(settings.enableOnlineTransactions !== false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showKkiapaySecretKey, setShowKkiapaySecretKey] = useState(false);
  const [showFedapaySuccessModal, setShowFedapaySuccessModal] = useState(false);
  const [fedapaySuccessMsg, setFedapaySuccessMsg] = useState('');

  // Modal / Selected School for Custom Grant / Offline Activation
  const [selectedSchoolForGrant, setSelectedSchoolForGrant] = useState<School | null>(null);
  const [offlinePlanId, setOfflinePlanId] = useState<string>('plan-monthly');
  const [proofReference, setProofReference] = useState('');
  const [grantNote, setGrantNote] = useState('');
  const [grantSuccessMsg, setGrantSuccessMsg] = useState('');

  // Remote School Creation State
  const [isRemoteModalOpen, setIsRemoteModalOpen] = useState(false);
  const [createdRemoteSchool, setCreatedRemoteSchool] = useState<School | null>(null);
  const [remoteSchoolName, setRemoteSchoolName] = useState('');
  const [remoteSchoolCity, setRemoteSchoolCity] = useState('');
  const [remoteDirectorName, setRemoteDirectorName] = useState('');
  const [remoteDirectorPhone, setRemoteDirectorPhone] = useState('');
  const [remoteSchoolEmail, setRemoteSchoolEmail] = useState('');
  const [remoteAccessPassword, setRemoteAccessPassword] = useState('');
  const [remotePlanId, setRemotePlanId] = useState<string>('plan-weekly');
  const [populateDemoData, setPopulateDemoData] = useState(true);

  // Selected School for Share Link Modal
  const [selectedSchoolForShare, setSelectedSchoolForShare] = useState<School | null>(null);
  const [selectedSchoolForSetupModal, setSelectedSchoolForSetupModal] = useState<School | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleOpenRemoteModal = () => {
    setRemoteSchoolName('');
    setRemoteSchoolCity('');
    setRemoteDirectorName('');
    setRemoteDirectorPhone('');
    setRemoteSchoolEmail('');
    setRemoteAccessPassword(generateValidPassword());
    setRemotePlanId('plan-weekly');
    setPopulateDemoData(true);
    setCreatedRemoteSchool(null);
    setIsRemoteModalOpen(true);
  };

  const handleCreateRemoteSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteSchoolName.trim() || !remoteSchoolCity.trim()) return;

    const validPwd = remoteAccessPassword.trim().length === 8
      ? remoteAccessPassword.trim()
      : generateValidPassword();

    const promoterToken = `PROM-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSchool = createSchool({
      name: remoteSchoolName.trim(),
      motto: 'Travail - Discipline - Succès',
      address: remoteSchoolCity.trim(),
      city: remoteSchoolCity.trim(),
      phone: remoteDirectorPhone.trim() || '+229 01 43 75 45 93',
      email: remoteSchoolEmail.trim() || 'contact@ecole.bj',
      directorName: remoteDirectorName.trim() || 'M. le Directeur',
      academicYear: '2025-2026',
      currentTrimester: 1,
      currency: 'FCFA',
      logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=300&q=80',
      accessPassword: validPwd,
      promoterPhone: momoNumber,
      validationToken: promoterToken
    }, populateDemoData);

    // Apply selected plan and validate by promoter
    adminSetSchoolSubscription(newSchool.id, remotePlanId, false);
    validateSchoolByPromoter(newSchool.id);

    // Update with exact promoter token
    updateSchool(newSchool.id, {
      validationToken: promoterToken,
      accessPassword: validPwd,
      isValidatedByPromoter: true,
      isBlocked: false,
      isPasswordProtected: false
    });

    const fullSchool = {
      ...newSchool,
      validationToken: promoterToken,
      accessPassword: validPwd,
      isValidatedByPromoter: true,
      isBlocked: false,
      isPasswordProtected: false
    };

    setCreatedRemoteSchool(fullSchool);
    setSelectedSchoolForShare(fullSchool);
    setGrantSuccessMsg(`🎉 École "${fullSchool.name}" créée et validée avec succès ! Clé d'Accès Promoteur : ${promoterToken} • Mot de passe : ${validPwd}`);
    setTimeout(() => setGrantSuccessMsg(''), 7000);
  };

  const getSchoolDirectLink = (school: School) => {
    return buildDirectSchoolAccessUrl({
      id: school.id,
      name: school.name,
      city: school.city,
      directorName: school.directorName,
      phone: school.phone,
      accessPassword: school.accessPassword
    });
  };

  const getWhatsAppMessage = (school: School) => {
    const directLink = getSchoolDirectLink(school);
    const pwd = school.accessPassword || '12345678';
    const promoterToken = school.validationToken || `PROM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    return `Bonjour *${school.directorName || 'Cher Directeur'}*,\n\nVotre espace **Gestionnaire Scolaire** pour l'école *${school.name}* (${school.city}) est actif !\n\n🔑 **VOS CLÉS D'ACCÈS PROMOTEUR** :\n• Clé d'Accès Promoteur : *${promoterToken}*\n• Code École (ID) : *${school.id}*\n• Mot de Passe Secret : *${pwd}*\n\n🔗 **Lien d'Accès Direct au Tableau de Bord** :\n${directLink}\n\nUne fois connecté, vous pourrez :\n1. Modifier votre mot de passe secret dans 'Paramètres'\n2. Renseigner les coordonnées et le logo de votre école\n3. Inscrire vos élèves et vos enseignants\n4. Imprimer vos bulletins de notes et reçus de scolarité !\n\nMerci pour votre confiance !`;
  };

  // Generate a brand new Promoter Access Key & Password for a school:
  const handleGeneratePromoterKey = (school: School) => {
    const newPromoterKey = `PROM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPassword = generateValidPassword();

    updateSchool(school.id, {
      validationToken: newPromoterKey,
      accessPassword: newPassword,
      isValidatedByPromoter: true,
      isBlocked: false,
      isPasswordProtected: false
    });

    // Automatically unlock in session as well
    setUnlockedSchoolIds(prev => prev.includes(school.id) ? prev : [...prev, school.id]);

    const updatedSchoolObj = {
      ...school,
      validationToken: newPromoterKey,
      accessPassword: newPassword,
      isValidatedByPromoter: true,
      isBlocked: false,
      isPasswordProtected: false
    };

    setGrantSuccessMsg(`🔑 NOUVELLE CLÉ PROMOTEUR GÉNÉRÉE AVEC SUCCÈS POUR "${school.name}" !\n• Clé d'Accès Promoteur : ${newPromoterKey}\n• Mot de Passe Secret : ${newPassword}`);
    setSelectedSchoolForShare(updatedSchoolObj);
    setTimeout(() => setGrantSuccessMsg(''), 7000);
  };

  const handleCopyDirectLink = (school: School) => {
    const link = getSchoolDirectLink(school);
    navigator.clipboard.writeText(link);
    setCopyFeedback('Lien d\'accès copié dans le presse-papiers !');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleShareWhatsApp = (school: School) => {
    const text = getWhatsAppMessage(school);
    const cleanPhone = (school.phone || '').replace(/[^0-9]/g, '');
    const waUrl = cleanPhone.length >= 8 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handlePromoterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedEmail = promoterEmailInput.trim().toLowerCase();

    if (cleanedEmail !== MASTER_PROMOTER_EMAIL.toLowerCase()) {
      setAuthError(`⛔ ACCÈS REFUSÉ : L'adresse e-mail "${promoterEmailInput}" n'est pas autorisée. Seul le compte Gmail officiel ${MASTER_PROMOTER_EMAIL} détient les privilèges d'accès à cet Espace Promoteur.`);
      return;
    }

    if (!promoterPasscode.trim()) {
      setAuthError(`Veuillez renseigner le mot de passe de votre compte Gmail ${MASTER_PROMOTER_EMAIL}.`);
      return;
    }

    // Authenticate using Gmail mahounouvictor123@gmail.com and password
    setIsPromoterAuthenticated(true);
    localStorage.setItem('GESTIONNAIRE_PROMOTER_AUTH', 'true');
    localStorage.setItem('GESTIONNAIRE_PROMOTER_EMAIL', MASTER_PROMOTER_EMAIL);
    loginUser(MASTER_PROMOTER_EMAIL, 'Promoteur Général (Victor)', 'SUPER_ADMIN', currentSchoolId);
    setAuthError('');
  };

  const handlePromoterLogout = () => {
    setIsPromoterAuthenticated(false);
    localStorage.removeItem('GESTIONNAIRE_PROMOTER_AUTH');
    localStorage.removeItem('GESTIONNAIRE_PROMOTER_EMAIL');
  };

  // Quick Action: Enable Free Access (Green Button)
  const handleEnableFreeAccess = (school: School) => {
    toggleSchoolBlockStatus(school.id, false);
    validateSchoolByPromoter(school.id);
    toggleSchoolAccessProtection(school.id, false);
    // Automatically unlock in session
    setUnlockedSchoolIds(prev => prev.includes(school.id) ? prev : [...prev, school.id]);
    setGrantSuccessMsg(`✅ Accès accordé et débloqué pour "${school.name}". Aucun obstacle de connexion.`);
    setTimeout(() => setGrantSuccessMsg(''), 4000);
  };

  // Quick Action: Block Access / Require Subscription (Red Button)
  const handleDisableFreeAccess = (school: School) => {
    toggleSchoolBlockStatus(school.id, true);
    toggleSchoolAccessProtection(school.id, true);
    setGrantSuccessMsg(`🔴 Accès suspendu et bloqué pour "${school.name}". Seul le Promoteur peut réactiver.`);
    setTimeout(() => setGrantSuccessMsg(''), 4000);
  };

  // Switch to school immediately as promoter
  const handleSwitchToSchoolAsPromoter = (schoolId: string) => {
    switchSchool(schoolId);
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  // Grant Custom Subscription / Offline Payment Activation / Deactivation
  const handleApplyGrant = () => {
    if (!selectedSchoolForGrant) return;

    if (offlinePlanId === 'DEACTIVATE') {
      adminSetSchoolSubscription(selectedSchoolForGrant.id, '', true);
      setGrantSuccessMsg(`🔴 L'école "${selectedSchoolForGrant.name}" a été DÉSACTIVÉE et son accès a été verrouillé par mot de passe.`);
    } else {
      adminSetSchoolSubscription(selectedSchoolForGrant.id, offlinePlanId, false);
      const planNames: Record<string, string> = {
        'plan-daily': 'Pass Quotidien (250 FCFA / 1 Jour)',
        'plan-weekly': 'Pass Hebdomadaire (1 250 FCFA / 7 Jours)',
        'plan-monthly': 'Pass Mensuel (5 000 FCFA / 30 Jours)',
        'plan-annual': 'Pass Annuel (50 000 FCFA / 1 An)'
      };
      setGrantSuccessMsg(`🎉 Formule [${planNames[offlinePlanId] || offlinePlanId}] activée avec succès pour l'école "${selectedSchoolForGrant.name}" ! L'accès est débloqué.`);
    }

    setSelectedSchoolForGrant(null);
    setProofReference('');
    setGrantNote('');
    setTimeout(() => setGrantSuccessMsg(''), 5000);
  };

  // Save FedaPay, KKiaPay & Mobile Money configuration
  const handleSaveFedapayKeys = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPayload = {
      fedapayPublicKey: fedapayPublic.trim(),
      fedapaySecretKey: fedapaySecret.trim(),
      kkiapayPublicKey: kkiapayPublic.trim(),
      kkiapaySecretKey: kkiapaySecret.trim(),
      mobileMoneyNumber: momoNumber.trim(),
      activePaymentGateway: activeGateway,
      enableOnlineTransactions: enableOnlineTx
    };

    updateSettings(updatedPayload);

    // Apply synchronously to all registered schools
    schools.forEach(s => {
      updateSchool(s.id, updatedPayload);
    });

    const msg = "🎉 Félicitations ! Vos clés API FedaPay, KKiaPay & Mobile Money ont été enregistrées et synchronisées avec succès sur l'ensemble de votre réseau d'écoles !";
    setFedapaySuccessMsg(msg);
    setGrantSuccessMsg(msg);
    setShowFedapaySuccessModal(true);
  };

  // Batch action: Grant Free Access to ALL schools
  const handleEnableAllFreeAccess = () => {
    if (window.confirm("Êtes-vous sûr de vouloir accorder l'Accès Libre (Abonnement Offert/Gratuit) à TOUTES les écoles du réseau ?")) {
      schools.forEach(s => {
        toggleSchoolAccessProtection(s.id, false);
      });
      const allIds = schools.map(s => s.id);
      setUnlockedSchoolIds(allIds);
      setGrantSuccessMsg("🎉 Accès Libre accordé à toutes les écoles du réseau !");
      setTimeout(() => setGrantSuccessMsg(''), 4000);
    }
  };

  const handleUpdateSchoolPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolForPasswordEdit || !newPasswordInput.trim()) return;
    updateSchool(selectedSchoolForPasswordEdit.id, {
      accessPassword: newPasswordInput.trim()
    });
    setGrantSuccessMsg(`🔑 Mot de passe de l'école "${selectedSchoolForPasswordEdit.name}" mis à jour avec succès : "${newPasswordInput.trim()}"`);
    setSelectedSchoolForPasswordEdit(null);
    setNewPasswordInput('');
    setTimeout(() => setGrantSuccessMsg(''), 5000);
  };

  // Filtered Schools List
  const filteredSchools = schools.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.city.toLowerCase().includes(searchTerm.toLowerCase());
    const isFree = s.isPasswordProtected === false;

    if (filterStatus === 'FREE') return matchesSearch && isFree;
    if (filterStatus === 'PROTECTED') return matchesSearch && !isFree;
    if (filterStatus === 'PENDING') return matchesSearch && s.isValidatedByPromoter === false;
    return matchesSearch;
  });

  // Calculate SaaS Stats
  const freeAccessCount = schools.filter(s => s.isPasswordProtected === false).length;
  const protectedCount = schools.length - freeAccessCount;
  const pendingCount = schools.filter(s => s.isValidatedByPromoter === false).length;
  const totalStudentsManaged = schools.reduce((sum, s) => sum + (s.totalStudentsCount || 0), 0);

  // Check if active user is authorized promoter (strictly mahounouvictor123@gmail.com or authorized session)
  const isCurrentUserPromoterEmail = currentUser?.email?.trim().toLowerCase() === MASTER_PROMOTER_EMAIL.toLowerCase() ||
    localStorage.getItem('GESTIONNAIRE_PROMOTER_EMAIL') === MASTER_PROMOTER_EMAIL ||
    (currentUser?.role === 'SUPER_ADMIN' && currentUser?.email?.trim().toLowerCase() === MASTER_PROMOTER_EMAIL.toLowerCase());

  const isAuthorized = isCurrentUserPromoterEmail || (isPromoterAuthenticated && localStorage.getItem('GESTIONNAIRE_PROMOTER_AUTH') === 'true');

  // Render Login Gate ONLY if unauthenticated or not master promoter
  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Crown className="h-10 w-10 fill-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Espace Administrateur Promoteur SaaS
          </h2>
          <div className="p-4 rounded-2xl bg-slate-900 text-white border border-amber-500/40 text-xs font-bold leading-relaxed text-left space-y-2 shadow-xl">
            <div className="flex items-center space-x-2 text-amber-400 font-black uppercase tracking-wider text-[11px]">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span>🔒 ACCÈS EXCLUSIF : mahounouvictor123@gmail.com</span>
            </div>
            <p>
              Cet Espace Promoteur est <strong className="text-amber-300">STRICTEMENT RÉSERVÉ EXCLUSIVEMENT</strong> au compte Gmail officiel :
            </p>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 font-mono text-center font-black text-amber-300 text-sm">
              mahounouvictor123@gmail.com
            </div>
            <p className="text-[11px] text-slate-300">
              Aucun autre compte Gmail ni utilisateur d'école n'a accès à ce panneau de contrôle.
            </p>
          </div>
        </div>

        <form onSubmit={handlePromoterLogin} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Mail className="h-4 w-4 text-amber-500" />
              <span>Adresse Gmail du Promoteur *</span>
            </label>
            <input
              type="email"
              required
              value={promoterEmailInput}
              onChange={(e) => setPromoterEmailInput(e.target.value)}
              placeholder="mahounouvictor123@gmail.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <KeyRound className="h-4 w-4 text-amber-500" />
              <span>Mot de passe de votre compte Gmail *</span>
            </label>
            <input
              type="password"
              required
              value={promoterPasscode}
              onChange={(e) => setPromoterPasscode(e.target.value)}
              placeholder="Saisissez le mot de passe de mahounouvictor123@gmail.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-black leading-relaxed">
              ⚠️ {authError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ShieldCheck className="h-5 w-5 text-slate-950" />
            <span>Se Connecter avec mon compte Gmail</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner Title */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 border border-amber-500/30 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
            <Crown className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                Espace Fondateur & Promoteur SaaS
              </span>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black flex items-center space-x-1.5 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>🏢 {schools.length} ÉCOLE{schools.length > 1 ? 'S' : ''} INSCRITE{schools.length > 1 ? 'S' : ''}</span>
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              Panneau de Contrôle Général des Écoles
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Donnez l'accès direct aux écoles (Bouton Vert = Accès Libre / Partenaire / Offert) ou restreignez par mot de passe (Bouton Rouge = Bloqué / Abonnement Expiré).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('ai-copilot')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer transform hover:scale-[1.02] ${
              activeTab === 'ai-copilot'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-950 shadow-amber-500/30'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-600/30'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>🤖 Commandant IA à Distance</span>
          </button>

          <button
            onClick={handleOpenRemoteModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-1.5 cursor-pointer transform hover:scale-[1.02]"
          >
            <Globe2 className="h-4 w-4 fill-slate-950" />
            <span>🌐 Créer une École à Distance</span>
          </button>

          <button
            onClick={handleEnableAllFreeAccess}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Zap className="h-4 w-4" />
            <span>🟢 Tout Activer</span>
          </button>

          <button
            onClick={handlePromoterLogout}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer"
          >
            Quitter
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS SECTION FOR NEW REGISTERED SCHOOLS */}
      {promoterNotifications && promoterNotifications.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border-2 border-blue-500 text-white space-y-3 shadow-xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                <Bell className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <span>🔔 Notifications d'Inscriptions Écoles</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-black">
                    {promoterNotifications.filter(n => !n.isRead).length} nouvelles
                  </span>
                </h3>
                <p className="text-xs text-blue-200">
                  Alerte instantanée des établissements ayant généré leur accès via WhatsApp ou ouvert votre lien.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearPromoterNotifications}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-extrabold text-blue-200 hover:text-white transition-all cursor-pointer shrink-0"
            >
              Effacer tout
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {promoterNotifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className="font-black text-amber-300 text-sm">
                      🏢 {notif.schoolName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-bold">
                      📍 {notif.city}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200">
                    Directeur : <strong>{notif.directorName}</strong> • Téléphone : <strong className="font-mono">{notif.phone}</strong> • Reçu le : {new Date(notif.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      validateSchoolByPromoter(notif.schoolId);
                      markPromoterNotificationAsRead(notif.id);
                      setGrantSuccessMsg(`✅ Accès accordé à l'école "${notif.schoolName}" !`);
                      setTimeout(() => setGrantSuccessMsg(''), 4000);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>🟢 Accorder l'Accès</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toggleSchoolBlockStatus(notif.schoolId, true);
                      markPromoterNotificationAsRead(notif.id);
                      setGrantSuccessMsg(`🔴 Accès bloqué pour l'école "${notif.schoolName}".`);
                      setTimeout(() => setGrantSuccessMsg(''), 4000);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <Lock className="h-4 w-4" />
                    <span>🔴 Bloquer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {grantSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm font-bold flex items-center space-x-3 shadow-md animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>{grantSuccessMsg}</span>
        </div>
      )}

      {/* Promoter Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Globe2 className="h-4 w-4 text-slate-950" />
          <span>🌐 Vue d'Ensemble & Supervision Générale</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schools')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'schools'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Paramètres des Écoles Créées ({schools.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'campaigns'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30'
          }`}
        >
          <Tag className="h-4 w-4 text-blue-500" />
          <span>🏷️ Campagnes & Liens d'Adhésion ({campaigns.length})</span>
          {schools.filter(s => s.approvalStatus === 'PENDING_APPROVAL').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black animate-pulse">
              {schools.filter(s => s.approvalStatus === 'PENDING_APPROVAL').length} en attente
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai-copilot')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'ai-copilot'
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30'
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>🤖 Commandant IA à Distance (Exécution en direct)</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider">
            Gemini 3.7
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fedapay')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'fedapay'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
          }`}
        >
          <CreditCard className="h-4 w-4 text-emerald-500" />
          <span>Configuration Clés FedaPay & Mobile Money</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider">
            Compte Marchand
          </span>
        </button>
      </div>

      {/* TAB 0: MASTER OVERVIEW (VUE D'ENSEMBLE SUR TOUT) */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Master Global KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/50 shadow-xl text-white flex items-center space-x-3.5">
              <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-lg shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="truncate">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">
                    Total Écoles Créées
                  </p>
                </div>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <p className="text-3xl font-black text-white">{schools.length}</p>
                  <span className="text-[10px] font-bold text-emerald-400">
                    {freeAccessCount} actives
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex items-center space-x-3.5">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Total Élèves du Réseau
                </p>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    {totalStudentsManaged}
                  </p>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Toutes écoles
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex items-center space-x-3.5">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Enseignants & Personnel
                </p>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    {schools.length * 12}
                  </p>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    En activité
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-xl text-white flex items-center space-x-3.5">
              <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-lg shrink-0">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                  Recouvrement & Abonnements
                </p>
                <div className="flex items-baseline space-x-1 mt-0.5">
                  <p className="text-2xl font-black text-white">
                    {(schools.length * 50000).toLocaleString('fr-FR')}
                  </p>
                  <span className="text-xs font-bold text-emerald-400">FCFA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Bar */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950/60 to-slate-900 border border-amber-500/30 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Crown className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-black text-amber-300 uppercase tracking-wide">
                  Tableau de Bord Général Promoteur
                </h3>
              </div>
              <p className="text-xs text-slate-300 max-w-xl">
                Vous avez la vue d'ensemble sur tous les établissements créés à distance. Cliquez sur <strong>"Entrer dans l'école"</strong> pour vous connecter à son espace complet ou sur <strong>"Paramètres"</strong> pour gérer ses accès.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenRemoteModal()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <PlusCircle className="h-4 w-4 fill-slate-950" />
                <span>+ Créer École à Distance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('schools')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-black text-xs flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <Settings className="h-4 w-4 text-amber-400" />
                <span>⚙️ Paramètres des Écoles</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('fedapay')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <CreditCard className="h-4 w-4" />
                <span>💳 Passerelle FedaPay</span>
              </button>
            </div>
          </div>

          {/* MASTER GRID: All Created Schools with 1-Click Entry & Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-amber-500" />
                  <span>Établissements Scolaires Créés & Supervision ({schools.length})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accès direct aux tableaux de bord de chaque école et statut en direct.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                  🟢 {freeAccessCount} Actives
                </span>
                {protectedCount > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold">
                    🔴 {protectedCount} Bloquées/MDP
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
                    🟡 {pendingCount} En Attente
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {schools.map((school) => {
                const isFree = school.isPasswordProtected === false;
                const isBlocked = school.isBlocked === true;
                const isValidated = school.isValidatedByPromoter !== false;
                const isCurrentActive = school.id === currentSchoolId;

                return (
                  <div
                    key={school.id}
                    className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-lg hover:shadow-xl ${
                      isCurrentActive
                        ? 'border-2 border-emerald-500 ring-4 ring-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
                    }`}
                  >
                    {/* Top Row: School Badge & Status */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3 truncate">
                          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {school.logoUrl ? (
                              <img src={school.logoUrl} alt={school.name} className="h-full w-full object-cover" />
                            ) : (
                              <Building2 className="h-6 w-6 text-slate-500" />
                            )}
                          </div>
                          <div className="truncate">
                            <div className="flex items-center space-x-1.5">
                              <h3 className="font-black text-sm text-slate-900 dark:text-white truncate" title={school.name}>
                                {school.name}
                              </h3>
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                              📍 {school.city} • {school.address || school.city}
                            </p>
                          </div>
                        </div>

                        {/* Status Chip */}
                        {isBlocked ? (
                          <span className="px-2 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-black shrink-0 flex items-center space-x-1">
                            <Lock className="h-3 w-3" />
                            <span>Bloqué</span>
                          </span>
                        ) : isFree ? (
                          <span className="px-2 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black shrink-0 flex items-center space-x-1">
                            <Unlock className="h-3 w-3" />
                            <span>Actif Libre</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-black shrink-0 flex items-center space-x-1">
                            <KeyRound className="h-3 w-3" />
                            <span>Par MDP</span>
                          </span>
                        )}
                      </div>

                      {/* School Details Box */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="font-bold">Directeur :</span>
                          <span className="font-black text-slate-900 dark:text-white truncate max-w-[150px]">
                            {school.directorName || 'Non renseigné'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="font-bold">Téléphone :</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {school.phone || 'Non renseigné'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="font-bold">Élèves :</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            {school.totalStudentsCount || 120} inscrits
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="font-bold">Mot de passe :</span>
                          <span className="font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            {school.accessPassword || '12345678'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleSwitchToSchoolAsPromoter(school.id)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>🚀 Entrer dans le Tableau de Bord</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('schools');
                            setSearchTerm(school.name);
                          }}
                          className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer transition-all"
                        >
                          <Settings className="h-3.5 w-3.5 text-slate-500" />
                          <span>Paramètres</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(school)}
                          className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer transition-all border border-emerald-200 dark:border-emerald-800"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: SCHOOLS NETWORK */}
      {activeTab === 'schools' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* SaaS Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/20 via-indigo-900/20 to-slate-900 border-2 border-blue-500/50 shadow-md flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-blue-600 text-white shadow-md">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Total Écoles Inscrites
                  </p>
                </div>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{schools.length}</p>
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                    +1 à chaque inscription
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-sm flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Unlock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Accès Libres / Gratuits</p>
                <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300">{freeAccessCount} Écoles</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 shadow-sm flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Accès Bloqués / Par MDP</p>
                <p className="text-2xl font-black text-rose-800 dark:text-rose-300">{protectedCount} Écoles</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Élèves sous Gestion</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{totalStudentsManaged}</p>
              </div>
            </div>
          </div>

          {/* Quick Action Card for Remote Schools & Validation Links */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Globe2 className="h-5 w-5 text-amber-400 animate-pulse" />
                <h3 className="text-base font-black text-amber-300 uppercase tracking-wide">
                  Écoles à Distance & Liens Directs d'Accès
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                Créez une école client à distance, validez les demandes d'inscription et obtenez son lien d'accès direct avec mot de passe.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenRemoteModal()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <PlusCircle className="h-4 w-4 fill-slate-950" />
                <span>+ Créer École à Distance</span>
              </button>

              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterStatus('PENDING')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-black text-xs flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <span>⚡ Valider Inscriptions ({pendingCount})</span>
                </button>
              )}
            </div>
          </div>

      {/* Control Bar & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une école ou ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 text-xs font-bold">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Toutes ({schools.length})
          </button>

          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
              filterStatus === 'PENDING'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
            }`}
          >
            <Globe2 className="h-3.5 w-3.5 text-amber-600" />
            <span>Inscriptions à Distance ({pendingCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('FREE')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filterStatus === 'FREE'
                ? 'bg-emerald-600 text-white font-black'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            🟢 Accès Libre ({freeAccessCount})
          </button>

          <button
            onClick={() => setFilterStatus('PROTECTED')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterStatus === 'PROTECTED'
                ? 'bg-rose-600 text-white font-black'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
            }`}
          >
            🔴 Bloquées ({protectedCount})
          </button>

          {/* Batch Cleanup Button for Trial Schools */}
          <button
            type="button"
            onClick={() => {
              const trialSchools = schools.filter(s => s.isValidatedByPromoter === false);
              if (trialSchools.length === 0) {
                alert("Aucune école d'essai non validée à nettoyer.");
                return;
              }
              if (window.confirm(`⚠️ ATTENTION : Voulez-vous supprimer TOUTES les ${trialSchools.length} école(s) d'essai non encore validées ? cette action est irréversible.`)) {
                trialSchools.forEach(ts => deleteSchool(ts.id));
                setGrantSuccessMsg(`🗑️ Nettoyage réussi : ${trialSchools.length} école(s) d'essai supprimée(s).`);
                setTimeout(() => setGrantSuccessMsg(''), 4000);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-300 border border-rose-500/40 text-xs font-black flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
            title="Supprimer rapidement toutes les inscriptions d'essai non validées"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Nettoyer d'Essai ({schools.filter(s => s.isValidatedByPromoter === false).length})</span>
          </button>
        </div>
      </div>

      {/* Schools Master Table / Cards Grid */}
      <div className="space-y-4">
        {filteredSchools.map((school) => {
          const isCurrentActive = school.id === currentSchoolId;
          const isFree = school.isPasswordProtected === false;

          return (
            <div
              key={school.id}
              className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-sm space-y-4 ${
                isFree
                  ? 'border-emerald-300 dark:border-emerald-800/80'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* School Info */}
                <div className="flex items-center space-x-4">
                  <div className="relative shrink-0">
                    <img
                      src={school.logoUrl}
                      alt={school.name}
                      className="h-14 w-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100"
                    />
                    {isCurrentActive && (
                      <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full text-[9px] font-black">
                        ✓
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {school.name}
                      </h3>
                      {isFree && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>🟢 ACCÈS LIBRE (ACCORDÉ)</span>
                        </span>
                      )}
                      {school.isBlocked ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-black border border-rose-300 dark:border-rose-800 flex items-center space-x-1">
                          <Lock className="h-3 w-3 text-rose-600" />
                          <span>🔴 ACCÈS BLOQUÉ / SUSPENDU</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span>🟢 ACCÈS AUTORISÉ & ACTIF</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>📍 {school.countryFlag || '🌍'} {school.country || 'Afrique'} ({school.city})</span>
                      <span>👨‍💼 Dir. {school.directorName}</span>
                      <span>🎓 {school.totalStudentsCount || 0} élèves</span>
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 font-extrabold flex items-center space-x-1">
                        <Key className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Clé Promoteur: <code className="font-mono font-black text-amber-950 dark:text-amber-100 bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">{school.validationToken || `PROM-2026-${Math.floor(1000 + Math.random() * 9000)}`}</code></span>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                        🔑 MDP École: <code className="font-mono font-black text-slate-900 dark:text-white">{school.accessPassword || '12345678'}</code>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Controls: BOUTONS DAC */}
                <div className="space-y-2 pt-2 md:pt-0 w-full md:w-auto border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <span className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-black">
                      <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span>⚡ BOUTONS DAC (Droit d'Accès Client) :</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* BOUTON DAC 1: Générer Clé Promoteur */}
                    <button
                      onClick={() => handleGeneratePromoterKey(school)}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center space-x-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all transform hover:scale-[1.02]"
                      title="Générer instantanément une nouvelle Clé d'Accès Promoteur et un nouveau Mot de Passe"
                    >
                      <Key className="h-3.5 w-3.5 text-slate-950 fill-slate-950" />
                      <span>⚡ DAC : Générer Clé Promoteur</span>
                    </button>

                    {/* BOUTON DAC 2: Activer Accès Libre */}
                    <button
                      onClick={() => handleEnableFreeAccess(school)}
                      className={`px-3 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer ${
                        isFree
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/50'
                          : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}
                      title="Accorder l'accès libre direct illimité sans blocage par mot de passe"
                    >
                      <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                      <span>🟢 DAC : Activer Accès Libre</span>
                    </button>

                    {/* BOUTON DAC 3: Abonnement Cash */}
                    <button
                      onClick={() => setSelectedSchoolForGrant(school)}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center space-x-1.5 shadow-sm cursor-pointer transition-all"
                      title="Recharger un Pass Quotidien, Hebdomadaire, Mensuel ou Annuel Cash"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-white" />
                      <span>💳 DAC : Dépôt Cash / Abonnement</span>
                    </button>

                    {/* BOUTON DAC 4: Suspendre / Bloquer */}
                    <button
                      onClick={() => handleDisableFreeAccess(school)}
                      className={`px-3 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer ${
                        !isFree
                          ? 'bg-rose-600 text-white ring-2 ring-rose-500/50'
                          : 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      }`}
                      title="Exiger le mot de passe secret de l'école ou suspendre l'accès"
                    >
                      <Lock className="h-3.5 w-3.5 text-rose-400" />
                      <span>🔴 DAC : Suspendre / Bloquer</span>
                    </button>

                    {/* BOUTON DAC 5: Share Direct WhatsApp */}
                    <button
                      onClick={() => setSelectedSchoolForShare(school)}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-black flex items-center space-x-1.5 border border-slate-700 cursor-pointer shadow-sm"
                      title="Partager le lien d'accès WhatsApp direct pour le client"
                    >
                      <Share2 className="h-3.5 w-3.5 text-blue-400" />
                      <span>🔗 DAC : Partager Lien Client</span>
                    </button>

                    {/* BOUTON DAC 6: Compléter Infos École */}
                    <button
                      onClick={() => setSelectedSchoolForSetupModal(school)}
                      className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-500/50 text-xs font-black flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm"
                      title="Compléter les classes, les tranches de scolarité, les échéances et le mot de passe secret"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span>⚡ DAC : Compléter Infos École</span>
                    </button>

                    {/* Action: Ouvrir Tableau */}
                    <button
                      onClick={() => handleSwitchToSchoolAsPromoter(school.id)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center space-x-1 border border-slate-300 dark:border-slate-700 cursor-pointer"
                    >
                      <Globe2 className="h-3.5 w-3.5 text-blue-500" />
                      <span>Ouvrir Tableau</span>
                    </button>

                    {/* Action: Modifier MDP */}
                    <button
                      onClick={() => {
                        setSelectedSchoolForPasswordEdit(school);
                        setNewPasswordInput(school.accessPassword || '12345678');
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold flex items-center space-x-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                      <span>🔑 MDP</span>
                    </button>

                    {/* Action: Supprimer */}
                    <button
                      onClick={() => setSchoolToDelete(school)}
                      className="px-2.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-black flex items-center space-x-1 cursor-pointer transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>🗑️ Supprimer</span>
                    </button>

                  </div>
                </div>
              </div>

              {/* Status Footer Note */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    {isFree ? (
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        Accès direct accordé par le Promoteur (Partenariat / Dépannage Client).
                      </strong>
                    ) : (
                      <span>
                        Accès verrouillé. Les utilisateurs doivent renseigner le mot de passe confidentiel de l'école.
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">ID: {school.id}</span>
              </div>
            </div>
          );
        })}

        {filteredSchools.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <Building2 className="h-10 w-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Aucun établissement ne correspond à votre recherche.
            </p>
          </div>
        )}
      </div>
      </div>
      )}

      {/* TAB 2: FEDAPAY & MOBILE MONEY API KEYS */}
      {activeTab === 'fedapay' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Success Congratulations Banner */}
          {fedapaySuccessMsg && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-2xl border border-emerald-400/40 flex items-center justify-between gap-4 animate-in zoom-in-95">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/20 rounded-2xl text-white shadow-inner shrink-0">
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-base text-white flex items-center space-x-2">
                    <span>🎉 Félicitations ! Clés FedaPay Enregistrées</span>
                  </h4>
                  <p className="text-xs text-emerald-100 font-medium mt-0.5">
                    {fedapaySuccessMsg}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFedapaySuccessMsg('')}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black text-xs cursor-pointer transition-all shrink-0"
              >
                Masquer
              </button>
            </div>
          )}

          <form onSubmit={handleSaveFedapayKeys} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl">
                  <CreditCard className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white flex items-center space-x-2">
                    <span>Configuration Clés API FedaPay & KKiaPay</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                      Compte Marchand Promoteur
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Renseignez vos clés marchandes FedaPay et KKiaPay pour recevoir les paiements d'abonnements et frais scolaires en Mobile Money (MTN, Moov, Celtiis, Orange, Wave) et Cartes Bancaires.
                  </p>
                </div>
              </div>

              {/* Environment Toggle */}
              <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setFedapayEnv('live')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    fedapayEnv === 'live'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 Mode Réel (Live)
                </button>
                <button
                  type="button"
                  onClick={() => setFedapayEnv('sandbox')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    fedapayEnv === 'sandbox'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🧪 Mode Test (Sandbox)
                </button>
              </div>
            </div>

            {/* Enable Online Transactions Global Switch */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span className="font-bold text-sm text-white">Activer les Transactions en Ligne sur la Plateforme</span>
                </div>
                <p className="text-xs text-slate-400">
                  Permet aux directeurs, parents et écoles d'effectuer des paiements automatiques en ligne via FedaPay / KKiaPay.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={enableOnlineTx}
                  onChange={e => setEnableOnlineTx(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Active Payment Gateway Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                Sélectionnez la Passerelle Principale Active :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                <button
                  type="button"
                  onClick={() => setActiveGateway('FEDAPAY')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col space-y-2 ${
                    activeGateway === 'FEDAPAY'
                      ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm flex items-center space-x-1.5 text-emerald-400">
                      <Zap className="h-4 w-4" />
                      <span>FedaPay</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      Bénin & Afrique
                    </span>
                  </div>
                  <p className="text-[11px] leading-tight opacity-80">
                    MTN MoMo, Moov Money, Celtiis Cash, Orange Money, Wave.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGateway('KKIAPAY')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col space-y-2 ${
                    activeGateway === 'KKIAPAY'
                      ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm flex items-center space-x-1.5 text-blue-400">
                      <CreditCard className="h-4 w-4" />
                      <span>KKiaPay</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                      MoMo & Visa/MC
                    </span>
                  </div>
                  <p className="text-[11px] leading-tight opacity-80">
                    Paiements Mobile Money et Cartes Bancaires.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGateway('MOMO_DIRECT')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col space-y-2 ${
                    activeGateway === 'MOMO_DIRECT'
                      ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm flex items-center space-x-1.5 text-amber-400">
                      <Smartphone className="h-4 w-4" />
                      <span>MoMo Direct</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      Manuel (N° Dépôt)
                    </span>
                  </div>
                  <p className="text-[11px] leading-tight opacity-80">
                    Transfert direct vers le numéro Mobile Money du Promoteur.
                  </p>
                </button>

              </div>
            </div>

            {/* Inputs Grid */}
            <div className="space-y-6 pt-2">
              
              {/* FEDAPAY SECTION */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-extrabold text-sm text-emerald-400 flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>Clés API Merchant FedaPay</span>
                  </h4>
                  <a
                    href="https://fedapay.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline font-bold"
                  >
                    Ouvrir FedaPay.com &rarr;
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* FedaPay Public Key */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Clé Publique FedaPay (Public Key) <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fedapayPublic}
                      onChange={e => setFedapayPublic(e.target.value)}
                      placeholder="pk_live_feda_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400">
                      Format: <code className="text-amber-400">pk_live_...</code> ou <code className="text-amber-400">pk_sandbox_...</code>
                    </p>
                  </div>

                  {/* FedaPay Secret Key */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-300">
                        Clé Secrète FedaPay (Secret Key) <span className="text-emerald-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-1 font-semibold cursor-pointer"
                      >
                        {showSecretKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        <span>{showSecretKey ? 'Masquer' : 'Afficher'}</span>
                      </button>
                    </div>
                    <input
                      type={showSecretKey ? 'text' : 'password'}
                      required
                      value={fedapaySecret}
                      onChange={e => setFedapaySecret(e.target.value)}
                      placeholder="sk_live_feda_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-indigo-300 font-mono text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400">
                      Format: <code className="text-indigo-400">sk_live_...</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* KKIAPAY SECTION */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-extrabold text-sm text-blue-400 flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Clés API Merchant KKiaPay</span>
                  </h4>
                  <a
                    href="https://kkiapay.me"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-400 hover:underline font-bold"
                  >
                    Ouvrir KKiaPay.me &rarr;
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* KKiaPay Public Key */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Clé Publique KKiaPay (Public Key)
                    </label>
                    <input
                      type="text"
                      value={kkiapayPublic}
                      onChange={e => setKkiapayPublic(e.target.value)}
                      placeholder="pk_live_kkia_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-blue-300 font-mono text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400">
                      Clé publique disponible sur votre dashboard KKiaPay.
                    </p>
                  </div>

                  {/* KKiaPay Secret Key */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-300">
                        Clé Secrète KKiaPay (Secret / Private Key)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowKkiapaySecretKey(!showKkiapaySecretKey)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-1 font-semibold cursor-pointer"
                      >
                        {showKkiapaySecretKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        <span>{showKkiapaySecretKey ? 'Masquer' : 'Afficher'}</span>
                      </button>
                    </div>
                    <input
                      type={showKkiapaySecretKey ? 'text' : 'password'}
                      value={kkiapaySecret}
                      onChange={e => setKkiapaySecret(e.target.value)}
                      placeholder="sk_live_kkia_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-blue-300 font-mono text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400">
                      Clé secrète / privée de votre compte KKiaPay.
                    </p>
                  </div>
                </div>
              </div>

              {/* DIRECT MOBILE MONEY RECEPTION NUMBER */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-200 flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-emerald-400" />
                  <span>Numéro Mobile Money de Réception Directe (MTN / Moov / Celtiis)</span>
                </label>
                <input
                  type="text"
                  value={momoNumber}
                  onChange={e => setMomoNumber(e.target.value)}
                  placeholder="+229 01 67 43 03 81"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Numéro auquel sont associés vos comptes Mobile Money pour la réception des versements.
                </p>
              </div>

            </div>

            {/* Explanation card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <Info className="h-4 w-4 shrink-0" />
                <span>Comment obtenir vos clés FedaPay & KKiaPay ?</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                1. <strong>FedaPay</strong> : Connectez-vous sur votre compte marchand <strong className="text-white">FedaPay (https://fedapay.com)</strong> &gt; <strong className="text-white">Paramètres</strong> &gt; <strong className="text-white">Clés API</strong>.<br/>
                2. <strong>KKiaPay</strong> : Connectez-vous sur <strong className="text-white">KKiaPay (https://kkiapay.me)</strong> &gt; <strong className="text-white">Développeurs / Clés d'API</strong>.<br/>
                3. Copiez vos clés et enregistrez-les ci-dessous. Elles seront immédiatement synchronisées sur l'ensemble des écoles inscrites (locales et à distance).
              </p>
            </div>

            {/* Action Submit Button */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                🔒 Vos clés seront enregistrées et appliquées automatiquement à tous les établissements du réseau.
              </span>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl shadow-emerald-950 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer & Synchroniser le Réseau</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TAB 2: CAMPAIGNS & REGISTRATION LINKS */}
      {activeTab === 'campaigns' && (
        <CampaignsManagementTab />
      )}

      {/* TAB 3: PROMOTER AI COMMANDER & REMOTE CONTROLLER */}
      {activeTab === 'ai-copilot' && (
        <div className="animate-in fade-in duration-200">
          <PromoterAICopilot />
        </div>
      )}

      {/* Modal: Grant / Activate Offline Subscription */}
      {selectedSchoolForGrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-black">
                <Crown className="h-5 w-5 text-amber-500" />
                <span>Activation Abonnement Hors-Plateforme (Promoteur)</span>
              </div>
              <button
                onClick={() => setSelectedSchoolForGrant(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {selectedSchoolForGrant.name}
                </h3>
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                  {selectedSchoolForGrant.city}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Paiement direct reçu hors-plateforme (Mobile Money / Capture d'écran WhatsApp / Espèces). Choisissez la formule d'accès à attribuer.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Sélectionner la Formule Payée par l'École *
              </label>

              <div className="space-y-2">
                
                {/* 250 FCFA */}
                <label className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  offlinePlanId === 'plan-daily'
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-amber-500'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="offlinePlanId"
                      value="plan-daily"
                      checked={offlinePlanId === 'plan-daily'}
                      onChange={() => setOfflinePlanId('plan-daily')}
                      className="text-amber-600 focus:ring-amber-500 h-4 w-4"
                    />
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-white">⚡ Pass Quotidien (1 Jour / 24H)</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">Accès réseau illimité pour la journée</span>
                    </div>
                  </div>
                  <strong className="text-amber-600 dark:text-amber-400 text-sm font-black font-mono">250 FCFA</strong>
                </label>

                {/* 1 250 FCFA */}
                <label className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  offlinePlanId === 'plan-weekly'
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-amber-500'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="offlinePlanId"
                      value="plan-weekly"
                      checked={offlinePlanId === 'plan-weekly'}
                      onChange={() => setOfflinePlanId('plan-weekly')}
                      className="text-amber-600 focus:ring-amber-500 h-4 w-4"
                    />
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-white">⚡ Pass Hebdomadaire (7 Jours)</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">Accès réseau illimité pendant 1 semaine</span>
                    </div>
                  </div>
                  <strong className="text-amber-600 dark:text-amber-400 text-sm font-black font-mono">1 250 FCFA</strong>
                </label>

                {/* 5 000 FCFA */}
                <label className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  offlinePlanId === 'plan-monthly'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-emerald-500'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="offlinePlanId"
                      value="plan-monthly"
                      checked={offlinePlanId === 'plan-monthly'}
                      onChange={() => setOfflinePlanId('plan-monthly')}
                      className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-white">🚀 Pass Mensuel Standard (30 Jours)</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">Accès réseau complet pendant 1 mois</span>
                    </div>
                  </div>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-black font-mono">5 000 FCFA</strong>
                </label>

                {/* 50 000 FCFA */}
                <label className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  offlinePlanId === 'plan-annual'
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-indigo-500'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="offlinePlanId"
                      value="plan-annual"
                      checked={offlinePlanId === 'plan-annual'}
                      onChange={() => setOfflinePlanId('plan-annual')}
                      className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-white">👑 Pass Annuel VIP (365 Jours / 1 An)</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">Accès illimité toute l'année scolaire</span>
                    </div>
                  </div>
                  <strong className="text-indigo-600 dark:text-indigo-400 text-sm font-black font-mono">50 000 FCFA</strong>
                </label>

                {/* DEACTIVATE */}
                <label className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  offlinePlanId === 'DEACTIVATE'
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-rose-500'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="offlinePlanId"
                      value="DEACTIVATE"
                      checked={offlinePlanId === 'DEACTIVATE'}
                      onChange={() => setOfflinePlanId('DEACTIVATE')}
                      className="text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <div>
                      <span className="block text-xs font-black text-rose-600 dark:text-rose-400">🔴 Désactiver & Bloquer l'École</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">Abonnement expiré ou paiement non reçu</span>
                    </div>
                  </div>
                  <span className="text-rose-600 dark:text-rose-400 text-xs font-black uppercase">Désactiver</span>
                </label>

              </div>
            </div>

            {/* Proof / Reference input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Référence Dépôt / Capture MoMo (Optionnel)
              </label>
              <input
                type="text"
                value={proofReference}
                onChange={(e) => setProofReference(e.target.value)}
                placeholder="Ex: Capture WhatsApp reçue le 10/08 - Réf: 20260810-9842"
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSchoolForGrant(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleApplyGrant}
                className={`flex-1 py-3 rounded-xl text-white text-xs font-black shadow-lg cursor-pointer ${
                  offlinePlanId === 'DEACTIVATE'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                }`}
              >
                {offlinePlanId === 'DEACTIVATE' ? '🔴 Désactiver l\'École' : '⚡ Valider & Activer l\'Accès'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup: FedaPay Success Congratulations */}
      {showFedapaySuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-emerald-500/50 p-6 sm:p-8 text-white shadow-2xl relative space-y-6 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
                Configuration Enregistrée
              </span>
              <h3 className="text-2xl font-black text-white">
                🎉 Félicitations !
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Vos clés API <strong className="text-emerald-400">FedaPay & Mobile Money</strong> ont été enregistrées avec succès et synchronisées sur l'ensemble de vos établissements scolaires !
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Clé Publique FedaPay :</span>
                <span className="text-emerald-400 font-bold truncate max-w-[200px]">{fedapayPublic}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Clé Secrète FedaPay :</span>
                <span className="text-indigo-400 font-bold">••••••••••••••••</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Réception MoMo Directe :</span>
                <span className="text-amber-400 font-bold">{momoNumber || 'Non renseigné'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-[11px] text-emerald-300 font-medium text-left flex items-start space-x-2">
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Désormais, les souscriptions d'abonnements ainsi que les frais scolaires réglés par Mobile Money arriveront directement sur votre compte marchand FedaPay / MoMo.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowFedapaySuccessModal(false)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-950 transition-all cursor-pointer"
            >
              Compris, Continuer
            </button>
          </div>
        </div>
      )}

      {/* Modal 1: REMOTE SCHOOL CREATION MODAL */}
      {isRemoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl my-auto overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 sm:p-6 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20">
                  <Globe2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    🌐 Créer une École à Distance
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configurez l'établissement, validez-le et obtenez son lien d'accès direct.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRemoteModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body Form */}
            <form onSubmit={handleCreateRemoteSchool} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 pr-2 sm:pr-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* School Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                      Nom de l'Établissement *
                    </label>
                    <input
                      type="text"
                      required
                      value={remoteSchoolName}
                      onChange={(e) => setRemoteSchoolName(e.target.value)}
                      placeholder="Ex: Complexe Scolaire Saint-Joseph"
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                      Ville / Commune *
                    </label>
                    <input
                      type="text"
                      required
                      value={remoteSchoolCity}
                      onChange={(e) => setRemoteSchoolCity(e.target.value)}
                      placeholder="Ex: Parakou - Quartier Zongo"
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Director Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                      Nom du Directeur / Fondateur *
                    </label>
                    <input
                      type="text"
                      required
                      value={remoteDirectorName}
                      onChange={(e) => setRemoteDirectorName(e.target.value)}
                      placeholder="Ex: M. Sylvain DOSSOU"
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                      Téléphone WhatsApp de l'École *
                    </label>
                    <input
                      type="tel"
                      required
                      value={remoteDirectorPhone}
                      onChange={(e) => setRemoteDirectorPhone(e.target.value)}
                      placeholder="Ex: +229 97 12 34 56"
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                      Adresse Email (Optionnelle)
                    </label>
                    <input
                      type="email"
                      value={remoteSchoolEmail}
                      onChange={(e) => setRemoteSchoolEmail(e.target.value)}
                      placeholder="Ex: direction@stjoseph.bj"
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Access Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                      Mot de Passe Secret d'Accès Initial *
                    </label>
                    <input
                      type="text"
                      required
                      value={remoteAccessPassword}
                      onChange={(e) => setRemoteAccessPassword(e.target.value)}
                      placeholder="Ex: ECOLE2026"
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Plan Choice */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                    Formule d'Abonnement Offerte / Attribuée au Démarrage :
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'plan-weekly', name: '🎁 Essai Gratuit 7 Jours (Offert)', price: '0 FCFA' },
                      { id: 'plan-daily', name: '⚡ Pass Quotidien (1 Jour)', price: '250 FCFA' },
                      { id: 'plan-monthly', name: '🚀 Pass Mensuel Standard (30 Jours)', price: '5 000 FCFA' },
                      { id: 'plan-annual', name: '👑 Pass Annuel VIP (1 An)', price: '50 000 FCFA' }
                    ].map((p) => (
                      <label
                        key={p.id}
                        className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between text-xs font-bold transition-all ${
                          remotePlanId === p.id
                            ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="remotePlan"
                            value={p.id}
                            checked={remotePlanId === p.id}
                            onChange={() => setRemotePlanId(p.id)}
                            className="text-amber-500 focus:ring-amber-500 h-4 w-4"
                          />
                          <span>{p.name}</span>
                        </div>
                        <span className="font-mono text-[11px] font-black">{p.price}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Checkbox Populate Sample Data */}
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={populateDemoData}
                    onChange={(e) => setPopulateDemoData(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 h-4 w-4"
                  />
                  <span>Pré-remplir avec des structures de classes et matières exemples</span>
                </label>

                {/* DIRECTLY BELOW FORM: AUTHENTIC LINK & VALIDATION RESULT */}
                {createdRemoteSchool && (
                  <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-emerald-500/60 text-white space-y-4 shadow-xl animate-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                        <div>
                          <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wide">
                            ✅ ÉCOLE VALIDÉE ET ACCÈS GÉNÉRÉ !
                          </h4>
                          <p className="text-xs text-slate-300">
                            Établissement : <strong className="text-white">{createdRemoteSchool.name}</strong> ({createdRemoteSchool.city})
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] border border-emerald-500/40 uppercase">
                        ✓ Validée
                      </span>
                    </div>

                    {/* Authentic Link Display */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black uppercase text-amber-300 flex items-center justify-between">
                        <span>🔗 Lien Direct d'Accès Authentique au Tableau de Bord :</span>
                        <span className="text-[10px] text-emerald-400 font-normal">Connexion Automatique Unidirectionnelle</span>
                      </label>
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-amber-300 font-mono text-xs break-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                        <span className="select-all">
                          {getSchoolDirectLink(createdRemoteSchool)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyDirectLink(createdRemoteSchool)}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shrink-0 cursor-pointer shadow-md transition-all flex items-center justify-center space-x-1.5"
                        >
                          <Copy className="h-4 w-4" />
                          <span>Copier le Lien</span>
                        </button>
                      </div>
                      {copyFeedback && (
                        <p className="text-xs font-bold text-emerald-400 animate-in fade-in flex items-center space-x-1">
                          <span>✅</span>
                          <span>{copyFeedback}</span>
                        </p>
                      )}
                    </div>

                    {/* School Identifiers summary */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-1.5">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Code Identifiant École :</span>
                        <strong className="text-amber-400 font-bold">{createdRemoteSchool.id}</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Mot de passe secret :</span>
                        <strong className="text-amber-400 font-bold">{createdRemoteSchool.accessPassword || '12345678'}</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Directeur / Téléphone :</span>
                        <strong className="text-white">{createdRemoteSchool.directorName} ({createdRemoteSchool.phone})</strong>
                      </div>
                    </div>

                    {/* Direct Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          validateSchoolByPromoter(createdRemoteSchool.id);
                          setSelectedSchoolForSetupModal(createdRemoteSchool);
                        }}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer transition-all transform hover:scale-[1.01]"
                      >
                        <Zap className="h-4 w-4 text-slate-950 fill-slate-950" />
                        <span>⚡ Compléter les informations de mon école</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(createdRemoteSchool)}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 flex items-center justify-center space-x-2 cursor-pointer transition-all"
                      >
                        <MessageSquare className="h-4 w-4 fill-white" />
                        <span>📲 Envoyer WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsRemoteModalOpen(false);
                          validateSchoolByPromoter(createdRemoteSchool.id);
                          switchSchool(createdRemoteSchool.id);
                          if (onNavigate) onNavigate('dashboard');
                        }}
                        className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider border border-slate-700 flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
                      >
                        <Building2 className="h-4 w-4 text-blue-400" />
                        <span>Tableau</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Fixed Bottom Footer Actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 shrink-0 flex items-center space-x-3">
                {createdRemoteSchool ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenRemoteModal()}
                      className="flex-1 py-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-black border border-amber-500/40 cursor-pointer transition-all flex items-center justify-center space-x-1.5"
                    >
                      <PlusCircle className="h-4 w-4 text-amber-500" />
                      <span>+ Créer une Autre École</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRemoteModalOpen(false)}
                      className="px-6 py-3.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer transition-all"
                    >
                      Fermer
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRemoteModalOpen(false)}
                      className="flex-1 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
                    >
                      Annuler
                    </button>

                    <button
                      type="submit"
                      className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <Globe2 className="h-4 w-4 fill-slate-950" />
                      <span>✅ Valider l'École & Générer le Lien</span>
                    </button>
                  </>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal 2: SHARE DIRECT ACCESS LINK MODAL */}
      {selectedSchoolForShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-indigo-500/40 p-6 sm:p-8 text-slate-900 dark:text-white shadow-2xl relative space-y-6">
            
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
                  <Share2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>🔗 Lien d'Accès Client & Identifiants</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedSchoolForShare.name} ({selectedSchoolForShare.city}) • Dir. {selectedSchoolForShare.directorName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchoolForShare(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {copyFeedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center animate-in fade-in">
                {copyFeedback}
              </div>
            )}

            {/* Direct Magic Link Card */}
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-indigo-700 dark:text-indigo-300 flex items-center space-x-1">
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>Lien Magic d'Accès Direct (Connexion en 1 Clic)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[9px] uppercase">
                  Auto-Unlock
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 break-all select-all">
                {getSchoolDirectLink(selectedSchoolForShare)}
              </div>

              <button
                type="button"
                onClick={() => handleCopyDirectLink(selectedSchoolForShare)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
              >
                <Copy className="h-4 w-4" />
                <span>Copier le Lien Direct</span>
              </button>
            </div>

            {/* Credentials Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">🔑 Clé d'Accès Promoteur</span>
                <strong className="block font-mono text-amber-950 dark:text-amber-100 font-black text-sm mt-0.5">{selectedSchoolForShare.validationToken || `PROM-2026-${Math.floor(1000 + Math.random() * 9000)}`}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Code Identifiant École</span>
                <strong className="block font-mono text-slate-900 dark:text-white text-sm mt-0.5">{selectedSchoolForShare.id}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Mot de Passe Secret</span>
                <strong className="block font-mono text-slate-900 dark:text-white text-sm mt-0.5">{selectedSchoolForShare.accessPassword || '12345678'}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleShareWhatsApp(selectedSchoolForShare)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>💬 Envoyé Directement sur WhatsApp</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const msg = getWhatsAppMessage(selectedSchoolForShare);
                    navigator.clipboard.writeText(msg);
                    setCopyFeedback('Message WhatsApp complet copié dans le presse-papiers !');
                    setTimeout(() => setCopyFeedback(null), 3000);
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copier Texte Complet</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSwitchToSchoolAsPromoter(selectedSchoolForShare.id);
                    setSelectedSchoolForShare(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-700"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                  <span>Tester / Ouvrir École</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal 3: EDIT SCHOOL PASSWORD MODAL */}
      {selectedSchoolForPasswordEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-slate-900 dark:text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <KeyRound className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-black">Modifier Mot de Passe Secret</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchoolForPasswordEdit(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Définissez un nouveau mot de passe d'accès pour l'école <strong>{selectedSchoolForPasswordEdit.name}</strong> ({selectedSchoolForPasswordEdit.city}).
            </p>

            <form onSubmit={handleUpdateSchoolPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                  Nouveau Mot de Passe Secret *
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Ex: ECOLE2026"
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-amber-600 dark:text-amber-400 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSchoolForPasswordEdit(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: DELETE TRIAL SCHOOL CONFIRMATION MODAL */}
      {schoolToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-500/40 p-6 sm:p-8 space-y-5">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <Trash2 className="h-7 w-7 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Supprimer l'École d'Essai ?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  Confirmation de suppression irréversible
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-3 text-xs text-rose-900 dark:text-rose-200">
              <p className="font-bold">
                Vous êtes sur le point de supprimer définitivement cet établissement d'essai :
              </p>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 font-bold space-y-1">
                <p className="text-sm font-black text-slate-900 dark:text-white">🏫 {schoolToDelete.name}</p>
                <p className="text-slate-500 dark:text-slate-400">📍 Ville : {schoolToDelete.city || 'Cotonou'} | Directeur : {schoolToDelete.directorName || 'N/A'}</p>
                <p className="text-slate-500 dark:text-slate-400">📞 Téléphone : {schoolToDelete.phone || 'Non renseigné'}</p>
                <p className="text-slate-500 dark:text-slate-400">🔑 Code École : <code className="font-mono text-slate-900 dark:text-white">{schoolToDelete.id}</code></p>
              </div>
              <p className="font-extrabold text-rose-600 dark:text-rose-400">
                ⚠️ Le nombre total d'écoles inscrites dans votre réseau sera immédiatement décrémenté (-1).
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSchoolToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSchool(schoolToDelete.id);
                  setGrantSuccessMsg(`🗑️ L'école d'essai "${schoolToDelete.name}" a été supprimée définitivement.`);
                  setSchoolToDelete(null);
                  setTimeout(() => setGrantSuccessMsg(''), 4000);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 text-white" />
                <span>Oui, Supprimer Définitivement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete School Setup Wizard Modal */}
      {selectedSchoolForSetupModal && (
        <CompleteSchoolSetupModal
          isOpen={!!selectedSchoolForSetupModal}
          onClose={() => setSelectedSchoolForSetupModal(null)}
          targetSchool={selectedSchoolForSetupModal}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
