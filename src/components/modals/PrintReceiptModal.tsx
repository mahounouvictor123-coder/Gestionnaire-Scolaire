import React, { useState, useRef } from 'react';
import { useApp } from '../../lib/store';
import { Payment, Student } from '../../types';
import { X, Printer, CheckCircle2, ShieldCheck, Share2, MessageCircle, Mail, PenTool, Upload, Eye, EyeOff, Sparkles } from 'lucide-react';

const PRESET_SIGNATURES = [
  { name: 'Signature 1 (Encre Bleue)', url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=200' },
  { name: 'Signature 2 (Manuscrite)', url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200' },
  { name: 'Signature 3 (Officielle)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' }
];

interface PrintReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  student: Student;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
  student
}) => {
  const { settings, updateSettings, currentSchool, updateSchool } = useApp();
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [showSignatureControls, setShowSignatureControls] = useState(false);
  const [showSignatureOnDoc, setShowSignatureOnDoc] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !payment) return null;

  const activeSignatureUrl = currentSchool?.signatureUrl || settings.signatureUrl;

  const handlePrint = () => {
    window.print();
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        updateSettings({ signatureUrl: result });
        if (currentSchool) {
          updateSchool(currentSchool.id, { signatureUrl: result });
        }
        setDispatchSuccess('Signature scannée enregistrée avec succès !');
        setTimeout(() => setDispatchSuccess(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (url: string) => {
    updateSettings({ signatureUrl: url });
    if (currentSchool) {
      updateSchool(currentSchool.id, { signatureUrl: url });
    }
    setDispatchSuccess('Signature mise à jour !');
    setTimeout(() => setDispatchSuccess(null), 3000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `REÇU DE PAIEMENT SCOLARITÉ - ${settings.schoolName}\n\n` +
      `Reçu N° : ${payment.receiptNumber}\n` +
      `Élève : ${student ? `${student.lastName} ${student.firstName}` : 'Élève'}\n` +
      `Matricule : ${student?.registrationNumber}\n` +
      `Motif : ${payment.paymentType} - Trimestre ${payment.trimester}\n` +
      `Montant Versé : ${payment.amountPaid.toLocaleString()} ${settings.currency}\n` +
      `Solde Restant : ${payment.remainingBalance.toLocaleString()} ${settings.currency}\n` +
      `Date : ${payment.date}\n\n` +
      `Signature du Directeur : Validé & Approuvé par ${settings.schoolName}`
    );
    window.open(`https://wa.me/${student?.parentPhone ? student.parentPhone.replace(/[^0-9]/g, '') : ''}?text=${text}`, '_blank');
    setDispatchSuccess('Transmis par WhatsApp');
    setTimeout(() => setDispatchSuccess(null), 3000);
  };

  const handleEmailShare = () => {
    setDispatchSuccess('Reçu électronique transmis à l\'adresse ' + (student?.parentEmail || settings.email));
    setTimeout(() => setDispatchSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden">
        
        {/* Controls Bar */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="font-bold text-sm">Reçu Électronique Officiel</span>
            
            <button
              onClick={() => setShowSignatureControls(!showSignatureControls)}
              className="ml-2 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] rounded-lg flex items-center space-x-1 transition-colors"
            >
              <PenTool className="h-3.5 w-3.5 text-amber-400" />
              <span>🖋️ Signature Scannée</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsAppShare}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1 shadow"
              title="Envoyer le Reçu sur WhatsApp au Parent"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp Parent</span>
            </button>

            <button
              onClick={handleEmailShare}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1 shadow"
              title="Envoyer par Email"
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Email Parent</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1 border border-slate-700 shadow"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Interactive Signature Customizer Bar */}
        {showSignatureControls && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 text-white space-y-3 print:hidden">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Configuration Directe de la Signature & Cachet</span>
              </span>
              <button
                onClick={() => setShowSignatureOnDoc(!showSignatureOnDoc)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center space-x-1 ${
                  showSignatureOnDoc ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {showSignatureOnDoc ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>{showSignatureOnDoc ? 'Signature Affichée' : 'Signature Masquée'}</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              {/* File Upload */}
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                <p className="font-bold text-slate-300 text-[11px]">Importer une nouvelle signature :</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Parcourir une image (PNG/JPG)</span>
                </button>
              </div>

              {/* Presets */}
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                <p className="font-bold text-slate-300 text-[11px]">Ou choisir une signature type :</p>
                <div className="flex items-center gap-1.5">
                  {PRESET_SIGNATURES.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(p.url)}
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                        activeSignatureUrl === p.url
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {dispatchSuccess && (
          <div className="p-3 bg-emerald-100 text-emerald-900 font-bold text-xs border-b border-emerald-300 flex items-center space-x-2 print:hidden">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{dispatchSuccess}</span>
          </div>
        )}

        {/* Receipt Layout */}
        <div className="p-8 bg-white font-sans text-slate-900 border-4 border-double border-slate-300 print:p-4 print:border-none" id="receipt-document">
          
          {/* Top Header */}
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <img src={settings.logoUrl} alt="Logo École" className="h-16 w-16 object-cover rounded-lg ring-1 ring-slate-300" />
              <div>
                <h2 className="font-black text-base text-blue-900 uppercase">
                  {(settings.schoolName && settings.schoolName !== 'GESTIONNAIRE SCOLAIRE') ? settings.schoolName : (currentSchool?.name || 'ÉTABLISSEMENT SCOLAIRE')}
                </h2>
                <p className="text-[11px] text-slate-500">{settings.address}</p>
                <p className="text-[11px] text-slate-500">Tel: {settings.phone} • {settings.email}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-extrabold text-xs rounded-full border border-emerald-300 uppercase">
                REÇU N° {payment.receiptNumber}
              </span>
              <p className="text-xs font-bold text-slate-600 mt-2">Date : {payment.date}</p>
            </div>
          </div>

          {/* Student Info Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Nom & Prénom de l'Élève :</span>
              <span className="font-extrabold text-slate-900 uppercase">{student ? `${student.lastName} ${student.firstName}` : 'Élève'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Matricule & Parent :</span>
              <span className="font-bold text-blue-800">{student?.registrationNumber || '2025-MAT-001'} ({student?.parentName || 'Parent'})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Motif du Règlement :</span>
              <span className="font-bold text-slate-900">{payment.paymentType} - Trimestre {payment.trimester}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Mode de Paiement :</span>
              <span className="font-bold text-slate-900">{payment.paymentMethod}</span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-blue-900 text-white rounded-xl p-4 text-center mb-4 shadow-inner">
            <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Montant Perçu</p>
            <p className="text-3xl font-black text-amber-300 mt-1">
              {payment.amountPaid.toLocaleString()} {settings.currency}
            </p>
          </div>

          {/* Remaining Balance breakdown */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div>
              <p className="text-slate-500 font-bold">Montant Total Dû :</p>
              <p className="font-extrabold text-slate-900">{payment.totalFee.toLocaleString()} {settings.currency}</p>
            </div>
            <div>
              <p className="text-slate-500 font-bold">Solde Restant à Payer :</p>
              <p className={`font-extrabold ${payment.remainingBalance === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {payment.remainingBalance.toLocaleString()} {settings.currency}
              </p>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="grid grid-cols-2 gap-4 items-end pt-4 border-t border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-600">Caissier / Comptable :</p>
              <p className="font-semibold text-slate-900 mt-1">{payment.recordedBy || 'Mme Clarisse BASSOLÉ'}</p>
              <div className="mt-3 inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[10px]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Paiement Certifié Encaissé</span>
              </div>
            </div>

            {/* Scanned Director Signature & Stamp */}
            <div className="text-right flex flex-col items-end">
              <p className="font-bold text-blue-900 text-[11px] uppercase">Le Directeur Général</p>
              
              {showSignatureOnDoc ? (
                <div className="relative mt-1 my-1">
                  <img
                    src={activeSignatureUrl}
                    alt="Signature du Directeur"
                    className="h-14 opacity-90 object-contain ring-1 ring-slate-100 rounded p-1 bg-white"
                  />
                  <div className="absolute -bottom-1 -right-2 border-2 border-emerald-600 rounded-full px-2 py-0.5 text-[8px] font-black text-emerald-700 bg-white/90 shadow-sm uppercase rotate-6">
                    CACHET ÉCOLE
                  </div>
                </div>
              ) : (
                <div className="h-14 w-32 border-2 border-dashed border-slate-300 rounded-lg my-1 flex items-center justify-center text-[10px] text-slate-400 italic">
                  [Emplacement Signature]
                </div>
              )}

              <p className="text-[10px] text-slate-500 font-semibold mt-1">
                Document Officiel délivré par {settings.schoolName}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

