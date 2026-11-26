// Where a member who joined through an event goes back to after onboarding.
const KEY = "ae.returnTo";

// Only event pages are remembered, so a stored value can't send someone elsewhere.
const allowed = (path: string) => /^\/events(\/[A-Za-z0-9_-]+){0,2}$/.test(path);

export function rememberReturnTo(path: string) {
  if (!allowed(path)) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Private mode or blocked storage: they land on the dashboard instead.
  }
}

export function takeReturnTo(): string | null {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return path && allowed(path) ? path : null;
  } catch {
    return null;
  }
}
