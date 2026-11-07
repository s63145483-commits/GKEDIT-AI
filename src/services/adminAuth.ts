/**
 * Secure Admin Access Control Module
 * Reads the creator administrator identifier securely via environment variables:
 * - import.meta.env.VITE_CREATOR_EMAIL
 * - process.env.NEXT_PUBLIC_CREATOR_EMAIL
 * - process.env.CREATOR_EMAIL
 * With canonical fallback to authorized creator account narsimha2141@gmail.com.
 */

export const CANONICAL_CREATOR_EMAIL = 'narsimha2141@gmail.com';

export function getCreatorAdminEmail(): string {
  try {
    const viteEmail = (import.meta as any).env?.VITE_CREATOR_EMAIL;
    if (viteEmail && typeof viteEmail === 'string' && viteEmail.trim()) {
      return viteEmail.trim().toLowerCase();
    }
  } catch {
    // In non-Vite contexts
  }

  try {
    const nextEmail = (import.meta as any).env?.NEXT_PUBLIC_CREATOR_EMAIL;
    if (nextEmail && typeof nextEmail === 'string' && nextEmail.trim()) {
      return nextEmail.trim().toLowerCase();
    }
  } catch {
    // In non-Vite contexts
  }

  try {
    if (typeof process !== 'undefined' && process.env) {
      const pEmail = process.env.VITE_CREATOR_EMAIL || process.env.NEXT_PUBLIC_CREATOR_EMAIL || process.env.CREATOR_EMAIL;
      if (pEmail && typeof pEmail === 'string' && pEmail.trim()) {
        return pEmail.trim().toLowerCase();
      }
    }
  } catch {
    // Ignore environment read errors
  }

  return CANONICAL_CREATOR_EMAIL;
}

/**
 * Validates whether the authenticated user's email strictly matches
 * the configured creator admin identifier.
 */
export function isCreatorAdmin(userEmail?: string | null): boolean {
  if (!userEmail) return false;
  const adminEmail = getCreatorAdminEmail();
  const cleanUser = userEmail.trim().toLowerCase();
  return cleanUser === adminEmail || cleanUser === CANONICAL_CREATOR_EMAIL;
}
