import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageCircle, UserPlus, UserMinus, Calendar,
  Shield, Loader2, MapPin, Briefcase, ExternalLink,
  FileText, Users, Lightbulb, Heart, Eye, MessageSquare,
  Zap, Share2, Bookmark, Star,
} from 'lucide-react';
import { ClapIcon } from '../../shared/ClapIcon';
import {
  GetFullUserProfile,
  GetUserProfileById,
  GetUserStats,
  CheckFollowingStatus,
  FollowUser,
  UnfollowUser,
} from '../../../../api/profileApis';
import { ToggleFeedReaction, ToggleBookmark } from '../../../../api/feedApis';
import { ForumTopicsReactions, ToggleTopicBookmark } from '../../../../api/forumApis';
import { useAuth } from '../../../hooks/useAuth';
import { resolveDisplayName } from '../../../utils/nameUtils';
import { showToast } from '../../../Helper/ShowToast';

// ---------------------------------------------------------------------------
// Types (matching the updated full profile API response)
// ---------------------------------------------------------------------------
interface ProfileData {
  id: string;
  username: string;
  display_name?: string;
  avatar: string;
  bio?: string;
  job_title?: string;
  years_experience?: number;
  skills?: string[];
  linkedinUrl?: string;
  location?: string;
  joinedDate?: string;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  followersCount?: number;
  followingCount?: number;
  affinityTags?: string[];
  stats?: {
    postsCreated?: number;
    commentsPosted?: number;
    helpfulReactions?: number;
    reputationScore?: number;
  };
}

interface ActivityPost {
  id: string;
  content_id: string;
  is_anonymous: boolean;
  content: { text: string; tags?: string[] };
  engagement: { likes: number; comments: number; shares?: number; views?: number };
  reaction_counts: { heard: number; validated: number; inspired: number };
  user_liked: boolean;
  user_bookmarked: boolean;
  user_reactions: { heard: boolean; validated: boolean; inspired: boolean };
  created_at: string;
}

interface ActivityTopic {
  id: string;
  content_id: string;
  is_anonymous: boolean;
  content: { title: string; text: string; forum_name?: string; tags?: string[] };
  engagement: { likes: number; comments: number };
  reaction_counts: { seen?: number; heard?: number; validated?: number; inspired?: number };
  user_liked: boolean;
  user_bookmarked: boolean;
  user_reactions: { seen?: boolean; heard?: boolean; validated?: boolean; inspired?: boolean };
  created_at?: string;
}

interface ActivityNook {
  id: string;
  content: { title: string; urgency?: string; description?: string };
  time_left?: string;
}

