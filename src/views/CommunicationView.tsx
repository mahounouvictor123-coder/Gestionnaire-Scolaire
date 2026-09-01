import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { MessageSquare, Send, CheckCircle2, PhoneCall, Clock, CheckCheck, MessageCircle, Mail, Smartphone } from 'lucide-react';

export const CommunicationView: React.FC = () => {
  const { communications, addCommunication } = useApp();
  const [channel, setChannel] = useState<'SMS' | 'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [recipientGroup, setRecipientGroup] = useState('ALL_PARENTS');
  const [messageText, setMessageText] = useState("Chers parents, nous vous rappelons que la réunion parents-enseignants du premier trimestre aura lieu ce samedi à 09h00.");
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    let recipientsLabel = 'Tous les Parents d\'Élèves';
    if (recipientGroup === 'UNPAID_PARENTS') recipientsLabel = 'Parents avec Reliquat De Scolarité';
    if (recipientGroup === 'COLLEGE_PARENTS') recipientsLabel = 'Parents du Collège';
    if (recipientGroup === 'TEACHERS') recipientsLabel = 'Enseignants & Personnel';

    addCommunication({
      senderRole: 'DIRECTOR',
      recipients: recipientsLabel,
      channel: channel,
      content: messageText
    });

    setSentSuccess(true);
    setMessageText('');
    setTimeout(() => setSentSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            <span>Communication SMS & WhatsApp aux Parents</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Envoi de convocations, rappels de scolarité et bulletins d'information instantanés.
          </p>
        </div>
      </div>

      {/* Message Dispatch Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Canal d'Envoi</label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white"
              >
                <option value="WHATSAPP">WhatsApp Direct Business</option>
                <option value="SMS">SMS Pro Massif (Orange/MTN/Moov)</option>
                <option value="EMAIL">Email Professionnel</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Destinataires</label>
              <select
                value={recipientGroup}
                onChange={e => setRecipientGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white"
              >
                <option value="ALL_PARENTS">Tous les Parents d'Élèves (120 contacts)</option>
                <option value="UNPAID_PARENTS">Parents avec Reliquat de Scolarité (28 contacts)</option>
                <option value="COLLEGE_PARENTS">Parents du Collège (45 contacts)</option>
                <option value="TEACHERS">Enseignants & Personnel (18 contacts)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Message à diffuser</label>
            <textarea
              rows={4}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Rédigez votre message d'information ou convocation..."
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between">
            {sentSuccess && (
              <span className="text-emerald-600 font-bold flex items-center space-x-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Message enregistré et diffusé avec succès !</span>
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center space-x-2 shadow-md ml-auto"
            >
              <Send className="h-4 w-4" />
              <span>Diffuser le Message Maintenant</span>
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2 border-b pb-3">
          <CheckCheck className="h-4 w-4 text-emerald-600" />
          <span>Historique des Messages Diffusés ({communications.length})</span>
        </h3>

        <div className="space-y-3">
          {communications.map(msg => (
            <div key={msg.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] flex items-center space-x-1 ${
                    msg.channel === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    msg.channel === 'SMS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {msg.channel === 'WHATSAPP' && <MessageCircle className="h-3 w-3" />}
                    {msg.channel === 'SMS' && <Smartphone className="h-3 w-3" />}
                    {msg.channel === 'EMAIL' && <Mail className="h-3 w-3" />}
                    <span>{msg.channel}</span>
                  </span>

                  <span className="font-bold text-slate-900 dark:text-white">
                    À : {msg.recipients}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{msg.sentAt}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 font-bold">
                    {msg.deliveryCount} Livrés
                  </span>
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                "{msg.content}"
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

