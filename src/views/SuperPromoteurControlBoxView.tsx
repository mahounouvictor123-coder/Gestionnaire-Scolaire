import React, { useState, useMemo } from 'react';
import { useApp } from '../lib/store';
import {
  ShieldAlert,
  Zap,
  Building2,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Calendar,
  Smartphone,
  CreditCard,
  Wallet,
  ArrowRight,
  Sparkles,
  ClipboardPaste,
  Share2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Receipt,
  RotateCcw,
  CheckCircle,
  FileText,
  Clock,
  Send,
  Lock,
  ArrowLeft,
  X
} from 'lucide-react';
import {
  getCurrentMonthKey,
  formatMonthLabel,
  matchPhone,
  cleanDigits
} from '../data/initialParentActivations';
import { ParentActivationRecord, School } from '../types';
import { PwaInstallGuideModalProps } from '../components/modals/PwaInstallGuideModal';

interface SuperPromoteurControlBoxViewProps {
  onReturnToPlatform?: () => void;
}

export const SuperPromoteurControlBoxView: React.FC<SuperPromoteurControlBoxViewProps> = ({
  onReturnToPlatform
}) => {
  const {
    schools,
    students,
    classes,
    parentActivations,
    directorNotifications,
    lookupParentByPhone,
    activateParentRemotely,
    toggleSchoolPayout,
    getSchoolMonthlyActivatedParentsCount
  } = useApp();

  // Navigation internal tabs inside Super-Promoteur workspace
  const [activeTab, setActiveTab] = useState<'ACTIVATION' | 'SCHOOLS' | 'FINANCE' | 'HISTORY'>('ACTIVATION');

  // Tool 2: Remote activation state
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [lastActivatedReceipt, setLastActivatedReceipt] = useState<ParentActivationRecord | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Direct secret URL for standalone access
  const directSuperPromoteurUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/super-promoteur';
    return `${window.location.origin}/super-promoteur`;
  }, []);

  // Tool 4: Financial month selector
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => getCurrentMonthKey());

  // Search in schools list
  const [schoolSearch, setSchoolSearch] = useState('');
  // Search in activation history
  const [historySearch, setHistorySearch] = useState('');

  // Selected school to inspect students
  const [inspectingSchool, setInspectingSchool] = useState<School | null>(null);

  // Real-time lookup of the entered phone number
  const lookupResult = useMemo(() => {
    if (!phoneInput.trim()) return null;
    return lookupParentByPhone(phoneInput.trim());
  }, [phoneInput, lookupParentByPhone, schools, students, parentActivations]);

  const handleExit = () => {
    if (onReturnToPlatform) {
      onReturnToPlatform();
    } else if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('route');
        url.searchParams.delete('view');
        url.searchParams.delete('page');
        if (url.pathname.includes('super-promoteur')) {
          url.pathname = '/';
        }
        url.hash = '';
        window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
      } catch (e) {
        console.error(e);
      }
      window.location.href = '/';
    }
  };

  // Handle Paste from clipboard
  const handlePastePhone = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setPhoneInput(text.trim());
          setActionSuccessMsg(null);
        }
      }
    } catch (err) {
      console.warn("Clipboard access not granted");
    }
  };

  // Trigger remote activation
  const handleActivate = (durationDays: number = 30) => {
    if (!phoneInput.trim()) return;
    const fee = durationDays >= 300 ? 9000 : 1000;
    const res = activateParentRemotely(phoneInput.trim(), durationDays, fee);
    if (res.success && res.activation) {
      setLastActivatedReceipt(res.activation);
      setActionSuccessMsg(res.message);
    } else {
      setActionSuccessMsg(res.message || "Impossible d'activer ce parent.");
    }
  };

  // Copy receipt code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  // Share via WhatsApp
  const handleShareWhatsApp = (rec: ParentActivationRecord) => {
    const isYear = (rec.durationDays || 30) >= 300 || rec.planType === 'ANNUAL';
    const planText = isYear ? '1 AN (365 jours)' : '30 JOURS';
    const amountText = (rec.fee || (isYear ? 9000 : 1000)).toLocaleString('fr-FR') + ' FCFA';

    const text = `*GESTIONNAIRE SCOLAIRE - REÇU D'ACTIVATION OFFICIEL*\n\n` +
      `Bonjour *${rec.parentName}*,\n` +
      `Votre compte Espace Parent a été activé avec succès à distance pour *${planText}*.\n\n` +
      `📌 *Code reçu unique :* ${rec.receiptCode}\n` +
      `🎓 *Élève(s) :* ${rec.studentName}\n` +
      `🏫 *Établissement :* ${rec.schoolName}\n` +
      `📅 *Fin d'abonnement :* ${rec.fin_abonnement}\n` +
      `💰 *Montant :* ${amountText} (Statut: ACTIF)\n\n` +
      `Connectez-vous avec votre numéro (${rec.rawPhone || rec.phone}) pour suivre les notes, absences et bulletins.`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // Month options for finance
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(getCurrentMonthKey());
    parentActivations.forEach(a => {
      if (a.monthKey) set.add(a.monthKey);
    });
    // Add current and previous 3 months
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      set.add(`${y}-${m}`);
    }
    return Array.from(set).sort().reverse();
  }, [parentActivations]);

  // Financial calculations for selected month
  const monthActivations = useMemo(() => {
    return parentActivations.filter(a => a.monthKey === selectedMonthKey && a.status === 'actif');
  }, [parentActivations, selectedMonthKey]);

  const financialSummary = useMemo(() => {
    const totalCount = monthActivations.length;
    const totalCollected = monthActivations.reduce((sum, a) => sum + (a.fee || 1000), 0);
    const promoterCommission = monthActivations.reduce((sum, a) => sum + (a.promoterCommission ?? Math.round((a.fee || 1000) * 0.6)), 0);
    const schoolShare = monthActivations.reduce((sum, a) => sum + (a.schoolShare ?? Math.round((a.fee || 1000) * 0.3)), 0);

    const totalPaidToSchools = monthActivations
      .filter(a => a.isPaidToSchool)
      .reduce((sum, a) => sum + (a.schoolShare ?? Math.round((a.fee || 1000) * 0.3)), 0);

    const remainingToPay = schoolShare - totalPaidToSchools;

    return {
      totalCount,
      totalCollected,
      promoterCommission,
      schoolShare,
      totalPaidToSchools,
      remainingToPay
    };
  }, [monthActivations]);

  // Per-school financial breakdown for selected month
  const schoolFinancialBreakdown = useMemo(() => {
    return schools.map(school => {
      const activations = monthActivations.filter(a => a.schoolId === school.id);
      const count = activations.length;
      const totalCollected = activations.reduce((sum, a) => sum + (a.fee || 1000), 0);
      const promoterCommission = activations.reduce((sum, a) => sum + (a.promoterCommission ?? Math.round((a.fee || 1000) * 0.6)), 0);
      const schoolShare = activations.reduce((sum, a) => sum + (a.schoolShare ?? Math.round((a.fee || 1000) * 0.3)), 0);

      const isPaid = count > 0 && activations.every(a => a.isPaidToSchool);
      const paidDate = activations.find(a => a.isPaidToSchool && a.paidToSchoolDate)?.paidToSchoolDate;

      return {
        school,
        count,
        totalCollected,
        promoterCommission,
        schoolShare,
        isPaid,
        paidDate,
        activations
      };
    });
  }, [schools, monthActivations]);

  // Filtered schools for Tool 1
  const filteredSchools = useMemo(() => {
    const q = schoolSearch.toLowerCase().trim();
    if (!q) return schools;
    return schools.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.directorName && s.directorName.toLowerCase().includes(q)) ||
      (s.officialCode && s.officialCode.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  }, [schools, schoolSearch]);

  // Sample phone numbers for quick 1-click demo test
  const demoPhoneSamples = [
    { name: "Mme Chantal DIALLO", phone: "+225 08 99 88 77 66", school: "GESTIONNAIRE SCOLAIRE" },
    { name: "M. Lucien KOUAME", phone: "+225 07 22 33 44 55", school: "GESTIONNAIRE SCOLAIRE" },
    { name: "Mme Marie-Claire BONY", phone: "+225 05 66 77 88 99", school: "GESTIONNAIRE SCOLAIRE" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-purple-500 selection:text-white">
      {/* Top Bar Header for Super-Promoteur */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl px-3 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            {/* Primary Big Back Arrow to Exit */}
            <button
              onClick={handleExit}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 border border-slate-600 shadow-lg transition-all cursor-pointer group shrink-0"
              title="Retourner au Tableau de Bord de l'École"
            >
              <ArrowLeft className="h-4 w-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
              <span>← Retour École</span>
            </button>

            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-900/40 ring-1 ring-white/20 shrink-0">
              <Zap className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Espace boîte contrôle d'école</span>
                  <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    Route Secrète <code className="text-amber-300">/super-promoteur</code>
                  </span>
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium line-clamp-1">
                Console maître du Promoteur • Activation à distance 30 jours • Réseau multi-écoles
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            {/* Install to Screen */}
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="hidden sm:flex px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-900/40 items-center gap-1.5 transition-all cursor-pointer"
              title="Ajouter comme application sur votre écran d'accueil"
            >
              <Smartphone className="h-3.5 w-3.5 text-amber-300" />
              <span>Installer</span>
            </button>

            {/* Direct Link Copier */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(directSuperPromoteurUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              }}
              className="hidden md:flex px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 items-center gap-1.5 transition-all cursor-pointer"
              title="Copier le lien secret direct"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copiedLink ? 'Copié !' : 'Lien direct'}</span>
            </button>

            {/* Return to school platform - Blue Button */}
            <button
              onClick={handleExit}
              className="px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-blue-900/40 flex items-center gap-1.5 transition-all transform hover:scale-[1.02] cursor-pointer"
              title="Quitter la boîte et revenir sur le tableau de bord de l'école"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-amber-300" />
              <span>Tableau de Bord</span>
            </button>

            {/* Close Cross Button - Red/Rose Button */}
            <button
              onClick={handleExit}
              className="px-3 py-1.5 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-950/60 border border-rose-400/30 flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer"
              title="Fermer l'espace boîte contrôle d'école (Sortir)"
              aria-label="Fermer et Sortir"
            >
              <X className="h-4 w-4" />
              <span>Sortir</span>
            </button>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center space-x-1 border-t border-slate-800/80 pt-2.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('ACTIVATION')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'ACTIVATION'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="h-4 w-4 text-amber-300" />
            <span>1. Activation à distance</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-400/30 text-purple-200">
              Clé Téléphone
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SCHOOLS')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'SCHOOLS'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>2. Liste des écoles</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
              {schools.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('FINANCE')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'FINANCE'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Wallet className="h-4 w-4 text-emerald-400" />
            <span>3. Tableau financier mensuel</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-mono">
              60% / 30%
            </span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'HISTORY'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Receipt className="h-4 w-4 text-cyan-300" />
            <span>4. Reçus & Journal</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
              {parentActivations.length}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Dedicated Standalone Shortcut & Link Hub */}
        <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/40 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                🔑 Accès direct Hors Plateforme
              </span>
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Route secrète active
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Votre lien secret :</span>
              <code className="px-2.5 py-1 rounded-xl bg-slate-950 border border-purple-500/30 text-amber-300 text-xs sm:text-sm font-mono font-bold select-all break-all">
                {directSuperPromoteurUrl}
              </code>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enregistrez ce lien dans vos favoris WhatsApp ou installez-le directement sur l'écran d'accueil de votre smartphone pour l'ouvrir comme une vraie application sans passer par la plateforme.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(directSuperPromoteurUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-950/50 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Lien copié !' : 'Copier le lien'}</span>
            </button>

            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-black flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Ajouter à l'écran (Tuto)</span>
            </button>

            <a
              href={directSuperPromoteurUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center cursor-pointer transition-all"
              title="Ouvrir dans un nouvel onglet plein écran"
            >
              <ExternalLink className="w-4 h-4 text-sky-400" />
            </a>
          </div>
        </div>

        {/* TAB 1: ACTIVATION À DISTANCE */}
        {activeTab === 'ACTIVATION' && (
          <div className="space-y-6">
            {/* Hero Card with Phone Input */}
            <div className="bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
                  <Zap className="h-3.5 w-3.5 text-amber-300" />
                  Outil maître d'activation 30 jours
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                  Activation à distance du compte parent
                </h2>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  Collez simplement le numéro de téléphone utilisé par le parent. Ce numéro est lié automatiquement à son élève et à son école d'origine sans aucune manipulation manuelle.
                </p>

                {/* The Single Phone Input Form */}
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 sm:p-3 shadow-inner">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                    Numéro de téléphone du parent (Coller ici) :
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Smartphone className="h-5 w-5 text-purple-400" />
                      </div>
                      <input
                        type="text"
                        value={phoneInput}
                        onChange={(e) => {
                          setPhoneInput(e.target.value);
                          setActionSuccessMsg(null);
                        }}
                        placeholder="Ex: +225 08 99 88 77 66 ou 0899887766"
                        className="w-full pl-11 pr-24 py-3.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 font-mono text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                      {phoneInput && (
                        <button
                          onClick={() => {
                            setPhoneInput('');
                            setActionSuccessMsg(null);
                          }}
                          className="absolute inset-y-0 right-14 pr-2 flex items-center text-slate-500 hover:text-slate-300"
                          title="Effacer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handlePastePhone}
                        className="absolute inset-y-1.5 right-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold border border-purple-500/20 flex items-center gap-1 transition-all"
                        title="Coller depuis le presse-papier"
                      >
                        <ClipboardPaste className="h-3.5 w-3.5" />
                        <span>Coller</span>
                      </button>
                    </div>

                    {/* Quick activate trigger if recognized */}
                    {lookupResult?.found && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleActivate(30)}
                          className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-900/40 border border-emerald-400/40 flex items-center justify-center gap-1.5 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                          title="Activer 30 jours (1 000 FCFA)"
                        >
                          <Zap className="h-4 w-4 text-amber-300 animate-pulse" />
                          <span>Activer 30 jours (1 000F)</span>
                        </button>
                        <button
                          onClick={() => handleActivate(365)}
                          className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-900/40 border border-purple-400/40 flex items-center justify-center gap-1.5 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                          title="Activer 1 an (9 000 FCFA)"
                        >
                          <Sparkles className="h-4 w-4 text-amber-300" />
                          <span>Activer 1 an (9 000F)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 1-Click Test Shortcuts */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500 font-semibold">Numéros exemples enregistrés :</span>
                    {demoPhoneSamples.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPhoneInput(sample.phone);
                          setActionSuccessMsg(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-500/40 text-slate-300 hover:text-purple-200 font-mono transition-all flex items-center gap-1.5"
                      >
                        <span>{sample.name}</span>
                        <code className="text-[11px] text-purple-300 bg-slate-950 px-1 py-0.5 rounded">
                          {sample.phone}
                        </code>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Result Card: If recognized */}
                {lookupResult && lookupResult.found && lookupResult.records.length > 0 && (
                  <div className="mt-6 bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-white">Numéro reconnu avec succès</h3>
                          <p className="text-xs text-slate-400">Fiche parent identifiée dans le système de gestion</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        {lookupResult.records.length} Élève(s) lié(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* Parent Name */}
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="block text-xs font-bold uppercase text-slate-500 mb-1">Nom du Parent</span>
                        <p className="text-base font-black text-white">
                          {lookupResult.records[0].student.parentName || "Nom non spécifié"}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Tél : {phoneInput}
                        </p>
                      </div>

                      {/* Origin School */}
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="block text-xs font-bold uppercase text-slate-500 mb-1">École d'origine</span>
                        <p className="text-base font-black text-purple-300 flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-purple-400" />
                          {lookupResult.records[0].school.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Ville : {lookupResult.records[0].school.city || 'Cotonou'} • Code : {lookupResult.records[0].school.officialCode || lookupResult.records[0].school.id}
                        </p>
                      </div>
                    </div>

                    {/* Linked Students & Classes */}
                    <div className="mt-4">
                      <span className="block text-xs font-bold uppercase text-slate-500 mb-2">
                        Élève(s) & Classe(s) rattaché(s) :
                      </span>
                      <div className="space-y-2">
                        {lookupResult.records.map((rec, idx) => (
                          <div
                            key={idx}
                            className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-xs">
                                {rec.student.firstName[0]}{rec.student.lastName[0]}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">
                                  {rec.student.firstName} {rec.student.lastName}
                                </p>
                                <p className="text-xs text-slate-400">
                                  Matricule : <span className="font-mono text-slate-300">{rec.student.registrationNumber}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-1 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-500/30 text-xs font-bold">
                                Classe : {rec.className}
                              </span>
                              {rec.currentActivation ? (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  Actif jusqu'au {rec.currentActivation.fin_abonnement}
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-500/30 text-xs font-bold">
                                  Non abonné / Expiré
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Big Action Buttons: "Activer 30 jours" & "Activer 1 an" */}
                    <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span className="font-bold text-slate-300">
                            • Formule 30 jours : <strong className="text-emerald-300 font-black">1 000 FCFA</strong> (Promoteur 60% : 600F | École 30% : 300F)
                          </span>
                          <span className="font-bold text-slate-300">
                            • Formule 1 an : <strong className="text-purple-300 font-black">9 000 FCFA</strong> (Promoteur 60% : 5 400F | École 30% : 2 700F)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Génération automatique d'un code reçu unique • Notification instantanée au Directeur d'école
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => handleActivate(30)}
                          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-900/50 border border-emerald-400/40 flex items-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                        >
                          <Zap className="h-5 w-5 text-amber-300 animate-pulse" />
                          <span>Activer 30 jours (1 000F)</span>
                          <ArrowRight className="h-4 w-4 text-white/80" />
                        </button>

                        <button
                          onClick={() => handleActivate(365)}
                          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-400 text-white font-black text-sm sm:text-base shadow-xl shadow-purple-900/50 border border-purple-400/40 flex items-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                        >
                          <Sparkles className="h-5 w-5 text-amber-300" />
                          <span>Activer 1 an (9 000F)</span>
                          <ArrowRight className="h-4 w-4 text-white/80" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* If NOT recognized: Show "Numéro non enregistré" */}
                {lookupResult && !lookupResult.found && (
                  <div className="mt-6 bg-red-950/40 border border-red-500/40 rounded-2xl p-5 sm:p-6 shadow-xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start space-x-3.5">
                      <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-red-300">
                          Numéro non enregistré
                        </h3>
                        <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                          Ce numéro <code className="font-mono text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded">{phoneInput}</code> n'a été enregistré par aucun directeur d'école dans la liste de ses élèves.
                        </p>
                        <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-red-900/40 text-xs text-slate-400 space-y-1">
                          <p className="font-bold text-slate-300">Que faire ?</p>
                          <p>1. Le directeur de l'école concernée doit d'abord inscrire le parent dans la fiche de l'élève (champ Téléphone Parent).</p>
                          <p>2. Dès que le directeur saisit ce numéro, revenez ici et collez-le : l'élève et l'école apparaîtront automatiquement.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Card with Generated Receipt Code */}
                {lastActivatedReceipt && (
                  <div className="mt-6 bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-slate-900 border-2 border-amber-400/60 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-950/40">
                          <Receipt className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Reçu officiel généré</span>
                          <h3 className="text-xl font-black text-white">Activation 30 Jours Confirmée !</h3>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase">
                        Statut : ACTIF
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                      {/* Big Receipt Code Box */}
                      <div className="p-6 rounded-2xl bg-slate-950 border border-purple-500/40 text-center shadow-inner">
                        <span className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                          Code Reçu Unique (5 caractères)
                        </span>
                        <div className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-amber-400 my-2">
                          {lastActivatedReceipt.receiptCode}
                        </div>
                        <button
                          onClick={() => handleCopyCode(lastActivatedReceipt.receiptCode)}
                          className="mt-2 w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          {copiedCode === lastActivatedReceipt.receiptCode ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-300" />
                              <span>Code Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copier le Code Reçu</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Receipt Summary Details */}
                      <div className="lg:col-span-2 space-y-2 text-xs sm:text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <span className="text-slate-500 block">Parent activé</span>
                            <span className="font-bold text-white text-sm">{lastActivatedReceipt.parentName}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <span className="text-slate-500 block">Téléphone clé</span>
                            <span className="font-mono font-bold text-amber-300">{lastActivatedReceipt.rawPhone}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <span className="text-slate-500 block">Élève & Classe</span>
                            <span className="font-bold text-white">{lastActivatedReceipt.studentName} ({lastActivatedReceipt.className})</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <span className="text-slate-500 block">Établissement</span>
                            <span className="font-bold text-purple-300">{lastActivatedReceipt.schoolName}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <span className="text-slate-500 block">Fin d'abonnement (+30j)</span>
                            <span className="font-bold text-emerald-400 font-mono text-sm">{lastActivatedReceipt.fin_abonnement}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <span className="text-slate-500 block">Répartition financière</span>
                            <span className="font-bold text-white">Promoteur 60% (600F) • École 30% (300F)</span>
                          </div>
                        </div>

                        {/* Automatic Notification Confirmation Badge */}
                        <div className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>Directeur de l'école notifié instantanément • Compteur mensuel « Parents activés » +1</span>
                          </div>
                          <span className="text-[11px] font-bold bg-indigo-900 px-2 py-0.5 rounded text-indigo-300">
                            Auto
                          </span>
                        </div>

                        {/* WhatsApp Share Button */}
                        <button
                          onClick={() => handleShareWhatsApp(lastActivatedReceipt)}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                        >
                          <Share2 className="h-4 w-4" />
                          <span>Envoyer le reçu officiel au parent sur WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Overview Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="block text-xs font-bold uppercase text-slate-500">Écoles enregistrées</span>
                <p className="text-2xl font-black text-white mt-1">{schools.length}</p>
                <p className="text-xs text-slate-400 mt-1">Mise à jour automatique</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="block text-xs font-bold uppercase text-slate-500">Total parents activés</span>
                <p className="text-2xl font-black text-purple-300 mt-1">{parentActivations.length}</p>
                <p className="text-xs text-slate-400 mt-1">Tous établissements confondus</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="block text-xs font-bold uppercase text-slate-500">Part Promoteur (60%)</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {(parentActivations.length * 600).toLocaleString('fr-FR')} F
                </p>
                <p className="text-xs text-slate-400 mt-1">600 FCFA / parent activé</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="block text-xs font-bold uppercase text-slate-500">Part Écoles (30%)</span>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  {(parentActivations.length * 300).toLocaleString('fr-FR')} F
                </p>
                <p className="text-xs text-slate-400 mt-1">300 FCFA / parent reversé</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LISTE AUTOMATIQUE DES ÉCOLES */}
        {activeTab === 'SCHOOLS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  1. Liste automatique de toutes les écoles
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Toutes les écoles inscrites s'affichent ici AUTOMATIQUEMENT dès leur enregistrement.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  placeholder="Rechercher une école, ville, code..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Schools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchools.map((school) => {
                const monthCount = getSchoolMonthlyActivatedParentsCount(school.id);
                const totalSchoolActivations = parentActivations.filter(a => a.schoolId === school.id).length;
                const schoolEarned = totalSchoolActivations * 700;

                return (
                  <div
                    key={school.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold shrink-0">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {school.officialCode || school.id}
                        </span>
                      </div>

                      <h3 className="font-black text-white text-base leading-tight mb-1">
                        {school.name}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                        <span>{school.city || 'Cotonou'}</span>
                        {school.address && <span>• {school.address}</span>}
                      </p>

                      {/* Director info */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs mb-3 space-y-0.5">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500">Directeur :</span>
                          <span className="font-bold">{school.directorName || 'M. le Directeur'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500">Téléphone :</span>
                          <span className="font-mono text-purple-300">{school.phone || 'Non renseigné'}</span>
                        </div>
                      </div>

                      {/* Activated parents counter */}
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/20 text-center">
                          <span className="block text-[10px] text-purple-300 font-bold uppercase">Ce mois-ci</span>
                          <span className="text-lg font-black text-white">{monthCount}</span>
                          <span className="block text-[10px] text-slate-400">Parents activés</span>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-center">
                          <span className="block text-[10px] text-emerald-300 font-bold uppercase">Part école (30%)</span>
                          <span className="text-lg font-black text-emerald-400">{schoolEarned.toLocaleString('fr-FR')} F</span>
                          <span className="block text-[10px] text-slate-400">{totalSchoolActivations} total</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        school.isBlocked
                          ? 'bg-red-950 text-red-300 border border-red-500/30'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {school.isBlocked ? 'Accès Bloqué' : 'Établissement Actif'}
                      </span>

                      <button
                        onClick={() => {
                          // Quick test phone lookup with director or school phone
                          if (school.phone) {
                            setPhoneInput(school.phone);
                            setActiveTab('ACTIVATION');
                          }
                        }}
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        <span>Activer un parent</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TABLEAU FINANCIER MENSUEL */}
        {activeTab === 'FINANCE' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  4. Tableau financier mensuel
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Par école et par mois : Parents activés • Total collecté (1 000F) • Promoteur 60% • Part école 30% • Versements.
                </p>
              </div>

              {/* Month Selector */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-slate-400 font-bold uppercase">Mois :</span>
                <select
                  value={selectedMonthKey}
                  onChange={(e) => setSelectedMonthKey(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthLabel(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Financial KPI Cards for the Month */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-500/30">
                <span className="block text-xs font-bold uppercase tracking-wider text-purple-300">
                  Nombre de parents activés
                </span>
                <p className="text-3xl font-black text-white mt-1">{financialSummary.totalCount}</p>
                <p className="text-xs text-slate-400 mt-1">Pour {formatMonthLabel(selectedMonthKey)}</p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Collecté (1 000F / parent)
                </span>
                <p className="text-3xl font-black text-amber-300 mt-1">
                  {financialSummary.totalCollected.toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-xs text-slate-500 mt-1">100% cotisations encaissées</p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/30">
                <span className="block text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Part Promoteur (60%)
                </span>
                <p className="text-3xl font-black text-emerald-300 mt-1">
                  {financialSummary.promoterCommission.toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-xs text-slate-400 mt-1">600 FCFA nets par parent</p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30">
                <span className="block text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Part Écoles (30%)
                </span>
                <p className="text-3xl font-black text-indigo-200 mt-1">
                  {financialSummary.schoolShare.toLocaleString('fr-FR')} FCFA
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                  <span>Versé: {financialSummary.totalPaidToSchools.toLocaleString('fr-FR')} F</span>
                  <span className="text-amber-300">Reste: {financialSummary.remainingToPay.toLocaleString('fr-FR')} F</span>
                </div>
              </div>
            </div>

            {/* Financial Detailed Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-400" />
                  Répartition par école pour {formatMonthLabel(selectedMonthKey)}
                </h3>
                <span className="text-xs text-slate-400">
                  Règle : 1 000F / parent (Promoteur 600F | École 300F)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Établissement</th>
                      <th className="px-4 py-3">Directeur & Tél</th>
                      <th className="px-4 py-3 text-center">Parents activés</th>
                      <th className="px-4 py-3 text-right">Total Collecté</th>
                      <th className="px-4 py-3 text-right">Part Promoteur (60%)</th>
                      <th className="px-4 py-3 text-right">Part École (30%)</th>
                      <th className="px-4 py-3 text-center">Statut Versement</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {schoolFinancialBreakdown.map((row) => (
                      <tr key={row.school.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-white">
                          <div>{row.school.name}</div>
                          <div className="text-[11px] text-slate-500 font-normal">{row.school.city || 'Cotonou'}</div>
                        </td>

                        <td className="px-4 py-3 text-slate-300">
                          <div>{row.school.directorName || 'Directeur'}</div>
                          <div className="font-mono text-xs text-slate-500">{row.school.phone}</div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
                            row.count > 0
                              ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            {row.count}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-300">
                          {row.totalCollected.toLocaleString('fr-FR')} F
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                          {row.promoterCommission.toLocaleString('fr-FR')} F
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-black text-indigo-300">
                          {row.schoolShare.toLocaleString('fr-FR')} F
                        </td>

                        <td className="px-4 py-3 text-center">
                          {row.count === 0 ? (
                            <span className="text-slate-500 text-xs">—</span>
                          ) : row.isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3" />
                              Versé {row.paidDate ? `le ${row.paidDate}` : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                              <Clock className="h-3 w-3" />
                              En attente
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {row.count === 0 ? (
                            <span className="text-slate-500 text-xs">Aucun parent</span>
                          ) : (
                            <button
                              onClick={() => toggleSchoolPayout(row.school.id, selectedMonthKey, !row.isPaid)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                row.isPaid
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
                              }`}
                            >
                              {row.isPaid ? 'Annuler versement' : 'Marquer comme versé'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REÇUS & JOURNAL DES ACTIVATIONS */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Journal complet des reçus et activations
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Historique de tous les codes reçus alphanumériques générés à distance.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Rechercher code, parent, élève..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Activations List Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Code Reçu</th>
                      <th className="px-4 py-3">Parent & Téléphone</th>
                      <th className="px-4 py-3">Élève & Classe</th>
                      <th className="px-4 py-3">Établissement</th>
                      <th className="px-4 py-3">Validité (30j)</th>
                      <th className="px-4 py-3 text-right">Montant</th>
                      <th className="px-4 py-3 text-center">Part Reversée</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {parentActivations
                      .filter(a => {
                        const q = historySearch.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          a.receiptCode.toLowerCase().includes(q) ||
                          a.parentName.toLowerCase().includes(q) ||
                          a.studentName.toLowerCase().includes(q) ||
                          a.schoolName.toLowerCase().includes(q) ||
                          a.phone.includes(q) ||
                          a.rawPhone.includes(q)
                        );
                      })
                      .map((act) => (
                        <tr key={act.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono font-black text-sm text-amber-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-purple-500/30">
                              {act.receiptCode}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-bold text-white">{act.parentName}</div>
                            <div className="font-mono text-xs text-slate-400">{act.rawPhone || act.phone}</div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-200">{act.studentName}</div>
                            <div className="text-xs text-purple-300 font-bold">{act.className}</div>
                          </td>

                          <td className="px-4 py-3 text-slate-300">
                            {act.schoolName}
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-mono text-xs text-emerald-400 font-bold">
                              Fin : {act.fin_abonnement}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Activé le {new Date(act.activationDate).toLocaleDateString('fr-FR')}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-200">
                            {act.fee.toLocaleString('fr-FR')} F
                          </td>

                          <td className="px-4 py-3 text-center">
                            {act.isPaidToSchool ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                                Versé (700F)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                                En attente
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => handleCopyCode(act.receiptCode)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                title="Copier le code reçu"
                              >
                                {copiedCode === act.receiptCode ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleShareWhatsApp(act)}
                                className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30"
                                title="Partager sur WhatsApp"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Back Arrow & Exit Cross Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-700 shadow-2xl shadow-black/80">
        <button
          onClick={handleExit}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-950/60 transition-all cursor-pointer"
          title="Retourner à l'Espace École (Tableau de Bord)"
        >
          <ArrowLeft className="h-4 w-4 text-amber-300" />
          <span>← Retour École</span>
        </button>
        <button
          onClick={handleExit}
          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 transition-all cursor-pointer"
          title="Fermer la boîte (Sortir)"
          aria-label="Fermer la boîte et sortir"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* PWA Install Guide Modal for Super-Promoteur */}
      <PwaInstallGuideModalProps
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        schoolName="Boîte Contrôle"
        appTitle="Super Promoteur"
      />
    </div>
  );
};
