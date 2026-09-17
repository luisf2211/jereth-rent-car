/** Shared public navigation links (used by header and footer). */
export interface NavLink {
  label: string;
  href: string;
}

export const PUBLIC_NAV_LINKS: NavLink[] = [
  { label: "Inicio", href: "/" },
  { label: "Vehículos", href: "/vehicles" },
  { label: "Nosotros", href: "/#nosotros" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contacto", href: "/#contacto" },
];
