/**
 * Client-side analytics helper. Sends a named event with parameters to both
 * GA4 (via gtag) and the shared dataLayer (for GTM). Safe to call anywhere on
 * the client; no-ops on the server or before the scripts load.
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  // GTM dataLayer (custom event shape).
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
  // GA4 direct (in case GA4 is loaded via gtag rather than through GTM).
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}
