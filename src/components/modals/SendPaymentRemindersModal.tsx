import React, { useState } from 'react';
import { useApp } from '../../lib/store';
import { X, Send, Bell, CheckCircle2, MessageCircle, Mail, Smartphone, AlertCircle, ShieldAlert } from 'lucide-react';

interface SendPaymentRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SendPaymentRemindersModal: React.FC<SendPaymentRemindersModalProps> = ({
  isOpen,
  onClose
}) => {
  const { students, payments, settings, addCommunication } = useApp();

  const [channel, setChannel] = useState<'WHATSAPP' | 'SMS' | 'EMAIL'>('WHATSAPP');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Find students with remaining balances in payments or default tuition balances
  // Combine payment data to find unpaid students
  const studentUnpaidMap: { [studentId: string]: { totalPaid: number; remaining: number; lastPaymentDate?: string } } = {};

  payments.forEach(p => {
    if (!studentUnpaidMap[p.studentId]) {
      studentUnpaidMap[p.studentId] = { totalPaid: 0, remaining: p.remainingBalance, lastPaymentDate: p.date };
    }
    studentUnpaidMap[p.studentId].totalPaid += p.amountPaid;
    // Update remaining to smallest remaining balance reported
    if (p.remainingBalance < studentUnpaidMap[p.studentId].remaining) {
      studentUnpaidMap[p.studentId].remaining = p.remainingBalance;
    }
  });

  // Students with remaining balance > 0
  const debtors = students.filter(std => {
    const info = studentUnpaidMap[std.id];
    return info && info.remaining > 0;
  });

  // Pre-select all debtors on first render
  React.useEffect(() => {
    if (debtors.length > 0 && selectedStudentIds.length === 0) {
      setSelectedStudentIds(debtors.map(s => s.id));
    }
  }, [debtors.length]);

  const [customMessage, setCustomMessage] = useState(
    `RAPPEL DE SCOLARITÉ - ${settings.schoolName} : Cher parent, nous vous rappelons de bien vouloir régler la tranche de scolarité restante pour votre enfant. Merci de procéder au paiement avant la fin du mois pour éviter toute pénalité.`
  );

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === debtors.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(debtors.map(s => s.id));
    }
  };

  const toggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(i => i !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleSendReminders = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) return;

    // Dispatch reminders to communication store
    const selectedStudentsList = debtors.filter(s => selectedStudentIds.includes(s.id));
    
    selectedStudentsList.forEach(std => {
      const remaining = studentUnpaidMap[std.id]?.remaining || 0;
      const formattedMsg = customMessage
        .replace('{ELEVE}', `${std.firstName} ${std.lastName}`)
        .replace('{SOLDE}', `${remaining.toLocaleString()} ${settings.currency}`);

      addCommunication({
        senderRole: 'COMPTABLE',
        recipients: `Parent de ${std.firstName} ${std.lastName} (${std.parentPhone})`,
        channel: channel,
        content: formattedMsg
      });
    });

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 2500);
  };

  const totalUnpaidSelected = selectedStudentIds.reduce((sum, id) => {
    return sum + (studentUnpaidMap[id]?.remaining || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Rappel Automatique des Tranches de Scolarité</h3>
              <p className="text-xs text-slate-400">Relancez instantanément les parents ayant un solde impayé par SMS / WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSendReminders} className="p-6 space-y-5 text-xs">
          
          {/* Channel Selector */}
          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-2">
              Canal de Diffusion
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setChannel('WHATSAPP')}
                className={`p-3 rounded-xl font-extrabold border flex items-center justify-center space-x-2 transition-all ${
                  channel === 'WHATSAPP'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('SMS')}
                className={`p-3 rounded-xl font-extrabold border flex items-center justify-center space-x-2 transition-all ${
                  channel === 'SMS'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span>SMS Direct</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('EMAIL')}
                className={`p-3 rounded-xl font-extrabold border flex items-center justify-center space-x-2 transition-all ${
                  channel === 'EMAIL'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Mail className="h-4 w-4" />
                <span>Email Officiel</span>
              </button>
            </div>
          </div>

          {/* Message Template */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Contenu du Message de Relance
              </label>
              <button
                type="button"
                onClick={() => {
                  setCustomMessage(
                    `RAPPEL DE SCOLARITÉ - ${settings.schoolName} : Cher parent de {ELEVE}, au titre de la tranche de scolarité, vous avez un solde restant à régulariser de {SOLDE}. Merci de bien vouloir procéder au paiement à la caisse ou via Mobile Money pour être à jour.`
                  );
                }}
                className="text-amber-600 font-extrabold text-[11px] hover:underline flex items-center space-x-1"
              >
                <span>✨ Générer Modèle via IA</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mb-1">
              Variables automatiques disponibles : <code className="text-blue-600 font-bold">{'{ELEVE}'}</code>, <code className="text-emerald-600 font-bold">{'{SOLDE}'}</code>
            </p>
            <textarea
              rows={3}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
            />
          </div>

          {/* Student Debtors List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                Parents à Relancer ({selectedStudentIds.length} / {debtors.length})
              </span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-blue-600 font-bold hover:underline text-[11px]"
              >
                {selectedStudentIds.length === debtors.length ? 'Tout décocher' : 'Tout sélectionner'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900">
              {debtors.length === 0 ? (
                <div className="p-4 text-center text-slate-500 font-bold">
                  Aucun reliquat de scolarité impayé pour le moment !
                </div>
              ) : (
                debtors.map(std => {
                  const unpaid = studentUnpaidMap[std.id]?.remaining || 0;
                  const isChecked = selectedStudentIds.includes(std.id);
                  return (
                    <div
                      key={std.id}
                      onClick={() => toggleStudent(std.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked ? 'bg-amber-50/80 dark:bg-amber-950/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">
                            {std.lastName} {std.firstName}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Parent: <span className="font-semibold text-slate-700 dark:text-slate-300">{std.parentName}</span> ({std.parentPhone})
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-rose-600 text-xs">
                          {unpaid.toLocaleString()} {settings.currency}
                        </span>
                        <p className="text-[9px] text-slate-400">Solde Restant</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span className="font-bold">Total des créances sélectionnées :</span>
            </div>
            <span className="font-black text-sm text-rose-700 dark:text-rose-400">
              {totalUnpaidSelected.toLocaleString()} {settings.currency}
            </span>
          </div>

          {/* Success Banner */}
          {sentSuccess && (
            <div className="p-3 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 rounded-xl font-bold flex items-center space-x-2 border border-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{selectedStudentIds.length} rappel(s) transmis avec succès via {channel} !</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={selectedStudentIds.length === 0}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold flex items-center space-x-1.5 shadow"
            >
              <Send className="h-4 w-4" />
              <span>Envoyer les Rappels ({selectedStudentIds.length})</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
