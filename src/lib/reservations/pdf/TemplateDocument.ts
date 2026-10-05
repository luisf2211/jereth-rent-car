import "server-only";
import { createElement as h, type ReactElement } from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ComponentProps } from "react";

/** The exact single-style object type @react-pdf's View/Text/Image accept. */
type StyleProp = NonNullable<ComponentProps<typeof View>["style"]>;
type Style = StyleProp extends readonly (infer U)[] ? U : StyleProp;
import type { ConfirmationSnapshot } from "@/lib/reservations/confirmation-snapshot";
import { tokenValues, resolveTokens } from "@/features/reservation-template/tokens";
import {
  RESERVATION_POLICY_SUMMARY,
  RESERVATION_POLICY_CONTRACT_NOTE,
} from "@/lib/reservations/policy";
import { A4_WIDTH_PX, A4_HEIGHT_PX } from "@/features/reservation-template/types";
import type {
  TemplateDocument,
  TemplateElement,
  TemplateRow,
  ElementStyle,
} from "@/features/reservation-template/types";

/**
 * Renders the ACTUAL published builder template (TemplateDocument tree) to the
 * confirmation PDF, so the PDF matches the builder pixel-for-pixel with real
 * reservation data. This walks the same rows -> columns -> elements structure
 * the preview uses (TemplateElementView.tsx) and reproduces each element type
 * with @react-pdf primitives. Tokens resolve against the ConfirmationSnapshot.
 *
 * The builder designs in CSS px on an A4 surface (A4_WIDTH_PX x A4_HEIGHT_PX).
 * @react-pdf uses points; we scale px -> pt by 72/96 so the layout maps 1:1.
 */

const MAGENTA = "#EC0F8D";
const INK = "#191919";
const MUTED = "#6E6E73";
const BLACK = "#0B0B0C";
const WHITE = "#FFFFFF";

/**
 * WhatsApp deep link encoded by the "Información para tu llegada" QR. Fixed to
 * the official JERETH RENT CAR number (+1 829-240-3672 → 18292403672) with a
 * prefilled arrival message. Exported so generate.ts builds the QR data URI
 * from the exact same URL that the card describes.
 */
export const ARRIVAL_WHATSAPP_URL =
  "https://wa.me/18292403672?text=" +
  encodeURIComponent("Hola JERETH RENT CAR, ya llegué. Tengo una reserva con ustedes.");

// px (96dpi) -> pt (72dpi)
const K = 72 / 96;
const px = (n: number | undefined, fallback = 0): number => Math.round(((n ?? fallback) * K) * 100) / 100;

/** Assets pre-fetched to data URIs (network-safe), passed in by generate.ts. */
export interface TemplatePdfAssets {
  /** Official logo (public/pdf/logo-oficial.png) as data URI. */
  officialLogoDataUri: string | null;
  /** Vehicle photo (documentImageUrl||imageUrl) as data URI. */
  vehicleDataUri: string | null;
  /** Company logo token {{company.logo}} as data URI (optional). */
  companyLogoDataUri: string | null;
  /** Any other image element src (static URL/token) resolved to data URIs. */
  imagesBySrc: Record<string, string | null>;
  /** QR (PNG data URI) for the "Información para tu llegada" WhatsApp card. */
  arrivalQrDataUri: string | null;
}

const SECTION_ICON: Record<string, string> = {
  customerData: "P",
  vehicleData: "V",
  rentalDetails: "R",
  paymentSummary: "$",
  flightInfo: "A",
  specialRequest: "!",
  policyAcceptance: "P",
  reservationConditions: "i",
  arrivalInfo: "A",
  contactFooter: "",
};

const s = StyleSheet.create({
  page: { backgroundColor: WHITE, color: INK, fontFamily: "Helvetica" },
});

/** Alignment mapping. */
function alignItems(a?: string): "flex-start" | "center" | "flex-end" {
  return a === "center" ? "center" : a === "right" ? "flex-end" : "flex-start";
}
function textAlign(a?: string): "left" | "center" | "right" {
  return a === "center" ? "center" : a === "right" ? "right" : "left";
}

/** Common margin/padding block from an element style (scaled to pt). */
function boxStyle(style: ElementStyle): Style {
  return {
    marginTop: px(style.marginTop),
    marginBottom: px(style.marginBottom),
    paddingLeft: px(style.paddingX),
    paddingRight: px(style.paddingX),
    paddingTop: px(style.paddingY),
    paddingBottom: px(style.paddingY),
  };
}

