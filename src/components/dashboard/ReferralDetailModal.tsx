import React, { useState, useEffect } from 'react';
import {
  X,
  Briefcase,
  Building,
  ExternalLink,
  MapPin,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  AlertCircle,
  CheckCircle,
  Send,
  User,
  Award,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import type { ReferralPost as DBReferralPost, UserProfile } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  referralId: string;
  onRefresh: () => void;
}

interface ReferralWithProfile extends DBReferralPost {
  author: UserProfile;
  isLiked: boolean;
  isBookmarked: boolean;
}

export function ReferralDetailModal({ isOpen, onClose, referralId, onRefresh }: Props) {
  const { user } = useAuth();
  const [referral, setReferral] = useState<ReferralWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [sendingConnection, setSendingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');

  useEffect(() => {
    if (isOpen && referralId) {
      fetchReferralDetails();
      checkConnectionStatus();
    }
  }, [isOpen, referralId]);

  const fetchReferralDetails = async () => {
    try {
      setLoading(true);

      const { data: post, error: postError } = await supabase
        .from('referral_posts')
        .select('*')
        .eq('id', referralId)
        .single();

      if (postError) throw postError;

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', post.user_id)
        .maybeSingle();

      if (profileError) throw profileError;

      let isLiked = false;
      let isBookmarked = false;

      if (user?.id) {
        const { data: like } = await supabase
          .from('referral_likes')
          .select('id')
          .eq('referral_post_id', referralId)
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: bookmark } = await supabase
          .from('referral_bookmarks')
          .select('id')
          .eq('referral_post_id', referralId)
          .eq('user_id', user.id)
          .maybeSingle();

        isLiked = !!like;
        isBookmarked = !!bookmark;
      }

      setReferral({
        ...post,
        author: profile || {
          id: post.user_id,
          username: 'Anonymous User',
          avatar: '👤',
          skills: [],
          created_at: post.created_at,
          updated_at: post.updated_at
        },
        isLiked,
        isBookmarked
      });
    } catch (err) {
      console.error('Error fetching referral details:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('referral_connections')
        .select('status')
        .eq('referral_post_id', referralId)
        .eq('sender_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConnectionStatus(data.status);
      }
    } catch (err) {
      console.error('Error checking connection status:', err);
    }
  };

  const handleSendConnection = async () => {
    if (!user?.id || !referral) return;

    try {
      setSendingConnection(true);

      const { error } = await supabase
        .from('referral_connections')
        .insert([{
          referral_post_id: referralId,
          sender_id: user.id,
          receiver_id: referral.user_id,
          message: connectionMessage.trim() || null,
          status: 'pending',
          identity_revealed: false
        }]);

      if (error) throw error;

      setConnectionStatus('pending');
      setShowConnectionForm(false);
      setConnectionMessage('');
      onRefresh();
    } catch (err) {
      console.error('Error sending connection:', err);
      alert('Failed to send connection request. Please try again.');
    } finally {
      setSendingConnection(false);
    }
  };

  const handleLike = async () => {
    if (!user?.id || !referral) return;

    try {
      if (referral.isLiked) {
        await supabase
          .from('referral_likes')
          .delete()
          .eq('referral_post_id', referralId)
          .eq('user_id', user.id);

        setReferral({
          ...referral,
          isLiked: false,
          likes_count: referral.likes_count - 1
        });
      } else {
        await supabase
          .from('referral_likes')
          .insert({ referral_post_id: referralId, user_id: user.id });

        setReferral({
          ...referral,
          isLiked: true,
          likes_count: referral.likes_count + 1
        });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleBookmark = async () => {
    if (!user?.id || !referral) return;

    try {
      if (referral.isBookmarked) {
        await supabase
          .from('referral_bookmarks')
          .delete()
          .eq('referral_post_id', referralId)
          .eq('user_id', user.id);

        setReferral({
          ...referral,
          isBookmarked: false,
          bookmarks_count: referral.bookmarks_count - 1
        });
      } else {
        await supabase
          .from('referral_bookmarks')
          .insert({ referral_post_id: referralId, user_id: user.id });

        setReferral({
          ...referral,
          isBookmarked: true,
          bookmarks_count: referral.bookmarks_count + 1
        });
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : referral ? (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-xl">
                    {referral.author.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{referral.author.username}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      {referral.author.job_title && (
                        <>
                          <span>{referral.author.job_title}</span>
                          <span>•</span>
                        </>
                      )}
                      {referral.author.company && (
                        <>
                          <span>{referral.author.company}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{formatTimeAgo(referral.created_at)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  referral.type === 'request'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {referral.type === 'request' ? 'Seeking Referral' : 'Offering Referrals'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  referral.status === 'open'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {referral.status === 'open' ? 'Open' : 'Closed'}
                </span>
                {referral.type === 'offer' && referral.available_slots !== null && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    {referral.available_slots}/{referral.total_slots} slots available
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{referral.title}</h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Building className="w-4 h-4" />
                    <span className="font-medium">{referral.company}</span>
                  </div>

                  {referral.job_title && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Briefcase className="w-4 h-4" />
                      <span>{referral.job_title}</span>
                    </div>
                  )}
                </div>

                {referral.job_link && (
                  <a
                    href={referral.job_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Job Posting</span>
                  </a>
                )}
              </div>

              <div className="prose prose-sm max-w-none mb-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{referral.description}</p>
              </div>

              {referral.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {referral.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {referral.author.bio && (
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">About {referral.author.username}</span>
                  </div>
                  <p className="text-sm text-blue-800">{referral.author.bio}</p>

                  {referral.author.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {referral.author.skills.map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {referral.author.years_experience && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-blue-700">
                      <Award className="w-4 h-4" />
                      <span>{referral.author.years_experience} years of experience</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between py-4 border-t border-gray-200">
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{referral.views_count}</span>
                  </div>
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1 transition-colors ${
                      referral.isLiked ? 'text-red-500' : 'hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${referral.isLiked ? 'fill-current' : ''}`} />
                    <span>{referral.likes_count}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{referral.comments_count}</span>
                  </div>
                  <button
                    onClick={handleBookmark}
                    className={`flex items-center gap-1 transition-colors ${
                      referral.isBookmarked ? 'text-yellow-500' : 'hover:text-yellow-500'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${referral.isBookmarked ? 'fill-current' : ''}`} />
                    <span>{referral.bookmarks_count}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {user?.id === referral.user_id ? (
                <div className="text-center py-3">
                  <p className="text-sm text-gray-600">This is your post</p>
                </div>
              ) : connectionStatus === 'pending' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Connection Request Pending</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Waiting for the poster to respond to your connection request. Once accepted, you'll be able to discuss the referral opportunity.
                  </p>
                </div>
              ) : connectionStatus === 'accepted' ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Connection Accepted!</span>
                  </div>
                  <p className="text-sm text-green-700 text-center mb-3">
                    Your connection request was accepted. Go to your Connection Requests to manage identity reveal and messaging.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-900">Anonymous Mode Active</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Your identity is currently hidden. Both parties must agree to reveal identities before you can see each other's details.
                    </p>
                  </div>
                </div>
              ) : connectionStatus === 'rejected' ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <X className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">Connection Request Declined</span>
                  </div>
                  <p className="text-sm text-red-700">
                    Your connection request was declined. You may explore other opportunities.
                  </p>
                </div>
              ) : showConnectionForm ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-900">Connection Request Info</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Sending a connection request initiates contact with the poster. Identities remain anonymous until both parties agree to reveal them.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Introduce Yourself (Optional)
                    </label>
                    <textarea
                      value={connectionMessage}
                      onChange={(e) => setConnectionMessage(e.target.value)}
                      placeholder="Tell them why you're interested in this opportunity and what makes you a good fit..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConnectionForm(false)}
                      className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendConnection}
                      disabled={sendingConnection}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {sendingConnection ? 'Sending...' : 'Send Connection Request'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowConnectionForm(true)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Send className="w-4 h-4" />
                    Send Connection Request
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Connect with the poster to discuss this referral opportunity
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Referral not found</p>
          </div>
        )}
      </div>
    </div>
  );
}
