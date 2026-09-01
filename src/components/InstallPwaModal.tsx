import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle, Share, PlusSquare, X, Monitor, ShieldCheck } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Detect if standalone / installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Capture install prompt event for Android & Chrome
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-5 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top App Icon Badge */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-slate-950 p-2 border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/20 flex items-center justify-center">
            <img src="/icon.svg" alt="Gestionnaire Scolaire Logo" className="w-full h-full object-contain" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Application Officielle</span>
            </span>
            <h2 className="text-xl font-black text-white mt-2">GESTIONNAIRE SCOLAIRE</h2>
            <p className="text-xs text-slate-400 font-medium">Ajouter à l'écran d'accueil de votre téléphone</p>
          </div>
        </div>

        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-emerald-300">Application déjà installée !</p>
            <p className="text-xs text-slate-300">
              Retrouvez l'icône sur l'écran d'accueil de votre smartphone ou tablette pour un accès instantané en plein écran.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Automatic Android/Chrome Install Button if supported */}
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>Installer directement maintenant</span>
              </button>
            )}

            {/* Step-by-step instructions for iPhone/iOS */}
            {isIOS ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Smartphone className="w-4 h-4" />
                  <span>Instructions pour iPhone / iPad :</span>
                </div>
                <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside font-medium leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Share className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Appuyez sur le bouton <strong>Partager</strong> en bas de Safari.</span>
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
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Smartphone className="w-4 h-4" />
                  <span>Procédure manuelle Android / Safari / Chrome :</span>
                </div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside font-medium leading-relaxed">
                  <li>Ouvrez le menu du navigateur (3 petits points <strong>⋮</strong> ou partager).</li>
                  <li>Sélectionnez <strong>« Ajouter à l'écran d'accueil »</strong> ou <strong>« Installer l'application »</strong>.</li>
                  <li>L'application apparaîtra immédiatement avec son logo officiel sur votre écran d'accueil.</li>
                </ol>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 text-center border-t border-slate-800">
          <p className="text-[10px] text-slate-500 font-medium">
            ⚡ Fonctionne hors-ligne et démarre comme une véritable application native.
          </p>
        </div>

      </div>
    </div>
  );
};
