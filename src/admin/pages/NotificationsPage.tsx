import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, Send, Users, User, Plus, Trash2, Clock, CheckCircle,
  AlertCircle, ChevronLeft, ChevronRight, Loader2, X, Calendar,
  Download,
} from 'lucide-react';
import {
  GetAdminNotifications, CreateAdminNotification,
  SendAdminNotification, DeleteAdminNotification, ExportNotifications,
} from '../../../api/adminApis';
import { showToast } from '../../Helper/ShowToast';
import { MSG } from '../../constants/messages';
import { ExportModal, ExportSuccessModal, ConfirmModal } from '../components';
import { getApiError } from '../utils/apiError';
import { useExport } from '../hooks/useExport';

type NotifType = 'system' | 'alert' | 'announcement' | 'maintenance';
type NotifAudience = 'all' | 'admins' | 'moderators' | 'users';
type NotifStatus = 'sent' | 'scheduled' | 'draft';

interface NotifCreator { id: string; username: string; }
interface Notification {
  id: string; title: string; message: string;
  type: NotifType; audience: NotifAudience;
  status: NotifStatus;
  action?: string; action_url?: string | null;
  scheduled_at?: string | null;
  creator?: NotifCreator | null;
  reach?: number; created_at: string;
}

interface NotifSummary { sent: number; scheduled: number; draft: number; total_reach: number; }

const PAGE_SIZE = 15;

const TYPE_STYLES: Record<NotifType, string> = {
  system: 'bg-blue-50 text-blue-700 border border-blue-200',
  alert: 'bg-red-50 text-red-700 border border-red-200',
  announcement: 'bg-purple-50 text-purple-700 border border-purple-200',
  maintenance: 'bg-orange-50 text-orange-700 border border-orange-200',
};

const STATUS_STYLES: Record<NotifStatus, string> = {
  sent: 'bg-green-50 text-green-700 border border-green-200',
  scheduled: 'bg-blue-50 text-blue-700 border border-blue-200',
  draft: 'bg-gray-100 text-gray-500 border border-gray-200',
};

