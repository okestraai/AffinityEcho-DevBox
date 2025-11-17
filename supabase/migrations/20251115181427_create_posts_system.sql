/*
  # Create Posts System

  This migration creates the infrastructure for user posts in the feeds.

  ## New Tables
  
  ### `posts`
  Stores user-generated posts that appear in feeds
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - User who created the post
  - `content` (text) - The post text content
  - `images` (jsonb, nullable) - Array of image URLs
  - `link_data` (jsonb, nullable) - Link preview data (title, description, thumbnail, url)
  - `post_type` (text) - Type: post, achievement, article, job, milestone
  - `privacy` (text) - Privacy level: public, connections, private
  - `created_at` (timestamptz) - When the post was created
  - `updated_at` (timestamptz) - When the post was last updated

  ### `post_likes`
  Tracks user likes on posts
  - `id` (uuid, primary key) - Unique identifier
  - `post_id` (uuid, foreign key) - The liked post
  - `user_id` (uuid, foreign key) - User who liked the post
  - `created_at` (timestamptz) - When the like occurred

  ### `post_bookmarks`
  Tracks user bookmarks on posts
  - `id` (uuid, primary key) - Unique identifier
  - `post_id` (uuid, foreign key) - The bookmarked post
  - `user_id` (uuid, foreign key) - User who bookmarked the post
  - `created_at` (timestamptz) - When the bookmark occurred

  ### `post_comments`
  Stores comments on posts
  - `id` (uuid, primary key) - Unique identifier
  - `post_id` (uuid, foreign key) - The post being commented on
  - `user_id` (uuid, foreign key) - User who created the comment
  - `content` (text) - Comment text
  - `created_at` (timestamptz) - When the comment was created
  - `updated_at` (timestamptz) - When the comment was last updated

  ## Security
  - Enable RLS on all tables
  - Users can view public posts and posts from connections
  - Users can only edit/delete their own posts
  - Users can like, bookmark, and comment on posts they can view

  ## Indexes
  - Index on user_id and created_at for efficient post queries
  - Index on post_id for likes, bookmarks, and comments
*/

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  images jsonb DEFAULT '[]'::jsonb,
  link_data jsonb,
  post_type text DEFAULT 'post' NOT NULL CHECK (post_type IN ('post', 'achievement', 'article', 'job', 'milestone')),
  privacy text DEFAULT 'public' NOT NULL CHECK (privacy IN ('public', 'connections', 'private')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user_created 
  ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created 
  ON posts(created_at DESC);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Users can view public posts"
  ON posts FOR SELECT
  TO authenticated
  USING (privacy = 'public');

CREATE POLICY "Users can view own posts"
  ON posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Create indexes for post_likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post 
  ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user 
  ON post_likes(user_id);

-- Enable RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_likes
CREATE POLICY "Users can view all likes"
  ON post_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own likes"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create post_bookmarks table
CREATE TABLE IF NOT EXISTS post_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Create indexes for post_bookmarks
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_post 
  ON post_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user 
  ON post_bookmarks(user_id);

-- Enable RLS
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON post_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON post_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON post_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post 
  ON post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_user 
  ON post_comments(user_id);

-- Enable RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_comments
CREATE POLICY "Users can view comments on visible posts"
  ON post_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_comments.post_id
      AND (posts.privacy = 'public' OR posts.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create comments on visible posts"
  ON post_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_comments.post_id
      AND (posts.privacy = 'public' OR posts.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own comments"
  ON post_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_updated_at'
  ) THEN
    CREATE TRIGGER update_posts_updated_at
      BEFORE UPDATE ON posts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_post_comments_updated_at'
  ) THEN
    CREATE TRIGGER update_post_comments_updated_at
      BEFORE UPDATE ON post_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;