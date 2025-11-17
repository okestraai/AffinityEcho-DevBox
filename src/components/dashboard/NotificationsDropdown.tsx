import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  MoreVertical,
  UserPlus,
  MessageSquare,
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
        message: 'DataScience_Miguel posted: "Best practices for technical interviews"',
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
        message: 'ExperiencedEngineer posted in your nook',
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
        type: 'referral_connection',
        title: 'New Referral Connection',
        message: 'GrowingAnalyst_Priya wants to connect',
        action_url: '/dashboard/messages',
        reference_id: 'connection1',
        reference_type: 'referral',
        is_read: true,
        action_taken: false,
        metadata: {},
        created_at: getTimeAgo(480),
        read_at: getTimeAgo(470),
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
        .limit(10);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      let allNotifications = data || [];

      if (allNotifications.length === 0) {
        allNotifications = getDummyNotifications();
      }

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications(getDummyNotifications());
    } finally {
      setLoading(false);
    }
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
      onUnreadCountChange();
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
      onUnreadCountChange();
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
      onUnreadCountChange();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);

    if (notification.action_url) {
      navigate(notification.action_url);
      onClose();
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

      if (action === 'accept_mentorship' || action === 'view_profile' || action === 'view_post') {
        if (notification.action_url) {
          navigate(notification.action_url);
          onClose();
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
                deleteNotification(notification.id);
              }}
              className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
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
            className="mt-2 w-full px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
          >
            View Profile
          </button>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
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
          <div className="text-center py-12 px-4">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-sm text-gray-500">You're all caught up!</p>
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
          <button className="w-full text-center text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
