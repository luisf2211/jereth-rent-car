import { z } from "zod";

/**
 * User validation schemas shared by the client form (React Hook Form) and
 * the server actions. Never trust the client: server actions re-validate.
 */

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(100),
  roleId: z.string().min(1, "Selecciona un rol"),
  isActive: z.boolean(),
});

/**
 * On update the password is optional (empty = keep current).
 */
export const userUpdateSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z
    .string()
    .max(100)
    .optional()
    .refine((v) => !v || v.length >= 8, "Mínimo 8 caracteres"),
  roleId: z.string().min(1, "Selecciona un rol"),
  isActive: z.boolean(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
