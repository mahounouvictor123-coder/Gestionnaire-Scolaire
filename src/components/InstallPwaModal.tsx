import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle,
  Share,
  PlusSquare,
  X,
  Monitor,
  ShieldCheck,
  Laptop,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import {
  triggerAutoInstall,
  downloadDesktopShortcut,
  isDesktopPC,
  isAppInstalled,
  subscribeToInstallPrompt
} from '../lib/pwaInstallManager';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  appName = 'GESTIONNAIRE SCOLAIRE'
}) => {
  const [hasPrompt, setHasPrompt] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPC, setIsPC] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [shortcutDownloaded, setShortcutDownloaded] = useState(false);

  useEffect(() => {
    setIsPC(isDesktopPC());
    setIsInstalled(isAppInstalled());

    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    const unsubscribe = subscribeToInstallPrompt((prompt) => {
      setHasPrompt(!!prompt);
    });

    return () => unsubscribe();
  }, []);

  const handleInstallClick = async () => {
    const res = await triggerAutoInstall();
    if (res.success && res.outcome === 'accepted') {
      setIsInstalled(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleDownloadShortcut = () => {
    downloadDesktopShortcut(appName);
    setShortcutDownloaded(true);
    setTimeout(() => setShortcutDownloaded(false), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6 overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top App Icon Badge & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative w-24 h-24 rounded-3xl bg-slate-950 p-2.5 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20 flex items-center justify-center group">
            <img
              src="/pwa-512x512.png"
              onError={(e) => {
                // Fallback to SVG if PNG is loading
                (e.target as HTMLImageElement).src = '/icon.svg';
              }}
              alt={`${appName} Logo`}
              className="w-full h-full object-contain rounded-2xl drop-shadow-md"
            />
            <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-emerald-600 text-white shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Application Officielle Certifiée</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight">
              {appName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-sm mx-auto mt-1">
              {isPC
                ? "Ajoutez l'application sur votre écran de PC (Bureau & Barre des tâches) avec son logo officiel."
                : "Ajoutez l'application à l'écran d'accueil de votre smartphone ou tablette."}
            </p>
          </div>
        </div>

        {isInstalled ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2.5">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-base font-extrabold text-emerald-300">Application déjà installée !</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isPC
                ? "L'icône avec le logo officiel est présente sur votre Bureau Windows / Mac et dans votre menu d'applications. Vous pouvez la lancer directement en plein écran sans navigateur."
                : "Retrouvez l'icône sur votre écran d'accueil pour un accès instantané."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Action principale d'installation directe */}
            <button
              onClick={handleInstallClick}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center space-x-2.5 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              {isPC ? <Monitor className="w-5 h-5 text-emerald-200" /> : <Download className="w-5 h-5 text-emerald-200" />}
              <span>
                {isPC ? "Installer l'App sur ce PC maintenant" : "Installer directement sur l'écran d'accueil"}
              </span>
            </button>

            {/* Pour PC : Bouton Raccourci Bureau direct (.url) */}
            {isPC && (
              <div className="space-y-2">
                <button
                  onClick={handleDownloadShortcut}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  <span>
                    {shortcutDownloaded
                      ? "✓ Raccourci téléchargé ! Glissez-le sur votre Bureau"
                      : "Créer le raccourci Bureau PC (.url avec logo)"}
                  </span>
                </button>
              </div>
            )}

            {/* Guide spécifique pour PC */}
            {isPC ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <Monitor className="w-4 h-4" />
                  <span>Installation automatique sur PC (Chrome / Edge / Brave) :</span>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    1. Cliquez sur le bouton vert <strong>« Installer l'App sur ce PC »</strong> ci-dessus.
                  </p>
                  <p>
                    2. Ou dans la <strong>barre d'adresse</strong> de votre navigateur en haut à droite, cliquez sur l'icône <strong>⊕</strong> ou <strong>ordinateur</strong> (« Installer Gestionnaire Scolaire »).
                  </p>
                  <p className="text-emerald-400 font-semibold">
                    ✓ L'icône de l'école apparaîtra automatiquement sur votre Bureau Windows/Mac avec son logo officiel.
                  </p>
                </div>
              </div>
            ) : isIOS ? (
              /* Instructions iOS */
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Smartphone className="w-4 h-4" />
                  <span>Instructions pour iPhone / iPad (Safari) :</span>
                </div>
                <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside font-medium leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Share className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Touchez le bouton <strong>Partager</strong> en bas de Safari.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Faites défiler puis touchez <strong>« Sur l'écran d'accueil »</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Confirmez en touchant <strong>« Ajouter »</strong> en haut à droite.</span>
                  </li>
                </ol>
              </div>
            ) : (
              /* Instructions Android */
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Smartphone className="w-4 h-4" />
                  <span>Instructions Android :</span>
                </div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside font-medium leading-relaxed">
                  <li>Ouvrez le menu du navigateur (3 petits points <strong>⋮</strong>).</li>
                  <li>Sélectionnez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</li>
                  <li>L'application apparaîtra avec son logo officiel sur votre écran d'accueil.</li>
                </ol>
              </div>
            )}

          </div>
        )}

        <div className="pt-2 text-center border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>⚡ Fonctionne en plein écran & hors-ligne</span>
          <span className="text-emerald-400 font-bold">Logo officiel HD inclus</span>
        </div>

      </div>
    </div>
  );
};
