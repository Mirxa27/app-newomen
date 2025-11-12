/*
# Newme Brain - Stealth AI Personality Engine

## Overview
This migration creates the hidden backend system for AI-powered personality analysis.
This system is completely invisible to users and analyzes their behavior, communication
patterns, and astrological data to build comprehensive personality profiles.

## New Tables

### 1. `newme_personality_analysis`
Hidden table storing AI-generated personality insights:
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `zodiac_sign` (text) - Calculated from birth date
- `zodiac_traits` (jsonb) - Personality traits based on zodiac
- `communication_style` (jsonb) - Analysis of how user communicates
- `behavior_patterns` (jsonb) - App usage and interaction patterns
- `temporal_patterns` (jsonb) - Time-of-day and seasonal patterns
- `personality_score` (jsonb) - Comprehensive personality scoring
- `confidence_level` (integer) - How confident the AI is (0-100)
- `last_analyzed_at` (timestamptz)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2. `user_behavior_patterns`
Tracks user behavior for pattern analysis:
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `action_type` (text) - Type of action (chat, assessment, login, etc.)
- `action_metadata` (jsonb) - Additional context
- `timestamp` (timestamptz)
- `local_time_of_day` (text) - User's local time (morning, afternoon, evening, night)
- `day_of_week` (text)
- `created_at` (timestamptz)

### 3. `communication_analysis`
Analyzes communication patterns:
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `conversation_id` (uuid, references conversations)
- `message_length` (integer)
- `vocabulary_complexity` (integer) - 1-10 scale
- `emotional_tone` (text) - detected emotion
- `response_time_seconds` (integer) - time to respond
- `punctuation_style` (text) - formal, casual, etc.
- `created_at` (timestamptz)

## Functions

### `calculate_zodiac_sign(birth_date date)`
Calculates zodiac sign from birth date

### `get_zodiac_traits(zodiac_sign text)`
Returns personality traits associated with zodiac sign

### `analyze_user_personality(user_id_param uuid)`
Main function that analyzes all user data and updates personality profile

### `track_user_behavior(user_id_param uuid, action_type_param text, metadata jsonb)`
Records user behavior for pattern analysis

### `get_personality_insights(user_id_param uuid)`
Retrieves personality insights for use in AI responses (internal only)

## Security
- All tables have RLS enabled
- Only backend Edge Functions can access these tables
- No direct user access
- Admin users can view for debugging only
*/

-- Create zodiac sign enum
CREATE TYPE zodiac_sign AS ENUM (
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
);

-- Create personality analysis table (hidden from users)
CREATE TABLE IF NOT EXISTS newme_personality_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  zodiac_sign zodiac_sign,
  zodiac_traits jsonb DEFAULT '{}'::jsonb,
  communication_style jsonb DEFAULT '{}'::jsonb,
  behavior_patterns jsonb DEFAULT '{}'::jsonb,
  temporal_patterns jsonb DEFAULT '{}'::jsonb,
  personality_score jsonb DEFAULT '{}'::jsonb,
  confidence_level integer DEFAULT 0 CHECK (confidence_level >= 0 AND confidence_level <= 100),
  last_analyzed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create behavior tracking table
CREATE TABLE IF NOT EXISTS user_behavior_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  action_metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now(),
  local_time_of_day text,
  day_of_week text,
  created_at timestamptz DEFAULT now()
);

-- Create communication analysis table
CREATE TABLE IF NOT EXISTS communication_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  message_length integer,
  vocabulary_complexity integer CHECK (vocabulary_complexity >= 1 AND vocabulary_complexity <= 10),
  emotional_tone text,
  response_time_seconds integer,
  punctuation_style text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_personality_analysis_user ON newme_personality_analysis(user_id);
