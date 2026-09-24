/** Shared public navigation links (used by header and footer). */
export interface NavLink {
  /** Dictionary key (nav.*) resolved at render time via the active locale. */
  labelKey: string;
  href: string;
}

export const PUBLIC_NAV_LINKS: NavLink[] = [
  { labelKey: "nav.home", href: "/" },
  { labelKey: "nav.vehicles", href: "/vehicles" },
  { labelKey: "nav.about", href: "/#nosotros" },
  { labelKey: "nav.faq", href: "/#faq" },
  { labelKey: "nav.contact", href: "/#contacto" },
];
