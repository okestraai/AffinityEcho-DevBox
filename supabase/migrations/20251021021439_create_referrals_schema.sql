/*
  # Job Referrals & Recommendations Feature Schema

  ## Overview
  This migration creates the database schema for the job referrals and recommendations feature,
  enabling community-driven referrals and recommendations across companies.

  ## New Tables

  ### 1. `referral_posts`
  Main table for storing referral requests and offers.
  - `id` (uuid, primary key) - Unique identifier for each referral post
  - `user_id` (uuid, foreign key) - Reference to the user who created the post
  - `type` (text) - Type of post: 'request' or 'offer'
  - `title` (text) - Title/summary of the referral post
  - `company` (text) - Company name
  - `job_title` (text, nullable) - Specific job title (for requests)
  - `job_link` (text, nullable) - URL to job posting (for requests)
  - `description` (text) - Detailed description
  - `scope` (text) - Visibility: 'global' or 'company'
  - `status` (text) - Current status: 'open' or 'closed'
  - `available_slots` (integer, nullable) - Number of referrals available (for offers)
  - `total_slots` (integer, nullable) - Total referrals offered (for offers)
  - `tags` (text[], array) - Searchable tags/keywords
  - `views_count` (integer) - Number of views
  - `likes_count` (integer) - Number of likes
  - `comments_count` (integer) - Number of comments
  - `bookmarks_count` (integer) - Number of bookmarks
  - `created_at` (timestamptz) - When the post was created
  - `updated_at` (timestamptz) - When the post was last updated
  - `last_activity_at` (timestamptz) - Timestamp of last activity (comment, like, etc.)

  ### 2. `referral_comments`
  Comments on referral posts.
  - `id` (uuid, primary key) - Unique identifier for each comment
  - `referral_post_id` (uuid, foreign key) - Reference to the referral post
  - `user_id` (uuid, foreign key) - Reference to the user who commented
  - `content` (text) - Comment text
  - `created_at` (timestamptz) - When the comment was created
  - `updated_at` (timestamptz) - When the comment was last updated

  ### 3. `referral_likes`
  Track user likes on referral posts.
  - `id` (uuid, primary key) - Unique identifier
  - `referral_post_id` (uuid, foreign key) - Reference to the referral post
  - `user_id` (uuid, foreign key) - Reference to the user who liked
  - `created_at` (timestamptz) - When the like was created

  ### 4. `referral_bookmarks`
  Track user bookmarks on referral posts.
  - `id` (uuid, primary key) - Unique identifier
  - `referral_post_id` (uuid, foreign key) - Reference to the referral post
  - `user_id` (uuid, foreign key) - Reference to the user who bookmarked
  - `created_at` (timestamptz) - When the bookmark was created

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to:
    - View all referral posts (global scope) or company-specific posts
    - Create their own referral posts
    - Update/delete only their own posts
    - Comment on any post
    - Like and bookmark posts
    - View comments from all users

  ## Indexes
  - Index on `referral_posts.user_id` for user's posts lookup
  - Index on `referral_posts.type` for filtering by request/offer
  - Index on `referral_posts.status` for filtering by open/closed
  - Index on `referral_posts.company` for company search
  - Index on `referral_posts.created_at` for chronological sorting
  - Index on `referral_comments.referral_post_id` for comment lookup
  - Unique index on `referral_likes(referral_post_id, user_id)` to prevent duplicate likes
  - Unique index on `referral_bookmarks(referral_post_id, user_id)` to prevent duplicate bookmarks
*/

-- Create referral_posts table
CREATE TABLE IF NOT EXISTS referral_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('request', 'offer')),
  title text NOT NULL,
  company text NOT NULL,
  job_title text,
  job_link text,
  description text NOT NULL,
  scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'company')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  available_slots integer CHECK (available_slots >= 0),
  total_slots integer CHECK (total_slots >= 0),
  tags text[] DEFAULT '{}',
  views_count integer DEFAULT 0 CHECK (views_count >= 0),
  likes_count integer DEFAULT 0 CHECK (likes_count >= 0),
  comments_count integer DEFAULT 0 CHECK (comments_count >= 0),
  bookmarks_count integer DEFAULT 0 CHECK (bookmarks_count >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now()
);

