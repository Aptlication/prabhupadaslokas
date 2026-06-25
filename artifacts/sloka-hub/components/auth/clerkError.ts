/**
 * Turn a thrown Clerk error into a single human-readable string. Clerk throws
 * objects shaped like `{ errors: [{ longMessage, message }] }`; fall back to a
 * generic message for anything else.
 */
export function clerkErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const arr = (err as { errors?: Array<{ longMessage?: string; message?: string }> })
      .errors;
    const first = arr?.[0];
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}
