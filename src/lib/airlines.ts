/**
 * Airlines for the reservation form's searchable airline selector.
 *
 * Focused on the main carriers that operate flights to the Dominican Republic
 * (SDQ, PUJ, STI, POP, LRM, AZS), plus a catch-all "Otra aerolínea" so the
 * system never depends on a closed list. We store the airline NAME as the
 * value — no admin table needed. The Autocomplete filters by substring.
 */
export const OTHER_AIRLINE = "Otra aerolínea";

export const AIRLINES: string[] = [
  "Aeroméxico",
  "Air Canada",
  "Air Century",
  "Air Europa",
  "Air France",
  "Air Transat",
  "American Airlines",
  "Arajet",
  "Avianca",
  "Azul",
  "British Airways",
  "Copa Airlines",
  "Delta Air Lines",
  "Edelweiss Air",
  "Frontier Airlines",
  "Iberia",
  "JetBlue",
  "KLM",
  "LATAM",
  "Lufthansa",
  "Sky High (SKYcana)",
  "Southwest Airlines",
  "Spirit Airlines",
  "Sunwing Airlines",
  "Sun Country Airlines",
  "TUI fly",
  "United Airlines",
  "WestJet",
  "Wingo",
  "World2Fly",
  // Catch-all so the list is never a hard constraint.
  OTHER_AIRLINE,
];
