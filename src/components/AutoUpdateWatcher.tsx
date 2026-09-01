import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Cloud,
  Layers,
  ArrowRight,
  X,
  Radio
} from 'lucide-react';

interface AppVersionInfo {
  version: string;
  bootTime: string;
  timestamp: number;
  status: string;
  features?: string[];
}

export const AutoUpdateWatcher: React.FC = () => {
  const [initialBootTime, setInitialBootTime] = useState<string | null>(null);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [newVersionDetails, setNewVersionDetails] = useState<AppVersionInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Check version from server
  const checkAppVersion = useCallback(async () => {
    try {
      const response = await fetch(`/api/app-version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data: AppVersionInfo = await response.json();
        setLastCheckTime(new Date());

        if (!initialBootTime) {
          setInitialBootTime(data.bootTime);
        } else if (initialBootTime !== data.bootTime) {
          // Server was updated/rebuilt with new changes!
          setHasNewVersion(true);
          setNewVersionDetails(data);
        }
      }
    } catch (e) {
      // Network transient or offline
      console.debug("[AutoUpdateWatcher] Check skipped:", e);
    }
  }, [initialBootTime]);

  // Initial check & interval polling
  useEffect(() => {
    checkAppVersion();

    // Poll every 35 seconds
    const interval = setInterval(checkAppVersion, 35000);

    // Also check on window focus or visibility change (user comes back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAppVersion();
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      checkAppVersion();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkAppVersion);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkAppVersion);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkAppVersion]);

  // Apply update: hard reload to fetch new HTML & JS bundles
  const handleApplyUpdate = () => {
    setIsUpdating(true);
    
    // Clear any service workers or session caches if present
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }

    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  if (!hasNewVersion || isDismissed) {
    return null;
  }

  return (
    <aside aria-label="Notification de mise à jour" className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[92%] sm:w-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-400/40 text-white shadow-2xl shadow-blue-950/60 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 shrink-0 animate-bounce">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center space-x-1.5">
                <span>Mise à Jour Déployée avec Succès !</span>
              </p>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-extrabold text-[9px] uppercase">
                Toutes les écoles synchronisées
              </span>
            </div>
            <p className="text-[11px] text-blue-200/90 font-medium">
              Les nouvelles fonctionnalités sont prêtes. Un simple rechargement applique la mise à jour sans changer de lien.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="px-2.5 py-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 text-xs font-bold transition-colors"
          >
            Plus tard
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={handleApplyUpdate}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Actualisation...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Actualiser Maintenant</span>
              </>
            )}
          </button>
        </div>

      </div>
    </aside>
  );
};
