import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Settings,
  Shield,
  Heart,
  Award,
  MessageCircle,
  MessageSquare,
  Share2,
  Sparkles,
  Users,
  TrendingUp,
  LogOut,
  ChevronRight,
  Star,
  Zap,
  Edit3,
  Key,
  Pause,
  Trash2,
  Save,
  Loader2,
  Bookmark,
  FileText,
  Clock,
  Flame,
  Eye,
  ThumbsUp,
  Globe,
  Building,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  GetUserStats,
  GetUserBadges,
  UpdateUsername,
  GetPrivacySettings,
  UpdatePrivacySettings,
  GetNotificationSettings,
  UpdateNotificationSettings,
  DeactivateAccount,
  DeleteAccount
} from '../../../../api/profileApis';
import { GetUserPosts, GetBookmarks } from '../../../../api/feedApis';
import { GetMyForumTopics, GetBookmarkedForumTopics } from '../../../../api/forumApis';
import { GetMyNooks, GetBookmarkedNooks } from '../../../../api/nookApis';
import { GetMyActivity, GetMyBookmarks } from '../../../../api/profileApis';
import { GetFollowers, GetFollowing, UnfollowUser } from '../../../../api/mentorshipApis';
import { showToast } from '../../../Helper/ShowToast';
import { ProfileSkeleton, ProfilePageSkeleton, FollowListSkeleton, SettingsSkeleton } from '../../../Helper/SkeletonLoader';
import { DecryptData } from '../../../../api/EncrytionApis';
import { resolveDisplayName } from '../../../utils/nameUtils';

interface PrivacySettings {
  profileVisibility: 'public' | 'connections' | 'private';
  showEmail: boolean;
  showCompany: boolean;
  showLocation: boolean;
  allowMessagesFrom: 'everyone' | 'connections' | 'no_one';
  showActivity: boolean;
  showConnections: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyOnComment: boolean;
  notifyOnLike: boolean;
  notifyOnFollow: boolean;
  notifyOnMention: boolean;
  notifyOnMessage: boolean;
  notifyOnConnectionRequest: boolean;
  digestFrequency: 'daily' | 'weekly' | 'never';
}

