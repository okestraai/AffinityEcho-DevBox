import React from 'react';
import { Bell, TestTube } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import {
  createNotification,
  notifyNewFollower,
  notifyForumComment,
  notifyMentorshipRequest,
} from '../../../lib/notifications';

export function TestNotificationButton() {
  const { user } = useAuth();

  const createTestNotifications = async () => {
    if (!user?.id) return;

    const testNotifications = [
      {
        type: 'follow',
        title: 'New Follower',
        message: 'TestUser123 started following you',
        actionUrl: '/dashboard/profile',
      },
      {
        type: 'forum_post',
        title: 'New post from someone you follow',
        message: 'TechLeader_Sarah posted: "Best practices for technical interviews"',
        actionUrl: '/dashboard/forums',
      },
      {
        type: 'forum_comment',
        title: 'New comment on your post',
        message: 'DataScience_Miguel commented on "Career advice needed"',
        actionUrl: '/dashboard/forums',
      },
      {
        type: 'forum_like',
        title: 'Someone liked your post',
        message: 'Product_Manager_Lisa liked "How to transition to PM?"',
        actionUrl: '/dashboard/forums',
      },
      {
        type: 'nook_post',
        title: 'New post in Black Tech Leaders',
        message: 'ExperiencedEngineer posted in your nook',
        actionUrl: '/dashboard/nooks',
      },
      {
        type: 'mentorship_request',
        title: 'New Mentorship Request',
        message: 'AspiringEngineer_Jay has requested you as their mentor',
        actionUrl: '/dashboard/mentorship',
      },
      {
        type: 'referral_connection',
        title: 'New Referral Connection Request',
        message: 'GrowingAnalyst_Priya requested to connect for "Software Engineer at Google"',
        actionUrl: '/dashboard/messages',
      },
      {
        type: 'identity_reveal',
        title: 'Identity Revealed',
        message: 'Anonymous_User revealed their identity as Sarah Johnson',
        actionUrl: '/dashboard/messages',
      },
    ];

    for (const notif of testNotifications) {
      await createNotification({
        userId: user.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        actionUrl: notif.actionUrl,
      });
    }

    alert('Created 8 test notifications!');
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <button
      onClick={createTestNotifications}
      className="fixed bottom-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-yellow-500 text-white rounded-xl shadow-lg hover:bg-yellow-600 transition-colors font-medium"
      title="Create test notifications (dev only)"
    >
      <TestTube className="w-5 h-5" />
      <span className="hidden sm:inline">Test Notifications</span>
    </button>
  );
}
