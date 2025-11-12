/*
# Enhanced Memory System

## Overview
This migration enhances the memory system with emotion tagging, importance scoring, 
pattern detection, and memory clustering capabilities.

## Changes

### 1. Newme Memories Table Enhancements
- Add `emotion_tags` (text array) - Tags like "joy", "sadness", "anxiety", "peace"
- Add `importance_score` (integer 1-10) - AI-calculated importance
- Add `memory_themes` (text array) - Detected themes like "family", "career", "health"
- Add `recall_count` (integer) - How many times this memory has been recalled
- Add `last_recalled_at` (timestamp) - When memory was last accessed

### 2. Memory Patterns Table
- Track recurring patterns across memories
- Link related memories by theme
- Enable pattern-based insights

### 3. Memory Clusters Table
- Group memories by themes
- Enable timeline visualization
- Support memory bomb triggers

## Security
- RLS enabled on all new tables
- Users can only access their own memories and patterns
*/

-- Add new columns to newme_memories table
ALTER TABLE newme_memories 
ADD COLUMN IF NOT EXISTS emotion_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS importance_score integer DEFAULT 5 CHECK (importance_score >= 1 AND importance_score <= 10),
ADD COLUMN IF NOT EXISTS memory_themes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS recall_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_recalled_at timestamptz;

-- Create memory_patterns table
CREATE TABLE IF NOT EXISTS memory_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pattern_type text NOT NULL,
  pattern_name text NOT NULL,
  description text,
  related_memory_ids uuid[] DEFAULT '{}',
  frequency integer DEFAULT 1,
  first_detected_at timestamptz DEFAULT now(),
  last_detected_at timestamptz DEFAULT now(),
  confidence_score integer DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at timestamptz DEFAULT now()
);

-- Create memory_clusters table
CREATE TABLE IF NOT EXISTS memory_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cluster_name text NOT NULL,
  cluster_theme text NOT NULL,
  memory_ids uuid[] DEFAULT '{}',
  time_period_start timestamptz,
  time_period_end timestamptz,
  dominant_emotion text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE memory_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_clusters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for memory_patterns
CREATE POLICY "Users can view own memory patterns" ON memory_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory patterns" ON memory_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory patterns" ON memory_patterns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memory patterns" ON memory_patterns
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for memory_clusters
CREATE POLICY "Users can view own memory clusters" ON memory_clusters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory clusters" ON memory_clusters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory clusters" ON memory_clusters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memory clusters" ON memory_clusters
  FOR DELETE USING (auth.uid() = user_id);

