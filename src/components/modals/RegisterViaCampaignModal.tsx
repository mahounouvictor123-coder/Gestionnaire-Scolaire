import React, { useState, useEffect } from 'react';
import { useApp } from '../../lib/store';
import { RegistrationCampaign, School } from '../../types';
import { generateValidPassword } from '../../lib/passwordUtils';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Phone,
  Mail,
  MapPin,
  Lock,
  User,
  KeyRound,
  X,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Tag,
  Gift
} from 'lucide-react';

interface RegisterViaCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCampaignCode?: string;
  onRegisteredSuccess?: (school: School) => void;
}

export const RegisterViaCampaignModal: React.FC<RegisterViaCampaignModalProps> = ({
  isOpen,
  onClose,
  initialCampaignCode,
  onRegisteredSuccess
}) => {
  const { campaigns, registerSchoolViaCampaign } = useApp();

  const [campaignCodeInput, setCampaignCodeInput] = useState<string>(initialCampaignCode || '');
  const [selectedCampaign, setSelectedCampaign] = useState<RegistrationCampaign | null>(null);

  const [schoolName, setSchoolName] = useState('');
  const [schoolType, setSchoolType] = useState('Complexe Scolaire');
  const [city, setCity] = useState('Cotonou');
  const [address, setAddress] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [directorPhone, setDirectorPhone] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [accessPassword, setAccessPassword] = useState(() => generateValidPassword());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredSchool, setRegisteredSchool] = useState<School | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync campaign from code input
  useEffect(() => {
    const code = (initialCampaignCode || campaignCodeInput || '').trim().toUpperCase();
    if (code) {
      setCampaignCodeInput(code);
      const found = campaigns.find(c => c.code.toUpperCase() === code || c.id.toUpperCase() === code);
      setSelectedCampaign(found || null);
    } else if (campaigns.length > 0) {
      setSelectedCampaign(campaigns[0]);
      setCampaignCodeInput(campaigns[0].code);
    }
  }, [initialCampaignCode, campaigns]);

  if (!isOpen) return null;

  const handleSelectCampaign = (camp: RegistrationCampaign) => {
    setSelectedCampaign(camp);
    setCampaignCodeInput(camp.code);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!schoolName.trim()) {
      setErrorMessage("Veuillez saisir le nom officiel de votre établissement.");
      return;
    }
    if (!directorName.trim()) {
      setErrorMessage("Veuillez renseigner le nom et prénom du Directeur / Fondateur.");
      return;
    }
    if (!directorPhone.trim()) {
      setErrorMessage("Veuillez indiquer le numéro de téléphone WhatsApp de contact.");
      return;
    }

    setIsSubmitting(true);

    try {
      const activeCode = selectedCampaign?.code || campaignCodeInput || 'CAMP-DIRECT';
      const res = registerSchoolViaCampaign({
        campaignCode: activeCode,
        name: schoolName.trim(),
        schoolType: schoolType,
        city: city.trim() || 'Cotonou',
        address: address.trim() || undefined,
        phone: directorPhone.trim(),
        email: schoolEmail.trim() || undefined,
        directorName: directorName.trim(),
        accessPassword: accessPassword.trim() || generateValidPassword()
      });

      if (res.success && res.school) {
        setRegisteredSchool(res.school);
        if (onRegisteredSuccess) {
          onRegisteredSuccess(res.school);
        }
      } else {
        setErrorMessage(res.message || "Erreur lors de la soumission de l'inscription.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur inattendue est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const promoterWhatsAppUrl = registeredSchool
    ? `https://wa.me/2290143754593?text=${encodeURIComponent(
        `Bonjour M. Victor MAHOUNOU (Promoteur Général),\n\nJ'ai soumis l'inscription de notre école « ${registeredSchool.name} » (${registeredSchool.city}) via la campagne « ${registeredSchool.campaignCode || 'Réseau Scolaire'} ».\n\n👤 Directeur : ${registeredSchool.directorName}\n📞 Téléphone : ${registeredSchool.phone}\n🆔 ID Demande : ${registeredSchool.id}\n\nMerci de bien vouloir autoriser et valider notre accès sur la plateforme.`
      )}`
    : `https://wa.me/2290143754593?text=${encodeURIComponent(
        `Bonjour M. le Promoteur, je souhaite autoriser l'accès pour mon école inscrite via la campagne.`
      )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        
        {/* Header Ribbon */}
        <div className="relative bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide uppercase mb-3">
            <Gift className="h-3.5 w-3.5 text-amber-400" />
            <span>Adhésion Réseau Scolaire • Offre Campagne</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
            Inscription d'Établissement par Campagne
          </h2>
          
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            Inscrivez votre école via un lien ou code de campagne promotionnelle. Votre établissement sera enregistré et accessible dès autorisation du Promoteur.
          </p>

          {selectedCampaign && (
            <div className="mt-4 p-3 rounded-2xl bg-blue-900/40 border border-blue-400/20 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-black text-white">{selectedCampaign.name}</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                {selectedCampaign.code}
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* SUCCESS SCREEN */}
          {registeredSchool ? (
            <div className="space-y-6 animate-in zoom-in-95 duration-300 text-center py-2">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/10">
                <Clock className="h-10 w-10 animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-black">
                  <span>⏳ STATUT : EN ATTENTE D'AUTORISATION DU PROMOTEUR</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Demande d'Inscription Enregistrée !
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                  L'établissement <strong className="text-slate-900 dark:text-white">« {registeredSchool.name} »</strong> figure désormais sur la plateforme sous statut protégé.
                </p>
              </div>

              {/* School Summary Box */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-left space-y-2.5 text-xs font-semibold">
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">École inscrite :</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{registeredSchool.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Directeur / Responsable :</span>
                  <span className="font-bold text-slate-900 dark:text-white">{registeredSchool.directorName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Téléphone WhatsApp :</span>
                  <span className="font-bold text-slate-900 dark:text-white">{registeredSchool.phone}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Campagne d'origine :</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{registeredSchool.campaignCode || 'Campagne Directe'}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500">Mot de passe de connexion généré :</span>
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm tracking-wider">{registeredSchool.accessPassword}</span>
                </div>
              </div>

              {/* Instruction banner */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-left text-xs space-y-1.5">
                <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200 font-black">
                  <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Validation & Autorisation Promoteur requise :</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                  Le Promoteur Général de la plateforme examine les nouvelles adhésions afin d'autoriser l'accès et d'activer votre formule d'essai gratuit. Vous pouvez accélérer la validation en lui envoyant un message WhatsApp direct.
                </p>
              </div>

              {/* WhatsApp & Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={promoterWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Demander l'Autorisation sur WhatsApp</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3.5 px-6 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center space-x-2">
                  <X className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Campaign Code Picker (if multiple or custom) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Code ou Campagne d'Adhésion
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {campaigns.map(camp => (
                    <button
                      key={camp.id}
                      type="button"
                      onClick={() => handleSelectCampaign(camp)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedCampaign?.id === camp.id
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 dark:text-blue-200 font-black'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold truncate">{camp.name}</div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{camp.code}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* School Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Nom Officiel de l'Établissement *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Ex: Complexe Scolaire L'Éveil de l'Excellence"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-white text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Cycle & Type
                  </label>
                  <select
                    value={schoolType}
                    onChange={(e) => setSchoolType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-white text-xs font-bold outline-none"
                  >
                    <option value="Complexe Scolaire">Complexe Scolaire (Polyvalent)</option>
                    <option value="École Primaire">École Maternelle & Primaire</option>
                    <option value="Collège">Collège & Lycée</option>
                    <option value="Lycée">Lycée Général / Technique</option>
                  </select>
                </div>
              </div>

              {/* City & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Ville / Commune *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: Cotonou, Abomey-Calavi, Porto-Novo..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-white text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Quartier / Adresse
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Cadjehoun, Rue 125"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-white text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Director & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Nom & Prénom du Directeur / Fondateur *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={directorName}
                      onChange={(e) => setDirectorName(e.target.value)}
                      placeholder="Ex: M. Anselme DOSSOU"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-white text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Téléphone WhatsApp (Réception Autorisation) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={directorPhone}
                      onChange={(e) => setDirectorPhone(e.target.value)}
                      placeholder="Ex: +229 97 12 34 56"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-white text-xs font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Email de l'Établissement (Optionnel)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={schoolEmail}
                      onChange={(e) => setSchoolEmail(e.target.value)}
                      placeholder="direction@ecole.bj"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-white text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Mot de passe d'accès (8 car.) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setAccessPassword(generateValidPassword())}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Régénérer
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={accessPassword}
                      onChange={(e) => setAccessPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-white text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Promoter Authorization Reminder */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center space-x-1.5 font-black">
                  <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Accès sous Autorisation du Promoteur</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Dès soumission, votre école figurera dans le registre national sous validation. Le Promoteur Général Victor MAHOUNOU recevra votre demande et autorisera l'accès en vous accordant la période d'essai gratuit.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-600/20 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? "Enregistrement..." : "SOUMETTRE L'INSCRIPTION DE MON ÉCOLE"}</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