-- Create referral_comments table
CREATE TABLE IF NOT EXISTS referral_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_post_id uuid NOT NULL REFERENCES referral_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create referral_likes table
CREATE TABLE IF NOT EXISTS referral_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_post_id uuid NOT NULL REFERENCES referral_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create referral_bookmarks table
CREATE TABLE IF NOT EXISTS referral_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_post_id uuid NOT NULL REFERENCES referral_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_posts_user_id ON referral_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_posts_type ON referral_posts(type);
CREATE INDEX IF NOT EXISTS idx_referral_posts_status ON referral_posts(status);
CREATE INDEX IF NOT EXISTS idx_referral_posts_company ON referral_posts(company);
CREATE INDEX IF NOT EXISTS idx_referral_posts_created_at ON referral_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_posts_last_activity ON referral_posts(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_comments_post_id ON referral_comments(referral_post_id);
CREATE INDEX IF NOT EXISTS idx_referral_comments_created_at ON referral_comments(created_at DESC);

-- Create unique constraints to prevent duplicate likes and bookmarks
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_likes_unique ON referral_likes(referral_post_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_bookmarks_unique ON referral_bookmarks(referral_post_id, user_id);

-- Enable Row Level Security
ALTER TABLE referral_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_posts

-- Policy: All authenticated users can view referral posts
CREATE POLICY "Anyone can view referral posts"
  ON referral_posts FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create their own referral posts
CREATE POLICY "Users can create their own referral posts"
  ON referral_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own referral posts
CREATE POLICY "Users can update their own referral posts"
  ON referral_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own referral posts
CREATE POLICY "Users can delete their own referral posts"
  ON referral_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for referral_comments

-- Policy: All authenticated users can view comments
CREATE POLICY "Anyone can view comments"
  ON referral_comments FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create comments
CREATE POLICY "Users can create comments"
  ON referral_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON referral_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON referral_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for referral_likes

-- Policy: All authenticated users can view likes
CREATE POLICY "Anyone can view likes"
  ON referral_likes FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create likes
CREATE POLICY "Users can create likes"
  ON referral_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
  ON referral_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for referral_bookmarks

-- Policy: All authenticated users can view bookmarks
CREATE POLICY "Anyone can view bookmarks"
  ON referral_bookmarks FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create bookmarks
CREATE POLICY "Users can create bookmarks"
  ON referral_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON referral_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_referral_posts_updated_at
  BEFORE UPDATE ON referral_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_comments_updated_at
  BEFORE UPDATE ON referral_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update engagement counts and last_activity_at
CREATE OR REPLACE FUNCTION update_referral_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'referral_comments' THEN
      UPDATE referral_posts
      SET comments_count = comments_count + 1,
          last_activity_at = now()
      WHERE id = NEW.referral_post_id;
    ELSIF TG_TABLE_NAME = 'referral_likes' THEN
      UPDATE referral_posts
      SET likes_count = likes_count + 1,
          last_activity_at = now()
      WHERE id = NEW.referral_post_id;
    ELSIF TG_TABLE_NAME = 'referral_bookmarks' THEN
      UPDATE referral_posts
      SET bookmarks_count = bookmarks_count + 1
      WHERE id = NEW.referral_post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'referral_comments' THEN
      UPDATE referral_posts
      SET comments_count = GREATEST(comments_count - 1, 0)
      WHERE id = OLD.referral_post_id;
    ELSIF TG_TABLE_NAME = 'referral_likes' THEN
      UPDATE referral_posts
      SET likes_count = GREATEST(likes_count - 1, 0)
      WHERE id = OLD.referral_post_id;
    ELSIF TG_TABLE_NAME = 'referral_bookmarks' THEN
      UPDATE referral_posts
      SET bookmarks_count = GREATEST(bookmarks_count - 1, 0)
      WHERE id = OLD.referral_post_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update engagement counts
CREATE TRIGGER update_comments_count
  AFTER INSERT OR DELETE ON referral_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_post_stats();

CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON referral_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_post_stats();

CREATE TRIGGER update_bookmarks_count
  AFTER INSERT OR DELETE ON referral_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_post_stats();
