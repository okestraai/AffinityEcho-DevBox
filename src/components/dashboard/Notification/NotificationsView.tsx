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
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  GetNotifications,
  MarkNotificationAsRead,
  MarkAllNotificationsAsRead,
  DeleteNotification as DeleteNotificationApi,
  UpdateNotification,
} from "../../../../api/notificationApis";
import { RespondToIdentityReveal } from "../../../../api/messaging";
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
      if (filter === "posts") params.type = "forum_post";
      if (filter === "mentorship") params.type = "mentorship_request";

      const response = await GetNotifications(params);
      const raw = response?.data?.items ?? response?.data ?? response ?? [];
      const allNotifications = Array.isArray(raw) ? raw : [];

      setHasMore(allNotifications.length >= limit);

      // Client-side filtering for types not covered by API filter
      let filteredNotifications = allNotifications;
      if (filter === "posts") {
        filteredNotifications = allNotifications.filter((n: Notification) =>
          ["forum_post", "nook_post", "referral_post"].includes(n.type)
        );
      } else if (filter === "mentorship") {
        filteredNotifications = allNotifications.filter((n: Notification) =>
          ["mentorship_request", "mentorship_accepted", "mentorship_message", "identity_reveal_request", "identity_reveal", "identity_reveal_rejected"].includes(n.type)
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

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleAction = async (notification: Notification, action: string) => {
    await markAsRead(notification.id);

    try {
      if (action === "decline_mentorship") {
        await UpdateNotification(notification.id, { action_taken: true });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, action_taken: true, is_read: true } : n
          )
        );
        showToast("Mentorship request declined.", "info");
        return;
      }

      if (action === "decline_identity_reveal") {
        const revealId = notification.reference_id || notification.metadata?.reveal_id;
        if (revealId) {
          await RespondToIdentityReveal(revealId, "rejected");
        }
        await UpdateNotification(notification.id, { action_taken: true });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, action_taken: true, is_read: true } : n
          )
        );
        showToast("Identity reveal declined.", "info");
        return;
      }

      if (action === "accept_identity_reveal") {
        const revealId = notification.reference_id || notification.metadata?.reveal_id;
        if (revealId) {
          await RespondToIdentityReveal(revealId, "accepted");
        }
        await UpdateNotification(notification.id, { action_taken: true });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, action_taken: true, is_read: true } : n
          )
        );
        showToast("Identity reveal accepted! You can now see each other's identities.", "success");
        navigate("/dashboard/messages");
        return;
      }

      await UpdateNotification(notification.id, { action_taken: true });

      if (action === "accept_mentorship") {
        showToast("Mentorship request accepted!", "success");
        navigate("/dashboard/messages", {
          state: { startChatWith: notification.actor_id, contextType: "mentorship" },
        });
      } else if (action === "view_profile") {
        navigate("/dashboard/profile");
      } else if (action === "view_post") {
        if (notification.reference_type === "forum") {
          navigate("/dashboard/forums");
        } else if (notification.reference_type === "nook") {
          navigate("/dashboard/nooks");
        } else if (notification.reference_type === "referral") {
          navigate("/dashboard/referrals");
        }
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, action_taken: true, is_read: true }
            : n
        )
      );
    } catch (error) {
      console.error("Error handling action:", error);
      showToast("An error occurred. Please try again.", "error");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case "forum_post":
      case "forum_comment":
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case "forum_like":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "nook_post":
      case "nook_comment":
        return <MessageCircle className="w-5 h-5 text-green-600" />;
      case "referral_post":
      case "referral_comment":
      case "referral_connection":
        return <Briefcase className="w-5 h-5 text-orange-600" />;
      case "mentorship_request":
      case "mentorship_accepted":
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
          <div className="flex gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "accept_mentorship");
              }}
              className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "decline_mentorship");
              }}
              className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Decline
            </button>
          </div>
        );

      case "identity_reveal_request":
        return (
          <div className="flex gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "accept_identity_reveal");
              }}
              className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, "decline_identity_reveal");
              }}
              className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Decline
            </button>
          </div>
        );

      case "follow":
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(notification, "view_profile");
            }}
            className="mt-2 w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Profile
          </button>
        );

      case "identity_reveal":
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate("/dashboard/messages");
            }}
            className="mt-2 w-full px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
          >
            View Messages
          </button>
        );

      case "identity_reveal_rejected":
        return null;

      case "forum_post":
      case "nook_post":
      case "referral_post":
      case "forum_comment":
      case "nook_comment":
      case "referral_comment":
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(notification, "view_post");
            }}
            className="mt-2 w-full px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            View Post
          </button>
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Notifications
              </h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {(
            [
              "all",
              "unread",
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
