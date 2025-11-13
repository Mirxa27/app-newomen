/*
# AI Management System

## Overview
Comprehensive AI management system with provider integration, function-level configuration, and supervisory AI monitoring.

## 1. New Tables

### ai_mgmt_providers
Stores available AI providers (OpenAI, Google AI, Anthropic, etc.)
- `id` (uuid, primary key)
- `name` (text, unique) - Provider name (e.g., "OpenAI", "Google AI")
- `api_base_url` (text) - Base URL for API calls
- `requires_api_key` (boolean) - Whether provider needs API key
- `is_active` (boolean) - Whether provider is enabled
- `config` (jsonb) - Additional provider configuration
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### ai_mgmt_models
Stores available models for each provider
- `id` (uuid, primary key)
- `provider_id` (uuid, references ai_mgmt_providers)
- `model_id` (text) - Model identifier (e.g., "gpt-4", "gemini-pro")
- `display_name` (text) - Human-readable name
- `capabilities` (text[]) - Array of capabilities (chat, completion, vision, etc.)
- `context_window` (integer) - Maximum context length
- `is_active` (boolean) - Whether model is available
- `config` (jsonb) - Model-specific configuration
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### ai_mgmt_functions
Defines app functions that use AI
- `id` (uuid, primary key)
- `function_key` (text, unique) - Unique identifier (e.g., "chat", "assessment_insights")
- `display_name` (text) - Human-readable name
- `description` (text) - Function description
- `category` (text) - Category (chat, analysis, generation, supervision)
- `is_active` (boolean) - Whether function is enabled
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### ai_mgmt_function_configs
Stores configuration for each AI function
- `id` (uuid, primary key)
- `function_id` (uuid, references ai_mgmt_functions)
- `provider_id` (uuid, references ai_mgmt_providers)
- `model_id` (uuid, references ai_mgmt_models)
- `system_prompt` (text) - System prompt/instructions
- `temperature` (numeric) - Temperature setting (0-2)
- `max_tokens` (integer) - Maximum response tokens
- `additional_config` (jsonb) - Additional parameters
- `is_active` (boolean) - Whether this config is active
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### ai_mgmt_interaction_logs
Logs all AI interactions for monitoring and analysis
- `id` (uuid, primary key)
- `function_id` (uuid, references ai_mgmt_functions)
- `user_id` (uuid, references profiles)
- `provider_id` (uuid, references ai_mgmt_providers)
- `model_id` (uuid, references ai_mgmt_models)
- `input_text` (text) - User input
- `output_text` (text) - AI response
- `tokens_used` (integer) - Total tokens consumed
- `response_time_ms` (integer) - Response time in milliseconds
- `status` (text) - success, error, timeout
- `error_message` (text) - Error details if failed
- `metadata` (jsonb) - Additional context
- `created_at` (timestamptz)

### ai_mgmt_supervisor_reports
Stores supervisor AI analysis reports
- `id` (uuid, primary key)
- `analyzed_interaction_id` (uuid, references ai_mgmt_interaction_logs)
- `function_id` (uuid, references ai_mgmt_functions)
- `analysis_type` (text) - error_detection, quality_check, improvement_suggestion
- `severity` (text) - low, medium, high, critical
- `findings` (text) - Detailed analysis findings
- `suggestions` (text) - Improvement suggestions
- `metrics` (jsonb) - Quality metrics and scores
- `reviewed_by` (uuid, references profiles) - Admin who reviewed
- `status` (text) - pending, reviewed, resolved, dismissed
- `created_at` (timestamptz)
- `reviewed_at` (timestamptz)

## 2. Security
- Enable RLS on all tables
- Admins have full access to all AI management tables
- Regular users cannot access AI configuration
- Interaction logs are accessible to admins only
- Supervisor reports are admin-only

## 3. Indexes
- Index on function_key for fast lookups
- Index on ai_mgmt_interaction_logs.created_at for time-based queries
- Index on ai_mgmt_supervisor_reports.status for filtering

## 4. Initial Data
- Seed common AI providers (OpenAI, Google AI, Anthropic)
- Seed common models for each provider
- Create default AI functions (chat, assessment, voice, memory, supervisor)
*/

-- Create ai_mgmt_providers table
CREATE TABLE IF NOT EXISTS ai_mgmt_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  api_base_url text NOT NULL,
  requires_api_key boolean DEFAULT true NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create ai_mgmt_models table
