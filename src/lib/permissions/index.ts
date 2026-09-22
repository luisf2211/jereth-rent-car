/**
 * RBAC: permissions grouped by module.
 *
 * Each admin module has a set of permissions. The ".view" permission gates
 * access to the module (sidebar + page); the others gate specific actions.
 * Server actions enforce these; the UI hides/blocks accordingly.
 */

export const PERMISSIONS = [
  "users.view",
  "users.create",
  "users.edit",
  "users.disable",
  "roles.view",
  "roles.manage",
  "branding.view",
  "branding.edit",
  "vehicles.view",
  "vehicles.create",
  "vehicles.edit",
  "vehicles.disable",
  "content.view",
  "content.edit",
  "delivery.view",
  "delivery.edit",
  "reservations.view",
  "reservations.edit",
  "reservations.settings",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roleName?: string;
  permissions: Permission[];
}

/** A single permission with a human label. */
export interface PermissionDef {
  key: Permission;
  label: string;
}

/** A module groups permissions and maps to an admin route. */
export interface PermissionModule {
  key: string;
  label: string;
  /** Route this module lives at (for sidebar/access gating). */
  href: string;
  /** The permission that grants access to the module itself. */
  viewPermission: Permission;
  permissions: PermissionDef[];
}

/**
 * The catalog that drives the roles UI, the sidebar and page access.
 * Add new modules/permissions here in one place.
 */
export const PERMISSION_MODULES: PermissionModule[] = [
  {
    key: "vehicles",
    label: "Vehículos",
    href: "/admin/vehicles",
    viewPermission: "vehicles.view",
    permissions: [
      { key: "vehicles.view", label: "Ver vehículos" },
      { key: "vehicles.create", label: "Crear vehículos" },
      { key: "vehicles.edit", label: "Editar vehículos" },
      { key: "vehicles.disable", label: "Publicar / ocultar vehículos" },
    ],
  },
  {
    key: "content",
    label: "Contenido",
    href: "/admin/content",
    viewPermission: "content.view",
    permissions: [
      { key: "content.view", label: "Ver contenido" },
      { key: "content.edit", label: "Editar contenido (requisitos, FAQ, reseñas, políticas)" },
    ],
  },
  {
    key: "delivery",
    label: "Lugares de entrega",
    href: "/admin/delivery",
    viewPermission: "delivery.view",
    permissions: [
      { key: "delivery.view", label: "Ver lugares de entrega" },
      { key: "delivery.edit", label: "Editar lugares de entrega" },
    ],
  },
  {
    key: "reservations",
    label: "Reservas",
    href: "/admin/reservations",
    viewPermission: "reservations.view",
    permissions: [
      { key: "reservations.view", label: "Ver reservas" },
      { key: "reservations.edit", label: "Crear enlaces y gestionar reservas" },
      { key: "reservations.settings", label: "Configurar reservas (métodos de pago, switch)" },
    ],
  },
  {
    key: "users",
    label: "Usuarios",
    href: "/admin/users",
    viewPermission: "users.view",
    permissions: [
      { key: "users.view", label: "Ver usuarios" },
      { key: "users.create", label: "Crear usuarios" },
      { key: "users.edit", label: "Editar usuarios" },
      { key: "users.disable", label: "Activar / desactivar usuarios" },
    ],
  },
  {
    key: "roles",
    label: "Roles",
    href: "/admin/roles",
    viewPermission: "roles.view",
    permissions: [
      { key: "roles.view", label: "Ver roles" },
      { key: "roles.manage", label: "Crear, editar y eliminar roles" },
    ],
  },
  {
    key: "branding",
    label: "Branding",
    href: "/admin/settings/branding",
    viewPermission: "branding.view",
    permissions: [
      { key: "branding.view", label: "Ver branding" },
      { key: "branding.edit", label: "Editar branding" },
    ],
  },
];

/** All permission keys as a flat set (for validation). */
export const ALL_PERMISSION_KEYS: Permission[] = PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.key)
);

/** Returns true when the user has the given permission. */
export function hasPermission(
  user: Pick<AuthUser, "permissions"> | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

/** Returns true when the user has ANY of the given permissions. */
export function hasAnyPermission(
  user: Pick<AuthUser, "permissions"> | null | undefined,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  return permissions.some((p) => user.permissions.includes(p));
}

/** Whether the user can access (open) a module — needs its view permission. */
export function canAccessModule(
  user: Pick<AuthUser, "permissions"> | null | undefined,
  moduleKey: string
): boolean {
  const mod = PERMISSION_MODULES.find((m) => m.key === moduleKey);
  if (!mod) return false;
  return hasPermission(user, mod.viewPermission);
}

/** Whether the user can access a given admin route (by matching a module). */
export function canAccessRoute(
  user: Pick<AuthUser, "permissions"> | null | undefined,
  pathname: string
): boolean {
  // Dashboard root is always allowed for any authenticated admin user.
  if (pathname === "/admin") return true;
  const mod = PERMISSION_MODULES.find(
    (m) => pathname === m.href || pathname.startsWith(`${m.href}/`)
  );
  // Routes not tied to a module (none currently) default to allowed.
  if (!mod) return true;
  return hasPermission(user, mod.viewPermission);
}
