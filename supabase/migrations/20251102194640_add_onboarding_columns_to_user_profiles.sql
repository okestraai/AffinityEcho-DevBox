/*
  # Add Onboarding Columns to User Profiles

  1. Changes
    - Add `has_completed_onboarding` boolean column with default false
    - Add `is_willing_to_mentor` boolean column with default false
    - Add `badges` text array column with default empty array
    - Add `race` text column for demographics
    - Add `gender` text column for demographics
    - Add `career_level` text column for demographics
    - Add `affinity_tags` text array column for affinity groups

  2. Purpose
    - Track onboarding completion status
    - Store user demographics for affinity matching
    - Track badges and mentorship preferences
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'has_completed_onboarding'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN has_completed_onboarding boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_willing_to_mentor'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_willing_to_mentor boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'badges'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN badges text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'race'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN race text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN gender text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'career_level'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN career_level text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'affinity_tags'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN affinity_tags text[] DEFAULT '{}';
  END IF;
END $$;
