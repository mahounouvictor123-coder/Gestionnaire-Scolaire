/**
 * PWA & Dynamic School Branding Helper
 * Permet d'afficher dynamiquement le nom de l'école lorsqu'on ajoute la sous-plateforme à l'écran d'accueil
 * et de gérer les notifications hors plate-forme (Notification API / Web Push)
 */

export const updateDynamicPwaBranding = (
  schoolName: string, 
  appType: 'PARENT' | 'TEACHER' | 'ADMIN'
) => {
  if (typeof document === 'undefined') return;

  const appSubtitle = appType === 'PARENT' 
    ? 'Espace Parents' 
    : appType === 'TEACHER' 
      ? 'Notes Professeurs' 
      : 'Gestion Scolaire';

  const fullTitle = `${schoolName} - ${appSubtitle}`;
  document.title = fullTitle;

  // Update apple-mobile-web-app-title
  let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (!appleTitleMeta) {
    appleTitleMeta = document.createElement('meta');
    appleTitleMeta.setAttribute('name', 'apple-mobile-web-app-title');
    document.head.appendChild(appleTitleMeta);
  }
  appleTitleMeta.setAttribute('content', `${schoolName.slice(0, 18)} - ${appSubtitle}`);

  // Update application-name
  let appNameMeta = document.querySelector('meta[name="application-name"]');
  if (!appNameMeta) {
    appNameMeta = document.createElement('meta');
    appNameMeta.setAttribute('name', 'application-name');
    document.head.appendChild(appNameMeta);
  }
  appNameMeta.setAttribute('content', fullTitle);

  // Dynamically update Manifest blob if supported
  try {
    const currentUrl = window.location.href;
    const manifestData = {
      short_name: `${schoolName.slice(0, 12)}`,
      name: fullTitle,
      description: `Application mobile officielle de ${schoolName} (${appSubtitle})`,
      start_url: currentUrl,
      scope: window.location.pathname,
      display: 'standalone',
      background_color: '#0f172a',
      theme_color: appType === 'PARENT' ? '#1d4ed8' : '#059669',
      icons: [
        {
          src: '/icon.svg',
          sizes: '192x192 512x512',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        }
      ]
    };

    const stringManifest = JSON.stringify(manifestData);
    const blob = new Blob([stringManifest], { type: 'application/manifest+json' });
    const manifestURL = URL.createObjectURL(blob);

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.setAttribute('href', manifestURL);
    }
  } catch (err) {
    console.debug('Dynamic manifest injection notice:', err);
  }
};

/**
 * Gestion des notifications hors plate-forme (Browser Notification API)
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
};

export const sendSystemNotification = (title: string, options?: { body?: string; icon?: string; tag?: string }) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  // Play a soft notification audio chime if supported
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options?.body || 'Consultez votre espace pour voir le détail.',
        icon: options?.icon || '/icon.svg',
        tag: options?.tag || 'school-alert',
        badge: '/icon.svg'
      });
    } catch (e) {
      console.debug('Direct Notification instantiation failed, fallback to in-app toast:', e);
    }
  }
};
