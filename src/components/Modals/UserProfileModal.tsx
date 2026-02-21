import { useState, useEffect } from 'react';
import { resolveDisplayName } from '../../utils/nameUtils';
import { X, MessageCircle, UserPlus, UserMinus, Calendar, Shield, Loader2 } from 'lucide-react';
import {
  GetUserProfileById,
  GetUserStats,
  GetUserBadges,
  CheckFollowingStatus,
  FollowUser,
  UnfollowUser
} from '../../../api/profileApis';
import { useAuth } from '../../hooks/useAuth';

interface UserProfileData {
  id: string;
  username: string;
  display_name?: string;
  avatar: string;
  bio?: string;
  // API returns these at top level (not nested under demographics)
  careerLevel?: string;
  company?: string;
  affinityTags?: string[];
  demographics?: {
    careerLevel?: string;
    company?: string;
    affinityTags?: string[];
  };
  joinedDate?: string;
  isFollowing?: boolean;
  stats?: {
    postsCreated?: number;
    commentsPosted?: number;
    helpfulReactions?: number;
    reputationScore?: number;
  };
}

interface UserStats {
  postsCreated: number;
  commentsPosted: number;
  helpfulReactions: number;
  reputationScore: number;
  topicsCreated: number;
  nooksJoined: number;
}

interface Badge {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  earned?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onChat: (userId: string) => void;
}

export function UserProfileModal({ isOpen, onClose, userId, onChat }: Props) {
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === userId;
  const [profileUser, setProfileUser] = useState<UserProfileData | null>(null);
  const [stats, setStats] = useState<UserStats>({ postsCreated: 0, commentsPosted: 0, helpfulReactions: 0, reputationScore: 0, topicsCreated: 0, nooksJoined: 0 });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, statsRes, badgesRes, followRes] = await Promise.all([
          GetUserProfileById(userId).catch(() => null),
          GetUserStats(userId).catch(() => null),
          GetUserBadges(userId).catch(() => null),
          CheckFollowingStatus(userId).catch(() => null)
        ]);

        const profile = profileRes;
        if (profile?.id || profile?.username) {
          setProfileUser(profile);
        }

        if (statsRes || profile?.stats) {
          const s = statsRes?.stats ?? statsRes ?? profile?.stats;
          setStats({
            postsCreated: s?.postsCreated || 0,
            commentsPosted: s?.commentsPosted || 0,
            helpfulReactions: s?.helpfulReactions || 0,
            reputationScore: s?.reputationScore || 0,
            topicsCreated: s?.topicsCreated || 0,
            nooksJoined: s?.nooksJoined || 0
          });
        }

        if (badgesRes) {
          setBadges(badgesRes.badges || (Array.isArray(badgesRes) ? badgesRes : []));
        }

        if (followRes) {
          setIsFollowing(followRes.isFollowing || profile?.isFollowing || false);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleFollow = async () => {
    try {
      setFollowLoading(true);
      if (isFollowing) {
        await UnfollowUser(userId);
        setIsFollowing(false);
      } else {
        await FollowUser(userId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleChat = () => {
    onChat(userId);
    onClose();
  };

  const formatJoinDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 sm:p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 sm:p-8 text-center">
          <p className="text-gray-500 mb-4">Could not load this profile.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Profile Header */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
              {profileUser.avatar}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{resolveDisplayName(profileUser.display_name, profileUser.username)}</h2>
            {(profileUser.careerLevel || profileUser.demographics?.careerLevel) && (
              <p className="text-sm text-gray-600 mb-2">{profileUser.careerLevel || profileUser.demographics?.careerLevel}</p>
            )}
            {(profileUser.company || profileUser.demographics?.company) && (
              <p className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full inline-block font-medium">
                {profileUser.company || profileUser.demographics?.company}
              </p>
            )}
          </div>

          {/* Bio */}
          {profileUser.bio && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">About</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{profileUser.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Activity</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{stats.postsCreated}</div>
                <div className="text-xs text-gray-500">Posts</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">{stats.commentsPosted}</div>
                <div className="text-xs text-gray-500">Comments</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600">{stats.helpfulReactions}</div>
                <div className="text-xs text-gray-500">Helpful</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-yellow-600">{stats.reputationScore}</div>
                <div className="text-xs text-gray-500">Reputation</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-indigo-600">{stats.topicsCreated}</div>
                <div className="text-xs text-gray-500">Topics</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-orange-600">{stats.nooksJoined}</div>
                <div className="text-xs text-gray-500">Nooks</div>
              </div>
            </div>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Badges</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`text-center p-2 rounded-lg border transition-all ${
                      badge.earned !== false
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                    title={badge.description}
                  >
                    <div className="text-xl mb-1">{badge.icon || '🏅'}</div>
                    <p className="text-xs font-medium text-gray-700">{badge.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affinity Groups */}
          {((profileUser.affinityTags && profileUser.affinityTags.length > 0) || (profileUser.demographics?.affinityTags && profileUser.demographics.affinityTags.length > 0)) && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Communities</h4>
              <div className="space-y-2">
                {(profileUser.affinityTags || profileUser.demographics?.affinityTags || []).map((tag) => (
                  <div key={tag} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                    <span className="text-sm">💜</span>
                    <span className="text-sm text-purple-700 font-medium">{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Member Since */}
          {profileUser.joinedDate && (
            <div className="flex items-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-100">
              <Calendar className="w-4 h-4" />
              <span>Member since {formatJoinDate(profileUser.joinedDate)}</span>
            </div>
          )}

          {/* Action Buttons - hidden for own profile */}
          {!isOwnProfile && (
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {followLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <UserMinus className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>

              <button
                type="button"
                onClick={handleChat}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">
                This user has chosen to share their profile publicly while maintaining anonymity
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
