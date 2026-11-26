// Visitor session id, first-visit context and named steps, shared by the page-view tracker and event screens.
import { TrackVisitor, type VisitorContext } from "../../api/analyticsApis";

const SID_KEY = "ae_va_sid";
const CTX_KEY = "ae_va_ctx";

export function dntEnabled(): boolean {
  try {
    const n = navigator as unknown as { doNotTrack?: string; msDoNotTrack?: string };
    const w = window as unknown as { doNotTrack?: string };
    return (
      n.doNotTrack === "1" ||
      n.doNotTrack === "yes" ||
      w.doNotTrack === "1" ||
      n.msDoNotTrack === "1"
    );
  } catch {
    return false;
  }
}

export function getSid(): string | null {
  try {
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return null;
  }
}

export function getSessionContext(): VisitorContext {
  try {
    const cached = sessionStorage.getItem(CTX_KEY);
    if (cached) return JSON.parse(cached) as VisitorContext;
    const p = new URLSearchParams(window.location.search);
    const ctx: VisitorContext = {
      platform: "web",
      referrer: document.referrer || undefined,
      // Path only — never the query string (it can carry tokens/PII). UTM is
      // captured separately below.
      landing_path: window.location.pathname,
      utm: {
        source: p.get("utm_source") || undefined,
        medium: p.get("utm_medium") || undefined,
        campaign: p.get("utm_campaign") || undefined,
        term: p.get("utm_term") || undefined,
        content: p.get("utm_content") || undefined,
      },
      locale: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    sessionStorage.setItem(CTX_KEY, JSON.stringify(ctx));
    return ctx;
  } catch {
    return { platform: "web" };
  }
}

// One named step (e.g. "event_onboarding_started") with the same session and privacy rules as page views.
export function trackCustomEvent(name: string, metadata?: Record<string, string | number | boolean>): void {
  try {
    if (dntEnabled()) return;
    const sid = getSid();
    if (!sid) return;
    TrackVisitor({
      sid,
      context: getSessionContext(),
      events: [{ type: "custom", name, path: window.location.pathname, metadata }],
    });
  } catch {
    /* never let tracking affect the app */
  }
}

