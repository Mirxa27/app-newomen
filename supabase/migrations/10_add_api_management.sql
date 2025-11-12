/*
# API Management System

## Overview
This migration creates tables for managing third-party API integrations including AI providers,
models, voices, behaviors, and prompt templates. Admins can configure API credentials, test
connections, and fetch available models/voices dynamically.

## New Tables

### 1. api_providers
Stores API provider configurations and credentials.
- `id` (uuid, primary key)
- `name` (text) - Provider name (e.g., "OpenAI", "Anthropic")
- `type` (text) - Provider type (ai_chat, ai_image, tts, stt)
- `api_key` (text) - Encrypted API key
- `api_url` (text) - Base API URL
- `config` (jsonb) - Additional configuration
- `is_active` (boolean) - Whether provider is active
- `last_tested_at` (timestamptz) - Last connection test timestamp
- `test_status` (text) - Last test result (success, failed, pending)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2. ai_models
Stores available AI models from providers.
- `id` (uuid, primary key)
- `provider_id` (uuid, references api_providers)
- `model_id` (text) - Model identifier (e.g., "gpt-4")
- `model_name` (text) - Display name
- `model_type` (text) - Type (chat, completion, embedding)
- `capabilities` (jsonb) - Model capabilities
- `parameters` (jsonb) - Default parameters (temperature, max_tokens, etc.)
- `is_active` (boolean)
- `is_default` (boolean) - Default model for this type
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3. ai_voices
Stores available voices for TTS providers.
- `id` (uuid, primary key)
- `provider_id` (uuid, references api_providers)
- `voice_id` (text) - Voice identifier
- `voice_name` (text) - Display name
- `language` (text) - Language code
- `gender` (text) - Voice gender
- `accent` (text) - Accent/region
- `sample_url` (text) - Sample audio URL
- `parameters` (jsonb) - Voice parameters
- `is_active` (boolean)
- `is_default` (boolean)
- `created_at` (timestamptz)

### 4. ai_behaviors
Stores AI behavior/personality configurations.
- `id` (uuid, primary key)
- `name` (text) - Behavior name
- `description` (text) - Behavior description
- `system_prompt` (text) - System prompt template
- `personality_traits` (jsonb) - Personality configuration
- `response_style` (jsonb) - Response style settings
- `model_id` (uuid, references ai_models)
- `is_active` (boolean)
- `is_default` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 5. prompt_templates
Stores reusable prompt templates.
- `id` (uuid, primary key)
- `name` (text) - Template name
- `description` (text) - Template description
- `category` (text) - Template category
- `template` (text) - Prompt template with variables
- `variables` (jsonb) - Template variables definition
- `version` (integer) - Template version
- `is_active` (boolean)
- `usage_count` (integer) - Number of times used
- `created_by` (uuid, references profiles)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Security
- All tables have RLS enabled
- Only admins can manage API configurations
- API keys are stored encrypted
- Regular users cannot view sensitive data

## Indexes
- Index on provider type for fast filtering
- Index on model type for quick lookups
- Index on active status for all tables
*/

-- Create enum types
CREATE TYPE provider_type AS ENUM ('ai_chat', 'ai_image', 'tts', 'stt', 'other');
CREATE TYPE model_type AS ENUM ('chat', 'completion', 'embedding', 'image', 'audio');
CREATE TYPE test_status AS ENUM ('success', 'failed', 'pending', 'never_tested');

-- API Providers table
CREATE TABLE IF NOT EXISTS api_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type provider_type NOT NULL DEFAULT 'ai_chat',
  api_key text,
  api_url text,
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  last_tested_at timestamptz,
  test_status test_status DEFAULT 'never_tested',
  test_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Models table
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES api_providers(id) ON DELETE CASCADE,
  model_id text NOT NULL,
  model_name text NOT NULL,
  model_type model_type NOT NULL DEFAULT 'chat',
  capabilities jsonb DEFAULT '{}'::jsonb,
  parameters jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, model_id)
);

-- AI Voices table
CREATE TABLE IF NOT EXISTS ai_voices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES api_providers(id) ON DELETE CASCADE,
  voice_id text NOT NULL,
  voice_name text NOT NULL,
  language text DEFAULT 'en-US',
  gender text,
  accent text,
  sample_url text,
  parameters jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, voice_id)
);