/** Section heading: black bar with a magenta rounded icon badge + white text. */
function Heading(text: string, icon: string, key?: string): ReactElement | null {
  if (!text) return null;
  return h(
    View,
    {
      key,
      style: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: BLACK,
        borderRadius: px(10),
        paddingHorizontal: px(10),
        paddingVertical: px(8),
        marginBottom: px(8),
      },
    },
    icon
      ? h(
          View,
          {
            style: {
              width: px(18),
              height: px(18),
              backgroundColor: MAGENTA,
              borderRadius: px(4),
              alignItems: "center",
              justifyContent: "center",
              marginRight: px(8),
            },
          },
          h(Text, { style: { color: WHITE, fontSize: px(11), fontFamily: "Helvetica-Bold" } }, icon)
        )
      : h(View, {
          style: { width: px(9), height: px(9), backgroundColor: MAGENTA, borderRadius: px(4.5), marginRight: px(8) },
        }),
    h(
      Text,
      { style: { color: WHITE, fontFamily: "Helvetica-Bold", fontSize: px(11), letterSpacing: 0.6 } },
      text.toUpperCase()
    )
  );
}

/** Key/value list used by the data blocks. */
function KV(rows: [string, string][], key?: string): ReactElement {
  return h(
    View,
    { key },
    ...rows.map(([k, v], i) =>
      h(
        View,
        {
          key: i,
          style: {
            flexDirection: "row",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: "#EEEEEE",
            borderBottomStyle: "solid",
            paddingVertical: px(4.8),
          },
        },
        h(Text, { style: { color: MUTED, fontSize: px(10.5) } }, k),
        h(Text, { style: { color: INK, fontSize: px(10.5), fontFamily: "Helvetica-Bold", textAlign: "right" } }, v || "—")
      )
    )
  );
}

/** Resolve token helper bound to a values map. */
type Ctx = { v: Record<string, string>; assets: TemplatePdfAssets };
const R = (ctx: Ctx, str: string) => resolveTokens(str, ctx.v);

