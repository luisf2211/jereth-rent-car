import { z } from "zod";
import { ALL_PERMISSION_KEYS } from "@/lib/permissions";

export const roleSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(60),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  permissions: z
    .array(z.enum(ALL_PERMISSION_KEYS as [string, ...string[]]))
    .default([]),
});

export type RoleInput = z.infer<typeof roleSchema>;
