/*
  # User Profiles and Connections Schema

  ## Overview
  Extends the referral system with user profiles and connection management functionality.

  ## New Tables

  ### 1. `user_profiles`
  Store additional user profile information.
  - `id` (uuid, primary key) - References auth.users
  - `username` (text) - Display name
  - `avatar` (text) - Avatar emoji or URL
  - `bio` (text, nullable) - User biography
  - `company` (text, nullable) - Current company
  - `job_title` (text, nullable) - Current job title
  - `location` (text, nullable) - Location
  - `years_experience` (integer, nullable) - Years of experience
  - `skills` (text[], array) - User skills
  - `linkedin_url` (text, nullable) - LinkedIn profile URL
  - `created_at` (timestamptz) - Profile creation date
  - `updated_at` (timestamptz) - Last profile update

  ### 2. `referral_connections`
  Track connection requests between users for referrals.
  - `id` (uuid, primary key) - Unique identifier
  - `referral_post_id` (uuid, foreign key) - Reference to referral post
  - `sender_id` (uuid) - User sending connection request
  - `receiver_id` (uuid) - User receiving connection request
  - `status` (text) - Status: 'pending', 'accepted', 'rejected'
  - `message` (text, nullable) - Optional message with request
  - `created_at` (timestamptz) - When request was created
  - `updated_at` (timestamptz) - When status was last updated

  ## Security
  - Enable RLS on all new tables
  - Users can view their own profile and others' public profiles
  - Users can create/update only their own profile
  - Users can view connections they're part of
  - Users can create connection requests
  - Users can update connection status for requests they received
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY,
  username text NOT NULL,
  avatar text DEFAULT '👤',
  bio text,
  company text,
  job_title text,
  location text,
  years_experience integer CHECK (years_experience >= 0),
  skills text[] DEFAULT '{}',
  linkedin_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create referral_connections table
CREATE TABLE IF NOT EXISTS referral_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_post_id uuid NOT NULL REFERENCES referral_posts(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles(company);
CREATE INDEX IF NOT EXISTS idx_referral_connections_sender ON referral_connections(sender_id);
CREATE INDEX IF NOT EXISTS idx_referral_connections_receiver ON referral_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_referral_connections_post ON referral_connections(referral_post_id);
CREATE INDEX IF NOT EXISTS idx_referral_connections_status ON referral_connections(status);

-- Unique constraint to prevent duplicate connection requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_connections_unique 
  ON referral_connections(referral_post_id, sender_id, receiver_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles

-- Anyone can view user profiles
CREATE POLICY "Anyone can view user profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for referral_connections

-- Users can view connections they're part of
CREATE POLICY "Users can view their connections"
  ON referral_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can create connection requests
CREATE POLICY "Users can create connection requests"
  ON referral_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Receivers can update connection status
CREATE POLICY "Receivers can update connection status"
  ON referral_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_connections_updated_at
  BEFORE UPDATE ON referral_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
