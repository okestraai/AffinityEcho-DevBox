/**
 * Resolves a display name, skipping "Anonymous User" values.
 * Pass names in priority order — the first valid, non-anonymous value wins.
 *
 * Usage:
 *   resolveDisplayName(user.displayName, user.display_name, user.username)
 *   resolveDisplayName(profile.display_name, profile.username, "Unknown User")
 */
export function resolveDisplayName(
  ...names: (string | undefined | null)[]
): string {
  for (const name of names) {
    if (name && name !== "Anonymous User") return name;
  }
  return "Anonymous";
}

/** Heuristic: encrypted/hashed strings are long and lack spaces or common name chars */
function looksEncrypted(s: string): boolean {
  if (s.length > 60) return true;
  // Base64-ish or hex-ish with no spaces
  if (/^[A-Za-z0-9+/=]{30,}$/.test(s)) return true;
  if (/^[0-9a-f]{24,}$/i.test(s)) return true;
  return false;
}

/**
 * Resolves the displayed author name.
 * - If the content belongs to the current user, show their real full name
 *   (skipping values that look encrypted).
 * - Otherwise, show the display_name / username the API returned (respects identity reveal).
 */
export function resolveAuthorName(
  currentUser: { id: string; first_name?: string; last_name?: string; username: string } | null | undefined,
  authorUserId: string | undefined,
  ...fallbackNames: (string | undefined | null)[]
): string {
  if (currentUser && authorUserId && currentUser.id === authorUserId) {
    // Try full name, but skip encrypted-looking values
    const parts = [currentUser.first_name, currentUser.last_name]
      .filter((n): n is string => !!n && !looksEncrypted(n));
    const fullName = parts.join(" ");
    if (fullName) return fullName;
    // Try fallback names from API (already decrypted by backend)
    const apiFallback = resolveDisplayName(...fallbackNames);
    if (apiFallback !== "Anonymous") return apiFallback;
    // Last resort
    if (currentUser.username && !looksEncrypted(currentUser.username)) return currentUser.username;
    return "You";
  }
  return resolveDisplayName(...fallbackNames);
}
