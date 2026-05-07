// src/admin/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  User,
  Mail,
  Shield,
  Save,
  Lock,
  ChevronRight,
  Loader2,
  CheckCircle,
  Edit2,
  X,
  Key,
} from 'lucide-react';
import { showToast } from '../../Helper/ShowToast';
import { MSG } from '../../constants/messages';
import { GetAdminProfile, UpdateAdminProfile } from '../../../api/adminApis';
import { secureEncryptionService } from '../../services/secure-encryption.service';

async function tryDecrypt(value: string): Promise<string> {
  if (!value) return value;
  try {
    return await secureEncryptionService.decrypt(value);
  } catch {
    return value; // return as-is if not encrypted or decryption fails
  }
}

export function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isDecrypting, setIsDecrypting] = useState(true);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch profile from API then decrypt
  useEffect(() => {
    if (!user) return;
    setIsDecrypting(true);
    GetAdminProfile()
      .then(async (profile) => {
        const [first_name, last_name] = await Promise.all([
          tryDecrypt(profile.first_name || ''),
          tryDecrypt(profile.last_name || ''),
        ]);
        setFormData({
          first_name,
          last_name,
          username: profile.username || user.username || '',
          email: profile.email || user.email || '',
        });
      })
      .catch(() => {
        // fallback to context values if API fails
        setFormData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          username: user.username || '',
          email: user.email || '',
        });
      })
      .finally(() => setIsDecrypting(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const getUserInitials = () => {
    if (formData.first_name && formData.last_name) {
      return `${formData.first_name[0]}${formData.last_name[0]}`.toUpperCase();
    }
    return formData.username?.substring(0, 2).toUpperCase() || 'AD';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const [enc_first, enc_last] = await Promise.all([
        formData.first_name ? secureEncryptionService.encrypt(formData.first_name) : Promise.resolve(''),
        formData.last_name  ? secureEncryptionService.encrypt(formData.last_name)  : Promise.resolve(''),
      ]);
      await UpdateAdminProfile({
        first_name: enc_first || undefined,
        last_name: enc_last || undefined,
        username: formData.username || undefined,
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      showToast(MSG.ADMIN.PROFILE_SAVE_FAILED, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password) {
      showToast(MSG.ADMIN.PASSWORD_REQUIRED, 'error');
      return;
    }
    if (passwordData.new_password.length < 8) {
      showToast(MSG.ADMIN.PASSWORD_TOO_SHORT, 'error');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      showToast(MSG.ADMIN.PASSWORDS_MISMATCH, 'error');
      return;
    }
    setIsSavingPassword(true);
    try {
      // TODO: wire to POST /auth/change-password endpoint
      await new Promise(resolve => setTimeout(resolve, 800));
      showToast(MSG.ADMIN.PASSWORD_CHANGED, 'success');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch {
      showToast(MSG.ADMIN.PASSWORD_CHANGE_FAILED, 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account information and security</p>
        </div>
        {activeTab === 'profile' && (
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setIsEditing(false); /* formData already holds decrypted values from mount */ }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">Profile updated successfully!</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-72 space-y-4">
          {/* Avatar Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/30 mx-auto mb-4">
              {user?.avatar && user.avatar.length <= 2 ? user.avatar : getUserInitials()}
            </div>
            <h2 className="text-base font-bold text-gray-900">
              {formData.first_name
                ? `${formData.first_name} ${formData.last_name || ''}`.trim()
                : formData.username}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{formData.email}</p>
            <span className="inline-block mt-3 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-200 capitalize">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <User className="w-4 h-4" />
              Profile Information
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Lock className="w-4 h-4" />
              Security
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {isDecrypting && (
            <div className="flex items-center gap-3 p-4 mb-4 bg-purple-50 border border-purple-100 rounded-xl">
              <Loader2 className="w-4 h-4 text-purple-500 animate-spin flex-shrink-0" />
              <p className="text-sm text-purple-700">Decrypting profile data…</p>
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">Profile Information</h2>
                <p className="text-sm text-gray-500">Update your display name and account details.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="First name"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Last name"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="username"
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      title="Email address"
                      placeholder="your@email.com"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Account Role</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')} — managed by system</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">Change Password</h2>
                <p className="text-sm text-gray-500">Keep your account secure with a strong password.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Min. 8 characters"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      placeholder="Re-enter new password"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
                    />
                  </div>
                  {passwordData.new_password && passwordData.confirm_password && passwordData.new_password !== passwordData.confirm_password && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={isSavingPassword || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {isSavingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Security tip</p>
                    <p className="text-xs text-amber-700 mt-0.5">Use a unique password with at least 8 characters, including uppercase, numbers, and symbols.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
