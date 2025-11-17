/*
  # Create Feeds System

  This migration creates the infrastructure for personalized user feeds that aggregate
  activity from across the platform.

  ## New Tables
  
  ### `feed_items`
  Stores individual feed items that appear in user feeds
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - User who should see this item
  - `activity_type` (text) - Type of activity (new_post, reply, mention, follow, etc.)
  - `content_type` (text) - Type of content (forum_topic, referral, comment, etc.)
  - `content_id` (uuid) - ID of the related content
  - `actor_id` (uuid) - User who performed the action
  - `title` (text) - Display title for the feed item
  - `description` (text, nullable) - Brief description or preview
  - `metadata` (jsonb, nullable) - Additional context (forum name, tags, etc.)
  - `created_at` (timestamptz) - When the activity occurred
  - `read_at` (timestamptz, nullable) - When user viewed this item

  ### `user_interests`
  Tracks user interests and engagement patterns
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - The user
  - `interest_type` (text) - Type (forum, topic, user, tag, etc.)
  - `interest_id` (uuid) - ID of the interested item
  - `engagement_score` (integer) - Score based on interactions
  - `last_interaction` (timestamptz) - Most recent engagement
  - `created_at` (timestamptz) - When interest was first recorded

  ### `user_follows`
  Tracks which users follow each other
  - `id` (uuid, primary key) - Unique identifier
  - `follower_id` (uuid, foreign key) - User doing the following
  - `following_id` (uuid, foreign key) - User being followed
  - `created_at` (timestamptz) - When the follow occurred

  ## Security
  - Enable RLS on all tables
  - Users can only view their own feed items
  - Users can manage their own interests and follows
  - Activity creation is handled by backend processes

  ## Indexes
  - Index on user_id and created_at for efficient feed queries
  - Index on content references for quick lookups
  - Index on engagement patterns for recommendations
*/

-- Create feed_items table
CREATE TABLE IF NOT EXISTS feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  read_at timestamptz
);

-- Create indexes for feed_items
CREATE INDEX IF NOT EXISTS idx_feed_items_user_created 
  ON feed_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_items_content 
  ON feed_items(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_unread 
  ON feed_items(user_id, read_at) WHERE read_at IS NULL;

-- Enable RLS
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feed_items
CREATE POLICY "Users can view own feed items"
  ON feed_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own feed items"
  ON feed_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create user_interests table
CREATE TABLE IF NOT EXISTS user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interest_type text NOT NULL,
  interest_id uuid NOT NULL,
  engagement_score integer DEFAULT 1 NOT NULL,
  last_interaction timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, interest_type, interest_id)
);

-- Create indexes for user_interests
CREATE INDEX IF NOT EXISTS idx_user_interests_user 
  ON user_interests(user_id, engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_interests_type 
  ON user_interests(interest_type, interest_id);

-- Enable RLS
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_interests
CREATE POLICY "Users can view own interests"
  ON user_interests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interests"
  ON user_interests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interests"
  ON user_interests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interests"
  ON user_interests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_follows table
CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create indexes for user_follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower 
  ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following 
  ON user_follows(following_id);

-- Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
CREATE POLICY "Users can view follows they're involved in"
  ON user_follows FOR SELECT
  TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create own follows"
  ON user_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
  ON user_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);