/**
 * RESERVATION policy (single source of truth).
 *
 * This is the policy for the RESERVATION only — it is NOT the rental contract
 * and involves no digital signature. Reused by the customer form (modal), the
 * confirmation email and the official confirmation PDF so the wording never
 * diverges. Plain data (no React/DOM) so it can be imported anywhere.
 */

export const RESERVATION_POLICY_TITLE = "POLÍTICA DE RESERVA — JERETH RENT CAR";

/** Full policy paragraphs, in order. */
export const RESERVATION_POLICY_PARAGRAPHS: string[] = [
  "Los depósitos realizados para asegurar una reserva no son reembolsables.",
  "En caso de cancelación de vuelo o una emergencia comprobable que impida realizar el viaje, el cliente podrá solicitar una reprogramación dentro de los 30 días siguientes a la fecha original de la reserva, sujeto a disponibilidad. El depósito realizado será aplicado a la nueva reserva y no será devuelto.",
  "Si la nueva fecha tiene una tarifa diferente, el cliente deberá asumir cualquier diferencia aplicable.",
  "Si el vehículo originalmente reservado no está disponible para la nueva fecha, JERETH RENT CAR coordinará con el cliente una alternativa disponible.",
  "En caso de no presentarse y no comunicar una situación justificada, el depósito de reserva se considerará perdido.",
];

/** Clarifying note about the 30-day window (it's the window to REQUEST the
 *  reprogramming, not a deadline for the trip itself). */
export const RESERVATION_POLICY_NOTE =
  "Los 30 días corresponden al plazo para solicitar la reprogramación. No significa que el nuevo viaje deba realizarse obligatoriamente dentro de esos 30 días.";

/** Short, legible bullet version for the PDF's policy box. */
export const RESERVATION_POLICY_SUMMARY: string[] = [
  "Los depósitos de reserva no son reembolsables.",
  "Cancelación de vuelo o emergencia comprobable puede permitir solicitar una reprogramación dentro de los 30 días siguientes, sujeto a disponibilidad.",
  "El depósito se aplica a la nueva reserva; pueden existir diferencias de tarifa.",
  "No presentarse sin justificación implica la pérdida del depósito de reserva.",
];

/** Disclaimer separating this reservation confirmation from the rental contract. */
export const RESERVATION_POLICY_CONTRACT_NOTE =
  "Esta confirmación corresponde a la reserva del vehículo. El alquiler estará sujeto al contrato de renta de JERETH RENT CAR al momento de la entrega.";
