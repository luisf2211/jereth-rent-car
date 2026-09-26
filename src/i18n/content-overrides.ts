import type { Locale } from "./config";

/**
 * Localization for the site's DEMO/manual content that lives in the database
 * (CompanySettings hero/about, Requirements, Reviews, FAQs) and was authored in
 * a single language. This does NOT change Prisma, the DB, the admin, or the
 * i18n architecture: it's a lookup that maps a known demo string to its
 * translation for the active locale.
 *
 * How it works:
 *  - Each entry lists the SAME piece of content in both languages ({ es, en }).
 *  - localizeDemoContent(locale, text) returns the version for `locale` when
 *    `text` matches either language of a known entry.
 *  - If `text` is NOT a known demo string (e.g. the owner later types custom
 *    content from the admin), it is returned unchanged — so custom content is
 *    never broken, it simply shows as typed.
 *
 * To add/adjust demo content: edit the arrays below. No DB or schema changes.
 */

export interface BilingualText {
  /** Canonical text shown when locale = es. */
  es: string;
  /** Canonical text shown when locale = en. */
  en: string;
  /**
   * Extra source strings that should ALSO resolve to this entry (e.g. an older
   * wording stored in the DB). Matching any of these — or `es`/`en` — returns
   * the canonical `es`/`en` above. Lets us update outdated copy (like
   * "solo WhatsApp") to the current wording in BOTH languages.
   */
  aliases?: string[];
}

/** Hero headline + subtitle (CompanySettings.heroTitle / heroSubtitle). */
export const HERO_OVERRIDES: BilingualText[] = [
  {
    es: "Tu viaje comienza aquí",
    en: "Your journey starts here",
  },
];

export const HERO_SUBTITLE_OVERRIDES: BilingualText[] = [
  {
    es: "Renta el vehículo ideal y descubre República Dominicana",
    en: "Rent the ideal vehicle and discover the Dominican Republic",
  },
];

/** About text (CompanySettings.aboutText). The WhatsApp-only wording is
 *  updated to reflect that online/digital booking is now available too. */
export const ABOUT_OVERRIDES: BilingualText[] = [
  {
    // Canonical ES updated to mention online booking + WhatsApp (no longer
    // WhatsApp-only). The old WhatsApp-only wording is an alias, so the stored
    // DB text still resolves here and shows the updated copy in both languages.
    es: "En Jereth Rent Car hacemos que moverte por República Dominicana sea fácil y seguro. Ofrecemos vehículos confiables, atención personalizada, reservas sencillas en línea o por WhatsApp y entrega en los principales aeropuertos del país. Disfruta precios claros, un servicio cercano y la libertad de viajar a tu ritmo.",
    en: "At Jereth Rent Car we make getting around the Dominican Republic easy and safe. We offer reliable vehicles, personalized service, simple bookings online or on WhatsApp, and delivery at the country's main airports. Enjoy clear pricing, attentive service, and the freedom to travel at your own pace.",
    aliases: [
      "En Jereth Rent Car hacemos que moverte por República Dominicana sea fácil y seguro. Ofrecemos vehículos confiables, atención personalizada, reservas sencillas por WhatsApp y entrega en los principales aeropuertos del país. Disfruta precios claros, un servicio cercano y la libertad de viajar a tu ritmo.",
    ],
  },
  {
    // Alternate demo about text (from prisma/seed-demo-content.ts). Canonical
    // ES updated to mention online + WhatsApp; old WhatsApp-only is an alias.
    es: "En Jereth Rent Car ayudamos a locales y turistas a moverse por Santo Domingo con vehículos confiables y una atención cercana. Reservas simples en línea o por WhatsApp, entrega en el Aeropuerto Las Américas (SDQ) y precios claros, sin letra pequeña.",
    en: "At Jereth Rent Car we help locals and tourists get around Santo Domingo with reliable vehicles and attentive service. Simple bookings online or on WhatsApp, delivery at Las Américas Airport (SDQ), and clear pricing with no fine print.",
    aliases: [
      "En Jereth Rent Car ayudamos a locales y turistas a moverse por Santo Domingo con vehículos confiables y una atención cercana. Reservas simples por WhatsApp, entrega en el Aeropuerto Las Américas (SDQ) y precios claros, sin letra pequeña.",
    ],
  },
];

