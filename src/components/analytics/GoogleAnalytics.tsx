import * as React from "react";
import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js). The Measurement ID comes from
 * NEXT_PUBLIC_GA_ID with a fallback to the project's property. Renders nothing
 * when no ID is set.
 *
 * gtag shares the same `dataLayer` as GTM, so the business events pushed
 * elsewhere (whatsapp_click, quote_request) are also picked up by GA4.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-K8H83JT55C";

export default function GoogleAnalytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
