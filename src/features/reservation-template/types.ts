/**
 * Reservation confirmation TEMPLATE model — the single source of truth for the
 * visual builder AND (in a later stage) the PDF renderer. Plain data (no React)
 * so it can be imported anywhere: editor, preview, server actions, PDF.
 *
 * Shape: TemplateDocument → rows → columns → elements.
 * An A4 portrait page is the design surface (see A4 constants below).
 */

// A4 portrait in CSS pixels at 96dpi (matches @react-pdf points closely enough
// for a 1:1 design surface). Used by the canvas and the page-fit guide.
export const A4_WIDTH_PX = 794; // 210mm @ 96dpi
export const A4_HEIGHT_PX = 1123; // 297mm @ 96dpi

/** Object-fit options for images. */
export type ImageFit = "contain" | "cover";

/** Horizontal alignment used across elements and images. */
export type Align = "left" | "center" | "right";

/** Shared style block available on every element. All optional. */
export interface ElementStyle {
  // Spacing (px)
  marginTop?: number;
  marginBottom?: number;
  paddingX?: number;
  paddingY?: number;
  // Text
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  align?: Align;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  // Box
  background?: string; // container background
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

/** The element catalog. Discriminated union by `type`. */
export type TemplateElementType =
  | "title"
  | "text"
  | "image"
  | "logo"
  | "vehicleImage"
  | "customerData"
  | "vehicleData"
  | "rentalDetails"
  | "paymentSummary"
  | "flightInfo"
  | "specialRequest"
  | "policyAcceptance"
  | "reservationConditions"
  | "separator"
  | "spacer"
  | "contactFooter"
  | "statusCard";

interface BaseElement {
  id: string;
  type: TemplateElementType;
  style: ElementStyle;
}

/** Title / Text: free text that may contain {{tokens}}. */
export interface TextualElement extends BaseElement {
  type: "title" | "text";
  content: string; // may contain {{tokens}}
}

/** A static image chosen/uploaded by the admin (URL) or a dynamic token. */
export interface ImageElement extends BaseElement {
  type: "image";
  /** Static image URL, or a {{token}} like {{vehicle.image}}. */
  src: string;
  fit: ImageFit;
  width?: number; // px; undefined = full column width
  height?: number; // px
}

/** Official logo (resolved from CompanySettings at render time). */
export interface LogoElement extends BaseElement {
  type: "logo";
  fit: ImageFit;
  width?: number;
  height?: number;
}

/** Dynamic vehicle photo (resolved from the reservation's vehicle). */
export interface VehicleImageElement extends BaseElement {
  type: "vehicleImage";
  fit: ImageFit; // contain = whole car visible, proportional, centered
  width?: number;
  height?: number;
}

/** Structured data blocks (rendered from the snapshot; no free text). */
export interface DataBlockElement extends BaseElement {
  type:
    | "customerData"
    | "vehicleData"
    | "rentalDetails"
    | "paymentSummary"
    | "flightInfo"
    | "specialRequest"
    | "policyAcceptance"
    | "reservationConditions"
    | "contactFooter";
  /** Optional heading shown above the block (may contain tokens). */
  heading?: string;
}

/** Separator (horizontal line) / spacer (empty vertical space). */
export interface SpacingElement extends BaseElement {
  type: "separator" | "spacer";
  /** For spacer: the height in px. For separator: line thickness. */
  size?: number;
}

/**
 * Compact "status" card for the strip under the banner (reservation number,
 * confirmation date, confirmed state). Renders a rounded, fixed-height card so
 * three of them in a row line up at the same height.
 *  - variant "light": white/soft background with a fuchsia border + accent.
 *  - variant "solid": solid fuchsia background with white text (CONFIRMADA).
 */
export interface StatusCardElement extends BaseElement {
  type: "statusCard";
  /** Small uppercase label on top (may contain {{tokens}}). */
  label: string;
  /** Main value (may contain {{tokens}}). Optional for solid/centered cards. */
  value?: string;
  variant: "light" | "solid";
}

export type TemplateElement =
  | TextualElement
  | ImageElement
  | LogoElement
  | VehicleImageElement
  | DataBlockElement
  | SpacingElement
  | StatusCardElement;

/** A row with 1, 2 or 3 columns. Each column holds an ordered element list. */
export interface TemplateRow {
  id: string;
  columns: 1 | 2 | 3;
  /** Content per column (length === columns). */
  cells: TemplateElement[][];
  /** Optional fixed row height (px). Undefined = auto. */
  height?: number;
  background?: string;
  paddingX?: number;
  paddingY?: number;
  /** Column gap (px). */
  gap?: number;
}

export interface TemplateDocument {
  version: 1;
  /** Page-level padding (px) applied inside the A4 surface. */
  page: { paddingX: number; paddingY: number; background: string };
  rows: TemplateRow[];
}

export type TemplateStatus = "draft" | "published";

/** Human labels for the palette (order = display order). */
export const ELEMENT_LABELS: Record<TemplateElementType, string> = {
  title: "Título",
  text: "Texto",
  image: "Imagen",
  logo: "Logo oficial",
  vehicleImage: "Foto del vehículo",
  customerData: "Datos del cliente",
  vehicleData: "Datos del vehículo",
  rentalDetails: "Detalles de la renta",
  paymentSummary: "Resumen de pago",
  flightInfo: "Información de vuelo",
  specialRequest: "Solicitud especial",
  policyAcceptance: "Aceptación de política",
  reservationConditions: "Condiciones de reserva",
  separator: "Separador",
  spacer: "Espaciador",
  contactFooter: "Datos de contacto / footer",
  statusCard: "Tarjeta de estado",
};

/** The order elements appear in the palette. */
export const PALETTE_ORDER: TemplateElementType[] = [
  "title",
  "text",
  "image",
  "logo",
  "vehicleImage",
  "customerData",
  "vehicleData",
  "rentalDetails",
  "paymentSummary",
  "flightInfo",
  "specialRequest",
  "policyAcceptance",
  "reservationConditions",
  "statusCard",
  "separator",
  "spacer",
  "contactFooter",
];

/** Builds a fresh element of the given type with sensible defaults. */
export function makeElement(type: TemplateElementType, id: string): TemplateElement {
  const style: ElementStyle = { marginTop: 0, marginBottom: 8, align: "left" };
  switch (type) {
    case "title":
      return { id, type, style: { ...style, fontSize: 18, fontWeight: "bold", color: "#0B0B0C" }, content: "Título" };
    case "text":
      return { id, type, style: { ...style, fontSize: 11, color: "#191919", lineHeight: 1.4 }, content: "Escribe aquí o inserta un {{token}}." };
    case "image":
      return { id, type, style, src: "", fit: "cover", height: 160 };
    case "logo":
      return { id, type, style: { ...style, align: "left" }, fit: "contain", height: 48 };
    case "vehicleImage":
      return { id, type, style: { ...style, background: "#F6F6F7", borderRadius: 8 }, fit: "contain", height: 180 };
    case "statusCard":
      return { id, type, style: { ...style, marginBottom: 0 }, label: "ETIQUETA", value: "Valor", variant: "light" };
    case "separator":
      return { id, type, style: { ...style, borderColor: "#E4E4E7" }, size: 1 };
    case "spacer":
      return { id, type, style: { ...style, marginBottom: 0 }, size: 16 };
    case "customerData":
    case "vehicleData":
    case "rentalDetails":
    case "paymentSummary":
    case "flightInfo":
    case "specialRequest":
    case "policyAcceptance":
    case "reservationConditions":
    case "contactFooter":
      return { id, type, style: { ...style, fontSize: 10, color: "#191919" }, heading: ELEMENT_LABELS[type] };
  }
}

/** An empty starter document. */
export function emptyTemplate(): TemplateDocument {
  return {
    version: 1,
    page: { paddingX: 32, paddingY: 32, background: "#FFFFFF" },
    rows: [],
  };
}
