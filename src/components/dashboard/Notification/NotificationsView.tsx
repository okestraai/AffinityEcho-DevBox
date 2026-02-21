import React, { useState, useEffect } from "react";
import {
  Bell,
  MessageCircle,
  Heart,
  Target,
  Briefcase,
  Eye,
  CheckCircle,
  Check,
  Trash2,
  RefreshCw,
  MoreVertical,
  UserPlus,
  MessageSquare,
  AtSign,
  Shield,
  Mail,
  Reply,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  GetNotifications,
  MarkNotificationAsRead,
  MarkAllNotificationsAsRead,
  DeleteNotification as DeleteNotificationApi,
  UpdateNotification,
  ClearAllNotifications,
} from "../../../../api/notificationApis";
import { RespondToIdentityReveal } from "../../../../api/messaging";
import { RespondToDirectMentorshipRequest } from "../../../../api/mentorshipApis";
import { webSocketService } from "../../../services/websocket.service";
import { showToast } from "../../../Helper/ShowToast";
import { NotificationsSkeleton } from "../../../Helper/SkeletonLoader";

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

type NotificationFilter =
  | "all"
  | "unread"
  | "mentions"
  | "follows"
  | "posts"
  | "mentorship";

export function NotificationsView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id, filter, limit]);

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    const handleNewNotification = (data: any) => {
      const notification = data?.data || data;
      if (notification?.id) {
        setNotifications((prev) => {
          const exists = prev.some((n) => n.id === notification.id);
          if (exists) return prev;
          return [notification, ...prev];
        });
      }
    };

    webSocketService.on("new_notification", handleNewNotification);

    return () => {
      webSocketService.off("new_notification", handleNewNotification);
    };
  }, []);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const params: { is_read?: boolean; type?: string; page?: number; limit?: number } = { limit };
      if (filter === "unread") params.is_read = false;
      if (filter === "follows") params.type = "follow";
      if (filter === "mentions") params.type = "mention";
      if (filter === "posts") params.type = "forum_post";
      if (filter === "mentorship") params.type = "mentorship_request";

      const response = await GetNotifications(params);
      const raw = response?.items ?? (Array.isArray(response) ? response : []);
      const allNotifications = Array.isArray(raw) ? raw : [];

      setHasMore(allNotifications.length >= limit);

      // Client-side filtering for types not covered by API filter
      let filteredNotifications = allNotifications;
      if (filter === "follows") {
        filteredNotifications = allNotifications.filter((n: Notification) =>
          ["follow", "user_followed"].includes(n.type)
        );
      } else if (filter === "mentions") {
        filteredNotifications = allNotifications.filter((n: Notification) =>
          ["mention"].includes(n.type)
        );
      } else if (filter === "posts") {
        filteredNotifications = allNotifications.filter((n: Notification) =>
          ["forum_post", "nook_post", "referral_post", "forum_comment", "forum_like", "feed_like", "post_reaction", "topic_comment", "nook_reply", "nook_comment"].includes(n.type)
        );
      } else if (filter === "mentorship") {
        filteredNotifications = allNotifications.filter((n: Notification) =>
          ["mentorship_request", "mentorship_accepted", "mentorship_message", "mentorship_declined", "identity_reveal_request", "identity_reveal", "identity_reveal_rejected"].includes(n.type)
        );
      }

      setNotifications(filteredNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setLimit((prev) => prev + 50);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await MarkNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await MarkAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await DeleteNotificationApi(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all notifications? This cannot be undone.")) return;

    try {
      await ClearAllNotifications();
      setNotifications([]);
      showToast("All notifications cleared.", "success");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      showToast("Failed to clear notifications.", "error");
    }
  };

  // Normalize backend action_url to frontend route paths
  const normalizeActionUrl = (actionUrl: string): string => {
    let url = actionUrl;
    // Strip leading /dashboard if present — we'll re-add it
    url = url.replace(/^\/dashboard/, "");

    // Feed posts → single post page: /feed/posts/:id → /feeds/post/:id
    url = url.replace(/^\/feed\/posts\/([a-f0-9-]+).*/, "/feeds/post/$1");
    // /feed/:id (legacy) → /feeds/post/:id
    url = url.replace(/^\/feed\/([a-f0-9-]+)$/, "/feeds/post/$1");

    // Forum topics: /forum/topics/:id → /forums/topic/:id (strip hash fragments)
    url = url.replace(/^\/forum\/topics\/([a-f0-9-]+).*/, "/forums/topic/$1");
    url = url.replace(/^\/forum\/topic\/([a-f0-9-]+).*/, "/forums/topic/$1");

    // Nooks: /nook/:id → /nooks/:id
    url = url.replace(/^\/nook\/([a-f0-9-]+)/, "/nooks/$1");
    // /nooks/:id already correct

    // Report/cases: /reports/:id or /my-cases/:id
    url = url.replace(/^\/reports\/([a-f0-9-]+)/, "/my-cases/$1");

    // Profile
    url = url.replace(/^\/profile$/, "/profile?tab=profile");

    // Ensure it starts with /dashboard
    if (!url.startsWith("/dashboard")) {
      url = `/dashboard${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return url;
  };

  // Resolve the best route for a notification based on its type, reference, and action_url
  const resolveNotificationRoute = (notification: Notification): string | null => {
    const { type, reference_id, reference_type, action_url, actor_id, metadata } = notification;

    // 1. Specific type-based routing (highest priority)
    switch (type) {
      // Follow → profile page with "follow" tab
      case "follow":
      case "user_followed":
        return "/dashboard/profile?tab=profile";

      // Feed posts: reaction, comment, mention on a post → single post page
      case "feed_like":
      case "post_reaction":
        if (reference_id) return `/dashboard/feeds/post/${reference_id}`;
        break;

      // Forum content → topic detail
      case "forum_post":
      case "forum_comment":
      case "forum_like":
      case "topic_comment":
        if (reference_id) return `/dashboard/forums/topic/${reference_id}`;
        break;

      // Nook content → nook detail
      case "nook_post":
      case "nook_comment":
      case "nook_message":
      case "nook_reply":
        if (reference_id) return `/dashboard/nooks/${reference_id}`;
        break;

      // Referral content → feed (referral posts live in feed)
      case "referral_post":
      case "referral_comment":
      case "referral_like":
      case "referral_connection":
        if (reference_id) return `/dashboard/feeds/post/${reference_id}`;
        return "/dashboard/feeds";

      // Mentorship request → mentorship requests tab in messages
      case "mentorship_request":
        return "/dashboard/messages?tab=mentorship-requests";

      // Mentorship accepted → open chat with the mentor/mentee
      case "mentorship_accepted":
      case "mentorship_message":
        if (actor_id) return `/dashboard/messages?user=${actor_id}&chat_type=mentorship`;
        return "/dashboard/messages";

      // Mentorship declined → mentorship view
      case "mentorship_declined":
        return "/dashboard/mentorship";

      // Direct messages → open conversation
      case "message_received":
        if (metadata?.conversation_id) return `/dashboard/messages?conversation=${metadata.conversation_id}`;
        if (actor_id) return `/dashboard/messages?user=${actor_id}`;
        return "/dashboard/messages";

      // Identity reveal → messages
      case "identity_reveal":
      case "identity_reveal_request":
      case "identity_reveal_rejected":
        if (metadata?.conversation_id) return `/dashboard/messages?conversation=${metadata.conversation_id}`;
        return "/dashboard/messages";

      // Report status → case detail
      case "report_status_update":
        if (reference_id) return `/dashboard/my-cases/${reference_id}`;
        return "/dashboard/my-cases";

      // Mention → route based on what was mentioned in
      case "mention":
        // Fall through to reference_type resolution below
        break;
    }

    // 2. Reference type-based routing
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

    // 3. Fallback: use action_url if available
    if (action_url) {
      return normalizeActionUrl(action_url);
    }

    return null;
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);

    const route = resolveNotificationRoute(notification);
    if (route) {
      navigate(route);
    }
  };

  const markActionTaken = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, action_taken: true, is_read: true } : n
      )
    );
  };

  const handleAction = async (notification: Notification, action: string) => {
    await markAsRead(notification.id);

    try {
      // --- API actions (accept/decline) — these perform an API call, then navigate ---
      if (action === "decline_mentorship") {
        const requestId = notification.reference_id || notification.metadata?.request_id;
        if (requestId) {
          await RespondToDirectMentorshipRequest(requestId, { action: "decline" });
        }
        await UpdateNotification(notification.id, { action_taken: true });
        markActionTaken(notification.id);
        showToast("Mentorship request declined.", "info");
        return;
      }

      if (action === "accept_mentorship") {
        const requestId = notification.reference_id || notification.metadata?.request_id;
        if (requestId) {
          await RespondToDirectMentorshipRequest(requestId, { action: "accept" });
        }
        await UpdateNotification(notification.id, { action_taken: true });
        markActionTaken(notification.id);
        showToast("Mentorship request accepted!", "success");
        navigate("/dashboard/messages", {
          state: { startChatWith: notification.actor_id, contextType: "mentorship" },
        });
        return;
      }

      if (action === "decline_identity_reveal") {
        const revealId = notification.reference_id || notification.metadata?.reveal_id;
        if (revealId) {
          await RespondToIdentityReveal(revealId, "rejected");
        }
        await UpdateNotification(notification.id, { action_taken: true });
        markActionTaken(notification.id);
        showToast("Identity reveal declined.", "info");
        return;
      }

      if (action === "accept_identity_reveal") {
        const revealId = notification.reference_id || notification.metadata?.reveal_id;
        if (revealId) {
          await RespondToIdentityReveal(revealId, "accepted");
        }
        await UpdateNotification(notification.id, { action_taken: true });
        markActionTaken(notification.id);
        showToast("Identity reveal accepted! You can now see each other's identities.", "success");
        if (notification.metadata?.conversation_id) {
          navigate(`/dashboard/messages?conversation=${notification.metadata.conversation_id}`);
        } else {
          navigate("/dashboard/messages");
        }
        return;
      }

      // --- Navigation-only actions — mark as taken and route ---
      await UpdateNotification(notification.id, { action_taken: true });

      const route = resolveNotificationRoute(notification);
      if (route) {
        navigate(route);
      }

      markActionTaken(notification.id);
    } catch (error) {
      console.error("Error handling action:", error);
      showToast("An error occurred. Please try again.", "error");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
      case "user_followed":
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case "mention":
        return <AtSign className="w-5 h-5 text-purple-600" />;
      case "forum_post":
      case "forum_comment":
      case "topic_comment":
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case "forum_like":
      case "feed_like":
      case "post_reaction":
      case "referral_like":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "nook_post":
      case "nook_comment":
      case "nook_message":
      case "nook_reply":
        return <Reply className="w-5 h-5 text-green-600" />;
      case "message_received":
        return <Mail className="w-5 h-5 text-blue-500" />;
      case "report_status_update":
        return <Shield className="w-5 h-5 text-red-600" />;
      case "referral_post":
      case "referral_comment":
      case "referral_connection":
        return <Briefcase className="w-5 h-5 text-orange-600" />;
      case "mentorship_request":
      case "mentorship_accepted":
      case "mentorship_declined":
      case "mentorship_message":
        return <Target className="w-5 h-5 text-indigo-600" />;
      case "identity_reveal":
      case "identity_reveal_request":
      case "identity_reveal_rejected":
        return <Eye className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderNotificationActions = (notification: Notification) => {
    if (notification.action_taken) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="w-3 h-3" />
          Action taken
        </div>
      );
    }

    switch (notification.type) {
      case "mentorship_request":
        return (
          <div className="flex gap-2 mt-2 justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "accept_mentorship");
              }}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
            >
              Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "decline_mentorship");
              }}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
            >
              Decline
            </button>
          </div>
        );

      case "identity_reveal_request":
        return (
          <div className="flex gap-2 mt-2 justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "accept_identity_reveal");
              }}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
            >
              Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "decline_identity_reveal");
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
            >
              Decline
            </button>
          </div>
        );

      case "follow":
      case "user_followed":
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "view_profile");
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              View Profile
            </button>
          </div>
        );

      case "identity_reveal":
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "view_message");
              }}
              className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs font-medium"
            >
              View Messages
            </button>
          </div>
        );

      case "mentorship_accepted":
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "view_message");
              }}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
            >
              View Messages
            </button>
          </div>
        );

      case "mentorship_declined":
        return null;

      case "mentorship_message":
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "view_message");
              }}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium"
            >
              View Message
            </button>
          </div>
        );

      case "identity_reveal_rejected":
        return null;

      case "mention":
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "view_mention");
              }}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              View Mention
            </button>
          </div>
        );

      case "nook_reply":
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "view_post");
              }}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
            >
              View Reply
            </button>
          </div>
        );

      case "report_status_update":
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "view_case");
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
            >
              View Case
            </button>
          </div>
        );

      case "message_received":
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "view_message");
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              View Message
            </button>
          </div>
        );

      case "forum_post":
      case "nook_post":
      case "nook_message":
      case "referral_post":
      case "forum_comment":
      case "nook_comment":
      case "referral_comment":
      case "feed_like":
      case "post_reaction":
      case "topic_comment":
      case "forum_like":
      case "referral_like":
        return (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "view_post");
              }}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              View Post
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && notifications.length === 0) {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Notifications
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchNotifications}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all</span> read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear all</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {(
            [
              "all",
              "unread",
              "mentions",
              "follows",
              "posts",
              "mentorship",
            ] as NotificationFilter[]
          ).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "unread" && unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white text-purple-600 rounded-full text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Bell className="w-10 h-10 text-purple-300" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2 text-lg">
            {filter === "unread" ? "All caught up!" : "No notifications yet"}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
            {filter === "unread"
              ? "You've read all your notifications. Check back later for new updates."
              : filter === "all"
              ? "When someone follows you, comments on your posts, or sends you a request, it will show up here."
              : `No ${filter} notifications to show right now.`}
          </p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="mt-4 px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              View all notifications
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`bg-white rounded-xl border transition-all cursor-pointer ${
                notification.is_read
                  ? "border-gray-200 hover:shadow-md"
                  : "border-purple-200 bg-purple-50/30 hover:shadow-lg"
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.is_read ? "bg-gray-100" : "bg-purple-100"
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3
                        className={`font-semibold ${
                          notification.is_read
                            ? "text-gray-900"
                            : "text-gray-900"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(notification.created_at)}
                        </span>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenu(
                                showMenu === notification.id
                                  ? null
                                  : notification.id
                              );
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {showMenu === notification.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                    setShowMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Check className="w-4 h-4" />
                                  Mark as read
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                  setShowMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>

                    {renderNotificationActions(notification)}
                  </div>
                </div>
              </div>

              {!notification.is_read && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-r" />
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && notifications.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Load More Notifications"}
          </button>
        </div>
      )}
    </div>
  );
}
