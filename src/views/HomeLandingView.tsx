import React from 'react';
import {
  Building2,
  ShieldCheck,
  PlusCircle,
  Sparkles,
  GraduationCap,
  Users,
  CreditCard,
  FileCheck,
  ScanLine,
  MessageSquare,
  Award,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Phone,
  Mail,
  Zap,
  BookOpen,
  HeartHandshake,
  UserCheck2,
  FileText,
  Clock,
  Globe2,
  Lock,
  CalendarCheck,
  Wallet,
  Bot,
  Wand2,
  SearchCheck,
  SlidersHorizontal,
  Settings
} from 'lucide-react';
import { SchoolLogo } from '../components/SchoolLogo';
import { StaffPortalsSection } from '../components/StaffPortalsSection';
import { HomeAIAssistantWidget } from '../components/HomeAIAssistantWidget';
import { useApp } from '../lib/store';

interface HomeLandingViewProps {
  onNavigate: (view: string) => void;
  onOpenCreateSchoolModal: () => void;
  onOpenCampaignModal?: () => void;
  onOpenAiModal?: () => void;
}

export const HomeLandingView: React.FC<HomeLandingViewProps> = ({
  onNavigate,
  onOpenCreateSchoolModal,
  onOpenCampaignModal,
  onOpenAiModal
}) => {
  const { schools } = useApp();

  return (
    <div className="space-y-10 pb-12">
      
      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-2xl border border-indigo-800/60">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>SaaS de Gestion Scolaire Nouvelle Génération</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Bienvenue sur <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400">
              GESTIONNAIRE SCOLAIRE
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            La solution d'excellence pour digitaliser l'ensemble de vos établissements scolaires en Afrique. Pilotez votre école à travers nos deux grands pôles : <strong className="text-amber-300">l'Espace Direction</strong> et <strong className="text-emerald-300">l'Espace Secrétariat</strong>.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            <button
              onClick={onOpenCreateSchoolModal}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 flex items-center justify-center gap-3 cursor-pointer"
            >
              <PlusCircle className="w-6 h-6" />
              <span>CRÉER MON ÉCOLE</span>
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white border border-slate-700 font-extrabold text-sm sm:text-base transition-all hover:scale-105 flex items-center justify-center gap-3 cursor-pointer"
            >
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Accéder à l'Espace École ({schools.length})</span>
            </button>

            {onOpenAiModal && (
              <button
                onClick={onOpenAiModal}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-sm sm:text-base shadow-xl shadow-purple-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Bot className="w-5 h-5 animate-bounce" />
                <span>🤖 IA & Audit Plateforme</span>
              </button>
            )}
          </div>

          {/* Sub-Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Bulletins QR Code
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Scan OCR IA des Listes & Épreuves
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SMS / WhatsApp Automatiques
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Multi-Écoles & Caisses
            </span>
          </div>
        </div>
      </div>

      {/* SECTION ASSISTANTE IA RENFORCÉE & DOSSIER ÉLÈVE INSTANTANÉ SUR LA PAGE D'ACCUEIL */}
      <HomeAIAssistantWidget
        onNavigate={onNavigate}
        onOpenFullAiModal={onOpenAiModal}
      />

      {/* GUICHETS D'ACCÈS SÉCURISÉS PAR RÔLE & CODES SECRETS */}
      <StaffPortalsSection
        onNavigate={onNavigate}
        title="Guichets d'Accès Sécurisés : Censeur, Surveillant, Comptable, Secrétaire & Direction"
        subtitle="Renseignez ci-dessous le code d'accès secret généré par le Directeur pour déverrouiller instantanément votre espace de travail personnel."
      />

      {/* Two Core Workspaces Presentation: ESPACE DIRECTION & ESPACE SECRÉTARIAT */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider">
            Architecture des Espaces Établissement
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Une répartition claire en 2 Grands Espaces
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Chaque école dispose d'une organisation sur mesure avec des autorisations adaptées aux rôles de direction et d'exécution secrétariat.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Box 1: ESPACE DIRECTION */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-indigo-500/30 dark:border-indigo-800/60 shadow-xl space-y-6 relative overflow-hidden group hover:border-indigo-500 transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-600/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    ESPACE DIRECTION
                  </h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold uppercase">
                    Pilotage, Stratégie & Finances
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-black border border-indigo-200 dark:border-indigo-800">
                Directeur / Fondateur
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Conçu pour le Directeur Général, le Fondateur et les Comptables afin de superviser la santé financière, la discipline, les bilans ministériels et l'assistant IA Gemini Pro.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  Tableau de Bord & Stats
                </div>
                <p className="text-[11px] text-slate-500">KPIs d'effectifs, présence et taux de réussite en temps réel.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  Comptabilité & Caisses
                </div>
                <p className="text-[11px] text-slate-500">Recouvrement des scolarités, dépenses & bilans financiers.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  Gestion des Enseignants
                </div>
                <p className="text-[11px] text-slate-500">Suivi des heures, affectations aux classes & discipline.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Assistant IA Gemini Pro
                </div>
                <p className="text-[11px] text-slate-500">Rédaction de rapports d'inspection & conseils de classe.</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>Accéder au Pôle Direction</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Box 2: ESPACE SECRÉTARIAT */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/30 dark:border-emerald-800/60 shadow-xl space-y-6 relative overflow-hidden group hover:border-emerald-500 transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-600/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    ESPACE SECRÉTARIAT
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                    Inscriptions, Notes & Scolarité
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-black border border-emerald-200 dark:border-emerald-800">
                Secrétaire / Adjoint
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              L'outil de travail quotidien des secrétaires et enseignants pour gérer les dossiers élèves, numériser les fiches, saisir les notes et imprimer les bulletins trimestriels.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  Inscriptions & Fiches Élèves
                </div>
                <p className="text-[11px] text-slate-500">Enregistrement, pièces fournies et numéros matricules.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ScanLine className="w-4 h-4 text-blue-500" />
                  Scan OCR IA Listes & Épreuves
                </div>
                <p className="text-[11px] text-slate-500">Importation automatique de listes PDF/Photo et épreuves Word.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-purple-500" />
                  Bulletins Trimestriels QR Code
                </div>
                <p className="text-[11px] text-slate-500">Calcul des moyennes, rangs et impression certifiée.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  Alertes SMS & WhatsApp
                </div>
                <p className="text-[11px] text-slate-500">Envoi massif de bulletins, retards et avis d'échéances.</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('students')}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>Accéder au Pôle Secrétariat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Services Showcase Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" />
              <span>Services & Fonctionnalités Clés</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tout ce dont votre établissement a besoin pour une gestion moderne et sans faille.
            </p>
          </div>

          <button
            onClick={onOpenCreateSchoolModal}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Créer mon Établissement maintenant</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Bulletins & Certificats Authentifiés</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Calcul automatique des moyennes trimestrielles, rangs, mentions et génération de QR Code de sécurité anti-falsification.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <ScanLine className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Scan OCR IA des Listes de Classe</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Prenez en photo une feuille de présence ou un tableau : l'intelligence artificielle extrait directement les noms et prénoms.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Éditeur & Scan Épreuves Word IA</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mise en page automatique des épreuves aux normes officielles du Ministère, avec insertion du sceau de l'école.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Scolarité & Reçus Mobile Money</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Suivi individuel des versements de scolarité, reçus imprimables, états de caisse et relances automatisées.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Espaces Parents & Élèves Dediés</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Accès en ligne sécurisé pour consulter les résultats, les avis d'échéances et l'emploi du temps des enfants.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Gestion Multi-Écoles & Réseaux</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Gérez plusieurs complexes ou annexes depuis une interface unique sans déconnexion.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing / Subscriptions Summary Teaser */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 text-white space-y-6 shadow-xl border border-indigo-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              Abonnement & Licences Annuelles / Mensuelles
            </span>
            <h2 className="text-2xl font-black text-white mt-2">
              Plans d'Abonnement de 10 000 FCFA à 100 000 FCFA / mois
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Des tarifs adaptés de la petite école au complexe multi-établissements. Option de paiement mensuel ou annuel.
            </p>
          </div>

          <button
            onClick={() => onNavigate('subscriptions')}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shrink-0"
          >
            <span>Voir les Tarifs & Plans</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
            <div className="text-amber-400 font-extrabold">Pass Débutant</div>
            <div className="text-lg font-black font-mono text-white">10 000 F <span className="text-xs text-slate-400 font-normal">/ mois</span></div>
            <div className="text-[11px] text-slate-400">100 000 F / an • Jusqu'à 150 élèves</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-blue-500/40 space-y-1">
            <div className="text-blue-400 font-extrabold">Pack Primaire & Collège</div>
            <div className="text-lg font-black font-mono text-white">25 000 F <span className="text-xs text-slate-400 font-normal">/ mois</span></div>
            <div className="text-[11px] text-slate-400">250 000 F / an • Jusqu'à 450 élèves</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-500/50 space-y-1">
            <div className="text-emerald-400 font-extrabold">Pack Lycée & Complexe Pro</div>
            <div className="text-lg font-black font-mono text-white">50 000 F <span className="text-xs text-slate-400 font-normal">/ mois</span></div>
            <div className="text-[11px] text-slate-400">500 000 F / an • Jusqu'à 1 200 élèves</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-indigo-500/50 space-y-1">
            <div className="text-indigo-300 font-extrabold">Pack Groupe & Multi-Écoles VIP</div>
            <div className="text-lg font-black font-mono text-white">100 000 F <span className="text-xs text-slate-400 font-normal">/ mois</span></div>
            <div className="text-[11px] text-slate-400">1 000 000 F / an • Élèves Illimités</div>
          </div>
        </div>
      </div>

      {/* Administrator Contact Section Footer */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              Contacts Administrateur de la Plateforme
            </h3>
            <p className="text-xs text-slate-500">
              Besoin d'aide, d'un devis sur-mesure ou pour effectuer votre dépôt d'abonnement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> Dépôts Abonnement
            </div>
            <div className="text-base font-black font-mono text-slate-900 dark:text-white">01 67 43 03 81</div>
            <p className="text-[11px] text-slate-500">Numéro officiel Mobile Money (MTN, Moov, Celtiis, Wave).</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Phone className="w-4 h-4" /> Lignes Directes
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white space-y-0.5">
              <div>+229 01 67 43 03 81</div>
              <div>+229 01 43 75 45 93</div>
            </div>
            <p className="text-[11px] text-slate-500">Appels direct & WhatsApp 7j/7.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
              <Mail className="w-4 h-4" /> Email Officiel Support
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white break-all">
              Mahounouservices36@gmail.com
            </div>
            <p className="text-[11px] text-slate-500">Support administratif et facturation.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
