import React, { useState, useEffect } from 'react';
import { useApp } from '../../lib/store';
import { Student } from '../../types';
import { X, Send, Sparkles, MessageCircle, Smartphone, Mail, Copy, Check, RefreshCw, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';
import { clientFetch } from '../../services/clientFetch.ts';

interface AIReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  trancheName: string;
  trancheAmountDue: number;
  amountPaid: number;
  remainingBalance: number;
  dueDate: string;
}

export const AIReminderModal: React.FC<AIReminderModalProps> = ({
  isOpen,
  onClose,
  student,
  trancheName,
  trancheAmountDue,
  amountPaid,
  remainingBalance,
  dueDate,
}) => {
  const { settings, addCommunication, classes } = useApp();

  const [channel, setChannel] = useState<'WHATSAPP' | 'SMS' | 'EMAIL'>('WHATSAPP');
  const [tone, setTone] = useState<'RAPPEL_COURTOIS' | 'RAPPEL_FERME' | 'URGENT_AVERTISSEMENT'>('RAPPEL_COURTOIS');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const studentClass = classes.find(c => c.id === student?.classId)?.name || 'Classe';

  // Function to call Gemini AI API or fallback
  const generateAIMessage = async () => {
    if (!student) return;
    setIsGenerating(true);

    try {
      const response = await clientFetch('/api/ai/fee-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: `${student.firstName} ${student.lastName}`,
          parentName: student.parentName,
          classLevel: studentClass,
          trancheName,
          trancheAmountDue,
          amountPaid,
          remainingBalance,
          dueDate,
          channel,
          tone,
          schoolName: settings.schoolName,
          mobileMoneyNumber: settings.mobileMoneyNumber || '+229 97 00 00 00'
        })
      });

      const data = await response.json();
      if (data.message) {
        setGeneratedMessage(data.message);
      } else {
        throw new Error('Message vide');
      }
    } catch (error) {
      console.warn('Fallback local AI Fee Reminder:', error);
      // Fallback message matching exact example in prompt
      let defaultToneText = "nous vous prions de bien vouloir régulariser la tranche de scolarité.";
      if (tone === 'RAPPEL_FERME') {
        defaultToneText = "nous vous rappelons que le délai de règlement de la tranche de scolarité est dépassé.";
      } else if (tone === 'URGENT_AVERTISSEMENT') {
        defaultToneText = "AVERTISSEMENT : Sans régularisation sous 48h, l'accès aux cours pourra être temporairement suspendu.";
      }

      const msg = channel === 'SMS'
        ? `SCOLARITÉ ${settings.schoolName}: Cher parent de ${student.firstName} (${studentClass}), tranche ${trancheName}: exigible ${trancheAmountDue.toLocaleString()}F, versé ${amountPaid.toLocaleString()}F, reste ${remainingBalance.toLocaleString()}F à payer avant le ${dueDate}. Mobile Money: ${settings.mobileMoneyNumber || '+229 97 00 00 00'}`
        : `📣 *RAPPEL DE SCOLARITÉ - ${settings.schoolName.toUpperCase()}*\n\n` +
          `Cher parent de *${student.firstName} ${student.lastName}* (${studentClass}),\n\n` +
          `Nous faisons suite à l'état des versements au titre de la *${trancheName}* (Période exigible avant le ${dueDate}) :\n\n` +
          `• Montant exigible : *${trancheAmountDue.toLocaleString()} ${settings.currency}*\n` +
          `• Montant versé à ce jour : *${amountPaid.toLocaleString()} ${settings.currency}*\n` +
          `• *Solde restant à régler : ${remainingBalance.toLocaleString()} ${settings.currency}*\n\n` +
          `${defaultToneText}\n\n` +
          `💳 *Modalités de règlement :*\n` +
          `- Guichet Caisse de l'établissement\n` +
          `- Mobile Money : *${settings.mobileMoneyNumber || '+229 97 00 00 00'}*\n\n` +
          `Nous vous remercions pour votre précieuse collaboration.\n` +
          `_La Comptabilité - ${settings.schoolName}_`;

      setGeneratedMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen && student) {
      generateAIMessage();
    }
  }, [isOpen, student, tone, channel]);

  if (!isOpen || !student) return null;

  const cleanPhone = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const formattedPhone = cleanPhone(student.parentPhone);
    const encodedMsg = encodeURIComponent(generatedMessage);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMsg}`;
    window.open(whatsappUrl, '_blank');

    // Also register in communication log
    addCommunication({
      senderRole: 'COMPTABLE',
      recipients: `Parent de ${student.firstName} ${student.lastName} (${student.parentPhone})`,
      channel: 'WHATSAPP',
      content: generatedMessage
    });

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 2000);
  };

  const handleSendSMS = (e: React.FormEvent) => {
    e.preventDefault();

    addCommunication({
      senderRole: 'COMPTABLE',
      recipients: `Parent de ${student.firstName} ${student.lastName} (${student.parentPhone})`,
      channel,
      content: generatedMessage
    });

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shadow-inner">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base flex items-center space-x-2">
                <span>Relance IA Tranche Scolarité</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                  IA Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Génération de message intelligent pour le parent de <strong className="text-white">{student.lastName} {student.firstName}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          
          {/* Financial Summary Box */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-800/60">
              <span className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                <DollarSign className="h-4 w-4 text-amber-600" />
                <span>Situation : {trancheName}</span>
              </span>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                Échéance : {dueDate}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Tranche Exigible</p>
                <p className="font-black text-slate-900 dark:text-white text-xs mt-0.5">
                  {trancheAmountDue.toLocaleString()} {settings.currency}
                </p>
              </div>

              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Déjà Versé</p>
                <p className="font-black text-emerald-600 text-xs mt-0.5">
                  {amountPaid.toLocaleString()} {settings.currency}
                </p>
              </div>

              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <p className="text-[10px] font-bold text-rose-600 uppercase">Reste à Payer</p>
                <p className="font-black text-rose-600 text-xs mt-0.5">
                  {remainingBalance.toLocaleString()} {settings.currency}
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Channel & Tone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Channel Selection */}
            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1.5">
                Canal de Réception
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('WHATSAPP')}
                  className={`p-2.5 rounded-xl font-extrabold border flex items-center justify-center space-x-1.5 transition-all ${
                    channel === 'WHATSAPP'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('SMS')}
                  className={`p-2.5 rounded-xl font-extrabold border flex items-center justify-center space-x-1.5 transition-all ${
                    channel === 'SMS'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>SMS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('EMAIL')}
                  className={`p-2.5 rounded-xl font-extrabold border flex items-center justify-center space-x-1.5 transition-all ${
                    channel === 'EMAIL'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* Tone Selection */}
            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1.5">
                Tonalité de l'IA
              </label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white"
              >
                <option value="RAPPEL_COURTOIS">😊 Rappel Courtois & Partenarial</option>
                <option value="RAPPEL_FERME">⚠️ Relance Ferme & Échéance Dépassée</option>
                <option value="URGENT_AVERTISSEMENT">🚨 Dernier Avertissement (Mise en demeure)</option>
              </select>
            </div>

          </div>

          {/* AI Generated Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-black text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span>Message Rédigé par l'IA :</span>
              </label>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={generateAIMessage}
                  disabled={isGenerating}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-1 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Régénérer</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={generatedMessage}
              onChange={e => setGeneratedMessage(e.target.value)}
              disabled={isGenerating}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="Génération du message par l'IA..."
            />
          </div>

          {/* Target Parent Information */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between text-[11px]">
            <div>
              <span className="font-bold text-slate-500">Destinataire : </span>
              <span className="font-extrabold text-slate-900 dark:text-white">{student.parentName}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500">Téléphone / WhatsApp : </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{student.parentPhone}</span>
            </div>
          </div>

          {/* Success Banner */}
          {sentSuccess && (
            <div className="p-3 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 rounded-2xl font-bold flex items-center space-x-2 border border-emerald-300">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Relance enregistrée et transmise avec succès à {student.parentName} !</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
            >
              Fermer
            </button>

            {channel === 'WHATSAPP' && (
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                disabled={isGenerating || !generatedMessage}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Ouvrir dans WhatsApp Web/App</span>
              </button>
            )}

            {channel !== 'WHATSAPP' && (
              <button
                type="button"
                onClick={handleSendSMS}
                disabled={isGenerating || !generatedMessage}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 transition-all"
              >
                <Send className="h-4 w-4" />
                <span>Envoyer la Relance ({channel})</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
