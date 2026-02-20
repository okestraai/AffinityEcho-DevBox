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
