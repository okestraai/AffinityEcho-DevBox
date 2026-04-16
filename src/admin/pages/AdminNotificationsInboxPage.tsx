import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Check, Trash2, RefreshCw, MessageCircle, Heart, Target,
  Briefcase, Eye, CheckCircle, UserPlus, MessageSquare, Loader2,
  MoreVertical, X,
} from 'lucide-react';
import {
  GetNotifications,
  MarkNotificationAsRead,
  MarkAllNotificationsAsRead,
  DeleteNotification,
  ClearAllNotifications,
} from '../../../api/notificationApis';
import { showToast } from '../../Helper/ShowToast';
import { MSG } from '../../constants/messages';
import { getApiError } from '../utils/apiError';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
  actor_username?: string;
  actor_avatar?: string;
}

function getNotificationIcon(type: string) {
  const cls = 'w-5 h-5';
  switch (type) {
    case 'like': return <Heart className={`${cls} text-pink-500`} />;
    case 'comment': return <MessageCircle className={`${cls} text-blue-500`} />;
    case 'follow': return <UserPlus className={`${cls} text-purple-500`} />;
    case 'mention': return <MessageSquare className={`${cls} text-indigo-500`} />;
    case 'match': return <Target className={`${cls} text-orange-500`} />;
    case 'job': return <Briefcase className={`${cls} text-teal-500`} />;
    case 'view': return <Eye className={`${cls} text-gray-500`} />;
    case 'achievement': return <CheckCircle className={`${cls} text-green-500`} />;
    default: return <Bell className={`${cls} text-purple-500`} />;
  }
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AdminNotificationsInboxPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearing, setClearing] = useState(false);

  const PAGE_SIZE = 20;

  const fetchNotifications = useCallback(async (pg = 1, append = false) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true);
    try {
      const data = await GetNotifications({
        is_read: filter === 'unread' ? false : undefined,
        page: pg,
        limit: PAGE_SIZE,
      });
      const items: Notification[] = Array.isArray(data) ? data : (data?.notifications ?? data?.data ?? []);
      if (append) {
        setNotifications(prev => [...prev, ...items]);
      } else {
        setNotifications(items);
      }
      setHasMore(items.length === PAGE_SIZE);
      setPage(pg);
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.INBOX_LOAD_FAILED), 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => { fetchNotifications(1); }, [fetchNotifications]);

  async function handleMarkRead(id: string) {
    try {
      await MarkNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.MARK_READ_FAILED), 'error');
    }
    setActiveMenu(null);
  }

  async function handleDelete(id: string) {
    try {
      await DeleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast(MSG.ADMIN.NOTIFICATION_DELETED, 'success');
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.INBOX_DELETE_FAILED), 'error');
    }
    setActiveMenu(null);
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await MarkAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      showToast(MSG.ADMIN.ALL_MARKED_READ, 'success');
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.MARK_ALL_READ_FAILED), 'error');
    } finally { setMarkingAll(false); }
  }

  async function handleClearAll() {
    setClearing(true);
    try {
      await ClearAllNotifications();
      setNotifications([]);
      showToast(MSG.ADMIN.ALL_CLEARED, 'success');
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.CLEAR_FAILED), 'error');
    } finally { setClearing(false); }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-600" />
            My Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchNotifications(1)}
            title="Refresh"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No notifications</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {notifications.map(n => (
              <li
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${!n.is_read ? 'bg-purple-50/40' : 'hover:bg-gray-50/60'}`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-purple-100' : 'bg-gray-100'}`}>
                  {getNotificationIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                    {n.title}
                    {!n.is_read && <span className="ml-2 inline-block w-2 h-2 bg-purple-500 rounded-full align-middle" />}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                </div>

                {/* Actions menu */}
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    title="More options"
                    onClick={() => setActiveMenu(activeMenu === n.id ? null : n.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {activeMenu === n.id && (
                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10">
                      {!n.is_read && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Check className="w-4 h-4 text-green-500" /> Mark as read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(n.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMenu(null)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                      >
                        <X className="w-4 h-4" /> Close
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="px-5 py-4 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => fetchNotifications(page + 1, true)}
              disabled={loadingMore}
              className="flex items-center gap-2 mx-auto px-5 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
