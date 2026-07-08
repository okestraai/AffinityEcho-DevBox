// VisitorTracker — fires a page_view on every route change (anonymous or
// authed). Fail-silent by construction: it renders nothing, never throws, and
// swallows all errors so it can never affect navigation or the app.
//
// - Respects Do-Not-Track.
// - Session id lives in sessionStorage (one session per tab session).
// - Landing page / referrer / UTM are captured once at session start.
// - The /admin panel is excluded so admin usage doesn't pollute visitor metrics.
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { TrackVisitor, type VisitorContext } from "../../api/analyticsApis";

const SID_KEY = "ae_va_sid";
const CTX_KEY = "ae_va_ctx";

function dntEnabled(): boolean {
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

function getSid(): string | null {
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

function getSessionContext(): VisitorContext {
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

export function VisitorTracker() {
  const location = useLocation();
  const enabled = useRef(!dntEnabled());

  useEffect(() => {
    if (!enabled.current) return;
    try {
      const path = location.pathname;
      // Admin panel usage is not visitor traffic.
      if (path.startsWith("/admin")) return;
      const sid = getSid();
      if (!sid) return;
      TrackVisitor({
        sid,
        context: getSessionContext(),
        events: [
          {
            type: "page_view",
            path, // pathname only — no query string
            referrer: document.referrer || undefined,
          },
        ],
      });
    } catch {
      /* never let tracking affect the app */
    }
  }, [location.pathname, location.search]);

  return null;
}