CREATE TABLE IF NOT EXISTS ai_mgmt_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES ai_mgmt_providers(id) ON DELETE CASCADE NOT NULL,
  model_id text NOT NULL,
  display_name text NOT NULL,
  capabilities text[] DEFAULT ARRAY[]::text[],
  context_window integer DEFAULT 4096,
  is_active boolean DEFAULT true NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(provider_id, model_id)
);

-- Create ai_mgmt_functions table
CREATE TABLE IF NOT EXISTS ai_mgmt_functions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_key text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  category text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create ai_mgmt_function_configs table
CREATE TABLE IF NOT EXISTS ai_mgmt_function_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_id uuid REFERENCES ai_mgmt_functions(id) ON DELETE CASCADE NOT NULL,
  provider_id uuid REFERENCES ai_mgmt_providers(id) ON DELETE CASCADE NOT NULL,
  model_id uuid REFERENCES ai_mgmt_models(id) ON DELETE CASCADE NOT NULL,
  system_prompt text NOT NULL,
  temperature numeric DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens integer DEFAULT 2000,
  additional_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create ai_mgmt_interaction_logs table
CREATE TABLE IF NOT EXISTS ai_mgmt_interaction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_id uuid REFERENCES ai_mgmt_functions(id) ON DELETE SET NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES ai_mgmt_providers(id) ON DELETE SET NULL,
  model_id uuid REFERENCES ai_mgmt_models(id) ON DELETE SET NULL,
  input_text text,
  output_text text,
  tokens_used integer,
  response_time_ms integer,
  status text DEFAULT 'success' NOT NULL,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create ai_mgmt_supervisor_reports table
CREATE TABLE IF NOT EXISTS ai_mgmt_supervisor_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analyzed_interaction_id uuid REFERENCES ai_mgmt_interaction_logs(id) ON DELETE CASCADE NOT NULL,
  function_id uuid REFERENCES ai_mgmt_functions(id) ON DELETE SET NULL,
  analysis_type text NOT NULL,
  severity text DEFAULT 'low' NOT NULL,
  findings text NOT NULL,
  suggestions text,
  metrics jsonb DEFAULT '{}'::jsonb,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  reviewed_at timestamptz
);

-- Create indexes
CREATE INDEX idx_ai_mgmt_functions_key ON ai_mgmt_functions(function_key);
CREATE INDEX idx_ai_mgmt_interaction_logs_created ON ai_mgmt_interaction_logs(created_at DESC);
CREATE INDEX idx_ai_mgmt_interaction_logs_function ON ai_mgmt_interaction_logs(function_id);
CREATE INDEX idx_ai_mgmt_interaction_logs_user ON ai_mgmt_interaction_logs(user_id);
CREATE INDEX idx_ai_mgmt_supervisor_reports_status ON ai_mgmt_supervisor_reports(status);
CREATE INDEX idx_ai_mgmt_supervisor_reports_severity ON ai_mgmt_supervisor_reports(severity);
CREATE INDEX idx_ai_mgmt_supervisor_reports_created ON ai_mgmt_supervisor_reports(created_at DESC);