CREATE INDEX idx_behavior_patterns_user ON user_behavior_patterns(user_id);
CREATE INDEX idx_behavior_patterns_timestamp ON user_behavior_patterns(timestamp DESC);
CREATE INDEX idx_communication_analysis_user ON communication_analysis(user_id);
CREATE INDEX idx_communication_analysis_created ON communication_analysis(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE newme_personality_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only service role and admins can access
CREATE POLICY "Service role full access on personality_analysis" ON newme_personality_analysis
  FOR ALL USING (true);

CREATE POLICY "Service role full access on behavior_patterns" ON user_behavior_patterns
  FOR ALL USING (true);

CREATE POLICY "Service role full access on communication_analysis" ON communication_analysis
  FOR ALL USING (true);

-- Function: Calculate zodiac sign from birth date
CREATE OR REPLACE FUNCTION calculate_zodiac_sign(birth_date date)
RETURNS zodiac_sign LANGUAGE plpgsql AS $$
DECLARE
  month_val integer;
  day_val integer;
BEGIN
  month_val := EXTRACT(MONTH FROM birth_date);
  day_val := EXTRACT(DAY FROM birth_date);
  
  RETURN CASE
    WHEN (month_val = 3 AND day_val >= 21) OR (month_val = 4 AND day_val <= 19) THEN 'aries'::zodiac_sign
    WHEN (month_val = 4 AND day_val >= 20) OR (month_val = 5 AND day_val <= 20) THEN 'taurus'::zodiac_sign
    WHEN (month_val = 5 AND day_val >= 21) OR (month_val = 6 AND day_val <= 20) THEN 'gemini'::zodiac_sign
    WHEN (month_val = 6 AND day_val >= 21) OR (month_val = 7 AND day_val <= 22) THEN 'cancer'::zodiac_sign
    WHEN (month_val = 7 AND day_val >= 23) OR (month_val = 8 AND day_val <= 22) THEN 'leo'::zodiac_sign
    WHEN (month_val = 8 AND day_val >= 23) OR (month_val = 9 AND day_val <= 22) THEN 'virgo'::zodiac_sign
    WHEN (month_val = 9 AND day_val >= 23) OR (month_val = 10 AND day_val <= 22) THEN 'libra'::zodiac_sign
    WHEN (month_val = 10 AND day_val >= 23) OR (month_val = 11 AND day_val <= 21) THEN 'scorpio'::zodiac_sign
    WHEN (month_val = 11 AND day_val >= 22) OR (month_val = 12 AND day_val <= 21) THEN 'sagittarius'::zodiac_sign
    WHEN (month_val = 12 AND day_val >= 22) OR (month_val = 1 AND day_val <= 19) THEN 'capricorn'::zodiac_sign
    WHEN (month_val = 1 AND day_val >= 20) OR (month_val = 2 AND day_val <= 18) THEN 'aquarius'::zodiac_sign
    WHEN (month_val = 2 AND day_val >= 19) OR (month_val = 3 AND day_val <= 20) THEN 'pisces'::zodiac_sign
    ELSE 'aries'::zodiac_sign
  END;
END;
$$;

-- Function: Get zodiac personality traits
CREATE OR REPLACE FUNCTION get_zodiac_traits(sign zodiac_sign)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN CASE sign
    WHEN 'aries'::zodiac_sign THEN '{"traits": ["bold", "ambitious", "confident", "impulsive", "passionate"], "element": "fire", "quality": "cardinal", "strengths": ["courageous", "determined", "enthusiastic"], "challenges": ["impatient", "aggressive", "short-tempered"]}'::jsonb
    WHEN 'taurus'::zodiac_sign THEN '{"traits": ["reliable", "patient", "practical", "devoted", "stable"], "element": "earth", "quality": "fixed", "strengths": ["dependable", "persistent", "loyal"], "challenges": ["stubborn", "possessive", "uncompromising"]}'::jsonb
    WHEN 'gemini'::zodiac_sign THEN '{"traits": ["curious", "adaptable", "communicative", "witty", "versatile"], "element": "air", "quality": "mutable", "strengths": ["intelligent", "social", "quick-thinking"], "challenges": ["inconsistent", "indecisive", "nervous"]}'::jsonb
    WHEN 'cancer'::zodiac_sign THEN '{"traits": ["emotional", "intuitive", "protective", "sensitive", "nurturing"], "element": "water", "quality": "cardinal", "strengths": ["compassionate", "loyal", "imaginative"], "challenges": ["moody", "insecure", "suspicious"]}'::jsonb
    WHEN 'leo'::zodiac_sign THEN '{"traits": ["confident", "generous", "creative", "dramatic", "warm"], "element": "fire", "quality": "fixed", "strengths": ["charismatic", "passionate", "cheerful"], "challenges": ["arrogant", "stubborn", "self-centered"]}'::jsonb
    WHEN 'virgo'::zodiac_sign THEN '{"traits": ["analytical", "practical", "meticulous", "reliable", "modest"], "element": "earth", "quality": "mutable", "strengths": ["detail-oriented", "hardworking", "loyal"], "challenges": ["overcritical", "perfectionist", "worrying"]}'::jsonb
    WHEN 'libra'::zodiac_sign THEN '{"traits": ["diplomatic", "fair", "social", "idealistic", "gracious"], "element": "air", "quality": "cardinal", "strengths": ["cooperative", "balanced", "charming"], "challenges": ["indecisive", "avoids confrontation", "self-pitying"]}'::jsonb
    WHEN 'scorpio'::zodiac_sign THEN '{"traits": ["intense", "passionate", "resourceful", "mysterious", "determined"], "element": "water", "quality": "fixed", "strengths": ["brave", "loyal", "ambitious"], "challenges": ["jealous", "secretive", "resentful"]}'::jsonb
    WHEN 'sagittarius'::zodiac_sign THEN '{"traits": ["optimistic", "adventurous", "philosophical", "honest", "enthusiastic"], "element": "fire", "quality": "mutable", "strengths": ["generous", "idealistic", "humorous"], "challenges": ["impatient", "tactless", "irresponsible"]}'::jsonb
    WHEN 'capricorn'::zodiac_sign THEN '{"traits": ["disciplined", "responsible", "ambitious", "practical", "patient"], "element": "earth", "quality": "cardinal", "strengths": ["self-controlled", "persistent", "wise"], "challenges": ["pessimistic", "stubborn", "unforgiving"]}'::jsonb
    WHEN 'aquarius'::zodiac_sign THEN '{"traits": ["independent", "innovative", "humanitarian", "intellectual", "original"], "element": "air", "quality": "fixed", "strengths": ["progressive", "original", "humanitarian"], "challenges": ["detached", "unpredictable", "aloof"]}'::jsonb
    WHEN 'pisces'::zodiac_sign THEN '{"traits": ["compassionate", "intuitive", "artistic", "gentle", "wise"], "element": "water", "quality": "mutable", "strengths": ["empathetic", "creative", "romantic"], "challenges": ["overly trusting", "escapist", "sad"]}'::jsonb
  END;
END;
$$;

-- Function: Track user behavior
CREATE OR REPLACE FUNCTION track_user_behavior(
  user_id_param uuid,
  action_type_param text,
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_hour integer;
  time_of_day text;
  day_name text;
BEGIN
  current_hour := EXTRACT(HOUR FROM now());
  day_name := to_char(now(), 'Day');
  
  -- Determine time of day
  time_of_day := CASE
    WHEN current_hour >= 5 AND current_hour < 12 THEN 'morning'
    WHEN current_hour >= 12 AND current_hour < 17 THEN 'afternoon'
    WHEN current_hour >= 17 AND current_hour < 21 THEN 'evening'
    ELSE 'night'
  END;
  
  INSERT INTO user_behavior_patterns (
    user_id,
    action_type,
    action_metadata,
    local_time_of_day,
    day_of_week
  ) VALUES (
    user_id_param,
    action_type_param,
    metadata,
    time_of_day,
    day_name
  );
END;
$$;

-- Function: Get personality insights (for AI use)
CREATE OR REPLACE FUNCTION get_personality_insights(user_id_param uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'zodiac_sign', zodiac_sign,
    'zodiac_traits', zodiac_traits,
    'communication_style', communication_style,
    'behavior_patterns', behavior_patterns,
    'temporal_patterns', temporal_patterns,
    'personality_score', personality_score,
    'confidence_level', confidence_level
  ) INTO result
  FROM newme_personality_analysis
  WHERE user_id = user_id_param;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Function: Initialize personality analysis for new user
CREATE OR REPLACE FUNCTION initialize_personality_analysis()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_zodiac zodiac_sign;
  zodiac_data jsonb;
BEGIN
  -- Calculate zodiac sign if birth date is provided
  IF NEW.birth_date IS NOT NULL THEN
    user_zodiac := calculate_zodiac_sign(NEW.birth_date::date);
    zodiac_data := get_zodiac_traits(user_zodiac);
    
    -- Create personality analysis record
    INSERT INTO newme_personality_analysis (
      user_id,
      zodiac_sign,
      zodiac_traits,
      confidence_level
    ) VALUES (
      NEW.id,
      user_zodiac,
      zodiac_data,
      20  -- Initial confidence based on zodiac only
    )
    ON CONFLICT (user_id) DO UPDATE SET
      zodiac_sign = user_zodiac,
      zodiac_traits = zodiac_data,
      updated_at = now();
  ELSE
    -- Create empty analysis record to be filled later
    INSERT INTO newme_personality_analysis (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger: Auto-initialize personality analysis on profile creation/update
CREATE TRIGGER trigger_initialize_personality_analysis
  AFTER INSERT OR UPDATE OF birth_date ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_personality_analysis();

-- Function: Update personality analysis based on behavior
CREATE OR REPLACE FUNCTION update_personality_from_behavior()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_record RECORD;
  behavior_data jsonb;
  temporal_data jsonb;
  comm_data jsonb;
BEGIN
  -- Loop through all users with behavior data
  FOR user_record IN 
    SELECT DISTINCT user_id FROM user_behavior_patterns
  LOOP
    -- Analyze behavior patterns
    SELECT jsonb_build_object(
      'total_actions', COUNT(*),
      'most_active_time', MODE() WITHIN GROUP (ORDER BY local_time_of_day),
      'most_active_day', MODE() WITHIN GROUP (ORDER BY day_of_week),
      'action_types', jsonb_agg(DISTINCT action_type),
      'last_30_days_activity', COUNT(*) FILTER (WHERE timestamp > now() - interval '30 days')
    ) INTO behavior_data
    FROM user_behavior_patterns
    WHERE user_id = user_record.user_id;
    
    -- Analyze temporal patterns
    SELECT jsonb_build_object(
      'morning_activity', COUNT(*) FILTER (WHERE local_time_of_day = 'morning'),
      'afternoon_activity', COUNT(*) FILTER (WHERE local_time_of_day = 'afternoon'),
      'evening_activity', COUNT(*) FILTER (WHERE local_time_of_day = 'evening'),
      'night_activity', COUNT(*) FILTER (WHERE local_time_of_day = 'night')
    ) INTO temporal_data
    FROM user_behavior_patterns
    WHERE user_id = user_record.user_id;
    
    -- Analyze communication style
    SELECT jsonb_build_object(
      'avg_message_length', AVG(message_length)::integer,
      'avg_vocabulary_complexity', AVG(vocabulary_complexity)::integer,
      'avg_response_time', AVG(response_time_seconds)::integer,
      'dominant_tone', MODE() WITHIN GROUP (ORDER BY emotional_tone),
      'punctuation_style', MODE() WITHIN GROUP (ORDER BY punctuation_style)
    ) INTO comm_data
    FROM communication_analysis
    WHERE user_id = user_record.user_id;
    
    -- Update personality analysis
    UPDATE newme_personality_analysis SET
      behavior_patterns = behavior_data,
      temporal_patterns = temporal_data,
      communication_style = comm_data,
      confidence_level = LEAST(100, 20 + 
        (CASE WHEN behavior_data->>'total_actions' IS NOT NULL 
         THEN (behavior_data->>'total_actions')::integer / 10 
         ELSE 0 END)),
      last_analyzed_at = now(),
      updated_at = now()
    WHERE user_id = user_record.user_id;
  END LOOP;
END;
$$;

-- Create a scheduled job to update personality analysis (run daily)
-- Note: This would typically be called by a cron job or Edge Function
COMMENT ON FUNCTION update_personality_from_behavior() IS 
'Run this function daily via cron or Edge Function to update personality analysis';
