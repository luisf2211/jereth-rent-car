/**
 * View model for a user in the backoffice list/forms.
 * Never includes passwordHash.
 */
export interface UserListItem {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  roleId: string;
  roleName: string;
  createdAt: string; // ISO string, safe to pass to client components
}

export interface RoleOption {
  id: string;
  name: string;
}
