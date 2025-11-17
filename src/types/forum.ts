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