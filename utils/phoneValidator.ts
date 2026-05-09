/**
 * Lightweight phone validation. We don't ship libphonenumber on mobile (cost),
 * so we apply two layered checks: digits-only length, plus an optional E.164-ish
 * shape if the user typed a leading "+".
 *
 * Accepts: "0912345678", "+249912345678", "00249 912 345 678", "(091) 234-5678".
 * Rejects: anything < 7 or > 15 digits, anything with letters.
 */
export function normalizePhone(input: string | null | undefined): string {
  return String(input ?? "").trim();
}

export function digitsOnly(input: string | null | undefined): string {
  return normalizePhone(input).replace(/[^\d]/g, "");
}

export function isValidPhone(input: string | null | undefined): boolean {
  const raw = normalizePhone(input);
  if (!raw) return false;

  // Reject letters explicitly (some Android keyboards still let them through).
  if (/[A-Za-z]/.test(raw)) return false;

  // Allow only digits, spaces, +, -, parentheses.
  if (!/^[\d+\-()\s]+$/.test(raw)) return false;

  const digits = digitsOnly(raw);

  // E.164 max 15. Most local plans 7+ digits.
  if (digits.length < 7 || digits.length > 15) return false;

  return true;
}
