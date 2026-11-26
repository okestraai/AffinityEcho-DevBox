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
import { TrackVisitor } from "../../api/analyticsApis";
import { dntEnabled, getSessionContext, getSid } from "../utils/visitorTracking";

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
