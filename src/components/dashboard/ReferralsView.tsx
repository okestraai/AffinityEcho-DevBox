import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Users, 
  MessageCircle, 
  ExternalLink,
  Building,
  Globe,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Star,
  Heart,
  Bookmark
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { ReferralPost as DBReferralPost } from '../../lib/supabase';
import { CreateReferralModal } from '../Modals/CreateReferralModal';
import { UserProfileModal } from '../Modals/UserProfileModal';
import { ReferralCommentsModal } from '../Modals/ReferralCommentsModal';
import { ReferralDetailModal } from '../Modals/ReferralDetailModal';
import { SeedDataButton } from './SeedDataButton';
import { seedReferralData } from '../../lib/seedData';

// Logging utility for consistent formatting
const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [ReferralsView.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [ReferralsView.${component}] ${message}`);
  }
};

interface ReferralPost {
  id: string;
  type: 'request' | 'offer';
  title: string;
  company: string;
  jobTitle?: string;
  jobLink?: string;
  description: string;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  scope: 'global' | 'company';
  status: 'open' | 'closed';
  availableSlots?: number;
  totalSlots?: number;
  createdAt: Date;
  lastActivity: Date;
  engagement: {
    views: number;
    likes: number;
    comments: number;
    bookmarks: number;
  };
  tags: string[];
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export function ReferralsView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'browse' | 'create'>('browse');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'request' | 'offer'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('open');
  const [filterScope, setFilterScope] = useState<'all' | 'global' | 'company'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'relevant'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<ReferralPost | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  // Log component initialization
  React.useEffect(() => {
    log('ReferralsView', 'Component initialized', {
      activeView,
      userId: user?.id
    });
  }, []);

  // Seed database on first load
  useEffect(() => {
    const initializeData = async () => {
      const seededFlag = localStorage.getItem('referrals_seeded');
      if (!seededFlag) {
        log('initializeData', 'Seeding database with dummy data');
        await seedReferralData();
        localStorage.setItem('referrals_seeded', 'true');
        setSeeded(true);
      }
      fetchReferrals();
    };
    initializeData();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      setError(null);
      log('fetchReferrals', 'Fetching referrals from database');

      const { data: posts, error: postsError } = await supabase
        .from('referral_posts')
        .select('*')
        .order('last_activity_at', { ascending: false });

      if (postsError) throw postsError;

      if (!posts) {
        setReferrals([]);
        setLoading(false);
        return;
      }

      // Get user profiles for all posts
      const userIds = [...new Set(posts.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Get user likes and bookmarks if authenticated
      let userLikes: string[] = [];
      let userBookmarks: string[] = [];

      if (user?.id) {
        const { data: likes } = await supabase
          .from('referral_likes')
          .select('referral_post_id')
          .eq('user_id', user.id);

        const { data: bookmarks } = await supabase
          .from('referral_bookmarks')
          .select('referral_post_id')
          .eq('user_id', user.id);

        userLikes = likes?.map(l => l.referral_post_id) || [];
        userBookmarks = bookmarks?.map(b => b.referral_post_id) || [];
      }

      // Transform database posts to component format
      const transformedReferrals: ReferralPost[] = posts.map((post: DBReferralPost) => {
        const profile = profileMap.get(post.user_id);
        return {
          id: post.id,
          type: post.type,
          title: post.title,
          company: post.company,
          jobTitle: post.job_title,
          jobLink: post.job_link,
          description: post.description,
          author: {
            id: post.user_id,
            username: profile?.username || 'Anonymous User',
            avatar: profile?.avatar || '👤'
          },
          scope: post.scope,
          status: post.status,
          availableSlots: post.available_slots,
          totalSlots: post.total_slots,
          createdAt: new Date(post.created_at),
          lastActivity: new Date(post.last_activity_at),
          engagement: {
            views: post.views_count,
            likes: post.likes_count,
            comments: post.comments_count,
            bookmarks: post.bookmarks_count
          },
          tags: post.tags,
          isLiked: userLikes.includes(post.id),
          isBookmarked: userBookmarks.includes(post.id)
        };
      });

      setReferrals(transformedReferrals);
      log('fetchReferrals', 'Referrals fetched successfully', { count: transformedReferrals.length });
    } catch (err) {
      log('fetchReferrals', 'Error fetching referrals', err);
      setError(err instanceof Error ? err.message : 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (referralId: string) => {
    if (!user?.id) return;

    try {
      const referral = referrals.find(r => r.id === referralId);
      if (!referral) return;

      if (referral.isLiked) {
        // Unlike
        const { error } = await supabase
          .from('referral_likes')
          .delete()
          .eq('referral_post_id', referralId)
          .eq('user_id', user.id);

        if (error) throw error;

        setReferrals(prev => prev.map(r =>
          r.id === referralId
            ? { ...r, isLiked: false, engagement: { ...r.engagement, likes: r.engagement.likes - 1 } }
            : r
        ));
      } else {
        // Like
        const { error } = await supabase
          .from('referral_likes')
          .insert({ referral_post_id: referralId, user_id: user.id });

        if (error) throw error;

        setReferrals(prev => prev.map(r =>
          r.id === referralId
            ? { ...r, isLiked: true, engagement: { ...r.engagement, likes: r.engagement.likes + 1 } }
            : r
        ));
      }
    } catch (err) {
      log('handleLike', 'Error toggling like', err);
    }
  };

  const handleBookmark = async (referralId: string) => {
    if (!user?.id) return;

    try {
      const referral = referrals.find(r => r.id === referralId);
      if (!referral) return;

      if (referral.isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('referral_bookmarks')
          .delete()
          .eq('referral_post_id', referralId)
          .eq('user_id', user.id);

        if (error) throw error;

        setReferrals(prev => prev.map(r =>
          r.id === referralId
            ? { ...r, isBookmarked: false, engagement: { ...r.engagement, bookmarks: r.engagement.bookmarks - 1 } }
            : r
        ));
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('referral_bookmarks')
          .insert({ referral_post_id: referralId, user_id: user.id });

        if (error) throw error;

        setReferrals(prev => prev.map(r =>
          r.id === referralId
            ? { ...r, isBookmarked: true, engagement: { ...r.engagement, bookmarks: r.engagement.bookmarks + 1 } }
            : r
        ));
      }
    } catch (err) {
      log('handleBookmark', 'Error toggling bookmark', err);
    }
  };

  // Mock referral posts data (fallback)
  const mockReferrals: ReferralPost[] = [
    {
      id: '1',
      type: 'request',
      title: 'Looking for Software Engineer referral at Google',
      company: 'Google',
      jobTitle: 'Senior Software Engineer',
      jobLink: 'https://careers.google.com/jobs/123',
      description: 'Experienced full-stack developer looking for referral. 5+ years experience with React, Node.js, and cloud platforms.',
      author: {
        id: 'user1',
        username: 'TechSeeker2024',
        avatar: '🚀'
      },
      scope: 'global',
      status: 'open',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      engagement: {
        views: 45,
        likes: 12,
        comments: 8,
        bookmarks: 6
      },
      tags: ['software-engineering', 'full-stack', 'react', 'nodejs']
    },
    {
      id: '2',
      type: 'offer',
      title: 'Can refer for Microsoft roles - PM & Engineering',
      company: 'Microsoft',
      description: 'Senior PM at Microsoft. Happy to refer qualified candidates for Product Manager and Software Engineer positions. Please share your background and target role.',
      author: {
        id: 'user2',
        username: 'MSFTInsider',
        avatar: '💼'
      },
      scope: 'global',
      status: 'open',
      availableSlots: 2,
      totalSlots: 5,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - 15 * 60 * 1000),
      engagement: {
        views: 89,
        likes: 24,
        comments: 15,
        bookmarks: 18
      },
      tags: ['microsoft', 'product-manager', 'software-engineer', 'referral-offer']
    },
    {
      id: '3',
      type: 'request',
      title: 'Seeking Data Scientist referral at any FAANG',
      company: 'Meta, Apple, Amazon, Netflix, Google',
      jobTitle: 'Data Scientist',
      description: 'PhD in Statistics with 3 years industry experience. Specialized in ML/AI and data analytics. Open to any FAANG company.',
      author: {
        id: 'user3',
        username: 'DataDriven',
        avatar: '📊'
      },
      scope: 'global',
      status: 'open',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - 45 * 60 * 1000),
      engagement: {
        views: 67,
        likes: 18,
        comments: 12,
        bookmarks: 9
      },
      tags: ['data-science', 'machine-learning', 'faang', 'phd']
    },
    {
      id: '4',
      type: 'offer',
      title: 'Goldman Sachs referrals - Finance & Tech roles',
      company: 'Goldman Sachs',
      description: 'VP at Goldman Sachs. Can provide referrals for both finance and technology positions. Looking for candidates with strong analytical skills.',
      author: {
        id: 'user4',
        username: 'WallStreetPro',
        avatar: '💰'
      },
      scope: 'company',
      status: 'open',
      availableSlots: 1,
      totalSlots: 3,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      engagement: {
        views: 34,
        likes: 8,
        comments: 5,
        bookmarks: 4
      },
      tags: ['goldman-sachs', 'finance', 'technology', 'vp-level']
    },
    {
      id: '5',
      type: 'request',
      title: 'UX Designer position at Airbnb',
      company: 'Airbnb',
      jobTitle: 'Senior UX Designer',
      jobLink: 'https://careers.airbnb.com/positions/456',
      description: 'Senior UX Designer with 6 years experience in consumer products. Portfolio includes mobile apps and web platforms.',
      author: {
        id: 'user5',
        username: 'DesignMaven',
        avatar: '🎨'
      },
      scope: 'global',
      status: 'closed',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000),
      engagement: {
        views: 28,
        likes: 6,
        comments: 3,
        bookmarks: 2
      },
      tags: ['ux-design', 'airbnb', 'consumer-products', 'mobile']
    }
  ];

  const handleUserClick = (userId: string) => {
    if (user?.id === userId) {
      navigate('/dashboard/profile');
    } else {
      setSelectedUserId(userId);
      setShowUserProfile(true);
    }
  };

  const handleChatUser = (userId: string) => {
    setShowUserProfile(false);
    console.log('Chat initiated with user:', userId);
  };

  const handleOpenComments = (referral: ReferralPost) => {
    setSelectedReferral(referral);
    setShowCommentsModal(true);
  };

  const handleCloseComments = () => {
    setShowCommentsModal(false);
    fetchReferrals();
  };

  const handleOpenDetail = (referralId: string) => {
    setSelectedReferralId(referralId);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    fetchReferrals();
  };

  const filteredReferrals = referrals.filter(referral => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        referral.title.toLowerCase().includes(searchLower) ||
        referral.company.toLowerCase().includes(searchLower) ||
        referral.description.toLowerCase().includes(searchLower) ||
        referral.tags.some(tag => tag.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filterType !== 'all' && referral.type !== filterType) return false;

    // Status filter
    if (filterStatus !== 'all' && referral.status !== filterStatus) return false;

    // Scope filter
    if (filterScope !== 'all' && referral.scope !== filterScope) return false;

    return true;
  });

  const sortedReferrals = [...filteredReferrals].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.engagement.likes + b.engagement.comments) - (a.engagement.likes + a.engagement.comments);
      case 'relevant':
        return b.engagement.views - a.engagement.views;
      case 'recent':
      default:
        return b.lastActivity.getTime() - a.lastActivity.getTime();
    }
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Job Referrals</h1>
            <p className="text-gray-500">Connect for job opportunities and referrals</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors font-medium shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Post Referral
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies, roles, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="request">Requests</option>
                    <option value="offer">Offers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Scope</label>
                  <select
                    value={filterScope}
                    onChange={(e) => setFilterScope(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="all">All Scopes</option>
                    <option value="global">Global</option>
                    <option value="company">Company Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                    <option value="relevant">Most Relevant</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{referrals.filter(r => r.type === 'request' && r.status === 'open').length}</div>
            <div className="text-sm text-gray-600">Open Requests</div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600">{referrals.filter(r => r.type === 'offer' && r.status === 'open').length}</div>
            <div className="text-sm text-gray-600">Available Offers</div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">{new Set(referrals.map(r => r.company)).size}</div>
            <div className="text-sm text-gray-600">Companies</div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-orange-600">{referrals.reduce((sum, r) => sum + r.engagement.views, 0)}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-500">Loading referrals...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12 bg-white rounded-xl border border-red-200">
          <p className="text-red-600 mb-2">Error: {error}</p>
          <button
            onClick={fetchReferrals}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Referral Posts */}
      {!loading && !error && (
        <div className="space-y-4">
        {sortedReferrals.map((referral) => (
          <div key={referral.id} className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 hover:shadow-lg transition-all cursor-pointer" onClick={() => handleOpenDetail(referral.id)}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleUserClick(referral.author.id); }}
                  className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-lg hover:scale-105 transition-transform cursor-pointer"
                >
                  {referral.author.avatar}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUserClick(referral.author.id); }}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {referral.author.username}
                    </button>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{formatTimeAgo(referral.lastActivity)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      referral.type === 'request' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {referral.type === 'request' ? 'Seeking Referral' : 'Offering Referrals'}
                    </span>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      referral.scope === 'global' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {referral.scope === 'global' ? 'Global' : 'Company'}
                    </span>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      referral.status === 'open' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {referral.status === 'open' ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {referral.type === 'offer' && referral.availableSlots && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                    {referral.availableSlots}/{referral.totalSlots} available
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 break-words">{referral.title}</h3>

              <div className="flex items-center gap-2 md:gap-4 mb-3 text-xs md:text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">{referral.company}</span>
                </div>
                
                {referral.jobTitle && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{referral.jobTitle}</span>
                  </div>
                )}
                
                {referral.jobLink && (
                  <a
                    href={referral.jobLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View Job</span>
                  </a>
                )}
              </div>
              
              <p className="text-gray-700 leading-relaxed mb-3">{referral.description}</p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {referral.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Engagement */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{referral.engagement.views}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(referral.id); }}
                  className={`flex items-center gap-1 transition-colors ${
                    referral.isLiked ? 'text-red-500' : 'hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${referral.isLiked ? 'fill-current' : ''}`} />
                  <span>{referral.engagement.likes}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenComments(referral); }}
                  className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{referral.engagement.comments}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleBookmark(referral.id); }}
                  className={`flex items-center gap-1 transition-colors ${
                    referral.isBookmarked ? 'text-yellow-500' : 'hover:text-yellow-500'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${referral.isBookmarked ? 'fill-current' : ''}`} />
                  <span>{referral.engagement.bookmarks}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenDetail(referral.id); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sortedReferrals.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-500 mb-1">No referrals found</h3>
          <p className="text-sm text-gray-400 mb-4">
            Try adjusting your search or filters, or be the first to post!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Post a Referral
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateReferralModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchReferrals();
        }}
      />
      
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId || ''}
        onChat={handleChatUser}
      />

      <ReferralCommentsModal
        isOpen={showCommentsModal}
        onClose={handleCloseComments}
        referralId={selectedReferral?.id || ''}
        referralTitle={selectedReferral?.title || ''}
      />

      <ReferralDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetail}
        referralId={selectedReferralId || ''}
        onRefresh={fetchReferrals}
      />

      {!loading && referrals.length === 0 && !error && (
        <SeedDataButton />
      )}
    </div>
  );
}