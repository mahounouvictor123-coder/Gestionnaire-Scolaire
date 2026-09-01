/**
 * KKiaPay Payment Gateway Helper & SDK Integration
 * Provides support for Mobile Money (MTN, Moov, Celtiis, Wave, Orange) and Bank Cards (Visa, Mastercard)
 * Official Documentation: https://docs.kkiapay.me
 */

export interface KkiapayConfig {
  publicKey: string;
  secretKey?: string;
  sandbox?: boolean;
  themeColor?: string;
}

export interface KkiapayPaymentData {
  amount: number;
  name?: string;
  phone?: string;
  email?: string;
  reason?: string;
  data?: string;
  studentId?: string;
  classId?: string;
  schoolId?: string;
  partnerId?: string;
}

export interface KkiapayTransactionResponse {
  transactionId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  amount: number;
  phone?: string;
  method?: string;
  date: string;
  rawResponse?: any;
}

let kkiapayScriptLoaded = false;
let kkiapayScriptLoadingPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads KKiaPay official CDN script if not already present
 */
export function loadKkiapayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  if (kkiapayScriptLoaded || (window as any).openKkiapayWidget) {
    kkiapayScriptLoaded = true;
    return Promise.resolve(true);
  }

  if (kkiapayScriptLoadingPromise) {
    return kkiapayScriptLoadingPromise;
  }

  kkiapayScriptLoadingPromise = new Promise((resolve) => {
    const existingScript = document.getElementById('kkiapay-cdn-script');
    if (existingScript) {
      kkiapayScriptLoaded = true;
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'kkiapay-cdn-script';
    script.src = 'https://cdn.kkiapay.me/k.js';
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      kkiapayScriptLoaded = true;
      resolve(true);
    };

    script.onerror = () => {
      console.warn('KKiaPay CDN script failed to load or is restricted in this container.');
      resolve(false);
    };

    document.body.appendChild(script);
  });

  return kkiapayScriptLoadingPromise;
}

/**
 * Builds a direct standalone KKiaPay checkout URL for opening in a new tab/window
 * This guarantees the user gets the real Mobile Money USSD push even inside restricted preview iframes.
 */
export function getKkiapayCheckoutUrl(
  publicKey: string,
  amount: number,
  phone?: string,
  reason?: string,
  sandbox: boolean = false
): string {
  const cleanKey = publicKey.trim();
  const cleanPhone = (phone || '').replace(/\s+/g, '');
  const encodedReason = encodeURIComponent(reason || 'Abonnement Plateforme SaaS');
  const isSand = sandbox || cleanKey.toLowerCase().includes('sand') || cleanKey.toLowerCase().includes('test');

  // KKiaPay direct widget link
  return `https://widget.kkiapay.me/?api_key=${encodeURIComponent(cleanKey)}&amount=${amount}&phone=${encodeURIComponent(cleanPhone)}&name=${encodeURIComponent('Directeur Établissement')}&reason=${encodedReason}&sandbox=${isSand}&theme=%23059669`;
}

/**
 * Initiates the real KKiaPay payment widget or opens the checkout portal
 */
