import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  PlusSquare,
  Share2,
  MoreVertical,
  CheckCircle2,
  ShieldCheck,
  Monitor,
  Laptop,
  Download,
  Sparkles
} from 'lucide-react';
import {
  triggerAutoInstall,
  downloadDesktopShortcut,
  isDesktopPC,
  isAppInstalled
} from '../../lib/pwaInstallManager';

export interface PwaInstallGuideModalProps {
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
  const [isPC, setIsPC] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [shortcutDownloaded, setShortcutDownloaded] = useState(false);

  useEffect(() => {
    setIsPC(isDesktopPC());
    setIsInstalled(isAppInstalled());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const res = await triggerAutoInstall();
    if (res.success && res.outcome === 'accepted') {
      setIsInstalled(true);
      setTimeout(() => onClose(), 1500);
    }
  };

  const handleDownloadShortcut = () => {
    downloadDesktopShortcut(`${schoolName} - ${appTitle}`);
    setShortcutDownloaded(true);
    setTimeout(() => setShortcutDownloaded(false), 4000);
  };

  const fullDisplayTitle = `${schoolName} - ${appTitle}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md">
              {isPC ? <Monitor className="w-6 h-6 text-white" /> : <Smartphone className="w-6 h-6 text-white" />}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-200">
                {isPC ? "Installation Automatique PC & Bureau" : "Installation Mobile Directe"}
              </span>
              <h3 className="text-lg font-black leading-tight">
                {isPC ? "Ajouter l'App sur votre PC" : "Ajouter à l'écran d'accueil"}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200">
          
          {/* Badge School name with Official Logo */}
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-slate-950 p-1 border border-sky-400 shadow-md shrink-0 flex items-center justify-center">
              <img
                src="/pwa-192x192.png"
                onError={(e) => { (e.target as HTMLImageElement).src = '/icon.svg'; }}
                alt="Logo Officiel"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div className="text-xs min-w-0">
              <p className="font-bold text-sky-950 dark:text-sky-200 truncate">
                {isPC ? "Icône sur votre écran d'ordinateur :" : "Nom affiché sur votre écran :"}
              </p>
              <p className="font-black text-sm text-sky-700 dark:text-sky-400 mt-0.5 truncate">
                « {fullDisplayTitle} »
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Logo officiel inclus</span>
              </p>
            </div>
          </div>

          {/* Direct Install Button */}
          <div className="space-y-2.5">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              {isPC ? <Monitor className="w-5 h-5" /> : <Download className="w-5 h-5" />}
              <span>{isPC ? "Installer sur ce PC maintenant" : "Installer directement maintenant"}</span>
            </button>

            {isPC && (
              <button
                onClick={handleDownloadShortcut}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                <Laptop className="w-4 h-4 text-sky-500" />
                <span>
                  {shortcutDownloaded
                    ? "✓ Raccourci téléchargé ! Glissez-le sur votre Bureau"
                    : "Créer le raccourci Bureau PC (.url avec logo)"}
                </span>
              </button>
            )}
          </div>

          {isPC ? (
            /* PC Instructions */
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-black text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                <span>Installation sur PC (Chrome / Edge / Brave / Opera)</span>
              </div>
              <div className="text-xs space-y-1.5 pl-8 text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  1. Cliquez sur le bouton vert <strong>« Installer sur ce PC maintenant »</strong> ci-dessus.
                </p>
                <p>
                  2. Ou regardez à droite dans la <strong>barre d'adresse</strong> en haut de votre navigateur : cliquez sur l'icône <strong>⊕</strong> ou <strong>ordinateur</strong>.
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ L'application s'ajoute immédiatement à votre Bureau avec son logo officiel.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Android Guide */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-black text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">1</span>
                  <span>Sur Android (Google Chrome)</span>
                </div>
                <ol className="text-xs space-y-2 pl-8 list-decimal text-slate-600 dark:text-slate-300">
                  <li>
                    Appuyez sur les <strong>3 petits points verticaux</strong> (<MoreVertical className="w-3.5 h-3.5 inline mx-0.5" />) en haut à droite.
                  </li>
                  <li>
                    Sélectionnez <strong>« Ajouter à l'écran d'accueil »</strong> ou <strong>« Installer l'application »</strong>.
                  </li>
                  <li>
                    Validez en cliquant sur <strong>« Ajouter »</strong>.
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
                    Appuyez sur le bouton <strong>Partager</strong> (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" />) au bas de l'écran.
                  </li>
                  <li>
                    Faites défiler vers le bas et appuyez sur <strong>« Sur l'écran d'accueil »</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5" />).
                  </li>
                  <li>
                    Appuyez sur <strong>« Ajouter »</strong> en haut à droite.
                  </li>
                </ol>
              </div>
            </>
          )}

          {/* Security note */}
          <div className="flex items-start space-x-2.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              Lien officiel et sécurisé direct avec l'établissement <strong>{schoolName}</strong>. Fonctionne hors-ligne et en plein écran.
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
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
