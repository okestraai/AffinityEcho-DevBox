const ANDROID_PACKAGE = 'com.okestra.affinityecho';
const WEB_HOST = 'app.affinityecho.com';

export const STORE_LINKS = {
  ios: 'https://apps.apple.com/app/id6762884859',
  android: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
} as const;

export type Platform = 'ios' | 'android' | 'other';

export function platformOf(
  userAgent = navigator.userAgent,
  touchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0,
): Platform {
  if (/Android/i.test(userAgent)) return 'android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  // iPadOS reports itself as a Mac; a touch screen gives it away.
  if (/Macintosh/i.test(userAgent) && touchPoints > 1) return 'ios';
  return 'other';
}

export function storeLinkFor(platform: Platform): string | null {
  return platform === 'other' ? null : STORE_LINKS[platform];
}

// An Android link that opens a shared path in the app; Chrome sends people without it to Google Play.
export function androidOpenPathUrl(path: string, userAgent = navigator.userAgent): string | null {
  if (platformOf(userAgent, 0) !== 'android' || !path.startsWith('/')) return null;
  return `intent://${WEB_HOST}${path}#Intent;scheme=https;package=${ANDROID_PACKAGE};end`;
}

// The shared link a visitor arrived on, kept for this tab so the site can offer the app.
const ARRIVED_KEY = 'arrived_from_app_link';
const SHARED_PATH = /^\/(feeds|forums|nooks)\/[A-Za-z0-9_-]+$/;

export function rememberAppLinkArrival(path: string): void {
  try {
    if (SHARED_PATH.test(path)) sessionStorage.setItem(ARRIVED_KEY, path);
  } catch {
    // Storage can be blocked; the prompt is optional.
  }
}

export function appLinkArrival(): string | null {
  try {
    return sessionStorage.getItem(ARRIVED_KEY);
  } catch {
    return null;
  }
}

export function forgetAppLinkArrival(): void {
  try {
    sessionStorage.removeItem(ARRIVED_KEY);
  } catch {
    // Nothing to clear.
  }
}
