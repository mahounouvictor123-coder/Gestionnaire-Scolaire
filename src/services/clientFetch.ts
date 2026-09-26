// Client Fetch pur et autonome (100% compatible navigateur & hébergement statique comme Netlify)
// Ne modifie pas window.fetch pour éviter les erreurs de getter dans les iframes.

import { handleClientAiRequest } from './clientAiEngine.ts';

export async function clientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let urlString = '';
  if (typeof input === 'string') {
    urlString = input;
  } else if (input instanceof URL) {
    urlString = input.toString();
  } else if (input && typeof (input as any).url === 'string') {
    urlString = (input as any).url;
  }

  // Si c'est une requête API interne (/api/...)
  if (
    urlString.startsWith('/api/') ||
    urlString.startsWith('api/') ||
    urlString.includes('/api/ai/') ||
    urlString.includes('/api/sync/') ||
    urlString.includes('/api/app-version')
  ) {
    try {
      let body: any = {};
      if (init?.body) {
        if (typeof init.body === 'string') {
          try {
            body = JSON.parse(init.body);
          } catch {
            body = { raw: init.body };
          }
        }
      }

      const data = await handleClientAiRequest(urlString, body);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.warn('[ClientFetch Fallback]:', urlString, err);
      return new Response(JSON.stringify({ success: true, fallback: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Pour les autres requêtes (ex: CDN, polices, avatars, Firebase)
  return window.fetch(input, init);
}
