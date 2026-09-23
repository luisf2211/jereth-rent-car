import "server-only";
import { createElement as h, type ReactElement } from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ConfirmationSnapshot } from "@/lib/reservations/confirmation-snapshot";
import {
  RESERVATION_POLICY_SUMMARY,
  RESERVATION_POLICY_CONTRACT_NOTE,
} from "@/lib/reservations/policy";
import { pdfMoney, pdfLongDate, pdfTime12, maskId } from "./format";

/**
 * Official reservation CONFIRMATION PDF — premium commercial one-pager for
 * JERETH RENT CAR (black / white / magenta).
 *
 * Layout (top to bottom):
 *   1. Black header with the airport banner blended in + official logo + title.
 *   2. Compact status strip: code · confirmation date · CONFIRMADA badge.
 *   3. VEHICLE HERO band — the real car, whole & centered over a dark/magenta
 *      gradient, as the visual protagonist, with title + specs.
 *   4. Two balanced columns: left = customer + rental details; right = payment
 *      summary (highlighted) + flight (if any) + special request (if any).
 *   5. Policy acceptance strip (with timestamp).
 *   6. Important conditions + contract note, beside the Santo Domingo banner.
 *   7. Black footer: contact, website, slogan.
 *
 * Built with React.createElement (no JSX) so it never enters Next's
 * "react-server" bundling path. Rendered to a Buffer via renderToBuffer.
 */

const BLACK = "#0B0B0C";
const MAGENTA = "#EC0F8D";
const WHITE = "#FFFFFF";
const INK = "#191919";
const MUTED = "#6E6E73";
const LINE = "#E6E6EA";
const SOFT = "#F6F6F7";
const PINK_SOFT = "#FCE3F1";