/** Requirements (Requirement.text). */
export const REQUIREMENT_OVERRIDES: BilingualText[] = [
  { es: "Licencia de conducir vigente", en: "Valid driver's license" },
  { es: "Cédula o pasaporte válido", en: "Valid national ID or passport" },
  { es: "Edad mínima de 21 años", en: "Minimum age of 21" },
  { es: "Tarjeta de crédito o método de pago acordado", en: "Credit card or agreed payment method" },
  {
    // Reflects the current flow: a deposit is optional (selectable) rather than
    // strictly required. Old wording kept as an alias.
    es: "Depósito opcional para asegurar la reserva (puedes continuar sin depósito)",
    en: "Optional deposit to secure the reservation (you can continue without one)",
    aliases: ["Depósito o garantía según el vehículo"],
  },
];

/** Review comments (Review.comment). Author names are NOT translated. */
export const REVIEW_OVERRIDES: BilingualText[] = [
  {
    es: "Excelente servicio, el carro estaba impecable y me lo entregaron en el aeropuerto sin problemas. Muy recomendados.",
    en: "Excellent service, the car was spotless and they delivered it to me at the airport with no issues. Highly recommended.",
  },
  {
    es: "Gran experiencia rentando para mi viaje a Santo Domingo. Reserva fácil por WhatsApp y entrega en el aeropuerto. Volveré a usarlos.",
    en: "Great experience renting for my trip to Santo Domingo. Easy WhatsApp booking and airport pickup. Will use again.",
  },
  {
    es: "Buen precio y atención rápida por WhatsApp. El proceso fue sencillo y sin sorpresas.",
    en: "Good price and quick support on WhatsApp. The process was simple and with no surprises.",
  },
];

/** FAQ questions (FaqItem.question). */
export const FAQ_QUESTION_OVERRIDES: BilingualText[] = [
  {
    es: "¿Puedo recibir el vehículo en el Aeropuerto Las Américas (SDQ)?",
    en: "Can I pick up the vehicle at Las Américas Airport (SDQ)?",
  },
  { es: "¿Cuál es la edad mínima para rentar?", en: "What is the minimum age to rent?" },
  { es: "¿Qué documentos necesito?", en: "What documents do I need?" },
  { es: "¿Se requiere depósito?", en: "Is a deposit required?" },
  { es: "¿Qué pasa si mi vuelo se retrasa?", en: "What happens if my flight is delayed?" },
  { es: "¿Cómo reservo?", en: "How do I book?" },
];

/** FAQ answers (FaqItem.answer). The deposit answer is updated to reflect the
 *  current flow (optional deposit selection or continue without a deposit). */
export const FAQ_ANSWER_OVERRIDES: BilingualText[] = [
  {
    es: "Sí. Coordinamos la entrega y devolución en el aeropuerto. Compártenos tu número de vuelo y hora de llegada por WhatsApp para tenerlo listo.",
    en: "Yes. We arrange delivery and return at the airport. Share your flight number and arrival time with us on WhatsApp so we have it ready.",
  },
  {
    es: "La edad mínima es de 21 años, presentando licencia de conducir vigente.",
    en: "The minimum age is 21, with a valid driver's license.",
  },
  {
    es: "Licencia de conducir vigente y cédula o pasaporte. Para turistas, el pasaporte y la licencia de tu país.",
    en: "A valid driver's license and national ID or passport. For tourists, your passport and your home-country license.",
  },
  // --- Deposit question: canonical wording reflects the current flow
  //     (optional deposit or continue without one). Old "depósito obligatorio"
  //     wording is an alias so the stored DB answer shows the updated copy. ---
  {
    es: "El depósito no es obligatorio. Durante la reserva puedes elegir una de las opciones de depósito disponibles para asegurar tu reservación, o continuar sin depósito. Si realizas un depósito, forma parte del total y no es un cargo adicional.",
    en: "A deposit is not mandatory. During booking you can choose one of the available deposit options to secure your reservation, or continue without a deposit. If you pay a deposit, it is part of the total, not an extra charge.",
    aliases: [
      "Sí, se solicita un depósito o garantía que varía según el vehículo. Te confirmamos el monto exacto al momento de la reserva.",
    ],
  },
  {
    es: "No te preocupes. Damos seguimiento a tu vuelo y ajustamos la hora de entrega sin costo adicional por retrasos razonables.",
    en: "Don't worry. We track your flight and adjust the delivery time at no extra cost for reasonable delays.",
  },
  // --- "How do I book?" — canonical wording mentions online booking + WhatsApp.
  //     The old WhatsApp-only answer is an alias. ---
  {
    es: "Puedes reservar en línea aquí mismo en la página web, o escribirnos por WhatsApp con tus fechas y el vehículo que te interesa. Confirmamos disponibilidad y coordinamos la entrega.",
    en: "You can book online right here on the website, or message us on WhatsApp with your dates and the vehicle you want. We confirm availability and arrange delivery.",
    aliases: [
      "Escríbenos por WhatsApp con las fechas y el vehículo que te interesa. Confirmamos disponibilidad y coordinamos la entrega.",
    ],
  },
];