const AUDIENCE_ICONS: Record<NotifAudience, React.ReactNode> = {
  all: <Users className="w-3.5 h-3.5" />,
  admins: <User className="w-3.5 h-3.5" />,
  moderators: <User className="w-3.5 h-3.5" />,
  users: <Users className="w-3.5 h-3.5" />,
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotifType>('announcement');
  const [audience, setAudience] = useState<NotifAudience>('all');
  const [action, setAction] = useState<'send' | 'draft' | 'schedule'>('send');
  const [actionUrl, setActionUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) { showToast(MSG.ADMIN.TITLE_REQUIRED, 'error'); return; }
    if (!message.trim()) { showToast(MSG.ADMIN.MESSAGE_REQUIRED, 'error'); return; }
    if (action === 'schedule' && !scheduledAt) { showToast(MSG.ADMIN.SCHEDULE_REQUIRED, 'error'); return; }
    setSaving(true);
    try {
      await CreateAdminNotification({
        title, message, type, audience, action,
        action_url: actionUrl || null,
        scheduled_at: action === 'schedule' ? scheduledAt : null,
      });
      showToast(action === 'send' ? MSG.ADMIN.NOTIFICATION_CREATED : action === 'schedule' ? MSG.ADMIN.NOTIFICATION_SCHEDULED : MSG.ADMIN.DRAFT_SAVED, 'success');
      onCreated();
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.NOTIFICATION_CREATE_FAILED), 'error');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Broadcast Notification</h2>
          <button type="button" onClick={onClose} aria-label="Close modal" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title" className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Notification body..." className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
              <select value={type} onChange={e => setType(e.target.value as NotifType)} title="Notification type" className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700">
                <option value="announcement">Announcement</option>
                <option value="system">System</option>
                <option value="alert">Alert</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Audience</label>
              <select value={audience} onChange={e => setAudience(e.target.value as NotifAudience)} title="Notification audience" className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700">
                <option value="all">All Users</option>
                <option value="users">Regular Users</option>
                <option value="moderators">Moderators</option>
                <option value="admins">Admins</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Action URL (optional)</label>
            <input value={actionUrl} onChange={e => setActionUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Send As</label>
            <div className="flex gap-2">
              {(['send', 'draft', 'schedule'] as const).map(a => (
                <button key={a} type="button" onClick={() => setAction(a)} className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors capitalize ${action === a ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{a}</button>
              ))}
            </div>
          </div>
          {action === 'schedule' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Schedule At *</label>
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700" />
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : action === 'send' ? <Send className="w-4 h-4" /> : action === 'schedule' ? <Calendar className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {action === 'send' ? 'Send Now' : action === 'schedule' ? 'Schedule' : 'Save Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [summary, setSummary] = useState<NotifSummary>({ sent: 0, scheduled: 0, draft: 0, total_reach: 0 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const { exporting, showSuccess: showExportSuccess, downloadUrl: exportUrl, exportedFormat, doExport, closeSuccess } = useExport(
    (format) => ExportNotifications({ format, status: statusFilter || undefined, audience: audienceFilter || undefined, type: typeFilter || undefined })
  );

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GetAdminNotifications({
        page, limit: PAGE_SIZE,
        status: statusFilter || undefined,
        audience: audienceFilter || undefined,
        type: typeFilter || undefined,
      });
      const d = res?.data ?? {};
      setItems(d.items ?? []);
      setSummary(d.summary ?? { sent: 0, scheduled: 0, draft: 0, total_reach: 0 });
      setTotal(res?.meta?.total ?? 0);
      setTotalPages(res?.meta?.total_pages ?? 1);
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.NOTIFICATIONS_LOAD_FAILED), 'error');
    } finally { setLoading(false); }
  }, [page, statusFilter, audienceFilter, typeFilter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function handleSend(notif: Notification) {
    if (notif.status === 'sent') return;
    setSending(notif.id);
    try {
      await SendAdminNotification(notif.id);
      showToast(MSG.ADMIN.NOTIFICATION_CREATED, 'success');
      fetchNotifications();
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.NOTIFICATION_SEND_FAILED), 'error');
    } finally { setSending(null); }
  }

  async function handleDelete(notif: Notification) {
    setDeleting(notif.id);
    try {
      await DeleteAdminNotification(notif.id);
      showToast(MSG.ADMIN.NOTIFICATION_DELETED, 'success');
      fetchNotifications();
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.NOTIFICATION_DELETE_FAILED), 'error');
    } finally { setDeleting(null); setConfirmDelete(null); }
  }

  const hasFilters = !!(statusFilter || audienceFilter || typeFilter);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-5 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchNotifications(); }}
        />
      )}
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={doExport} hasFilters={hasFilters} title="Export Notifications" />
      <ExportSuccessModal isOpen={showExportSuccess} onClose={closeSuccess} format={exportedFormat} downloadUrl={exportUrl} />
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Notification"
        message="Delete this notification? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Notifications</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span className="w-1 h-1 bg-purple-600 rounded-full" />
            {total.toLocaleString()} total notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowExportModal(true)} disabled={exporting} aria-label="Export notifications" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Export</span>
          </button>
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Broadcast Notification</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Sent', value: summary.sent, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Scheduled', value: summary.scheduled, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Drafts', value: summary.draft, color: 'text-gray-600', bg: 'bg-white', border: 'border-gray-100' },
          { label: 'Total Reach', value: summary.total_reach.toLocaleString(), color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 shadow-sm`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100/80 flex flex-col sm:flex-row gap-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} title="Filter by status" className="px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 flex-1 sm:flex-none sm:min-w-[130px]">
          <option value="">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="scheduled">Scheduled</option>
          <option value="draft">Draft</option>
        </select>
        <select value={audienceFilter} onChange={e => { setAudienceFilter(e.target.value); setPage(1); }} title="Filter by audience" className="px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 flex-1 sm:flex-none sm:min-w-[130px]">
          <option value="">All Audiences</option>
          <option value="all">All Users</option>
          <option value="users">Users</option>
          <option value="moderators">Moderators</option>
          <option value="admins">Admins</option>
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} title="Filter by type" className="px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 flex-1 sm:flex-none sm:min-w-[130px]">
          <option value="">All Types</option>
          <option value="announcement">Announcement</option>
          <option value="system">System</option>
          <option value="alert">Alert</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100/80 p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-lg w-1/3" />
                  <div className="h-3 bg-gray-100 rounded-lg w-2/3" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 py-16 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No notifications found.</p>
          </div>
        ) : items.map(notif => (
          <div key={notif.id} className={`bg-white rounded-2xl shadow-lg border border-gray-100/80 p-4 sm:p-5 transition-opacity ${deleting === notif.id ? 'opacity-40' : ''}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.type === 'alert' ? 'bg-red-100' : notif.type === 'maintenance' ? 'bg-orange-100' : notif.type === 'system' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                <Bell className={`w-5 h-5 ${notif.type === 'alert' ? 'text-red-600' : notif.type === 'maintenance' ? 'text-orange-600' : notif.type === 'system' ? 'text-blue-600' : 'text-purple-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-gray-900">{notif.title}</h3>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${TYPE_STYLES[notif.type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{notif.type}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_STYLES[notif.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {notif.status === 'sent' ? <CheckCircle className="w-3 h-3" /> : notif.status === 'scheduled' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {notif.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{notif.message}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">{AUDIENCE_ICONS[notif.audience] ?? <Users className="w-3.5 h-3.5" />} {notif.audience}</span>
                  {notif.reach != null && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {notif.reach.toLocaleString()} reached</span>}
                  {notif.creator && <span>by {typeof notif.creator === 'object' ? notif.creator.username : String(notif.creator)}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(notif.created_at)}</span>
                  {notif.scheduled_at && <span className="flex items-center gap-1 text-blue-500"><Calendar className="w-3 h-3" />Scheduled: {formatDate(notif.scheduled_at)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {notif.status !== 'sent' && (
                  <button type="button" onClick={() => handleSend(notif)} disabled={sending === notif.id} title="Send now" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-colors">
                    {sending === notif.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send
                  </button>
                )}
                <button type="button" onClick={() => setConfirmDelete(notif)} disabled={deleting === notif.id} title="Delete" aria-label="Delete notification" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors disabled:opacity-40">
                  {deleting === notif.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page <span className="font-medium text-gray-700">{page}</span> of <span className="font-medium text-gray-700">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
