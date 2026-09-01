import React, { useState, useRef } from 'react';
import { useApp } from '../../lib/store';
import { validateSchoolPassword, generateValidPassword } from '../../lib/passwordUtils';
import { getPublicBaseUrl, buildDirectSchoolAccessUrl } from '../../lib/urlUtils';
import { presetLogos } from '../../data/initialSchools';
import { AFRICAN_COUNTRIES, AfricanCountry } from '../../data/africanCountries';
import {
  Building2,
  X,
  Upload,
  CheckCircle2,
  Sparkles,
  School,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  BookOpen,
  Award,
  Copy,
  Check,
  Printer,
  Share2,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Globe2,
  MessageSquare,
  Zap
} from 'lucide-react';
import { CompleteSchoolSetupModal } from './CompleteSchoolSetupModal';

interface CreateSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}

export const CreateSchoolModal: React.FC<CreateSchoolModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { createSchool, validateSchoolByPromoter, addCommunication, switchSchool, unlockSchool } = useApp();
  const [showSetupModal, setShowSetupModal] = useState(false);

  const [name, setName] = useState('');
  const [motto, setMotto] = useState('');
  const [schoolType, setSchoolType] = useState('Complexe Scolaire (Maternelle - Primaire - Secondaire)');
  const [logoUrl, setLogoUrl] = useState(presetLogos[0].url);
  const [signatureUrl, setSignatureUrl] = useState('https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=200');
  const [selectedCountry, setSelectedCountry] = useState<AfricanCountry>(AFRICAN_COUNTRIES[0]); // Default Bénin
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('+229 ');
  const [email, setEmail] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [currentTrimester, setCurrentTrimester] = useState<1 | 2 | 3>(1);
  const [currency, setCurrency] = useState('FCFA');
  const [accessPassword, setAccessPassword] = useState('Sch1@202');
  const [confirmAccessPassword, setConfirmAccessPassword] = useState('Sch1@202');
  const [passwordError, setPasswordError] = useState('');
  const [populateSampleData, setPopulateSampleData] = useState(true);
  const [linkCopyFeedback, setLinkCopyFeedback] = useState<string | null>(null);

  // Promoter Validation Choice
  const [validationMethod, setValidationMethod] = useState<'GMAIL' | 'WHATSAPP'>('GMAIL');
  const [promoterEmail, setPromoterEmail] = useState('mahounouvictor123@gmail.com');
  const [promoterPhone, setPromoterPhone] = useState('+229 01 43 75 45 93');

  // Handle country selection
  const handleCountryChange = (countryName: string) => {
    const found = AFRICAN_COUNTRIES.find(c => c.name === countryName);
    if (found) {
      setSelectedCountry(found);
      setCurrency(found.currency);
      // Auto adjust phone prefix if default
      if (!phone || phone.startsWith('+')) {
        setPhone(`${found.phonePrefix} `);
      }
      if (!city) {
        setCity(found.name);
      }
    }
  };

  // Validation Certificate State
  const [createdSchoolData, setCreatedSchoolData] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validationErr = validateSchoolPassword(accessPassword);
    if (validationErr) {
      setPasswordError(validationErr);
      return;
    }

    if (accessPassword.trim() !== confirmAccessPassword.trim()) {
      setPasswordError('La confirmation ne correspond pas au mot de passe saisi.');
      return;
    }

    setPasswordError('');
    const officialCode = `SCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSch = createSchool(
      {
        name: name.toUpperCase(),
        motto: motto || 'Rigueur • Travail • Excellence',
        schoolType,
        logoUrl,
        signatureUrl,
        address: address || 'Adresse Principale',
        city: city || 'Cotonou',
        phone: phone || '+229 00 00 00 00',
        email: email || `direction@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.bj`,
        directorName: directorName || 'Direction Générale',
        academicYear,
        currentTrimester,
        currency,
        country: selectedCountry.name,
        countryCode: selectedCountry.code,
        countryFlag: selectedCountry.flag,
        accessPassword: accessPassword.trim(),
        validationMethod,
        promoterEmail,
        promoterPhone
      },
      populateSampleData
    );

    // Send instant system congratulatory notification to communications store
    addCommunication({
      title: `🎉 Félicitations ! Bienvenue à ${newSch.name}`,
      content: `Votre établissement a été créé et validé avec succès (Code Agrément : ${officialCode}). L'espace de gestion est actif pour l'année ${newSch.academicYear}.`,
      sender: "Système Central Ministère & Réseau",
      targetAudience: "DIRECTION",
      channel: "APP"
    });

    setCreatedSchoolData({
      ...newSch,
      officialCode,
      tempPassword: newSch.accessPassword,
      createdDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    });
  };

  const shareInviteUrl = createdSchoolData
    ? `${getPublicBaseUrl()}?school_code=${createdSchoolData.officialCode}&school_id=${createdSchoolData.id}`
    : '';

  const handleCopyInviteLink = () => {
    if (!shareInviteUrl) return;
    navigator.clipboard.writeText(shareInviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-6 overflow-hidden">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-emerald-950 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <Building2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {createdSchoolData ? "Attestation Officielle de Validation" : "Créer un Nouvel Établissement Scolaire"}
              </h2>
              <p className="text-xs text-slate-300">
                {createdSchoolData
                  ? "Validation et Félicitations du Réseau d'Enseignement Numérique"
                  : "Enregistrez votre école pour obtenir son espace de gestion 100% autonome et sécurisé."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View 2: Congratulatory Validation Screen */}
        {createdSchoolData ? (
          <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto print:p-0">
            
            {/* Confetti / Certificate Header Box */}
            <div className="relative p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white text-center space-y-3 overflow-hidden shadow-xl border border-emerald-500/30">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl" />
              
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-inner">
                <Award className="h-9 w-9 animate-bounce" />
              </div>

              <div className="space-y-1 relative z-10">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-400/40">
                  ÉTABLISSEMENT VALIDÉ & ACTIVÉ
                </span>
                <h3 className="text-2xl font-black tracking-tight text-white">
                  FÉLICITATIONS !
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto font-medium">
                  Votre établissement <strong className="text-amber-300">{createdSchoolData.name}</strong> est désormais enregistré et entièrement opérationnel dans le système.
                </p>
              </div>
            </div>

            {/* Certificate Details Card */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={createdSchoolData.logoUrl}
                    alt={createdSchoolData.name}
                    className="h-12 w-12 rounded-xl object-cover border border-slate-300 dark:border-slate-600 bg-white"
                  />
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">
                      {createdSchoolData.name}
                    </h4>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      « {createdSchoolData.motto} »
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="block text-[10px] text-slate-400 uppercase font-black">Code Unique D'Agrément</span>
                  <span className="text-sm font-mono font-black text-blue-600 dark:text-blue-400">
                    {createdSchoolData.officialCode}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Fondateur / Directeur</span>
                  <strong className="text-slate-900 dark:text-white font-extrabold">{createdSchoolData.directorName}</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Type d'Établissement</span>
                  <strong className="text-slate-900 dark:text-white font-extrabold">{createdSchoolData.schoolType}</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Année & Trimestre</span>
                  <strong className="text-slate-900 dark:text-white font-extrabold">
                    {createdSchoolData.academicYear} • Trimestre {createdSchoolData.currentTrimester}
                  </strong>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Pays & Localisation</span>
                  <strong className="text-slate-900 dark:text-white font-extrabold flex items-center space-x-1">
                    <span>{createdSchoolData.countryFlag || '🌍'}</span>
                    <span>{createdSchoolData.country || 'Afrique'}</span>
                    <span>• {createdSchoolData.city}</span>
                  </strong>
                </div>
              </div>

              {/* Administrator Initial Credentials Box */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start space-x-3 text-xs">
                <KeyRound className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 w-full">
                  <p className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                    <span>🔑 Clés d'Accès Promoteur & Mot de Passe de l'École</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-amber-900 dark:text-amber-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">Clé d'Accès Promoteur :</span>
                      <strong className="font-mono text-sm bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded text-amber-950 dark:text-amber-100 font-black">
                        {createdSchoolData.validationToken || `PROM-2026-${Math.floor(1000 + Math.random() * 9000)}`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">Mot de Passe Secret (8 car.) :</span>
                      <strong className="font-mono text-sm bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded text-amber-950 dark:text-amber-100 font-black">
                        {createdSchoolData.accessPassword || createdSchoolData.tempPassword}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specific School Dashboard Direct Magic Link */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white border-2 border-indigo-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-indigo-700/50 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center space-x-1.5">
                    <Globe2 className="h-4 w-4 text-indigo-400" />
                    <span>🔗 Lien du Tableau de Bord Spécifique (Accès Direct)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase">
                    Connexion Automatique
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Voici le URL direct de votre établissement. Vous pouvez enregistrer ce lien dans vos favoris ou le partager avec vos collaborateurs :
                </p>

                <div className="p-2.5 rounded-xl bg-black/50 border border-indigo-500/30 font-mono text-xs text-indigo-300 break-all select-all">
                  {buildDirectSchoolAccessUrl(createdSchoolData)}
                </div>

                {linkCopyFeedback && (
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs text-center border border-emerald-500/40">
                    {linkCopyFeedback}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const directUrl = buildDirectSchoolAccessUrl(createdSchoolData);
                      navigator.clipboard.writeText(directUrl);
                      setLinkCopyFeedback('✅ Lien du Tableau de Bord copié !');
                      setTimeout(() => setLinkCopyFeedback(null), 3500);
                    }}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copier le Lien Direct</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Bonjour,\n\nVoici le lien d'accès direct au Tableau de Bord de l'école *${createdSchoolData.name}* :\n${buildDirectSchoolAccessUrl(createdSchoolData)}\n\nIdentifiant École : ${createdSchoolData.id}\nMot de passe : ${createdSchoolData.accessPassword || createdSchoolData.tempPassword}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Envoyer via WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Promoter Validation Status & Actions Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-slate-900 text-white border border-blue-400/30 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-700/50 pb-2">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-5 w-5 text-blue-400" />
                    <span className="font-black text-xs uppercase tracking-wider">
                      Validation Obligatoire par le Promoteur
                    </span>
                  </div>
                  {createdSchoolData.isValidatedByPromoter ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-black border border-emerald-400/50">
                      ✅ ÉTABLISSEMENT VALIDÉ
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-black border border-amber-400/50">
                      ⏳ EN ATTENTE DE VALIDATION
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">
                  Conformément aux règles de la plateforme, la validation officielle doit être effectuée par le Promoteur (via Email/Gmail ou WhatsApp au <strong>01 43 75 45 93</strong>).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {/* Gmail Send Link */}
                  <a
                    href={`mailto:${createdSchoolData.promoterEmail || 'mahounouvictor123@gmail.com'}?subject=${encodeURIComponent(`Demande de Validation - École ${createdSchoolData.name}`)}&body=${encodeURIComponent(`Bonjour Monsieur le Promoteur,\n\nDemande de validation d'accès pour l'école : ${createdSchoolData.name} (Code Agrément : ${createdSchoolData.officialCode}).\n\nLien de confirmation : ${window.location.origin}/?validate_school_id=${createdSchoolData.id}&token=${createdSchoolData.validationToken}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/40 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                  >
                    <Mail className="h-4 w-4 text-rose-300" />
                    <span>Envoyer la demande sur Gmail</span>
                  </a>

                  {/* WhatsApp Send Link */}
                  <a
                    href={`https://wa.me/2290143754593?text=${encodeURIComponent(`Bonjour Monsieur le Promoteur, demande de validation d'accès pour l'école ${createdSchoolData.name} (Code Agrément : ${createdSchoolData.officialCode}). Merci de valider notre établissement.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                  >
                    <MessageSquare className="h-4 w-4 text-emerald-300" />
                    <span>WhatsApp (01 43 75 45 93)</span>
                  </a>
                </div>

                {!createdSchoolData.isValidatedByPromoter && (
                  <button
                    type="button"
                    onClick={() => {
                      validateSchoolByPromoter(createdSchoolData.id);
                      setCreatedSchoolData({
                        ...createdSchoolData,
                        isValidatedByPromoter: true
                      });
                    }}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span>⚡ VALIDER CETTE ÉCOLE MAINTENANT (ACTION PROMOTEUR)</span>
                  </button>
                )}
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setShowSetupModal(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Zap className="h-4 w-4 text-slate-950 fill-slate-950" />
                <span>⚡ COMPLÉTER LES INFORMATIONS DE MON ÉCOLE</span>
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center space-x-2 transition-colors"
                >
                  <Printer className="h-4 w-4 text-slate-500" />
                  <span>Attestation</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (createdSchoolData) {
                      switchSchool(createdSchoolData.id);
                      const pwd = createdSchoolData.accessPassword || createdSchoolData.tempPassword;
                      if (pwd) {
                        unlockSchool(createdSchoolData.id, pwd);
                      }
                    }
                    onClose();
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer"
                >
                  <span>TABLEAU DE BORD</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* View 1: Creation Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* Section 1: Identité de l'école */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <School className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-extrabold uppercase text-slate-900 dark:text-white tracking-wider">
                  1. Raison Sociale & Type d'Établissement
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nom Officiel de l'École *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: COMPLEXE SCOLAIRE LA RENAISSANCE"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Devise / Devise de l'École
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Discipline • Travail • Rigueur"
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nom du Fondateur / Directeur Général
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Dr. Alphonse KPOHIZOUN"
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* 3 School Type Mandatory Options */}
                <div className="md:col-span-2 space-y-2.5">
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                    Structure & Type d'Établissement (Choisissez l'option correspondante) *
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Option 1: École Primaire Simple */}
                    <div
                      onClick={() => setSchoolType('École Primaire Simple (Maternelle & Primaire)')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                        schoolType === 'École Primaire Simple (Maternelle & Primaire)'
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:border-emerald-300'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">🎒</span>
                          <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            schoolType === 'École Primaire Simple (Maternelle & Primaire)'
                              ? 'border-emerald-600 bg-emerald-600'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {schoolType === 'École Primaire Simple (Maternelle & Primaire)' && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-snug">
                          École Primaire Simple
                        </h4>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                          Maternelle & Cours Primaire
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Sections Maternelle, CI, CP, CE1, CE2, CM1, CM2.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-600 dark:text-slate-300">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">Administration : </span>
                        Directeur(rice) • Secrétaire • Maîtres & Maîtresses
                      </div>
                    </div>

                    {/* Option 2: Collège ou Lycée Simple */}
                    <div
                      onClick={() => setSchoolType('Collège ou Lycée Simple (Secondaire)')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                        schoolType === 'Collège ou Lycée Simple (Secondaire)'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:border-blue-300'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">🏫</span>
                          <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            schoolType === 'Collège ou Lycée Simple (Secondaire)'
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {schoolType === 'Collège ou Lycée Simple (Secondaire)' && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-snug">
                          Collège ou Lycée Simple
                        </h4>
                        <p className="text-[11px] text-blue-700 dark:text-blue-300 font-bold">
                          Cours Secondaire Uniquement
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Collège (6ème à 3ème) ou Lycée (2nde à Terminale).
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-600 dark:text-slate-300">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">Administration : </span>
                        Proviseur • Censeur • Surveillant • Secrétaire • Professeurs
                      </div>
                    </div>

                    {/* Option 3: Complexe Scolaire */}
                    <div
                      onClick={() => setSchoolType('Complexe Scolaire (Maternelle, Primaire et Secondaire)')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                        schoolType === 'Complexe Scolaire (Maternelle, Primaire et Secondaire)' || schoolType.includes('Complexe Scolaire')
                          ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 ring-2 ring-purple-500/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:border-purple-300'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">🏛️</span>
                          <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            schoolType === 'Complexe Scolaire (Maternelle, Primaire et Secondaire)' || schoolType.includes('Complexe Scolaire')
                              ? 'border-purple-600 bg-purple-600'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {(schoolType === 'Complexe Scolaire (Maternelle, Primaire et Secondaire)' || schoolType.includes('Complexe Scolaire')) && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-snug">
                          Complexe Scolaire
                        </h4>
                        <p className="text-[11px] text-purple-700 dark:text-purple-300 font-bold">
                          Maternelle + Primaire + Secondaire
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Établissement réunissant tous les cycles scolaires.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-600 dark:text-slate-300">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">Administration : </span>
                        Dir. Général • Dir. Primaire • Censeur • Surveillant • Maîtres & Professeurs
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                  <label className="block text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                    <span>🔐 Créer & Confirmer le Mot de Passe d'Accès (8 caractères) *</span>
                    <span className="text-[10px] text-slate-400 font-normal">Strictement 8 caractères</span>
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Mot de passe *
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        required
                        placeholder="Ex: Tmp1@202"
                        value={accessPassword}
                        onChange={(e) => {
                          setAccessPassword(e.target.value);
                          setPasswordError('');
                        }}
                        className="w-full px-3.5 py-2.5 text-sm font-mono tracking-widest font-bold rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Confirmer le mot de passe *
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        required
                        placeholder="Ex: Tmp1@202"
                        value={confirmAccessPassword}
                        onChange={(e) => {
                          setConfirmAccessPassword(e.target.value);
                          setPasswordError('');
                        }}
                        className="w-full px-3.5 py-2.5 text-sm font-mono tracking-widest font-bold rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {passwordError ? (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1">⚠️ {passwordError}</p>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      🔒 Doit contenir exactement <strong>8 caractères</strong> combinant <strong>lettres</strong>, <strong>chiffres</strong> et <strong>symboles</strong> (ex: <code className="font-mono font-bold bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">Sch1@202</code>).
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Logo & Signature */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold uppercase text-slate-900 dark:text-white tracking-wider">
                  2. Logo Officiel
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Choisissez un Modèle de Logo ou Téléversez le vôtre
                </label>
                
                {/* Preset Logos selection */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                  {presetLogos.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => setLogoUrl(preset.url)}
                      className={`cursor-pointer p-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                        logoUrl === preset.url
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 ring-2 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="h-10 w-10 rounded-lg object-cover mb-1 bg-white" />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                        {preset.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Custom File upload */}
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
                  >
                    <Upload className="h-4 w-4 text-blue-600" />
                    <span>Téléverser un fichier logo</span>
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  {logoUrl && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Logo sélectionné</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Coordonnées & Contact */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <Globe2 className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-extrabold uppercase text-slate-900 dark:text-white tracking-wider">
                  3. Pays d'Origine & Contacts Officiels (Réseau Afrique)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800/80 space-y-2">
                  <label className="block text-xs font-black uppercase text-purple-800 dark:text-purple-300 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <span>🌍 Pays d'Implantation de l'Établissement *</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">Détermine la devise et les normes régionales</span>
                  </label>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 shrink-0">
                      {selectedCountry.flag}
                    </div>
                    <select
                      value={selectedCountry.name}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm font-extrabold rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    >
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.flag} {c.name} — ({c.currency} • {c.phonePrefix})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Adresse Physique / Quartier
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Quartier Fidjrossè - Rue 12"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    placeholder={`ex: Cotonou (${selectedCountry.name})`}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone(s) Officiel(s) ({selectedCountry.phonePrefix})
                  </label>
                  <input
                    type="text"
                    placeholder={`ex: ${selectedCountry.phonePrefix} 97 00 00 00`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Adresse Email Officielle
                  </label>
                  <input
                    type="email"
                    placeholder="ex: direction@ecole.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Paramètres Pédagogiques & Financiers */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-extrabold uppercase text-slate-900 dark:text-white tracking-wider">
                  4. Année Académique & Configuration
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Année Scolaire
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Trimestre de Départ
                  </label>
                  <select
                    value={currentTrimester}
                    onChange={(e) => setCurrentTrimester(Number(e.target.value) as 1 | 2 | 3)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
                  >
                    <option value={1}>1er Trimestre</option>
                    <option value={2}>2ème Trimestre</option>
                    <option value={3}>3ème Trimestre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Devise Monétaire
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
                  >
                    <option value="FCFA">FCFA (Franc CFA)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                    <option value="USD">USD ($ Dollar)</option>
                    <option value="GHS">GHS (Cedi du Ghana)</option>
                    <option value="GNF">GNF (Franc Guinéen)</option>
                  </select>
                </div>
              </div>

              {/* Inscription & Subscription Information Box */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 space-y-1.5 text-xs text-slate-800 dark:text-slate-200">
                <div className="flex items-center justify-between font-black text-amber-900 dark:text-amber-300">
                  <span className="flex items-center space-x-1.5">
                    <Award className="h-4 w-4 text-amber-600" />
                    <span>Frais d'Inscription : 2 000 FCFA (Offre Spéciale)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] uppercase font-extrabold">
                    1 Semaine Gratuite Offerte
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  L'inscription de votre établissement est fixée à <strong>2 000 FCFA</strong> et vous donne droit immédiatement à <strong>1 semaine (7 jours) d'utilisation gratuite</strong>. Par la suite, l'accès est fixé à seulement <strong>250 FCFA / jour</strong>, <strong>1 250 FCFA / semaine</strong>, <strong>5 000 FCFA / mois</strong> ou <strong>50 000 FCFA / an</strong> (Transferts Mobile Money vers le numéro unique : <strong className="font-mono text-amber-900 dark:text-amber-200">0167430381</strong>).
                </p>
              </div>

              {/* Sample Data Toggle Box */}
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="populateSample"
                  checked={populateSampleData}
                  onChange={(e) => setPopulateSampleData(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="populateSample" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <strong className="block text-slate-900 dark:text-white font-extrabold mb-0.5">
                    Pré-installer la structure scolaire recommandée
                  </strong>
                  Génère automatiquement les niveaux de classe (CI à Terminale), le programme des matières avec leurs coefficients standards et un échantillon d'élèves pour tester directement le système.
                </label>
              </div>
            </div>

            {/* Section 5: Mode de Validation par le Promoteur (Gmail / WhatsApp - 01 43 75 45 93) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold uppercase text-slate-900 dark:text-white tracking-wider">
                  5. Validation d'Accès par le Promoteur (Choix du canal)
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                Après l'inscription de l'établissement, une demande de confirmation est transmise au Promoteur. Choisissez le canal de validation souhaité pour votre école :
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Option 1: Gmail */}
                <div
                  onClick={() => setValidationMethod('GMAIL')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    validationMethod === 'GMAIL'
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="valMethod"
                      checked={validationMethod === 'GMAIL'}
                      onChange={() => setValidationMethod('GMAIL')}
                      className="mt-1 text-blue-600"
                    />
                    <div className="space-y-1.5 w-full">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <Mail className="h-4 w-4 text-rose-500" />
                        <span>Validation par Gmail du Promoteur</span>
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        La demande de confirmation est envoyée au Gmail du promoteur.
                      </p>
                      {validationMethod === 'GMAIL' && (
                        <div className="pt-2">
                          <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                            Adresse Gmail du Promoteur :
                          </label>
                          <input
                            type="email"
                            value={promoterEmail}
                            onChange={(e) => setPromoterEmail(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Option 2: WhatsApp */}
                <div
                  onClick={() => setValidationMethod('WHATSAPP')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    validationMethod === 'WHATSAPP'
                      ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="valMethod"
                      checked={validationMethod === 'WHATSAPP'}
                      onChange={() => setValidationMethod('WHATSAPP')}
                      className="mt-1 text-emerald-600"
                    />
                    <div className="space-y-1.5 w-full">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                        <span>Validation par WhatsApp (01 43 75 45 93)</span>
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        La demande est préremplie et transmise directement au <strong className="text-emerald-700 dark:text-emerald-300 font-mono">01 43 75 45 93</strong>.
                      </p>
                      {validationMethod === 'WHATSAPP' && (
                        <div className="pt-2">
                          <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                            Numéro WhatsApp Officiel Promoteur :
                          </label>
                          <input
                            type="text"
                            value={promoterPhone}
                            onChange={(e) => setPromoterPhone(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-emerald-600 dark:text-emerald-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Form Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Annuler
              </button>

              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>VALIDER ET CRÉER MON ÉCOLE</span>
              </button>
            </div>

          </form>
        )}

      </div>

      {showSetupModal && createdSchoolData && (
        <CompleteSchoolSetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          targetSchool={createdSchoolData}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