const s = StyleSheet.create({
  page: { backgroundColor: WHITE, color: INK, fontSize: 8.5, fontFamily: "Helvetica" },

  // ---- Header ----
  header: { height: 84, backgroundColor: BLACK, position: "relative" },
  headerBannerLayer: { position: "absolute", top: 0, bottom: 0, right: 0, width: "56%" },
  headerBannerImg: { width: "100%", height: "100%", objectFit: "cover" },
  headerContent: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center" },
  headerLeft: { width: "38%", paddingLeft: 20, paddingRight: 8, justifyContent: "center" },
  headerLogo: { height: 32, objectFit: "contain", alignSelf: "flex-start" },
  headerLogoText: { color: WHITE, fontSize: 17, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  slogan: { color: "#C9C9C9", fontSize: 5.6, letterSpacing: 1.4, marginTop: 7, textTransform: "uppercase" },
  titleWrap: { width: "37%", justifyContent: "center", paddingRight: 6 },
  titleTop: { color: WHITE, fontSize: 14, fontFamily: "Helvetica-Bold", lineHeight: 1.04 },
  titleBottom: { color: MAGENTA, fontSize: 14, fontFamily: "Helvetica-Bold", lineHeight: 1.04 },
  titleSub: { color: "#E8E8E8", fontSize: 7, marginTop: 3 },
  headerCap: { width: "25%", alignItems: "flex-end", paddingRight: 14, justifyContent: "flex-end", paddingBottom: 10 },
  headerCapText: { color: WHITE, fontSize: 8.5, fontFamily: "Helvetica-Oblique", textAlign: "right" },
  headerCapAccent: { color: MAGENTA, fontSize: 8.5, fontFamily: "Helvetica-BoldOblique", textAlign: "right" },

  // ---- Status strip ----
  statusStrip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 7, gap: 8, borderBottomWidth: 1, borderBottomColor: LINE },
  statusCell: { flex: 1 },
  statusDivider: { width: 1, height: 26, backgroundColor: LINE },
  statusLabel: { color: MUTED, fontSize: 6, textTransform: "uppercase", letterSpacing: 0.6 },
  statusValue: { color: INK, fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 1 },
  statusValueSm: { color: INK, fontSize: 8.5, fontFamily: "Helvetica-Bold", marginTop: 1 },
  confirmedBadge: { backgroundColor: MAGENTA, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16, alignItems: "center" },
  confirmedBadgeText: { color: WHITE, fontSize: 10.5, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },

  // ---- Vehicle hero ----
  hero: { marginHorizontal: 20, marginTop: 10, borderRadius: 8, overflow: "hidden", position: "relative", backgroundColor: BLACK },
  heroImg: { width: "100%", height: 122, objectFit: "cover" },
  heroCaption: { position: "absolute", left: 16, bottom: 11 },
  heroReserved: { color: MAGENTA, fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, textTransform: "uppercase" },
  heroTitle: { color: WHITE, fontSize: 17, fontFamily: "Helvetica-Bold", marginTop: 2 },
  heroSpecs: { color: "#D8D8DC", fontSize: 8, marginTop: 3 },
  heroPriceTag: { position: "absolute", right: 14, top: 12, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 6, paddingVertical: 5, paddingHorizontal: 10, alignItems: "flex-end" },
  heroPriceValue: { color: WHITE, fontSize: 12, fontFamily: "Helvetica-Bold" },
  heroPriceLabel: { color: "#D8D8DC", fontSize: 6, textTransform: "uppercase", letterSpacing: 0.5 },

  // ---- Body ----
  body: { flexDirection: "row", paddingHorizontal: 20, marginTop: 9, gap: 14 },
  colLeft: { flex: 1.15, gap: 7 },
  colRight: { flex: 1, gap: 7 },

  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  sectionTick: { width: 3, height: 11, backgroundColor: MAGENTA, borderRadius: 2 },
  sectionTitleText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: INK, letterSpacing: 0.4, textTransform: "uppercase" },

  kv: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.8, borderBottomWidth: 1, borderBottomColor: SOFT },
  kvLast: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.8 },
  kvLabel: { color: MUTED, fontSize: 8 },
  kvValue: { color: INK, fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "right", maxWidth: "62%" },

  // rental two-up
  rentalGrid: { flexDirection: "row", flexWrap: "wrap" },
  rentalItem: { width: "50%", paddingVertical: 2 },
  rentalItemLabel: { color: MUTED, fontSize: 6.5, textTransform: "uppercase", letterSpacing: 0.4 },
  rentalItemValue: { color: INK, fontSize: 8.2, fontFamily: "Helvetica-Bold", marginTop: 1 },

  // payment card
  payCard: { backgroundColor: SOFT, borderRadius: 8, padding: 9, borderWidth: 1, borderColor: LINE },
  payRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5 },
  payLabel: { color: MUTED, fontSize: 8 },
  payValue: { color: INK, fontSize: 8, fontFamily: "Helvetica-Bold" },
  payTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: BLACK, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 9, marginTop: 6 },
  payTotalLabel: { color: WHITE, fontSize: 9, fontFamily: "Helvetica-Bold" },
  payTotalValue: { color: MAGENTA, fontSize: 13, fontFamily: "Helvetica-Bold" },
  depositRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: PINK_SOFT, borderRadius: 5, paddingVertical: 4, paddingHorizontal: 8, marginTop: 6 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 8, marginTop: 3 },
  strong8: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: INK },
  payHint: { fontSize: 6.5, color: MUTED, marginTop: 5 },

  // small info cards (flight / special)
  miniCard: { borderWidth: 1, borderColor: LINE, borderRadius: 8, padding: 8 },
  flightLegTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: MAGENTA, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.4 },
  specialText: { fontSize: 8.2, color: INK, fontFamily: "Helvetica-Oblique", lineHeight: 1.35 },
  specialHint: { fontSize: 6.5, color: MUTED, marginTop: 3 },

  // acceptance strip
  acceptStrip: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginTop: 8, backgroundColor: "#0B0B0C", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, gap: 8 },
  acceptCheck: { color: MAGENTA, fontSize: 13, fontFamily: "Helvetica-Bold" },
  acceptText: { color: "#E9E9EC", fontSize: 7.6, flex: 1, lineHeight: 1.35 },
  acceptWhen: { color: WHITE, fontSize: 7.6, fontFamily: "Helvetica-Bold" },

  // conditions + SD banner
  condWrap: { flexDirection: "row", paddingHorizontal: 20, marginTop: 8, gap: 12, alignItems: "stretch" },
  condCol: { flex: 1.3 },
  condTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.4 },
  bullet: { flexDirection: "row", gap: 4, paddingVertical: 1 },
  bulletDot: { color: MAGENTA, fontSize: 7.4 },
  bulletText: { color: INK, fontSize: 7.2, flex: 1, lineHeight: 1.28 },
  contractNote: { fontSize: 6.8, color: MUTED, fontFamily: "Helvetica-Oblique", marginTop: 4, lineHeight: 1.3 },
  sdCol: { flex: 1, borderRadius: 8, overflow: "hidden", position: "relative", minHeight: 82 },
  sdImg: { width: "100%", height: "100%", objectFit: "cover" },
  sdCaption: { position: "absolute", top: 14, left: 12, fontSize: 12, fontFamily: "Helvetica-Bold", color: WHITE, lineHeight: 1.15 },
  sdCaptionAccent: { position: "absolute", top: 44, left: 12, fontSize: 12, fontFamily: "Helvetica-BoldOblique", color: MAGENTA },

  // footer
  footer: { marginTop: 8, backgroundColor: BLACK, paddingVertical: 7, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footerLogo: { height: 24, objectFit: "contain" },
  footerLogoText: { color: WHITE, fontSize: 11, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  footerCol: { gap: 1 },
  footerLabel: { color: WHITE, fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  footerText: { color: "#C4C4C8", fontSize: 6.6 },
  footerSlogan: { color: MAGENTA, fontSize: 8.5, fontFamily: "Helvetica-Oblique", maxWidth: 90, textAlign: "right" },
});

function sectionTitle(title: string): ReactElement {
  return h(View, { style: s.sectionTitle }, [
    h(View, { key: "t", style: s.sectionTick }),
    h(Text, { key: "x", style: s.sectionTitleText }, title),
  ]);
}

function kvLine(label: string, value: string, last = false): ReactElement {
  return h(View, { style: last ? s.kvLast : s.kv }, [
    h(Text, { key: "l", style: s.kvLabel }, label),
    h(Text, { key: "v", style: s.kvValue }, value || "—"),
  ]);
}

function rentalItem(label: string, value: string): ReactElement {
  return h(View, { style: s.rentalItem }, [
    h(Text, { key: "l", style: s.rentalItemLabel }, label),
    h(Text, { key: "v", style: s.rentalItemValue }, value || "—"),
  ]);
}

function payRow(label: string, value: string): ReactElement {
  return h(View, { style: s.payRow }, [
    h(Text, { key: "l", style: s.payLabel }, label),
    h(Text, { key: "v", style: s.payValue }, value),
  ]);
}

function bullet(text: string, i: number): ReactElement {
  return h(View, { key: `b${i}`, style: s.bullet }, [
    h(Text, { key: "d", style: s.bulletDot }, "•"),
    h(Text, { key: "t", style: s.bulletText }, text),
  ]);
}

function flightLeg(
  title: string,
  leg: { airline: string; flightNumber: string; airport: string; date: string; time: string },
  withDivider: boolean
): ReactElement {
  return h(View, { key: title, style: withDivider ? { marginTop: 6, borderTopWidth: 1, borderTopColor: SOFT, paddingTop: 5 } : {} }, [
    h(Text, { key: "h", style: s.flightLegTitle }, title),
    kvLine("Aerolínea", leg.airline),
    kvLine("Número de vuelo", leg.flightNumber),
    kvLine("Fecha y hora", [pdfLongDate(leg.date), pdfTime12(leg.time)].filter(Boolean).join(" · ")),
    kvLine("Aeropuerto", leg.airport, true),
  ]);
}

export interface ConfirmationDocAssets {
  logoDataUri: string | null;
  footerLogoDataUri: string | null;
  vehicleDataUri: string | null; // vehicle HERO panel (pre-composed)
  airportDataUri: string | null; // header banner (pre-blended)
  santoDomingoDataUri: string | null; // SD banner (pre-blended)
}

export function ConfirmationDocument(snap: ConfirmationSnapshot, assets: ConfirmationDocAssets): ReactElement {
  const confirmedDate = pdfLongDate(snap.confirmedAt.slice(0, 10));
  const cd = new Date(snap.confirmedAt);
  const confirmedTime = Number.isNaN(cd.getTime())
    ? ""
    : pdfTime12(`${cd.getHours()}:${String(cd.getMinutes()).padStart(2, "0")}`);

  const acceptedDt = snap.policyAcceptedAt ? new Date(snap.policyAcceptedAt) : null;
  const acceptedLabel =
    acceptedDt && !Number.isNaN(acceptedDt.getTime())
      ? `${pdfLongDate(snap.policyAcceptedAt.slice(0, 10))} · ${pdfTime12(`${acceptedDt.getHours()}:${String(acceptedDt.getMinutes()).padStart(2, "0")}`)}`
      : "";

  const website = snap.company.website || "jerethrentcar.com";
  const wa = snap.company.whatsappNumber || snap.company.phone || "";

  // ---------- Header ----------
  const header = h(View, { style: s.header }, [
    assets.airportDataUri
      ? h(View, { key: "bl", style: s.headerBannerLayer }, [h(Image, { key: "i", src: assets.airportDataUri, style: s.headerBannerImg })])
      : null,
    h(View, { key: "content", style: s.headerContent }, [
      h(View, { key: "left", style: s.headerLeft }, [
        assets.logoDataUri
          ? h(Image, { key: "logo", src: assets.logoDataUri, style: s.headerLogo })
          : h(Text, { key: "logo", style: s.headerLogoText }, "JERETH RENT-CAR"),
        h(Text, { key: "slg", style: s.slogan }, "TU DESTINO, NUESTRO COMPROMISO"),
      ]),
      h(View, { key: "title", style: s.titleWrap }, [
        h(Text, { key: "t1", style: s.titleTop }, "CONFIRMACIÓN OFICIAL"),
        h(Text, { key: "t2", style: s.titleBottom }, "DE RESERVA"),
        h(Text, { key: "sub", style: s.titleSub }, "Gracias por confiar en nosotros"),
      ]),
      h(View, { key: "cap", style: s.headerCap }, [
        h(Text, { key: "c1", style: s.headerCapText }, "Más que un auto,"),
        h(Text, { key: "c2", style: s.headerCapAccent }, "¡libertad!"),
      ]),
    ]),
  ]);

  // ---------- Status strip ----------
  const statusStrip = h(View, { style: s.statusStrip }, [
    h(View, { key: "num", style: s.statusCell }, [
      h(Text, { key: "l", style: s.statusLabel }, "NÚMERO DE RESERVA"),
      h(Text, { key: "v", style: s.statusValue }, snap.code),
    ]),
    h(View, { key: "d1", style: s.statusDivider }),
    h(View, { key: "date", style: s.statusCell }, [
      h(Text, { key: "l", style: s.statusLabel }, "FECHA DE CONFIRMACIÓN"),
      h(Text, { key: "v", style: s.statusValueSm }, [confirmedDate, confirmedTime].filter(Boolean).join(" · ")),
    ]),
    h(View, { key: "badge", style: s.confirmedBadge }, [
      h(Text, { key: "b", style: s.confirmedBadgeText }, "✓  CONFIRMADA"),
    ]),
  ]);

  // ---------- Vehicle hero ----------
  const hero = h(View, { style: s.hero }, [
    assets.vehicleDataUri
      ? h(Image, { key: "img", src: assets.vehicleDataUri, style: s.heroImg })
      : h(View, { key: "img", style: { ...s.heroImg, backgroundColor: BLACK } }),
    h(View, { key: "price", style: s.heroPriceTag }, [
      h(Text, { key: "v", style: s.heroPriceValue }, `${pdfMoney(snap.dailyPrice)}`),
      h(Text, { key: "l", style: s.heroPriceLabel }, "por día"),
    ]),
    h(View, { key: "cap", style: s.heroCaption }, [
      h(Text, { key: "r", style: s.heroReserved }, "Vehículo reservado"),
      h(Text, { key: "t", style: s.heroTitle }, snap.vehicleTitle),
      snap.vehicleSpecs.length ? h(Text, { key: "s", style: s.heroSpecs }, snap.vehicleSpecs.join("   •   ")) : null,
    ]),
  ]);

  // ---------- Left column ----------
  const customerCard = h(View, { key: "cust" }, [
    sectionTitle("Datos del cliente"),
    h(View, {}, [
      kvLine("Nombre", snap.customerName),
      kvLine("Teléfono / WhatsApp", snap.phone),
      kvLine("Correo electrónico", snap.email),
      kvLine("País", snap.country),
      kvLine("Documento", snap.idOrPassport ? maskId(snap.idOrPassport) : ""),
      kvLine("Licencia de conducir", snap.driverLicense ? maskId(snap.driverLicense) : "", true),
    ]),
  ]);

  const rentalCard = h(View, { key: "rent" }, [
    sectionTitle("Detalles de la renta"),
    h(View, { style: s.rentalGrid }, [
      rentalItem("Recogida", [pdfLongDate(snap.pickupDate), pdfTime12(snap.pickupTime)].filter(Boolean).join(" · ")),
      rentalItem("Devolución", [pdfLongDate(snap.dropoffDate), pdfTime12(snap.dropoffTime)].filter(Boolean).join(" · ")),
      rentalItem("Lugar de recogida", snap.pickupLocation),
      rentalItem("Lugar de devolución", snap.dropoffLocation),
      rentalItem("Duración", `${snap.billedDays} ${snap.billedDays === 1 ? "día" : "días"}`),
      rentalItem("Origen de la reserva", snap.sourceLabel),
    ]),
  ]);

  const leftCol = h(View, { key: "left", style: s.colLeft }, [customerCard, rentalCard]);

  // ---------- Right column ----------
  const payItems: ReactElement[] = [payRow(`Tarifa diaria · ${snap.billedDays} ${snap.billedDays === 1 ? "día" : "días"}`, pdfMoney(snap.subtotalRent))];
  if (snap.pickupFee > 0) payItems.push(payRow("Cargo de entrega (recogida)", pdfMoney(snap.pickupFee)));
  if (snap.dropoffFee > 0) payItems.push(payRow("Cargo de entrega (devolución)", pdfMoney(snap.dropoffFee)));

  const paymentCard = h(View, { key: "pay" }, [
    sectionTitle("Resumen de pago"),
    h(View, { style: s.payCard }, [
      ...payItems,
      h(View, { key: "tot", style: s.payTotalRow }, [
        h(Text, { key: "l", style: s.payTotalLabel }, "TOTAL DE LA RESERVA"),
        h(Text, { key: "v", style: s.payTotalValue }, pdfMoney(snap.estimatedTotal)),
      ]),
      snap.depositPaid > 0
        ? h(View, { key: "dep", style: s.depositRow }, [
            h(Text, { key: "l", style: s.strong8 }, "Depósito recibido ✓"),
            h(Text, { key: "v", style: s.strong8 }, pdfMoney(snap.depositPaid)),
          ])
        : null,
      h(View, { key: "bal", style: snap.depositPaid > 0 ? s.balanceRow : s.depositRow }, [
        h(Text, { key: "l", style: s.strong8 }, "Balance pendiente"),
        h(Text, { key: "v", style: s.strong8 }, pdfMoney(snap.balanceDue)),
      ]),
      snap.depositPaid > 0 && snap.paymentMethodLabel
        ? h(Text, { key: "pm", style: s.payHint }, `Depósito pagado por: ${snap.paymentMethodLabel} · El balance se paga al recibir el vehículo.`)
        : h(Text, { key: "hint", style: s.payHint }, "El balance pendiente se paga al momento de recibir el vehículo."),
    ]),
  ]);

  const flightLegs: ReactElement[] = [];
  if (snap.arrivalFlight) flightLegs.push(flightLeg("Llegada", snap.arrivalFlight, false));
  if (snap.returnFlight) flightLegs.push(flightLeg("Regreso", snap.returnFlight, Boolean(snap.arrivalFlight)));
  const flightCard = snap.arrivalFlight || snap.returnFlight
    ? h(View, { key: "flight" }, [
        sectionTitle("Información de vuelo"),
        h(View, { style: s.miniCard }, flightLegs),
      ])
    : null;

  const specialCard = snap.specialRequest
    ? h(View, { key: "special" }, [
        sectionTitle("Solicitud especial"),
        h(View, { style: s.miniCard }, [
          h(Text, { key: "t", style: s.specialText }, `"${snap.specialRequest}"`),
          h(Text, { key: "n", style: s.specialHint }, "Sujeta a disponibilidad y confirmación."),
        ]),
      ])
    : null;

  const rightCol = h(View, { key: "right", style: s.colRight }, [paymentCard, flightCard, specialCard].filter(Boolean) as ReactElement[]);

  const body = h(View, { style: s.body }, [leftCol, rightCol]);

  // ---------- Acceptance strip ----------
  const acceptStrip = h(View, { style: s.acceptStrip }, [
    h(Text, { key: "c", style: s.acceptCheck }, "✓"),
    h(Text, { key: "t", style: s.acceptText }, "El cliente declaró que la información es correcta y aceptó la política de reserva al enviar su solicitud."),
    acceptedLabel ? h(Text, { key: "w", style: s.acceptWhen }, acceptedLabel) : null,
  ]);

  // ---------- Conditions + Santo Domingo banner ----------
  const conditions = h(View, { style: s.condWrap }, [
    h(View, { key: "c", style: s.condCol }, [
      h(Text, { key: "t", style: s.condTitle }, "Condiciones importantes"),
      ...RESERVATION_POLICY_SUMMARY.map((t, i) => bullet(t, i)),
      h(Text, { key: "note", style: s.contractNote }, RESERVATION_POLICY_CONTRACT_NOTE),
    ]),
    h(View, { key: "sd", style: s.sdCol }, [
      assets.santoDomingoDataUri
        ? h(Image, { key: "img", src: assets.santoDomingoDataUri, style: s.sdImg })
        : h(View, { key: "img", style: { ...s.sdImg, backgroundColor: "#2A2A2E" } }),
      h(Text, { key: "cap", style: s.sdCaption }, "Tu destino,"),
      h(Text, { key: "cap2", style: s.sdCaptionAccent }, "nuestro compromiso."),
    ]),
  ]);

  // ---------- Footer ----------
  const footer = h(View, { style: s.footer, wrap: false }, [
    assets.footerLogoDataUri
      ? h(Image, { key: "logo", src: assets.footerLogoDataUri, style: s.footerLogo })
      : h(Text, { key: "logo", style: s.footerLogoText }, "JERETH"),
    h(View, { key: "wa", style: s.footerCol }, [
      h(Text, { key: "l", style: s.footerLabel }, wa),
      h(Text, { key: "t", style: s.footerText }, "WhatsApp"),
    ]),
    h(View, { key: "web", style: s.footerCol }, [
      h(Text, { key: "l", style: s.footerLabel }, website),
      h(Text, { key: "t", style: s.footerText }, "Santo Domingo · Aeropuerto Las Américas (SDQ)"),
    ]),
    h(Text, { key: "slg", style: s.footerSlogan }, "Tu destino, nuestro compromiso."),
  ]);

  return h(Document, { title: `Confirmación de reserva ${snap.code}`, author: "JERETH RENT CAR" },
    h(Page, { size: "A4", style: s.page }, [
      header,
      statusStrip,
      hero,
      body,
      acceptStrip,
      conditions,
      footer,
    ])
  );
}
