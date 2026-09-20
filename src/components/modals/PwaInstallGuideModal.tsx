import React from 'react';
import { X, Smartphone, PlusSquare, Share2, MoreVertical, CheckCircle2, ShieldCheck } from 'lucide-react';

interface PwaInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  appTitle: string; // e.g. "Espace Parents" or "Notes Professeurs"
}

export const PwaInstallGuideModalProps: React.FC<PwaInstallGuideModalProps> = ({
  isOpen,
  onClose,
  schoolName,
  appTitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-200">
                Installation Mobile Directe
              </span>
              <h3 className="text-lg font-black leading-tight">
                Ajouter à l'écran d'accueil
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
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          
          {/* Badge School name */}
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-600 text-white shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-sky-950 dark:text-sky-200">
                Nom affiché sur votre écran de téléphone :
              </p>
              <p className="font-black text-sm text-sky-700 dark:text-sky-400 mt-0.5">
                « {schoolName} - {appTitle} »
              </p>
            </div>
          </div>

          {/* Android Guide */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-black text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">1</span>
              <span>Sur Android (Google Chrome)</span>
            </div>
            <ol className="text-xs space-y-2 pl-8 list-decimal text-slate-600 dark:text-slate-300">
              <li>
                Appuyez sur les <strong>3 petits points verticaux</strong> (<MoreVertical className="w-3.5 h-3.5 inline mx-0.5" />) en haut à droite de Chrome.
              </li>
              <li>
                Sélectionnez <strong>« Ajouter à l'écran d'accueil »</strong> ou <strong>« Installer l'application »</strong>.
              </li>
              <li>
                Validez en cliquant sur <strong>« Ajouter »</strong>. L'icône avec le nom de l'école apparaîtra immédiatement parmi vos applications !
              </li>
            </ol>
          </div>

          {/* iPhone / iPad Guide */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-black text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
              <span>Sur iPhone & iPad (Safari)</span>
            </div>
            <ol className="text-xs space-y-2 pl-8 list-decimal text-slate-600 dark:text-slate-300">
              <li>
                Appuyez sur le bouton <strong>Partager</strong> (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" />) au bas de l'écran dans Safari.
              </li>
              <li>
                Faites défiler vers le bas et appuyez sur <strong>« Sur l'écran d'accueil »</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5" />).
              </li>
              <li>
                Appuyez sur <strong>« Ajouter »</strong> en haut à droite. L'application est installée sans passer par l'App Store !
              </li>
            </ol>
          </div>

          {/* Security note */}
          <div className="flex items-start space-x-2.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              Lien officiel et sécurisé direct avec l'établissement <strong>{schoolName}</strong>. Vos données restent synchronisées en temps réel.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            J'ai compris
          </button>
        </div>

      </div>
    </div>
  );
};
