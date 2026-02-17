// src/types/mentorship.ts — Shared mentorship interfaces

export interface MentorProfileData {
  bio: string;
  expertise: string[];
  industries: string[];
  availability: string;
  responseTime: string;
  style: string;
  mentorStyle: string;
  languages: string[];
  hourlyRate?: number | null;
  isWillingToMentor: boolean;
  isActive: boolean;
  createdAt?: string;
}

export interface MenteeProfileData {
  bio: string;
  goals: string;
  interests: string[];
  industries: string[];
  availability: string;
  mentoredStyle: string;
  urgency: string;
  topic: string;
  style: string;
  languages: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface MentorshipStatusData {
  mentoringAs: "mentor" | "mentee" | "both";
  communicationMethod?: string;
  isActiveMentor: boolean;
  isActiveMentee: boolean;
}

export interface MentorshipStatsData {
  reputationScore: number;
  mentorshipSessionsCompleted: number;
  totalPosts: number;
  totalComments: number;
  helpfulVotesReceived: number;
  followersCount: number;
  followingCount: number;
}

export interface MentorshipUserProfile {
  id: string;
  username: string;
  display_name?: string;
  avatar: string;
  bio: string;
  company: string;
  jobTitle: string;
  careerLevel: string;
  location?: string;
  expertise: string[];
  industries: string[];
  mentoringAs?: "mentor" | "mentee" | "both";
  availability?: string;
  responseTime?: string;
  matchScore?: number;
  isAvailable: boolean;
  totalMentees?: number;
  yearsOfExperience?: number;
  affinityTags: string[];
  mentorshipStyle?: string;
  languages?: string[];
  goals?: string;
  mentorshipDuration?: string;
  role?: string;
  status?: string;
  lastContact?: string;
  // Full profile data from API
  mentorProfile?: MentorProfileData | null;
  menteeProfile?: MenteeProfileData | null;
  mentorshipStatus?: MentorshipStatusData | null;
  mentorshipStats?: MentorshipStatsData | null;
}
