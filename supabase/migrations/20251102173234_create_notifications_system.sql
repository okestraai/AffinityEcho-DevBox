/*
  # Create Notifications System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users) - recipient of notification
      - `actor_id` (uuid, foreign key to auth.users) - user who triggered the notification
      - `type` (text) - notification type (follow, forum_post, nook_post, mentorship_request, etc.)
      - `title` (text) - notification title
      - `message` (text) - notification message
      - `action_url` (text, nullable) - URL to navigate when clicked
      - `reference_id` (uuid, nullable) - ID of the referenced item (post, request, etc.)
      - `reference_type` (text, nullable) - type of referenced item
      - `is_read` (boolean) - whether notification has been read
      - `action_taken` (boolean) - whether user took action on notification
      - `metadata` (jsonb, nullable) - additional data
      - `created_at` (timestamptz)
      - `read_at` (timestamptz, nullable)
    
    - `user_follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, foreign key) - user who follows
      - `following_id` (uuid, foreign key) - user being followed
      - `created_at` (timestamptz)
      - Unique constraint on (follower_id, following_id)

  2. Security
    - Enable RLS on all tables
    - Users can read their own notifications
    - Users can update their own notifications (mark as read)
    - Users can create follows
    - Users can read follows where they are involved

  3. Indexes
    - Index on user_id for fast notification queries
    - Index on created_at for sorting
    - Index on is_read for filtering
    - Composite index on user_id and is_read
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  reference_id uuid,
  reference_type text,
  is_read boolean DEFAULT false,
  action_taken boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  CHECK (type IN (
    'follow',
    'forum_post',
    'forum_comment',
    'forum_like',
    'nook_post',
    'nook_comment',
    'referral_post',
    'referral_comment',
    'referral_connection',
    'mentorship_request',
    'mentorship_accepted',
    'mentorship_message',
    'identity_reveal',
    'system'
  ))
);

-- Create user_follows table
CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Create indexes for user_follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_follows
CREATE POLICY "Users can view follows involving them"
  ON user_follows FOR SELECT
  TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create follows"
  ON user_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON user_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM notifications
  WHERE user_id = p_user_id AND is_read = false;
$$;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE user_id = p_user_id AND is_read = false;
$$;

-- Function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM user_follows
  WHERE following_id = p_user_id;
$$;

-- Function to get following count
CREATE OR REPLACE FUNCTION get_following_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM user_follows
  WHERE follower_id = p_user_id;
$$;

-- Function to check if user is following another user
CREATE OR REPLACE FUNCTION is_following(p_follower_id uuid, p_following_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM user_follows
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  );
$$;
