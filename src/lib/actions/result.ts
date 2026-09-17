/**
 * Standard return shape for server actions so client forms can render
 * field errors and general messages consistently.
 */
export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };
