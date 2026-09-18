"use client";

import * as React from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Global click listener that reports WhatsApp CTA clicks. Any element (or its
 * ancestor) with a `data-wa-source` attribute triggers a `whatsapp_click`
 * event carrying the source and optional context (e.g. the vehicle name),
 * sent to GA4 and the GTM dataLayer. Keeps analytics wiring out of every
 * button. Mount once.
 */
export default function WhatsAppTracker() {
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("[data-wa-source]");
      if (!el) return;
      trackEvent("whatsapp_click", {
        wa_source: el.getAttribute("data-wa-source") || "unknown",
        wa_context: el.getAttribute("data-wa-context") || undefined,
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