-- Function to increment recall count
CREATE OR REPLACE FUNCTION increment_memory_recall(memory_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE newme_memories
  SET 
    recall_count = recall_count + 1,
    last_recalled_at = now()
  WHERE id = memory_id;
END;
$$;

-- Function to detect memory patterns
CREATE OR REPLACE FUNCTION detect_memory_patterns(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_theme text;
  v_emotion text;
  v_memory_ids uuid[];
  v_pattern_id uuid;
BEGIN
  FOR v_theme IN 
    SELECT DISTINCT unnest(memory_themes) as theme
    FROM newme_memories
    WHERE user_id = p_user_id
      AND memory_themes IS NOT NULL
      AND array_length(memory_themes, 1) > 0
  LOOP
    SELECT array_agg(id) INTO v_memory_ids
    FROM newme_memories
    WHERE user_id = p_user_id
      AND v_theme = ANY(memory_themes);
    
    IF array_length(v_memory_ids, 1) >= 3 THEN
      SELECT id INTO v_pattern_id
      FROM memory_patterns
      WHERE user_id = p_user_id
        AND pattern_type = 'recurring_theme'
        AND pattern_name = v_theme;
      
      IF v_pattern_id IS NULL THEN
        INSERT INTO memory_patterns (
          user_id,
          pattern_type,
          pattern_name,
          description,
          related_memory_ids,
          frequency,
          confidence_score
        ) VALUES (
          p_user_id,
          'recurring_theme',
          v_theme,
          'Recurring theme detected across multiple memories',
          v_memory_ids,
          array_length(v_memory_ids, 1),
          LEAST(100, array_length(v_memory_ids, 1) * 10)
        );
      ELSE
        UPDATE memory_patterns
        SET 
          related_memory_ids = v_memory_ids,
          frequency = array_length(v_memory_ids, 1),
          last_detected_at = now(),
          confidence_score = LEAST(100, array_length(v_memory_ids, 1) * 10)
        WHERE id = v_pattern_id;
      END IF;
    END IF;
  END LOOP;

  FOR v_emotion IN 
    SELECT DISTINCT unnest(emotion_tags) as emotion
    FROM newme_memories
    WHERE user_id = p_user_id
      AND emotion_tags IS NOT NULL
      AND array_length(emotion_tags, 1) > 0
  LOOP
    SELECT array_agg(id) INTO v_memory_ids
    FROM newme_memories
    WHERE user_id = p_user_id
      AND v_emotion = ANY(emotion_tags);
    
    IF array_length(v_memory_ids, 1) >= 3 THEN
      SELECT id INTO v_pattern_id
      FROM memory_patterns
      WHERE user_id = p_user_id
        AND pattern_type = 'emotional_pattern'
        AND pattern_name = v_emotion;
      
      IF v_pattern_id IS NULL THEN
        INSERT INTO memory_patterns (
          user_id,
          pattern_type,
          pattern_name,
          description,
          related_memory_ids,
          frequency,
          confidence_score
        ) VALUES (
          p_user_id,
          'emotional_pattern',
          v_emotion,
          'Recurring emotional pattern detected',
          v_memory_ids,
          array_length(v_memory_ids, 1),
          LEAST(100, array_length(v_memory_ids, 1) * 10)
        );
      ELSE
        UPDATE memory_patterns
        SET 
          related_memory_ids = v_memory_ids,
          frequency = array_length(v_memory_ids, 1),
          last_detected_at = now(),
          confidence_score = LEAST(100, array_length(v_memory_ids, 1) * 10)
        WHERE id = v_pattern_id;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Function to create memory clusters
CREATE OR REPLACE FUNCTION create_memory_clusters(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_theme text;
  v_memory_ids uuid[];
  v_start_date timestamptz;
  v_end_date timestamptz;
  v_dominant_emotion text;
BEGIN
  FOR v_theme IN 
    SELECT DISTINCT unnest(memory_themes) as theme
    FROM newme_memories
    WHERE user_id = p_user_id
      AND memory_themes IS NOT NULL
      AND array_length(memory_themes, 1) > 0
  LOOP
    SELECT 
      array_agg(id),
      MIN(created_at),
      MAX(created_at)
    INTO v_memory_ids, v_start_date, v_end_date
    FROM newme_memories
    WHERE user_id = p_user_id
      AND v_theme = ANY(memory_themes);
    
    SELECT unnest(emotion_tags) as emotion
    INTO v_dominant_emotion
    FROM newme_memories
    WHERE user_id = p_user_id
      AND v_theme = ANY(memory_themes)
      AND emotion_tags IS NOT NULL
    GROUP BY emotion
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    INSERT INTO memory_clusters (
      user_id,
      cluster_name,
      cluster_theme,
      memory_ids,
      time_period_start,
      time_period_end,
      dominant_emotion
    ) VALUES (
      p_user_id,
      v_theme || ' Memories',
      v_theme,
      v_memory_ids,
      v_start_date,
      v_end_date,
      v_dominant_emotion
    )
    ON CONFLICT (id) DO UPDATE SET
      memory_ids = EXCLUDED.memory_ids,
      time_period_end = EXCLUDED.time_period_end,
      dominant_emotion = EXCLUDED.dominant_emotion,
      updated_at = now();
  END LOOP;
END;
$$;
