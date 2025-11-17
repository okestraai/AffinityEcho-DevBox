/*
  # Disable RLS for Referrals Development

  This migration temporarily disables RLS to allow easier development
  and removes auth requirements.
*/

-- Disable RLS on all referral tables
ALTER TABLE referral_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_connections DISABLE ROW LEVEL SECURITY;
