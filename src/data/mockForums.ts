import { Forum, Topic, Company, UserProfile } from '../types/forum';

// Foundation forums that every company gets
export const foundationForums: Omit<Forum, 'id' | 'companyId' | 'topicCount' | 'memberCount' | 'lastActivity'>[] = [
  {
    name: 'Career Growth',
    description: 'Advancement strategies, promotion tips, and career development',
    icon: '📈',
    isGlobal: false,
    category: 'foundation'
  },
  {
    name: 'Sponsorship',
    description: 'Finding sponsors and building influential relationships',
    icon: '🤝',
    isGlobal: false,
    category: 'foundation'
  },
  {
    name: 'Bias & Microaggressions',
    description: 'Addressing workplace bias and microaggressions',
    icon: '⚖️',
    isGlobal: false,
    category: 'foundation'
  },
  {
    name: 'Mentorship',
    description: 'Mentor connections and guidance',
    icon: '🎯',
    isGlobal: false,
    category: 'foundation'
  },
  {
    name: 'Wellbeing',
    description: 'Mental health, work-life balance, and self-care',
    icon: '🌱',
    isGlobal: false,
    category: 'foundation'
  }
];

// Global forums shared across all companies
export const globalForums: Forum[] = [
  {
    id: 'global-industry-insights',
    name: 'Industry Insights',
    description: 'Cross-industry trends, news, and analysis',
    icon: '🌐',
    isGlobal: true,
    category: 'global',
    topicCount: 156,
    memberCount: 2847,
    lastActivity: '2m ago'
  },
  {
    id: 'global-leadership-journeys',
    name: 'Leadership Journeys',
    description: 'Stories and lessons from leaders across industries',
    icon: '👑',
    isGlobal: true,
    category: 'global',
    topicCount: 89,
    memberCount: 1923,
    lastActivity: '15m ago'
  },
  {
    id: 'global-entrepreneurship',
    name: 'Entrepreneurship',
    description: 'Starting businesses, side hustles, and innovation',
    icon: '🚀',
    isGlobal: true,
    category: 'global',
    topicCount: 234,
    memberCount: 1456,
    lastActivity: '8m ago'
  }
];

// Mock companies with their foundation forums
export const companies: Company[] = [
  {
    id: 'techcorp',
    name: 'TechCorp',
    memberCount: 127,
    forums: foundationForums.map((forum, index) => ({
      ...forum,
      id: `techcorp-${forum.name.toLowerCase().replace(/\s+/g, '-')}`,
      companyId: 'techcorp',
      topicCount: Math.floor(Math.random() * 50) + 10,
      memberCount: Math.floor(Math.random() * 80) + 20,
      lastActivity: ['2m ago', '15m ago', '1h ago', '3h ago'][Math.floor(Math.random() * 4)]
    }))
  },
  {
    id: 'google',
    name: 'Google',
    memberCount: 342,
    forums: foundationForums.map((forum, index) => ({
      ...forum,
      id: `google-${forum.name.toLowerCase().replace(/\s+/g, '-')}`,
      companyId: 'google',
      topicCount: Math.floor(Math.random() * 80) + 20,
      memberCount: Math.floor(Math.random() * 120) + 40,
      lastActivity: ['5m ago', '20m ago', '45m ago', '2h ago'][Math.floor(Math.random() * 4)]
    }))
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    memberCount: 298,
    forums: foundationForums.map((forum, index) => ({
      ...forum,
      id: `microsoft-${forum.name.toLowerCase().replace(/\s+/g, '-')}`,
      companyId: 'microsoft',
      topicCount: Math.floor(Math.random() * 70) + 15,
      memberCount: Math.floor(Math.random() * 100) + 30,
      lastActivity: ['1m ago', '10m ago', '30m ago', '1h ago'][Math.floor(Math.random() * 4)]
    }))
  },
  {
    id: 'goldman-sachs',
    name: 'Goldman Sachs',
    memberCount: 156,
    forums: foundationForums.map((forum, index) => ({
      ...forum,
      id: `goldman-sachs-${forum.name.toLowerCase().replace(/\s+/g, '-')}`,
      companyId: 'goldman-sachs',
      topicCount: Math.floor(Math.random() * 40) + 8,
      memberCount: Math.floor(Math.random() * 60) + 15,
      lastActivity: ['3m ago', '25m ago', '1h ago', '4h ago'][Math.floor(Math.random() * 4)]
    }))
  }
];

