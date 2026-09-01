import React, { useState, useMemo } from 'react';
import { useApp } from '../lib/store';
import { SubscriptionPlan, SubscriptionInvoice } from '../types';
import { initiateKkiapayPayment, getKkiapayCheckoutUrl } from '../lib/kkiapay';
import {
  CreditCard,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Search,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  Printer,
  Sparkles,
  Zap,
  Globe,
  Settings,
  Eye,
  EyeOff,
  HelpCircle,
  UserCheck,
  MessageSquare,
  Lock,
  RefreshCw,
  Building2,
  Calendar,
  Award,
  Download,
  FileText,
  XCircle
} from 'lucide-react';

export const KkiapayView: React.FC = () => {
  const {
    currentSchool,
    settings,
    updateSchool,
    updateSettings,
    schools,
    subscriptionPlans,
    schoolSubscription,
    subscriptionInvoices,
    updateSchoolSubscription,
    validateDailyAccessPayment,
    currentUser
  } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'SUBSCRIBE' | 'KEYS' | 'INVOICES' | 'GUIDE'>('SUBSCRIBE');

  // Form Configuration State (Promoter API Keys for SaaS Subscriptions)
  const [kkiapayPublic, setKkiapayPublic] = useState(
    currentSchool?.kkiapayPublicKey || settings?.kkiapayPublicKey || 'pk_live_kkiapay_educ_7426d81e9093'
  );
  const [kkiapaySecret, setKkiapaySecret] = useState(
    currentSchool?.kkiapaySecretKey || settings?.kkiapaySecretKey || ''
  );
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(
    kkiapayPublic.includes('sand') || kkiapayPublic.includes('test') || kkiapayPublic.includes('xxxx')
  );
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Subscription Terminal State
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-monthly');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(currentSchool?.id || 'sch-temple');
  const [phone, setPhone] = useState<string>('0167430381');
  const [operator, setOperator] = useState<'ALL' | 'MTN' | 'MOOV' | 'CELTIIS' | 'WAVE' | 'CARD'>('ALL');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [waitingPush, setWaitingPush] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<{
    txId: string;
    planName: string;
    amount: number;
    schoolName: string;
    expiryDate: string;
    date: string;
  } | null>(null);

  // Invoice view state
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionInvoice | null>(null);

  // Find target school and target plan
  const targetSchool = schools.find(s => s.id === selectedSchoolId) || currentSchool;
  const targetPlan = subscriptionPlans.find(p => p.id === selectedPlanId) || subscriptionPlans[2];

  // Calculate pricing based on selected plan
  const planAmount = useMemo(() => {
    if (!targetPlan) return 5000;
    return targetPlan.priceMonthly || 5000;
  }, [targetPlan]);

  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchool({
      kkiapayPublicKey: kkiapayPublic.trim(),
      kkiapaySecretKey: kkiapaySecret.trim(),
      activePaymentGateway: 'KKIAPAY',
      enableOnlineTransactions: true
    });
    updateSettings({
      kkiapayPublicKey: kkiapayPublic.trim(),
      kkiapaySecretKey: kkiapaySecret.trim(),
      activePaymentGateway: 'KKIAPAY',
      enableOnlineTransactions: true
    });
    setSaveSuccessMsg("Clés API KKiaPay sauvegardées avec succès pour la collecte des abonnements SaaS !");
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleLaunchKkiapaySubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsProcessing(true);
    setWaitingPush(true);

    const cleanPhone = phone.trim() || '0167430381';
    const txReference = `KKIA-SUB-${Date.now().toString().slice(-8)}`;

    try {
      await initiateKkiapayPayment(
        {
          publicKey: kkiapayPublic,
          sandbox: isSandboxMode,
          themeColor: '#059669'
        },
        {
          amount: planAmount,
          phone: cleanPhone,
          reason: `Abonnement Plateforme SaaS - ${targetPlan.name} (${targetSchool.name})`,
          data: JSON.stringify({
            planId: targetPlan.id,
            schoolId: targetSchool.id,
            type: 'SAAS_SUBSCRIPTION'
          })
        },
        (resp) => {
          // Success Callback from KKiaPay
          completeSubscriptionActivation(resp.transactionId || txReference, cleanPhone);
          setIsProcessing(false);
          setWaitingPush(false);
        },
        (err) => {
          console.warn('KKiaPay payment error or cancelled:', err);
          setErrorMsg(err?.message || "La transaction KKiaPay n'a pas été confirmée. Veuillez autoriser le prélèvement sur votre téléphone ou ouvrir le guichet direct.");
          setIsProcessing(false);
          setWaitingPush(false);
        }
      );
    } catch (err: any) {
      setErrorMsg("Impossible de lancer la popup KKiaPay. Veuillez utiliser le bouton 'Ouvrir dans un nouvel onglet' ci-dessous.");
      setIsProcessing(false);
      setWaitingPush(false);
    }
  };

  const handleOpenDirectTab = () => {
    const cleanPhone = phone.trim() || '0167430381';
    const url = getKkiapayCheckoutUrl(
      kkiapayPublic,
      planAmount,
      cleanPhone,
      `Abonnement ${targetPlan.name} - ${targetSchool.name}`,
      isSandboxMode
    );
    window.open(url, '_blank');
  };

  const completeSubscriptionActivation = (txId: string, phoneUsed: string) => {
    // 1. Calculate duration and dates
    let daysToAdd = 30;
    if (targetPlan.id === 'plan-daily') daysToAdd = 1;
    else if (targetPlan.id === 'plan-weekly') daysToAdd = 7;
    else if (targetPlan.id === 'plan-monthly') daysToAdd = 30;
    else if (targetPlan.id === 'plan-annual') daysToAdd = 365;

    // 2. Validate daily access / unlock school
    const result = validateDailyAccessPayment(targetSchool.id, phoneUsed, daysToAdd, planAmount);

    // 3. Update school subscription
    updateSchoolSubscription(
      targetPlan.id,
      targetPlan.id === 'plan-annual' ? 'ANNUAL' : 'MONTHLY',
      'MOBILE_MONEY'
    );

    setIsProcessing(false);
    setSubscriptionSuccess({
      txId,
      planName: targetPlan.name,
      amount: planAmount,
      schoolName: targetSchool.name,
      expiryDate: result.newExpiryDate,
      date: new Date().toLocaleDateString('fr-FR')
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-2xl relative overflow-hidden border border-emerald-500/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5">
                <Zap className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
                <span>Passerelle KKiaPay • Abonnements Plateforme SaaS</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold flex items-center space-x-1">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>Licences & Accès Établissements</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Paiement des Plans d'Abonnement via KKiaPay
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Réglez et renouvelez instantanément la licence d'accès de votre établissement <strong className="text-emerald-300">« {currentSchool?.name} »</strong> par <strong className="text-white">MTN Mobile Money</strong>, <strong className="text-white">Moov Money</strong>, <strong className="text-white">Celtiis Cash</strong>, <strong className="text-white">Wave</strong> et <strong className="text-white">Cartes Visa / Mastercard</strong> avec déblocage automatique en temps réel.
            </p>
          </div>

          {/* Current Subscription Status Badge */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0 space-y-1.5 min-w-[240px]">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Formule Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-lg font-black text-white flex items-center space-x-2">
              <Award className="h-5 w-5 text-amber-400" />
              <span>{schoolSubscription?.planName || 'Plan Illimité'}</span>
            </div>
            <div className="text-xs text-emerald-300 font-semibold flex items-center space-x-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Renouvellement : {schoolSubscription?.nextRenewalDate || '31/12/2026'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('SUBSCRIBE')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'SUBSCRIBE'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>⚡ Payer mon Abonnement KKiaPay</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INVOICES')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'INVOICES'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>📜 Factures & Reçus d'Abonnement ({subscriptionInvoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('KEYS')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'KEYS'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>🔑 Clés API KKiaPay (Promoteur SaaS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GUIDE')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'GUIDE'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>💡 Guide KKiaPay & Reversements</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SUBSCRIBE TERMINAL */}
      {activeTab === 'SUBSCRIBE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Plan Selector */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Layers className="h-5 w-5 text-emerald-600" />
                <span>1. Choisissez votre Formule d'Abonnement</span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Sans engagement • Activation immédiate
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {subscriptionPlans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const isRecommended = plan.recommended;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-lg ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider shadow-sm">
                        ⭐ Recommandé
                      </span>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-sm text-slate-900 dark:text-white">
                          {plan.name}
                        </h3>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {plan.description}
                      </p>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-baseline space-x-1">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          {plan.priceMonthly.toLocaleString('fr-FR')}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">
                          {settings.currency || 'FCFA'} / {
                            plan.id === 'plan-daily' ? '1 Jour' :
                            plan.id === 'plan-weekly' ? '7 Jours' :
                            plan.id === 'plan-annual' ? '1 An (365j)' : '30 Jours'
                          }
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center space-x-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Élèves & Profs Illimités • Bulletins QR</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quota Details Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
                <span>Inclus dans la formule sélectionnée ({targetPlan.name}) :</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">{planAmount.toLocaleString()} FCFA</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="block text-slate-400">Élèves</span>
                  <strong className="text-slate-900 dark:text-white font-black">ILLIMITÉS</strong>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="block text-slate-400">Enseignants</span>
                  <strong className="text-slate-900 dark:text-white font-black">ILLIMITÉS</strong>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="block text-slate-400">SMS Inclus</span>
                  <strong className="text-emerald-600 font-black">{targetPlan.smsIncludedMonthly} SMS</strong>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="block text-slate-400">Scans IA</span>
                  <strong className="text-amber-600 font-black">{targetPlan.aiScansIncludedMonthly} Scans</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: KKiaPay Checkout Form */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700/80 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      Guichet KKiaPay Express
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Règlement Mobile Money & Carte
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                  Sécurisé SSL 256-bit
                </span>
              </div>

              {subscriptionSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      Abonnement Activé avec Succès !
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                      Votre établissement <strong>« {subscriptionSuccess.schoolName} »</strong> est opérationnel jusqu'au <strong>{subscriptionSuccess.expiryDate}</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-500">
                      <span>Réf. Transaction :</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{subscriptionSuccess.txId}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Formule souscrite :</span>
                      <strong className="text-emerald-600">{subscriptionSuccess.planName}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Montant Réglé :</span>
                      <strong className="text-slate-900 dark:text-white font-black">{subscriptionSuccess.amount.toLocaleString()} FCFA</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSubscriptionSuccess(null);
                      setActiveTab('INVOICES');
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md cursor-pointer transition-all"
                  >
                    Voir ma Facture & Quittance d'Abonnement
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLaunchKkiapaySubscription} className="space-y-4">
                  {/* Target School Picker */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>Établissement Bénéficiaire :</span>
                    </label>
                    <select
                      value={selectedSchoolId}
                      onChange={(e) => setSelectedSchoolId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {schools.map((sch) => (
                        <option key={sch.id} value={sch.id}>
                          {sch.name} ({sch.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Operator Channel Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Réseau de Paiement :
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setOperator('ALL')}
                        className={`p-2 rounded-xl border text-center transition-all text-[11px] font-bold ${
                          operator === 'ALL'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Zap className="h-3.5 w-3.5 mx-auto mb-0.5 text-emerald-500" />
                        <span>Tous MoMo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOperator('MTN')}
                        className={`p-2 rounded-xl border text-center transition-all text-[11px] font-bold ${
                          operator === 'MTN'
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5 mx-auto mb-0.5 text-yellow-500" />
                        <span>MTN Bénin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOperator('MOOV')}
                        className={`p-2 rounded-xl border text-center transition-all text-[11px] font-bold ${
                          operator === 'MOOV'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5 mx-auto mb-0.5 text-blue-500" />
                        <span>Moov Bénin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOperator('CELTIIS')}
                        className={`p-2 rounded-xl border text-center transition-all text-[11px] font-bold ${
                          operator === 'CELTIIS'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5 mx-auto mb-0.5 text-purple-500" />
                        <span>Celtiis</span>
                      </button>
                    </div>
                  </div>

                  {/* Phone Number Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Numéro Mobile Money Débiteur :</span>
                      <span className="text-[10px] text-slate-400 font-mono">Bénin / UEMOA</span>
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="Ex: 01 67 43 03 81"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-500/20 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Formule choisie :</span>
                      <strong className="text-slate-900 dark:text-white">{targetPlan.name}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Compte Marchand :</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">Promoteur Mahounou Services</strong>
                    </div>
                    <div className="pt-1.5 border-t border-emerald-500/20 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                      <span>Total à Débiter :</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{planAmount.toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  {waitingPush && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex flex-col space-y-2 text-xs text-amber-900 dark:text-amber-200">
                      <div className="flex items-start space-x-3">
                        <RefreshCw className="h-5 w-5 animate-spin text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-black">Confirmation Mobile Money en attente...</strong>
                          <span>Prenez votre téléphone ({phone}) et tapez votre code PIN secret sur le prompt Mobile Money pour approuver le débit de {planAmount.toLocaleString()} FCFA.</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-amber-200 dark:border-amber-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProcessing(false);
                            setWaitingPush(false);
                            setErrorMsg("Transfert annulé par l'utilisateur. Aucun débit n'a été prélevé.");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Annuler le transfert en cas d'erreur</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit and Cancel Buttons */}
                  <div className="space-y-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-xl transition-all ${
                        isProcessing
                          ? 'bg-slate-400 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/30 cursor-pointer hover:scale-[1.02]'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Lancement de KKiaPay...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 fill-white" />
                          <span>Déclencher le Paiement Mobile Money ({planAmount.toLocaleString()} FCFA)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenDirectTab}
                      className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Ouvrir la page de paiement sécurisée dans un nouvel onglet</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProcessing(false);
                        setWaitingPush(false);
                        setSelectedSchoolId(null);
                        setErrorMsg("Opération de transfert annulée.");
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      <span>Annuler le transfert en cas d'erreur / Réinitialiser</span>
                    </button>
                  </div>

                  <p className="text-center text-[10px] text-slate-400 font-medium">
                    Reversement direct au compte promoteur • Déblocage instantané de l'école
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVOICES & RECEIPTS */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <span>Journal des Factures & Quittances d'Abonnement SaaS</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consultez et téléchargez les reçus officiels certifiés pour chaque souscription effectuée.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('SUBSCRIBE')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm self-start cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Nouveau Renouvellement</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="p-3">N° Facture</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Formule / Désignation</th>
                  <th className="p-3">Période Couverte</th>
                  <th className="p-3">Passerelle</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                {subscriptionInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Aucun historique de facture pour le moment.
                    </td>
                  </tr>
                ) : (
                  subscriptionInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3">{inv.date}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{inv.planName}</td>
                      <td className="p-3 text-slate-500">{inv.period}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                          KKiaPay MoMo
                        </span>
                      </td>
                      <td className="p-3 font-black text-slate-900 dark:text-white">
                        {inv.amount.toLocaleString('fr-FR')} {inv.currency}
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-bold transition-all inline-flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Reçu Officiel</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: API KEYS CONFIGURATION (PROMOTER) */}
      {activeTab === 'KEYS' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Settings className="h-5 w-5 text-emerald-600" />
              <span>Paramètres Clés API KKiaPay du Promoteur SaaS</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configurez vos clés marchandes KKiaPay pour recevoir les paiements des abonnements et licences des directeurs d'écoles directement sur vos comptes Mobile Money et Bancaires.
            </p>
          </div>

          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveApiKeys} className="space-y-5 max-w-2xl">
            {/* Public Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Clé Publique KKiaPay (Public Key) :</span>
                <span className="text-[10px] text-emerald-600 font-bold">Obligatoire pour le Widget</span>
              </label>
              <input
                type="text"
                required
                value={kkiapayPublic}
                onChange={(e) => setKkiapayPublic(e.target.value)}
                placeholder="Ex: pk_live_xxxxxxxxxxxxxxxxxxxx ou pk_sandbox_xxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Secret Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Clé Privée / Secrète KKiaPay (Secret Key) :</span>
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center space-x-1"
                >
                  {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showSecretKey ? 'Masquer' : 'Afficher'}</span>
                </button>
              </label>
              <input
                type={showSecretKey ? 'text' : 'password'}
                value={kkiapaySecret}
                onChange={(e) => setKkiapaySecret(e.target.value)}
                placeholder="Ex: sk_live_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Webhook Endpoint */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Globe className="h-4 w-4 text-indigo-500" />
                  <span>URL Webhook / Notification Instantanée (IPN) :</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText('https://api.edumanage.ai/api/webhooks/kkiapay')}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center space-x-1"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copier</span>
                </button>
              </div>
              <code className="block p-2 rounded-lg bg-white dark:bg-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                https://api.edumanage.ai/api/webhooks/kkiapay
              </code>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
            >
              Enregistrer les Paramètres KKiaPay
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: GUIDE */}
      {activeTab === 'GUIDE' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-emerald-600" />
              <span>Guide d'Intégration & Reversements KKiaPay SaaS</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comment fonctionne le paiement des abonnements par Mobile Money et les reversements sur votre compte.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                1
              </span>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white">Création du Compte</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Créez votre compte marchand sur <strong>kkiapay.me</strong> et récupérez vos clés d'API (Publique et Privée).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                2
              </span>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white">Souscription & Déblocage</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Les directeurs d'écoles paient leur abonnement par MTN, Moov, Celtiis ou Carte. L'accès est débloqué automatiquement.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                3
              </span>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white">Reversement Direct</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Les fonds sont reversés directement sur le numéro Mobile Money ou compte bancaire du promoteur.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
              >
                ✕
              </button>
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Reçu Certifié d'Abonnement SaaS</span>
              </div>
              <h3 className="text-xl font-black mt-1">{selectedInvoice.invoiceNumber}</h3>
              <p className="text-xs text-slate-300 mt-0.5">Établi le {selectedInvoice.date}</p>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Désignation :</span>
                  <strong className="text-slate-900 dark:text-white">{selectedInvoice.planName}</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Période Couverte :</span>
                  <strong className="text-slate-900 dark:text-white">{selectedInvoice.period}</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Moyen de Paiement :</span>
                  <strong className="text-emerald-600">KKiaPay Mobile Money</strong>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                  <span>Montant Total Réglé :</span>
                  <span className="text-emerald-600">{selectedInvoice.amount.toLocaleString()} {selectedInvoice.currency}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-500 text-[11px] pt-2">
                <span>Statut : <strong className="text-emerald-600">PAYÉ / CERTIFIÉ</strong></span>
                <span>Signature Numérique : SHA-256</span>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer la Quittance</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
