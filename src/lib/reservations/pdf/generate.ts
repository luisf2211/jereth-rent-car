import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import type { ConfirmationSnapshot } from "@/lib/reservations/confirmation-snapshot";
import { ConfirmationDocument, type ConfirmationDocAssets } from "./ConfirmationDocument";
import { remoteImageToDataUri } from "./images";
import { buildPdfBanners, buildVehicleHero } from "./process-images";

/**
 * Renders the official confirmation PDF for a snapshot and returns the PDF
 * bytes. Images (logo, vehicle photo) are pre-fetched to data URIs so a
 * network hiccup can't break rendering; the two decorative assets are read
 * from public/pdf/. Any missing image degrades gracefully to a fallback.
 */
export async function renderConfirmationPdf(snap: ConfirmationSnapshot): Promise<Buffer> {
  const [logoDataUri, footerLogoDataUri, vehicleHeroDataUri, banners] = await Promise.all([
    remoteImageToDataUri(snap.company.logoUrl),
    remoteImageToDataUri(snap.company.footerLogoUrl || snap.company.logoUrl),
    buildVehicleHero(snap.vehicleImageUrl),
    buildPdfBanners(),
  ]);

  const assets: ConfirmationDocAssets = {
    logoDataUri,
    footerLogoDataUri,
    // Hero panel: whole car centered over a premium dark/magenta gradient.
    vehicleDataUri: vehicleHeroDataUri,
    // Pre-processed, gradient-blended banners (no longer raw rectangular photos).
    airportDataUri: banners.header,
    santoDomingoDataUri: banners.footer,
  };

  const doc = ConfirmationDocument(snap, assets);
  // ConfirmationDocument returns the <Document> root; cast to satisfy the
  // renderToBuffer signature (DocumentProps element).
  return renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
}
