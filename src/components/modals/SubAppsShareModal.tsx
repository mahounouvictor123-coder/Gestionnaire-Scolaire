import React, { useState } from 'react';
import { useApp } from '../../lib/store';
import { 
  X, 
  Smartphone, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Users, 
  GraduationCap, 
  MessageCircle, 
  QrCode,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface SubAppsShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSubApp?: (appType: 'parent' | 'teacher') => void;
}

export const SubAppsShareModal: React.FC<SubAppsShareModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSubApp
}) => {
  const { currentSchool, settings } = useApp();

  const [copiedType, setCopiedType] = useState<'parent' | 'teacher' | null>(null);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  const parentAppUrl = `${origin}${pathname}?subapp=parent&school=${encodeURIComponent(currentSchool.id)}`;
  const teacherAppUrl = `${origin}${pathname}?subapp=teacher&school=${encodeURIComponent(currentSchool.id)}`;

  const handleCopy = (url: string, type: 'parent' | 'teacher') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleShareWhatsAppParents = () => {
    const text = `📢 *Chers Parents d'Élèves de ${currentSchool.name}*,\n\nVoici le lien officiel pour installer l'application mobile de l'école sur votre téléphone :\n👉 ${parentAppUrl}\n\n📲 *Fonctionnalités :*\n- Suivi des notes et évaluations en direct\n- Réception de tous les messages et circulaires de l'école\n- Suivi des tranches de scolarité et reçus de paiement\n\n_Il vous suffit de sélectionner la classe et le nom de votre enfant !_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareWhatsAppTeachers = () => {
    const text = `👨‍🏫 *Chers Enseignants de ${currentSchool.name}*,\n\nVoici votre application mobile dédiée pour renseigner les notes et évaluations de vos classes :\n👉 ${teacherAppUrl}\n\n⏳ *Rappel :* Les notes saisies restent modifiables pendant 3 jours (72h), et se synchronisent en direct avec la Direction et les parents.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">
                Accès Mobiles Autonomes • PWA
              </span>
              <h3 className="text-lg font-black leading-tight">
                Sous-Applications Parents & Professeurs
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start space-x-3 text-xs text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Ces sous-applications fonctionnent de façon <strong>100% autonome et sécurisée</strong> sans donner accès au tableau de bord général. Les utilisateurs peuvent les <strong>ajouter directement à l'écran d'accueil</strong> de leur téléphone avec le nom officiel de l'école : <strong>« {currentSchool.name} »</strong>.
            </p>
          </div>

          {/* Section 1: Application Parents */}
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    1. Sous-Plateforme Parents d'Élèves
                  </h4>
                  <p className="text-xs text-blue-300">
                    Notes en direct • Messages de l'école • Suivi des tranches de scolarité
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Lecture Seule Sécurisée
              </span>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input 
                type="text" 
                readOnly 
                value={parentAppUrl} 
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 select-all"
              />
              <button
                onClick={() => handleCopy(parentAppUrl, 'parent')}
                className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedType === 'parent' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'parent' ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={handleShareWhatsAppParents}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center space-x-2 shadow cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Diffuser sur WhatsApp aux Parents</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToSubApp) {
                    onNavigateToSubApp('parent');
                    onClose();
                  } else {
                    window.open(parentAppUrl, '_blank');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ouvrir l'Espace</span>
              </button>
            </div>
          </div>

          {/* Section 2: Application Enseignants */}
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    2. Sous-Application Professeurs (Saisie des Notes)
                  </h4>
                  <p className="text-xs text-emerald-300">
                    Saisie directe par classe • Modifiable pendant 3 jours seulement (72h)
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Délai 3 Jours
              </span>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input 
                type="text" 
                readOnly 
                value={teacherAppUrl} 
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 select-all"
              />
              <button
                onClick={() => handleCopy(teacherAppUrl, 'teacher')}
                className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedType === 'teacher' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'teacher' ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={handleShareWhatsAppTeachers}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center space-x-2 shadow cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Diffuser sur WhatsApp aux Professeurs</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToSubApp) {
                    onNavigateToSubApp('teacher');
                    onClose();
                  } else {
                    window.open(teacherAppUrl, '_blank');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ouvrir l'Espace</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
