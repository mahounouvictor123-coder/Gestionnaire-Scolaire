import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { DailyAccessPaymentModal } from '../components/modals/DailyAccessPaymentModal';
import { initiateKkiapayPayment, getKkiapayCheckoutUrl } from '../lib/kkiapay';
import {
  Zap,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Building2,
  Users,
  MessageSquare,
  FileText,
  HardDrive,
  Download,
  CheckCircle2,
  PhoneCall,
  Phone,
  Mail,
  ChevronRight,
  Calculator,
  ArrowUpRight,
  Smartphone,
  Info,
  Calendar,
  Clock,
  Layers,
  Award,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { SubscriptionPlan } from '../types';

interface SubscriptionsViewProps {
  onNavigate?: (view: string) => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ onNavigate }) => {
  const {
    subscriptionPlans,
    schoolSubscription,
    subscriptionInvoices,
    updateSchoolSubscription,
    validateDailyAccessPayment,
    students,
    teachers,
    settings,
    currentSchool
  } = useApp();

  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<SubscriptionPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDailyAccessModal, setShowDailyAccessModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'CARTE_BANCAIRE' | 'VIREMENT'>('MOBILE_MONEY');
  const [phoneNumber, setPhoneNumber] = useState('01 67 43 03 81');
  const [operator, setOperator] = useState<'MTN' | 'MOOV' | 'CELTIIS' | 'ORANGE' | 'WAVE'>('MTN');
  const [isProcessing, setIsProcessing] = useState(false);
  const [waitingPush, setWaitingPush] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Custom Quote Simulator State
  const [customStudents, setCustomStudents] = useState(1500);
  const [customSchools, setCustomSchools] = useState(2);
  const [customSms, setCustomSms] = useState(5000);
  const [customAiScans, setCustomAiScans] = useState(1000);

  // Selected Invoice for Modal
  const [selectedInvoice, setSelectedInvoice] = useState<typeof subscriptionInvoices[0] | null>(null);

  const activePlan = subscriptionPlans.find(p => p.id === schoolSubscription.planId) || subscriptionPlans[2];

  // Calculate stats
  const totalStudents = students.length;
  const maxStudentsLimit = typeof activePlan.maxStudents === 'number' ? activePlan.maxStudents : 99999;
  const studentUsagePercent = Math.min(100, Math.round((totalStudents / maxStudentsLimit) * 100));

  const smsUsed = schoolSubscription.smsUsedThisMonth || 0;
  const smsLimit = activePlan.smsIncludedMonthly;
  const smsUsagePercent = Math.min(100, Math.round((smsUsed / smsLimit) * 100));

  const aiUsed = schoolSubscription.aiScansUsedThisMonth || 0;
  const aiLimit = activePlan.aiScansIncludedMonthly;
  const aiUsagePercent = Math.min(100, Math.round((aiUsed / aiLimit) * 100));

  const storageUsed = schoolSubscription.storageUsedGb || 1.2;
  const storageLimit = activePlan.storageLimitGb;
  const storageUsagePercent = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  // Custom Quote Price Calculation
  const calculatedCustomMonthly = Math.round(
    (customStudents * 40) + (customSchools * 20000) + (customSms * 8) + (customAiScans * 20)
  );

  const handleOpenSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlanForUpgrade(plan);
    setPaymentSuccess(false);
    setErrorMessage('');
    setShowPaymentModal(true);
  };

  const kkiapayPublic = currentSchool?.kkiapayPublicKey || settings?.kkiapayPublicKey || 'pk_live_kkiapay_educ_7426d81e9093';

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForUpgrade) return;

    setErrorMessage('');
    setIsProcessing(true);
    setWaitingPush(true);

    const price = billingCycle === 'ANNUAL' 
      ? selectedPlanForUpgrade.priceAnnual 
      : selectedPlanForUpgrade.priceMonthly;

    const cleanPhone = phoneNumber.replace(/\s+/g, '') || '0167430381';

    try {
      await initiateKkiapayPayment(
        {
          publicKey: kkiapayPublic,
          sandbox: kkiapayPublic.includes('sand') || kkiapayPublic.includes('test'),
          themeColor: '#059669'
        },
        {
          amount: price,
          phone: cleanPhone,
          reason: `Abonnement ${selectedPlanForUpgrade.name} (${billingCycle === 'ANNUAL' ? '1 an' : '1 mois'}) - ${currentSchool.name}`,
          data: JSON.stringify({
            planId: selectedPlanForUpgrade.id,
            billingCycle,
            schoolId: currentSchool.id
          })
        },
        (resp) => {
          // Success from KKiaPay
          updateSchoolSubscription(selectedPlanForUpgrade.id, billingCycle, paymentMethod);
          if (billingCycle === 'ANNUAL') {
            validateDailyAccessPayment(currentSchool.id, cleanPhone, 365, price);
          } else {
            validateDailyAccessPayment(currentSchool.id, cleanPhone, 30, price);
          }
          setIsProcessing(false);
          setWaitingPush(false);
          setPaymentSuccess(true);
        },
        (err) => {
          setErrorMessage(err?.message || "Paiement KKiaPay non finalisé. Veuillez autoriser le débit sur votre téléphone ou ouvrir le guichet direct.");
          setIsProcessing(false);
          setWaitingPush(false);
        }
      );
    } catch (err: any) {
      setErrorMessage("Impossible d'ouvrir le guichet en popup. Utilisez le lien de paiement direct ci-dessous.");
      setIsProcessing(false);
      setWaitingPush(false);
    }
  };

  const handleOpenDirectCheckout = () => {
    if (!selectedPlanForUpgrade) return;
    const price = billingCycle === 'ANNUAL' 
      ? selectedPlanForUpgrade.priceAnnual 
      : selectedPlanForUpgrade.priceMonthly;
    const cleanPhone = phoneNumber.replace(/\s+/g, '') || '0167430381';
    const url = getKkiapayCheckoutUrl(
      kkiapayPublic,
      price,
      cleanPhone,
      `Abonnement ${selectedPlanForUpgrade.name} - ${currentSchool.name}`,
      kkiapayPublic.includes('sand') || kkiapayPublic.includes('test')
    );
    window.open(url, '_blank');
  };

  const formatPrice = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' ' + (settings.currency || 'FCFA');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 250 FCFA DAILY ACCESS CAROUSEL CARD */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-orange-500/20 border-2 border-amber-400 dark:border-amber-600 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center space-x-1">
              <Zap className="h-4 w-4 fill-slate-950" />
              <span>Paiement Réseau Quotidien • 250 FCFA / jour</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs">
              Inscription : 2000 FCFA (1 semaine offerte)
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Validez votre accès quotidien à la plateforme
          </h2>

          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Tarifs d'accès : <strong>250 FCFA / jour</strong>, <strong>1 250 FCFA / semaine (7 jours)</strong>, <strong>5 000 FCFA / mois (30 jours)</strong> ou <strong>50 000 FCFA / an (365 jours)</strong>. Transferts Mobile Money vers le numéro unique : <strong className="font-mono text-amber-800 dark:text-amber-300">0167430381</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          {onNavigate && (
            <button
              onClick={() => onNavigate('kkiapay')}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              <span>Payer avec KKiaPay</span>
            </button>
          )}

          <button
            onClick={() => setShowDailyAccessModal(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-xl transition-all transform hover:scale-105 shrink-0 cursor-pointer"
          >
            <Zap className="h-5 w-5 fill-slate-950" />
            <span>Valider mon accès à 250f</span>
          </button>
        </div>
      </div>

      {/* Render Daily Access Payment Modal if open */}
      {showDailyAccessModal && (
        <DailyAccessPaymentModal
          isOpen={showDailyAccessModal}
          onClose={() => setShowDailyAccessModal(false)}
        />
      )}

      {/* View Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                ABONNEMENT SAAS PLATEFORME
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                Multi-Écoles & Word IA
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Plans d'Abonnement & Licences Établissement
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Gérez votre formule d'abonnement, suivez vos quotas de notifications SMS & scans d'épreuves Word IA, et débloquez la puissance du réseau multi-établissements.
            </p>
          </div>

          {/* Current Active Plan Badge Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 min-w-[280px] space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Formule Actuelle :</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-black text-[10px] tracking-wider uppercase">
                {schoolSubscription.status}
              </span>
            </div>
            <div className="text-xl font-black text-white flex items-center justify-between">
              <span>{activePlan.name}</span>
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-300" />
              <span>Renouvellement le : <strong>{schoolSubscription.nextRenewalDate}</strong></span>
            </div>
          </div>
        </div>

        {/* Quotas & Usage Bar Row */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Students Quota */}
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Capacité Élèves
              </span>
              <span className="text-white font-bold">{totalStudents} / {activePlan.maxStudents}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${studentUsagePercent}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 text-right">{studentUsagePercent}% utilisé</div>
          </div>

          {/* SMS Quota */}
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                SMS & WhatsApp (Mois)
              </span>
              <span className="text-white font-bold">{smsUsed} / {smsLimit}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${smsUsagePercent}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 text-right">{smsLimit - smsUsed} SMS restants</div>
          </div>

          {/* AI Scans Quota */}
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Scans Épreuves Word IA
              </span>
              <span className="text-white font-bold">{aiUsed} / {aiLimit}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${aiUsagePercent}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 text-right">{aiLimit - aiUsed} scans restants</div>
          </div>

          {/* Storage Quota */}
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                Stockage Cloud
              </span>
              <span className="text-white font-bold">{storageUsed} GB / {storageLimit} GB</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${storageUsagePercent}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 text-right">{storageUsagePercent}% utilisé</div>
          </div>
        </div>
      </div>

      {/* Promoter Direct Support & Free Access Notice */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
            <PhoneCall className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Difficulté de Paiement ou École Partenaire ?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Si le paiement en ligne par Mobile Money ou Carte pose un problème, le <strong>Promoteur de la Plateforme</strong> peut accorder directement un <strong>Accès Libre Gratuit</strong> ou valider un règlement d'urgence par espèces/virement.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <a
            href="tel:+22996287545"
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition-all flex items-center space-x-1.5"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Contacter le Promoteur</span>
          </a>
        </div>
      </div>

      {/* Cycle Toggle Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Pass d'Accès Unique à la Plateforme Scolaire
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choix de durée selon vos besoins : Jour, Semaine, Mois ou Année. Élèves et enseignants illimités.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-400 dark:border-amber-600 text-xs font-black text-amber-900 dark:text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Saisie & Impression Illimitées incluses</span>
        </div>
      </div>

      {/* Subscription Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subscriptionPlans.map((plan) => {
          const isCurrent = schoolSubscription.planId === plan.id;
          const isPopular = plan.recommended;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl flex flex-col justify-between transition-all duration-300 relative bg-white dark:bg-slate-800 border ${
                isPopular
                  ? 'border-emerald-500 shadow-xl ring-2 ring-emerald-500/20'
                  : isCurrent
                  ? 'border-indigo-500 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Popular / Badge Overlay */}
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-[11px] px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {plan.badge || 'Recommandé'}
                </div>
              )}

              {!isPopular && plan.badge && (
                <div className="absolute top-3 right-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">
                  {plan.badge}
                </div>
              )}

              <div className="p-6 space-y-5">
                {/* Header */}
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 min-h-[36px] leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {plan.priceMonthly.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {settings.currency || 'FCFA'} / {
                        plan.id === 'plan-daily' ? '24H (1 Jour)' :
                        plan.id === 'plan-weekly' ? '7 Jours' :
                        plan.id === 'plan-annual' ? '365 Jours (1 An)' : '30 Jours (1 Mois)'
                      }
                    </span>
                  </div>
                </div>

                {/* Quotas Summary Pills */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Élèves max :</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black">ILLIMITÉS</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Enseignants max :</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black">ILLIMITÉS</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>SMS de notification :</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{plan.smsIncludedMonthly.toLocaleString('fr-FR')} SMS</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Scans OCR & IA :</span>
                    <strong className="text-amber-600 dark:text-amber-400">{plan.aiScansIncludedMonthly.toLocaleString('fr-FR')} / période</strong>
                  </div>
                </div>

                {/* Features Checklist */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Fonctionnalités Incluses :
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Forfait Actuel Actif</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenSubscribe(plan)}
                    className={`w-full py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                      isPopular
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <span>Prendre le {plan.name} ({plan.priceMonthly.toLocaleString('fr-FR')} F)</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Feature Comparison Matrix */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              Tableau Comparatif Détaillé des Fonctionnalités
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vérifiez la disponibilité exacte des fonctionnalités selon la licence choisie.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
            Mis à jour pour l'Année 2025-2026
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300 min-w-[220px]">
                  Fonctionnalités Plateforme
                </th>
                {subscriptionPlans.map((p) => (
                  <th key={p.id} className="p-4 font-bold text-slate-900 dark:text-white text-center min-w-[140px]">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
              {/* Category 1 */}
              <tr className="bg-indigo-50/50 dark:bg-indigo-950/20 font-bold text-indigo-950 dark:text-indigo-300">
                <td colSpan={5} className="p-3 uppercase text-[10px] tracking-wider">
                  1. Administration & Gestion des Scolarités
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Effectif Max Élèves & Enseignants</td>
                <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">Illimité</td>
                <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">Illimité</td>
                <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">Illimité</td>
                <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">Illimité</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Bulletins Trimestriels Certifiés (QR Code)</td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Cartes d'Identité Scolaires Plastifiées (Scan QR Code)</td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Scan OCR de Liste de Classe & Note (Export PDF/Excel)</td>
                <td className="p-4 text-center text-slate-600 font-semibold">100 / pass</td>
                <td className="p-4 text-center text-emerald-500 font-semibold">300 / pass</td>
                <td className="p-4 text-center text-emerald-500 font-semibold">1 000 / pass</td>
                <td className="p-4 text-center text-indigo-600 font-bold">5 000 / pass</td>
              </tr>

              {/* Category 2 */}
              <tr className="bg-indigo-50/50 dark:bg-indigo-950/20 font-bold text-indigo-950 dark:text-indigo-300">
                <td colSpan={5} className="p-3 uppercase text-[10px] tracking-wider">
                  2. Pédagogie & Numérisation d'Épreuves Word IA
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Numérisation d'Épreuves Word (Éditeur + Sceau)</td>
                <td className="p-4 text-center text-slate-600 font-semibold">100 / pass</td>
                <td className="p-4 text-center text-emerald-500 font-semibold">300 / pass</td>
                <td className="p-4 text-center text-emerald-500 font-semibold">1 000 / pass</td>
                <td className="p-4 text-center font-bold text-indigo-600">5 000 / pass</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Calcul des Moyennes & Rang Automatique</td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Conseil de Classe Automatique & Mentions</td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>

              {/* Category 3 */}
              <tr className="bg-indigo-50/50 dark:bg-indigo-950/20 font-bold text-indigo-950 dark:text-indigo-300">
                <td colSpan={5} className="p-3 uppercase text-[10px] tracking-wider">
                  3. Communication & Réseau Multi-Écoles
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Notifications SMS / WhatsApp Incluses</td>
                <td className="p-4 text-center font-bold">1 000 SMS</td>
                <td className="p-4 text-center font-bold">2 000 SMS</td>
                <td className="p-4 text-center font-bold text-emerald-600">5 000 SMS</td>
                <td className="p-4 text-center font-bold text-indigo-600">20 000 SMS</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Gestion Réseau Multi-Écoles (Inter-Établissements)</td>
                <td className="p-4 text-center text-slate-400"><X className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-slate-400"><X className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-slate-400"><X className="w-4 h-4 mx-auto" /></td>
                <td className="p-4 text-center text-emerald-500 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Accompagnement & Formation du Personnel sur site</td>
                <td className="p-4 text-center text-slate-600">Email & WhatsApp</td>
                <td className="p-4 text-center text-slate-600">Téléphone 6j/7</td>
                <td className="p-4 text-center text-emerald-600 font-bold">6j/7 Ligne Dédiée</td>
                <td className="p-4 text-center text-indigo-600 font-bold">Chef de Projet VIP</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulator for Custom Quotes / Large Institutions */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/60 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              SIMULATEUR SUR-MESURE GROUPE & MINISTÈRE
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Besoin d'un Devis Personnalisé pour votre Complexe ?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Ajustez vos critères d'effectifs, nombre de sous-établissements et volumes de SMS pour obtenir une estimation instantanée ou commander un devis officiel.
            </p>

            {/* Sliders */}
            <div className="space-y-4 pt-2">
              {/* Students Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-200">
                  <span>Effectif Élèves :</span>
                  <span className="text-emerald-400 font-bold">{customStudents.toLocaleString('fr-FR')} Élèves</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={customStudents}
                  onChange={(e) => setCustomStudents(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Schools Count Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-200">
                  <span>Nombre d'Établissements :</span>
                  <span className="text-indigo-400 font-bold">{customSchools} Écoles / Campus</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={customSchools}
                  onChange={(e) => setCustomSchools(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* SMS Volume Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-200">
                  <span>Volume SMS Mensuel :</span>
                  <span className="text-amber-400 font-bold">{customSms.toLocaleString('fr-FR')} SMS / mois</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={customSms}
                  onChange={(e) => setCustomSms(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 w-full lg:w-80 space-y-5 text-center">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Estimation Forfait Sur-Mesure
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-white">
                {calculatedCustomMonthly.toLocaleString('fr-FR')} <span className="text-sm font-semibold">{settings.currency || 'FCFA'}</span>
              </div>
              <div className="text-[11px] text-emerald-300 font-medium">/ mois (Engagement Annuel)</div>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1 text-left bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
              <div className="flex justify-between">
                <span>Accès Administrateurs :</span>
                <strong className="text-white">Illimité</strong>
              </div>
              <div className="flex justify-between">
                <span>Migration de Données :</span>
                <strong className="text-emerald-400">Offert</strong>
              </div>
              <div className="flex justify-between">
                <span>Formation du Personnel :</span>
                <strong className="text-emerald-400">Incluse</strong>
              </div>
            </div>

            <button
              onClick={() => {
                alert(`Demande de devis officiel envoyée. Contacts Administrateur : +229 0167430381 / 0143754593 | Email: Mahounouservices36@gmail.com`);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Demander un Devis Officiel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Administrator Contact & Payment Instructions Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-indigo-800/60 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Administration Plateforme & Service Client
              </h3>
              <p className="text-xs text-slate-300">
                Contactez la direction ou effectuez vos dépôts d'abonnement directement aux numéros officiels ci-dessous.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold w-fit">
            Support Technique & Validation 24/7
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Box 1: Dépôt Abonnement */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-amber-500/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold uppercase tracking-wider text-[11px]">
              <Smartphone className="w-4 h-4" />
              Numéro pour Dépôts d'Abonnement
            </div>
            <div className="text-xl font-black text-white font-mono tracking-wide">
              {settings.mobileMoneyNumber || '01 67 43 03 81'}
            </div>
            <p className="text-[11px] text-slate-300">
              Transferts direct Mobile Money (MTN MoMo, Moov, Celtiis, Wave). Indiquez le nom de votre école.
            </p>
          </div>

          {/* Box 2: Téléphones Administrateur */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-indigo-700/50 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold uppercase tracking-wider text-[11px]">
              <Phone className="w-4 h-4" />
              Lignes directes Administrateur
            </div>
            <div className="space-y-1 font-mono font-bold text-white text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">+229</span> 01 67 43 03 81
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">+229</span> 01 43 75 45 93
              </div>
            </div>
            <p className="text-[11px] text-slate-300">Appels direct & WhatsApp pour assistance et facturation.</p>
          </div>

          {/* Box 3: Email Officiel */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-teal-700/50 space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-extrabold uppercase tracking-wider text-[11px]">
              <Mail className="w-4 h-4" />
              Email Officiel Support
            </div>
            <div className="text-sm font-bold text-white break-all font-mono">
              Mahounouservices36@gmail.com
            </div>
            <p className="text-[11px] text-slate-300">
              Pour l'envoi des ordres de virement, bons de commande et demandes officielles.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Invoices & History Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Historique des Factures d'Abonnement
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Retrouvez l'historique de vos paiements et téléchargez vos justificatifs officiels.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                <th className="p-3">N° Facture</th>
                <th className="p-3">Date</th>
                <th className="p-3">Désignation du Plan</th>
                <th className="p-3">Période</th>
                <th className="p-3">Moyen de Paiement</th>
                <th className="p-3">Montant</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
              {subscriptionInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 text-xs">
                    Aucune facture disponible pour le moment.
                  </td>
                </tr>
              ) : (
                subscriptionInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-3">{inv.date}</td>
                    <td className="p-3 font-semibold">{inv.planName}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{inv.period}</td>
                    <td className="p-3">{inv.paymentMethod}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {inv.amount.toLocaleString('fr-FR')} {inv.currency}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Reçu PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment & Upgrade Modal */}
      {showPaymentModal && selectedPlanForUpgrade && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                SOUSCRIPTION SÉCURISÉE PLATEFORME
              </div>
              <h3 className="text-xl font-black text-white mt-1">
                Paiement pour : {selectedPlanForUpgrade.name}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Engagement {billingCycle === 'ANNUAL' ? 'Annuel (20% de réduction)' : 'Mensuel'}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {paymentSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">
                    Paiement Confirmé avec Succès !
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
                    Votre licence <strong>{selectedPlanForUpgrade.name}</strong> est immédiatement activée pour {currentSchool.name}.
                  </p>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                  >
                    Fermer et Profiter de la Plateforme
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConfirmPayment} className="space-y-5">
                  {/* Summary Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Plan Sélectionné :</span>
                      <strong className="text-slate-900 dark:text-white">{selectedPlanForUpgrade.name}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Mode de Facturation :</span>
                      <strong className="text-slate-900 dark:text-white">
                        {billingCycle === 'ANNUAL' ? 'Annuel' : 'Mensuel'}
                      </strong>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                      <span>Total à Payer :</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {formatPrice(selectedPlanForUpgrade.priceMonthly)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Sélectionnez un Mode de Paiement :
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('MOBILE_MONEY')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          paymentMethod === 'MOBILE_MONEY'
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Smartphone className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                        <span className="text-[11px] block">Mobile Money</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CARTE_BANCAIRE')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          paymentMethod === 'CARTE_BANCAIRE'
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
                        <span className="text-[11px] block">Carte Visa/Master</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('VIREMENT')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          paymentMethod === 'VIREMENT'
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Building2 className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                        <span className="text-[11px] block">Virement Bancaire</span>
                      </button>
                    </div>
                  </div>

                  {/* Mobile Money Operator & Phone */}
                  {paymentMethod === 'MOBILE_MONEY' && (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-amber-300 dark:border-amber-900/60">
                      <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-extrabold text-amber-800 dark:text-amber-300">
                          <Smartphone className="w-4 h-4 text-amber-600" />
                          <span>Dépôt / Transfert Direct d'Abonnement</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                          Effectuez le dépôt du montant de l'abonnement vers le numéro officiel d'administration : <strong className="text-amber-700 dark:text-amber-300 font-mono text-xs">01 67 43 03 81</strong> (+229 0167430381).
                        </p>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Support Administration : +229 0167430381 / 0143754593 | Mahounouservices36@gmail.com
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5">
                        {(['MTN', 'MOOV', 'CELTIIS', 'WAVE', 'ORANGE'] as const).map((op) => (
                          <button
                            type="button"
                            key={op}
                            onClick={() => setOperator(op)}
                            className={`py-1.5 px-1.5 rounded-lg text-xs font-black border text-center ${
                              operator === op
                                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {op}
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Numéro Débiteur / Payeur {operator} MoMo :
                        </label>
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          placeholder="ex: 01 67 43 03 81"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {waitingPush && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex flex-col space-y-2 text-xs text-amber-900 dark:text-amber-200">
                      <div className="flex items-start space-x-3">
                        <RefreshCw className="h-4 w-4 animate-spin text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-black">Demande envoyée à votre téléphone...</strong>
                          <span>Vérifiez votre mobile ({phoneNumber}) et composez votre code secret Mobile Money pour approuver l'abonnement.</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-amber-200 dark:border-amber-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProcessing(false);
                            setWaitingPush(false);
                            setErrorMessage("Transfert annulé par l'utilisateur. Aucun débit n'a été effectué.");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Annuler le transfert en cas d'erreur</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Payment Action Button */}
                  <div className="space-y-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Lancement de KKiaPay...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-white" />
                          <span>Valider et Payer {formatPrice(billingCycle === 'ANNUAL' ? selectedPlanForUpgrade.priceAnnual : selectedPlanForUpgrade.priceMonthly)}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenDirectCheckout}
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Ouvrir le Guichet KKiaPay dans un nouvel onglet</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProcessing(false);
                        setWaitingPush(false);
                        setShowPaymentModal(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      <span>Annuler le transfert en cas d'erreur</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal Preview */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">Reçu Officiel d'Abonnement SaaS</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Établissement :</span>
                <strong className="text-slate-900 dark:text-white">{currentSchool.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date d'Émission :</span>
                <strong>{selectedInvoice.date}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Formule :</span>
                <strong>{selectedInvoice.planName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Période Couverte :</span>
                <strong>{selectedInvoice.period}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Moyen de Paiement :</span>
                <strong>{selectedInvoice.paymentMethod}</strong>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black">
                <span>Montant Réglé :</span>
                <span className="text-emerald-600">{selectedInvoice.amount.toLocaleString('fr-FR')} {selectedInvoice.currency}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Imprimer / Télécharger le Reçu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
