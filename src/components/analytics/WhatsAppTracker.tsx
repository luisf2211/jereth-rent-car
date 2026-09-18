"use client";

import * as React from "react";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Global click listener that pushes WhatsApp CTA clicks to the GTM dataLayer.
 * Any element (or its ancestor) with a `data-wa-source` attribute triggers a
 * `whatsapp_click` event carrying the source and optional context (e.g. the
 * vehicle name). This keeps analytics wiring out of every button — configure
 * the tag/conversion in GTM using these dataLayer values. Mount once.
 */
export default function WhatsAppTracker() {
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("[data-wa-source]");
      if (!el) return;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "whatsapp_click",
        wa_source: el.getAttribute("data-wa-source") || "unknown",
        wa_context: el.getAttribute("data-wa-context") || undefined,
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