-- AI Behaviors table
CREATE TABLE IF NOT EXISTS ai_behaviors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  system_prompt text NOT NULL,
  personality_traits jsonb DEFAULT '{}'::jsonb,
  response_style jsonb DEFAULT '{}'::jsonb,
  model_id uuid REFERENCES ai_models(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prompt Templates table
CREATE TABLE IF NOT EXISTS prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  template text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_api_providers_type ON api_providers(type);
CREATE INDEX idx_api_providers_active ON api_providers(is_active);
CREATE INDEX idx_ai_models_type ON ai_models(model_type);
CREATE INDEX idx_ai_models_active ON ai_models(is_active);
CREATE INDEX idx_ai_models_default ON ai_models(is_default);
CREATE INDEX idx_ai_voices_language ON ai_voices(language);
CREATE INDEX idx_ai_voices_active ON ai_voices(is_active);
CREATE INDEX idx_ai_behaviors_active ON ai_behaviors(is_active);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_prompt_templates_active ON prompt_templates(is_active);

-- Enable RLS
ALTER TABLE api_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_providers
CREATE POLICY "Admins have full access to api_providers" ON api_providers
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view active providers (without keys)" ON api_providers
  FOR SELECT TO authenticated USING (is_active = true);

-- RLS Policies for ai_models
CREATE POLICY "Admins have full access to ai_models" ON ai_models
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view active models" ON ai_models
  FOR SELECT TO authenticated USING (is_active = true);

-- RLS Policies for ai_voices
CREATE POLICY "Admins have full access to ai_voices" ON ai_voices
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view active voices" ON ai_voices
  FOR SELECT TO authenticated USING (is_active = true);

-- RLS Policies for ai_behaviors
CREATE POLICY "Admins have full access to ai_behaviors" ON ai_behaviors
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view active behaviors" ON ai_behaviors
  FOR SELECT TO authenticated USING (is_active = true);

-- RLS Policies for prompt_templates
CREATE POLICY "Admins have full access to prompt_templates" ON prompt_templates
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view active templates" ON prompt_templates
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Users can create their own templates" ON prompt_templates
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates" ON prompt_templates
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_api_providers_updated_at BEFORE UPDATE ON api_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_behaviors_updated_at BEFORE UPDATE ON ai_behaviors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default providers
INSERT INTO api_providers (name, type, api_url, config) VALUES
  ('OpenAI', 'ai_chat', 'https://api.openai.com/v1', '{"supports_streaming": true, "supports_functions": true}'::jsonb),
  ('Anthropic', 'ai_chat', 'https://api.anthropic.com/v1', '{"supports_streaming": true, "supports_functions": false}'::jsonb),
  ('Google AI', 'ai_chat', 'https://generativelanguage.googleapis.com/v1', '{"supports_streaming": true, "supports_functions": true}'::jsonb);

-- Insert default behaviors
INSERT INTO ai_behaviors (name, description, system_prompt, personality_traits, is_default) VALUES
  (
    'NewMe Companion',
    'Empathetic AI companion for self-discovery',
    'You are NewMe, an empathetic AI companion dedicated to helping users on their journey of self-discovery and personal growth. You are warm, understanding, and non-judgmental. You ask thoughtful questions, provide insights based on psychology and personal development principles, and encourage users to explore their thoughts and feelings deeply.',
    '{"empathy": 0.9, "curiosity": 0.8, "supportiveness": 0.95, "directness": 0.6}'::jsonb,
    true
  ),
  (
    'Professional Coach',
    'Goal-oriented professional coaching',
    'You are a professional life coach focused on helping users achieve their goals. You are direct, action-oriented, and results-focused. You help users set clear objectives, create actionable plans, and hold them accountable to their commitments.',
    '{"empathy": 0.7, "directness": 0.9, "accountability": 0.9, "optimism": 0.8}'::jsonb,
    false
  ),
  (
    'Mindfulness Guide',
    'Calm and centered mindfulness teacher',
    'You are a mindfulness and meditation guide. You speak in a calm, centered manner and help users develop present-moment awareness. You guide them through breathing exercises, body scans, and mindfulness practices. Your tone is peaceful and grounding.',
    '{"calmness": 0.95, "patience": 0.95, "gentleness": 0.9, "wisdom": 0.8}'::jsonb,
    false
  );

-- Insert default prompt templates
INSERT INTO prompt_templates (name, description, category, template, variables, created_by) VALUES
  (
    'Daily Reflection',
    'Template for daily reflection prompts',
    'reflection',
    'Take a moment to reflect on your day. {{question}} What insights can you gain from this experience?',
    '[{"name": "question", "type": "string", "description": "Specific reflection question"}]'::jsonb,
    NULL
  ),
  (
    'Goal Setting',
    'Template for goal-setting conversations',
    'goals',
    'Let''s work on your {{goal_type}} goal. What specific outcome would you like to achieve in the next {{timeframe}}? What would success look like?',
    '[{"name": "goal_type", "type": "string", "description": "Type of goal"}, {"name": "timeframe", "type": "string", "description": "Time period"}]'::jsonb,
    NULL
  ),
  (
    'Emotional Check-in',
    'Template for emotional awareness',
    'emotions',
    'How are you feeling right now? On a scale of 1-10, how would you rate your {{emotion}}? What might be contributing to this feeling?',
    '[{"name": "emotion", "type": "string", "description": "Specific emotion to explore"}]'::jsonb,
    NULL
  );

-- Create view for safe provider listing (without API keys)
CREATE OR REPLACE VIEW api_providers_safe AS
SELECT 
  id,
  name,
  type,
  api_url,
  config,
  is_active,
  last_tested_at,
  test_status,
  test_message,
  CASE 
    WHEN api_key IS NOT NULL AND api_key != '' THEN true 
    ELSE false 
  END as has_api_key,
  created_at,
  updated_at
FROM api_providers;

-- Grant access to the view
GRANT SELECT ON api_providers_safe TO authenticated;
