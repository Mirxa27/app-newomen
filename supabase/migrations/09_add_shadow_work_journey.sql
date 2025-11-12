/*
# Add Shadow Work Journey Feature

## Overview
This migration adds the Shadow Work Journey feature - a structured 10-question journey for deep self-discovery.

## Changes

### 1. New Tables
- `shadow_work_journeys`: Track user progress through shadow work journeys
  - `id`: Unique identifier
  - `user_id`: Reference to user
  - `journey_type`: Type of shadow work journey
  - `current_question`: Current question number (1-10)
  - `is_completed`: Whether journey is completed
  - `started_at`: When journey started
  - `completed_at`: When journey completed
  - `created_at`: Record creation timestamp

- `shadow_work_responses`: Store user responses to shadow work questions
  - `id`: Unique identifier
  - `journey_id`: Reference to journey
  - `user_id`: Reference to user
  - `question_number`: Question number (1-10)
  - `question_text`: The question asked
  - `response_text`: User's response
  - `reflection_notes`: Additional reflection notes
  - `emotion_tags`: Emotions associated with response
  - `created_at`: Response timestamp

### 2. Security
- Users can only view and modify their own journeys
- Users can only view and modify their own responses
- All tables have RLS enabled

## Notes
- Journey types: 'inner_child', 'shadow_self', 'limiting_beliefs', 'emotional_wounds'
- Each journey has exactly 10 questions
- Users can have multiple journeys of different types
*/

-- Create journey type enum
CREATE TYPE shadow_journey_type AS ENUM ('inner_child', 'shadow_self', 'limiting_beliefs', 'emotional_wounds');

-- Create shadow work journeys table
CREATE TABLE IF NOT EXISTS shadow_work_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  journey_type shadow_journey_type NOT NULL,
  current_question integer DEFAULT 1 CHECK (current_question >= 1 AND current_question <= 10),
  is_completed boolean DEFAULT false,
  started_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create shadow work responses table
CREATE TABLE IF NOT EXISTS shadow_work_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid REFERENCES shadow_work_journeys(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_number integer NOT NULL CHECK (question_number >= 1 AND question_number <= 10),
  question_text text NOT NULL,
  response_text text NOT NULL,
  reflection_notes text,
  emotion_tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(journey_id, question_number)
);

-- Create indexes
CREATE INDEX idx_shadow_journeys_user_id ON shadow_work_journeys(user_id);
CREATE INDEX idx_shadow_journeys_type ON shadow_work_journeys(journey_type);
CREATE INDEX idx_shadow_responses_journey_id ON shadow_work_responses(journey_id);
CREATE INDEX idx_shadow_responses_user_id ON shadow_work_responses(user_id);

-- Enable RLS
ALTER TABLE shadow_work_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_work_responses ENABLE ROW LEVEL SECURITY;

-- Policies for shadow_work_journeys
CREATE POLICY "Users can view own journeys" ON shadow_work_journeys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journeys" ON shadow_work_journeys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journeys" ON shadow_work_journeys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all journeys" ON shadow_work_journeys
  FOR SELECT USING (is_admin(auth.uid()));

-- Policies for shadow_work_responses
CREATE POLICY "Users can view own responses" ON shadow_work_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own responses" ON shadow_work_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses" ON shadow_work_responses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses" ON shadow_work_responses
  FOR SELECT USING (is_admin(auth.uid()));

-- Function to complete a journey
CREATE OR REPLACE FUNCTION complete_shadow_journey(p_journey_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE shadow_work_journeys
  SET is_completed = true,
      completed_at = now()
  WHERE id = p_journey_id
    AND user_id = auth.uid()
    AND current_question = 10;
END;
$$;

-- Function to advance to next question
CREATE OR REPLACE FUNCTION advance_shadow_question(p_journey_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE shadow_work_journeys
  SET current_question = current_question + 1
  WHERE id = p_journey_id
    AND user_id = auth.uid()
    AND current_question < 10;
END;
$$;