// Mock topics for demonstration
export const mockTopics: Topic[] = [
  {
    id: '1',
    title: 'How to navigate promotion conversations?',
    content: 'Has anyone had success asking for a promotion during review cycles? Looking for specific strategies that worked...',
    author: {
      id: 'user1',
      username: 'RisingLeader247',
      avatar: '🌟'
    },
    forumId: 'techcorp-career-growth',
    companyId: 'techcorp',
    scope: 'local',
    reactions: { seen: 45, validated: 18, inspired: 12, heard: 24 },
    userReactions: { seen: false, validated: false, inspired: false, heard: false },
    commentCount: 12,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 5 * 60 * 1000),
    isPinned: false,
    tags: ['promotion', 'career-advancement']
  },
  {
    id: '2',
    title: 'Microaggressions in team meetings',
    content: 'Looking for strategies to address subtle but consistent interruptions and dismissive behavior during meetings...',
    author: {
      id: 'user2',
      username: 'ThoughtfulVoice89',
      avatar: '💫'
    },
    forumId: 'techcorp-bias-microaggressions',
    companyId: 'techcorp',
    scope: 'global',
    reactions: { seen: 67, validated: 31, inspired: 8, heard: 28 },
    userReactions: { seen: true, validated: false, inspired: false, heard: true },
    commentCount: 18,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 15 * 60 * 1000),
    isPinned: true,
    tags: ['microaggressions', 'meetings', 'bias']
  },
  {
    id: '3',
    title: 'Building confidence in technical discussions',
    content: 'Sometimes I feel like my ideas aren\'t taken seriously in meetings. How do you build confidence when speaking up?',
    author: {
      id: 'user3',
      username: 'QuietInnovator456',
      avatar: '⚡'
    },
    forumId: 'google-career-growth',
    companyId: 'google',
    scope: 'global',
    reactions: { seen: 23, validated: 15, inspired: 12, heard: 9 },
    userReactions: { seen: false, validated: true, inspired: false, heard: false },
    commentCount: 8,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 30 * 60 * 1000),
    isPinned: false,
    tags: ['confidence', 'technical-discussions']
  },
  {
    id: '4',
    title: 'The Future of Remote Work in Tech',
    content: 'What are your thoughts on the long-term impact of remote work on career advancement and company culture?',
    author: {
      id: 'user4',
      username: 'FutureThinking',
      avatar: '🔮'
    },
    forumId: 'global-industry-insights',
    scope: 'global',
    reactions: { seen: 134, validated: 67, inspired: 89, heard: 45 },
    userReactions: { seen: false, validated: false, inspired: true, heard: false },
    commentCount: 34,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 10 * 60 * 1000),
    isPinned: false,
    tags: ['remote-work', 'future-of-work', 'tech-industry']
  }
];

// Mock user profiles
export const mockUserProfiles: UserProfile[] = [
  {
    id: 'user1',
    username: 'ThoughtfulLeader92',
    avatar: '🌟',
    bio: 'Passionate about creating inclusive workplaces and helping others navigate corporate challenges. Always happy to share experiences and learn from others.',
    demographics: {
      careerLevel: 'Senior (8-12 years)',
      company: 'TechCorp',
      affinityTags: ['Black Women in Tech', 'Women in Leadership']
    },
    stats: {
      postsCreated: 24,
      commentsPosted: 67,
      helpfulReactions: 156,
      nooksJoined: 8
    },
    badges: ['Helpful Voice', 'Community Builder', 'Mentor'],
    joinedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    isFollowing: false
  },
  {
    id: 'user2',
    username: 'RisingLeader247',
    avatar: '💫',
    bio: 'Early career professional focused on growth and learning. Love connecting with mentors and peers.',
    demographics: {
      careerLevel: 'Junior (1-3 years)',
      company: 'Google',
      affinityTags: ['Early Career Professionals']
    },
    stats: {
      postsCreated: 12,
      commentsPosted: 34,
      helpfulReactions: 78,
      nooksJoined: 5
    },
    badges: ['Rising Star', 'Active Participant'],
    joinedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    isFollowing: false
  },
  {
    id: 'user3',
    username: 'QuietInnovator456',
    avatar: '⚡',
    bio: 'Introverted but passionate about technology and innovation. Building confidence in sharing ideas.',
    demographics: {
      careerLevel: 'Mid-level (4-7 years)',
      company: 'Microsoft',
      affinityTags: ['Introverts in Tech']
    },
    stats: {
      postsCreated: 8,
      commentsPosted: 23,
      helpfulReactions: 45,
      nooksJoined: 3
    },
    badges: ['Thoughtful Contributor'],
    joinedDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    isFollowing: false
  }
];