import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { getPublicBaseUrl } from '../lib/urlUtils';
import { defaultStaffRolePermissions } from '../data/initialData';
import { SchoolLogo } from './SchoolLogo';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Zap,
  Phone,
  Mail,
  MessageSquare,
  ShieldCheck,
  Crown,
  GraduationCap,
  Wallet,
  FileText,
  CalendarCheck
} from 'lucide-react';

interface SchoolLockGateProps {
  activeView?: string;
  onNavigate: (view: string) => void;
  onOpenCreateSchoolModal?: () => void;
}

export const SchoolLockGate: React.FC<SchoolLockGateProps> = ({
  activeView,
  onNavigate,
  onOpenCreateSchoolModal
}) => {
  const { currentSchool, unlockSchool, validateSchoolByPromoter, switchSchool, schools, isDailyAccessValid, setCurrentUser, settings, isPermanentlyRevokedSchool } = useApp();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (isPermanentlyRevokedSchool && isPermanentlyRevokedSchool(currentSchool)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-rose-500 overflow-hidden text-center p-8 space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 border border-rose-300">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-black text-[11px] uppercase tracking-wider">
              Accès Révoqué & Bloqué
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Établissement Définitivement Bloqué
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              L'accès de l'établissement <strong>« Collège Père Aupiais »</strong> à cette plateforme a été formellement révoqué, supprimé et bloqué par décision du Promoteur Général.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const safeSchool = schools.find(s => isPermanentlyRevokedSchool ? !isPermanentlyRevokedSchool(s) : true);
              if (safeSchool) switchSchool(safeSchool.id);
              onNavigate('dashboard');
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs cursor-pointer shadow-md"
          >
            Basculer vers un établissement autorisé
          </button>
        </div>
      </div>
    );
  }

  const isDailyValid = isDailyAccessValid(currentSchool.id);
  const demoPassword = currentSchool.accessPassword || 'Exc2#202';

  const staffConfigs = currentSchool.staffRolePermissions || settings.staffRolePermissions || defaultStaffRolePermissions;

  const handleRoleQuickFill = (code: string) => {
    setPassword(code);
    setError('');
  };

  const handleQuickUnlock = () => {
    const pwd = currentSchool.accessPassword || 'Exc2#202';
    setPassword(pwd);
    setError('');
    const success = unlockSchool(currentSchool.id, pwd);
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPassword('');
      }, 300);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessInfo(null);

    const inputClean = password.trim();
    if (!inputClean) {
      setError('Veuillez saisir le mot de passe de l\'école ou votre code d\'accès de poste.');
      return;
    }

    if (currentSchool.isBlocked === true || currentSchool.isValidatedByPromoter === false) {
      setError(
        currentSchool.blockReason
          ? `🔒 Accès bloqué par le Promoteur : "${currentSchool.blockReason}". Réglez votre abonnement ou contactez le promoteur pour débloquer votre école.`
          : `🔒 Accès bloqué à distance par le Promoteur Général (Abonnement requis). Contactez le Promoteur pour réactiver votre école.`
      );
      return;
    }

    // Check if input matches any staff role code
    const matchingStaff = staffConfigs.find(
      s => s.accessCode && s.accessCode.toLowerCase() === inputClean.toLowerCase()
    );

    if (matchingStaff) {
      // Log in with this specific role
      const assignedName = matchingStaff.assignedTo || (
        matchingStaff.role === 'CENSEUR' ? 'M. Le Censeur' :
        matchingStaff.role === 'SURVEILLANT' ? 'M. Le Surveillant Général' :
        matchingStaff.role === 'COMPTABLE' ? 'Mme / M. Le Comptable' :
        matchingStaff.role === 'SECRETAIRE' ? 'Secrétariat Général' :
        'M. Le Directeur Général'
      );

      const avatarMap: Record<string, string> = {
        CENSEUR: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        SURVEILLANT: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
        COMPTABLE: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
        SECRETAIRE: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
        DIRECTEUR: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
      };

      setCurrentUser({
        id: `usr-${matchingStaff.role.toLowerCase()}-${Date.now()}`,
        name: assignedName,
        email: `${matchingStaff.role.toLowerCase()}@${currentSchool.id.toLowerCase()}.educ`,
        role: matchingStaff.role,
        schoolName: currentSchool.name,
        avatar: avatarMap[matchingStaff.role] || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
      });

      unlockSchool(currentSchool.id, currentSchool.accessPassword || inputClean);
      setIsSuccess(true);
      setSuccessInfo(`Connecté sous le profil : ${matchingStaff.title}`);
      setTimeout(() => {
        setIsSuccess(false);
        setPassword('');
        const allowed = matchingStaff.allowedViews || ['dashboard'];
        const firstView = allowed.includes('*') ? 'dashboard' : (allowed[0] || 'dashboard');
        onNavigate(firstView);
      }, 500);
      return;
    }

    const success = unlockSchool(currentSchool.id, inputClean);
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPassword('');
      }, 500);
    } else {
      setError('Mot de passe ou code d\'accès incorrect. Renseignez votre code d\'accès personnel (ex: CENS-3021, SURV-4410, COMPT-5510, SEC-1490, DIR-8842).');
    }
  };

  const handleFillDemoPassword = () => {
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        
        {/* Top Decorative Gradient Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-emerald-950 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* School Badge Icon */}
          <div className="relative z-10 mx-auto flex justify-center mb-4">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
              <SchoolLogo size="lg" variant="badge" />
            </div>
          </div>

          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-widest border border-emerald-400/30">
              <Lock className="w-3.5 h-3.5" />
              <span>Tableau de Bord Protégé</span>
            </span>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white line-clamp-2">
              {currentSchool.name}
            </h2>

            <p className="text-xs text-slate-300 font-medium max-w-md mx-auto">
              Chaque établissement possède son propre tableau de bord étanche. Saisissez le mot de passe de l'école pour accéder aux données.
            </p>
          </div>
        </div>

        {/* Lock Form */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* PROMOTER VALIDATION & SUBSCRIPTION PAYWALL BANNER */}
          {(currentSchool.isValidatedByPromoter === false || currentSchool.isBlocked === true) && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950 via-slate-900 to-rose-950 border-2 border-amber-500 text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1">
                  <Crown className="h-3.5 w-3.5 text-slate-950 fill-slate-950" />
                  <span>Abonnement Plateforme Requis</span>
                </span>
                <span className="text-[10px] font-bold text-amber-300 font-mono">
                  Code École: {currentSchool.validationToken || currentSchool.id}
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-amber-300 flex items-center space-x-2">
                  <span>🔒 Tableau de Bord Verrouillé — Abonnement Requis</span>
                </h3>
                <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                  L'accès au tableau de bord complet de l'établissement <strong className="text-white">« {currentSchool.name} »</strong> nécessite la souscription d'un abonnement actif à la plateforme (<strong>5 000 FCFA / mois</strong>, <strong>50 000 FCFA / an</strong> ou <strong>250 FCFA / jour</strong>).
                </p>
                <p className="text-[11px] text-amber-200/90 mt-1">
                  💡 <em>Si vous avez été créé à distance par le Promoteur Général, la validation est déjà accordée. Sinon, réglez votre abonnement par Mobile Money pour ouvrir immédiatement votre espace.</em>
                </p>
              </div>

              <div className="pt-1">
                <a
                  href={`https://wa.me/2290167430381?text=${encodeURIComponent(`Bonjour Monsieur le Promoteur, je suis le Directeur de l'école "${currentSchool.name}". Je souhaite régler mon abonnement pour débloquer notre tableau de bord.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-md"
                >
                  <MessageSquare className="h-4 w-4 text-white" />
                  <span>Contacter le Promoteur WhatsApp pour Activer l'Abonnement</span>
                </a>
              </div>
            </div>
          )}
          
          {/* DAILY ACCESS LOCK BANNER & BUTTON */}
          {isDailyValid ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-start space-x-3 text-xs shadow-sm">
              <Sparkles className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <span className="font-black text-emerald-800 dark:text-emerald-300 text-xs uppercase tracking-wider">
                    🎁 Essai Gratuit de 7 Jours Actif
                  </span>
                  {currentSchool.dailyAccessPaidUntil && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-bold text-[10px]">
                      Jusqu'au {currentSchool.dailyAccessPaidUntil}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  Votre établissement bénéficie d'une semaine d'accès gratuit offerte. Saisissez simplement le mot de passe de votre école ci-dessous pour accéder directement à votre tableau de bord.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-orange-500/15 border-2 border-amber-400 dark:border-amber-600 space-y-3 relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1">
                  <Zap className="h-3 w-3 fill-slate-950" />
                  <span>Abonnement Expiré • 250 FCFA / jour</span>
                </span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  Numéro Dépôt : <strong className="font-mono">0167430381</strong>
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Paiement d'Accès Réseau Requis
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Votre période d'essai gratuit de 7 jours est expirée. Choisissez votre formule d'accès : <strong>250 FCFA / jour</strong>, <strong>1 250 FCFA / semaine</strong>, <strong>5 000 FCFA / mois</strong> ou <strong>50 000 FCFA / an</strong>.
                  Renseignez votre numéro de transfert pour débloquer votre accès immédiatement.
                </p>
              </div>

              <a
                href={`https://wa.me/2290167430381?text=${encodeURIComponent(`Bonjour Monsieur le Promoteur, je suis le Directeur de l'école "${currentSchool.name}". Ma période d'accès est expirée, je souhaite renouveler mon abonnement.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 text-white" />
                <span>Demander le renouvellement au Promoteur sur WhatsApp</span>
              </a>
            </div>
          )}

          {/* QUICK 1-CLICK UNLOCK BANNER (ONLY IF SCHOOL IS UNBLOCKED AND TRIAL/ACCESS IS ACTIVE) */}
          {isDailyValid && currentSchool.isBlocked !== true && currentSchool.isValidatedByPromoter !== false && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-2 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 text-xs space-y-2 shadow-sm">
              <div className="flex items-center justify-between font-black">
                <span className="flex items-center space-x-1.5 text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <span>Déverrouillage Rapide en 1 Clic</span>
                </span>
                <span className="font-mono bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100 px-2 py-0.5 rounded text-[11px] font-black">
                  Code : {demoPassword}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Cliquez ci-dessous pour déverrouiller immédiatement le tableau de bord et reprendre votre travail.
              </p>
              <button
                type="button"
                onClick={handleQuickUnlock}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center space-x-2 transition-all shadow-md transform hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                <Lock className="h-4 w-4 text-white" />
                <span>🔓 DÉVERROUILLER EN 1 CLIC MAINTENANT</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
                <KeyRound className="h-4 w-4 text-emerald-500" />
                <span>Accès réservé au personnel autorisé</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                {(!isDailyValid || currentSchool.isBlocked === true || currentSchool.isValidatedByPromoter === false)
                  ? "🔒 L'accès au tableau de bord est actuellement bloqué. Saisissez votre mot de passe après avoir régularisé votre abonnement auprès du Promoteur Général."
                  : "Vous pouvez également déverrouiller le tableau de bord en saisissant le mot de passe secret de votre école ou votre code de poste."}
              </p>
            </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center space-x-2 animate-shake">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Mot de passe de l'établissement *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe..."
                className="w-full pl-4 pr-11 py-3.5 text-base tracking-widest font-mono rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-bold text-center outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Staff Role Access Codes Quick Chooser */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-black text-indigo-900 dark:text-indigo-200">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Codes d'Accès par Rôle (Générés par la Direction) :</span>
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {staffConfigs.map(staff => (
                <button
                  key={staff.role}
                  type="button"
                  onClick={() => handleRoleQuickFill(staff.accessCode)}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-500 text-left transition-all cursor-pointer flex flex-col"
                >
                  <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 truncate">
                    {staff.role === 'CENSEUR' ? '🎓 Censeur' :
                     staff.role === 'SURVEILLANT' ? '👮 Surveillant' :
                     staff.role === 'COMPTABLE' ? '💰 Comptable' :
                     staff.role === 'SECRETAIRE' ? '📋 Secrétaire' : '👑 Direction'}
                  </span>
                  <code className="font-mono text-[10px] font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {staff.accessCode}
                  </code>
                </button>
              ))}
            </div>
          </div>

          {/* Demo Password Auto-Fill Hint */}
          {currentSchool.isDemo && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs gap-2">
              <div className="space-y-0.5">
                <span className="block text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  🔑 Mot de passe Démo : <code className="bg-amber-200/60 dark:bg-amber-900/80 px-1.5 py-0.5 rounded font-mono font-black">{demoPassword}</code>
                </span>
                <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                  Code par défaut de test
                </span>
              </div>
              <button
                type="button"
                onClick={handleFillDemoPassword}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold uppercase tracking-wider transition-colors shrink-0 cursor-pointer shadow-sm"
              >
                Remplir
              </button>
            </div>
          )}

          {/* Unlock Submit Button */}
          <button
            type="submit"
            disabled={isSuccess}
            className={`w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center space-x-2 shadow-xl transition-all cursor-pointer ${
              isSuccess
                ? 'bg-emerald-600'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 transform hover:scale-[1.02] active:scale-95'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span>ACCÈS AUTORISÉ ! ACCÈS AU TABLEAU DE BORD...</span>
              </>
            ) : (
              <>
                <Lock className="h-5 w-5" />
                <span>DÉVERROUILLER CET ÉTABLISSEMENT</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {/* Secondary Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="flex items-center space-x-1.5 font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour à l'accueil</span>
            </button>

            {onOpenCreateSchoolModal && (
              <button
                type="button"
                onClick={onOpenCreateSchoolModal}
                className="flex items-center space-x-1.5 font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Créer une autre école</span>
              </button>
            )}
          </div>

        </form>
      </div>

    </div>
  </div>
  );
};
