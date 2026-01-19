import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Shield, 
  Heart, 
  Award, 
  Eye, 
  EyeOff, 
  MessageCircle, 
  Users, 
  TrendingUp,
  LogOut,
  ChevronRight,
  Star,
  Crown,
  Target,
  Zap,
  Edit3,
  Key,
  Pause,
  Trash2,
  Save
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { MentorshipProfileModal } from '../../Modals/MentorShipModals/MentorshipProfileModal';

// Logging utility for consistent formatting
const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [ProfileView.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [ProfileView.${component}] ${message}`);
  }
};

export function ProfileView() {
  const { user, logout, updateUser } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showMentorshipProfile, setShowMentorshipProfile] = useState(false);
  const [mentorshipEnabled, setMentorshipEnabled] = useState(user?.isWillingToMentor || false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.username || '');

  // Log component initialization
  React.useEffect(() => {
    log('ProfileView', 'Component initialized', { 
      userId: user?.id,
      showSettings,
      mentorshipEnabled 
    });
  }, []);

  // Log settings view changes
  React.useEffect(() => {
    log('ProfileView', 'Settings view state changed', { showSettings });
  }, [showSettings]);

  // Log mentorship state changes
  React.useEffect(() => {
    log('ProfileView', 'Mentorship state changed', { 
      mentorshipEnabled,
      userId: user?.id 
    });
  }, [mentorshipEnabled]);

  // Log name editing state changes
  React.useEffect(() => {
    log('ProfileView', 'Name editing state changed', { editingName, newName });
  }, [editingName, newName]);

  if (!user) return null;

  const handleSaveName = () => {
    log('handleSaveName', 'Function called', { 
      previousName: user.username, 
      newName 
    });
    
    if (newName.trim() && newName !== user.username) {
      updateUser({ username: newName.trim() });
      log('handleSaveName', 'Name updated successfully', { newName: newName.trim() });
    }
    setEditingName(false);
  };

  const handleCancelEdit = () => {
    log('handleCancelEdit', 'Name editing cancelled');
    setNewName(user.username);
    setEditingName(false);
  };

  const handleMentorshipToggle = () => {
    log('handleMentorshipToggle', 'Function called', { 
      currentState: mentorshipEnabled,
      userId: user.id 
    });
    
    const newValue = !mentorshipEnabled;
    log('handleMentorshipToggle', 'Toggling mentorship state', { 
      from: mentorshipEnabled, 
      to: newValue 
    });
    
    setMentorshipEnabled(newValue);
    updateUser({ isWillingToMentor: newValue });
    
    log('handleMentorshipToggle', 'Mentorship state updated', { 
      newValue,
      userId: user.id 
    });
  };

  const stats = {
    postsCreated: 8,
    commentsPosted: 24,
    helpfulReactions: 67,
    nooksJoined: 12,
    mentorConnections: mentorshipEnabled ? 3 : 0
  };

  const badges = [
    { id: 'new-member', name: 'New Member', icon: '🌱', earned: true },
    { id: 'helpful-voice', name: 'Helpful Voice', icon: '💡', earned: user.badges.length > 0 },
    { id: 'community-builder', name: 'Community Builder', icon: '🏗️', earned: false },
    { id: 'mentor', name: 'Mentor', icon: '🎯', earned: mentorshipEnabled },
    { id: 'supportive', name: 'Supportive', icon: '🤝', earned: stats.helpfulReactions > 50 }
  ];

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
          {/* Privacy Section */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy & Safety
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Anonymous Mode</p>
                  <p className="text-xs text-gray-500">Always hide your real identity</p>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Allow Identity Reveals</p>
                  <p className="text-xs text-gray-500">Let others request to see your profile</p>
                </div>
                <div className="w-12 h-6 bg-gray-200 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Show Company Forum</p>
                  <p className="text-xs text-gray-500">Participate in your workplace discussions</p>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                </div>
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
                <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Forum Activity</p>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Mentorship Matches</p>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                </div>
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
                      onClick={() => setEditingName(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
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
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        Save
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
                  <span className="text-sm text-gray-700">Reset Password</span>
                </div>
              </button>

              <button
                onClick={() => {
                  if (confirm('Pause your account? You can reactivate it anytime by logging back in.')) {
                    log('handlePauseAccount', 'Account pause confirmed');
                    alert('Your account has been paused. Log in again to reactivate.');
                    logout();
                  }
                }}
                className="w-full text-left p-3 hover:bg-yellow-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Pause className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-700">Pause Account</span>
                </div>
              </button>
              
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
              
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
                    log('handleDeleteAccount', 'Account deletion confirmed');
                    // In real app, this would call delete API
                    logout();
                  }
                }}
                className="w-full text-left p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Delete Account</span>
                </div>
              </button>
              
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
            <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
            <p className="text-base text-gray-600 font-medium">{user.demographics.careerLevel}</p>
            {user.demographics.company && (
              <p className="text-sm text-purple-600 bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-2 rounded-full mt-2 inline-block font-semibold">
                {user.demographics.company}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="font-medium">Anonymous since {user.createdAt.toLocaleDateString()}</span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => navigate('/dashboard/forums')}
              className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="text-2xl font-bold text-purple-600">{stats.postsCreated}</div>
              <div className="text-sm text-gray-500 font-medium">Posts</div>
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
              <div className="text-2xl font-bold text-green-600">{stats.nooksJoined}</div>
              <div className="text-sm text-gray-500 font-medium">Nooks</div>
            </button>
          </div>
        </div>

        {/* Mentorship Section */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Mentorship
            </h3>
            <button
              onClick={handleMentorshipToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                mentorshipEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  mentorshipEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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
          
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge) => (
              <div 
                key={badge.id}
                className={`text-center p-3 rounded-lg border transition-all ${
                  badge.earned 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200 opacity-50'
                }`}
              >
                <div className="text-2xl mb-1">{badge.icon}</div>
                <p className="text-xs font-medium text-gray-700">{badge.name}</p>
              </div>
            ))}
          </div>

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
              <span className="text-sm font-medium text-gray-900">{stats.postsCreated}</span>
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
            <button
              onClick={() => navigate('/dashboard/forums')}
              className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">TC</span>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">{user.demographics.company}</p>
                <p className="text-xs text-gray-500">Company Forum</p>
              </div>
            </button>

            {/* Affinity Groups */}
            {user.demographics.affinityTags?.map((tag, index) => {
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
            {user.demographics.race && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Race/Ethnicity</span>
                <span className="text-sm font-medium text-gray-900">{user.demographics.race}</span>
              </div>
            )}
            {user.demographics.gender && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gender</span>
                <span className="text-sm font-medium text-gray-900">{user.demographics.gender}</span>
              </div>
            )}
            {user.demographics.careerLevel && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Career Level</span>
                <span className="text-sm font-medium text-gray-900">{user.demographics.careerLevel}</span>
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