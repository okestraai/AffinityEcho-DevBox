import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Search, Clock, Shield, Bell, MessageSquare,
  CheckCircle, EyeOff, Loader2, Download,
  ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react';
import { GetAdminLogs, ExportLogs } from '../../../api/adminApis';
import { showToast } from '../../Helper/ShowToast';
import { ExportModal, ExportSuccessModal, TableRowSkeleton } from '../components';
import { useExport } from '../hooks/useExport';

interface AuditLog {
  id: string;
  admin: { id: string; username: string; avatar?: string } | string;
  admin_username?: string;
  action: string; target_type: string; target_id: string;
  reason: string; created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  suspend: 'bg-red-100 text-red-600', delete: 'bg-red-100 text-red-600', ban: 'bg-red-100 text-red-600',
  resolve: 'bg-green-100 text-green-600', unsuspend: 'bg-green-100 text-green-600', create: 'bg-green-100 text-green-600',
  hide: 'bg-orange-100 text-orange-600', decline: 'bg-orange-100 text-orange-600',
  broadcast: 'bg-purple-100 text-purple-600', notify: 'bg-purple-100 text-purple-600',
  role: 'bg-blue-100 text-blue-600', forum: 'bg-blue-100 text-blue-600',
};
const TARGET_COLORS: Record<string, string> = {
  user: 'bg-blue-50 text-blue-700 border-blue-200', post: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  comment: 'bg-purple-50 text-purple-700 border-purple-200', report: 'bg-orange-50 text-orange-700 border-orange-200',
  forum: 'bg-green-50 text-green-700 border-green-200', nook: 'bg-pink-50 text-pink-700 border-pink-200',
  notification: 'bg-yellow-50 text-yellow-700 border-yellow-200', forum_topic: 'bg-teal-50 text-teal-700 border-teal-200',
};

function getActionColor(a: string) { for (const k of Object.keys(ACTION_COLORS)) { if (a.includes(k)) return ACTION_COLORS[k]; } return 'bg-gray-100 text-gray-600'; }
function getActionIcon(a: string) {
  const cls = 'w-4 h-4';
  if (a.includes('suspend') || a.includes('delete') || a.includes('ban')) return <Shield className={cls} />;
  if (a.includes('resolve') || a.includes('unsuspend') || a.includes('create')) return <CheckCircle className={cls} />;
  if (a.includes('hide')) return <EyeOff className={cls} />;
  if (a.includes('forum') || a.includes('nook')) return <MessageSquare className={cls} />;
  if (a.includes('broadcast') || a.includes('notify')) return <Bell className={cls} />;
  return <FileText className={cls} />;
}
function formatActionLabel(a: string) { return a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function formatDate(s: string) { return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function formatRelative(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now'; if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function adminName(log: AuditLog) { return typeof log.admin === 'object' && log.admin ? log.admin.username : (log.admin_username ?? String(log.admin ?? '')); }
function adminInitial(log: AuditLog) { return adminName(log)[0]?.toUpperCase() ?? 'A'; }

const PAGE_SIZE = 20;
const TARGET_TYPES = ['user', 'report', 'forum', 'nook', 'notification', 'forum_topic', 'post', 'comment'];

export function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);
  const { exporting, showSuccess: showExportSuccess, downloadUrl: exportUrl, exportedFormat, doExport, closeSuccess } = useExport(
    (format) => ExportLogs({ format, search: search || undefined, targetType: targetFilter || undefined })
  );

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GetAdminLogs({ page, limit: PAGE_SIZE, search: search || undefined, targetType: targetFilter || undefined });
      setLogs(res?.data ?? []);
      setTotal(res?.meta?.total ?? 0);
      setTotalPages(res?.meta?.total_pages ?? 1);
    } catch {
      showToast('Failed to load logs', 'error');
    } finally { setLoading(false); }
  }, [page, search, targetFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const start = logs.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  const hasFilters = !!(targetFilter || search);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-5 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={doExport} hasFilters={hasFilters} title="Export Audit Logs" />
      <ExportSuccessModal isOpen={showExportSuccess} onClose={closeSuccess} format={exportedFormat} downloadUrl={exportUrl} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Audit Logs</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span className="w-1 h-1 bg-purple-600 rounded-full" />
            {total.toLocaleString()} total entries
          </p>
        </div>
        <button type="button" onClick={() => setShowExportModal(true)} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span className="hidden sm:inline">Export Logs</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100/80">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by admin, action, or reason..." className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 transition-all" />
          </div>
          <div className="relative">
            <select value={targetFilter} onChange={e => { setTargetFilter(e.target.value); setPage(1); }} title="Filter by target type" className="appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 min-w-[150px]">
              <option value="">All Targets</option>
              {TARGET_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                {['Action', 'Admin', 'Target', 'Reason', 'Time'].map(h => (
                  <th key={h} className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(8)].map((_, i) => <TableRowSkeleton key={i} columns={5} />)
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No logs match the current filters.</p>
                </td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(log.action)}`}>{getActionIcon(log.action)}</div>
                      <span className="text-sm font-medium text-gray-900">{formatActionLabel(log.action)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{adminInitial(log)}</div>
                      <span className="text-sm text-gray-700">{adminName(log)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${TARGET_COLORS[log.target_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{log.target_type?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3.5 max-w-xs"><p className="text-sm text-gray-500 truncate">{log.reason}</p></td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-600 flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelative(log.created_at)}</span>
                      <span className="text-xs text-gray-400 mt-0.5">{formatDate(log.created_at)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-700">{start}–{end}</span> of <span className="font-semibold text-gray-700">{total.toLocaleString()}</span> logs
          </p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-md">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="px-4 py-2 text-sm font-semibold text-gray-700 bg-purple-50 rounded-xl">Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-md">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