type ActivityTab = 'posts' | 'topics' | 'nooks';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function formatJoinDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === userId;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<ActivityPost[]>([]);
  const [topics, setTopics] = useState<ActivityTopic[]>([]);
  const [nooks, setNooks] = useState<ActivityNook[]>([]);
  const [identityRevealed, setIdentityRevealed] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActivityTab>('posts');

  useEffect(() => {
    if (!userId) return;
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const fullRes = await GetFullUserProfile(userId).catch(() => null);

      if (fullRes?.data?.profile || fullRes?.profile) {
        const data = fullRes?.data ?? fullRes;
        const p = data.profile;
        setProfile({
          id: p.id,
          username: p.username,
          display_name: p.display_name,
          avatar: p.avatar,
          bio: p.bio,
          job_title: p.job_title || p.jobTitle,
          years_experience: p.years_experience ?? p.yearsExperience,
          skills: p.skills || [],
          linkedinUrl: p.linkedinUrl || p.linkedin_url,
          location: p.location,
          joinedDate: p.joinedDate || p.created_at,
          isFollowing: p.isFollowing,
          isFollowedBy: p.isFollowedBy,
          followersCount: p.followersCount ?? p.followers_count ?? 0,
          followingCount: p.followingCount ?? p.following_count ?? 0,
          affinityTags: p.affinityTags || p.affinity_tags || [],
          stats: p.stats,
        });
        setIsFollowing(p.isFollowing ?? false);
        setIdentityRevealed(data.identity_revealed ?? false);

        const activity = data.recent_activity ?? {};
        // Show all posts (filter anonymous — anonymous posts don't appear attributed)
        setPosts((activity.posts ?? []).filter((post: ActivityPost) => !post.is_anonymous));
        // Show ALL topics the backend returns — backend already handles privacy
        setTopics(activity.topics ?? []);
        setNooks(activity.nooks ?? []);
      } else {
        const [profileRes, statsRes, followRes] = await Promise.all([
          GetUserProfileById(userId).catch(() => null),
          GetUserStats(userId).catch(() => null),
          isOwnProfile ? Promise.resolve(null) : CheckFollowingStatus(userId).catch(() => null),
        ]);
        if (profileRes) {
          const s = statsRes?.stats ?? statsRes ?? {};
          setProfile({
            ...profileRes,
            stats: {
              postsCreated: s.postsCreated || 0,
              commentsPosted: s.commentsPosted || 0,
              helpfulReactions: s.helpfulReactions || 0,
              reputationScore: s.reputationScore || 0,
            },
          });
          setIsFollowing(followRes?.isFollowing || profileRes?.isFollowing || false);
        }
      }
    } catch {
      showToast('Could not load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!userId) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await UnfollowUser(userId);
        setIsFollowing(false);
        setProfile((p) => p ? { ...p, followersCount: Math.max(0, (p.followersCount ?? 1) - 1) } : p);
      } else {
        await FollowUser(userId);
        setIsFollowing(true);
        setProfile((p) => p ? { ...p, followersCount: (p.followersCount ?? 0) + 1 } : p);
      }
    } catch {
      showToast('Failed to update follow status', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleChat = () => {
    navigate('/dashboard/messages', { state: { startChatWith: userId, contextType: 'regular' } });
  };

  // ---- post interactions ----
  const handlePostReact = useCallback(async (postId: string, type: 'heard' | 'validated' | 'inspired') => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const wasReacted = p.user_reactions[type];
      return {
        ...p,
        reaction_counts: { ...p.reaction_counts, [type]: p.reaction_counts[type] + (wasReacted ? -1 : 1) },
        user_reactions: { ...p.user_reactions, [type]: !wasReacted },
      };
    }));
    try {
      await ToggleFeedReaction('post', postId, type);
    } catch {
      // revert on failure
      setPosts((prev) => prev.map((p) => {
        if (p.id !== postId) return p;
        const isReacted = p.user_reactions[type];
        return {
          ...p,
          reaction_counts: { ...p.reaction_counts, [type]: p.reaction_counts[type] + (isReacted ? -1 : 1) },
          user_reactions: { ...p.user_reactions, [type]: !isReacted },
        };
      }));
    }
  }, []);

  const handlePostBookmark = useCallback(async (postId: string) => {
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, user_bookmarked: !p.user_bookmarked } : p
    ));
    try {
      await ToggleBookmark('post', postId);
      const post = posts.find((p) => p.id === postId);
      showToast(post && !post.user_bookmarked ? "Bookmark removed" : "Post bookmarked", "success");
    } catch {
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, user_bookmarked: !p.user_bookmarked } : p
      ));
      showToast("Failed to update bookmark", "error");
    }
  }, []);

  // ---- topic interactions ----
  const handleTopicReact = useCallback(async (topicId: string, type: 'seen' | 'heard' | 'validated' | 'inspired') => {
    setTopics((prev) => prev.map((t) => {
      if (t.id !== topicId) return t;
      const wasReacted = t.user_reactions[type];
      return {
        ...t,
        reaction_counts: { ...t.reaction_counts, [type]: (t.reaction_counts[type] ?? 0) + (wasReacted ? -1 : 1) },
        user_reactions: { ...t.user_reactions, [type]: !wasReacted },
      };
    }));
    try {
      await ForumTopicsReactions({ topicId, reactionType: type });
    } catch {
      setTopics((prev) => prev.map((t) => {
        if (t.id !== topicId) return t;
        const isReacted = t.user_reactions[type];
        return {
          ...t,
          reaction_counts: { ...t.reaction_counts, [type]: (t.reaction_counts[type] ?? 0) + (isReacted ? -1 : 1) },
          user_reactions: { ...t.user_reactions, [type]: !isReacted },
        };
      }));
    }
  }, []);

  const handleTopicBookmark = useCallback(async (topicId: string) => {
    setTopics((prev) => prev.map((t) =>
      t.id === topicId ? { ...t, user_bookmarked: !t.user_bookmarked } : t
    ));
    try {
      await ToggleTopicBookmark(topicId);
      const topic = topics.find((t) => t.id === topicId);
      showToast(topic && !topic.user_bookmarked ? "Bookmark removed" : "Topic bookmarked", "success");
    } catch {
      setTopics((prev) => prev.map((t) =>
        t.id === topicId ? { ...t, user_bookmarked: !t.user_bookmarked } : t
      ));
      showToast("Failed to update bookmark", "error");
    }
  }, []);

  // ---- loading / error states ----
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-44 bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 rounded-2xl animate-pulse" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-2 p-6 animate-pulse space-y-3">
          <div className="w-20 h-20 bg-gray-200 rounded-2xl" />
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="h-3 bg-gray-100 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center px-4">
        <p className="text-gray-500 mb-4">Profile not found.</p>
        <button type="button" onClick={() => navigate(-1)}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm font-medium">
          Go back
        </button>
      </div>
    );
  }

  const displayName = resolveDisplayName(profile.display_name, profile.username);
  const stats = profile.stats ?? {};

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Back */}
      <button type="button" onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors px-1">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* ── HERO CARD ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {/* Cover */}
        <div className="relative h-40 sm:h-48 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-500 overflow-hidden">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="absolute -bottom-px left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
          {identityRevealed && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/30">
              <Shield className="w-3.5 h-3.5" /> Identity Revealed
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 pb-5 -mt-12">
          {/* Avatar + actions row */}
          <div className="flex items-end justify-between mb-4">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center text-3xl sm:text-4xl select-none">
                {profile.avatar}
              </div>
              {profile.isFollowedBy && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] bg-indigo-100 text-indigo-600 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border border-indigo-200">
                  Follows you
                </span>
              )}
            </div>
            {!isOwnProfile && (
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={handleFollow} disabled={followLoading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 shadow-sm active:scale-95 ${
                    isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                  }`}>
                  {followLoading ? <Loader2 className="w-4 h-4 animate-spin" />
                    : isFollowing ? <UserMinus className="w-4 h-4" />
                    : <UserPlus className="w-4 h-4" />}
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
                <button type="button" onClick={handleChat}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm active:scale-95">
                  <MessageCircle className="w-4 h-4 text-indigo-500" />
                  Message
                </button>
              </div>
            )}
          </div>

          {/* Name + meta */}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{displayName}</h1>
          <p className="text-sm text-gray-400 font-medium">@{profile.username}</p>

          {/* Info pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {profile.job_title && (
              <div className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
                <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                {profile.job_title}
                {profile.years_experience !== undefined && (
                  <span className="text-gray-400">· {profile.years_experience}yr{profile.years_experience !== 1 ? 's' : ''}</span>
                )}
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                {profile.location}
              </div>
            )}
            {profile.joinedDate && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                Joined {formatJoinDate(profile.joinedDate)}
              </div>
            )}
          </div>

          {profile.bio && <p className="mt-4 text-sm text-gray-700 leading-relaxed">{profile.bio}</p>}

          {profile.affinityTags && profile.affinityTags.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Affinity Groups</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.affinityTags.map((tag) => (
                  <span key={tag} className="text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-100">
                    💜 {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <span key={skill} className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg border border-gray-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Followers / Following */}
        <div className="flex border-t border-gray-100">
          <div className="flex-1 py-4 text-center border-r border-gray-100">
            <div className="text-xl font-bold text-gray-900">{(profile.followersCount ?? 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">Followers</div>
          </div>
          <div className="flex-1 py-4 text-center">
            <div className="text-xl font-bold text-gray-900">{(profile.followingCount ?? 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">Following</div>
          </div>
        </div>

        {/* Stats */}
        {stats.postsCreated !== undefined && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Impact</p>
            <div className="flex gap-2">
              {[
                { icon: FileText, value: stats.postsCreated ?? 0, label: 'Posts', color: 'text-blue-600' },
                { icon: MessageSquare, value: stats.commentsPosted ?? 0, label: 'Comments', color: 'text-green-600' },
                { icon: Heart, value: stats.helpfulReactions ?? 0, label: 'Helpful', color: 'text-pink-600' },
                { icon: Star, value: stats.reputationScore ?? 0, label: 'Rep', color: 'text-amber-500' },
              ].map(({ icon: Icon, value, label, color }) => (
                <div key={label} className="flex flex-col items-center gap-0.5 bg-gray-50 rounded-2xl p-3 flex-1">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className={`text-lg font-bold ${color}`}>{value.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-500 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── ACTIVITY TABS ─────────────────────────────────────────── */}
      <div className="mt-4 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {([
            { id: 'posts' as const, label: 'Posts', icon: FileText, count: posts.length },
            { id: 'topics' as const, label: 'Topics', icon: Users, count: topics.length },
            { id: 'nooks' as const, label: 'Nooks', icon: Zap, count: nooks.length },
          ]).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold transition-all border-b-2 ${
                  isActive ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── POST CARDS ─────────────────── */}
        {activeTab === 'posts' && (
          posts.length === 0
            ? <EmptyState icon={FileText} message="No public posts yet" />
            : posts.map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/dashboard/feeds/post/${post.content_id}`)}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border-b border-gray-100 last:border-b-0 cursor-pointer"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 select-none">
                        {profile.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{displayName}</span>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                            <FileText className="w-3 h-3" /><span>Post</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{timeAgo(post.created_at)}</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-800 leading-relaxed mb-3">{post.content.text}</p>

                  {post.content.tags && post.content.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {post.content.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reaction counts bar */}
                <div className="px-4 py-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-red-500" />
                        <span>{post.reaction_counts.heard}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <ClapIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>{post.reaction_counts.validated}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
                        <span>{post.reaction_counts.inspired}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs">{post.engagement.comments} comments</span>
                      {(post.engagement.shares ?? 0) > 0 && (
                        <span className="text-xs">{post.engagement.shares} shares</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="px-3 sm:px-4 py-2 border-t border-gray-100">
                  <div className="flex items-center justify-around gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePostReact(post.id, 'heard'); }}
                      className={`p-2 rounded-lg hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95 ${post.user_reactions.heard ? 'text-red-500 bg-red-50' : 'text-gray-500'}`}
                      title="Heard">
                      <Heart className={`w-5 h-5 transition-transform duration-200 ${post.user_reactions.heard ? 'fill-red-500 animate-reaction-pop' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePostReact(post.id, 'validated'); }}
                      className={`p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-95 ${post.user_reactions.validated ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
                      title="Validated">
                      <ClapIcon className={`w-5 h-5 transition-transform duration-200 ${post.user_reactions.validated ? 'animate-reaction-pop' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePostReact(post.id, 'inspired'); }}
                      className={`p-2 rounded-lg hover:bg-yellow-50 transition-all duration-200 hover:scale-110 active:scale-95 ${post.user_reactions.inspired ? 'text-yellow-500 bg-yellow-50' : 'text-gray-500'}`}
                      title="Inspired">
                      <Lightbulb className={`w-5 h-5 transition-transform duration-200 ${post.user_reactions.inspired ? 'fill-yellow-500 animate-reaction-pop' : ''}`} />
                    </button>
                    <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/feeds/post/${post.content_id}`); }}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      title="Comment">
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => e.stopPropagation()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Share">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePostBookmark(post.id); }}
                      className={`p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95 ${post.user_bookmarked ? 'text-amber-600 bg-amber-50' : 'text-gray-500'}`}
                      title={post.user_bookmarked ? 'Saved' : 'Save'}>
                      <Bookmark className={`w-5 h-5 transition-transform duration-200 ${post.user_bookmarked ? 'fill-amber-600 animate-reaction-pop' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))
        )}

        {/* ── TOPIC CARDS ───────────── */}
        {activeTab === 'topics' && (
          topics.length === 0
            ? <EmptyState icon={Users} message="No topics yet" />
            : <div className="space-y-4 p-4">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => navigate(`/dashboard/forums/topic/${topic.content_id}`)}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-gray-200/50 hover:shadow-lg hover:border-purple-300 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/10 to-blue-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 rounded-xl flex items-center justify-center text-base shadow-sm border border-purple-200/50 flex-shrink-0 select-none">
                        {topic.is_anonymous ? '👤' : profile.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs text-purple-700 font-bold bg-gradient-to-r from-purple-100 to-indigo-100 px-2.5 py-1 rounded-full border border-purple-200">
                            {topic.is_anonymous ? 'Anonymous' : displayName}
                          </span>
                          {topic.content.forum_name && (
                            <span className="text-xs text-blue-600 font-medium">{topic.content.forum_name}</span>
                          )}
                          <span className="text-gray-400 text-xs">• {timeAgo(topic.created_at)}</span>
                        </div>
                        <p className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-purple-700 transition-colors leading-tight break-words">
                          {topic.content.title}
                        </p>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2 break-words">
                          {topic.content.text}
                        </p>
                        {topic.content.tags && topic.content.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {topic.content.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">#{tag}</span>
                            ))}
                            {topic.content.tags.length > 3 && (
                              <span className="text-xs text-gray-400">+{topic.content.tags.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        {([
                          { key: 'seen', Icon: Eye, active: 'text-green-600 bg-green-50', hover: 'hover:text-green-600 hover:bg-green-50' },
                          { key: 'heard', Icon: Heart, active: 'text-red-500 bg-red-50', hover: 'hover:text-red-500 hover:bg-red-50' },
                          { key: 'validated', Icon: ClapIcon, active: 'text-blue-600 bg-blue-50', hover: 'hover:text-blue-600 hover:bg-blue-50' },
                          { key: 'inspired', Icon: Lightbulb, active: 'text-yellow-500 bg-yellow-50', hover: 'hover:text-yellow-500 hover:bg-yellow-50' },
                        ] as const).map(({ key, Icon, active, hover }) => (
                          <button
                            key={key}
                            onClick={(e) => { e.stopPropagation(); handleTopicReact(topic.id, key); }}
                            className={`flex items-center gap-1 transition-all duration-200 font-medium hover:scale-110 active:scale-95 px-2 py-1.5 rounded-lg text-xs ${topic.user_reactions[key] ? active : `text-gray-500 ${hover}`}`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${topic.user_reactions[key] ? 'fill-current' : ''}`} />
                            <span>{topic.reaction_counts[key] ?? 0}</span>
                          </button>
                        ))}
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-all text-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{topic.engagement.comments}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTopicBookmark(topic.id); }}
                          className={`flex items-center gap-1 transition-all duration-200 hover:scale-110 active:scale-95 px-2 py-1.5 rounded-lg text-xs ${topic.user_bookmarked ? 'text-amber-500 bg-amber-50' : 'text-gray-500 hover:text-amber-500 hover:bg-amber-50'}`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${topic.user_bookmarked ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">{timeAgo(topic.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        )}

        {/* ── NOOK CARDS ────────────────────────────────────────────── */}
        {activeTab === 'nooks' && (
          nooks.length === 0
            ? <EmptyState icon={Zap} message="No nooks participated in yet" />
            : <div className="divide-y divide-gray-50">
              {nooks.map((nook) => (
                <div
                  key={nook.id}
                  onClick={() => navigate(`/dashboard/nooks/${nook.id}`)}
                  className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <h3 className="text-sm font-bold text-gray-900 truncate">{nook.content.title}</h3>
                      </div>
                      {nook.content.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">{nook.content.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {nook.content.urgency && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            nook.content.urgency === 'high' ? 'bg-red-100 text-red-700' :
                            nook.content.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {nook.content.urgency.toUpperCase()}
                          </span>
                        )}
                        {nook.time_left && <span className="text-xs text-gray-400">⏱ {nook.time_left}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-purple-600 font-semibold flex-shrink-0">View →</span>
                  </div>
                </div>
              ))}
            </div>
        )}
      </div>

      {/* Privacy footer */}
      <div className="flex items-center justify-center gap-2 mt-5 text-xs text-gray-400">
        <Shield className="w-3.5 h-3.5" />
        <span>Profile shared while preserving community anonymity</span>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
