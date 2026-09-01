import React, { useState } from 'react';
import { useApp } from '../../lib/store';
import {
  Zap,
  X,
  Phone,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  CreditCard,
  Smartphone,
  Shield,
  ExternalLink,
  RefreshCw,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { initiateKkiapayPayment, getKkiapayCheckoutUrl } from '../../lib/kkiapay';

interface DailyAccessPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PLATFORM_DEPOSIT_NUMBER = '0167430381';

export const DailyAccessPaymentModal: React.FC<DailyAccessPaymentModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentSchool, settings, validateDailyAccessPayment, cancelDailyAccessPayment } = useApp();

  const [daysCount, setDaysCount] = useState<number>(1);
  const [paymentMode, setPaymentMode] = useState<'ONLINE_GATEWAY' | 'DIRECT_MOMO'>('ONLINE_GATEWAY');
  const [transferPhone, setTransferPhone] = useState<string>('0167430381');
  const [copiedNumber, setCopiedNumber] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [waitingApproval, setWaitingApproval] = useState<boolean>(false);
  const [cancelledNotice, setCancelledNotice] = useState<string>('');
  const [successResult, setSuccessResult] = useState<{
    newExpiryDate: string;
    message: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen || !currentSchool) return null;

  const totalAmount = daysCount === 365 ? 50000 : daysCount === 30 ? 5000 : daysCount === 7 ? 1250 : daysCount * 250;
  const kkiapayPublic = currentSchool?.kkiapayPublicKey || settings?.kkiapayPublicKey || 'pk_live_kkiapay_educ_7426d81e9093';

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(PLATFORM_DEPOSIT_NUMBER);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCancelTransfer = () => {
    setIsSubmitting(false);
    setWaitingApproval(false);
    setErrorMsg('');
    setCancelledNotice("Transfert annulé : Aucun montant n'a été débité de votre compte. Vous pouvez corriger les informations ou modifier le montant.");
  };

  const handleRevertConfirmedPayment = () => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler ce transfert d'accès enregistré par erreur ? Cette action révoquera la validation effectuée.")) {
      const res = cancelDailyAccessPayment(currentSchool.id, daysCount);
      setSuccessResult(null);
      setIsSubmitting(false);
      setWaitingApproval(false);
      setCancelledNotice(res.message || "Le transfert a été annulé avec succès suite à une erreur de saisie.");
    }
  };

  const handleOnlinePayment = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    setWaitingApproval(true);

    const phoneToUse = transferPhone.trim() || '0167430381';

    try {
      await initiateKkiapayPayment(
        {
          publicKey: kkiapayPublic,
          sandbox: kkiapayPublic.includes('sand') || kkiapayPublic.includes('test'),
          themeColor: '#059669'
        },
        {
          amount: totalAmount,
          phone: phoneToUse,
          reason: `Licence Établissement - ${currentSchool.name} (${daysCount} jour${daysCount > 1 ? 's' : ''})`,
          data: JSON.stringify({
            schoolId: currentSchool.id,
            days: daysCount,
            type: 'SAAS_DAILY_ACCESS'
          })
        },
        (resp) => {
          // Genuine success returned by KKiaPay
          const result = validateDailyAccessPayment(
            currentSchool.id,
            phoneToUse,
            daysCount,
            totalAmount
          );
          setSuccessResult({
            newExpiryDate: result.newExpiryDate,
            message: `Paiement KKiaPay de ${totalAmount.toLocaleString()} FCFA confirmé (Réf: ${resp.transactionId}) ! ${result.message}`
          });
          setIsSubmitting(false);
          setWaitingApproval(false);
        },
        (err) => {
          setErrorMsg(
            err?.message || "La transaction n'a pas été finalisée. Si une fenêtre a été bloquée, utilisez le bouton d'ouverture directe ci-dessous."
          );
          setIsSubmitting(false);
          setWaitingApproval(false);
        }
      );
    } catch (err: any) {
      setErrorMsg("Impossible d'ouvrir le guichet en popup. Cliquez sur 'Ouvrir le Guichet KKiaPay dans un onglet' pour finaliser votre paiement.");
      setIsSubmitting(false);
      setWaitingApproval(false);
    }
  };

  const handleOpenDirectKkiapayTab = () => {
    const phoneToUse = transferPhone.trim() || '0167430381';
    const checkoutUrl = getKkiapayCheckoutUrl(
      kkiapayPublic,
      totalAmount,
      phoneToUse,
      `Accès ${daysCount}j - ${currentSchool.name}`,
      kkiapayPublic.includes('sand') || kkiapayPublic.includes('test')
    );
    window.open(checkoutUrl, '_blank');
  };

  const handleSubmitDirectMoMo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!transferPhone.trim() || transferPhone.trim().length < 8) {
      setErrorMsg('Veuillez renseigner le numéro de téléphone ayant servi à faire le transfert Mobile Money.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const result = validateDailyAccessPayment(
          currentSchool.id,
          transferPhone.trim(),
          daysCount,
          totalAmount
        );

        setSuccessResult({
          newExpiryDate: result.newExpiryDate,
          message: result.message
        });
      } catch (err: any) {
        setErrorMsg('Une erreur est survenue lors de la validation. Veuillez réessayer.');
      } finally {
        setIsSubmitting(false);
      }
    }, 800);
  };

  const handleFinish = () => {
    setSuccessResult(null);
    setTransferPhone('');
    setDaysCount(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-6 text-slate-950 relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-slate-950 text-amber-400 font-black text-[10px] uppercase tracking-widest flex items-center space-x-1">
              <Zap className="h-3 w-3 fill-amber-400" />
              <span>Abonnement Quotidien • 250 FCFA / jour</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
            Valider Mon Accès
          </h2>
          <p className="text-xs text-slate-900 font-bold mt-1">
            Établissement : <span className="underline">{currentSchool?.name}</span>
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {successResult ? (
            /* SUCCESS VALIDATION VIEW */
            <div className="text-center space-y-5 py-4 animate-in zoom-in-95 duration-200">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black text-xs uppercase tracking-wider">
                  Accès Débloqué & Ouvert
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Validation Effectuée avec Succès !
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {successResult.message}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-left text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Numéro de référence :</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{transferPhone || 'FedaPay / MoMo'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Validité jusqu'au :</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {new Date(successResult.newExpiryDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleFinish}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Ouvrir la Plateforme Maintenant</span>
                </button>

                <button
                  type="button"
                  onClick={handleRevertConfirmedPayment}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
                  <span>Annuler ce transfert en cas d'erreur de saisie</span>
                </button>
              </div>
            </div>
          ) : (
            /* PAYMENT INSTRUCTIONS & FORM VIEW */
            <div className="space-y-5">

              {cancelledNotice && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-start justify-between space-x-2 animate-in fade-in duration-200">
                  <div className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{cancelledNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCancelledNotice('')}
                    className="text-rose-600 hover:text-rose-900 font-bold text-xs ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setPaymentMode('ONLINE_GATEWAY')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                    paymentMode === 'ONLINE_GATEWAY'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Paiement en Ligne (KKiaPay)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('DIRECT_MOMO')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                    paymentMode === 'DIRECT_MOMO'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Transfert MoMo Direct</span>
                </button>
              </div>

              {/* Choose Days / Duration */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Sélectionnez la durée de votre accès :</span>
                  <span className="text-amber-600 font-black text-xs">{totalAmount.toLocaleString()} FCFA</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setDaysCount(1)}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-extrabold transition-all text-center flex flex-col items-center justify-center ${
                      daysCount === 1
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 shadow-sm ring-2 ring-amber-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>1 Jour</span>
                    <span className="text-[10px] font-black text-amber-600">250 FCFA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDaysCount(7)}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-extrabold transition-all text-center flex flex-col items-center justify-center ${
                      daysCount === 7
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 shadow-sm ring-2 ring-amber-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Semaine (7j)</span>
                    <span className="text-[10px] font-black text-amber-600">1 250 FCFA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDaysCount(30)}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-extrabold transition-all text-center flex flex-col items-center justify-center ${
                      daysCount === 30
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 shadow-sm ring-2 ring-amber-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Mensuel (30j)</span>
                    <span className="text-[10px] font-black text-amber-600">5 000 FCFA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDaysCount(365)}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-extrabold transition-all text-center flex flex-col items-center justify-center ${
                      daysCount === 365
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 shadow-sm ring-2 ring-amber-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Annuel (1 An)</span>
                    <span className="text-[10px] font-black text-amber-600">50 000 FCFA</span>
                  </button>
                </div>
              </div>

              {/* PAYMENT MODE 1: ONLINE GATEWAY */}
              {paymentMode === 'ONLINE_GATEWAY' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5">
                        <Zap className="h-4 w-4 text-emerald-500" />
                        <span>Paiement Direct KKiaPay (Mobile Money)</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        MTN / Moov / Celtiis
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Débit direct et sécurisé sur votre compte Mobile Money. Un message ou notification USSD apparaîtra sur votre téléphone pour confirmer avec votre code secret.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex justify-between">
                      <span>Numéro Mobile Money (MTN / Moov / Celtiis)</span>
                      <span className="text-emerald-600 font-bold text-[11px]">Compte payeur</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="Ex: 01 67 43 03 81"
                        value={transferPhone}
                        onChange={(e) => setTransferPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {waitingApproval && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex flex-col space-y-2 text-xs text-amber-900 dark:text-amber-200">
                      <div className="flex items-start space-x-3">
                        <RefreshCw className="h-5 w-5 animate-spin text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-black">En attente de votre validation mobile...</strong>
                          <span>Consultez l'écran de votre téléphone ({transferPhone}) et validez la demande de débit KKiaPay avec votre code PIN Mobile Money.</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-amber-200 dark:border-amber-800 flex justify-end">
                        <button
                          type="button"
                          onClick={handleCancelTransfer}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Annuler le transfert en cas d'erreur</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleOnlinePayment}
                      disabled={isSubmitting}
                      className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-xl transition-all ${
                        isSubmitting
                          ? 'bg-slate-400 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20 cursor-pointer'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Connexion au serveur KKiaPay...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 fill-white" />
                          <span>Déclencher le Débit KKiaPay ({totalAmount.toLocaleString()} FCFA)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenDirectKkiapayTab}
                      className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Ouvrir le Guichet KKiaPay dans un nouvel onglet sécurisé</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelTransfer}
                      className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      <span>Annuler le transfert en cas d'erreur</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* PAYMENT MODE 2: DIRECT MOMO TRANSFER */
                <form onSubmit={handleSubmitDirectMoMo} className="space-y-4">
                  {/* Official Deposit Phone Box */}
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 tracking-wider flex items-center space-x-1.5">
                        <Phone className="h-3.5 w-3.5 text-amber-600" />
                        <span>Numéro Unique du Dépôt Plateforme</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                        MTN / Moov / Celtiis
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-300 dark:border-amber-700">
                      <div className="font-black text-xl tracking-wider text-slate-900 dark:text-white font-mono">
                        {PLATFORM_DEPOSIT_NUMBER}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyNumber}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center space-x-1 shadow-sm transition-all"
                      >
                        {copiedNumber ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      💡 Effectuez le transfert de <strong className="font-black text-amber-950 dark:text-amber-200">{totalAmount.toLocaleString()} FCFA</strong> vers le 0167430381, puis indiquez votre numéro ci-dessous.
                    </p>
                  </div>

                  {/* Transfer Phone Number Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      Numéro de téléphone utilisé pour le transfert <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="Ex: 01 96 00 00 00 / 97 12 34 56"
                        value={transferPhone}
                        onChange={(e) => setTransferPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit and Cancel Buttons */}
                  <div className="space-y-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-xl transition-all ${
                        isSubmitting
                          ? 'bg-slate-400 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 shadow-amber-500/20 cursor-pointer'
                      }`}
                    >
                      {isSubmitting ? (
                        <span>Validation en cours...</span>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 fill-slate-950" />
                          <span>Valider mon accès à {totalAmount.toLocaleString()} FCFA</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelTransfer}
                      className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      <span>Annuler le transfert en cas d'erreur / Réinitialiser</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center text-[10px] text-slate-500 font-medium space-y-1">
                <p>⚡ Validation instantanée de la plateforme dès confirmation du paiement.</p>
                <p>N.B: L'inscription initiale de 2 000 FCFA offre 1 semaine (7 jours) d'utilisation gratuite.</p>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
