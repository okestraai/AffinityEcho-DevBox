/*
  # Disable RLS for Identity Reveals

  Temporarily disable RLS on identity_reveals table for development.
*/

-- Disable RLS on identity_reveals table
ALTER TABLE identity_reveals DISABLE ROW LEVEL SECURITY;
