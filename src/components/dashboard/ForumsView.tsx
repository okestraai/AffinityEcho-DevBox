import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  MessageCircle,
  Heart,
  Eye,
  TrendingUp,
  ThumbsUp,
  Bookmark,
  Building,
  Globe,
  Users,
  ChevronRight,
  Filter,
  Star,
  Clock,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Flame,
  Calendar,
  BarChart3,
  User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { CreateTopicModal } from './CreateTopicModal';
import { TopicDetailModal } from './TopicDetailModal';
import { UserProfileModal } from './UserProfileModal';
import { ForumDetailView } from './ForumDetailView';
import { companies, globalForums, mockTopics, mockUserProfiles } from '../../data/mockForums';
import { Topic, Forum, UserProfile } from '../../types/forum';

export function ForumsView() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('relevant');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopicDetail, setShowTopicDetail] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedForum, setSelectedForum] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'company' | 'forum' | 'global' | 'forumDetail'>('overview');
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevant' | 'recent' | 'popular' | 'trending'>('relevant');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [hashtagFilter, setHashtagFilter] = useState<string | null>(null);

  // Added missing states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const handleUserClick = (userId: string) => {
    if (currentUser && userId === currentUser.id) {
      console.log('Navigate to own profile page');
      return;
    }
    
    const userProfile = mockUserProfiles[userId];
    if (userProfile) {
      setSelectedUserProfile(userProfile);
      setShowUserProfile(true);
    }
  };

  const handleFollow = (userId: string) => {
    console.log('Following user:', userId);
  };

  const handleUnfollow = (userId: string) => {
    console.log('Unfollowing user:', userId);
  };

  const handleChat = (userId: string) => {
    console.log('Starting chat with user:', userId);
    setShowUserProfile(false);
  };

  const TOPICS_PER_PAGE = 10;
  const userCompany = companies.find(c => c.name === currentUser?.demographics.company);

  const getFilteredAndSortedTopics = () => {
    let filteredTopics = [...mockTopics];

    if (viewMode === 'company' && selectedCompany) {
      filteredTopics = filteredTopics.filter(topic => topic.companyId === selectedCompany);
    } else if (viewMode === 'forum' && selectedForum) {
      filteredTopics = filteredTopics.filter(topic => topic.forumId === selectedForum);
    } else if (viewMode === 'global') {
      filteredTopics = filteredTopics.filter(topic => !topic.companyId);
    }

    if (timeFilter !== 'all') {
      const now = new Date();
      const timeThresholds = {
        today: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
      };
      const threshold = timeThresholds[timeFilter];
      filteredTopics = filteredTopics.filter(topic => 
        now.getTime() - topic.createdAt.getTime() <= threshold
      );
    }

    if (searchTerm) {
      filteredTopics = filteredTopics.filter(topic =>
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    switch (sortBy) {
      case 'relevant':
        filteredTopics.sort((a, b) => {
          const aScore = (a.reactions.seen * 1) + (a.reactions.validated * 2) + (a.reactions.inspired * 3) + (a.reactions.heard * 2) + (a.commentCount * 1.5);
          const bScore = (b.reactions.seen * 1) + (b.reactions.validated * 2) + (b.reactions.inspired * 3) + (b.reactions.heard * 2) + (b.commentCount * 1.5);
          return bScore - aScore;
        });
        break;
      case 'recent':
        filteredTopics.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
        break;
      case 'popular':
        filteredTopics.sort((a, b) => {
          const aTotal = a.reactions.seen + a.reactions.validated + a.reactions.inspired + a.reactions.heard;
          const bTotal = b.reactions.seen + b.reactions.validated + b.reactions.inspired + b.reactions.heard;
          return bTotal - aTotal;
        });
        break;
      case 'trending':
        filteredTopics.sort((a, b) => {
          const hoursSinceA = (Date.now() - a.lastActivity.getTime()) / (1000 * 60 * 60);
          const hoursSinceB = (Date.now() - b.lastActivity.getTime()) / (1000 * 60 * 60);
          const aTrending = (a.reactions.seen + a.reactions.validated + a.reactions.inspired + a.reactions.heard + a.commentCount) / Math.max(hoursSinceA, 1);
          const bTrending = (b.reactions.seen + b.reactions.validated + b.reactions.inspired + b.reactions.heard + b.commentCount) / Math.max(hoursSinceB, 1);
          return bTrending - aTrending;
        });
        break;
    }

    return filteredTopics;
  };

  const paginatedTopics = useMemo(() => {
    const filtered = getFilteredAndSortedTopics();
    const startIndex = (currentPage - 1) * TOPICS_PER_PAGE;
    const endIndex = startIndex + TOPICS_PER_PAGE;
    return {
      topics: filtered.slice(startIndex, endIndex),
      totalTopics: filtered.length,
      totalPages: Math.ceil(filtered.length / TOPICS_PER_PAGE)
    };
  }, [viewMode, selectedCompany, selectedForum, searchTerm, sortBy, timeFilter, currentPage]);

  const handleReaction = (topicId: string, reactionType: keyof Topic['reactions'], e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Reacted ${reactionType} to topic ${topicId}`);
  };

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompany(companyId);
    setViewMode('company');
    setSelectedForum(null);
    setCurrentPage(1);
  };

  const handleForumSelect = (forumId: string) => {
    setSelectedForum(forumId);
    setViewMode('forumDetail');
    setCurrentPage(1);
  };

  const handleForumBack = () => {
    if (selectedCompany) {
      setViewMode('company');
    } else {
      setViewMode('overview');
    }
    setSelectedForum(null);
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
    setSelectedCompany(null);
    setSelectedForum(null);
    setCurrentPage(1);
  };

  const handleBackToCompany = () => {
    setViewMode('company');
    setSelectedForum(null);
    setCurrentPage(1);
  };

  const handleTopicClick = (topic: Topic) => {
    navigate(`/dashboard/forums/topic/${topic.id}`);
  };

  const handleHashtagClick = (hashtag: string) => {
    setSearchTerm(`#${hashtag}`);
    setViewMode('overview');
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Overview Mode - Show all companies and global forums with recent topics
  if (viewMode === 'overview') {
    const recentTopics = getFilteredAndSortedTopics().slice(0, 10);
    return (
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent tracking-tight mb-2">Community Forums</h1>
              <p className="text-xl text-gray-600 font-medium">Connect across companies and communities</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 active:scale-95 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium text-lg whitespace-nowrap" >
              <Plus className="w-5 h-5" />
              <span>New Topic</span>
            </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="Search across all forums and companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-6 py-4 bg-gray-50/80 backdrop-blur-sm rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:bg-white outline-none transition-all border-2 border-gray-200 focus:border-purple-500 text-gray-900 placeholder-gray-500 font-medium hover:border-gray-300 text-lg"
            />
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Topics - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                Recent Discussions
              </h2>
              {/* Filters */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6 shadow-sm">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Sort By</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'relevant', label: 'Most Relevant', icon: BarChart3 },
                        { value: 'recent', label: 'Most Recent', icon: Clock },
                        { value: 'popular', label: 'Most Popular', icon: Heart },
                        { value: 'trending', label: 'Trending', icon: Flame }
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setSortBy(option.value as any)}
                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${sortBy === option.value ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Time Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'all', label: 'All Time' },
                        { value: 'today', label: 'Today' },
                        { value: 'week', label: 'This Week' },
                        { value: 'month', label: 'This Month' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTimeFilter(option.value as any)}
                          className={`p-3 rounded-xl border transition-all text-sm font-medium ${timeFilter === option.value ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Topics List */}
            <div className="space-y-4">
              {paginatedTopics.topics.map((topic, index) => {
                const forum = [...globalForums, ...companies.flatMap(c => c.forums)].find(f => f.id === topic.forumId);
                const company = companies.find(c => c.id === topic.companyId);
                return (
                  <div key={topic.id} className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-gray-200/50 hover:shadow-lg hover:border-purple-300 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/10 to-blue-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                      {/* Topic Header */}
                      <div className="flex items-start gap-3 md:gap-4 mb-4">
                        <button
                          onClick={() => handleUserClick(topic.author.id)}
                          className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 rounded-xl flex items-center justify-center text-lg md:text-xl shadow-sm border border-purple-200/50 flex-shrink-0 hover:bg-blue-200 transition-colors"
                        >
                          {topic.author.avatar}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <button
                              onClick={() => handleUserClick(topic.author.id)}
                              className="text-sm text-purple-700 font-bold bg-gradient-to-r from-purple-100 to-indigo-100 px-3 py-1.5 rounded-full border border-purple-200 hover:text-purple-800 transition-colors"
                            >
                              {topic.author.username}
                            </button>
                            {/* Forum Badge */}
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full font-medium">
                              {forum?.icon} {forum?.name}
                            </span>
                            {/* Company Badge */}
                            {company && (
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                                {company.name}
                              </span>
                            )}
                            {topic.scope === 'global' && (
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">Global</span>
                            )}
                            {topic.isPinned && (
                              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                <Star className="w-3 h-3" /> Pinned
                              </span>
                            )}
                            <span className="text-gray-400 font-medium">•</span>
                            <span className="text-gray-500 font-medium">{getTimeAgo(topic.createdAt)}</span>
                          </div>
                          <button
                            onClick={() => handleTopicClick(topic)}
                            className="text-base md:text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors leading-tight text-left break-words"
                          >
                            {topic.title}
                          </button>
                          <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed line-clamp-2 break-words">{topic.content}</p>
                          {topic.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {topic.tags.slice(0, 3).map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => handleHashtagClick(tag)}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium hover:text-blue-600 transition-colors"
                                >
                                  #{tag}
                                </button>
                              ))}
                              {topic.tags.length > 3 && (
                                <span className="text-xs text-gray-500">+{topic.tags.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Reactions and Stats */}
                      <div className="flex items-center justify-between flex-wrap gap-2 md:gap-4">
                        <div className="flex items-center gap-1 md:gap-4 flex-wrap">
                          <button
                            onClick={(e) => handleReaction(topic.id, 'seen', e)}
                            className={`flex items-center gap-1 md:gap-2 transition-colors font-medium hover:bg-green-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${topic.userReactions.seen ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">{topic.reactions.seen}</span>
                          </button>
                          <button
                            onClick={(e) => handleReaction(topic.id, 'validated', e)}
                            className={`flex items-center gap-1 md:gap-2 transition-colors font-medium hover:bg-blue-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${topic.userReactions.validated ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-sm">{topic.reactions.validated}</span>
                          </button>
                          <button
                            onClick={(e) => handleReaction(topic.id, 'inspired', e)}
                            className={`flex items-center gap-1 md:gap-2 transition-colors font-medium hover:bg-yellow-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${topic.userReactions.inspired ? 'text-yellow-600' : 'text-gray-500 hover:text-yellow-600'}`}
                          >
                            <Star className="w-4 h-4" />
                            <span className="text-sm">{topic.reactions.inspired}</span>
                          </button>
                          <button
                            onClick={(e) => handleReaction(topic.id, 'heard', e)}
                            className={`flex items-center gap-1 md:gap-2 transition-colors font-medium hover:bg-purple-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${topic.userReactions.heard ? 'text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}
                          >
                            <Heart className="w-4 h-4" />
                            <span className="text-sm">{topic.reactions.heard}</span>
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 md:gap-2 text-gray-500 hover:text-purple-600 transition-colors font-medium hover:bg-purple-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">{topic.commentCount}</span>
                          </button>
                        </div>
                        <div className="text-xs md:text-sm text-gray-500 w-full md:w-auto mt-2 md:mt-0">
                          Last activity {getTimeAgo(topic.lastActivity)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Pagination */}
              {paginatedTopics.totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-2xl p-4 border border-gray-200 mt-6 gap-4">
                  <div className="text-xs md:text-sm text-gray-600 text-center md:text-left">
                    Showing {((currentPage - 1) * TOPICS_PER_PAGE) + 1}-{Math.min(currentPage * TOPICS_PER_PAGE, paginatedTopics.totalTopics)} of {paginatedTopics.totalTopics} topics
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, paginatedTopics.totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg transition-colors ${currentPage === pageNum ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {paginatedTopics.totalPages > 5 && (
                        <>
                          <span className="text-gray-400">...</span>
                          <button
                            onClick={() => setCurrentPage(paginatedTopics.totalPages)}
                            className={`w-8 h-8 rounded-lg transition-colors ${currentPage === paginatedTopics.totalPages ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                            {paginatedTopics.totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setCurrentPage(Math.min(paginatedTopics.totalPages, currentPage + 1))}
                      disabled={currentPage === paginatedTopics.totalPages}
                      className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Sidebar - Companies and Global Forums */}
          <div className="space-y-6">
            {/* Global Community */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Global Community</h3>
              </div>
              <div className="space-y-3">
                {globalForums.map((forum) => (
                  <button
                    key={forum.id}
                    onClick={() => handleForumSelect(forum.id)}
                    className="w-full text-left bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{forum.icon}</span>
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{forum.name}</h4>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{forum.topicCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{forum.memberCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{forum.lastActivity}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Companies */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Building className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Companies</h3>
              </div>
              <div className="space-y-3">
                {companies.slice(0, 6).map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleCompanySelect(company.id)}
                    className={`w-full text-left bg-white/90 backdrop-blur-sm rounded-xl p-4 border transition-all group ${company.id === userCompany?.id ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm' : 'border-gray-200 hover:border-purple-300 hover:shadow-md'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold ${company.id === userCompany?.id ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gray-600'}`}>
                          {company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {company.name} {company.id === userCompany?.id && (
                            <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded font-medium">You</span>
                          )}
                        </h4>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{company.forums.reduce((sum, f) => sum + f.topicCount, 0)} topics</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{company.memberCount} members</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <CreateTopicModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
        <TopicDetailModal
          isOpen={showTopicDetail}
          onClose={() => setShowTopicDetail(false)}
          topic={selectedTopic}
          onUserClick={handleUserClick}
        />
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          profile={selectedUserProfile}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          onChat={handleChat}
          currentUserId={currentUser?.id}
        />
      </div>
    );
  }

  // Company View - Show forums for selected company with stats
  if (viewMode === 'company' && selectedCompany) {
    const company = companies.find(c => c.id === selectedCompany);
    if (!company) return null;
    const companyTopics = getFilteredAndSortedTopics();
    return (
      <div className="max-w-6xl mx-auto">
        {/* Company Header */}
        <header className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBackToOverview}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {company.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-gray-600">{company.memberCount} anonymous members</p>
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder={`Search ${company.name} forums...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-6 py-4 bg-gray-50/80 backdrop-blur-sm rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:bg-white outline-none transition-all border-2 border-gray-200 focus:border-purple-500 text-gray-900 placeholder-gray-500 font-medium hover:border-gray-300 text-lg"
            />
          </div>
        </header>
        {/* Company Forums Grid with Enhanced Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {company.forums.map((forum) => (
            <button
              key={forum.id}
              onClick={() => handleForumSelect(forum.id)}
              className="text-left bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{forum.icon}</span>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{forum.name}</h3>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">{forum.description}</p>
              {/* Clickable Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-lg font-bold text-blue-600">{forum.topicCount}</div>
                  <div className="text-xs text-blue-700 font-medium">Topics</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-lg font-bold text-purple-600">{forum.memberCount}</div>
                  <div className="text-xs text-purple-700 font-medium">Members</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs font-bold text-green-600">{forum.lastActivity}</div>
                  <div className="text-xs text-green-700 font-medium">Last</div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-sm text-purple-600 font-medium group-hover:text-purple-700 transition-colors">
                  View Forum →
                </span>
              </div>
            </button>
          ))}
        </div>
        <CreateTopicModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} forumName={company.name} companyId={selectedCompany} />
        <TopicDetailModal
          isOpen={showTopicDetail}
          onClose={() => setShowTopicDetail(false)}
          topic={selectedTopic}
          onUserClick={handleUserClick}
        />
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          profile={selectedUserProfile}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          onChat={handleChat}
          currentUserId={currentUser?.id}
        />
      </div>
    );
  }

  // Forum Detail View - Show forum with join functionality
  if (viewMode === 'forumDetail' && selectedForum) {
    const forum = [...globalForums, ...companies.flatMap(c => c.forums)].find(f => f.id === selectedForum);
    if (!forum) return null;

    return (
      <ForumDetailView
        forum={forum}
        onBack={handleForumBack}
      />
    );
  }

  // Forum View - Show topics in selected forum with enhanced filtering and pagination
  if ((viewMode === 'forum' || viewMode === 'global') && selectedForum) {
    const isGlobalForum = viewMode === 'global';
    const forum = isGlobalForum ? globalForums.find(f => f.id === selectedForum) : companies.flatMap(c => c.forums).find(f => f.id === selectedForum);
    if (!forum) return null;
    return (
      <div className="max-w-6xl mx-auto">
        {/* Forum Header */}
        <header className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={isGlobalForum ? handleBackToOverview : handleBackToCompany}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-4xl">{forum.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{forum.name}</h1>
              <p className="text-gray-600">{forum.description}</p>
              {!isGlobalForum && selectedCompany && (
                <p className="text-sm text-purple-600 font-medium">
                  {companies.find(c => c.id === selectedCompany)?.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative group flex-1">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
              <input
                type="text"
                placeholder={`Search ${forum.name} topics...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-4 bg-gray-50/80 backdrop-blur-sm rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:bg-white outline-none transition-all border-2 border-gray-200 focus:border-purple-500 text-gray-900 placeholder-gray-500 font-medium hover:border-gray-300 text-lg"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 active:scale-95 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium text-lg whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span>New Topic</span>
            </button>
          </div>
          {/* Filters */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              {[
                { value: 'relevant', label: 'Relevant', icon: BarChart3 },
                { value: 'recent', label: 'Recent', icon: Clock },
                { value: 'popular', label: 'Popular', icon: Heart },
                { value: 'trending', label: 'Trending', icon: Flame }
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${sortBy === option.value ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>
        {/* Forum Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Topics</span>
            </div>
            <div className="text-3xl font-bold text-purple-600 group-hover:text-purple-700 transition-colors">{forum.topicCount}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Members</span>
            </div>
            <div className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">{forum.memberCount}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </div>
            <div className="text-3xl font-bold text-green-600 group-hover:text-green-700 transition-colors">{paginatedTopics.topics.length}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Last Activity</span>
            </div>
            <div className="text-lg font-bold text-orange-600 group-hover:text-orange-700 transition-colors">{forum.lastActivity}</div>
          </div>
        </div>
        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6 shadow-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Time Range</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'all', label: 'All Time' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'This Week' },
                    { value: 'month', label: 'This Month' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTimeFilter(option.value as any)}
                      className={`p-3 rounded-xl border transition-all text-sm font-medium ${timeFilter === option.value ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Topic Scope</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedFilter('all')}
                    className={`p-3 rounded-xl border transition-all text-sm font-medium ${selectedFilter === 'all' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                  >
                    All Topics
                  </button>
                  <button
                    onClick={() => setSelectedFilter('local')}
                    className={`p-3 rounded-xl border transition-all text-sm font-medium ${selectedFilter === 'local' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                  >
                    Company Only
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Topics List */}
        <div className="space-y-6">
          {paginatedTopics.topics.map((topic) => {
            const topicForum = isGlobalForum
              ? globalForums.find(f => f.id === topic.forumId)
              : companies.flatMap(c => c.forums).find(f => f.id === topic.forumId);
            const topicCompany = companies.find(c => c.id === topic.companyId);

            return (
              <div key={topic.id} className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-gray-200/50 hover:shadow-lg hover:border-purple-300 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/10 to-blue-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  {/* Topic Header */}
                  <div className="flex items-start gap-3 md:gap-4 mb-4">
                    <button
                      onClick={() => handleUserClick(topic.author.id)}
                      className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 rounded-xl flex items-center justify-center text-lg md:text-xl shadow-sm border border-purple-200/50 flex-shrink-0 hover:bg-blue-200 transition-colors"
                    >
                      {topic.author.avatar}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <button
                          onClick={() => handleUserClick(topic.author.id)}
                          className="text-sm text-purple-700 font-bold bg-gradient-to-r from-purple-100 to-indigo-100 px-3 py-1.5 rounded-full border border-purple-200 hover:text-purple-800 transition-colors"
                        >
                          {topic.author.username}
                        </button>
                        {/* Forum Badge */}
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full font-medium">
                          {topicForum?.icon} {topicForum?.name}
                        </span>
                        {/* Company Badge */}
                        {topicCompany && (
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                            {topicCompany.name}
                          </span>
                        )}
                        {topic.scope === 'global' && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">Global</span>
                        )}
                        {topic.isPinned && (
                          <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <Star className="w-3 h-3" /> Pinned
                          </span>
                        )}
                        <span className="text-gray-400 font-medium">•</span>
                        <span className="text-gray-500 font-medium">{getTimeAgo(topic.createdAt)}</span>
                      </div>
                      <button
                        onClick={() => handleTopicClick(topic)}
                        className="text-base md:text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors leading-tight text-left break-words"
                      >
                        {topic.title}
                      </button>
                      <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed line-clamp-2 break-words">{topic.content}</p>
                      {topic.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {topic.tags.slice(0, 3).map((tag) => (
                            <button
                              key={tag}
                              onClick={() => handleHashtagClick(tag)}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium hover:text-blue-600 transition-colors"
                            >
                              #{tag}
                            </button>
                          ))}
                          {topic.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{topic.tags.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Reactions and Stats */}
                  <div className="flex items-center justify-between flex-wrap gap-2 md:gap-4">
                    <div className="flex items-center gap-1 md:gap-4 flex-wrap">
                      <button
                        onClick={(e) => handleReaction(topic.id, 'seen', e)}
                        className={`flex items-center gap-1 md:gap-2 transition-colors font-medium hover:bg-green-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${topic.userReactions.seen ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">{topic.reactions.seen}</span>
                      </button>
                      <button
                        onClick={(e) => handleReaction(topic.id, 'validated', e)}
                        className={`flex items-center gap-1 md:gap-2 transition-colors font-medium hover:bg-blue-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${topic.userReactions.validated ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">{topic.reactions.validated}</span>
                      </button>
                      <button
                        onClick={(e) => handleReaction(topic.id, 'inspired', e)}
                        className={`flex items-center gap-1 md:gap-2 transition-colors font-medium hover:bg-yellow-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${topic.userReactions.inspired ? 'text-yellow-600' : 'text-gray-500 hover:text-yellow-600'}`}
                      >
                        <Star className="w-4 h-4" />
                        <span className="text-sm">{topic.reactions.inspired}</span>
                      </button>
                      <button
                        onClick={(e) => handleReaction(topic.id, 'heard', e)}
                        className={`flex items-center gap-1 md:gap-2 transition-colors font-medium hover:bg-purple-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${topic.userReactions.heard ? 'text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}
                      >
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{topic.reactions.heard}</span>
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 md:gap-2 text-gray-500 hover:text-purple-600 transition-colors font-medium hover:bg-purple-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{topic.commentCount}</span>
                      </button>
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 w-full md:w-auto mt-2 md:mt-0">
                      Last activity {getTimeAgo(topic.lastActivity)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Pagination */}
          {paginatedTopics.totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-2xl p-4 border border-gray-200 mt-6 gap-4">
              <div className="text-xs md:text-sm text-gray-600 text-center md:text-left">
                Showing {((currentPage - 1) * TOPICS_PER_PAGE) + 1}-{Math.min(currentPage * TOPICS_PER_PAGE, paginatedTopics.totalTopics)} of {paginatedTopics.totalTopics} topics
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, paginatedTopics.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg transition-colors ${currentPage === pageNum ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {paginatedTopics.totalPages > 5 && (
                    <>
                      <span className="text-gray-400">...</span>
                      <button
                        onClick={() => setCurrentPage(paginatedTopics.totalPages)}
                        className={`w-8 h-8 rounded-lg transition-colors ${currentPage === paginatedTopics.totalPages ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        {paginatedTopics.totalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(paginatedTopics.totalPages, currentPage + 1))}
                  disabled={currentPage === paginatedTopics.totalPages}
                  className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        <CreateTopicModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} forumName={forum.name} companyId={isGlobalForum ? null : selectedCompany} />
        <TopicDetailModal
          isOpen={showTopicDetail}
          onClose={() => setShowTopicDetail(false)}
          topic={selectedTopic}
          onUserClick={handleUserClick}
        />
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          profile={selectedUserProfile}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          onChat={handleChat}
          currentUserId={currentUser?.id}
        />
      </div>
    );
  }

  // Fallback view
  return null;
}