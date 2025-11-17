import { supabase } from './supabase';

export interface CreateNotificationParams {
  userId: string;
  actorId?: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: any;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const { data, error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      actor_id: params.actorId || null,
      type: params.type,
      title: params.title,
      message: params.message,
      action_url: params.actionUrl || null,
      reference_id: params.referenceId || null,
      reference_type: params.referenceType || null,
      metadata: params.metadata || {},
      is_read: false,
      action_taken: false,
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

export async function notifyFollowers(
  actorId: string,
  actorUsername: string,
  contentType: 'forum' | 'nook' | 'referral',
  contentTitle: string,
  contentId: string
) {
  try {
    const { data: followers, error } = await supabase
      .from('user_follows')
      .select('follower_id')
      .eq('following_id', actorId);

    if (error) throw error;

    if (followers && followers.length > 0) {
      const notifications = followers.map((follow) => ({
        user_id: follow.follower_id,
        actor_id: actorId,
        type: `${contentType}_post`,
        title: `${actorUsername} posted in ${contentType}`,
        message: contentTitle,
        action_url: `/dashboard/${contentType}s`,
        reference_id: contentId,
        reference_type: contentType,
        metadata: { actor_username: actorUsername },
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return { success: true };
  } catch (error) {
    console.error('Error notifying followers:', error);
    return { success: false, error };
  }
}

export async function notifyNewFollower(followedUserId: string, followerId: string, followerUsername: string) {
  return createNotification({
    userId: followedUserId,
    actorId: followerId,
    type: 'follow',
    title: 'New Follower',
    message: `${followerUsername} started following you`,
    actionUrl: '/dashboard/profile',
    metadata: { follower_username: followerUsername },
  });
}

export async function notifyForumComment(
  postAuthorId: string,
  commenterId: string,
  commenterUsername: string,
  postTitle: string,
  postId: string
) {
  return createNotification({
    userId: postAuthorId,
    actorId: commenterId,
    type: 'forum_comment',
    title: 'New comment on your post',
    message: `${commenterUsername} commented on "${postTitle}"`,
    actionUrl: '/dashboard/forums',
    referenceId: postId,
    referenceType: 'forum',
    metadata: { commenter_username: commenterUsername, post_title: postTitle },
  });
}

export async function notifyForumLike(
  postAuthorId: string,
  likerId: string,
  likerUsername: string,
  postTitle: string,
  postId: string
) {
  return createNotification({
    userId: postAuthorId,
    actorId: likerId,
    type: 'forum_like',
    title: 'Someone liked your post',
    message: `${likerUsername} liked "${postTitle}"`,
    actionUrl: '/dashboard/forums',
    referenceId: postId,
    referenceType: 'forum',
    metadata: { liker_username: likerUsername, post_title: postTitle },
  });
}

export async function notifyNookPost(
  nookMemberIds: string[],
  posterId: string,
  posterUsername: string,
  nookName: string,
  postId: string
) {
  try {
    const notifications = nookMemberIds
      .filter(id => id !== posterId)
      .map((memberId) => ({
        user_id: memberId,
        actor_id: posterId,
        type: 'nook_post',
        title: `New post in ${nookName}`,
        message: `${posterUsername} posted in ${nookName}`,
        action_url: '/dashboard/nooks',
        reference_id: postId,
        reference_type: 'nook',
        metadata: { poster_username: posterUsername, nook_name: nookName },
      }));

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }

    return { success: true };
  } catch (error) {
    console.error('Error notifying nook members:', error);
    return { success: false, error };
  }
}

export async function notifyMentorshipRequest(
  mentorId: string,
  requesterId: string,
  requesterUsername: string,
  requestId: string
) {
  return createNotification({
    userId: mentorId,
    actorId: requesterId,
    type: 'mentorship_request',
    title: 'New Mentorship Request',
    message: `${requesterUsername} has requested you as their mentor`,
    actionUrl: '/dashboard/mentorship',
    referenceId: requestId,
    referenceType: 'mentorship',
    metadata: { requester_username: requesterUsername },
  });
}

export async function notifyMentorshipAccepted(
  menteeId: string,
  mentorId: string,
  mentorUsername: string,
  requestId: string
) {
  return createNotification({
    userId: menteeId,
    actorId: mentorId,
    type: 'mentorship_accepted',
    title: 'Mentorship Request Accepted',
    message: `${mentorUsername} accepted your mentorship request!`,
    actionUrl: '/dashboard/mentorship',
    referenceId: requestId,
    referenceType: 'mentorship',
    metadata: { mentor_username: mentorUsername },
  });
}

export async function notifyReferralComment(
  postAuthorId: string,
  commenterId: string,
  commenterUsername: string,
  postTitle: string,
  postId: string
) {
  return createNotification({
    userId: postAuthorId,
    actorId: commenterId,
    type: 'referral_comment',
    title: 'New comment on your referral',
    message: `${commenterUsername} commented on "${postTitle}"`,
    actionUrl: '/dashboard/referrals',
    referenceId: postId,
    referenceType: 'referral',
    metadata: { commenter_username: commenterUsername, post_title: postTitle },
  });
}

export async function notifyReferralConnection(
  postAuthorId: string,
  requesterId: string,
  requesterUsername: string,
  postTitle: string,
  connectionId: string
) {
  return createNotification({
    userId: postAuthorId,
    actorId: requesterId,
    type: 'referral_connection',
    title: 'New Referral Connection Request',
    message: `${requesterUsername} requested to connect for "${postTitle}"`,
    actionUrl: '/dashboard/messages',
    referenceId: connectionId,
    referenceType: 'referral',
    metadata: { requester_username: requesterUsername, post_title: postTitle },
  });
}

export async function notifyIdentityReveal(
  recipientId: string,
  revealerId: string,
  revealerRealName: string,
  revealerUsername: string
) {
  return createNotification({
    userId: recipientId,
    actorId: revealerId,
    type: 'identity_reveal',
    title: 'Identity Revealed',
    message: `${revealerUsername} revealed their identity as ${revealerRealName}`,
    actionUrl: '/dashboard/messages',
    metadata: { revealer_username: revealerUsername, real_name: revealerRealName },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_unread_notification_count', {
      p_user_id: userId,
    });

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

export async function followUser(followerId: string, followingId: string, followerUsername: string) {
  try {
    const { error: followError } = await supabase.from('user_follows').insert({
      follower_id: followerId,
      following_id: followingId,
    });

    if (followError) throw followError;

    await notifyNewFollower(followingId, followerId, followerUsername);

    return { success: true };
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error };
  }
}

export async function unfollowUser(followerId: string, followingId: string) {
  try {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error };
  }
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_following', {
      p_follower_id: followerId,
      p_following_id: followingId,
    });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}