export async function initiateKkiapayPayment(
  config: KkiapayConfig,
  payment: KkiapayPaymentData,
  onSuccess: (resp: KkiapayTransactionResponse) => void,
  onFailed?: (error: any) => void
): Promise<boolean> {
  const cleanKey = (config.publicKey || '').trim();
  const isRealKey = cleanKey.length > 5 && !cleanKey.includes('xxxxxxxx');
  const isSandbox = config.sandbox !== undefined 
    ? config.sandbox 
    : cleanKey.toLowerCase().includes('sand') || cleanKey.toLowerCase().includes('test');

  const cleanPhone = (payment.phone || '').replace(/\s+/g, '');

  if (!cleanKey) {
    if (onFailed) onFailed({ message: "Clé publique KKiaPay manquante. Veuillez renseigner votre clé dans les paramètres." });
    return false;
  }

  // 1. Try to load script
  const scriptLoaded = await loadKkiapayScript();

  // 2. Setup event listeners for KKiaPay
  const cleanupListeners = () => {
    window.removeEventListener('successKkiapay', handleSuccess);
    window.removeEventListener('failedKkiapay', handleFailure);
    window.removeEventListener('message', handlePostMessage);
  };

  const handleSuccess = (response: any) => {
    cleanupListeners();
    const txId = response?.transactionId || response?.reference || `KKIA-${Date.now().toString().slice(-8)}`;
    onSuccess({
      transactionId: txId,
      status: 'SUCCESS',
      amount: payment.amount,
      phone: cleanPhone,
      method: 'MOBILE_MONEY',
      date: new Date().toISOString(),
      rawResponse: response
    });
  };

  const handleFailure = (error: any) => {
    cleanupListeners();
    if (onFailed) onFailed(error || { message: "Le paiement KKiaPay a échoué ou a été annulé." });
  };

  // KKiaPay also sends postMessages from its iframe
  const handlePostMessage = (event: MessageEvent) => {
    try {
      if (typeof event.data === 'string' && event.data.includes('kkiapay')) {
        const parsed = JSON.parse(event.data);
        if (parsed.name === 'kkiapay:success' || parsed.type === 'KKIAPAY_SUCCESS') {
          handleSuccess(parsed.data || parsed);
        } else if (parsed.name === 'kkiapay:failed' || parsed.type === 'KKIAPAY_FAILED') {
          handleFailure(parsed.data || parsed);
        }
      } else if (event.data && (event.data.name === 'kkiapay:success' || event.data.type === 'KKIAPAY_SUCCESS')) {
        handleSuccess(event.data.data || event.data);
      }
    } catch {
      // Ignore non-json messages
    }
  };

  window.addEventListener('successKkiapay', handleSuccess);
  window.addEventListener('failedKkiapay', handleFailure);
  window.addEventListener('message', handlePostMessage);

  // 3. Try to open native KKiaPay widget
  if (typeof window !== 'undefined' && (window as any).openKkiapayWidget && scriptLoaded) {
    try {
      (window as any).openKkiapayWidget({
        amount: payment.amount,
        api_key: cleanKey,
        key: cleanKey,
        position: 'center',
        sandbox: isSandbox,
        data: payment.data || payment.reason || 'Abonnement Gestionnaire Scolaire',
        phone: cleanPhone,
        name: payment.name || 'Directeur d\'Établissement',
        email: payment.email || '',
        theme: config.themeColor || '#059669',
        callback: ''
      });
      return true;
    } catch (err) {
      console.warn('Native openKkiapayWidget execution error, trying fallback:', err);
    }
  }

  // 4. Fallback: If widget is blocked in iframe, open direct secure checkout portal in new tab
  try {
    const directUrl = getKkiapayCheckoutUrl(cleanKey, payment.amount, cleanPhone, payment.reason, isSandbox);
    const win = window.open(directUrl, '_blank');
    if (!win) {
      // If popup was blocked
      if (onFailed) onFailed({ message: "Le navigateur a bloqué la fenêtre de paiement. Veuillez autoriser les popups ou utiliser le lien direct." });
      return false;
    }
    return true;
  } catch (err: any) {
    if (onFailed) onFailed(err);
    return false;
  }
}

/**
 * Formats a shareable direct KKiaPay payment link
 */
export function generateKkiapayDirectLink(publicKey: string, amount: number, name?: string, reason?: string): string {
  const cleanKey = publicKey.trim() || 'pk_live_kkiapay';
  const encodedName = encodeURIComponent(name || 'Directeur Établissement');
  const encodedReason = encodeURIComponent(reason || 'Abonnement Plateforme');
  return `https://kkiapay.me/${cleanKey}?amount=${amount}&name=${encodedName}&reason=${encodedReason}`;
}
