import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldOff,
  Clock,
  Activity,
  Wrench,
} from 'lucide-react';
import { GetAdminHealth, GetAdminHealthHistory } from '../../../api/adminApis';
import { showToast } from '../../Helper/ShowToast';
import { MSG } from '../../constants/messages';
import { getApiError } from '../utils/apiError';
import { HealthSkeleton } from '../components';
import { PERMISSIONS } from '../types/permissions';
import { usePermission } from '../hooks/usePermission';
import type { HealthData, HealthHistoryData, HealthStatus } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ');
}

function formatModuleName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<
  HealthStatus,
  { bg: string; icon: React.ReactNode; text: string; textColor: string; dot: string }
> = {
  up: {
    bg: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
    icon: <CheckCircle className="w-6 h-6 text-green-600" />,
    text: 'All Systems Operational',
    textColor: 'text-green-800',
    dot: 'bg-green-500',
  },
  degraded: {
    bg: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200',
    icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    text: 'Degraded Performance',
    textColor: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  down: {
    bg: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200',
    icon: <XCircle className="w-6 h-6 text-red-600" />,
    text: 'System Outage',
    textColor: 'text-red-800',
    dot: 'bg-red-500',
  },
};

// ── Component ────────────────────────────────────────────────────────────────

export function HealthPage() {
  const { hasPermission } = usePermission();

  const [health, setHealth] = useState<HealthData | null>(null);
  const [history, setHistory] = useState<HealthHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchHealth = useCallback(async () => {
    try {
      const res = await GetAdminHealth();
      setHealth(res?.data ?? res);
    } catch (err) {
      showToast(getApiError(err, MSG.ADMIN.HEALTH_LOAD_FAILED), 'error');
    }
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [healthRes, historyRes] = await Promise.all([
        GetAdminHealth(),
        GetAdminHealthHistory(),
      ]);
      setHealth(healthRes?.data ?? healthRes);
      setHistory(historyRes?.data ?? historyRes);
    } catch (err) {
      showToast(getApiError(err, MSG.ADMIN.HEALTH_LOAD_FAILED), 'error');
    }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    })();
  }, [fetchAll]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchHealth();
      }, 60000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchHealth]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  // ── Permission guard ───────────────────────────────────────────────────────

  if (!hasPermission(PERMISSIONS.HEALTH_VIEW)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShieldOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            You don&apos;t have permission to view system health
          </p>
        </div>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) return <HealthSkeleton />;

  // ── Derived data ───────────────────────────────────────────────────────────

  const modules = health?.modules ?? {};
  const moduleNames = Object.keys(modules);
  const currentStatus = statusConfig[health?.status ?? 'down'];

  // Sorted uptime entries (worst first)
  const uptimeEntries = history?.uptime
    ? Object.entries(history.uptime).sort(
        (a, b) => parseFloat(a[1]) - parseFloat(b[1]),
      )
    : [];

  const historyModules = history?.history ? Object.keys(history.history) : [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            System Health
          </h1>
          {health?.timestamp && (
            <p className="text-sm text-gray-500 mt-1">
              Last checked {formatRelative(health.timestamp)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
            aria-label="Toggle auto-refresh"
          >
            {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
          </button>

          {/* Manual refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            aria-label="Refresh health data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      {health && (
        <div
          className={`rounded-xl border p-4 sm:p-5 flex items-center gap-4 ${currentStatus.bg}`}
        >
          {currentStatus.icon}
          <div className="flex-1">
            <p className={`font-semibold ${currentStatus.textColor}`}>
              {currentStatus.text}
            </p>
            <p className={`text-sm ${currentStatus.textColor} opacity-75`}>
              Uptime: {formatUptime(health.uptime_seconds)}
            </p>
          </div>
          <span className={`w-3 h-3 rounded-full ${currentStatus.dot}`} />
        </div>
      )}

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {moduleNames.map((name) => {
          const mod = modules[name];
          const dotColor =
            mod.status === 'up'
              ? 'bg-green-500'
              : mod.status === 'degraded'
                ? 'bg-amber-500'
                : 'bg-red-500';

          const latencyColor =
            mod.latency_ms !== null && mod.latency_ms < 50
              ? 'text-green-600'
              : mod.latency_ms !== null && mod.latency_ms <= 200
                ? 'text-amber-600'
                : 'text-red-600';

          const moduleUptime = history?.uptime?.[name];
          const uptimeNum = moduleUptime ? parseFloat(moduleUptime) : null;
          const uptimeBarColor =
            uptimeNum !== null
              ? uptimeNum > 99
                ? 'bg-green-500'
                : uptimeNum > 95
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              : 'bg-gray-300';

          return (
            <div
              key={name}
              className="bg-white rounded-xl shadow-lg p-4 sm:p-5 border border-gray-100/80 hover:shadow-xl transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-800">
                  {formatModuleName(name)}
                </span>
                <span
                  className={`w-3 h-3 rounded-full ${dotColor} ${
                    mod.status !== 'up' ? 'animate-pulse' : ''
                  }`}
                />
              </div>

              {/* Latency */}
              <p className={`text-sm font-medium ${latencyColor}`}>
                {mod.latency_ms !== null ? `${mod.latency_ms}ms` : 'N/A'}
              </p>

              {/* Error */}
              {mod.error && (
                <div className="text-red-600 text-xs font-medium bg-red-50 rounded-lg p-2 mt-2">
                  {mod.error}
                </div>
              )}

              {/* Resolution guidance */}
              {mod.resolution && (
                <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                  <p className="text-[10px] sm:text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    Resolution
                  </p>
                  <p className="text-[10px] sm:text-xs text-amber-600 leading-relaxed">
                    {mod.resolution}
                  </p>
                </div>
              )}

              {/* Uptime bar */}
              {uptimeNum !== null && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Uptime</span>
                    <span className="font-medium">{moduleUptime}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className={`${uptimeBarColor} rounded-full h-2 transition-all`}
                      style={{ width: `${Math.min(uptimeNum, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 24h Uptime Summary */}
      {uptimeEntries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-800">24h Uptime</h2>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
            <div className="space-y-3">
              {uptimeEntries.map(([name, pct]) => {
                const num = parseFloat(pct);
                const barColor =
                  num > 99
                    ? 'bg-green-500'
                    : num > 95
                      ? 'bg-amber-500'
                      : 'bg-red-500';

                return (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-32 sm:w-40 truncate font-medium">
                      {formatModuleName(name)}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`${barColor} rounded-full h-2 transition-all`}
                        style={{ width: `${Math.min(num, 100)}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium w-14 text-right ${
                        num > 99
                          ? 'text-green-600'
                          : num > 95
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}
                    >
                      {pct}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Health History Timeline */}
      {historyModules.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-800">
              Health Timeline &mdash; Last 24h
            </h2>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80 overflow-x-auto">
            <div className="space-y-3 min-w-[500px]">
              {historyModules.map((name) => {
                const entries = history!.history[name];
                if (!entries || entries.length === 0) return null;

                return (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-32 sm:w-40 truncate font-medium shrink-0">
                      {formatModuleName(name)}
                    </span>
                    <div className="flex-1 flex gap-px rounded overflow-hidden">
                      {entries.map((entry, i) => {
                        const segColor =
                          entry.status === 'up'
                            ? 'bg-green-500'
                            : entry.status === 'degraded'
                              ? 'bg-amber-500'
                              : 'bg-red-500';
                        return (
                          <div
                            key={i}
                            className={`${segColor} h-3 flex-1`}
                            title={`${formatTime(entry.checked_at)} — ${entry.status}${
                              entry.latency_ms !== null ? ` (${entry.latency_ms}ms)` : ''
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* X-axis time labels */}
              {(() => {
                const firstModule = historyModules[0];
                const entries = history!.history[firstModule];
                if (!entries || entries.length === 0) return null;

                const first = entries[0];
                const last = entries[entries.length - 1];
                const mid = entries[Math.floor(entries.length / 2)];

                return (
                  <div className="flex items-center gap-3">
                    <span className="w-32 sm:w-40 shrink-0" />
                    <div className="flex-1 flex justify-between text-xs text-gray-400">
                      <span>{formatTime(first.checked_at)}</span>
                      <span>{formatTime(mid.checked_at)}</span>
                      <span>{formatTime(last.checked_at)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
