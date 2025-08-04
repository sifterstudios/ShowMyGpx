/*
  # User Management and Credit System

  1. New Tables
    - `user_profiles`
      - `id` (uuid, references auth.users)
      - `clerk_user_id` (text, unique)
      - `email` (text)
      - `credits` (integer, default 100 for new users)
      - `total_credits_purchased` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `credit_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `type` ('purchase' | 'usage' | 'bonus')
      - `amount` (integer, positive for purchase/bonus, negative for usage)
      - `description` (text)
      - `stripe_payment_intent_id` (text, nullable)
      - `created_at` (timestamp)
    
    - `gpx_files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `filename` (text)
      - `original_filename` (text)
      - `file_size` (bigint)
      - `storage_path` (text)
      - `route_name` (text, nullable)
      - `total_distance` (numeric, nullable)
      - `total_points` (integer, nullable)
      - `processed_images_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `street_view_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `gpx_file_id` (uuid, references gpx_files)
      - `credits_used` (integer)
      - `images_generated` (integer)
      - `api_calls_made` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for service role to manage credits and transactions

  3. Functions
    - Function to deduct credits safely
    - Function to add credits from purchases
    - Function to get user credit balance
</*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text UNIQUE NOT NULL,
  email text NOT NULL,
  credits integer DEFAULT 100,
  total_credits_purchased integer DEFAULT 0,
  max_gpx_files integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')),
  amount integer NOT NULL,
  description text NOT NULL,
  stripe_payment_intent_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create gpx_files table
CREATE TABLE IF NOT EXISTS gpx_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  route_name text,
  total_distance numeric,
  total_points integer,
  processed_images_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create street_view_usage table
CREATE TABLE IF NOT EXISTS street_view_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  gpx_file_id uuid REFERENCES gpx_files(id) ON DELETE CASCADE,
  credits_used integer NOT NULL,
  images_generated integer NOT NULL,
  api_calls_made integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpx_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_view_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- RLS Policies for credit_transactions
CREATE POLICY "Users can read own transactions"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

-- RLS Policies for gpx_files
CREATE POLICY "Users can read own GPX files"
  ON gpx_files
  FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can insert own GPX files"
  ON gpx_files
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can update own GPX files"
  ON gpx_files
  FOR UPDATE
  TO authenticated
  USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can delete own GPX files"
  ON gpx_files
  FOR DELETE
  TO authenticated
  USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

-- RLS Policies for street_view_usage
CREATE POLICY "Users can read own usage"
  ON street_view_usage
  FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

-- Function to safely deduct credits
CREATE OR REPLACE FUNCTION deduct_credits(
  p_clerk_user_id text,
  p_credits_to_deduct integer,
  p_description text,
  p_gpx_file_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_current_credits integer;
BEGIN
  -- Get user ID and current credits
  SELECT id, credits INTO v_user_id, v_current_credits
  FROM user_profiles
  WHERE clerk_user_id = p_clerk_user_id;
  
  -- Check if user exists
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Check if user has enough credits
  IF v_current_credits < p_credits_to_deduct THEN
    RETURN false;
  END IF;
  
  -- Deduct credits
  UPDATE user_profiles
  SET credits = credits - p_credits_to_deduct,
      updated_at = now()
  WHERE id = v_user_id;
  
  -- Record transaction
  INSERT INTO credit_transactions (user_id, type, amount, description)
  VALUES (v_user_id, 'usage', -p_credits_to_deduct, p_description);
  
  -- Record usage if GPX file provided
  IF p_gpx_file_id IS NOT NULL THEN
    INSERT INTO street_view_usage (user_id, gpx_file_id, credits_used, images_generated, api_calls_made)
    VALUES (v_user_id, p_gpx_file_id, p_credits_to_deduct, 1, 1);
  END IF;
  
  RETURN true;
END;
$$;

-- Function to add credits from purchase
CREATE OR REPLACE FUNCTION add_credits(
  p_clerk_user_id text,
  p_credits_to_add integer,
  p_description text,
  p_stripe_payment_intent_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM user_profiles
  WHERE clerk_user_id = p_clerk_user_id;
  
  -- Check if user exists
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Add credits
  UPDATE user_profiles
  SET credits = credits + p_credits_to_add,
      total_credits_purchased = total_credits_purchased + p_credits_to_add,
      updated_at = now()
  WHERE id = v_user_id;
  
  -- Record transaction
  INSERT INTO credit_transactions (user_id, type, amount, description, stripe_payment_intent_id)
  VALUES (v_user_id, 'purchase', p_credits_to_add, p_description, p_stripe_payment_intent_id);
  
  RETURN true;
END;
$$;

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION get_user_credits(p_clerk_user_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits integer;
BEGIN
  SELECT credits INTO v_credits
  FROM user_profiles
  WHERE clerk_user_id = p_clerk_user_id;
  
  RETURN COALESCE(v_credits, 0);
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_gpx_files_user_id ON gpx_files(user_id);
CREATE INDEX IF NOT EXISTS idx_gpx_files_created_at ON gpx_files(created_at);
CREATE INDEX IF NOT EXISTS idx_street_view_usage_user_id ON street_view_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_street_view_usage_gpx_file_id ON street_view_usage(gpx_file_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gpx_files_updated_at
  BEFORE UPDATE ON gpx_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();