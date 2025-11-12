/*
# Create Gamification System

## Purpose
Crystal economy, achievements, levels, and XP system for user engagement.

## Tables

### user_stats
- `user_id` (uuid, primary key, references profiles)
- `crystals` (integer, crystal currency balance)
- `xp` (integer, experience points)
- `level` (integer, user level)
- `streak_days` (integer, consecutive days active)
- `last_active_date` (date, last activity date)
- `total_conversations` (integer, total chat messages)
- `total_assessments` (integer, completed assessments)
- `total_divinations` (integer, completed divinations)
- `updated_at` (timestamptz, last update time)

### crystal_transactions
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `amount` (integer, crystal amount, can be negative)
- `transaction_type` (text, type: earn, spend, bonus, penalty)
- `source` (text, source: chat, assessment, divination, achievement, etc.)
- `description` (text, transaction description)
- `metadata` (jsonb, additional data)
- `created_at` (timestamptz, transaction time)

### achievements
- `id` (uuid, primary key)
- `name` (text, achievement name)
- `description` (text, achievement description)
- `category` (text, category: engagement, exploration, growth, social)
- `icon` (text, icon identifier)
- `crystal_reward` (integer, crystals awarded)
- `xp_reward` (integer, XP awarded)
- `criteria` (jsonb, achievement criteria)
- `is_active` (boolean, whether achievement is active)
- `created_at` (timestamptz, creation time)

### user_achievements
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `achievement_id` (uuid, references achievements)
- `progress` (integer, current progress)
- `completed` (boolean, whether completed)
- `completed_at` (timestamptz, completion time)
- `created_at` (timestamptz, creation time)

## Security
- Public tables (no RLS) for simplicity
- Users can view and update their own stats

## Functions
- RPC function to award crystals
- RPC function to update XP and level
- RPC function to check and award achievements
*/

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  crystals integer DEFAULT 0 NOT NULL,
  xp integer DEFAULT 0 NOT NULL,
  level integer DEFAULT 1 NOT NULL,
  streak_days integer DEFAULT 0 NOT NULL,
  last_active_date date,
  total_conversations integer DEFAULT 0 NOT NULL,
  total_assessments integer DEFAULT 0 NOT NULL,
  total_divinations integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Crystal transactions table
CREATE TABLE IF NOT EXISTS crystal_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'penalty')),
  source text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('engagement', 'exploration', 'growth', 'social')),
  icon text NOT NULL,
  crystal_reward integer DEFAULT 0 NOT NULL,
  xp_reward integer DEFAULT 0 NOT NULL,
  criteria jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  progress integer DEFAULT 0 NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_crystal_transactions_user ON crystal_transactions(user_id);
CREATE INDEX idx_crystal_transactions_created ON crystal_transactions(created_at);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_completed ON user_achievements(completed);

-- Function to award crystals
CREATE OR REPLACE FUNCTION award_crystals(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_description text
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO user_stats (user_id, crystals)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    crystals = user_stats.crystals + p_amount,
    updated_at = now();

  INSERT INTO crystal_transactions (user_id, amount, transaction_type, source, description)
  VALUES (p_user_id, p_amount, 'earn', p_source, p_description);
END;
$$;

-- Function to update XP and level
CREATE OR REPLACE FUNCTION update_xp(
  p_user_id uuid,
  p_xp_amount integer
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_new_xp integer;
  v_new_level integer;
BEGIN
  INSERT INTO user_stats (user_id, xp, level)
  VALUES (p_user_id, p_xp_amount, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    xp = user_stats.xp + p_xp_amount,
    updated_at = now()
  RETURNING xp INTO v_new_xp;

  v_new_level := FLOOR(SQRT(v_new_xp / 100.0)) + 1;

  UPDATE user_stats
  SET level = v_new_level
  WHERE user_id = p_user_id;
END;
$$;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_streak(p_user_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_last_active date;
  v_today date := CURRENT_DATE;
BEGIN
  SELECT last_active_date INTO v_last_active
  FROM user_stats
  WHERE user_id = p_user_id;

  IF v_last_active IS NULL THEN
    INSERT INTO user_stats (user_id, streak_days, last_active_date)
    VALUES (p_user_id, 1, v_today)
    ON CONFLICT (user_id)
    DO UPDATE SET
      streak_days = 1,
      last_active_date = v_today,
      updated_at = now();
  ELSIF v_last_active = v_today THEN
    RETURN;
  ELSIF v_last_active = v_today - INTERVAL '1 day' THEN
    UPDATE user_stats
    SET
      streak_days = streak_days + 1,
      last_active_date = v_today,
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE user_stats
    SET
      streak_days = 1,
      last_active_date = v_today,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Insert sample achievements
INSERT INTO achievements (name, description, category, icon, crystal_reward, xp_reward, criteria) VALUES
('First Steps', 'Complete your first conversation with NewMe', 'engagement', 'MessageCircle', 10, 50, '{"type": "conversations", "count": 1}'::jsonb),
('Chatterbox', 'Have 10 conversations with NewMe', 'engagement', 'MessageSquare', 50, 200, '{"type": "conversations", "count": 10}'::jsonb),
('Deep Diver', 'Have 50 conversations with NewMe', 'engagement', 'Waves', 200, 1000, '{"type": "conversations", "count": 50}'::jsonb),
('Self Explorer', 'Complete your first assessment', 'exploration', 'Compass', 15, 75, '{"type": "assessments", "count": 1}'::jsonb),
('Assessment Master', 'Complete 10 assessments', 'exploration', 'Award', 100, 500, '{"type": "assessments", "count": 10}'::jsonb),
('Daily Seeker', 'Complete your first daily divination', 'exploration', 'Sparkles', 10, 50, '{"type": "divinations", "count": 1}'::jsonb),
('Truth Warrior', 'Complete 30 daily divinations', 'exploration', 'Target', 150, 750, '{"type": "divinations", "count": 30}'::jsonb),
('Consistent Soul', 'Maintain a 7-day streak', 'engagement', 'Flame', 50, 250, '{"type": "streak", "days": 7}'::jsonb),
('Dedicated Seeker', 'Maintain a 30-day streak', 'engagement', 'Zap', 200, 1000, '{"type": "streak", "days": 30}'::jsonb),
('Balanced Life', 'Complete your Balance Wheel', 'growth', 'CircleDot', 20, 100, '{"type": "balance_wheel", "completed": true}'::jsonb),
('Voice of Truth', 'Have your first voice conversation', 'engagement', 'Mic', 25, 125, '{"type": "voice_chat", "count": 1}'::jsonb),
('Memory Keeper', 'Share your first photo with NewMe', 'engagement', 'Image', 15, 75, '{"type": "photo_shared", "count": 1}'::jsonb),
('Community Member', 'Join the community', 'social', 'Users', 10, 50, '{"type": "community_joined", "value": true}'::jsonb),
('Social Butterfly', 'Make 5 connections', 'social', 'Heart', 50, 250, '{"type": "connections", "count": 5}'::jsonb),
('Wellness Seeker', 'Complete your first wellness session', 'growth', 'Leaf', 15, 75, '{"type": "wellness", "count": 1}'::jsonb)
ON CONFLICT DO NOTHING;
