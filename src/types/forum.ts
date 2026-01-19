export interface Forum {
  id: string;
  name: string;
  description: string;
  icon: string;
  isGlobal: boolean;
  companyId?: string;
  topicCount: number;
  memberCount: number;
  lastActivity: string;
  category: 'foundation' | 'company' | 'global';
  isJoined?: boolean;
  rules?: string[];
  moderators?: string[];
}

export interface Topic {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  forumId: string;
  companyId?: string;
  scope: 'local' | 'global';
  reactions: {
    seen: number;
    validated: number;
    inspired: number;
    heard: number;
  };
  userReactions: {
    seen: boolean;
    validated: boolean;
    inspired: boolean;
    heard: boolean;
  };
  commentCount: number;
  createdAt: Date;
  lastActivity: Date;
  isPinned: boolean;
  tags: string[];
}

export interface Company {
  id: string;
  name: string;
  memberCount: number;
  forums: Forum[];
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  topicId: string;
  reactions: {
    helpful: number;
    supportive: number;
  };
  userReactions: {
    helpful: boolean;
    supportive: boolean;
  };
  createdAt: Date;
  replies: Comment[];
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  bio?: string;
  demographics: {
    race?: string;
    gender?: string;
    careerLevel?: string;
    company?: string;
    affinityTags?: string[];
  };
  stats: {
    postsCreated: number;
    commentsPosted: number;
    helpfulReactions: number;
    nooksJoined: number;
  };
  badges: string[];
  joinedDate: Date;
  isFollowing?: boolean;
  mentorProfile?: {
    expertise: string[];
    experience: string;
    style: string;
    availability: string;
    bio: string;
  };
}


export interface NookFilters {
  // Filter options
  urgency?: 'high' | 'medium' | 'low' | 'all';
  scope?: 'company' | 'global' | 'all';
  temperature?: 'hot' | 'warm' | 'cool' | 'all';
  hashtag?: string;
  
  // Sorting
  sortBy?: 'created_at' | 'last_activity_at' | 'members_count';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
}

export interface Nook {
  id: string;
  title: string;
  description: string;
  urgency: string;
  scope: string;
  temperature: string;
  hashtags: string[];
  members_count: number;
  messages_count: number;
  views_count: number;
  last_activity_at: string;
  expires_at: string;
  timeLeft: string;
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
}

export interface NooksResponse {
  success: boolean;
  data: {
    nooks: Nook[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}