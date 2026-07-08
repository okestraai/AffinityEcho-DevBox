import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Eye,
  UserCheck,
  UserX,
  Bot,
  Activity,
  RefreshCw,
  Globe,
  MonitorSmartphone,
  Link2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  GetVisitorOverview,
  GetVisitorTimeseries,
  GetVisitorReferrers,
  GetVisitorDevices,
  GetVisitorGeo,
  GetVisitorLandingPages,
  type VisitorOverview,
  type VisitorTimeseriesPoint,
  type VisitorReferrers,
  type VisitorDevices,
} from "../../../api/analyticsApis";
import { showToast } from "../../Helper/ShowToast";
import { getApiError } from "../utils/apiError";
import { PERMISSIONS } from "../types/permissions";
import { usePermission } from "../hooks/usePermission";

const RANGES = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function BarList({
  title,
  icon,
  rows,
  labelKey,
  emptyText = "No data yet",
}: {
  title: string;
  icon: React.ReactNode;
  rows: { label: string; sessions: number }[];
  labelKey?: string;
  emptyText?: string;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.sessions), 0) || 1;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-2.5" data-testid={labelKey}>
          {rows.map((r, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700 truncate pr-2">{r.label}</span>
                <span className="text-gray-500 font-medium tabular-nums">{r.sessions}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${(r.sessions / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VisitorAnalyticsPage() {
  const { hasPermission } = usePermission();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<VisitorOverview | null>(null);
  const [series, setSeries] = useState<VisitorTimeseriesPoint[]>([]);
  const [referrers, setReferrers] = useState<VisitorReferrers | null>(null);
  const [devices, setDevices] = useState<VisitorDevices | null>(null);
  const [geo, setGeo] = useState<{ country: string; sessions: number }[]>([]);
  const [landing, setLanding] = useState<{ path: string; sessions: number }[]>([]);

  const canView = hasPermission(PERMISSIONS.ANALYTICS_VIEW);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [o, t, r, d, g, l] = await Promise.all([
        GetVisitorOverview(days),
        GetVisitorTimeseries(days),
        GetVisitorReferrers(days),
        GetVisitorDevices(days),
        GetVisitorGeo(days),
        GetVisitorLandingPages(days),
      ]);
      setOverview(o);
      setSeries(t);
      setReferrers(r);
      setDevices(d);
      setGeo(g);
      setLanding(l);
    } catch (err) {
      showToast(getApiError(err), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  if (!canView) {
    return (
      <div className="p-8 text-center text-gray-500">
        You don&apos;t have permission to view visitor analytics.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Visitor Analytics</h1>
          <p className="text-sm text-gray-500">
            Traffic, acquisition, devices and geography across web &amp; app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setDays(r.value)}
                className={`px-3 py-1.5 text-sm font-medium transition ${
                  days === r.value
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            disabled={refreshing}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-gray-400">
          <Activity className="w-6 h-6 animate-pulse mx-auto mb-2" />
          Loading analytics…
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard icon={<Users className="w-5 h-5 text-indigo-600" />} accent="bg-indigo-50" label="Sessions" value={overview?.totalSessions ?? 0} />
            <StatCard icon={<Eye className="w-5 h-5 text-purple-600" />} accent="bg-purple-50" label="Pageviews" value={overview?.pageviews ?? 0} />
            <StatCard icon={<UserCheck className="w-5 h-5 text-emerald-600" />} accent="bg-emerald-50" label="Logged-in" value={overview?.knownUserSessions ?? 0} />
            <StatCard icon={<UserX className="w-5 h-5 text-sky-600" />} accent="bg-sky-50" label="Anonymous" value={overview?.anonymousSessions ?? 0} />
            <StatCard icon={<Activity className="w-5 h-5 text-amber-600" />} accent="bg-amber-50" label="Pages / session" value={overview?.avgPageviewsPerSession ?? 0} />
            <StatCard icon={<Bot className="w-5 h-5 text-gray-500" />} accent="bg-gray-100" label="Bots" value={overview?.botSessions ?? 0} />
          </div>

          {/* Timeseries */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-gray-800">Visitors &amp; pageviews</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={series} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={2} dot={false} name="Visitors" />
                <Line type="monotone" dataKey="pageviews" stroke="#a855f7" strokeWidth={2} dot={false} name="Pageviews" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Acquisition + device type chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarList
              title="Top referrers"
              icon={<Link2 className="w-4 h-4 text-indigo-600" />}
              rows={(referrers?.sources ?? []).map((s) => ({ label: s.source, sessions: s.sessions }))}
            />
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <MonitorSmartphone className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-gray-800">Device type</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={devices?.deviceType ?? []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* OS / Browser / Geo / Landing */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <BarList title="Operating system" icon={<MonitorSmartphone className="w-4 h-4 text-indigo-600" />} rows={(devices?.os ?? []).map((r) => ({ label: r.name, sessions: r.sessions }))} />
            <BarList title="Browser" icon={<MonitorSmartphone className="w-4 h-4 text-indigo-600" />} rows={(devices?.browser ?? []).map((r) => ({ label: r.name, sessions: r.sessions }))} />
            <BarList title="Top countries" icon={<Globe className="w-4 h-4 text-indigo-600" />} rows={geo.map((r) => ({ label: r.country, sessions: r.sessions }))} />
            <BarList title="Top landing pages" icon={<Link2 className="w-4 h-4 text-indigo-600" />} rows={landing.map((r) => ({ label: r.path, sessions: r.sessions }))} />
          </div>

          {/* UTM campaigns */}
          {referrers?.campaigns && referrers.campaigns.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-gray-800">UTM campaigns</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="py-2 pr-4 font-medium">Source</th>
                      <th className="py-2 pr-4 font-medium">Medium</th>
                      <th className="py-2 pr-4 font-medium">Campaign</th>
                      <th className="py-2 font-medium text-right">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrers.campaigns.map((c, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 pr-4 text-gray-700">{c.utm_source ?? "—"}</td>
                        <td className="py-2 pr-4 text-gray-700">{c.utm_medium ?? "—"}</td>
                        <td className="py-2 pr-4 text-gray-700">{c.utm_campaign ?? "—"}</td>
                        <td className="py-2 text-right tabular-nums text-gray-900 font-medium">{c.sessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
