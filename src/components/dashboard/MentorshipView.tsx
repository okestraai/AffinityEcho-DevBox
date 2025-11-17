import React, { useState } from 'react';
import { Target, Users, UserPlus, MessageCircle, Star, Clock, Award, Plus, Search, Filter } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { UserProfileModal } from './UserProfileModal';
import { MentorshipRequestModal } from './MentorshipRequestModal';
import { MentorshipProfileModal } from './MentorshipProfileModal';
import { FindMentorshipView } from './FindMentorshipView';

// Logging utility for consistent formatting
const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [MentorshipView.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [MentorshipView.${component}] ${message}`);
  }
};

export function MentorshipView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'mentors' | 'mentees' | 'find'>('mentors');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showMentorshipRequest, setShowMentorshipRequest] = useState(false);
  const [showMentorProfile, setShowMentorProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Log component initialization
  React.useEffect(() => {
    log('MentorshipView', 'Component initialized', { 
      activeView, 
      userId: user?.id,
      isMentor: user?.isWillingToMentor 
    });
  }, []);

  // Log view changes
  React.useEffect(() => {
    log('MentorshipView', 'Active view changed', { activeView });
  }, [activeView]);

  // Mock mentor matches for the current user
  const myMentors = [
    {
      id: 'mentor1',
      username: 'ExperiencedLeader789',
      avatar: '👩🏾‍💼',
      expertise: ['Career Development', 'Technical Leadership', 'Workplace Navigation'],
      industry: 'Technology',
      company: 'Microsoft',
      bio: 'VP of Engineering with 15+ years experience. Passionate about helping others navigate corporate challenges and advance their careers.',
      careerLevel: 'Executive/C-Suite',
      matchScore: 95,
      status: 'active',
      lastContact: '2 days ago',
      affinityTags: ['Black Women in Tech', 'Women in Leadership']
    },
    {
      id: 'mentor2',
      username: 'WiseMentor456',
      avatar: '🧑🏽‍💻',
      expertise: ['Technical Skills', 'Team Leadership', 'Career Transitions'],
      industry: 'Technology',
      company: 'Google',
      bio: 'Senior Software Engineer and team lead. Experienced in technical career growth and leadership transitions.',
      careerLevel: 'Senior (8-12 years)',
      matchScore: 87,
      status: 'active',
      lastContact: '1 week ago',
      affinityTags: ['Latino Leaders', 'Tech Leadership']
    }
  ];

  // Mock mentee matches for mentors
  const myMentees = [
    {
      id: 'mentee1',
      username: 'RisingProfessional123',
      avatar: '🌟',
      role: 'Software Engineer',
      company: 'TechCorp',
      goals: 'Looking to advance to senior level and develop leadership skills',
      careerLevel: 'Mid-level (3-7 years)',
      affinityTags: ['Women in Tech', 'Early Career'],
      status: 'active',
      lastContact: '3 days ago',
      mentorshipDuration: '2 months'
    },
    {
      id: 'mentee2',
      username: 'AmbitiousGrad456',
      avatar: '⚡',
      role: 'Junior Analyst',
      company: 'Goldman Sachs',
      goals: 'Navigate corporate culture and build confidence in client interactions',
      careerLevel: 'Entry Level (0-2 years)',
      affinityTags: ['First-Gen College', 'Finance Professionals'],
      status: 'active',
      lastContact: '1 day ago',
      mentorshipDuration: '1 month'
    }
  ];

  const handleUserClick = (userId: string) => {
    if (user?.id === userId) {
      // Navigate to own profile - this would be handled by parent component
      navigate('/dashboard/profile');
      log('handleUserClick', 'Own profile clicked, should navigate to profile tab');
    } else {
      setSelectedUserId(userId);
      setShowUserProfile(true);
      log('handleUserClick', 'Other user profile clicked', { userId });
    }
  };

  const handleChatUser = (userId: string) => {
    setShowUserProfile(false);
    log('handleChatUser', 'Chat initiated with user', { userId });
    // This would open the messages view with this user
  };

  const renderMyMentors = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Mentors</h2>
          <p className="text-gray-500">Professionals guiding your growth</p>
        </div>
        <button
          onClick={() => setShowMentorshipRequest(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Request Mentor
        </button>
      </div>

      {myMentors.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {myMentors.map((mentor) => (
            <div key={mentor.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4 mb-4">
                <button
                  onClick={() => handleUserClick(mentor.id)}
                  className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl hover:bg-purple-200 transition-colors cursor-pointer"
                >
                  {mentor.avatar}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => handleUserClick(mentor.id)}
                      className="font-semibold text-gray-900 hover:text-purple-600 transition-colors cursor-pointer"
                    >
                      {mentor.username}
                    </button>
                    <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                      <Star className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-700 font-medium">{mentor.matchScore}%</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">{mentor.careerLevel}</p>
                  <p className="text-xs text-blue-600 mb-2">{mentor.company}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {mentor.expertise.slice(0, 2).map((skill) => (
                      <span key={skill} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                    {mentor.expertise.length > 2 && (
                      <span className="text-xs text-gray-500">+{mentor.expertise.length - 2} more</span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4 leading-relaxed">{mentor.bio}</p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last contact: {mentor.lastContact}
                </div>
                <span className={`px-2 py-1 rounded-full font-medium ${
                  mentor.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {mentor.status}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUserClick(mentor.id)}
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  View Profile
                </button>
                <button
                  onClick={() => handleChatUser(mentor.id)}
                  className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <div className="flex items-center justify-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    Chat
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-500 mb-2">No mentors yet</h3>
          <p className="text-sm text-gray-400 mb-4">
            Request mentorship to get matched with experienced professionals
          </p>
          <button
            onClick={() => setShowMentorshipRequest(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Request Mentor
          </button>
        </div>
      )}
    </div>
  );

  const renderMyMentees = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Mentees</h2>
          <p className="text-gray-500">Professionals you're guiding</p>
        </div>
        <button
          onClick={() => setShowMentorProfile(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
        >
          <Award className="w-4 h-4" />
          Update Mentor Profile
        </button>
      </div>

      {user?.isWillingToMentor ? (
        myMentees.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {myMentees.map((mentee) => (
              <div key={mentee.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <button
                    onClick={() => handleUserClick(mentee.id)}
                    className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl hover:bg-blue-200 transition-colors cursor-pointer"
                  >
                    {mentee.avatar}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => handleUserClick(mentee.id)}
                        className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {mentee.username}
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">{mentee.role}</p>
                    <p className="text-xs text-blue-600 mb-2">{mentee.company}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {mentee.affinityTags.map((tag) => (
                        <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Mentorship Goals</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{mentee.goals}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last contact: {mentee.lastContact}
                  </div>
                  <span className="text-xs text-gray-500">
                    {mentee.mentorshipDuration} together
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUserClick(mentee.id)}
                    className="flex-1 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => handleChatUser(mentee.id)}
                    className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      Chat
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-500 mb-2">No mentees yet</h3>
            <p className="text-sm text-gray-400 mb-4">
              Update your mentor profile to start receiving mentorship requests
            </p>
            <button
              onClick={() => setShowMentorProfile(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Setup Mentor Profile
            </button>
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-500 mb-2">Become a Mentor</h3>
          <p className="text-sm text-gray-400 mb-4">
            Share your experience and help others grow in their careers
          </p>
          <button
            onClick={() => setShowMentorProfile(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Setup Mentor Profile
          </button>
        </div>
      )}
    </div>
  );

  const renderFindMentorship = () => <FindMentorshipView />;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mentorship</h1>
            <p className="text-gray-500">Connect, learn, and grow together</p>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveView('mentors')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'mentors'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Mentors
          </button>
          <button
            onClick={() => setActiveView('mentees')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'mentees'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Mentees
          </button>
          <button
            onClick={() => setActiveView('find')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'find'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Find Mentorship
          </button>
        </div>
      </header>

      {/* Content */}
      <div>
        {activeView === 'mentors' && renderMyMentors()}
        {activeView === 'mentees' && renderMyMentees()}
        {activeView === 'find' && renderFindMentorship()}
      </div>

      {/* Modals */}
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId || ''}
        onChat={handleChatUser}
      />
      
      <MentorshipRequestModal
        isOpen={showMentorshipRequest}
        onClose={() => setShowMentorshipRequest(false)}
      />
      
      <MentorshipProfileModal
        isOpen={showMentorProfile}
        onClose={() => setShowMentorProfile(false)}
      />
    </div>
  );
}