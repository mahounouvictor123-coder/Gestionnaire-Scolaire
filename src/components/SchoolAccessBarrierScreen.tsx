import React from 'react';
import {
  ShieldAlert,
  Lock,
  MessageSquare,
  Phone,
  ArrowLeft,
  Crown,
  AlertTriangle,
  Building2,
  ExternalLink
} from 'lucide-react';

interface SchoolAccessBarrierScreenProps {
  status: 'BLOCKED' | 'DELETED';
  schoolName?: string;
  schoolId?: string;
  blockReason?: string;
  blockedAt?: string;
  onReturnHome?: () => void;
  isPromoter?: boolean;
  onOpenPromoterSpace?: () => void;
}

export const SchoolAccessBarrierScreen: React.FC<SchoolAccessBarrierScreenProps> = ({
  status,
  schoolName,
  schoolId,
  blockReason,
  blockedAt,
  onReturnHome,
  isPromoter,
  onOpenPromoterSpace
}) => {
  const promoterWhatsAppNumber = '2290167430381';
  const promoterPhoneFormatted = '+229 01 67 43 03 81';

  const defaultBlockedReason =
    blockReason ||
    "Abonnement plateforme requis ou accès suspendu à distance par le Promoteur Général.";

  const whatsappMessage =
    status === 'BLOCKED'
      ? `Bonjour Monsieur le Promoteur, je vous contacte au sujet de l'établissement "${schoolName || schoolId || 'Mon École'}" dont l'accès a été suspendu/bloqué. Je souhaite régulariser la situation afin de réactiver nos liens et espaces.`
      : `Bonjour Monsieur le Promoteur, je vous contacte car le lien d'accès de l'établissement "${schoolName || schoolId || 'Mon École'}" indique que l'école a été supprimée. Je souhaite avoir des informations.`;

  const whatsappUrl = `https://wa.me/${promoterWhatsAppNumber}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const [showPromoterPinInput, setShowPromoterPinInput] = React.useState(false);
  const [promoterPin, setPromoterPin] = React.useState('');
  const [pinError, setPinError] = React.useState('');

  const handleReturnHome = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('GESTIONNAIRE_SCOLAIRE_V3_CURRENT_SCHOOL_ID', 'sch-temple');
        const cleanUrl = window.location.pathname || '/';
        window.history.replaceState(null, '', cleanUrl);
      } catch (e) {}
    }
    if (onReturnHome) {
      onReturnHome();
    }
  };

  const handlePromoterUnlock = () => {
    const cleanPin = promoterPin.trim();
    if (cleanPin === '2025' || cleanPin === '2026' || cleanPin === '1234' || cleanPin === '0000' || isPromoter) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('GESTIONNAIRE_PROMOTER_AUTH', 'true');
        try {
          const cleanUrl = window.location.pathname || '/';
          window.history.replaceState(null, '', cleanUrl);
        } catch (e) {}
      }
      if (onOpenPromoterSpace) {
        onOpenPromoterSpace();
      } else {
        handleReturnHome();
      }
    } else {
      setPinError('Code PIN Promoteur incorrect. Réessayez.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-rose-600/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative">
        
        {/* Top Glowing Ambient Accents */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-center border-b border-rose-900/40 relative z-10">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-900/40 border-2 border-rose-500/60 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/50 mb-4">
            {status === 'BLOCKED' ? (
              <Lock className="w-10 h-10 text-rose-400 animate-pulse" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-rose-400" />
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-black text-[11px] uppercase tracking-wider border border-rose-500/30">
            {status === 'BLOCKED' ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Accès Établissement Suspendu</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Lien Inactif • Établissement Supprimé</span>
              </>
            )}
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-white mt-3 leading-tight">
            {status === 'BLOCKED'
              ? "Accès Verrouillé par le Promoteur Général"
              : "Ce lien d'accès ne fonctionne plus"}
          </h1>

          <div className="mt-2 text-sm text-rose-200/90 font-medium">
            {schoolName ? (
              <span className="inline-flex items-center gap-1.5 font-bold">
                <Building2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{schoolName}</span>
              </span>
            ) : (
              <span className="font-mono text-xs text-slate-400">
                Identifiant : {schoolId || 'Inconnu'}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 relative z-10">
          {status === 'BLOCKED' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 space-y-2">
                <span className="text-[11px] font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Motif de la suspension à distance</span>
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold">
                  "{defaultBlockedReason}"
                </p>
                {blockedAt && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    Verrouillé le : {new Date(blockedAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>
                  <strong>Conséquence immédiate :</strong> Tous les liens de cet établissement sont actuellement désactivés et inaccessibles (Tableau de bord de Direction, Espace Enseignants, Espace Parents et consultation des Bulletins scolaires).
                </p>
                <p className="text-slate-400">
                  Pour réactiver l'accès de votre école et rétablir instantanément le fonctionnement de tous vos liens, veuillez contacter directement le Promoteur Général via WhatsApp ou par téléphone.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <p className="font-semibold text-rose-200">
                  L'établissement scolaire associé à ce lien a été définitivement supprimé ou retiré du réseau par l'Administration Centrale.
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Ce lien d'accès ainsi que tous les sous-liens (direction, professeurs, parents et élèves) sont désormais définitivement hors service.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
                Si vous estimez qu'il s'agit d'une erreur ou si vous souhaitez réinscrire votre école sur la plateforme, veuillez joindre le Promoteur Général.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center space-x-2.5 shadow-xl shadow-emerald-950/50 transition-all transform hover:scale-[1.01] active:scale-98 cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 text-white fill-white/20" />
              <span>Contacter le Promoteur sur WhatsApp</span>
            </a>

            <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 font-mono">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Numéro direct : <strong className="text-white">{promoterPhoneFormatted}</strong></span>
            </div>

            {/* Return home button */}
            <button
              type="button"
              onClick={handleReturnHome}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 active:scale-98 text-white font-black text-sm flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-lg border border-slate-600"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Retourner à l'accueil général de la plateforme</span>
            </button>

            {/* Promoter Access Section */}
            <div className="pt-2 border-t border-slate-800/80">
              {isPromoter ? (
                <button
                  type="button"
                  onClick={onOpenPromoterSpace || handlePromoterUnlock}
                  className="w-full py-3 px-4 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/50 text-purple-200 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Crown className="w-4 h-4 text-purple-400" />
                  <span>Vous êtes le Promoteur : Ouvrir le Panneau Central pour Débloquer</span>
                </button>
              ) : showPromoterPinInput ? (
                <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/60 space-y-2">
                  <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
                    <span>Accès Promoteur Général</span>
                    <button
                      type="button"
                      onClick={() => { setShowPromoterPinInput(false); setPinError(''); }}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Annuler
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Code PIN Promoteur (ex: 2025)"
                      value={promoterPin}
                      onChange={(e) => setPromoterPin(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePromoterUnlock()}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-purple-600/50 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handlePromoterUnlock}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
                    >
                      Déverrouiller
                    </button>
                  </div>
                  {pinError && <p className="text-[11px] text-rose-400 font-medium">{pinError}</p>}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPromoterPinInput(true)}
                  className="w-full py-2 px-3 text-[11px] text-purple-400 hover:text-purple-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-purple-400" />
                  <span>Espace Promoteur Général (Accès Administrateur Réseau)</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Footer Stamp */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-400 font-medium">
          Plateforme Nationale de Gestion Scolaire • Système de Sécurité et Contrôle Réseau
        </div>

      </div>
    </div>
  );
};
