import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Star,
  MapPin,
  Briefcase,
  Award,
  MessageCircle,
  Target,
  ChevronDown,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserProfileModal } from '../Modals/UserProfileModal';
import { MentorshipRequestModal } from '../Modals/MentorshipRequestModal';
import { MentorshipProfileModal } from '../Modals/MentorshipProfileModal';

interface MentorProfile {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  company: string;
  jobTitle: string;
  careerLevel: string;
  location?: string;
  expertise: string[];
  industries: string[];
  mentoringAs?: 'mentor' | 'mentee' | 'both';
  availability: string;
  responseTime?: string;
  matchScore?: number;
  isAvailable: boolean;
  totalMentees?: number;
  yearsOfExperience?: number;
  affinityTags: string[];
  mentorshipStyle?: string;
  languages?: string[];
}

export function FindMentorshipView() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showMentorshipRequest, setShowMentorshipRequest] = useState(false);
  const [showMentorProfile, setShowMentorProfile] = useState(false);
  const [viewMode, setViewMode] = useState<'mentors' | 'mentees' | 'all'>('mentors');

  const [filters, setFilters] = useState({
    careerLevel: [] as string[],
    expertise: [] as string[],
    industries: [] as string[],
    availability: 'all' as 'all' | 'immediate' | 'within_week' | 'within_month',
    affinityTags: [] as string[],
    location: '',
    mentoringAs: 'all' as 'all' | 'mentor' | 'mentee' | 'both',
  });

  const mockProfiles: MentorProfile[] = [
    {
      id: 'mentor1',
      username: 'TechLeader_Sarah',
      avatar: '👩🏾‍💼',
      bio: 'VP of Engineering with 15+ years in tech. Passionate about empowering underrepresented voices in technology and leadership.',
      company: 'Microsoft',
      jobTitle: 'VP of Engineering',
      careerLevel: 'Executive/C-Suite',
      location: 'Seattle, WA',
      expertise: ['Technical Leadership', 'Career Development', 'Workplace Navigation', 'Team Building', 'Executive Presence'],
      industries: ['Technology', 'SaaS', 'Cloud Computing'],
      mentoringAs: 'mentor',
      availability: 'Within 2 weeks',
      responseTime: '24 hours',
      matchScore: 95,
      isAvailable: true,
      totalMentees: 8,
      yearsOfExperience: 15,
      affinityTags: ['Black Women in Tech', 'Women in Leadership', 'STEM Advocates'],
      mentorshipStyle: 'Structured with regular check-ins',
      languages: ['English', 'French']
    },
    {
      id: 'mentor2',
      username: 'DataScience_Miguel',
      avatar: '🧑🏽‍💻',
      bio: 'Senior Data Scientist specializing in ML/AI. Love helping early-career professionals break into data science.',
      company: 'Google',
      jobTitle: 'Senior Data Scientist',
      careerLevel: 'Senior (8-12 years)',
      location: 'Mountain View, CA',
      expertise: ['Machine Learning', 'Data Science', 'Python', 'Career Transitions', 'Interview Prep'],
      industries: ['Technology', 'AI/ML', 'Big Tech'],
      mentoringAs: 'mentor',
      availability: 'Immediate',
      responseTime: '12 hours',
      matchScore: 88,
      isAvailable: true,
      totalMentees: 5,
      yearsOfExperience: 10,
      affinityTags: ['Latino in Tech', 'First-Gen College', 'Data Science Community'],
      mentorshipStyle: 'Project-based learning',
      languages: ['English', 'Spanish']
    },
    {
      id: 'mentor3',
      username: 'Product_Manager_Lisa',
      avatar: '👩🏻‍💼',
      bio: 'Product leader helping PMs navigate their careers. Former startup founder, now at a FAANG company.',
      company: 'Meta',
      jobTitle: 'Senior Product Manager',
      careerLevel: 'Senior (8-12 years)',
      location: 'New York, NY',
      expertise: ['Product Management', 'Product Strategy', 'User Research', 'Stakeholder Management', 'Roadmap Planning'],
      industries: ['Technology', 'Social Media', 'E-commerce'],
      mentoringAs: 'mentor',
      availability: 'Within 1 week',
      responseTime: '48 hours',
      matchScore: 82,
      isAvailable: true,
      totalMentees: 6,
      yearsOfExperience: 9,
      affinityTags: ['Women in Product', 'Startup Experience', 'Career Switchers'],
      mentorshipStyle: 'Flexible and conversational',
      languages: ['English']
    },
    {
      id: 'mentee1',
      username: 'AspiringEngineer_Jay',
      avatar: '🌟',
      bio: 'Junior software engineer looking to grow technical skills and learn how to navigate corporate tech culture.',
      company: 'Salesforce',
      jobTitle: 'Junior Software Engineer',
      careerLevel: 'Entry Level (0-2 years)',
      location: 'San Francisco, CA',
      expertise: ['JavaScript', 'React', 'Node.js'],
      industries: ['Technology', 'SaaS'],
      mentoringAs: 'mentee',
      availability: 'Immediate',
      isAvailable: true,
      affinityTags: ['Early Career', 'LGBTQ+ in Tech', 'New Grad'],
      mentorshipStyle: 'Open to guidance',
      languages: ['English']
    },
    {
      id: 'mentor4',
      username: 'Finance_Pro_David',
      avatar: '👨🏿‍💼',
      bio: 'Investment banker helping diverse talent break into finance. Focused on interview prep and networking strategies.',
      company: 'Goldman Sachs',
      jobTitle: 'Vice President',
      careerLevel: 'Mid-level (3-7 years)',
      location: 'New York, NY',
      expertise: ['Finance', 'Investment Banking', 'Networking', 'Interview Skills', 'Corporate Culture'],
      industries: ['Finance', 'Investment Banking', 'Private Equity'],
      mentoringAs: 'mentor',
      availability: 'Within 1 month',
      responseTime: '72 hours',
      matchScore: 79,
      isAvailable: true,
      totalMentees: 4,
      yearsOfExperience: 7,
      affinityTags: ['Black Professionals', 'Finance Diversity', 'Ivy League Alumni'],
      mentorshipStyle: 'Goal-oriented sessions',
      languages: ['English']
    },
    {
      id: 'mentee2',
      username: 'GrowingAnalyst_Priya',
      avatar: '⚡',
      bio: 'Marketing analyst seeking guidance on career progression and developing leadership skills.',
      company: 'Adobe',
      jobTitle: 'Marketing Analyst',
      careerLevel: 'Entry Level (0-2 years)',
      location: 'Austin, TX',
      expertise: ['Marketing Analytics', 'Data Analysis', 'SQL'],
      industries: ['Technology', 'Marketing', 'SaaS'],
      mentoringAs: 'mentee',
      availability: 'Immediate',
      isAvailable: true,
      affinityTags: ['Women in Tech', 'South Asian Professionals', 'Marketing'],
      mentorshipStyle: 'Looking for structured guidance',
      languages: ['English', 'Hindi']
    },
    {
      id: 'both1',
      username: 'DesignLead_Alex',
      avatar: '🎨',
      bio: 'Design manager open to both mentoring junior designers and being mentored on executive leadership.',
      company: 'Airbnb',
      jobTitle: 'Design Manager',
      careerLevel: 'Mid-level (3-7 years)',
      location: 'San Francisco, CA',
      expertise: ['UX Design', 'Design Leadership', 'Product Design', 'Design Systems', 'User Research'],
      industries: ['Technology', 'Design', 'Hospitality'],
      mentoringAs: 'both',
      availability: 'Within 1 week',
      responseTime: '24 hours',
      matchScore: 85,
      isAvailable: true,
      totalMentees: 3,
      yearsOfExperience: 6,
      affinityTags: ['LGBTQ+ in Tech', 'Design Community', 'Career Growth'],
      mentorshipStyle: 'Collaborative and creative',
      languages: ['English', 'German']
    },
    {
      id: 'mentor5',
      username: 'Startup_Founder_Kim',
      avatar: '🚀',
      bio: 'Serial entrepreneur and startup founder. Helping aspiring founders and early employees navigate the startup ecosystem.',
      company: 'Stealth Startup',
      jobTitle: 'Founder & CEO',
      careerLevel: 'Executive/C-Suite',
      location: 'Austin, TX',
      expertise: ['Entrepreneurship', 'Fundraising', 'Product Development', 'Go-to-Market', 'Team Building'],
      industries: ['Technology', 'Startups', 'Venture Capital'],
      mentoringAs: 'mentor',
      availability: 'Within 2 weeks',
      responseTime: '36 hours',
      matchScore: 91,
      isAvailable: true,
      totalMentees: 7,
      yearsOfExperience: 12,
      affinityTags: ['Asian Founders', 'Women Founders', 'Startup Community'],
      mentorshipStyle: 'Practical and hands-on',
      languages: ['English', 'Korean']
    }
  ];

  const careerLevels = [
    'Entry Level (0-2 years)',
    'Mid-level (3-7 years)',
    'Senior (8-12 years)',
    'Executive/C-Suite'
  ];

  const expertiseOptions = [
    'Technical Leadership',
    'Career Development',
    'Machine Learning',
    'Data Science',
    'Product Management',
    'Engineering',
    'Finance',
    'Marketing',
    'Design',
    'Entrepreneurship',
    'Workplace Navigation',
    'Interview Skills'
  ];

  const industryOptions = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'Retail',
    'Manufacturing',
    'Consulting',
    'Non-Profit'
  ];

  const affinityTagOptions = [
    'Black Women in Tech',
    'Latino in Tech',
    'Women in Leadership',
    'LGBTQ+ in Tech',
    'First-Gen College',
    'Asian Professionals',
    'Early Career',
    'Career Switchers'
  ];

  const filteredProfiles = useMemo(() => {
    let filtered = mockProfiles;

    if (viewMode !== 'all') {
      filtered = filtered.filter(profile => {
        if (viewMode === 'mentors') {
          return profile.mentoringAs === 'mentor' || profile.mentoringAs === 'both';
        } else {
          return profile.mentoringAs === 'mentee' || profile.mentoringAs === 'both';
        }
      });
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(profile =>
        profile.username.toLowerCase().includes(search) ||
        profile.bio.toLowerCase().includes(search) ||
        profile.company.toLowerCase().includes(search) ||
        profile.jobTitle.toLowerCase().includes(search) ||
        profile.expertise.some(exp => exp.toLowerCase().includes(search))
      );
    }

    if (filters.careerLevel.length > 0) {
      filtered = filtered.filter(profile =>
        filters.careerLevel.includes(profile.careerLevel)
      );
    }

    if (filters.expertise.length > 0) {
      filtered = filtered.filter(profile =>
        filters.expertise.some(exp => profile.expertise.includes(exp))
      );
    }

    if (filters.industries.length > 0) {
      filtered = filtered.filter(profile =>
        filters.industries.some(ind => profile.industries.includes(ind))
      );
    }

    if (filters.affinityTags.length > 0) {
      filtered = filtered.filter(profile =>
        filters.affinityTags.some(tag => profile.affinityTags.includes(tag))
      );
    }

    if (filters.location) {
      filtered = filtered.filter(profile =>
        profile.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.availability !== 'all') {
      const availabilityMap = {
        immediate: 'Immediate',
        within_week: 'Within 1 week',
        within_month: 'Within'
      };
      const searchTerm = availabilityMap[filters.availability];
      filtered = filtered.filter(profile =>
        profile.availability?.includes(searchTerm)
      );
    }

    return filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [mockProfiles, searchTerm, filters, viewMode]);

  const toggleFilter = (filterType: string, value: string) => {
    setFilters(prev => {
      const currentValues = prev[filterType as keyof typeof prev] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterType]: newValues };
    });
  };

  const clearFilters = () => {
    setFilters({
      careerLevel: [],
      expertise: [],
      industries: [],
      availability: 'all',
      affinityTags: [],
      location: '',
      mentoringAs: 'all',
    });
  };

  const activeFilterCount =
    filters.careerLevel.length +
    filters.expertise.length +
    filters.industries.length +
    filters.affinityTags.length +
    (filters.availability !== 'all' ? 1 : 0) +
    (filters.location ? 1 : 0);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const handleRequestMentorship = (userId: string) => {
    setSelectedUserId(userId);
    setShowMentorshipRequest(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Find Mentorship</h2>
            <p className="text-gray-600">Discover mentors and mentees to connect with</p>
          </div>
          {!user?.isWillingToMentor && (
            <button
              onClick={() => setShowMentorProfile(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              <Award className="w-4 h-4" />
              Become a Mentor
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('mentors')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'mentors'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Find Mentors
          </button>
          <button
            onClick={() => setViewMode('mentees')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'mentees'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Find Mentees
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            View All
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, company, expertise, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filter Profiles</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Career Level
                </label>
                <div className="space-y-2">
                  {careerLevels.map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.careerLevel.includes(level)}
                        onChange={() => toggleFilter('careerLevel', level)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <select
                  value={filters.availability}
                  onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Any time</option>
                  <option value="immediate">Immediate</option>
                  <option value="within_week">Within 1 week</option>
                  <option value="within_month">Within 1 month</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expertise (select multiple)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {expertiseOptions.map((exp) => (
                    <label key={exp} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.expertise.includes(exp)}
                        onChange={() => toggleFilter('expertise', exp)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{exp}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industries
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {industryOptions.map((ind) => (
                    <label key={ind} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.industries.includes(ind)}
                        onChange={() => toggleFilter('industries', ind)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{ind}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affinity Groups
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {affinityTagOptions.map((tag) => (
                    <label key={tag} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.affinityTags.includes(tag)}
                        onChange={() => toggleFilter('affinityTags', tag)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Search by city or state..."
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Found <span className="font-semibold text-gray-900">{filteredProfiles.length}</span> {
            viewMode === 'mentors' ? 'mentors' :
            viewMode === 'mentees' ? 'mentees' :
            'profiles'
          }
        </p>
        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
          <option>Best Match</option>
          <option>Most Recent</option>
          <option>Most Experienced</option>
          <option>Most Available</option>
        </select>
      </div>

      {filteredProfiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">No profiles found</h3>
          <p className="text-sm text-gray-500 mb-4">
            Try adjusting your filters or search terms
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <button
                  onClick={() => handleUserClick(profile.id)}
                  className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center text-3xl hover:scale-105 transition-transform cursor-pointer"
                >
                  {profile.avatar}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => handleUserClick(profile.id)}
                      className="font-semibold text-gray-900 hover:text-purple-600 transition-colors cursor-pointer truncate"
                    >
                      {profile.username}
                    </button>
                    {profile.matchScore && (
                      <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full flex-shrink-0">
                        <Star className="w-3 h-3 text-green-600 fill-green-600" />
                        <span className="text-xs text-green-700 font-medium">{profile.matchScore}%</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-1">{profile.jobTitle}</p>
                  <p className="text-xs text-blue-600 mb-2">{profile.company}</p>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {profile.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {profile.careerLevel}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4 line-clamp-2 leading-relaxed">{profile.bio}</p>

              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {profile.expertise.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {profile.expertise.length > 3 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{profile.expertise.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {profile.affinityTags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {profile.affinityTags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {profile.availability || 'Contact to discuss'}
                </div>
                {profile.mentoringAs && (
                  <span className={`px-2 py-1 rounded-full font-medium ${
                    profile.mentoringAs === 'mentor' ? 'bg-purple-100 text-purple-700' :
                    profile.mentoringAs === 'mentee' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {profile.mentoringAs === 'mentor' ? 'Offering mentorship' :
                     profile.mentoringAs === 'mentee' ? 'Seeking mentorship' :
                     'Open to both'}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUserClick(profile.id)}
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  View Profile
                </button>
                <button
                  onClick={() => handleRequestMentorship(profile.id)}
                  className={`flex-1 py-2 px-3 rounded-lg transition-colors text-sm font-medium ${
                    profile.mentoringAs === 'mentor' || profile.mentoringAs === 'both'
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {profile.mentoringAs === 'mentor' || profile.mentoringAs === 'both' ? (
                      <>
                        <UserPlus className="w-3 h-3" />
                        Request Mentor
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-3 h-3" />
                        Offer to Mentor
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId || ''}
        onChat={(userId) => {
          setShowUserProfile(false);
        }}
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