/** Render one element. */
function renderElement(el: TemplateElement, ctx: Ctx, key: string): ReactElement | null {
  const st = el.style;
  const base = boxStyle(st);
  const v = ctx.v;

  switch (el.type) {
    case "title":
      return h(
        Text,
        { key, style: { ...base, fontSize: px(st.fontSize ?? 18), fontFamily: "Helvetica-Bold", color: st.color ?? INK, textAlign: textAlign(st.align) } },
        R(ctx, el.content)
      );
    case "text":
      return h(
        Text,
        {
          key,
          style: {
            ...base,
            fontSize: px(st.fontSize ?? 11),
            fontFamily: st.fontWeight === "bold" ? "Helvetica-Bold" : st.fontStyle === "italic" ? "Helvetica-Oblique" : "Helvetica",
            color: st.color ?? INK,
            textAlign: textAlign(st.align),
            lineHeight: st.lineHeight ?? 1.4,
            letterSpacing: st.letterSpacing ?? 0,
            backgroundColor: st.background ?? undefined,
            borderRadius: st.borderRadius ? px(st.borderRadius) : undefined,
          },
        },
        R(ctx, el.content)
      );
    case "image": {
      const resolved = resolveTokens(el.src, v);
      const dataUri = ctx.assets.imagesBySrc[el.src] ?? ctx.assets.imagesBySrc[resolved] ?? null;
      const wrap: Style = { ...base, flexDirection: "row", justifyContent: alignItems(st.align) };
      if (!dataUri) return h(View, { key, style: wrap });
      const imgStyle: Style = {
        width: el.width ? px(el.width) : "100%",
        borderRadius: st.borderRadius ? px(st.borderRadius) : undefined,
        objectFit: el.fit,
      };
      if (el.height) imgStyle.height = px(el.height);
      return h(View, { key, style: wrap }, h(Image, { src: dataUri, style: imgStyle }));
    }
    case "logo": {
      const wrap: Style = { ...base, flexDirection: "row", justifyContent: alignItems(st.align) };
      if (!ctx.assets.officialLogoDataUri) return h(View, { key, style: wrap });
      return h(
        View,
        { key, style: wrap },
        h(Image, { src: ctx.assets.officialLogoDataUri, style: { height: px(el.height ?? 48), objectFit: el.fit } })
      );
    }
    case "vehicleImage": {
      const boxH = px(el.height ?? 180);
      const bg = st.background && st.background !== "transparent" ? st.background : undefined;
      const container: Style = {
        ...base,
        height: boxH,
        backgroundColor: bg,
        borderRadius: st.borderRadius ? px(st.borderRadius) : undefined,
        alignItems: "center",
        justifyContent: "center",
      };
      if (!ctx.assets.vehicleDataUri) return h(View, { key, style: container });
      // contain: whole vehicle, centered, no crop.
      return h(
        View,
        { key, style: container },
        h(Image, { src: ctx.assets.vehicleDataUri, style: { maxWidth: "100%", maxHeight: boxH, objectFit: el.fit } })
      );
    }
    case "statusCard": {
      const CARD_H = px(46);
      const label = R(ctx, el.label);
      const value = el.value ? R(ctx, el.value) : "";
      const margins = { marginTop: px(st.marginTop), marginBottom: px(st.marginBottom) };
      if (el.variant === "solid") {
        return h(
          View,
          {
            key,
            style: {
              ...margins,
              height: CARD_H,
              backgroundColor: MAGENTA,
              borderRadius: px(10),
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: px(10),
            },
          },
          h(Text, { style: { color: WHITE, fontFamily: "Helvetica-Bold", fontSize: px(12.5), letterSpacing: 0.4 } }, label)
        );
      }
      return h(
        View,
        {
          key,
          style: {
            ...margins,
            height: CARD_H,
            backgroundColor: "#FBFBFC",
            borderWidth: 1.5,
            borderColor: MAGENTA,
            borderStyle: "solid",
            borderRadius: px(10),
            justifyContent: "center",
            paddingLeft: px(12),
            paddingRight: px(10),
            position: "relative",
          },
        },
        h(View, { style: { position: "absolute", left: 0, top: 0, bottom: 0, width: px(4), backgroundColor: MAGENTA } }),
        h(Text, { style: { color: MAGENTA, fontFamily: "Helvetica-Bold", fontSize: px(7.5), letterSpacing: 0.7 } }, label.toUpperCase()),
        h(Text, { style: { color: INK, fontFamily: "Helvetica-Bold", fontSize: px(13), marginTop: px(2) } }, value || "—")
      );
    }
    case "separator":
      return h(
        View,
        { key, style: base },
        h(View, { style: { borderTopWidth: el.size ?? 1, borderTopColor: st.borderColor ?? "#E4E4E7", borderTopStyle: "solid" } })
      );
    case "spacer":
      return h(View, { key, style: { height: px(el.size ?? 16) } });
    case "customerData":
      return h(
        View,
        { key, style: base },
        Heading(R(ctx, el.heading ?? "Datos del cliente"), SECTION_ICON.customerData),
        KV([
          ["Nombre", v["customer.fullName"]],
          ["Teléfono", v["customer.phone"]],
          ["Correo", v["customer.email"]],
          ["País", v["customer.country"]],
          ["Documento", v["customer.idOrPassport"]],
          ["Licencia", v["customer.driverLicense"]],
        ])
      );
    case "vehicleData":
      return h(
        View,
        { key, style: base },
        Heading(R(ctx, el.heading ?? "Datos del vehículo"), SECTION_ICON.vehicleData),
        KV([
          ["Vehículo", v["vehicle.name"]],
          ["Especificaciones", v["vehicle.specs"]],
          ["Tarifa/día", v["rental.dailyPrice"]],
        ])
      );
    case "rentalDetails":
      return h(
        View,
        { key, style: base },
        Heading(R(ctx, el.heading ?? "Detalles de la renta"), SECTION_ICON.rentalDetails),
        KV([
          ["Recogida", `${v["rental.pickupDate"]} · ${v["rental.pickupTime"]}`],
          ["Devolución", `${v["rental.returnDate"]} · ${v["rental.returnTime"]}`],
          ["Lugar de recogida", v["rental.pickupLocation"]],
          ["Lugar de devolución", v["rental.dropoffLocation"]],
          ["Días", v["rental.days"]],
        ])
      );
    case "paymentSummary":
      return h(
        View,
        { key, style: base },
        Heading(R(ctx, el.heading ?? "Resumen de pago"), SECTION_ICON.paymentSummary),
        KV([
          ["Tarifa diaria", v["rental.dailyPrice"]],
          ["Subtotal", v["pricing.subtotal"]],
        ]),
        // TOTAL: black bar with fuchsia amount
        h(
          View,
          {
            style: {
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: BLACK,
              borderRadius: px(10),
              paddingHorizontal: px(10),
              paddingVertical: px(8),
              marginTop: px(6),
            },
          },
          h(Text, { style: { color: WHITE, fontFamily: "Helvetica-Bold", fontSize: px(11) } }, "TOTAL DE LA RESERVA"),
          h(Text, { style: { color: MAGENTA, fontFamily: "Helvetica-Bold", fontSize: px(15) } }, v["pricing.total"])
        ),
        // Deposit + balance
        h(
          View,
          { style: { backgroundColor: "#FCE3F1", borderRadius: px(10), paddingHorizontal: px(10), paddingVertical: px(7), marginTop: px(6) } },
          h(
            View,
            { style: { flexDirection: "row", justifyContent: "space-between", paddingVertical: px(2.4) } },
            h(Text, { style: { fontSize: px(10.5), fontFamily: "Helvetica-Bold", color: INK } }, "Depósito recibido"),
            h(Text, { style: { fontSize: px(10.5), fontFamily: "Helvetica-Bold", color: INK } }, v["pricing.deposit"])
          ),
          h(
            View,
            { style: { flexDirection: "row", justifyContent: "space-between", paddingVertical: px(2.4) } },
            h(Text, { style: { fontSize: px(10.5), fontFamily: "Helvetica-Bold", color: INK } }, "Balance pendiente"),
            h(Text, { style: { fontSize: px(10.5), fontFamily: "Helvetica-Bold", color: INK } }, v["pricing.balance"])
          )
        ),
        h(Text, { style: { fontSize: px(8), color: MUTED, marginTop: px(5) } }, `Método de pago del depósito: ${v["pricing.paymentMethod"] || "—"}`)
      );
    case "flightInfo":
      return h(
        View,
        { key, style: base },
        Heading(R(ctx, el.heading ?? "Información de vuelo"), SECTION_ICON.flightInfo),
        KV([
          ["Aerolínea (llegada)", v["flight.arrivalAirline"]],
          ["Vuelo (llegada)", v["flight.arrivalNumber"]],
          ["Aeropuerto", v["flight.arrivalAirport"]],
          ["Aerolínea (regreso)", v["flight.returnAirline"]],
          ["Vuelo (regreso)", v["flight.returnNumber"]],
        ])
      );
    case "specialRequest":
      return h(
        View,
        { key, style: base },
        Heading(R(ctx, el.heading ?? "Solicitud especial"), SECTION_ICON.specialRequest),
        h(Text, { style: { fontFamily: "Helvetica-Oblique", fontSize: px(10.5), color: INK, lineHeight: 1.4 } }, v["special.request"] || "—")
      );
    case "policyAcceptance":
      return h(
        View,
        { key, style: base },
        Heading(R(ctx, el.heading ?? "Aceptación de política"), SECTION_ICON.policyAcceptance),
        h(
          Text,
          { style: { fontSize: px(10.5), color: INK, lineHeight: 1.4 } },
          "El cliente declaró que la información es correcta y aceptó la política de reserva. Fecha: ",
          h(Text, { style: { color: MAGENTA, fontFamily: "Helvetica-Bold" } }, v["policy.acceptedAt"] || "—")
        )
      );
    case "reservationConditions":
      return h(
        View,
        { key, style: base },
        Heading(R(ctx, el.heading ?? "Condiciones de reserva"), SECTION_ICON.reservationConditions),
        ...RESERVATION_POLICY_SUMMARY.map((c, i) =>
          h(
            View,
            { key: i, style: { flexDirection: "row", marginBottom: px(2) } },
            h(Text, { style: { fontSize: px(10), color: INK, marginRight: px(4) } }, "•"),
            h(Text, { style: { fontSize: px(10), color: INK, lineHeight: 1.5, flex: 1 } }, c)
          )
        ),
        h(Text, { style: { fontSize: px(9), color: MUTED, fontFamily: "Helvetica-Oblique", marginTop: px(2) } }, RESERVATION_POLICY_CONTRACT_NOTE)
      );
    case "arrivalInfo": {
      const bullets = [
        "Ten disponible tu licencia de conducir.",
        "Ten disponible tu documento de identidad o pasaporte.",
        "Avísanos por WhatsApp cuando aterrices o estés próximo al punto de entrega.",
        "Guarda esta confirmación para tener los datos de tu reserva a mano.",
      ];
      return h(
        View,
        { key, style: base },
        Heading(R(ctx, el.heading ?? "Información para tu llegada"), SECTION_ICON.arrivalInfo),
        // Two columns: left = checklist + discreet note; right = WhatsApp QR card.
        h(
          View,
          { style: { flexDirection: "row", alignItems: "stretch" } },
          // LEFT column
          h(
            View,
            { style: { flex: 1.35, paddingRight: px(12) } },
            ...bullets.map((c, i) =>
              h(
                View,
                { key: i, style: { flexDirection: "row", marginBottom: px(3) } },
                h(Text, { style: { fontSize: px(10), color: MAGENTA, marginRight: px(5), fontFamily: "Helvetica-Bold" } }, "•"),
                h(Text, { style: { fontSize: px(10), color: INK, lineHeight: 1.45, flex: 1 } }, c)
              )
            ),
            h(
              Text,
              { style: { fontSize: px(8.5), color: MUTED, fontFamily: "Helvetica-Oblique", marginTop: px(5) } },
              "El contrato de alquiler se completa al momento de la entrega del vehículo."
            )
          ),
          // RIGHT column: WhatsApp card (black surface, fuchsia accents, QR with white quiet zone)
          h(
            View,
            {
              style: {
                flex: 1,
                backgroundColor: BLACK,
                borderRadius: px(12),
                paddingTop: px(10),
                paddingBottom: px(10),
                paddingLeft: px(12),
                paddingRight: px(12),
                flexDirection: "row",
                alignItems: "center",
              },
            },
            // Texts
            h(
              View,
              { style: { flex: 1, paddingRight: px(10) } },
              h(Text, { style: { color: MAGENTA, fontFamily: "Helvetica-Bold", fontSize: px(13), letterSpacing: 0.4 } }, "¿YA LLEGASTE?"),
              h(
                Text,
                { style: { color: WHITE, fontSize: px(9), lineHeight: 1.4, marginTop: px(5) } },
                "Escanea y avísanos por WhatsApp."
              ),
              h(
                Text,
                { style: { color: "#C4C4C8", fontSize: px(9), lineHeight: 1.4, marginTop: px(2) } },
                "Estamos listos para recibirte."
              )
            ),
            // QR with a white quiet-zone frame so it scans reliably against black.
            ctx.assets.arrivalQrDataUri
              ? h(
                  View,
                  {
                    style: {
                      backgroundColor: WHITE,
                      borderRadius: px(8),
                      padding: px(6),
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  },
                  h(Image, { src: ctx.assets.arrivalQrDataUri, style: { width: px(76), height: px(76) } })
                )
              : null
          )
        )
      );
    }
    case "contactFooter":
      return h(
        View,
        {
          key,
          style: {
            ...base,
            backgroundColor: st.background ?? BLACK,
            borderRadius: st.borderRadius ? px(st.borderRadius) : 0,
            paddingTop: px(10),
            paddingBottom: px(10),
            paddingLeft: px(14),
            paddingRight: px(14),
            flexDirection: "row",
            alignItems: "center",
          },
        },
        ctx.assets.officialLogoDataUri
          ? h(Image, { src: ctx.assets.officialLogoDataUri, style: { height: px(34), objectFit: "contain", marginRight: px(12) } })
          : null,
        h(
          View,
          { style: { marginRight: px(12) } },
          h(Text, { style: { fontSize: px(9), fontFamily: "Helvetica-Bold", color: WHITE } }, v["company.whatsapp"]),
          h(Text, { style: { fontSize: px(7), color: "#C4C4C8" } }, "WhatsApp")
        ),
        h(
          View,
          { style: { marginRight: px(12) } },
          h(Text, { style: { fontSize: px(9), fontFamily: "Helvetica-Bold", color: WHITE } }, v["company.website"]),
          h(Text, { style: { fontSize: px(7), color: "#C4C4C8" } }, "Visítanos en línea")
        ),
        h(
          View,
          { style: { flex: 1 } },
          h(Text, { style: { fontSize: px(7.5), color: "#C4C4C8" } }, "Santo Domingo, República Dominicana"),
          h(Text, { style: { fontSize: px(7.5), color: "#C4C4C8" } }, "Entrega en el Aeropuerto Las Américas (SDQ)")
        ),
        h(Text, { style: { color: MAGENTA, fontFamily: "Helvetica-Oblique", fontSize: px(9) } }, "Más que un auto, ¡libertad!")
      );
    default:
      return null;
  }
}

/** Render a row: 1/2/3 column grid with per-column stacks. */
function renderRow(row: TemplateRow, ctx: Ctx, key: string): ReactElement {
  const cols = row.columns;
  const gap = px(row.gap ?? 12);
  const columns = row.cells.map((cell, ci) =>
    h(
      View,
      { key: ci, style: { flex: 1, marginLeft: ci === 0 ? 0 : gap } },
      ...cell.map((el, ei) => renderElement(el, ctx, `${ci}-${ei}`)).filter(Boolean)
    )
  );
  return h(
    View,
    {
      key,
      style: {
        backgroundColor: row.background && row.background !== "transparent" ? row.background : undefined,
        paddingLeft: px(row.paddingX ?? 0),
        paddingRight: px(row.paddingX ?? 0),
        paddingTop: px(row.paddingY ?? 0),
        paddingBottom: px(row.paddingY ?? 0),
        minHeight: row.height ? px(row.height) : undefined,
        flexDirection: "row",
      },
    },
    ...(cols === 1 ? [h(View, { style: { flex: 1 } }, ...row.cells[0].map((el, ei) => renderElement(el, ctx, `0-${ei}`)).filter(Boolean))] : columns)
  );
}

/**
 * Build the confirmation PDF Document from the PUBLISHED template document.
 */
export function TemplatePdfDocument(
  doc: TemplateDocument,
  snapshot: ConfirmationSnapshot,
  assets: TemplatePdfAssets
): ReactElement {
  const ctx: Ctx = { v: tokenValues(snapshot), assets };
  const pagePaddingX = px(doc.page.paddingX ?? 0);
  const pagePaddingY = px(doc.page.paddingY ?? 0);

  // When the template's LAST row is the bottom banner/footer, push it to the
  // bottom edge by inserting a flexible spacer before it. The page is a
  // vertical flex column, so the spacer (flexGrow:1) absorbs the leftover
  // vertical space and the banner rests at the bottom, instead of leaving a
  // large white strip beneath it. Nothing is stretched or resized: each row
  // keeps its intrinsic height; only the empty gap is distributed.
  //
  // Robust footer detection — do NOT assume the footer is a `contactFooter`.
  // The real published template uses a full-width `image` as its bottom banner
  // (ROW 5). A footer row is any LAST row whose cells contain ONLY banner-type
  // elements (contactFooter / image / logo) — i.e. a pure banner strip with no
  // data blocks or text. This matches both the real template (image) and the
  // legacy one (contactFooter) without touching intrinsic sizes.
  const BANNER_TYPES = new Set(["contactFooter", "image", "logo"]);
  const rowsEls = doc.rows.map((row, i) => renderRow(row, ctx, `row-${i}`));
  const lastRow = doc.rows[doc.rows.length - 1];
  const lastRowElements = lastRow ? lastRow.cells.flat() : [];
  const lastIsFooter = Boolean(
    lastRow &&
      lastRowElements.length > 0 &&
      lastRowElements.every((el) => BANNER_TYPES.has(el.type))
  );
  const children = lastIsFooter
    ? [
        ...rowsEls.slice(0, -1),
        h(View, { key: "__spacer", style: { flexGrow: 1, minHeight: px(8) } }),
        rowsEls[rowsEls.length - 1],
      ]
    : rowsEls;

  return h(
    Document,
    null,
    h(
      Page,
      {
        size: "A4",
        style: {
          ...s.page,
          flexDirection: "column",
          backgroundColor: doc.page.background || WHITE,
          paddingLeft: pagePaddingX,
          paddingRight: pagePaddingX,
          paddingTop: pagePaddingY,
          paddingBottom: pagePaddingY,
        },
      },
      ...children
    )
  );
}

/** A4 dimensions in pt for reference (unused directly; @react-pdf handles A4). */
export const A4_PT = { width: px(A4_WIDTH_PX), height: px(A4_HEIGHT_PX) };
