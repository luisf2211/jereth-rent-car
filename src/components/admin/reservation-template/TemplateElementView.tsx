"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import type { ConfirmationSnapshot } from "@/lib/reservations/confirmation-snapshot";
import type { TemplateElement, ElementStyle } from "@/features/reservation-template/types";
import { resolveTokens, tokenValues } from "@/features/reservation-template/tokens";
import {
  RESERVATION_POLICY_SUMMARY,
  RESERVATION_POLICY_CONTRACT_NOTE,
} from "@/lib/reservations/policy";

/**
 * Renders a single template element to HTML for BOTH the editor canvas and the
 * preview. In "preview" mode tokens/data blocks resolve against the given
 * snapshot; in "edit" mode they show the raw tokens / labeled placeholders so
 * the admin sees the structure. This is presentation only (no PDF here).
 */

const MAGENTA = "#EC0F8D";
const INK = "#191919";
const MUTED = "#6E6E73";
const BLACK = "#0B0B0C";
const WHITE = "#FFFFFF";

/**
 * Fixed official logo for reservation confirmations. Bundled in the project
 * under /public so the "Logo oficial" element always uses this exact file
 * (shown as-is, keeping proportions/transparency). Replace the file to update
 * the logo; no code change needed.
 */
const OFFICIAL_LOGO_SRC = "/pdf/logo-oficial.png";

function boxSx(style: ElementStyle): React.CSSProperties {
  return {
    marginTop: style.marginTop ?? 0,
    marginBottom: style.marginBottom ?? 0,
    paddingLeft: style.paddingX ?? 0,
    paddingRight: style.paddingX ?? 0,
    paddingTop: style.paddingY ?? 0,
    paddingBottom: style.paddingY ?? 0,
    textAlign: style.align ?? "left",
    color: style.color ?? INK,
    background: style.background ?? "transparent",
    borderStyle: style.borderWidth ? "solid" : undefined,
    borderColor: style.borderColor,
    borderWidth: style.borderWidth,
    borderRadius: style.borderRadius,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
  };
}

/** Key/value list used by the data blocks. Sized for A4 legibility. */
function KV({ rows }: { rows: [string, string][] }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {rows.map(([k, v]) => (
        <Box key={k} sx={{ display: "flex", justifyContent: "space-between", gap: 1, borderBottom: "1px solid #EEE", py: 0.6 }}>
          <span style={{ color: MUTED, fontSize: 10.5 }}>{k}</span>
          <span style={{ fontWeight: 700, textAlign: "right", fontSize: 10.5, color: INK }}>{v || "—"}</span>
        </Box>
      ))}
    </Box>
  );
}

/** Icon per section (matches the approved reference). Kept as simple glyphs so
 *  it renders identically in the editor and (later) the PDF. */
const SECTION_ICON: Record<string, string> = {
  customerData: "👤",
  vehicleData: "🚗",
  rentalDetails: "📅",
  paymentSummary: "$",
  flightInfo: "✈",
  specialRequest: "✎",
  policyAcceptance: "👤",
  reservationConditions: "ⓘ",
  contactFooter: "",
};

/** Section heading: full BLACK bar with a fuchsia rounded icon badge + white
 *  uppercase text — the premium look from the approved reference. */
function Heading({ text, icon }: { text?: string; icon?: string }) {
  if (!text) return null;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        bgcolor: BLACK,
        borderRadius: 1.25,
        px: 1.25,
        py: 1,
        mb: 1,
      }}
    >
      {icon ? (
        <Box
          sx={{
            width: 18,
            height: 18,
            bgcolor: MAGENTA,
            borderRadius: 1,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: WHITE,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {icon}
        </Box>
      ) : (
        <Box sx={{ width: 9, height: 9, bgcolor: MAGENTA, borderRadius: "50%", flexShrink: 0 }} />
      )}
      <span style={{ color: WHITE, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 }}>
        {text}
      </span>
    </Box>
  );
}

interface Props {
  element: TemplateElement;
  snapshot: ConfirmationSnapshot;
  mode: "edit" | "preview";
}