/** Delivery location NAMES (DeliveryLocation.name). */
export const DELIVERY_NAME_OVERRIDES: BilingualText[] = [
  {
    es: "Aeropuerto Internacional Las Américas (SDQ)",
    en: "Las Américas International Airport (SDQ)",
  },
  { es: "Santo Domingo", en: "Santo Domingo" },
];

/** Delivery location DESCRIPTIONS (DeliveryLocation.description). Covers both
 *  the production copy and the demo-seed copy (kept as aliases). */
export const DELIVERY_DESC_OVERRIDES: BilingualText[] = [
  {
    es: "Coordinamos la entrega y recogida de tu vehículo directamente en el aeropuerto al llegar tu vuelo. Escríbenos tu número de vuelo y hora estimada.",
    en: "We arrange your vehicle's delivery and return right at the airport when your flight lands. Send us your flight number and estimated arrival time.",
  },
  {
    es: "Entrega en tu hotel, residencia o punto acordado dentro de Santo Domingo y alrededores.",
    en: "Delivery to your hotel, residence, or agreed point within Santo Domingo and surrounding areas.",
  },
];

/**
 * Return `text` in the requested locale when it matches a known demo entry
 * (in either language). Unknown/custom text is returned unchanged.
 */
function localizeFrom(list: BilingualText[], locale: Locale, text: string): string {
  const trimmed = text.trim();
  const hit = list.find(
    (e) =>
      e.es.trim() === trimmed ||
      e.en.trim() === trimmed ||
      (e.aliases?.some((a) => a.trim() === trimmed) ?? false),
  );
  if (!hit) return text;
  return locale === "en" ? hit.en : hit.es;
}

export function localizeHero(locale: Locale, text: string): string {
  return localizeFrom(HERO_OVERRIDES, locale, text);
}
export function localizeHeroSubtitle(locale: Locale, text: string): string {
  return localizeFrom(HERO_SUBTITLE_OVERRIDES, locale, text);
}
export function localizeAbout(locale: Locale, text: string): string {
  return localizeFrom(ABOUT_OVERRIDES, locale, text);
}
export function localizeRequirement(locale: Locale, text: string): string {
  return localizeFrom(REQUIREMENT_OVERRIDES, locale, text);
}
export function localizeReview(locale: Locale, text: string): string {
  return localizeFrom(REVIEW_OVERRIDES, locale, text);
}
export function localizeFaqQuestion(locale: Locale, text: string): string {
  return localizeFrom(FAQ_QUESTION_OVERRIDES, locale, text);
}
export function localizeFaqAnswer(locale: Locale, text: string): string {
  return localizeFrom(FAQ_ANSWER_OVERRIDES, locale, text);
}
export function localizeDeliveryName(locale: Locale, text: string): string {
  return localizeFrom(DELIVERY_NAME_OVERRIDES, locale, text);
}
/** Descriptions can be null; returns "" for null so callers can render safely. */
export function localizeDeliveryDescription(locale: Locale, text: string | null): string {
  if (!text) return "";
  return localizeFrom(DELIVERY_DESC_OVERRIDES, locale, text);
}
