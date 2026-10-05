/**
 * Gestionnaire d'installation PWA universel (PC & Mobile)
 * Permet l'installation automatique sur PC (Bureau, Menu Démarrer, Barre des tâches) avec logo officiel
 */

let globalDeferredPrompt: any = null;
const listeners = new Set<(prompt: any) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    listeners.forEach((fn) => fn(e));
    console.log('[PWA] Événement d’installation prêt pour PC / Mobile.');
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    listeners.forEach((fn) => fn(null));
    console.log('[PWA] Application officiellement installée sur l’appareil !');
  });
}

export const getDeferredPrompt = () => globalDeferredPrompt;

export const subscribeToInstallPrompt = (callback: (prompt: any) => void) => {
  listeners.add(callback);
  callback(globalDeferredPrompt);
  return () => {
    listeners.delete(callback);
  };
};

/**
 * Détecte si l'utilisateur est sur un PC de bureau ou un ordinateur portable (Windows, Mac, Linux, Chromebook)
 */
export const isDesktopPC = (): boolean => {
  if (typeof window === 'undefined') return true;
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
  return !isMobile;
};

/**
 * Vérifie si l'application est déjà lancée en mode autonome (déjà installée sur PC ou smartphone)
 */
export const isAppInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Déclenche l'installation automatique de l'application sur le PC ou smartphone
 * Retourne le résultat de l'installation
 */
export const triggerAutoInstall = async (): Promise<{
  success: boolean;
  outcome?: 'accepted' | 'dismissed';
  needGuide?: boolean;
}> => {
  if (globalDeferredPrompt) {
    try {
      globalDeferredPrompt.prompt();
      const choice = await globalDeferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        globalDeferredPrompt = null;
        listeners.forEach((fn) => fn(null));
        return { success: true, outcome: 'accepted' };
      }
      return { success: false, outcome: 'dismissed' };
    } catch (err) {
      console.warn('[PWA] Erreur déclenchement prompt:', err);
    }
  }

  // Si le prompt natif n'est pas encore disponible
  return { success: false, needGuide: true };
};

/**
 * Génère et télécharge un raccourci direct Bureau Windows (.url) avec icône et URL
 * Fonctionne instantanément sur 100% des PC Windows même sans prompt PWA.
 */
export const downloadDesktopShortcut = (customTitle?: string) => {
  if (typeof window === 'undefined') return;

  const appName = customTitle || 'Gestionnaire Scolaire';
  const appUrl = window.location.origin + '/';
  const iconUrl = `${window.location.origin}/favicon.png`;

  // Contenu d'un fichier .url standard Windows
  const shortcutContent = `[InternetShortcut]\r\nURL=${appUrl}\r\nIconFile=${iconUrl}\r\nIconIndex=0\r\nHotKey=0\r\nIDList=\r\n[{000214A0-0000-0000-C000-000000000046}]\r\nProp3=19,11\r\n`;

  const blob = new Blob([shortcutContent], { type: 'application/x-mswinurl;charset=utf-8' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `${appName}.url`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(downloadLink.href);
};
