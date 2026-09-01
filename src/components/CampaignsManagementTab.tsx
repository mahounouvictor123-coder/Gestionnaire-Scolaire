import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { RegistrationCampaign, School } from '../types';
import { getPublicBaseUrl } from '../lib/urlUtils';
import {
  Tag,
  Plus,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Building2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Users,
  Gift,
  Calendar,
  Sparkles,
  Search,
  Filter,
  Trash2,
  AlertTriangle,
  Send,
  Eye,
  Info,
  KeyRound,
  Phone,
  User,
  MapPin,
  X
} from 'lucide-react';
import { RegisterViaCampaignModal } from './modals/RegisterViaCampaignModal';

interface CampaignsManagementTabProps {
  onOpenTestModal?: (campaignCode?: string) => void;
}

export const CampaignsManagementTab: React.FC<CampaignsManagementTabProps> = () => {
  const {
    campaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    schools,
    approveSchoolByPromoter,
    rejectSchoolByPromoter
  } = useApp();

  // Create Campaign Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignCode, setNewCampaignCode] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [newCampaignTrialDays, setNewCampaignTrialDays] = useState(30);
  const [newCampaignExpiresAt, setNewCampaignExpiresAt] = useState('2025-12-31');

  // Test Registration Modal State
  const [isTestRegisterModalOpen, setIsTestRegisterModalOpen] = useState(false);
  const [testCampaignCode, setTestCampaignCode] = useState<string | undefined>(undefined);

  // Search & Copy Feedback
  const [searchTerm, setSearchTerm] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<{ [id: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Rejection Modal
  const [schoolToReject, setSchoolToReject] = useState<School | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Pending schools (registered via campaign or pending approval)
  const pendingSchools = schools.filter(s => s.approvalStatus === 'PENDING_APPROVAL' || (!s.isValidatedByPromoter && s.registeredViaCampaign));
  const approvedSchools = schools.filter(s => s.approvalStatus === 'APPROVED' || (s.isValidatedByPromoter && s.registeredViaCampaign));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyLink = (campaign: RegistrationCampaign) => {
    const baseUrl = getPublicBaseUrl();
    const link = `${baseUrl}?campaign=${encodeURIComponent(campaign.code)}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    setCopyFeedback(prev => ({ ...prev, [campaign.id]: true }));
    showToast(`✅ Lien de la campagne « ${campaign.code} » copié dans le presse-papier !`);
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [campaign.id]: false }));
    }, 2500);
  };

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim() || !newCampaignCode.trim()) return;

    const created = createCampaign({
      name: newCampaignName.trim(),
      code: newCampaignCode.trim().toUpperCase(),
      description: newCampaignDesc.trim() || "Campagne d'adhésion pour les établissements scolaires partenaires.",
      freeTrialDays: Number(newCampaignTrialDays) || 30,
      expiresAt: newCampaignExpiresAt || undefined,
      status: 'ACTIVE'
    });

    setIsCreateModalOpen(false);
    setNewCampaignName('');
    setNewCampaignCode('');
    setNewCampaignDesc('');
    showToast(`🎉 Nouvelle campagne « ${created.name} » créée avec le code ${created.code} !`);
  };

  const getWhatsAppShareUrl = (campaign: RegistrationCampaign) => {
    const baseUrl = getPublicBaseUrl();
    const link = `${baseUrl}?campaign=${encodeURIComponent(campaign.code)}`;
    const text = `🎓 *OFFRE SPÉCIALE ÉTABLISSEMENTS SCOLAIRES* 🎓\n\n` +
      `Bonjour Chers Fondateurs et Directeurs d'Établissement,\n\n` +
      `Dans le cadre de notre campagne nationale *« ${campaign.name} »*, nous vous invitons à inscrire votre école pour bénéficier de :\n\n` +
      `✨ *${campaign.freeTrialDays || 30} Jours d'accès complet offert*\n` +
      `📄 *Génération automatique des Bulletins avec QR Code sécurisé*\n` +
      `🤖 *Scan OCR IA des listes d'élèves et saisie rapide des notes*\n` +
      `📱 *Envoi des relevés de notes aux parents par SMS & WhatsApp*\n` +
      `💰 *Gestion de la caisse et recouvrement des scolarités*\n\n` +
      `👉 *Cliquez sur ce lien pour inscrire votre établissement :*\n${link}\n\n` +
      `_Votre demande sera autorisée par le Promoteur Général de la plateforme._`;

    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const getWhatsAppApprovalMessageUrl = (school: School) => {
    const baseUrl = getPublicBaseUrl();
    const directUrl = `${baseUrl}?school=${encodeURIComponent(school.id)}&pwd=${encodeURIComponent(school.accessPassword || '12345678')}`;
    const text = `Bonjour M. / Mme *${school.directorName}* (Directeur de *${school.name}*),\n\n` +
      `🎉 *FÉLICITATIONS ! Votre établissement a été autorisé et validé sur la plateforme GESTIONNAIRE SCOLAIRE.* 🎉\n\n` +
      `Voici vos accès officiels sécurisés :\n` +
      `🏢 Établissement : *${school.name}*\n` +
      `📍 Ville : *${school.city}*\n` +
      `🔑 Mot de passe d'accès : *${school.accessPassword || '12345678'}*\n` +
      `🎁 Avantage : *30 Jours d'essai complet offert*\n\n` +
      `👉 *Accédez directement à votre espace école ici :*\n${directUrl}\n\n` +
      `Cordialement,\n*Victor MAHOUNOU - Promoteur Général* (Tél: +229 01 43 75 45 93)`;

    const phoneDigits = (school.phone || '').replace(/[^0-9]/g, '');
    const targetPhone = phoneDigits.startsWith('229') ? phoneDigits : `229${phoneDigits}`;
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Toast alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm font-bold flex items-center space-x-3 shadow-md animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-blue-500/30 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Gift className="h-3.5 w-3.5 text-amber-400" />
            <span>Générateur de Liens & Campagnes d'Adhésion</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Campagnes d'Inscriptions & Autorisations
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Créez des campagnes thématiques, générez des liens d'adhésion partageables sur WhatsApp ou par courriel. Toutes les écoles inscrites par ces liens figurent dans votre registre sous votre autorisation préalable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setTestCampaignCode(campaigns[0]?.code);
              setIsTestRegisterModalOpen(true);
            }}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Eye className="h-4 w-4 text-blue-300" />
            <span>Tester Formulaire Public</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewCampaignName('');
              setNewCampaignCode(`RENTREE-${new Date().getFullYear()}`);
              setNewCampaignDesc('');
              setNewCampaignTrialDays(30);
              setIsCreateModalOpen(true);
            }}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 cursor-pointer transform hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Créer une Campagne</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Campagnes Actives</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {campaigns.filter(c => c.status === 'ACTIVE').length}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">En Attente d'Autorisation</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 flex items-center space-x-2">
              <span>{pendingSchools.length}</span>
              {pendingSchools.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black animate-pulse">
                  À valider
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Écoles Approuvées</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {approvedSchools.length}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Établissements</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {schools.length}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: PENDING SCHOOLS UNDER PROMOTER AUTHORIZATION */}
      {pendingSchools.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Demandes d'Inscriptions en Attente d'Autorisation</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
                    {pendingSchools.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ces écoles se sont inscrites via vos liens de campagne et attendent votre autorisation pour activer leur accès.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingSchools.map(sch => (
              <div
                key={sch.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-900/60 shadow-lg space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className="font-black text-slate-900 dark:text-white text-base">
                        {sch.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold">
                        {sch.schoolType || 'Complexe Scolaire'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{sch.city}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{sch.directorName}</span>
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase shrink-0">
                    Sous Autorisation
                  </span>
                </div>

                {/* Info Pills */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Téléphone / WhatsApp</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{sch.phone || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Campagne d'origine</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{sch.campaignCode || 'Directe'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Date de demande</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{sch.registrationDate ? new Date(sch.registrationDate).toLocaleDateString('fr-FR') : sch.createdAt}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Mot de passe généré</span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400">{sch.accessPassword || '12345678'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      approveSchoolByPromoter(sch.id);
                      showToast(`✅ Établissement « ${sch.name} » autorisé avec succès (30 jours d'accès accordé) !`);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Autoriser & Activer</span>
                  </button>

                  <a
                    href={getWhatsAppApprovalMessageUrl(sch)}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center space-x-1"
                    title="Envoyer message WhatsApp de confirmation"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setSchoolToReject(sch);
                      setRejectionReason("Demande non conforme aux critères du réseau scolaire.");
                    }}
                    className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                    title="Refuser ou suspendre cette demande"
                  >
                    <X className="h-4 w-4" />
                    <span>Refuser</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: CAMPAIGNS LIST & GENERATOR */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Tag className="h-5 w-5 text-blue-500" />
              <span>Campagnes Actives & Liens d'Inscription</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chaque campagne génère un lien d'inscription unique avec code promotionnel.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une campagne..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampaigns.map(camp => {
            const baseUrl = getPublicBaseUrl();
            const registrationUrl = `${baseUrl}?campaign=${encodeURIComponent(camp.code)}`;
            const isCopied = copyFeedback[camp.id];
            const campSchools = schools.filter(s => s.campaignId === camp.id || s.campaignCode === camp.code);

            return (
              <div
                key={camp.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all"
              >
                <div className="space-y-3">
                  
                  {/* Top line with code & status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-mono font-black tracking-wider">
                      {camp.code}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        camp.status === 'ACTIVE'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300'
                      }`}>
                        {camp.status === 'ACTIVE' ? 'Active' : 'En Pause'}
                      </span>

                      <button
                        type="button"
                        onClick={() => deleteCampaign(camp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Supprimer la campagne"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">
                      {camp.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {camp.description || "Adhésion au réseau scolaire sous validation du promoteur."}
                    </p>
                  </div>

                  {/* Stats Box */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Inscriptions</span>
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {campSchools.length || camp.registrationsCount || 0} école(s)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Offre Essai</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {camp.freeTrialDays || 30} jours offerts
                      </span>
                    </div>
                  </div>

                  {/* Copyable Link Box */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black block">Lien Public d'Inscription</span>
                    <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <input
                        type="text"
                        readOnly
                        value={registrationUrl}
                        className="w-full bg-transparent text-[11px] font-mono text-slate-700 dark:text-slate-300 outline-none select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyLink(camp)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                        title="Copier le lien"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2">
                    <a
                      href={getWhatsAppShareUrl(camp)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/10"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Partager WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setTestCampaignCode(camp.code);
                        setIsTestRegisterModalOpen(true);
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                      title="Tester l'inscription sous cette campagne"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Tester</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Créer une Campagne d'Inscription
                  </h3>
                  <p className="text-xs text-slate-500">
                    Générez un code unique et un lien pour inviter des écoles.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Nom de la Campagne *
                </label>
                <input
                  type="text"
                  required
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="Ex: Campagne Grande Rentrée Scolaire 2025"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Code Promo / Unique *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaignCode}
                    onChange={(e) => setNewCampaignCode(e.target.value.toUpperCase())}
                    placeholder="Ex: RENTREE-2025"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-mono text-xs font-black outline-none focus:border-blue-500 uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Jours d'Essai Offerts
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={newCampaignTrialDays}
                    onChange={(e) => setNewCampaignTrialDays(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Description & Avantages Offerts
                </label>
                <textarea
                  rows={3}
                  value={newCampaignDesc}
                  onChange={(e) => setNewCampaignDesc(e.target.value)}
                  placeholder="Ex: Offre spéciale pour les collèges et écoles primaires du Bénin. Accès gratuit 30 jours, bulletins QR inclus..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Date Limite de Validité
                </label>
                <input
                  type="date"
                  value={newCampaignExpiresAt}
                  onChange={(e) => setNewCampaignExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Créer la Campagne
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {schoolToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-rose-300 dark:border-rose-900/60 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Refuser la demande d'inscription
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Vous êtes sur le point de refuser l'autorisation pour l'école <strong>« {schoolToReject.name} »</strong> ({schoolToReject.city}).
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                Motif du refus
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSchoolToReject(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  rejectSchoolByPromoter(schoolToReject.id, rejectionReason);
                  setSchoolToReject(null);
                  showToast(`🔴 Demande de « ${schoolToReject.name} » refusée.`);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER VIA CAMPAIGN MODAL PREVIEW */}
      <RegisterViaCampaignModal
        isOpen={isTestRegisterModalOpen}
        onClose={() => setIsTestRegisterModalOpen(false)}
        initialCampaignCode={testCampaignCode}
      />

    </div>
  );
};
