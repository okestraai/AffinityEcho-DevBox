import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Clock, Users, Shield, Zap, AlertTriangle, Heart, MessageCircle, X, Hash, Tag, Globe, Building, Flame, Timer, Eye, Lock } from 'lucide-react';
import { UserProfileModal } from '../Modals/UserProfileModal';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// Logging utility for consistent formatting
const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [NooksView.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [NooksView.${component}] ${message}`);
  }
};

export function NooksView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNook, setSelectedNook] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'all'>('grid');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Pagination state
  const [displayedNooks, setDisplayedNooks] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  
  const [filters, setFilters] = useState({
    urgency: 'all' as 'all' | 'high' | 'medium' | 'low',
    scope: 'all' as 'all' | 'company' | 'global',
    temperature: 'all' as 'all' | 'hot' | 'warm' | 'cool',
    hashtag: ''
  });
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
    scope: 'company' as 'company' | 'global',
    hashtags: [] as string[],
    hashtagInput: ''
  });

  const NOOKS_PER_PAGE = 8;

  // Generate more mock nooks for pagination demo
  const generateMockNooks = (count: number, startId: number = 9) => {
    const titles = [
      'Microaggressions at Work', 'Salary Negotiation Tips', 'Imposter Syndrome Support',
      'Work-Life Balance Tips', 'Remote Work Challenges', 'Leadership Transition Anxiety',
      'Networking Without Burnout', 'Pregnancy Discrimination', 'Age Bias in Tech',
      'Gender Pay Gap Discussion', 'Racial Bias in Hiring', 'LGBTQ+ Workplace Safety',
      'Disability Accommodations', 'Mental Health at Work', 'Career Pivot Anxiety',
      'Toxic Manager Support', 'Burnout Recovery', 'Interview Bias Stories',
      'Promotion Politics', 'Workplace Harassment'
    ];

    const descriptions = [
      'Safe space to share and process daily microaggressions',
      'Anonymous advice for upcoming discussions',
      'You\'re not alone in feeling this way',
      'Strategies for maintaining healthy boundaries',
      'Navigating isolation and communication barriers',
      'First-time managers sharing struggles and wins',
      'Building professional relationships sustainably',
      'Support for workplace pregnancy-related issues',
      'Addressing age-related workplace challenges',
      'Discussing compensation disparities anonymously'
    ];

    const hashtags = [
      ['microaggressions', 'workplace', 'support'],
      ['salary', 'negotiation', 'career'],
      ['imposter-syndrome', 'confidence', 'mental-health'],
      ['work-life-balance', 'wellness'],
      ['remote-work', 'isolation', 'communication'],
      ['leadership', 'management', 'anxiety'],
      ['networking', 'burnout', 'relationships'],
      ['pregnancy', 'discrimination', 'workplace-rights'],
      ['age-bias', 'tech', 'discrimination'],
      ['pay-gap', 'gender', 'equality']
    ];

    const urgencyLevels = ['high', 'medium', 'low'] as const;
    const scopes = ['company', 'global'] as const;
    const temperatures = ['hot', 'warm', 'cool'] as const;

    return Array.from({ length: count }, (_, i) => {
      const index = i % titles.length;
      return {
        id: (startId + i).toString(),
        title: titles[index],
        description: descriptions[index % descriptions.length],
        members: Math.floor(Math.random() * 20) + 3,
        timeLeft: `${Math.floor(Math.random() * 23) + 1}h ${Math.floor(Math.random() * 59)}m`,
        isActive: true,
        messages: Math.floor(Math.random() * 50) + 5,
        lastActivity: `${Math.floor(Math.random() * 60) + 1}m ago`,
        urgency: urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)],
        scope: scopes[Math.floor(Math.random() * scopes.length)],
        hashtags: hashtags[index % hashtags.length],
        temperature: temperatures[Math.floor(Math.random() * temperatures.length)]
      };
    });
  };

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

  // Log component initialization
  React.useEffect(() => {
    log('NooksView', 'Component initialized', { 
      showCreateModal, 
      selectedNook 
    });
  }, []);

  const activeNooks = [
    {
      id: '1',
      title: 'Microaggressions at Work',
      description: 'Safe space to share and process daily microaggressions',
      members: 12,
      timeLeft: '2h 45m',
      isActive: true,
      messages: 28,
      lastActivity: '5m ago',
      urgency: 'high' as const,
      scope: 'company' as const,
      hashtags: ['microaggressions', 'workplace', 'support'],
      temperature: 'hot'
    },
    {
      id: '2',
      title: 'Salary Negotiation Tips',
      description: 'Anonymous advice for upcoming salary discussions',
      members: 8,
      timeLeft: '5h 12m',
      isActive: true,
      messages: 15,
      lastActivity: '12m ago',
      urgency: 'medium' as const,
      scope: 'company' as const,
      hashtags: ['salary', 'negotiation', 'career'],
      temperature: 'warm'
    },
    {
      id: '3',
      title: 'Imposter Syndrome Support',
      description: 'You\'re not alone in feeling this way',
      members: 15,
      timeLeft: '1h 23m',
      isActive: true,
      messages: 42,
      lastActivity: '2m ago',
      urgency: 'high' as const,
      scope: 'global' as const,
      hashtags: ['imposter-syndrome', 'confidence', 'mental-health'],
      temperature: 'hot'
    },
    {
      id: '4',
      title: 'Work-Life Balance Tips',
      description: 'Strategies for maintaining healthy boundaries',
      members: 6,
      timeLeft: '8h 15m',
      isActive: true,
      messages: 9,
      lastActivity: '45m ago',
      urgency: 'low' as const,
      scope: 'global' as const,
      hashtags: ['work-life-balance', 'wellness'],
      temperature: 'cool'
    }
  ];

  // Extended mock data for demonstration
  const allNooks = [
    ...activeNooks,
    {
      id: '5',
      title: 'Remote Work Challenges',
      description: 'Navigating isolation and communication barriers',
      members: 9,
      timeLeft: '12h 30m',
      isActive: true,
      messages: 21,
      lastActivity: '1h ago',
      urgency: 'medium' as const,
      scope: 'global' as const,
      hashtags: ['remote-work', 'isolation', 'communication'],
      temperature: 'warm'
    },
    {
      id: '6',
      title: 'Leadership Transition Anxiety',
      description: 'First-time managers sharing struggles and wins',
      members: 7,
      timeLeft: '6h 45m',
      isActive: true,
      messages: 18,
      lastActivity: '25m ago',
      urgency: 'high' as const,
      scope: 'company' as const,
      hashtags: ['leadership', 'management', 'anxiety'],
      temperature: 'hot'
    },
    {
      id: '7',
      title: 'Networking Without Burnout',
      description: 'Building professional relationships sustainably',
      members: 11,
      timeLeft: '15h 20m',
      isActive: true,
      messages: 33,
      lastActivity: '8m ago',
      urgency: 'low' as const,
      scope: 'global' as const,
      hashtags: ['networking', 'burnout', 'relationships'],
      temperature: 'cool'
    },
    {
      id: '8',
      title: 'Pregnancy Discrimination',
      description: 'Support for workplace pregnancy-related issues',
      members: 5,
      timeLeft: '3h 15m',
      isActive: true,
      messages: 12,
      lastActivity: '20m ago',
      urgency: 'high' as const,
      scope: 'company' as const,
      hashtags: ['pregnancy', 'discrimination', 'workplace-rights'],
      temperature: 'hot'
    }
  ];

  // All nooks (including generated ones for pagination)
  const allNooksData = [...allNooks, ...generateMockNooks(50)];

  // Filter nooks based on current filters
  const getFilteredNooks = useCallback(() => {
    return allNooksData.filter(nook => {
      if (filters.urgency !== 'all' && nook.urgency !== filters.urgency) return false;
      if (filters.scope !== 'all' && nook.scope !== filters.scope) return false;
      if (filters.temperature !== 'all' && nook.temperature !== filters.temperature) return false;
      if (filters.hashtag && !nook.hashtags.some(tag => 
        tag.toLowerCase().includes(filters.hashtag.toLowerCase())
      )) return false;
      return true;
    });
  }, [filters]);

  // Load more nooks
  const loadMoreNooks = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);
    log('loadMoreNooks', 'Loading more nooks', { currentPage, displayedCount: displayedNooks.length });

    // Simulate API delay
    setTimeout(() => {
      const filteredNooks = getFilteredNooks();
      const startIndex = (currentPage - 1) * NOOKS_PER_PAGE;
      const endIndex = startIndex + NOOKS_PER_PAGE;
      const newNooks = filteredNooks.slice(startIndex, endIndex);

      if (newNooks.length === 0) {
        setHasMore(false);
        log('loadMoreNooks', 'No more nooks to load');
      } else {
        setDisplayedNooks(prev => [...prev, ...newNooks]);
        setCurrentPage(prev => prev + 1);
        log('loadMoreNooks', 'Nooks loaded', { 
          newNooksCount: newNooks.length,
          totalDisplayed: displayedNooks.length + newNooks.length,
          nextPage: currentPage + 1
        });
      }

      setLoading(false);
    }, 300);
  }, [loading, hasMore, currentPage, displayedNooks.length, getFilteredNooks]);

  // Reset pagination when filters change
  useEffect(() => {
    if (viewMode === 'all') {
      log('NooksView', 'Filters changed, resetting pagination', filters);

      const filteredNooks = getFilteredNooks();
      const initialNooks = filteredNooks.slice(0, NOOKS_PER_PAGE);
      
      setDisplayedNooks(initialNooks);
      setCurrentPage(2);
      setHasMore(filteredNooks.length > NOOKS_PER_PAGE);
      
      log('NooksView', 'Pagination reset complete', {
        initialNooksCount: initialNooks.length,
        totalAvailable: filteredNooks.length,
        hasMore: filteredNooks.length > NOOKS_PER_PAGE
      });
    }
  }, [filters, viewMode, getFilteredNooks]);

  // Initialize displayed nooks when switching to "all" view
  useEffect(() => {
    if (viewMode === 'all') {
      const filteredNooks = getFilteredNooks();
      const initialNooks = filteredNooks.slice(0, NOOKS_PER_PAGE);
      setDisplayedNooks(initialNooks);
      setCurrentPage(2);
      setHasMore(filteredNooks.length > NOOKS_PER_PAGE);
    }
  }, [viewMode, getFilteredNooks]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (viewMode !== 'all') return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          log('IntersectionObserver', 'Loading trigger activated');
          loadMoreNooks();
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [viewMode, hasMore, loading, loadMoreNooks]);

  const nooksToDisplay = viewMode === 'grid' ? activeNooks : displayedNooks;
  const totalFilteredCount = viewMode === 'all' ? getFilteredNooks().length : activeNooks.length;

  const addHashtag = () => {
    const tag = createForm.hashtagInput.trim().toLowerCase().replace(/^#/, '');
    if (tag && !createForm.hashtags.includes(tag)) {
      setCreateForm(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, tag],
        hashtagInput: ''
      }));
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setCreateForm(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleHashtagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addHashtag();
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCreateModal(false);
    setCreateForm({
      title: '',
      description: '',
      urgency: 'medium',
      scope: 'company',
      hashtags: [],
      hashtagInput: ''
    });
  };

  const resetFilters = () => {
    setFilters({
      urgency: 'all',
      scope: 'all',
      temperature: 'all',
      hashtag: ''
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'from-red-500 to-orange-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      case 'low': return 'from-blue-500 to-indigo-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getTemperatureIcon = (temperature: string) => {
    switch (temperature) {
      case 'hot': return <Flame className="w-4 h-4 text-red-500" />;
      case 'warm': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'cool': return <Eye className="w-4 h-4 text-blue-500" />;
      default: return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  if (selectedNook) {
    const nook = activeNooks.find(n => n.id === selectedNook);
    return (
      <>
        <div className="max-w-2xl mx-auto">
          {/* Nook Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <button 
                  onClick={() => setSelectedNook(null)}
                  className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  ← Back to Nooks
                </button>
                <div className="flex items-center gap-2">
                  {getTemperatureIcon(nook?.temperature || 'cool')}
                  <span className="text-sm font-medium capitalize">{nook?.temperature}</span>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold mb-2">{nook?.title}</h1>
              <p className="text-purple-100 mb-4">{nook?.description}</p>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                  <Timer className="w-3 h-3" />
                  <span>Expires in {nook?.timeLeft}</span>
                </div>
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                  <Users className="w-3 h-3" />
                  <span>{nook?.members} anonymous</span>
                </div>
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                  <MessageCircle className="w-3 h-3" />
                  <span>{nook?.messages} messages</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border-t border-yellow-200">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-yellow-600" />
                <p className="text-sm text-yellow-800 font-medium">
                  This nook will automatically delete in {nook?.timeLeft} • All messages are anonymous
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleUserClick('nook-user-1')}
                  className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold hover:scale-105 transition-transform cursor-pointer shadow-md"
                >
                  A
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => handleUserClick('nook-user-1')}
                      className="font-medium text-gray-900 hover:text-purple-600 transition-colors cursor-pointer"
                    >
                      Anonymous
                    </button>
                    <span className="text-xs text-gray-400">• 18h ago</span>
                  </div>
                  <p className="text-gray-700 mb-3 leading-relaxed">
                    Had another incident today where my manager interrupted me three times in a 30-minute meeting, but let my colleague speak uninterrupted. Starting to feel like my voice doesn't matter.
                  </p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>12 heard</span>
                    </button>
                    <button className="text-sm text-gray-500 hover:text-purple-600 transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleUserClick('nook-user-2')}
                  className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold hover:scale-105 transition-transform cursor-pointer shadow-md"
                >
                  B
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => handleUserClick('nook-user-2')}
                      className="font-medium text-gray-900 hover:text-purple-600 transition-colors cursor-pointer"
                    >
                      Anonymous
                    </button>
                    <span className="text-xs text-gray-400">• 16h ago</span>
                  </div>
                  <p className="text-gray-700 mb-3 leading-relaxed">
                    I've started documenting these incidents. Keep a record - date, time, witnesses. It helps if you need to escalate later. You're not imagining this.
                  </p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>8 validated</span>
                    </button>
                    <button className="text-sm text-gray-500 hover:text-purple-600 transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleUserClick('nook-user-3')}
                  className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold hover:scale-105 transition-transform cursor-pointer shadow-md"
                >
                  C
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => handleUserClick('nook-user-3')}
                      className="font-medium text-gray-900 hover:text-purple-600 transition-colors cursor-pointer"
                    >
                      Anonymous
                    </button>
                    <span className="text-xs text-gray-400">• 14h ago</span>
                  </div>
                  <p className="text-gray-700 mb-3 leading-relaxed">
                    You're not imagining it. This is a real pattern and your feelings are valid. Have you considered talking to HR or finding an ally in leadership?
                  </p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-500 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>15 heard</span>
                    </button>
                    <button className="text-sm text-gray-500 hover:text-purple-600 transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {user?.avatar || '?'}
              </div>
              <div className="flex-1">
                <textarea
                  placeholder="Share your thoughts anonymously..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none bg-gray-50 focus:bg-white transition-all"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="w-3 h-3" />
                    <span>Completely anonymous • Auto-deletes in {nook?.timeLeft}</span>
                  </div>
                  <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userId={selectedUserId || ''}
          onChat={handleChatUser}
        />
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-3xl mb-6 shadow-2xl">
          <Zap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-4">
          Nooks
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Anonymous safe spaces that disappear after 24 hours. Share freely, support others, and find your voice.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all">
          <div className="text-3xl font-bold text-purple-600 mb-1">24</div>
          <div className="text-sm text-gray-600 font-medium">Active Nooks</div>
        </div>
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all">
          <div className="text-3xl font-bold text-blue-600 mb-1">156</div>
          <div className="text-sm text-gray-600 font-medium">Anonymous Users</div>
        </div>
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all">
          <div className="text-3xl font-bold text-green-600 mb-1">2.4k</div>
          <div className="text-sm text-gray-600 font-medium">Messages Today</div>
        </div>
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all">
          <div className="text-3xl font-bold text-indigo-600 mb-1">100%</div>
          <div className="text-sm text-gray-600 font-medium">Anonymous</div>
        </div>
      </div>

      {/* Active Nooks Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {viewMode === 'grid' ? 'Active Conversations' : `All Nooks (${totalFilteredCount})`}
            </h2>
            {viewMode === 'grid' && allNooksData.length > 4 && (
              <button
                onClick={() => setViewMode('all')}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm bg-purple-50 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors"
              >
                View All ({allNooksData.length})
              </button>
            )}
            {viewMode === 'all' && (
              <button
                onClick={() => setViewMode('grid')}
                className="text-gray-600 hover:text-gray-700 font-medium text-sm bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                Back to Grid
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Create Nook
          </button>
        </div>
        
        {/* Filter Bar - Only show in "all" view */}
        {viewMode === 'all' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="font-semibold text-gray-900">Filter Nooks</h3>
              <button
                onClick={resetFilters}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Reset All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Urgency Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Urgency</label>
                <select
                  value={filters.urgency}
                  onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Scope Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Scope</label>
                <select
                  value={filters.scope}
                  onChange={(e) => setFilters(prev => ({ ...prev, scope: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                >
                  <option value="all">All Scopes</option>
                  <option value="company">Company Only</option>
                  <option value="global">Global</option>
                </select>
              </div>

              {/* Temperature Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Activity</label>
                <select
                  value={filters.temperature}
                  onChange={(e) => setFilters(prev => ({ ...prev, temperature: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                >
                  <option value="all">All Activity</option>
                  <option value="hot">🔥 Hot</option>
                  <option value="warm">⚡ Warm</option>
                  <option value="cool">👁️ Cool</option>
                </select>
              </div>

              {/* Hashtag Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Hashtag</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    value={filters.hashtag}
                    onChange={(e) => setFilters(prev => ({ ...prev, hashtag: e.target.value }))}
                    placeholder="Filter by tag"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(filters.urgency !== 'all' || filters.scope !== 'all' || filters.temperature !== 'all' || filters.hashtag) && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                {filters.urgency !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    Urgency: {filters.urgency}
                    <button onClick={() => setFilters(prev => ({ ...prev, urgency: 'all' }))}>×</button>
                  </span>
                )}
                {filters.scope !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Scope: {filters.scope}
                    <button onClick={() => setFilters(prev => ({ ...prev, scope: 'all' }))}>×</button>
                  </span>
                )}
                {filters.temperature !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    Activity: {filters.temperature}
                    <button onClick={() => setFilters(prev => ({ ...prev, temperature: 'all' }))}>×</button>
                  </span>
                )}
                {filters.hashtag && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    #{filters.hashtag}
                    <button onClick={() => setFilters(prev => ({ ...prev, hashtag: '' }))}>×</button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className={`grid gap-6 ${viewMode === 'all' ? 'md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2'}`}>
          {nooksToDisplay.map((nook) => (
            <div
              key={nook.id}
              className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => setSelectedNook(nook.id)}
            >
              {/* Nook Header */}
              <div className={`bg-gradient-to-r ${getUrgencyColor(nook.urgency)} p-1`}>
                <div className="bg-white/95 backdrop-blur-sm p-4 rounded-t-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-purple-600 transition-colors">
                        {nook.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{nook.description}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {getTemperatureIcon(nook.temperature)}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {nook.hashtags.map((tag) => (
                      <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nook Stats */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{nook.members}</div>
                    <div className="text-xs text-gray-500 font-medium">Anonymous</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{nook.messages}</div>
                    <div className="text-xs text-gray-500 font-medium">Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{nook.timeLeft}</div>
                    <div className="text-xs text-gray-500 font-medium">Remaining</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      nook.urgency === 'high' ? 'bg-red-100 text-red-700' :
                      nook.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {nook.urgency.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      nook.scope === 'global' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {nook.scope === 'global' ? 'GLOBAL' : 'COMPANY'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">Active {nook.lastActivity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination Loading Indicator - Only in "all" view */}
        {viewMode === 'all' && (
          <div ref={loadingRef} className="py-8">
            {loading && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-50 text-purple-600 rounded-full border border-purple-200">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Loading more nooks...</span>
                </div>
              </div>
            )}
            
            {!hasMore && displayedNooks.length > 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-full">
                  <span className="text-sm font-medium">You've seen all active nooks</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* No Results Message */}
        {viewMode === 'all' && nooksToDisplay.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-500 mb-1">No nooks match your filters</h3>
            <p className="text-sm text-gray-400 mb-4">Try adjusting your filter criteria</p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Create New Nook Section */}
      <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-3xl p-8 border border-purple-200 shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Need a Safe Space?</h2>
          <p className="text-gray-600">Create an anonymous nook for sensitive discussions</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 shadow-md">
            <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-bold text-gray-900 mb-1">100% Anonymous</h3>
            <p className="text-sm text-gray-600">No usernames or profiles shown</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 shadow-md">
            <Timer className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-bold text-gray-900 mb-1">24-Hour Limit</h3>
            <p className="text-sm text-gray-600">Auto-deletes for privacy</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 shadow-md">
            <Heart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-bold text-gray-900 mb-1">Safe Support</h3>
            <p className="text-sm text-gray-600">Moderated for safety</p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 transition-all font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-lg"
          >
            Create Your Nook
          </button>
        </div>
      </div>

      {/* Create Nook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Create Anonymous Nook</h3>
                  <p className="text-purple-100">A safe space for sensitive discussions</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">Topic Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What do you want to discuss?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-gray-50 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide context for your discussion..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none bg-gray-50 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">Hashtags</label>
                <div className="space-y-3">
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={createForm.hashtagInput}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, hashtagInput: e.target.value }))}
                      onKeyPress={handleHashtagKeyPress}
                      placeholder="Add hashtags (press Enter or Space)"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-gray-50 focus:bg-white transition-all"
                    />
                  </div>
                  
                  {createForm.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {createForm.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          <Tag className="w-3 h-3" />
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeHashtag(tag)}
                            className="text-purple-500 hover:text-purple-700 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">Urgency Level</label>
                  <select 
                    value={createForm.urgency}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, urgency: e.target.value as 'low' | 'medium' | 'high' }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-gray-50 focus:bg-white transition-all"
                  >
                    <option value="low">Low - General discussion</option>
                    <option value="medium">Medium - Seeking advice</option>
                    <option value="high">High - Urgent support needed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">Nook Scope</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateForm(prev => ({ ...prev, scope: 'company' }))}
                      className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                        createForm.scope === 'company'
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Building className="w-4 h-4 mx-auto mb-1" />
                      Company
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setCreateForm(prev => ({ ...prev, scope: 'global' }))}
                      className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                        createForm.scope === 'global'
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Globe className="w-4 h-4 mx-auto mb-1" />
                      Global
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-bold text-yellow-800">Auto-Delete Notice</span>
                </div>
                <p className="text-sm text-yellow-700 leading-relaxed">
                  This nook will automatically expire in 24 hours and all content will be permanently deleted. 
                  No recovery is possible. Use this space for sensitive discussions that need temporary anonymity.
                </p>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!createForm.title.trim() || !createForm.description.trim()}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                >
                  Create Nook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId || ''}
        onChat={handleChatUser}
      />
    </div>
  );
}