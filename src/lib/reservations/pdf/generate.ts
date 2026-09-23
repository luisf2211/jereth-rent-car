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


import { localImageToDataUri } from "./images";
import { TemplatePdfDocument, type TemplatePdfAssets } from "./TemplateDocument";
import { tokenValues, resolveTokens } from "@/features/reservation-template/tokens";
import type { TemplateDocument } from "@/features/reservation-template/types";

/** Official confirmation logo bundled in the project (same as the builder). */
const OFFICIAL_LOGO_REL = "pdf/logo-oficial.png";

/**
 * Renders the confirmation PDF from the PUBLISHED builder template document,
 * so the output matches the builder exactly (with real reservation data).
 *
 * All images are pre-fetched to data URIs (network-safe). This includes: the
 * official logo (logo/contactFooter elements), the vehicle photo
 * (vehicleImage element = documentImageUrl||imageUrl via the snapshot), the
 * company logo token, and any static image element `src` (URL or token).
 */
export async function renderConfirmationPdfFromTemplate(
  doc: TemplateDocument,
  snap: ConfirmationSnapshot
): Promise<Buffer> {
  const values = tokenValues(snap);

  // Collect every `image` element src in the template (raw + token-resolved).
  const imageSrcs = new Set<string>();
  for (const row of doc.rows) {
    for (const cell of row.cells) {
      for (const el of cell) {
        if (el.type === "image" && el.src) {
          imageSrcs.add(el.src);
          imageSrcs.add(resolveTokens(el.src, values));
        }
      }
    }
  }

  // Pre-fetch: official logo (local), vehicle photo + company logo (remote),
  // and each template image src (remote or a token that resolves to a URL).
  const srcList = Array.from(imageSrcs);
  const [officialLogoDataUri, vehicleDataUri, companyLogoDataUri, ...srcDataUris] = await Promise.all([
    localImageToDataUri(OFFICIAL_LOGO_REL, "image/png"),
    remoteImageToDataUri(snap.vehicleImageUrl),
    remoteImageToDataUri(snap.company.logoUrl),
    ...srcList.map((src) => remoteImageToDataUri(resolveTokens(src, values))),
  ]);

  const imagesBySrc: Record<string, string | null> = {};
  srcList.forEach((src, i) => {
    imagesBySrc[src] = srcDataUris[i] ?? null;
    imagesBySrc[resolveTokens(src, values)] = srcDataUris[i] ?? null;
  });

  const assets: TemplatePdfAssets = {
    officialLogoDataUri,
    vehicleDataUri,
    companyLogoDataUri,
    imagesBySrc,
  };

  const el = TemplatePdfDocument(doc, snap, assets);
  return renderToBuffer(el as Parameters<typeof renderToBuffer>[0]);
}
