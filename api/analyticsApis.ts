// api/analyticsApis.ts — Visitor analytics.
// Public ingest + admin-only read endpoints.
import axios from "axios";
import { getAuthInstance, API_URL, unwrap } from "./base";
import { TokenUtils } from "../src/utils/tokenUtils";

// ─── Ingest (public) ─────────────────────────────────────────────────────────

export interface VisitorEvent {
  type: "page_view" | "screen_view" | "app_open" | "custom";
  path?: string;
  name?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}

export interface VisitorContext {
  platform: "web";
  referrer?: string;
  landing_path?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  locale?: string;
  timezone?: string;
}

export interface CollectPayload {
  sid: string;
  events: VisitorEvent[];
  context: VisitorContext;
}

// Fire-and-forget. Uses a BARE axios call (not getAuthInstance) on purpose: the
// shared interceptor force-logs-the-user-out on an unrecoverable 401, and a
// background beacon must never be able to trigger that. We attach the Bearer
// token manually when present (so the backend can attribute the session to the
// user), and withCredentials lets axios auto-send the X-XSRF-TOKEN header.
// Never throws — a tracking failure must never surface to the user.
export const TrackVisitor = (payload: CollectPayload): void => {
  try {
    const token = TokenUtils.getAccessToken();
    void axios
      .post(`${API_URL}/analytics/collect`, payload, {
        withCredentials: true,
        timeout: 8000,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .catch(() => {});
  } catch {
    /* ignore */
  }
};

// ─── Admin reads ───────────────────────────────────────────────────────────

const BASE = `${API_URL}/admin/visitor-analytics`;
const qs = (days: number) => `?days=${days}`;

export interface VisitorOverview {
  rangeDays: number;
  totalSessions: number;
  pageviews: number;
  totalEvents: number;
  uniqueUsers: number;
  knownUserSessions: number;
  anonymousSessions: number;
  botSessions: number;
  avgPageviewsPerSession: number;
  byPlatform: { platform: string; sessions: number }[];
}

export const GetVisitorOverview = async (days = 30): Promise<VisitorOverview> => {
  const res = await getAuthInstance().get(`${BASE}/overview${qs(days)}`);
  return unwrap(res);
};

export interface VisitorTimeseriesPoint {
  date: string;
  visitors: number;
  pageviews: number;
}

export const GetVisitorTimeseries = async (
  days = 30,
): Promise<VisitorTimeseriesPoint[]> => {
  const res = await getAuthInstance().get(`${BASE}/timeseries${qs(days)}`);
  return unwrap(res);
};

export interface VisitorReferrers {
  sources: { source: string; sessions: number }[];
  campaigns: {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    sessions: number;
  }[];
}

export const GetVisitorReferrers = async (days = 30): Promise<VisitorReferrers> => {
  const res = await getAuthInstance().get(`${BASE}/referrers${qs(days)}`);
  return unwrap(res);
};

export interface VisitorDevices {
  deviceType: { name: string; sessions: number }[];
  os: { name: string; sessions: number }[];
  browser: { name: string; sessions: number }[];
}

export const GetVisitorDevices = async (days = 30): Promise<VisitorDevices> => {
  const res = await getAuthInstance().get(`${BASE}/devices${qs(days)}`);
  return unwrap(res);
};

export const GetVisitorGeo = async (
  days = 30,
): Promise<{ country: string; sessions: number }[]> => {
  const res = await getAuthInstance().get(`${BASE}/geo${qs(days)}`);
  return unwrap(res);
};

export const GetVisitorLandingPages = async (
  days = 30,
): Promise<{ path: string; sessions: number }[]> => {
  const res = await getAuthInstance().get(`${BASE}/landing-pages${qs(days)}`);
  return unwrap(res);
};
