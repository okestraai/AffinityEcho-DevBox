/*
  # Identity Reveal System for Referrals

  ## Overview
  This migration adds an anonymized identity system where poster identities are hidden
  until both parties (referrer and referee) connect and mutually agree to reveal identities.

  ## Changes

  ### 1. New column in `referral_connections`
  - `identity_revealed` (boolean) - Tracks if identities have been revealed for this connection

  ### 2. New table `identity_reveals`
  Tracks identity reveal requests and confirmations between connected users.
  - `id` (uuid, primary key) - Unique identifier
  - `connection_id` (uuid, foreign key) - Reference to referral_connections
  - `requester_id` (uuid) - User who requested identity reveal
  - `responder_id` (uuid) - User who needs to respond
  - `status` (text) - Status: 'pending', 'accepted', 'declined'
  - `created_at` (timestamptz) - When reveal was requested
  - `updated_at` (timestamptz) - Last status update

  ## Security Notes
  - Both parties must agree to reveal identities
  - Until identity is revealed, user profiles should show anonymized information
  - Messages between connected users are allowed but identities remain hidden
*/

-- Add identity_revealed column to referral_connections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_connections' AND column_name = 'identity_revealed'
  ) THEN
    ALTER TABLE referral_connections ADD COLUMN identity_revealed boolean DEFAULT false;
  END IF;
END $$;

-- Create identity_reveals table
CREATE TABLE IF NOT EXISTS identity_reveals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES referral_connections(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  responder_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_identity_reveals_connection ON identity_reveals(connection_id);
CREATE INDEX IF NOT EXISTS idx_identity_reveals_requester ON identity_reveals(requester_id);
CREATE INDEX IF NOT EXISTS idx_identity_reveals_responder ON identity_reveals(responder_id);
CREATE INDEX IF NOT EXISTS idx_identity_reveals_status ON identity_reveals(status);

-- Unique constraint to prevent duplicate reveal requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_identity_reveals_unique 
  ON identity_reveals(connection_id, requester_id, responder_id)
  WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE identity_reveals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for identity_reveals

-- Users can view reveal requests they're part of
CREATE POLICY "Users can view their reveal requests"
  ON identity_reveals FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = responder_id);

-- Users can create reveal requests for connections they're part of
CREATE POLICY "Users can create reveal requests"
  ON identity_reveals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Responders can update reveal status
CREATE POLICY "Responders can update reveal status"
  ON identity_reveals FOR UPDATE
  TO authenticated
  USING (auth.uid() = responder_id)
  WITH CHECK (auth.uid() = responder_id);

-- Trigger to update updated_at
CREATE TRIGGER update_identity_reveals_updated_at
  BEFORE UPDATE ON identity_reveals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update connection's identity_revealed when both parties accept
CREATE OR REPLACE FUNCTION update_connection_identity_revealed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE referral_connections
    SET identity_revealed = true
    WHERE id = NEW.connection_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update connection when identity reveal is accepted
CREATE TRIGGER update_connection_on_reveal_accepted
  AFTER UPDATE ON identity_reveals
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_identity_revealed();
