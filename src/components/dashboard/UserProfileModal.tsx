import React, { useState } from 'react';
import { X, MessageCircle, UserPlus, UserMinus, Award, TrendingUp, Calendar, Shield, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile, mockUserProfiles } from '../../data/mockForums';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onChat: (userId: string) => void;
}

export function UserProfileModal({ isOpen, onClose, userId, onChat }: Props) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  if (!isOpen) return null;

  // Find user profile data - in real app, this would be fetched based on userId
  const profileUser = mockUserProfiles.find(profile => profile.id === userId) || mockUserProfiles[0];

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    console.log(`${isFollowing ? 'Unfollowed' : 'Followed'} user:`, userId);
  };

  const handleChat = () => {
    onChat(userId);
    onClose();
  };

  const formatJoinDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
              {profileUser.avatar}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{profileUser.username}</h2>
            <p className="text-sm text-gray-600 mb-2">{profileUser.demographics.careerLevel}</p>
            {profileUser.demographics.company && (
              <p className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full inline-block font-medium">
                {profileUser.demographics.company}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{profileUser.stats.postsCreated}</div>
                <div className="text-xs text-gray-500">Posts</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">{profileUser.stats.commentsPosted}</div>
                <div className="text-xs text-gray-500">Comments</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600">{profileUser.stats.helpfulReactions}</div>
                <div className="text-xs text-gray-500">Helpful</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-orange-600">{profileUser.stats.nooksJoined}</div>
                <div className="text-xs text-gray-500">Nooks</div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Badges</h4>
            <div className="flex flex-wrap gap-2">
              {profileUser.badges.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                  <Award className="w-3 h-3" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Affinity Groups */}
          {profileUser.demographics.affinityTags && profileUser.demographics.affinityTags.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Communities</h4>
              <div className="space-y-2">
                {profileUser.demographics.affinityTags.map((tag) => (
                  <div key={tag} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                    <span className="text-sm">💜</span>
                    <span className="text-sm text-purple-700 font-medium">{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Member Since */}
          <div className="flex items-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-100">
            <Calendar className="w-4 h-4" />
            <span>Member since {formatJoinDate(profileUser.joinedDate)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleFollow}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
            
            <button
              onClick={handleChat}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
          </div>

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