export function ProfileView() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.username || '');

  // API Data States
  const [stats, setStats] = useState({
    topicsCreated: 0,
    commentsPosted: 0,
    helpfulReactions: 0,
    reputationScore: 0,
    nooksJoined: 0,
    mentorConnections: 0
  });
  const [badges, setBadges] = useState<{ id: string; name: string; description?: string; icon?: string; earned?: boolean }[]>([]);

  // Settings States
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'private',
    showEmail: false,
    showCompany: true,
    showLocation: true,
    allowMessagesFrom: 'everyone',
    showActivity: true,
    showConnections: true
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    notifyOnComment: true,
    notifyOnLike: true,
    notifyOnFollow: true,
    notifyOnMention: true,
    notifyOnMessage: true,
    notifyOnConnectionRequest: true,
    digestFrequency: 'daily'
  });

  // Loading States
  const [statsLoading, setStatsLoading] = useState(true);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [usernameUpdating, setUsernameUpdating] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [pausingAccount, setPausingAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  // Pause account confirmation
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [pauseReason, setPauseReason] = useState('');

  // Decrypted name
  const [displayName, setDisplayName] = useState('');

  // Page-level tab: My Posts, My Profile, Settings — persisted in URL so back navigation preserves it
  const validTabs = ['activity', 'profile', 'settings'] as const;
  const tabParam = searchParams.get('tab');
  const activePage: 'activity' | 'profile' | 'settings' = validTabs.includes(tabParam as any) ? (tabParam as 'activity' | 'profile' | 'settings') : 'activity';
  const setActivePage = (tab: 'activity' | 'profile' | 'settings') => {
    if (tab === 'activity') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  // Content tabs state (within My Activity page)
  const [profileTab, setProfileTab] = useState<'my_posts' | 'bookmarked'>('my_posts');
  const [contentFilter, setContentFilter] = useState<'all' | 'post' | 'topic' | 'nook'>('all');
  const [aggregatedItems, setAggregatedItems] = useState<any[]>([]);
  const [contentLoading, setContentLoading] = useState(false);

  // Profile page inner tabs: Profile info vs Follow
  const [profileInnerTab, setProfileInnerTab] = useState<'profile' | 'follow'>('profile');
  const [followSubTab, setFollowSubTab] = useState<'following' | 'followers'>('following');
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followersTotal, setFollowersTotal] = useState(0);
  const [followingTotal, setFollowingTotal] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Decrypt first_name and last_name
  useEffect(() => {
    const decryptNames = async () => {
      if (!user?.first_name && !user?.last_name) return;
      try {
        const [first, last] = await Promise.all([
          user.first_name ? DecryptData({ encryptedData: user.first_name }).then(r => r?.decryptedData ?? '') : Promise.resolve(''),
          user.last_name ? DecryptData({ encryptedData: user.last_name }).then(r => r?.decryptedData ?? '') : Promise.resolve(''),
        ]);
        const full = `${first} ${last}`.trim();
        if (full) setDisplayName(full);
      } catch {
        // Silent failure — username will be shown as fallback
      }
    };
    decryptNames();
  }, [user?.first_name, user?.last_name]);

  // Fetch user stats and badges in parallel on mount
  useEffect(() => {
    if (!user?.id) return;

    const fetchProfileData = async () => {
      setStatsLoading(true);
      setBadgesLoading(true);

      const [statsResult, badgesResult] = await Promise.allSettled([
        GetUserStats(user.id),
        GetUserBadges(user.id),
      ]);

      if (statsResult.status === "fulfilled") {
        const s = statsResult.value;
        setStats({
          topicsCreated: s?.topicsCreated || 0,
          commentsPosted: s?.commentsPosted || 0,
          helpfulReactions: s?.helpfulReactions || 0,
          reputationScore: s?.reputationScore || 0,
          nooksJoined: s?.nooksJoined || 0,
          mentorConnections: s?.mentorConnections || 0,
        });
      }
      setStatsLoading(false);

      if (badgesResult.status === "fulfilled") {
        const b = badgesResult.value;
        setBadges(b?.badges || []);
      }
      setBadgesLoading(false);
    };

    fetchProfileData();
  }, [user?.id]);

  // Fetch settings when settings tab is active
  useEffect(() => {
    if (activePage !== 'settings') return;
    const fetchSettings = async () => {
      setSettingsLoading(true);
      try {
        const [privacyRes, notifRes] = await Promise.all([
          GetPrivacySettings().catch(() => null),
          GetNotificationSettings().catch(() => null)
        ]);
        if (privacyRes) {
          setPrivacySettings(privacyRes);
        }
        if (notifRes) {
          setNotificationSettings(notifRes);
        }
      } catch {
        // Silent failure for settings fetch
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, [activePage]);

  // Fetch followers/following when follow tab is active
  useEffect(() => {
    if (activePage !== 'profile' || profileInnerTab !== 'follow') return;
    const fetchFollowData = async () => {
      setFollowLoading(true);
      try {
        const [followersRes, followingRes] = await Promise.allSettled([
          GetFollowers({ page: 1, limit: 50 }),
          GetFollowing({ page: 1, limit: 50 }),
        ]);
        if (followersRes.status === 'fulfilled') {
          const d = followersRes.value;
          setFollowers(d?.followers || (Array.isArray(d) ? d : []));
          setFollowersTotal(d?.total ?? (d?.followers?.length || 0));
        }
        if (followingRes.status === 'fulfilled') {
          const d = followingRes.value;
          setFollowing(d?.following || (Array.isArray(d) ? d : []));
          setFollowingTotal(d?.total ?? (d?.following?.length || 0));
        }
      } catch (err) {
        console.error('Error fetching follow data:', err);
      } finally {
        setFollowLoading(false);
      }
    };
    fetchFollowData();
  }, [activePage, profileInnerTab]);

  // Unfollow handler
  const handleUnfollow = async (userId: string) => {
    try {
      await UnfollowUser(userId);
      setFollowing(prev => prev.filter(f => (f.followed_id || f.id || f.user_id) !== userId));
      setFollowingTotal(prev => Math.max(0, prev - 1));
      showToast('Unfollowed successfully', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to unfollow', 'error');
    }
  };

  // Fetch aggregated content based on active tab
  // Uses new aggregated endpoints (GET /user/me/activity, GET /user/me/bookmarks)
  // Falls back to parallel individual calls if aggregated endpoint fails
  const fetchAggregatedContent = useCallback(async () => {
    if (!user?.id) return;
    setContentLoading(true);
    try {
      let results: any[] = [];

      if (profileTab === 'my_posts') {
        try {
          // Try new aggregated endpoint first
          const response = await GetMyActivity({ page: 1, limit: 50 });
          const items = Array.isArray(response) ? response : (response?.items || []);
          results = items.map((item: any) => {
            const t = item.type || item.content_type || 'post';
            const mapped: any = {
              ...item,
              _type: t === 'nook_message' ? 'nook' : t,
            };
            // Flatten nested content fields for card rendering
            if (t === 'topic') {
              mapped.title = item.content?.title || '';
              mapped.forum_name = item.content?.forum_name || '';
              mapped.tags = item.content?.tags || [];
              mapped.views_count = item.engagement?.views || 0;
              mapped.comments_count = item.engagement?.comments || 0;
            } else if (t === 'comment') {
              mapped.title = item.content?.topic_title || 'Comment';
              mapped.comment_text = item.content?.text || '';
            } else if (t === 'nook_message') {
              mapped.title = item.content?.nook_title || item.content?.title || 'Nook Message';
              mapped.description = item.content?.text || '';
              mapped.nook_id = item.nook_id || item.content_id || item.id;
              mapped.urgency = item.content?.nook_urgency || 'low';
              mapped.scope = item.content?.nook_scope || 'global';
              mapped.members_count = item.engagement?.members || 0;
              mapped.messages_count = item.engagement?.comments || 0;
              if (item.expires_at) mapped.expires_at = item.expires_at;
            }
            return mapped;
          });
        } catch {
          // Fallback to parallel individual endpoints
          const [postsRes, topicsRes, nooksRes] = await Promise.allSettled([
            GetUserPosts(user.id, 1, 50),
            GetMyForumTopics(1, 50),
            GetMyNooks(1, 50),
          ]);

          if (postsRes.status === 'fulfilled') {
            const d = postsRes.value;
            const posts = d?.posts || d?.items || (Array.isArray(d) ? d : []);
            results.push(...posts.map((p: any) => ({ ...p, _type: 'post' })));
          }
          if (topicsRes.status === 'fulfilled') {
            const d = topicsRes.value;
            const topics = d?.topics || d?.items || (Array.isArray(d) ? d : []);
            results.push(...topics.map((t: any) => ({ ...t, _type: 'topic' })));
          }
          if (nooksRes.status === 'fulfilled') {
            const d = nooksRes.value;
            const nooks = d?.nooks || d?.items || (Array.isArray(d) ? d : []);
            results.push(...nooks.map((n: any) => ({ ...n, _type: 'nook' })));
          }
        }
      } else {
        try {
          // Try new aggregated bookmarks endpoint first
          const response = await GetMyBookmarks({ page: 1, limit: 50 });
          const items = Array.isArray(response) ? response : response?.items || [];
          results = items.map((item: any) => {
            const ct = item.content_type || item.type || 'post';
            const mapped: any = {
              ...item,
              _type: ct === 'nook_message' ? 'nook' : ct === 'comment' ? 'topic' : ct,
              // Bookmarks have content_id instead of id
              id: item.id || item.content_id,
            };
            // Flatten nook bookmark content fields to match nook card expectations
            if (ct === 'nook_message') {
              mapped.title = item.content?.title || 'Nook';
              mapped.description = item.content?.text || '';
              mapped.urgency = item.content?.nook_urgency || 'low';
              mapped.scope = item.content?.nook_scope || 'global';
              mapped.members_count = item.engagement?.members || 0;
              mapped.messages_count = item.engagement?.comments || 0;
              mapped.nook_id = item.nook_id || item.content_id;
              if (item.expires_at) mapped.expires_at = item.expires_at;
            }
            return mapped;
          });
        } catch {
          // Fallback to parallel individual endpoints
          const [postsRes, topicsRes, nooksRes] = await Promise.allSettled([
            GetBookmarks(1, 50),
            GetBookmarkedForumTopics(1, 50),
            GetBookmarkedNooks(1, 50),
          ]);

          if (postsRes.status === 'fulfilled') {
            const d = postsRes.value;
            const posts = d?.bookmarks || d?.posts || d?.items || (Array.isArray(d) ? d : []);
            results.push(...posts.map((p: any) => ({ ...p, _type: 'post' })));
          }
          if (topicsRes.status === 'fulfilled') {
            const d = topicsRes.value;
            const topics = d?.topics || d?.items || (Array.isArray(d) ? d : []);
            results.push(...topics.map((t: any) => ({ ...t, _type: 'topic' })));
          }
          if (nooksRes.status === 'fulfilled') {
            const d = nooksRes.value;
            const nooks = d?.nooks || d?.items || (Array.isArray(d) ? d : []);
            results.push(...nooks.map((n: any) => ({ ...n, _type: 'nook' })));
          }
        }
      }

      // Sort by created_at/createdAt descending
      results.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || a.bookmarked_at || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || b.bookmarked_at || 0).getTime();
        return dateB - dateA;
      });
      setAggregatedItems(results);
    } catch (err) {
      console.error('Error fetching aggregated content:', err);
    } finally {
      setContentLoading(false);
    }
  }, [user?.id, profileTab]);

  useEffect(() => {
    fetchAggregatedContent();
  }, [fetchAggregatedContent]);

  // Helper: format time ago
  const getTimeAgo = (date: string | undefined) => {
    if (!date) return '';
    const ms = Date.now() - new Date(date).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Helper: calculate time remaining from expires_at
  const getTimeLeft = (expiresAt: string | undefined) => {
    if (!expiresAt) return '';
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  // Filter items by content type (comments are grouped under topics)
  const filteredItems = contentFilter === 'all'
    ? aggregatedItems
    : contentFilter === 'topic'
      ? aggregatedItems.filter((item) => item._type === 'topic' || item._type === 'comment')
      : aggregatedItems.filter((item) => item._type === contentFilter);

  if (!user) return null;

  if (statsLoading && badgesLoading) {
    if (activePage === 'settings') return <SettingsSkeleton />;
    if (activePage === 'profile') return <ProfilePageSkeleton />;
    return <ProfileSkeleton />;
  }

  const handleSaveName = async () => {
    if (newName.trim() && newName !== user.username) {
      try {
        setUsernameUpdating(true);
        await UpdateUsername(newName.trim());
        updateUser({ username: newName.trim() });
      } catch {
        showToast('Error updating username. Please try again.', 'error');
      } finally {
        setUsernameUpdating(false);
      }
    }
    setEditingName(false);
  };

  const handleCancelEdit = () => {
    setNewName(user.username);
    setEditingName(false);
  };

  // Privacy toggle handler
  const handlePrivacyToggle = async (key: keyof PrivacySettings, value: PrivacySettings[keyof PrivacySettings]) => {
    const updated = { ...privacySettings, [key]: value };
    setPrivacySettings(updated);
    try {
      await UpdatePrivacySettings({ [key]: value });
    } catch {
      setPrivacySettings(privacySettings); // revert on failure
    }
  };

  // Notification toggle handler
  const handleNotificationToggle = async (key: keyof NotificationSettings) => {
    const newValue = !notificationSettings[key];
    const updated = { ...notificationSettings, [key]: newValue };
    setNotificationSettings(updated);
    try {
      await UpdateNotificationSettings({ [key]: newValue });
    } catch {
      setNotificationSettings(notificationSettings); // revert on failure
    }
  };

  // Pause (deactivate) account handler
  const handlePauseAccount = async () => {
    try {
      setPausingAccount(true);
      await DeactivateAccount({ reason: pauseReason || undefined });
      showToast('Your account has been paused. Log in again to reactivate.', 'success');
      logout();
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { message?: string; code?: string } } })?.response?.data?.message;
      const errCode = (error as { response?: { data?: { code?: string } }; response2?: { status?: number } })?.response?.data?.code;
      const status = (error as { response?: { status?: number } })?.response?.status;

      if (errCode === 'ALREADY_DEACTIVATED' || status === 409 || errMsg?.toLowerCase().includes('already deactivated')) {
        showToast('Your account is already paused. Log in again to reactivate it.', 'info');
        logout();
      } else {
        showToast(errMsg || 'Failed to pause account. Please try again.', 'error');
      }
    } finally {
      setPausingAccount(false);
      setShowPauseConfirm(false);
      setPauseReason('');
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      await DeleteAccount({
        confirmDeletion: true,
        reason: deleteReason || undefined
      });
      showToast('Your account has been permanently deleted.', 'success');
      logout();
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(errMsg || 'Failed to delete account. Please try again.', 'error');
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
      setDeleteReason('');
    }
  };

  // Toggle component for settings
  const Toggle = ({ enabled, onToggle, disabled, label }: { enabled: boolean; onToggle: () => void; disabled?: boolean; label?: string }) => (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={label || (enabled ? 'Disable' : 'Enable')}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  // No hardcoded config — badges come from API with id, name, description, icon, earned

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header — changes based on active page */}
      <header className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {activePage === 'activity' ? (
            <>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">My Activity</h1>
                <p className="text-sm text-gray-500">Your posts, topics, and nooks</p>
              </div>
              <button
                onClick={() => setActivePage('profile')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              >
                <Settings className="w-4 h-4" />
                Account Settings
              </button>
            </>
          ) : activePage === 'profile' ? (
            <>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActivePage('activity')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                  <p className="text-sm text-gray-500">Your anonymous identity</p>
                </div>
              </div>
              <button
                onClick={() => setActivePage('settings')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActivePage('profile')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                  <p className="text-sm text-gray-500">Privacy, notifications, and account</p>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {activePage === 'activity' && (
        /* ==================== MY ACTIVITY PAGE ==================== */
        <div className="px-4 pb-4 space-y-4 mt-5">
          {/* Sub-tabs: My Posts / Bookmarked */}
          <div className="grid grid-cols-2 gap-2 mt-5">
            <button
              onClick={() => { setProfileTab('my_posts'); setContentFilter('all'); }}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                profileTab === 'my_posts'
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              My Posts
            </button>
            <button
              onClick={() => { setProfileTab('bookmarked'); setContentFilter('all'); }}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                profileTab === 'bookmarked'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Bookmarked
            </button>
          </div>

          {/* Content Type Filter */}
          <div className="grid grid-cols-4 gap-2">
            {([
              { key: 'all' as const, label: 'All', icon: null },
              { key: 'post' as const, label: 'Posts', icon: FileText },
              { key: 'topic' as const, label: 'Topics', icon: MessageCircle },
              { key: 'nook' as const, label: 'Nooks', icon: Zap },
            ]).map((f) => {
              const FilterIcon = f.icon;
              const count = f.key === 'all'
                ? aggregatedItems.length
                : f.key === 'topic'
                  ? aggregatedItems.filter((i) => i._type === 'topic' || i._type === 'comment').length
                  : aggregatedItems.filter((i) => i._type === f.key).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setContentFilter(f.key)}
                  className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border transition-all text-sm font-medium ${
                    contentFilter === f.key
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {FilterIcon && <FilterIcon className="w-4 h-4" />}
                  <span>{f.label}</span>
                  <span className={`text-xs ${contentFilter === f.key ? 'text-blue-500' : 'text-gray-400'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Content List */}
          {contentLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {profileTab === 'bookmarked' ? (
                  <Bookmark className="w-8 h-8 text-gray-400" />
                ) : (
                  <FileText className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {profileTab === 'bookmarked' ? 'No bookmarks yet' : 'No posts yet'}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {profileTab === 'bookmarked'
                  ? 'Bookmark posts, topics, and nooks to find them here.'
                  : 'Create posts, topics, or nooks to see them here.'}
              </p>
              <button
                onClick={() => navigate('/dashboard/feeds')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
              >
                {profileTab === 'bookmarked' ? 'Explore Content' : 'Create a Post'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                // === POST CARD (matches FeedsView post card) ===
                if (item._type === 'post') {
                  const authorName = item.author?.display_name || item.author?.username || 'Anonymous';
                  const postText = item.content?.text || item.content || '';
                  const displayText = typeof postText === 'string' ? postText : '';

                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate('/dashboard/feeds')}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                              {item.author?.avatar || authorName[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900">{authorName}</span>
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                                  <FileText className="w-4 h-4" />
                                  <span>Post</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <span>{getTimeAgo(item.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <p className="text-gray-800 leading-relaxed">{displayText}</p>
                        </div>
                      </div>

                      <div className="px-4 py-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-red-500" />
                              <span>{item.reaction_counts?.heard || item.likes_count || 0}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                              <span>{item.reaction_counts?.validated || 0}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-500" />
                              <span>{item.reaction_counts?.inspired || 0}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span>{item.engagement?.comments || item.comments_count || 0} comments</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 sm:px-4 py-2 border-t border-gray-100">
                        <div className="flex items-center justify-around gap-1">
                          <button className="p-2 rounded-lg hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95 text-gray-500" title="Heard">
                            <Heart className="w-5 h-5" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-95 text-gray-500" title="Validated">
                            <ThumbsUp className="w-5 h-5" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-yellow-50 transition-all duration-200 hover:scale-110 active:scale-95 text-gray-500" title="Inspired">
                            <Star className="w-5 h-5" />
                          </button>
                          <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />
                          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" title="Comment">
                            <MessageSquare className="w-5 h-5" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" title="Share">
                            <Share2 className="w-5 h-5" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95 text-gray-500" title="Save">
                            <Bookmark className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // === TOPIC CARD (matches OverviewMode topic card) ===
                if (item._type === 'topic') {
                  const avatarEmoji = item.user_profile?.avatar || item.author?.avatar || '👤';
                  const username = item.user_profile?.username || item.author?.username || 'Anonymous';

                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/dashboard/forums/topic/${item.id}`)}
                      className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-gray-200/50 hover:shadow-lg hover:border-purple-300 transition-all duration-300 group relative overflow-hidden cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/10 to-blue-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10">
                        <div className="flex items-start gap-3 md:gap-4 mb-4">
                          <button className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 rounded-xl flex items-center justify-center text-lg md:text-xl shadow-sm border border-purple-200/50 flex-shrink-0 hover:bg-blue-200 transition-colors">
                            {avatarEmoji}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className="text-sm text-purple-700 font-bold bg-gradient-to-r from-purple-100 to-indigo-100 px-3 py-1.5 rounded-full border border-purple-200 inline-flex items-center gap-1">
                                {username} {avatarEmoji}
                              </span>
                              {(item.forum?.name || item.forum_name) && (
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full font-medium">
                                  {item.forum?.icon} {item.forum?.name || item.forum_name}
                                </span>
                              )}
                              {item.company_name && (
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                                  {item.company_name}
                                </span>
                              )}
                              {item.scope === 'global' && (
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">Global</span>
                              )}
                              {item.is_pinned && (
                                <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                  <Star className="w-3 h-3" /> Pinned
                                </span>
                              )}
                              <span className="text-gray-400 font-medium">&middot;</span>
                              <span className="text-gray-500 font-medium">{getTimeAgo(item.created_at)}</span>
                            </div>
                            <div className="text-base md:text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors leading-tight text-left break-words">
                              {item.title}
                            </div>
                            <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed line-clamp-2 break-words">{typeof item.content === 'string' ? item.content : item.content?.text || ''}</p>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {item.tags.slice(0, 3).map((tag: string) => (
                                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">#{tag}</span>
                                ))}
                                {item.tags.length > 3 && (
                                  <span className="text-xs text-gray-500">+{item.tags.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="relative z-20 flex items-center justify-between flex-wrap gap-2 md:gap-4 mt-4">
                          <div className="flex items-center gap-1 md:gap-4 flex-wrap">
                            <button className="flex items-center gap-1 md:gap-2 transition-all duration-200 font-medium hover:bg-green-50 hover:scale-110 active:scale-95 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-gray-500 hover:text-green-600">
                              <Eye className="w-4 h-4" />
                              <span className="text-sm">{item.engagement?.views || item.views_count || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 md:gap-2 transition-all duration-200 font-medium hover:bg-red-50 hover:scale-110 active:scale-95 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-gray-500 hover:text-red-500">
                              <Heart className="w-4 h-4" />
                              <span className="text-sm">{item.reaction_counts?.heard || item.reactions?.heard || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 md:gap-2 transition-all duration-200 font-medium hover:bg-blue-50 hover:scale-110 active:scale-95 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-gray-500 hover:text-blue-600">
                              <ThumbsUp className="w-4 h-4" />
                              <span className="text-sm">{item.reaction_counts?.validated || item.reactions?.validated || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 md:gap-2 transition-all duration-200 font-medium hover:bg-yellow-50 hover:scale-110 active:scale-95 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-gray-500 hover:text-yellow-500">
                              <Star className="w-4 h-4" />
                              <span className="text-sm">{item.reaction_counts?.inspired || item.reactions?.inspired || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 md:gap-2 transition-colors font-medium px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50">
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm">{item.engagement?.comments || item.commentCount || item.comments_count || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 md:gap-2 transition-colors font-medium px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50" title="AI Insights">
                              <Sparkles className="w-4 h-4" />
                              <span className="text-sm hidden md:inline">AI Insights</span>
                            </button>
                            <button className="flex items-center gap-1 md:gap-2 transition-all duration-200 font-medium hover:scale-110 active:scale-95 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-gray-500 hover:text-amber-500 hover:bg-amber-50" title="Bookmark">
                              <Bookmark className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs md:text-sm text-gray-500 w-full md:w-auto mt-2 md:mt-0">
                            Last activity {getTimeAgo(item.last_activity_at || item.updated_at || item.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // === COMMENT CARD ===
                if (item._type === 'comment') {
                  const commentText = item.comment_text || item.content?.text || '';
                  const topicTitle = item.title || item.content?.topic_title || 'a topic';

                  return (
                    <div
                      key={item.id || item.content_id}
                      onClick={() => navigate(`/dashboard/forums/topic/${item.topic_id}`)}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-l-4 border-purple-400"
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                            {item.author?.avatar || '💬'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-gray-900 text-sm">{item.author?.username || 'You'}</span>
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-600">
                                <MessageCircle className="w-3 h-3" />
                                <span>Comment</span>
                              </div>
                              <span className="text-xs text-gray-400">{getTimeAgo(item.created_at)}</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              Commented on <span className="font-medium text-purple-600">{topicTitle}</span>
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{commentText}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // === NOOK CARD (matches NooksCard design) ===
                if (item._type === 'nook') {
                  const urgency = item.urgency || 'low';
                  const urgencyGradient = urgency === 'high' ? 'from-red-500 to-orange-500' : urgency === 'medium' ? 'from-yellow-500 to-amber-500' : 'from-blue-500 to-cyan-500';
                  const temperature = item.temperature || 'cool';
                  const TempIcon = temperature === 'hot' ? Flame : temperature === 'warm' ? Zap : Eye;
                  const tempColor = temperature === 'hot' ? 'text-red-500' : temperature === 'warm' ? 'text-yellow-500' : 'text-blue-500';

                  return (
                    <div
                      key={item.id || item.content_id}
                      onClick={() => navigate(`/dashboard/nooks/${item.nook_id || item.id}`)}
                      className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                    >
                      <div className={`bg-gradient-to-r ${urgencyGradient} p-1`}>
                        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-t-xl">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-5 h-5 text-purple-600" />
                                <span className="text-xs font-medium text-purple-600">Nook</span>
                              </div>
                              <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-purple-600 transition-colors">
                                {item.title}
                              </h3>
                              <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-4">
                              <TempIcon className={`w-4 h-4 ${tempColor}`} />
                            </div>
                          </div>
                          {item.hashtags && item.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {item.hashtags.map((tag: string) => (
                                <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-medium">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">{item.members_count || 0}</div>
                            <div className="text-xs text-gray-500 font-medium">Anonymous</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{item.messages_count || 0}</div>
                            <div className="text-xs text-gray-500 font-medium">Messages</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{getTimeLeft(item.expires_at) || item.timeLeft || '—'}</div>
                            <div className="text-xs text-gray-500 font-medium">Remaining</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              urgency === 'high' ? 'bg-red-100 text-red-700' : urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {urgency.toUpperCase()}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                              item.scope === 'company' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.scope === 'company' ? <Building className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                              {item.scope === 'company' ? 'company' : 'global'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(item.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Fallback for unknown types
                return null;
              })}
            </div>
          )}
        </div>
      )}

      {activePage === 'profile' && (
        /* ==================== MY PROFILE PAGE ==================== */
        <div className="pb-6">
          {/* Hero Card with gradient banner */}
          <div className="relative overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600" />
            <div className="px-4 -mt-16 relative z-10">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex flex-col items-center -mt-14 mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 rounded-2xl flex items-center justify-center text-5xl shadow-xl border-4 border-white">
                    {user.avatar}
                  </div>
                </div>
                <div className="text-center">
                  {displayName && (
                    <p className="text-base text-gray-500 font-medium">{displayName}</p>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">{user.username}</h2>
                  {user.demographics?.careerLevel && (
                    <p className="text-sm text-gray-600 mt-1">{user.demographics.careerLevel}</p>
                  )}
                  <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
                    {user.demographics?.company && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-full text-sm font-medium text-purple-700">
                        <Building className="w-3.5 h-3.5" />
                        {user.demographics.company}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-700">
                      <Shield className="w-3.5 h-3.5" />
                      Anonymous
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-5 gap-2 mt-6 pt-6 border-t border-gray-100">
                  {statsLoading ? (
                    <div className="col-span-5 flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    </div>
                  ) : (
                    <>
                      {[
                        { value: stats.topicsCreated, label: 'Posts', color: 'text-purple-600', bg: 'bg-purple-50', nav: '/dashboard/forums' },
                        { value: stats.commentsPosted, label: 'Comments', color: 'text-blue-600', bg: 'bg-blue-50', nav: '/dashboard/forums' },
                        { value: stats.reputationScore, label: 'Reputation', color: 'text-amber-600', bg: 'bg-amber-50', nav: '' },
                        { value: stats.helpfulReactions, label: 'Helpful', color: 'text-rose-600', bg: 'bg-rose-50', nav: '/dashboard/forums' },
                        { value: stats.nooksJoined, label: 'Nooks', color: 'text-teal-600', bg: 'bg-teal-50', nav: '/dashboard/nooks' },
                      ].map((stat) => (
                        <button
                          key={stat.label}
                          onClick={() => stat.nav && navigate(stat.nav)}
                          className={`text-center p-3 rounded-xl ${stat.bg} hover:shadow-sm transition-all group`}
                        >
                          <div className={`text-xl font-bold ${stat.color} group-hover:scale-110 transition-transform`}>{stat.value}</div>
                          <div className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile / Follow Tab Switcher */}
          <div className="px-4 mt-4">
            <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setProfileInnerTab('profile')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  profileInnerTab === 'profile'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => setProfileInnerTab('follow')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  profileInnerTab === 'follow'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                Follow
                {(followingTotal + followersTotal > 0) && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">{followingTotal + followersTotal}</span>
                )}
              </button>
            </div>
          </div>

          {/* ===== PROFILE TAB CONTENT ===== */}
          {profileInnerTab === 'profile' && (
            <div className="px-4 mt-4 space-y-4">
              {/* Badges & Achievements */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  Badges & Achievements
                </h3>

                {badgesLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                ) : badges.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className={`text-center p-4 rounded-xl border transition-all hover:shadow-md ${
                          badge.earned !== false
                            ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-200 hover:border-amber-300'
                            : 'bg-gray-50 border-gray-200 opacity-40 grayscale'
                        }`}
                        title={badge.description}
                      >
                        <div className="text-3xl mb-2">{badge.icon || '🏅'}</div>
                        <p className="text-xs font-semibold text-gray-700">{badge.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-3">🏆</div>
                    <p className="text-sm text-gray-500 font-medium">No badges earned yet</p>
                    <p className="text-xs text-gray-400 mt-1">Keep participating to earn your first badge!</p>
                  </div>
                )}
              </div>

              {/* Your Impact */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  Your Impact
                </h3>

                <div className="space-y-2">
                  {[
                    { label: 'Forum Posts', value: stats.topicsCreated, icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-50', nav: '/dashboard/forums' },
                    { label: 'Comments Posted', value: stats.commentsPosted, icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50', nav: '/dashboard/forums' },
                    { label: 'Helpful Reactions', value: stats.helpfulReactions, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', nav: '/dashboard/forums' },
                    { label: 'Reputation Score', value: stats.reputationScore, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', nav: '' },
                    { label: 'Nooks Participated', value: stats.nooksJoined, icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50', nav: '/dashboard/nooks' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => item.nav && navigate(item.nav)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 ${item.bg} rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${item.color}`} />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                          {item.nav && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Communities */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  Your Communities
                </h3>

                <div className="space-y-2">
                  {user.demographics?.company && (
                    <button
                      onClick={() => navigate('/dashboard/forums')}
                      className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-all border border-blue-100 group"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">
                          {user.demographics?.company.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{user.demographics?.company}</p>
                        <p className="text-xs text-gray-500">Company Forum</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  )}

                  {user.demographics?.affinityTags?.map((tag) => {
                    const groupNames: { [key: string]: string } = {
                      'black-women-tech': 'Black Women in Tech',
                      'women-leadership': 'Women in Leadership',
                      'latino-leaders': 'Latino Leaders',
                      'lgbtq-finance': 'LGBTQ+ in Finance'
                    };

                    return (
                      <button
                        key={tag}
                        onClick={() => navigate('/dashboard/forums')}
                        className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all border border-purple-100 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
                          <span className="text-white text-lg">💜</span>
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{groupNames[tag] || tag}</p>
                          <p className="text-xs text-gray-500">Affinity Group</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Demographics */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-slate-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  Demographics
                  <span className="text-xs text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">Private</span>
                </h3>

                <div className="space-y-3">
                  {[
                    { label: 'Race/Ethnicity', value: user.demographics?.race },
                    { label: 'Gender', value: user.demographics?.gender },
                    { label: 'Career Level', value: user.demographics?.careerLevel },
                  ].filter(d => d.value).map((d) => (
                    <div key={d.label} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500">{d.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{d.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Shield className="w-3.5 h-3.5" />
                    <span>This information is never shared with other users</span>
                  </div>
                </div>
              </div>

              {/* Safety & Support */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-5 border border-red-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-red-600" />
                  </div>
                  Safety & Support
                </h3>

                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/dashboard/my-cases')}
                    className="w-full flex items-center gap-3 p-4 bg-white/80 rounded-xl hover:bg-white transition-colors group"
                  >
                    <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-sm text-gray-900 font-semibold">My Cases</div>
                      <div className="text-xs text-gray-500">Track your harassment reports</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => navigate('/report-harassment')}
                    className="w-full flex items-center gap-3 p-4 bg-white/80 rounded-xl hover:bg-white transition-colors group"
                  >
                    <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-sm text-gray-900 font-semibold">Report Harassment</div>
                      <div className="text-xs text-gray-500">Anonymous reporting system</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => navigate('/crisis-resources')}
                    className="w-full flex items-center gap-3 p-4 bg-white/80 rounded-xl hover:bg-white transition-colors group"
                  >
                    <div className="w-9 h-9 bg-rose-100 rounded-lg flex items-center justify-center">
                      <Heart className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-sm text-gray-900 font-semibold">Crisis Resources</div>
                      <div className="text-xs text-gray-500">Mental health and career support</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== FOLLOW TAB CONTENT ===== */}
          {profileInnerTab === 'follow' && (
            <div className="px-4 mt-4">
              {/* Following / Followers Sub-tabs */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setFollowSubTab('following')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                    followSubTab === 'following'
                      ? 'bg-purple-50 border-purple-200 text-purple-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Following
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${followSubTab === 'following' ? 'bg-purple-200 text-purple-700' : 'bg-gray-200 text-gray-500'}`}>{followingTotal}</span>
                </button>
                <button
                  onClick={() => setFollowSubTab('followers')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                    followSubTab === 'followers'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Followers
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${followSubTab === 'followers' ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>{followersTotal}</span>
                </button>
              </div>

              {followLoading ? (
                <FollowListSkeleton />
              ) : followSubTab === 'following' ? (
                /* === FOLLOWING LIST === */
                following.length > 0 ? (
                  <div className="space-y-3">
                    {following.map((person) => {
                      const personId = person.followed_id || person.id || person.user_id;
                      const profile = person.followed_user || person.user || person;
                      const name = profile.display_name || profile.username || 'Anonymous';
                      const avatar = profile.avatar || name[0]?.toUpperCase() || '?';
                      const jobTitle = profile.job_title || profile.jobTitle || '';
                      const company = profile.company || profile.company_encrypted || '';
                      const affinityTags: string[] = profile.affinity_tags || profile.affinityTags || [];

                      return (
                        <div
                          key={personId}
                          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                              {avatar.length > 2 ? avatar : avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">{name}</p>
                                  {jobTitle && (
                                    <p className="text-xs text-gray-500 mt-0.5">{jobTitle}{company ? ` at ${company}` : ''}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleUnfollow(personId)}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                  <UserMinus className="w-3 h-3" />
                                  Unfollow
                                </button>
                              </div>
                              {affinityTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {affinityTags.slice(0, 3).map((tag: string) => (
                                    <span key={tag} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">
                                      {tag}
                                    </span>
                                  ))}
                                  {affinityTags.length > 3 && (
                                    <span className="text-xs text-gray-400">+{affinityTags.length - 3}</span>
                                  )}
                                </div>
                              )}
                              {person.followed_at && (
                                <p className="text-xs text-gray-400 mt-1.5">Following since {new Date(person.followed_at).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserPlus className="w-8 h-8 text-purple-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Not following anyone yet</h3>
                    <p className="text-gray-500 text-sm mb-4">Follow mentors and peers to stay connected.</p>
                    <button
                      onClick={() => navigate('/dashboard/find-mentorship')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                    >
                      Find People
                    </button>
                  </div>
                )
              ) : (
                /* === FOLLOWERS LIST === */
                followers.length > 0 ? (
                  <div className="space-y-3">
                    {followers.map((person) => {
                      const personId = person.follower_id || person.id || person.user_id;
                      const profile = person.follower_user || person.user || person;
                      const name = profile.display_name || profile.username || 'Anonymous';
                      const avatar = profile.avatar || name[0]?.toUpperCase() || '?';
                      const jobTitle = profile.job_title || profile.jobTitle || '';
                      const company = profile.company || profile.company_encrypted || '';
                      const affinityTags: string[] = profile.affinity_tags || profile.affinityTags || [];

                      return (
                        <div
                          key={personId}
                          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                              {avatar.length > 2 ? avatar : avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{name}</p>
                                {jobTitle && (
                                  <p className="text-xs text-gray-500 mt-0.5">{jobTitle}{company ? ` at ${company}` : ''}</p>
                                )}
                              </div>
                              {affinityTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {affinityTags.slice(0, 3).map((tag: string) => (
                                    <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                      {tag}
                                    </span>
                                  ))}
                                  {affinityTags.length > 3 && (
                                    <span className="text-xs text-gray-400">+{affinityTags.length - 3}</span>
                                  )}
                                </div>
                              )}
                              {person.followed_at && (
                                <p className="text-xs text-gray-400 mt-1.5">Following you since {new Date(person.followed_at).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-blue-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No followers yet</h3>
                    <p className="text-gray-500 text-sm">Engage with the community to gain followers.</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {activePage === 'settings' && (
        /* ==================== SETTINGS PAGE ==================== */
        <div className="px-4 py-4 space-y-4">
          {settingsLoading ? (
            <SettingsSkeleton />
          ) : (
            <>
              {/* Privacy Section */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy & Safety
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Anonymous Mode</p>
                      <p className="text-xs text-gray-500 mt-0.5">Anonymous by default to all.</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <Shield className="w-3 h-3" />
                      Always On
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Allow Messages</p>
                      <p className="text-xs text-gray-500">Let others send you direct messages</p>
                    </div>
                    <Toggle enabled={privacySettings.allowMessagesFrom !== 'no_one'} onToggle={() => handlePrivacyToggle('allowMessagesFrom', privacySettings.allowMessagesFrom === 'no_one' ? 'everyone' : 'no_one')} label="Toggle allow messages" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Show Company</p>
                      <p className="text-xs text-gray-500">Show your company on your profile</p>
                    </div>
                    <Toggle enabled={privacySettings.showCompany} onToggle={() => handlePrivacyToggle('showCompany', !privacySettings.showCompany)} label="Toggle show company" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Show Activity</p>
                      <p className="text-xs text-gray-500">Let others see your activity history</p>
                    </div>
                    <Toggle enabled={privacySettings.showActivity} onToggle={() => handlePrivacyToggle('showActivity', !privacySettings.showActivity)} label="Toggle show activity" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Show Email</p>
                      <p className="text-xs text-gray-500">Display your email on your profile</p>
                    </div>
                    <Toggle enabled={privacySettings.showEmail} onToggle={() => handlePrivacyToggle('showEmail', !privacySettings.showEmail)} label="Toggle show email" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Show Location</p>
                      <p className="text-xs text-gray-500">Display your location on your profile</p>
                    </div>
                    <Toggle enabled={privacySettings.showLocation} onToggle={() => handlePrivacyToggle('showLocation', !privacySettings.showLocation)} label="Toggle show location" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Show Connections</p>
                      <p className="text-xs text-gray-500">Let others see your connections list</p>
                    </div>
                    <Toggle enabled={privacySettings.showConnections} onToggle={() => handlePrivacyToggle('showConnections', !privacySettings.showConnections)} label="Toggle show connections" />
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 text-sm">New Messages</p>
                    <Toggle enabled={notificationSettings.pushNotifications} onToggle={() => handleNotificationToggle('pushNotifications')} label="Toggle new message notifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 text-sm">Forum Activity</p>
                    <Toggle enabled={notificationSettings.notifyOnComment} onToggle={() => handleNotificationToggle('notifyOnComment')} label="Toggle forum activity notifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 text-sm">Direct Messages</p>
                    <Toggle enabled={notificationSettings.notifyOnMessage} onToggle={() => handleNotificationToggle('notifyOnMessage')} label="Toggle message notifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 text-sm">Email Notifications</p>
                    <Toggle enabled={notificationSettings.emailNotifications} onToggle={() => handleNotificationToggle('emailNotifications')} label="Toggle email notifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 text-sm">New Followers</p>
                    <Toggle enabled={notificationSettings.notifyOnFollow} onToggle={() => handleNotificationToggle('notifyOnFollow')} label="Toggle follower notifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 text-sm">Mentions</p>
                    <Toggle enabled={notificationSettings.notifyOnMention} onToggle={() => handleNotificationToggle('notifyOnMention')} label="Toggle mention notifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 text-sm">Connection Requests</p>
                    <Toggle enabled={notificationSettings.notifyOnConnectionRequest} onToggle={() => handleNotificationToggle('notifyOnConnectionRequest')} label="Toggle connection request notifications" />
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Account</h3>
                <div className="space-y-2">
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Display Name</span>
                      {!editingName && (
                        <button type="button" onClick={() => setEditingName(true)} className="text-blue-600 hover:text-blue-700 text-sm" aria-label="Edit display name">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {editingName ? (
                      <div className="space-y-2">
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Enter your display name" />
                        <div className="flex gap-2">
                          <button onClick={handleSaveName} disabled={usernameUpdating} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors disabled:opacity-50">
                            {usernameUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            {usernameUpdating ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={handleCancelEdit} className="px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">{user.username}</p>
                    )}
                  </div>

                  <button onClick={() => navigate('/change-password')} className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Change Password</span>
                    </div>
                  </button>

                  {showPauseConfirm ? (
                    <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50 space-y-2">
                      <p className="text-sm text-yellow-800 font-medium">Pause your account?</p>
                      <p className="text-xs text-yellow-700">You can reactivate by logging back in.</p>
                      <textarea value={pauseReason} onChange={(e) => setPauseReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none resize-none" placeholder="Reason for pausing (optional)" />
                      <div className="flex gap-2">
                        <button onClick={handlePauseAccount} disabled={pausingAccount} className="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white rounded-lg text-xs hover:bg-yellow-700 transition-colors disabled:opacity-50">
                          {pausingAccount && <Loader2 className="w-3 h-3 animate-spin" />}
                          {pausingAccount ? 'Pausing...' : 'Confirm Pause'}
                        </button>
                        <button onClick={() => { setShowPauseConfirm(false); setPauseReason(''); }} className="px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowPauseConfirm(true)} className="w-full text-left p-3 hover:bg-yellow-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-2">
                        <Pause className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-gray-700">Pause Account</span>
                      </div>
                    </button>
                  )}

                  <button onClick={() => navigate('/export-data')} className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Export My Data</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>

                  <button onClick={() => navigate('/community-guidelines')} className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Community Guidelines</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>

                  {showDeleteConfirm ? (
                    <div className="p-3 border border-red-200 rounded-lg bg-red-50 space-y-2">
                      <p className="text-sm text-red-800 font-medium">Permanently delete your account?</p>
                      <p className="text-xs text-red-700">This action cannot be undone. All your data will be removed.</p>
                      <textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none" placeholder="Reason for leaving (optional)" />
                      <div className="flex gap-2">
                        <button onClick={handleDeleteAccount} disabled={deletingAccount} className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors disabled:opacity-50">
                          {deletingAccount && <Loader2 className="w-3 h-3 animate-spin" />}
                          {deletingAccount ? 'Deleting...' : 'Delete Forever'}
                        </button>
                        <button onClick={() => { setShowDeleteConfirm(false); setDeleteReason(''); }} className="px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-left p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete Account</span>
                      </div>
                    </button>
                  )}

                  <button onClick={logout} className="w-full text-left p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
