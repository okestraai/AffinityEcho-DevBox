import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ReferralPost {
  id: string;
  user_id: string;
  type: 'request' | 'offer';
  title: string;
  company: string;
  job_title?: string;
  job_link?: string;
  description: string;
  scope: 'global' | 'company';
  status: 'open' | 'closed';
  available_slots?: number;
  total_slots?: number;
  tags: string[];
  views_count: number;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

export interface ReferralComment {
  id: string;
  referral_post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralLike {
  id: string;
  referral_post_id: string;
  user_id: string;
  created_at: string;
}

export interface ReferralBookmark {
  id: string;
  referral_post_id: string;
  user_id: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  bio?: string;
  company?: string;
  job_title?: string;
  location?: string;
  years_experience?: number;
  skills: string[];
  linkedin_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralConnection {
  id: string;
  referral_post_id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  identity_revealed: boolean;
  created_at: string;
  updated_at: string;
}

export interface IdentityReveal {
  id: string;
  connection_id: string;
  requester_id: string;
  responder_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}
