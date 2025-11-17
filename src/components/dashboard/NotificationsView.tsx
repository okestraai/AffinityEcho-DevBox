import React, { useState, useEffect } from 'react';
import {
  Bell,
  Users,
  MessageCircle,
  Heart,
  Target,
  Briefcase,
  Eye,
  CheckCircle,
  X,
  Check,
  Trash2,
  Filter,
  RefreshCw,
  MoreVertical,
  UserPlus,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

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

type NotificationFilter = 'all' | 'unread' | 'mentions' | 'follows' | 'posts' | 'mentorship';

export function NotificationsView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user?.id, filter]);

  const getDummyNotifications = (): Notification[] => {
    const now = new Date();
    const getTimeAgo = (minutes: number) => {
      const date = new Date(now.getTime() - minutes * 60000);
      return date.toISOString();
    };

    return [
      {
        id: '1',
        user_id: user?.id || '',
        actor_id: 'actor1',
        type: 'follow',
        title: 'New Follower',
        message: 'TechLeader_Sarah started following you',
        action_url: '/dashboard/profile',
        reference_id: null,
        reference_type: null,
        is_read: false,
        action_taken: false,
        metadata: {},
        created_at: getTimeAgo(5),
        read_at: null,
      },
      {
        id: '2',
        user_id: user?.id || '',
        actor_id: 'actor2',
        type: 'forum_post',
        title: 'New post from someone you follow',
        message: 'DataScience_Miguel posted: "Best practices for technical interviews in 2024"',
        action_url: '/dashboard/forums',
        reference_id: 'post1',
        reference_type: 'forum',
        is_read: false,
        action_taken: false,
        metadata: {},
        created_at: getTimeAgo(30),
        read_at: null,
      },
      {
        id: '3',
        user_id: user?.id || '',
        actor_id: 'actor3',
        type: 'mentorship_request',
        title: 'New Mentorship Request',
        message: 'AspiringEngineer_Jay has requested you as their mentor',
        action_url: '/dashboard/mentorship',
        reference_id: 'request1',
        reference_type: 'mentorship',
        is_read: false,
        action_taken: false,
        metadata: {},
        created_at: getTimeAgo(120),
        read_at: null,
      },
      {
        id: '4',
        user_id: user?.id || '',
        actor_id: 'actor4',
        type: 'forum_comment',
        title: 'New comment on your post',
        message: 'Product_Manager_Lisa commented on "How to transition to PM?"',
        action_url: '/dashboard/forums',
        reference_id: 'post2',
        reference_type: 'forum',
        is_read: true,
        action_taken: false,
        metadata: {},
        created_at: getTimeAgo(180),
        read_at: getTimeAgo(150),
      },
      {
        id: '5',
        user_id: user?.id || '',
        actor_id: 'actor5',
        type: 'nook_post',
        title: 'New post in Black Tech Leaders',
        message: 'ExperiencedEngineer posted: "Navigating microaggressions in the workplace"',
        action_url: '/dashboard/nooks',
        reference_id: 'nook1',
        reference_type: 'nook',
        is_read: true,
        action_taken: false,
        metadata: {},
        created_at: getTimeAgo(360),
        read_at: getTimeAgo(300),
      },
      {
        id: '6',
        user_id: user?.id || '',
        actor_id: 'actor6',
        type: 'forum_like',
        title: 'Someone liked your post',
        message: 'Startup_Founder_Kim liked "Advice for first-time managers"',
        action_url: '/dashboard/forums',
        reference_id: 'post3',
        reference_type: 'forum',
        is_read: true,
        action_taken: false,
        metadata: {},
        created_at: getTimeAgo(480),
        read_at: getTimeAgo(470),
      },
      {
        id: '7',
        user_id: user?.id || '',
        actor_id: 'actor7',
        type: 'referral_connection',
        title: 'New Referral Connection Request',
        message: 'GrowingAnalyst_Priya requested to connect for "Software Engineer at Google"',
        action_url: '/dashboard/messages',
        reference_id: 'connection1',
        reference_type: 'referral',
        is_read: false,
        action_taken: false,
        metadata: {},
        created_at: getTimeAgo(600),
        read_at: null,
      },
      {
        id: '8',
        user_id: user?.id || '',
        actor_id: 'actor8',
        type: 'identity_reveal',
        title: 'Identity Revealed',
        message: 'Anonymous_Mentor revealed their identity as David Chen',
        action_url: '/dashboard/messages',
        reference_id: null,
        reference_type: null,
        is_read: true,
        action_taken: false,
        metadata: {},
        created_at: getTimeAgo(720),
        read_at: getTimeAgo(700),
      },
      {
        id: '9',
        user_id: user?.id || '',
        actor_id: 'actor9',
        type: 'mentorship_accepted',
        title: 'Mentorship Request Accepted',
        message: 'Finance_Pro_David accepted your mentorship request!',
        action_url: '/dashboard/mentorship',
        reference_id: 'request2',
        reference_type: 'mentorship',
        is_read: true,
        action_taken: true,
        metadata: {},
        created_at: getTimeAgo(1440),
        read_at: getTimeAgo(1400),
      },
      {
        id: '10',
        user_id: user?.id || '',
        actor_id: 'actor10',
        type: 'referral_comment',
        title: 'New comment on your referral',
        message: 'DesignLead_Alex commented on "UX Designer at Airbnb"',
        action_url: '/dashboard/referrals',
        reference_id: 'referral1',
        reference_type: 'referral',
        is_read: true,
        action_taken: false,
        metadata: {},
        created_at: getTimeAgo(2880),
        read_at: getTimeAgo(2800),
      },
    ];
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      let allNotifications = data || [];

      if (allNotifications.length === 0) {
        allNotifications = getDummyNotifications();
      }

      let filteredNotifications = allNotifications;

      if (filter === 'unread') {
        filteredNotifications = allNotifications.filter(n => !n.is_read);
      } else if (filter === 'follows') {
        filteredNotifications = allNotifications.filter(n => n.type === 'follow');
      } else if (filter === 'posts') {
        filteredNotifications = allNotifications.filter(n =>
          ['forum_post', 'nook_post', 'referral_post'].includes(n.type)
        );
      } else if (filter === 'mentorship') {
        filteredNotifications = allNotifications.filter(n =>
          ['mentorship_request', 'mentorship_accepted', 'mentorship_message'].includes(n.type)
        );
      }

      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications(getDummyNotifications());
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: user.id
      });

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
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
      const { error } = await supabase
        .from('notifications')
        .update({ action_taken: true })
        .eq('id', notification.id);

      if (error) throw error;

      if (action === 'accept_mentorship') {
        navigate('/dashboard/mentorship');
      } else if (action === 'view_profile') {
        navigate(`/dashboard/profile`);
      } else if (action === 'view_post') {
        if (notification.reference_type === 'forum') {
          navigate('/dashboard/forums');
        } else if (notification.reference_type === 'nook') {
          navigate('/dashboard/nooks');
        } else if (notification.reference_type === 'referral') {
          navigate('/dashboard/referrals');
        }
      }

      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, action_taken: true, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error handling action:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'forum_post':
      case 'forum_comment':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'forum_like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'nook_post':
      case 'nook_comment':
        return <MessageCircle className="w-5 h-5 text-green-600" />;
      case 'referral_post':
      case 'referral_comment':
      case 'referral_connection':
        return <Briefcase className="w-5 h-5 text-orange-600" />;
      case 'mentorship_request':
      case 'mentorship_accepted':
      case 'mentorship_message':
        return <Target className="w-5 h-5 text-indigo-600" />;
      case 'identity_reveal':
        return <Eye className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
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

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
      case 'mentorship_request':
        return (
          <div className="flex gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(notification, 'accept_mentorship');
              }}
              className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNotification(notification.id);
              }}
              className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Decline
            </button>
          </div>
        );

      case 'follow':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(notification, 'view_profile');
            }}
            className="mt-2 w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Profile
          </button>
        );

      case 'forum_post':
      case 'nook_post':
      case 'referral_post':
      case 'forum_comment':
      case 'nook_comment':
      case 'referral_comment':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(notification, 'view_post');
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
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
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
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
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
          {(['all', 'unread', 'follows', 'posts', 'mentorship'] as NotificationFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white text-purple-600 rounded-full text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-sm text-gray-500">
            {filter === 'unread'
              ? "You're all caught up!"
              : 'New notifications will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`bg-white rounded-xl border transition-all cursor-pointer ${
                notification.is_read
                  ? 'border-gray-200 hover:shadow-md'
                  : 'border-purple-200 bg-purple-50/30 hover:shadow-lg'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notification.is_read ? 'bg-gray-100' : 'bg-purple-100'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold ${
                        notification.is_read ? 'text-gray-900' : 'text-gray-900'
                      }`}>
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
                              setShowMenu(showMenu === notification.id ? null : notification.id);
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

                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>

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
    </div>
  );
}