-- Enable RLS
ALTER TABLE ai_mgmt_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mgmt_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mgmt_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mgmt_function_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mgmt_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mgmt_supervisor_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admins have full access
CREATE POLICY "Admins can manage ai_mgmt_providers" ON ai_mgmt_providers
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage ai_mgmt_models" ON ai_mgmt_models
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage ai_mgmt_functions" ON ai_mgmt_functions
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage ai_mgmt_function_configs" ON ai_mgmt_function_configs
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view ai_mgmt_interaction_logs" ON ai_mgmt_interaction_logs
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage ai_mgmt_supervisor_reports" ON ai_mgmt_supervisor_reports
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Function to get active config for a function
CREATE OR REPLACE FUNCTION get_active_ai_config(p_function_key text)
RETURNS TABLE (
  provider_name text,
  model_id text,
  system_prompt text,
  temperature numeric,
  max_tokens integer,
  additional_config jsonb
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    p.name,
    m.model_id,
    c.system_prompt,
    c.temperature,
    c.max_tokens,
    c.additional_config
  FROM ai_mgmt_function_configs c
  JOIN ai_mgmt_functions f ON c.function_id = f.id
  JOIN ai_mgmt_providers p ON c.provider_id = p.id
  JOIN ai_mgmt_models m ON c.model_id = m.id
  WHERE f.function_key = p_function_key
    AND c.is_active = true
    AND f.is_active = true
    AND p.is_active = true
    AND m.is_active = true
  ORDER BY c.updated_at DESC
  LIMIT 1;
$$;

-- Seed AI Providers
INSERT INTO ai_mgmt_providers (name, api_base_url, requires_api_key, is_active) VALUES
  ('OpenAI', 'https://api.openai.com/v1', true, true),
  ('Google AI', 'https://generativelanguage.googleapis.com/v1', true, true),
  ('Anthropic', 'https://api.anthropic.com/v1', true, true),
  ('Mock Provider', 'http://localhost:3000/mock', false, true)
ON CONFLICT (name) DO NOTHING;

-- Seed AI Models
INSERT INTO ai_mgmt_models (provider_id, model_id, display_name, capabilities, context_window, is_active)
SELECT 
  p.id,
  model_data.model_id,
  model_data.display_name,
  model_data.capabilities,
  model_data.context_window,
  true
FROM ai_mgmt_providers p
CROSS JOIN (
  VALUES
    ('OpenAI', 'gpt-4-turbo-preview', 'GPT-4 Turbo', ARRAY['chat', 'completion', 'vision'], 128000),
    ('OpenAI', 'gpt-4', 'GPT-4', ARRAY['chat', 'completion'], 8192),
    ('OpenAI', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', ARRAY['chat', 'completion'], 16385),
    ('Google AI', 'gemini-pro', 'Gemini Pro', ARRAY['chat', 'completion'], 32768),
    ('Google AI', 'gemini-pro-vision', 'Gemini Pro Vision', ARRAY['chat', 'completion', 'vision'], 32768),
    ('Anthropic', 'claude-3-opus-20240229', 'Claude 3 Opus', ARRAY['chat', 'completion'], 200000),
    ('Anthropic', 'claude-3-sonnet-20240229', 'Claude 3 Sonnet', ARRAY['chat', 'completion'], 200000),
    ('Mock Provider', 'mock-model', 'Mock Model', ARRAY['chat', 'completion'], 4096)
) AS model_data(provider_name, model_id, display_name, capabilities, context_window)
WHERE p.name = model_data.provider_name
ON CONFLICT (provider_id, model_id) DO NOTHING;

-- Seed AI Functions
INSERT INTO ai_mgmt_functions (function_key, display_name, description, category, is_active) VALUES
  ('chat', 'NewMe Chat', 'Main conversational AI for user interactions', 'chat', true),
  ('assessment_insights', 'Assessment Insights', 'Generate insights from user assessments', 'analysis', true),
  ('voice_chat', 'Voice Chat', 'Real-time voice conversation AI', 'chat', true),
  ('memory_extraction', 'Memory Extraction', 'Extract meaningful memories from conversations', 'analysis', true),
  ('supervisor', 'Supervisor AI', 'Meta-AI that monitors and analyzes other AI interactions', 'supervision', true)
ON CONFLICT (function_key) DO NOTHING;

-- Create default configurations for each function
INSERT INTO ai_mgmt_function_configs (function_id, provider_id, model_id, system_prompt, temperature, max_tokens, is_active)
SELECT 
  f.id,
  p.id,
  m.id,
  CASE f.function_key
    WHEN 'chat' THEN 'You are NewMe, a brutally honest AI companion focused on personal growth and self-discovery. Be direct, insightful, and transformative in your responses.'
    WHEN 'assessment_insights' THEN 'You are an expert psychologist analyzing assessment results. Provide deep, actionable insights that help users understand themselves better.'
    WHEN 'voice_chat' THEN 'You are NewMe in voice mode. Keep responses concise and conversational, suitable for spoken dialogue.'
    WHEN 'memory_extraction' THEN 'Extract meaningful memories from conversations. Identify emotions, themes, and important moments. Return structured data.'
    WHEN 'supervisor' THEN 'You are a Supervisor AI analyzing other AI interactions. Identify errors, inconsistencies, quality issues, and suggest improvements. Be thorough and constructive.'
  END,
  CASE f.function_key
    WHEN 'supervisor' THEN 0.3
    ELSE 0.7
  END,
  CASE f.function_key
    WHEN 'voice_chat' THEN 500
    WHEN 'memory_extraction' THEN 1000
    ELSE 2000
  END,
  true
FROM ai_mgmt_functions f
CROSS JOIN ai_mgmt_providers p
CROSS JOIN ai_mgmt_models m
WHERE p.name = 'Mock Provider'
  AND m.model_id = 'mock-model'
  AND NOT EXISTS (
    SELECT 1 FROM ai_mgmt_function_configs c
    WHERE c.function_id = f.id
  );
