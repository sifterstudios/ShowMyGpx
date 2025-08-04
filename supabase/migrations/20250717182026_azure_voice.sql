/*
  # Fix user_profiles RLS policies

  1. Security Updates
    - Add INSERT policy for authenticated users to create their own profile
    - Update existing policies to work with Supabase auth instead of Clerk
    - Ensure users can create and manage their own profiles

  2. Changes
    - Add policy for INSERT operations
    - Update SELECT and UPDATE policies to use auth.uid()
    - Change clerk_user_id references to work with Supabase auth
*/

-- Drop existing policies that reference clerk_user_id incorrectly
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create new policies that work with Supabase auth
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = clerk_user_id)
  WITH CHECK (auth.uid()::text = clerk_user_id);