// src/admin/types/index.ts
// Shared types used across all admin pages.

export type ExportFormat = 'csv' | 'pdf';
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: string;
  label: string;
}

export interface ApiMeta {
  total: number;
  total_pages: number;
  page?: number;
  limit?: number;
}

// ── Analytics ────────────────────────────────────────────────────────────────

export interface SignupsData {
  total: number;
  completed_onboarding: number;
  not_completed_onboarding: number;
  onboarding_completion_rate: number;
  by_provider: Record<string, number>;
  company_verified: number;
  verification_rate: number;
  today: number;
  this_week: number;
  this_month: number;
}

export interface EngagementData {
  dau: number;
  wau: number;
  mau: number;
  dau_mau_ratio: number;
  posts_this_week: number;
  posts_this_month: number;
  topics_this_week: number;
  topics_this_month: number;
  comments_this_week: number;
  messages_this_week: number;
  messages_this_month: number;
  active_conversations: number;
  active_nooks: number;
  mentorship_matches: number;
  identity_reveals: number;
  avg_posts_per_user: number;
}

export interface RetentionData {
  d7_retention: number;
  d30_retention: number;
  churned_users: number;
  total_active: number;
}

export interface ModerationAnalytics {
  reports_total: number;
  reports_this_week: number;
  reports_by_category: Record<string, number>;
  content_hidden_this_week: number;
  avg_resolve_time_hours: number;
  pending_reports: number;
}

export interface ChartSeries {
  labels: string[];
  data: number[];
}

export interface AnalyticsData {
  signups: SignupsData;
  engagement: EngagementData;
  retention: RetentionData;
  moderation: ModerationAnalytics;
  charts: {
    signups_30d: ChartSeries;
  };
}

export interface FunnelData {
  signup: number;
  otp_verified: number;
  onboarding_completed: number;
  first_post: number;
  first_message: number;
  first_mentorship: number;
  conversion_rates: {
    signup_to_onboarding: string;
    onboarding_to_first_post: string;
    onboarding_to_first_message: string;
    signup_to_active: string;
  };
}

export interface GrowthData {
  period: string;
  charts: {
    signups: ChartSeries;
    posts: ChartSeries;
    topics: ChartSeries;
    messages: ChartSeries;
  };
  wow_growth: Record<string, string>;
}

export interface TopContentAuthor {
  username: string;
  avatar: string;
}

export interface TopPost {
  id: string;
  likes: number;
  comments: number;
  created_at: string;
  author: TopContentAuthor;
}

export interface TopTopic {
  id: string;
  title: string;
  comments: number;
  views: number;
  created_at: string;
  author: TopContentAuthor;
}

export interface TopForum {
  id: string;
  name: string;
}

export interface PowerUser {
  user_id: string;
  count: number;
  username: string;
  avatar: string;
}

export interface TopContentData {
  top_posts: TopPost[];
  top_topics: TopTopic[];
  top_forums: TopForum[];
  power_users: PowerUser[];
}

// ── Health ────────────────────────────────────────────────────────────────────

export type HealthStatus = 'up' | 'degraded' | 'down';

export interface HealthModuleStatus {
  status: HealthStatus;
  latency_ms: number | null;
  error?: string;
  resolution?: string;
}

export interface HealthData {
  status: HealthStatus;
  timestamp: string;
  uptime_seconds: number;
  modules: Record<string, HealthModuleStatus>;
}

export interface HealthHistoryEntry {
  status: HealthStatus;
  latency_ms: number | null;
  checked_at: string;
}

export interface HealthHistoryData {
  period: string;
  uptime: Record<string, string>;
  history: Record<string, HealthHistoryEntry[]>;
}
