import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  MessageCircle,
  Heart,
  Target,
  Briefcase,
  Eye,
  CheckCircle,
  X,
  Check,
  Trash2,
  RefreshCw,
  MoreVertical,
  UserPlus,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  GetNotifications,
  MarkNotificationAsRead,
  MarkAllNotificationsAsRead,
  DeleteNotification,
  UpdateNotification,
} from '../../../api/notificationApis';
import { RespondToIdentityReveal } from '../../../api/messaging';
import { RespondToDirectMentorshipRequest } from '../../../api/mentorshipApis';
import { webSocketService } from '../../services/websocket.service';
import { showToast } from '../../Helper/ShowToast';

interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  action_taken: boolean;
  metadata: any;
  created_at: string;
  read_at: string | null;
  actor_username?: string;
  actor_avatar?: string;
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: () => void;
}

export function NotificationsDropdown({ isOpen, onClose, unreadCount, onUnreadCountChange }: NotificationsDropdownProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchNotifications();
    }
  }, [isOpen, user?.id]);

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    const handleNewNotification = (data: any) => {
      const notification = data?.data || data;
      if (notification?.id) {
        setNotifications((prev) => {
          const exists = prev.some((n) => n.id === notification.id);
          if (exists) return prev;
          return [notification, ...prev].slice(0, 10);
        });
      }
    };

    webSocketService.on("new_notification", handleNewNotification);

    return () => {
      webSocketService.off("new_notification", handleNewNotification);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await GetNotifications({ limit: 10 });

      const raw = response?.data?.items ?? response?.data ?? response ?? [];
      const allNotifications = Array.isArray(raw) ? raw : [];

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await MarkNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      onUnreadCountChange();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await MarkAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      onUnreadCountChange();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await DeleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      onUnreadCountChange();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Normalize backend action_url to frontend route paths
  const normalizeActionUrl = (actionUrl: string): string => {
    let url = actionUrl;
    url = url.replace(/^\/dashboard/, "");

    url = url.replace(/^\/feed\/posts\/([a-f0-9-]+).*/, "/feeds/post/$1");
    url = url.replace(/^\/feed\/([a-f0-9-]+)$/, "/feeds/post/$1");
    url = url.replace(/^\/forum\/topics\/([a-f0-9-]+).*/, "/forums/topic/$1");
    url = url.replace(/^\/forum\/topic\/([a-f0-9-]+).*/, "/forums/topic/$1");
    url = url.replace(/^\/nook\/([a-f0-9-]+)/, "/nooks/$1");
    url = url.replace(/^\/reports\/([a-f0-9-]+)/, "/my-cases/$1");
    url = url.replace(/^\/profile$/, "/profile?tab=profile");

    // Mentorship requests/sessions → messages with mentorship-requests tab
    url = url.replace(/^\/mentorship\/requests\/.*/, "/messages?tab=mentorship-requests");
    url = url.replace(/^\/mentorship\/sessions\/.*/, "/messages?tab=mentorship-requests");
    url = url.replace(/^\/mentorship\/profile\/([a-f0-9-]+)/, "/profile?tab=profile");

    // Messages: /messages/:conversationId → /messages?conversation=:id
    url = url.replace(/^\/messages\/([a-f0-9-]+)$/, "/messages?conversation=$1");

    if (!url.startsWith("/dashboard")) {
      url = `/dashboard${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return url;
  };

  // Resolve the best route for a notification based on its type, reference, and action_url
  const resolveNotificationRoute = (notification: Notification): string | null => {
    const { type, reference_id, reference_type, action_url, actor_id, metadata } = notification;

    switch (type) {
      // Follow/unfollow → profile page with "follow" tab
      case "follow":
      case "user_followed":
      case "user_unfollowed":
        return "/dashboard/profile?tab=profile";

      // A followed user created a post → single post page
      case "followed_user_post":
        if (reference_id) return `/dashboard/feeds/post/${reference_id}`;
        return "/dashboard/feeds";

      case "feed_like":
      case "post_reaction":
        if (reference_id) return `/dashboard/feeds/post/${reference_id}`;
        break;

      // Forum content → topic detail (use metadata.topic_id for comments)
      case "forum_post":
      case "forum_like":
      case "topic_comment":
        if (metadata?.topic_id) return `/dashboard/forums/topic/${metadata.topic_id}`;
        if (reference_id) return `/dashboard/forums/topic/${reference_id}`;
        break;

      case "forum_comment":
        if (metadata?.topic_id) return `/dashboard/forums/topic/${metadata.topic_id}`;
        if (reference_id) return `/dashboard/forums/topic/${reference_id}`;
        break;

      // Nook content → nook detail
      case "nook_post":
      case "nook_comment":
      case "nook_message":
        if (reference_id) return `/dashboard/nooks/${reference_id}`;
        break;

      // Nook reply: reference_id is parent_message_id, use metadata.nook_id
      case "nook_reply":
        if (metadata?.nook_id) return `/dashboard/nooks/${metadata.nook_id}`;
        if (reference_id) return `/dashboard/nooks/${reference_id}`;
        break;

      case "referral_post":
      case "referral_comment":
      case "referral_like":
        if (reference_id) return `/dashboard/feeds/post/${reference_id}`;
        return "/dashboard/feeds";

      case "referral_connection":
        return "/dashboard/feeds";

      // All mentorship notifications → messages with mentorship-requests tab
      case "mentorship_request":
      case "mentorship_declined":
      case "session_scheduled":
        return "/dashboard/messages?tab=mentorship-requests";

      case "mentorship_accepted":
      case "mentorship_message":
        if (actor_id) return `/dashboard/messages?user=${actor_id}&chat_type=mentorship`;
        return "/dashboard/messages?tab=mentorship-requests";

      case "message_received":
        if (metadata?.conversation_id) return `/dashboard/messages?conversation=${metadata.conversation_id}`;
        if (actor_id) return `/dashboard/messages?user=${actor_id}`;
        return "/dashboard/messages";

      case "identity_reveal":
      case "identity_reveal_request":
      case "identity_reveal_rejected":
        if (metadata?.conversation_id) return `/dashboard/messages?conversation=${metadata.conversation_id}`;
        return "/dashboard/messages";

      case "report_status_update":
        if (reference_id) return `/dashboard/my-cases/${reference_id}`;
        return "/dashboard/my-cases";

      // Mention → route based on content_type in metadata
      case "mention":
        if (metadata?.content_type === "nook_message" && metadata?.context_id)
          return `/dashboard/nooks/${metadata.context_id}`;
        if (metadata?.content_type === "comment" && metadata?.context_id)
          return `/dashboard/forums/topic/${metadata.context_id}`;
        if (reference_id) return `/dashboard/feeds/post/${reference_id}`;
        break;
    }

    // Reference type-based routing
    if (reference_id && reference_type) {
      switch (reference_type) {
        case "topic":
        case "forum":
        case "forum_post":
        case "forum_comment":
          return `/dashboard/forums/topic/${reference_id}`;
        case "nook":
        case "nook_message":
        case "nook_reply":
          return `/dashboard/nooks/${reference_id}`;
        case "post":
        case "feed":
          return `/dashboard/feeds/post/${reference_id}`;
        case "report":
        case "case":
          return `/dashboard/my-cases/${reference_id}`;
        case "conversation":
          return `/dashboard/messages?conversation=${reference_id}`;
      }
    }

    if (action_url) {
      return normalizeActionUrl(action_url);
    }

    return null;
  };

  const markActionTaken = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, action_taken: true, is_read: true } : n))
    );
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);

    const route = resolveNotificationRoute(notification);
    if (route) {
      navigate(route);
      onClose();
    }
  };

  const handleAction = async (notification: Notification, action: string) => {
    await markAsRead(notification.id);

    try {
      // --- API actions (accept/decline) ---
      if (action === 'decline_mentorship') {
        const requestId = notification.reference_id || notification.metadata?.request_id;
        if (requestId) {
          await RespondToDirectMentorshipRequest(requestId, { action: 'decline' });
        }
        await UpdateNotification(notification.id, { action_taken: true });
        markActionTaken(notification.id);
        showToast('Mentorship request declined.', 'info');
        return;
      }

      if (action === 'accept_mentorship') {
        const requestId = notification.reference_id || notification.metadata?.request_id;
        if (requestId) {
          await RespondToDirectMentorshipRequest(requestId, { action: 'accept' });
        }
        await UpdateNotification(notification.id, { action_taken: true });
        markActionTaken(notification.id);
        showToast('Mentorship request accepted!', 'success');
        navigate('/dashboard/messages', {
          state: { startChatWith: notification.actor_id, contextType: 'mentorship' },
        });
        onClose();
        return;
      }

      if (action === 'decline_identity_reveal') {
        const revealId = notification.reference_id || notification.metadata?.reveal_id;
        if (revealId) {
          await RespondToIdentityReveal(revealId, 'rejected');
        }
        await UpdateNotification(notification.id, { action_taken: true });
        markActionTaken(notification.id);
        showToast('Identity reveal declined.', 'info');
        return;
      }

      if (action === 'accept_identity_reveal') {
        const revealId = notification.reference_id || notification.metadata?.reveal_id;
        if (revealId) {
          await RespondToIdentityReveal(revealId, 'accepted');
        }
        await UpdateNotification(notification.id, { action_taken: true });
        markActionTaken(notification.id);
        showToast('Identity reveal accepted! You can now see each other\'s identities.', 'success');
        if (notification.metadata?.conversation_id) {
          navigate(`/dashboard/messages?conversation=${notification.metadata.conversation_id}`);
        } else {
          navigate('/dashboard/messages');
        }
        onClose();
        return;
      }

      // --- Navigation-only actions ---
      await UpdateNotification(notification.id, { action_taken: true });

      const route = resolveNotificationRoute(notification);
      if (route) {
        navigate(route);
        onClose();
      }

      markActionTaken(notification.id);
    } catch (error) {
      console.error('Error handling action:', error);
      showToast('An error occurred. Please try again.', 'error');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'forum_post':
      case 'forum_comment':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'forum_like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'nook_post':
      case 'nook_comment':
        return <MessageCircle className="w-4 h-4 text-green-600" />;
      case 'referral_post':
      case 'referral_comment':
      case 'referral_connection':
        return <Briefcase className="w-4 h-4 text-orange-600" />;
      case 'mentorship_request':
      case 'mentorship_accepted':
      case 'mentorship_message':
        return <Target className="w-4 h-4 text-indigo-600" />;
      case 'identity_reveal':
      case 'identity_reveal_request':
        return <Eye className="w-4 h-4 text-yellow-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotificationActions = (notification: Notification) => {
    if (notification.action_taken) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
          <CheckCircle className="w-3 h-3" />
          Action taken
        </div>
      );
    }

    switch (notification.type) {
      case 'mentorship_request':
        return (
          <div className="flex gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, 'accept_mentorship');
              }}
              className="flex-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
            >
              Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, 'decline_mentorship');
              }}
              className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
            >
              Decline
            </button>
          </div>
        );

      case 'identity_reveal_request':
        return (
          <div className="flex gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, 'accept_identity_reveal');
              }}
              className="flex-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
            >
              Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, 'decline_identity_reveal');
              }}
              className="flex-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
            >
              Decline
            </button>
          </div>
        );

      case 'follow':
      case 'user_followed':
      case 'user_unfollowed':
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, 'view_profile');
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              View Profile
            </button>
          </div>
        );

      case 'identity_reveal':
      case 'mentorship_accepted':
      case 'mentorship_message':
      case 'message_received':
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, 'view_message');
              }}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium"
            >
              View Message
            </button>
          </div>
        );

      case 'mentorship_declined':
      case 'identity_reveal_rejected':
        return null;

      case 'report_status_update':
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, 'view_case');
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
            >
              View Case
            </button>
          </div>
        );

      case 'mention':
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, 'view_mention');
              }}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              View Mention
            </button>
          </div>
        );

      case 'followed_user_post':
      case 'forum_post':
      case 'forum_comment':
      case 'forum_like':
      case 'topic_comment':
      case 'nook_post':
      case 'nook_comment':
      case 'nook_message':
      case 'nook_reply':
      case 'referral_post':
      case 'referral_comment':
      case 'referral_like':
      case 'referral_connection':
      case 'feed_like':
      case 'post_reaction':
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, 'view_post');
              }}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              View Post
            </button>
          </div>
        );

      case 'session_scheduled':
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, 'view_post');
              }}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium"
            >
              View Session
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed md:absolute right-2 md:right-0 left-2 md:left-auto top-16 md:top-full md:mt-2 w-auto md:w-96 max-h-[calc(100vh-5rem)] md:max-h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
    >
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchNotifications}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Mark all as read"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[520px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No notifications yet</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              When someone follows you, comments on your posts, or sends you a request, it will show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer transition-all relative ${
                  notification.is_read
                    ? 'hover:bg-gray-50'
                    : 'bg-purple-50/30 hover:bg-purple-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notification.is_read ? 'bg-gray-100' : 'bg-purple-100'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-semibold text-sm ${
                        notification.is_read ? 'text-gray-900' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(notification.created_at)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(showMenu === notification.id ? null : notification.id);
                          }}
                          className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {showMenu === notification.id && (
                          <div className="absolute right-2 mt-6 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                  setShowMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                                setShowMenu(null);
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-1">{notification.message}</p>

                    {renderNotificationActions(notification)}
                  </div>
                </div>

                {!notification.is_read && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-600 rounded-r" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-3">
          <button
            onClick={() => {
              navigate('/dashboard/notifications');
              onClose();
            }}
            className="w-full text-center text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
