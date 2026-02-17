import { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Shield,
  Heart,
  Award,
  MessageCircle,
  Users,
  TrendingUp,
  LogOut,
  ChevronRight,
  Star,
  Target,
  Zap,
  Edit3,
  Key,
  Pause,
  Trash2,
  Save,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { MentorshipProfileModal } from '../../Modals/MentorShipModals/MentorshipProfileModal';
import {
  GetUserStats,
  GetUserBadges,
  UpdateUsername,
  ToggleMentorshipAvailability,
  GetPrivacySettings,
  UpdatePrivacySettings,
  GetNotificationSettings,
  UpdateNotificationSettings,
  DeactivateAccount,
  DeleteAccount
} from '../../../../api/profileApis';
import { showToast } from '../../../Helper/ShowToast';
import { ProfileSkeleton, SettingsSkeleton } from '../../../Helper/SkeletonLoader';
import { DecryptData } from '../../../../api/EncrytionApis';

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
  const [showSettings, setShowSettings] = useState(false);
  const [showMentorshipProfile, setShowMentorshipProfile] = useState(false);
  const [mentorshipEnabled, setMentorshipEnabled] = useState(false);
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
  const [mentorshipUpdating, setMentorshipUpdating] = useState(false);
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

  // Decrypt first_name and last_name
  useEffect(() => {
    const decryptNames = async () => {
      if (!user?.first_name && !user?.last_name) return;
      try {
        const [first, last] = await Promise.all([
          user.first_name ? DecryptData({ encryptedData: user.first_name }).then(r => r?.data?.decryptedData ?? r?.decryptedData ?? '') : Promise.resolve(''),
          user.last_name ? DecryptData({ encryptedData: user.last_name }).then(r => r?.data?.decryptedData ?? r?.decryptedData ?? '') : Promise.resolve(''),
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

      if (statsResult.status === "fulfilled" && statsResult.value.success && statsResult.value.data) {
        setStats({
          topicsCreated: statsResult.value.data.topicsCreated || 0,
          commentsPosted: statsResult.value.data.commentsPosted || 0,
          helpfulReactions: statsResult.value.data.helpfulReactions || 0,
          reputationScore: statsResult.value.data.reputationScore || 0,
          nooksJoined: statsResult.value.data.nooksJoined || 0,
          mentorConnections: statsResult.value.data.mentorConnections || 0,
        });
      }
      setStatsLoading(false);

      if (badgesResult.status === "fulfilled" && badgesResult.value.success && badgesResult.value.data) {
        setBadges(badgesResult.value.data.badges || []);
      }
      setBadgesLoading(false);
    };

    fetchProfileData();
  }, [user?.id]);

  // Fetch settings when settings panel is opened
  useEffect(() => {
    if (!showSettings) return;
    const fetchSettings = async () => {
      setSettingsLoading(true);
      try {
        const [privacyRes, notifRes] = await Promise.all([
          GetPrivacySettings().catch(() => null),
          GetNotificationSettings().catch(() => null)
        ]);
        if (privacyRes?.success && privacyRes.data) {
          setPrivacySettings(privacyRes.data);
        }
        if (notifRes?.success && notifRes.data) {
          setNotificationSettings(notifRes.data);
        }
      } catch {
        // Silent failure for settings fetch
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, [showSettings]);

  if (!user) return null;

  if (statsLoading && badgesLoading) return <ProfileSkeleton />;

  const handleSaveName = async () => {
    if (newName.trim() && newName !== user.username) {
      try {
        setUsernameUpdating(true);
        const response = await UpdateUsername(newName.trim());
        if (response.success) {
          updateUser({ username: newName.trim() });
        } else {
          showToast('Failed to update username. Please try again.', 'error');
        }
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

  const handleMentorshipToggle = async () => {
    const newValue = !mentorshipEnabled;
    try {
      setMentorshipUpdating(true);
      const response = await ToggleMentorshipAvailability();
      if (response.success) {
        setMentorshipEnabled(newValue);
      } else {
        showToast('Failed to update mentorship status. Please try again.', 'error');
      }
    } catch {
      showToast('Error updating mentorship status. Please try again.', 'error');
    } finally {
      setMentorshipUpdating(false);
    }
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
      const response = await DeactivateAccount({ reason: pauseReason || undefined });
      if (response.success) {
        showToast('Your account has been paused. Log in again to reactivate.', 'success');
        logout();
      } else {
        showToast('Failed to pause account. Please try again.', 'error');
      }
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
      const response = await DeleteAccount({
        confirmDeletion: true,
        reason: deleteReason || undefined
      });
      if (response.success) {
        showToast('Your account has been permanently deleted.', 'success');
        logout();
      } else {
        showToast('Failed to delete account. Please try again.', 'error');
      }
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

  if (showSettings) {
    return (
      <div className="max-w-md mx-auto">
        {/* Settings Header */}
        <header className="bg-white px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          </div>
        </header>

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
                      <p className="text-xs text-gray-500 mt-0.5"> Anonymous by default to all.</p>
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
                    <Toggle
                      enabled={privacySettings.allowMessagesFrom !== 'no_one'}
                      onToggle={() => handlePrivacyToggle('allowMessagesFrom', privacySettings.allowMessagesFrom === 'no_one' ? 'everyone' : 'no_one')}
                      label="Toggle allow messages"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Show Company</p>
                      <p className="text-xs text-gray-500">Show your company on your profile</p>
                    </div>
                    <Toggle
                      enabled={privacySettings.showCompany}
                      onToggle={() => handlePrivacyToggle('showCompany', !privacySettings.showCompany)}
                      label="Toggle show company"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Show Activity</p>
                      <p className="text-xs text-gray-500">Let others see your activity history</p>
                    </div>
                    <Toggle
                      enabled={privacySettings.showActivity}
                      onToggle={() => handlePrivacyToggle('showActivity', !privacySettings.showActivity)}
                      label="Toggle show activity"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Show Email</p>
                      <p className="text-xs text-gray-500">Display your email on your profile</p>
                    </div>
                    <Toggle
                      enabled={privacySettings.showEmail}
                      onToggle={() => handlePrivacyToggle('showEmail', !privacySettings.showEmail)}
                      label="Toggle show email"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Show Location</p>
                      <p className="text-xs text-gray-500">Display your location on your profile</p>
                    </div>
                    <Toggle
                      enabled={privacySettings.showLocation}
                      onToggle={() => handlePrivacyToggle('showLocation', !privacySettings.showLocation)}
                      label="Toggle show location"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Show Connections</p>
                      <p className="text-xs text-gray-500">Let others see your connections list</p>
                    </div>
                    <Toggle
                      enabled={privacySettings.showConnections}
                      onToggle={() => handlePrivacyToggle('showConnections', !privacySettings.showConnections)}
                      label="Toggle show connections"
                    />
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">New Messages</p>
                    </div>
                    <Toggle
                      enabled={notificationSettings.pushNotifications}
                      onToggle={() => handleNotificationToggle('pushNotifications')}
                      label="Toggle new message notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Forum Activity</p>
                    </div>
                    <Toggle
                      enabled={notificationSettings.notifyOnComment}
                      onToggle={() => handleNotificationToggle('notifyOnComment')}
                      label="Toggle forum activity notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Direct Messages</p>
                    </div>
                    <Toggle
                      enabled={notificationSettings.notifyOnMessage}
                      onToggle={() => handleNotificationToggle('notifyOnMessage')}
                      label="Toggle message notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Email Notifications</p>
                    </div>
                    <Toggle
                      enabled={notificationSettings.emailNotifications}
                      onToggle={() => handleNotificationToggle('emailNotifications')}
                      label="Toggle email notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">New Followers</p>
                    </div>
                    <Toggle
                      enabled={notificationSettings.notifyOnFollow}
                      onToggle={() => handleNotificationToggle('notifyOnFollow')}
                      label="Toggle follower notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Mentions</p>
                    </div>
                    <Toggle
                      enabled={notificationSettings.notifyOnMention}
                      onToggle={() => handleNotificationToggle('notifyOnMention')}
                      label="Toggle mention notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Connection Requests</p>
                    </div>
                    <Toggle
                      enabled={notificationSettings.notifyOnConnectionRequest}
                      onToggle={() => handleNotificationToggle('notifyOnConnectionRequest')}
                      label="Toggle connection request notifications"
                    />
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
                        <button
                          type="button"
                          onClick={() => setEditingName(true)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                          aria-label="Edit display name"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {editingName ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder="Enter your display name"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveName}
                            disabled={usernameUpdating}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {usernameUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            {usernameUpdating ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">{user.username}</p>
                    )}
                  </div>

                  <button
                    onClick={() => navigate('/change-password')}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Change Password</span>
                    </div>
                  </button>

                  {/* Pause Account */}
                  {showPauseConfirm ? (
                    <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50 space-y-2">
                      <p className="text-sm text-yellow-800 font-medium">Pause your account?</p>
                      <p className="text-xs text-yellow-700">You can reactivate by logging back in.</p>
                      <textarea
                        value={pauseReason}
                        onChange={(e) => setPauseReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none resize-none"
                        placeholder="Reason for pausing (optional)"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handlePauseAccount}
                          disabled={pausingAccount}
                          className="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white rounded-lg text-xs hover:bg-yellow-700 transition-colors disabled:opacity-50"
                        >
                          {pausingAccount && <Loader2 className="w-3 h-3 animate-spin" />}
                          {pausingAccount ? 'Pausing...' : 'Confirm Pause'}
                        </button>
                        <button
                          onClick={() => { setShowPauseConfirm(false); setPauseReason(''); }}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPauseConfirm(true)}
                      className="w-full text-left p-3 hover:bg-yellow-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Pause className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-gray-700">Pause Account</span>
                      </div>
                    </button>
                  )}

                  {/* Export Data */}
                  <button
                    onClick={() => navigate('/export-data')}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Export My Data</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/community-guidelines')}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Community Guidelines</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>

                  {/* Delete Account */}
                  {showDeleteConfirm ? (
                    <div className="p-3 border border-red-200 rounded-lg bg-red-50 space-y-2">
                      <p className="text-sm text-red-800 font-medium">Permanently delete your account?</p>
                      <p className="text-xs text-red-700">This action cannot be undone. All your data will be removed.</p>
                      <textarea
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                        placeholder="Reason for leaving (optional)"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deletingAccount}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {deletingAccount && <Loader2 className="w-3 h-3 animate-spin" />}
                          {deletingAccount ? 'Deleting...' : 'Delete Forever'}
                        </button>
                        <button
                          onClick={() => { setShowDeleteConfirm(false); setDeleteReason(''); }}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full text-left p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    >
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete Account</span>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={logout}
                    className="w-full text-left p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                  >
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
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <header className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Profile</h1>
            <p className="text-base text-gray-600">Your anonymous identity</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-all"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Profile Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-lg">
          <div className="text-center mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
              {user.avatar}
            </div>
            {displayName && (
              <p className="text-lg text-gray-600 font-medium mb-1">{displayName}</p>
            )}
            <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
            <p className="text-base text-gray-600 font-medium">{user.demographics?.careerLevel}</p>
            {user.demographics?.company && (
              <p className="text-sm text-purple-600 bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-2 rounded-full mt-2 inline-block font-semibold">
                {user.demographics?.company}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="font-medium">Anonymous Identity</span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
            {statsLoading ? (
              <div className="col-span-3 flex justify-center py-2">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('/dashboard/forums')}
                  className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
                >
                  <div className="text-2xl font-bold text-purple-600">{stats.topicsCreated}</div>
                  <div className="text-sm text-gray-500 font-medium">Posts</div>
                </button>
                <button
                  onClick={() => navigate('/dashboard/forums')}
                  className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
                >
                  <div className="text-2xl font-bold text-green-600">{stats.commentsPosted}</div>
                  <div className="text-sm text-gray-500 font-medium">Comments</div>
                </button>
                <button
                  onClick={() => navigate('/dashboard/forums')}
                  className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
                >
                  <div className="text-2xl font-bold text-yellow-600">{stats.reputationScore}</div>
                  <div className="text-sm text-gray-500 font-medium">Reputation</div>
                </button>
                <button
                  onClick={() => navigate('/dashboard/forums')}
                  className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
                >
                  <div className="text-2xl font-bold text-blue-600">{stats.helpfulReactions}</div>
                  <div className="text-sm text-gray-500 font-medium">Helpful</div>
                </button>
                <button
                  onClick={() => navigate('/dashboard/nooks')}
                  className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
                >
                  <div className="text-2xl font-bold text-teal-600">{stats.nooksJoined}</div>
                  <div className="text-sm text-gray-500 font-medium">Nooks</div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mentorship Section */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Mentorship
            </h3>
            <Toggle
              enabled={mentorshipEnabled}
              onToggle={handleMentorshipToggle}
              disabled={mentorshipUpdating}
              label="Toggle mentorship availability"
            />
          </div>

          {mentorshipEnabled ? (
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-medium">Available as a Mentor</p>
                <p className="text-xs text-green-700 mt-1">
                  You'll be matched with professionals seeking guidance in your areas of expertise.
                </p>
              </div>

              {stats.mentorConnections > 0 && (
                <button
                  onClick={() => navigate('/dashboard/mentorship')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Active Connections</p>
                    <p className="text-xs text-gray-500">People you're currently mentoring</p>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{stats.mentorConnections}</div>
                </button>
              )}

              {/* Mentor Profile Setup */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Mentor Profile</h4>
                  <button
                    onClick={() => setShowMentorshipProfile(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium">Areas of Expertise</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Career Development, Technical Leadership, Workplace Navigation
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Enable mentorship to connect with others in your field.</p>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">Why mentor?</span>
                </div>
                <p className="text-xs text-blue-700">
                  Help others navigate challenges you've overcome while strengthening our community.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Badges & Achievements */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Badges & Achievements
          </h3>

          {badgesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : badges.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`text-center p-3 rounded-lg border transition-all ${
                    badge.earned !== false
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200 opacity-50'
                  }`}
                  title={badge.description}
                >
                  <div className="text-2xl mb-1">{badge.icon || '🏅'}</div>
                  <p className="text-xs font-medium text-gray-700">{badge.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-3">No badges earned yet. Keep participating!</p>
          )}

          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Star className="w-3 h-3" />
              <span>Earn badges by participating in the community</span>
            </div>
          </div>
        </div>

        {/* Activity Overview */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Your Impact
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard/forums')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">Forum Posts</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.topicsCreated}</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/forums')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Comments Posted</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.commentsPosted}</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/forums')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-700">Helpful Reactions</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.helpfulReactions}</span>
            </button>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-700">Reputation Score</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.reputationScore}</span>
            </div>

            <button
              onClick={() => navigate('/dashboard/nooks')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-700">Nooks Participated</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.nooksJoined}</span>
            </button>
          </div>
        </div>

        {/* Communities */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Your Communities
          </h3>

          <div className="space-y-2">
            {/* Company Forum */}
            {user.demographics?.company && (
              <button
                onClick={() => navigate('/dashboard/forums')}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {user.demographics?.company.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">{user.demographics?.company}</p>
                  <p className="text-xs text-gray-500">Company Forum</p>
                </div>
              </button>
            )}

            {/* Affinity Groups */}
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
                  className="w-full flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm">💜</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 text-sm">{groupNames[tag] || tag}</p>
                    <p className="text-xs text-gray-500">Affinity Group</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Demographics (Hidden from others) */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Demographics <span className="text-xs text-gray-500 font-normal">(private)</span>
          </h3>

          <div className="space-y-2">
            {user.demographics?.race && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Race/Ethnicity</span>
                <span className="text-sm font-medium text-gray-900">{user.demographics?.race}</span>
              </div>
            )}
            {user.demographics?.gender && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gender</span>
                <span className="text-sm font-medium text-gray-900">{user.demographics?.gender}</span>
              </div>
            )}
            {user.demographics?.careerLevel && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Career Level</span>
                <span className="text-sm font-medium text-gray-900">{user.demographics?.careerLevel}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield className="w-3 h-3" />
              <span>This information is never shared with other users</span>
            </div>
          </div>
        </div>

        {/* Safety Resources */}
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-600" />
            Safety & Support
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => navigate('/report-harassment')}
              className="w-full text-left p-2 hover:bg-red-100 rounded-lg transition-colors"
            >
              <div className="text-sm text-red-700">Report Harassment</div>
              <div className="text-xs text-red-600">Anonymous reporting system</div>
            </button>

            <button
              onClick={() => navigate('/crisis-resources')}
              className="w-full text-left p-2 hover:bg-red-100 rounded-lg transition-colors"
            >
              <div className="text-sm text-red-700">Crisis Resources</div>
              <div className="text-xs text-red-600">Mental health and career support</div>
            </button>
          </div>
        </div>
      </div>

      <MentorshipProfileModal
        isOpen={showMentorshipProfile}
        onClose={() => setShowMentorshipProfile(false)}
      />
    </div>
  );
}