export default function TemplateElementView({ element: el, snapshot, mode }: Props) {
  const values = React.useMemo(() => tokenValues(snapshot), [snapshot]);
  const t = (s: string) => (mode === "preview" ? resolveTokens(s, values) : s);
  const style = boxSx(el.style);

  switch (el.type) {
    case "title":
      return <Box sx={{ ...style, fontSize: el.style.fontSize ?? 18, fontWeight: el.style.fontWeight ?? "bold" }}>{t(el.content)}</Box>;
    case "text":
      return <Box sx={{ ...style, whiteSpace: "pre-wrap" }}>{t(el.content)}</Box>;
    case "image": {
      const src = mode === "preview" ? resolveTokens(el.src, values) : el.src;
      // The container must hug the image's real height. We use flex + a zeroed
      // line-height so an inline image's baseline "descender gap" (the few px
      // of empty space browsers reserve under inline-block images) never adds
      // vertical space. The image is display:block for the same reason. Only
      // the user's margins/padding affect spacing.
      const justify = el.style.align === "center" ? "center" : el.style.align === "right" ? "flex-end" : "flex-start";
      return (
        <Box
          style={{
            ...style,
            display: "flex",
            justifyContent: justify,
            lineHeight: 0,
            fontSize: 0,
          }}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              style={{
                width: el.width ? `${el.width}px` : "100%",
                height: el.height ? `${el.height}px` : "auto",
                objectFit: el.fit,
                borderRadius: el.style.borderRadius,
                display: "block",
                background: el.style.background,
              }}
            />
          ) : (
            <Box sx={{ width: el.width ? `${el.width}px` : "100%", height: el.height ?? 120, bgcolor: "#EEE", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 10, borderRadius: `${el.style.borderRadius ?? 0}px` }}>
              Imagen (define una URL o token)
            </Box>
          )}
        </Box>
      );
    }
    case "logo": {
      // The "Logo oficial" element always uses the fixed official confirmation
      // logo bundled in the project (public/pdf/logo-oficial.png), shown as-is
      // (proportions + transparency preserved). Width/height/fit/align remain
      // configurable via the element style.
      return (
        <Box
          style={{
            ...style,
            display: "flex",
            justifyContent: el.style.align === "center" ? "center" : el.style.align === "right" ? "flex-end" : "flex-start",
            lineHeight: 0,
            fontSize: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={OFFICIAL_LOGO_SRC}
            alt="JERETH RENT CAR"
            style={{ height: el.height ?? 48, width: el.width ? `${el.width}px` : "auto", objectFit: el.fit, display: "block" }}
          />
        </Box>
      );
    }
    case "vehicleImage": {
      const src = values["vehicle.image"];
      return (
        <Box style={{ ...style, textAlign: el.style.align }}>
          <Box sx={{ height: el.height ?? 180, background: el.style.background ?? "#F6F6F7", borderRadius: `${el.style.borderRadius ?? 8}px`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {mode === "preview" && src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="Vehículo" style={{ width: "100%", height: "100%", objectFit: el.fit }} />
            ) : (
              <span style={{ color: MUTED, fontSize: 10 }}>Foto del vehículo ({el.fit})</span>
            )}
          </Box>
        </Box>
      );
    }
    case "statusCard": {
      // Compact, equal-height card for the strip under the banner. A fixed
      // height guarantees the three cards line up regardless of grid alignment.
      // Only the element's own margins are honored; the card owns everything
      // else so all three look consistent.
      const CARD_H = 46;
      const label = t(el.label);
      const value = el.value ? t(el.value) : "";
      const margins = { marginTop: el.style.marginTop ?? 0, marginBottom: el.style.marginBottom ?? 0 };
      if (el.variant === "solid") {
        return (
          <Box
            sx={{
              ...margins,
              height: CARD_H,
              bgcolor: MAGENTA,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: 1.25,
              boxShadow: "0 2px 6px rgba(236,15,141,0.35)",
            }}
          >
            <span style={{ color: WHITE, fontWeight: 800, fontSize: 12.5, letterSpacing: 0.4, whiteSpace: "nowrap" }}>
              {label}
            </span>
          </Box>
        );
      }
      // Light variant: soft surface, fuchsia border + left accent bar.
      return (
        <Box
          sx={{
            ...margins,
            height: CARD_H,
            bgcolor: "#FBFBFC",
            border: `1.5px solid ${MAGENTA}`,
            borderRadius: 2.5,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            pl: 1.5,
            pr: 1.25,
          }}
        >
          {/* Fuchsia left accent bar */}
          <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: MAGENTA }} />
          <span style={{ color: MAGENTA, fontWeight: 700, fontSize: 7.5, letterSpacing: 0.7, textTransform: "uppercase" }}>
            {label}
          </span>
          <span style={{ color: INK, fontWeight: 800, fontSize: 13, lineHeight: 1.15, marginTop: 2 }}>
            {value || "—"}
          </span>
        </Box>
      );
    }
    case "separator":
      return <Box style={style}><Box sx={{ borderTop: `${el.size ?? 1}px solid ${el.style.borderColor ?? "#E4E4E7"}` }} /></Box>;
    case "spacer":
      return <Box style={{ height: el.size ?? 16 }} />;
    case "customerData":
      return (
        <Box style={style}>
          <Heading text={t(el.heading ?? "Datos del cliente")} icon={SECTION_ICON.customerData} />
          {mode === "preview" ? (
            <KV rows={[["Nombre", values["customer.fullName"]], ["Teléfono", values["customer.phone"]], ["Correo", values["customer.email"]], ["País", values["customer.country"]], ["Documento", values["customer.idOrPassport"]], ["Licencia", values["customer.driverLicense"]]]} />
          ) : (
            <span style={{ color: MUTED, fontSize: 10 }}>Bloque: nombre, teléfono, correo, país, documento, licencia</span>
          )}
        </Box>
      );
    case "vehicleData":
      return (
        <Box style={style}>
          <Heading text={t(el.heading ?? "Datos del vehículo")} icon={SECTION_ICON.vehicleData} />
          {mode === "preview" ? (
            <KV rows={[["Vehículo", values["vehicle.name"]], ["Especificaciones", values["vehicle.specs"]], ["Tarifa/día", values["rental.dailyPrice"]]]} />
          ) : (
            <span style={{ color: MUTED, fontSize: 10 }}>Bloque: vehículo, especificaciones, tarifa/día</span>
          )}
        </Box>
      );
    case "rentalDetails":
      return (
        <Box style={style}>
          <Heading text={t(el.heading ?? "Detalles de la renta")} icon={SECTION_ICON.rentalDetails} />
          {mode === "preview" ? (
            <KV rows={[["Recogida", `${values["rental.pickupDate"]} · ${values["rental.pickupTime"]}`], ["Devolución", `${values["rental.returnDate"]} · ${values["rental.returnTime"]}`], ["Lugar de recogida", values["rental.pickupLocation"]], ["Lugar de devolución", values["rental.dropoffLocation"]], ["Días", values["rental.days"]]]} />
          ) : (
            <span style={{ color: MUTED, fontSize: 10 }}>Bloque: fechas/horas, lugares, días</span>
          )}
        </Box>
      );
    case "paymentSummary":
      return (
        <Box style={style}>
          <Heading text={t(el.heading ?? "Resumen de pago")} icon={SECTION_ICON.paymentSummary} />
          {mode === "preview" ? (
            <Box>
              <KV rows={[["Tarifa diaria", values["rental.dailyPrice"]], ["Subtotal", values["pricing.subtotal"]]]} />
              {/* TOTAL: black bar with fuchsia amount */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: BLACK, borderRadius: 1.25, px: 1.25, py: 1, mt: 0.75 }}>
                <span style={{ color: WHITE, fontWeight: 700, fontSize: 11 }}>TOTAL DE LA RESERVA</span>
                <span style={{ color: MAGENTA, fontWeight: 800, fontSize: 15 }}>{values["pricing.total"]}</span>
              </Box>
              {/* Deposit + balance highlighted */}
              <Box sx={{ bgcolor: "#FCE3F1", borderRadius: 1.25, px: 1.25, py: 0.9, mt: 0.75 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.3 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: INK }}>Depósito recibido ✓</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: INK }}>{values["pricing.deposit"]}</span>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.3 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: INK }}>Balance pendiente</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: INK }}>{values["pricing.balance"]}</span>
                </Box>
              </Box>
              <div style={{ fontSize: 8, color: MUTED, marginTop: 5 }}>Método de pago del depósito: {values["pricing.paymentMethod"] || "—"}</div>
            </Box>
          ) : (
            <span style={{ color: MUTED, fontSize: 10 }}>Bloque: subtotal, total (destacado), depósito y balance</span>
          )}
        </Box>
      );
    case "flightInfo":
      return (
        <Box style={style}>
          <Heading text={t(el.heading ?? "Información de vuelo")} icon={SECTION_ICON.flightInfo} />
          {mode === "preview" ? (
            <KV rows={[["Aerolínea (llegada)", values["flight.arrivalAirline"]], ["Vuelo (llegada)", values["flight.arrivalNumber"]], ["Aeropuerto", values["flight.arrivalAirport"]], ["Aerolínea (regreso)", values["flight.returnAirline"]], ["Vuelo (regreso)", values["flight.returnNumber"]]]} />
          ) : (
            <span style={{ color: MUTED, fontSize: 10 }}>Bloque: vuelo de llegada y regreso (si existen)</span>
          )}
        </Box>
      );
    case "specialRequest":
      return (
        <Box style={style}>
          <Heading text={t(el.heading ?? "Solicitud especial")} icon={SECTION_ICON.specialRequest} />
          {mode === "preview" ? (
            <span style={{ fontStyle: "italic", fontSize: 10.5, color: INK, lineHeight: 1.4 }}>{values["special.request"] || "—"}</span>
          ) : (
            <span style={{ color: MUTED, fontSize: 10 }}>Bloque: solicitud especial (si existe)</span>
          )}
        </Box>
      );
    case "policyAcceptance":
      return (
        <Box style={style}>
          <Heading text={t(el.heading ?? "Aceptación de política")} icon={SECTION_ICON.policyAcceptance} />
          {mode === "preview" ? (
            <span style={{ fontSize: 10.5, color: INK, lineHeight: 1.4 }}>El cliente declaró que la información es correcta y aceptó la política de reserva. Fecha: <b style={{ color: MAGENTA }}>{values["policy.acceptedAt"] || "—"}</b></span>
          ) : (
            <span style={{ color: MUTED, fontSize: 10 }}>Bloque: aceptación de política + fecha/hora</span>
          )}
        </Box>
      );
    case "reservationConditions":
      return (
        <Box style={style}>
          <Heading text={t(el.heading ?? "Condiciones de reserva")} icon={SECTION_ICON.reservationConditions} />
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {RESERVATION_POLICY_SUMMARY.map((c, i) => (
              <li key={i} style={{ fontSize: 10, lineHeight: 1.5, color: INK, marginBottom: 2 }}>{c}</li>
            ))}
          </Box>
          <span style={{ fontSize: 9, color: MUTED, fontStyle: "italic" }}>{RESERVATION_POLICY_CONTRACT_NOTE}</span>
        </Box>
      );
    case "contactFooter":
      return (
        <Box
          style={{
            ...style,
            background: el.style.background ?? BLACK,
            color: el.style.color ?? WHITE,
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 14,
            paddingRight: 14,
            borderRadius: el.style.borderRadius ?? 0,
          }}
        >
          {mode === "preview" ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Official logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={OFFICIAL_LOGO_SRC} alt="JERETH RENT CAR" style={{ height: 34, objectFit: "contain", flexShrink: 0 }} />
              {/* WhatsApp */}
              <Box sx={{ minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: WHITE }}>{values["company.whatsapp"]}</div>
                <div style={{ fontSize: 7, color: "#C4C4C8" }}>WhatsApp</div>
              </Box>
              {/* Web */}
              <Box sx={{ minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: WHITE }}>{values["company.website"]}</div>
                <div style={{ fontSize: 7, color: "#C4C4C8" }}>Visítanos en línea</div>
              </Box>
              {/* Location */}
              <Box sx={{ minWidth: 0 }}>
                <div style={{ fontSize: 7.5, color: "#C4C4C8" }}>Santo Domingo, República Dominicana</div>
                <div style={{ fontSize: 7.5, color: "#C4C4C8" }}>Entrega en el Aeropuerto Las Américas (SDQ)</div>
              </Box>
              <span style={{ color: MAGENTA, fontStyle: "italic", marginLeft: "auto", fontSize: 9, whiteSpace: "nowrap" }}>
                Más que un auto, ¡libertad!
              </span>
            </Box>
          ) : (
            <span style={{ fontSize: 10 }}>Footer: logo · WhatsApp · sitio web · ubicación · slogan</span>
          )}
        </Box>
      );
    default:
      return null;
  }
}
