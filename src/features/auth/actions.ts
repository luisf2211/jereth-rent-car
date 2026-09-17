"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import type { ActionResult } from "@/lib/actions/result";

/**
 * Signs the user in with credentials. Returns an ActionResult so the client
 * form can show an inline error. On success the client redirects.
 */
export async function loginAction(email: string, password: string): Promise<ActionResult> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Email o contraseña incorrectos." };
    }
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
