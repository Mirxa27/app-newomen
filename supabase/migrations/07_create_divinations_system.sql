/*
# Create Divinations System

## Purpose
Daily divination questions, therapy games, and truth games for user engagement.

## Tables

### divination_questions
- `id` (uuid, primary key)
- `question_text` (text, the divination question)
- `question_type` (text, type: daily_divination, olfactory_quiz, therapy_game, truth_game)
- `category` (text, category: self_reflection, relationships, shadow_work, etc.)
- `difficulty` (text, difficulty: easy, medium, hard)
- `options` (jsonb, multiple choice options if applicable)
- `metadata` (jsonb, additional question data)
- `is_active` (boolean, whether question is active)
- `created_at` (timestamptz, creation time)

### user_divination_responses
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `question_id` (uuid, references divination_questions)
- `response_text` (text, user's response)
- `response_data` (jsonb, structured response data)
- `ai_insight` (text, AI-generated insight)
- `created_at` (timestamptz, response time)

### daily_divination_schedule
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `question_id` (uuid, references divination_questions)
- `scheduled_date` (date, when to show this question)
- `completed` (boolean, whether user completed it)
- `completed_at` (timestamptz, completion time)
- `created_at` (timestamptz, creation time)

## Security
- Public tables (no RLS) for simplicity
- Users can view and create their own responses
*/

-- Divination questions table
CREATE TABLE IF NOT EXISTS divination_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('daily_divination', 'olfactory_quiz', 'therapy_game', 'truth_game')),
  category text NOT NULL,
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  options jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User responses table
CREATE TABLE IF NOT EXISTS user_divination_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES divination_questions(id) ON DELETE CASCADE NOT NULL,
  response_text text,
  response_data jsonb DEFAULT '{}'::jsonb,
  ai_insight text,
  created_at timestamptz DEFAULT now()
);

-- Daily schedule table
CREATE TABLE IF NOT EXISTS daily_divination_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES divination_questions(id) ON DELETE CASCADE NOT NULL,
  scheduled_date date NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, scheduled_date)
);

-- Indexes
CREATE INDEX idx_divination_questions_type ON divination_questions(question_type);
CREATE INDEX idx_divination_questions_active ON divination_questions(is_active);
CREATE INDEX idx_user_divination_responses_user ON user_divination_responses(user_id);
CREATE INDEX idx_user_divination_responses_question ON user_divination_responses(question_id);
CREATE INDEX idx_daily_divination_schedule_user_date ON daily_divination_schedule(user_id, scheduled_date);

-- Insert sample divination questions
INSERT INTO divination_questions (question_text, question_type, category, difficulty, metadata) VALUES
('On a scale of 1-10, how much are you lying to yourself right now?', 'daily_divination', 'self_reflection', 'hard', '{"scale": {"min": 1, "max": 10}}'::jsonb),
('What truth are you avoiding today?', 'daily_divination', 'shadow_work', 'hard', '{}'::jsonb),
('If your fear had a voice, what would it say to you right now?', 'daily_divination', 'shadow_work', 'medium', '{}'::jsonb),
('What version of yourself are you pretending to be today?', 'daily_divination', 'authenticity', 'hard', '{}'::jsonb),
('Name one thing you''re grateful for that you usually take for granted.', 'daily_divination', 'gratitude', 'easy', '{}'::jsonb),
('What pattern keeps repeating in your relationships?', 'daily_divination', 'relationships', 'medium', '{}'::jsonb),
('If you could tell your younger self one truth, what would it be?', 'daily_divination', 'self_reflection', 'medium', '{}'::jsonb),
('What are you really hungry for right now? (Hint: it''s not food)', 'daily_divination', 'desires', 'medium', '{}'::jsonb),
('What boundary do you need to set but keep avoiding?', 'daily_divination', 'boundaries', 'hard', '{}'::jsonb),
('What would you do if you weren''t afraid of judgment?', 'daily_divination', 'authenticity', 'medium', '{}'::jsonb),
('Describe your current emotional state in three words.', 'daily_divination', 'emotions', 'easy', '{"word_count": 3}'::jsonb),
('What scent reminds you of safety?', 'olfactory_quiz', 'sensory', 'easy', '{}'::jsonb),
('What smell instantly transports you to childhood?', 'olfactory_quiz', 'memory', 'easy', '{}'::jsonb),
('If your anxiety had a smell, what would it be?', 'olfactory_quiz', 'emotions', 'medium', '{}'::jsonb),
('What fragrance makes you feel most like yourself?', 'olfactory_quiz', 'identity', 'medium', '{}'::jsonb),
('Truth: What''s the biggest lie you tell yourself?', 'truth_game', 'honesty', 'hard', '{}'::jsonb),
('Truth: What do you judge others for that you secretly do yourself?', 'truth_game', 'shadow_work', 'hard', '{}'::jsonb),
('Truth: What compliment do you reject because you don''t believe it?', 'truth_game', 'self_worth', 'medium', '{}'::jsonb),
('Truth: What are you pretending not to know?', 'truth_game', 'awareness', 'hard', '{}'::jsonb),
('Truth: What would you do if no one was watching?', 'truth_game', 'authenticity', 'medium', '{}'::jsonb),
('Complete this sentence: "I am afraid that if people really knew me, they would..."', 'therapy_game', 'vulnerability', 'hard', '{}'::jsonb),
('List 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.', 'therapy_game', 'grounding', 'easy', '{"technique": "5-4-3-2-1"}'::jsonb),
('Write a letter to your inner child. What does that child need to hear?', 'therapy_game', 'inner_child', 'hard', '{}'::jsonb),
('What emotion are you avoiding feeling right now?', 'therapy_game', 'emotional_awareness', 'medium', '{}'::jsonb),
('If your body could speak, what would it tell you?', 'therapy_game', 'somatic', 'medium', '{}'::jsonb)
ON CONFLICT DO NOTHING;
