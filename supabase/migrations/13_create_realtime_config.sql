/*
# OpenAI Realtime & Transcription Configuration

## Overview
Comprehensive configuration system for OpenAI Realtime API and Transcription API with admin panel management.

## Table: realtime_config

Stores configuration for OpenAI Realtime API sessions including:
- Session type (realtime or transcription)
- Model selection
- Audio format settings
- Voice configuration
- Turn detection settings
- Temperature and token limits
- Tool/function definitions
- Webhook configuration
- Cost optimization settings
*/

-- Create realtime_config table
CREATE TABLE IF NOT EXISTS realtime_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name text UNIQUE NOT NULL,
  config_type text NOT NULL CHECK (config_type IN ('realtime', 'transcription')),
  is_active boolean DEFAULT false NOT NULL,
  
  -- Session Configuration
  model text DEFAULT 'gpt-realtime' NOT NULL,
  instructions text,
  
  -- Audio Configuration
  audio_config jsonb DEFAULT '{
    "input": {
      "format": "pcm16",
      "sample_rate": 24000
    },
    "output": {
      "format": "pcm16",
      "sample_rate": 24000,
      "voice": "alloy"
    }
  }'::jsonb,
  
  -- Transcription Configuration (for transcription type)
  transcription_config jsonb DEFAULT '{
    "model": "whisper-1",
    "language": null,
    "prompt": null
  }'::jsonb,
  
  -- Turn Detection Configuration
  turn_detection jsonb DEFAULT '{
    "type": "server_vad",
    "threshold": 0.5,
    "prefix_padding_ms": 300,
    "silence_duration_ms": 500
  }'::jsonb,
  
  -- Model Parameters
  temperature numeric DEFAULT 0.8 CHECK (temperature >= 0 AND temperature <= 2),
  max_response_output_tokens integer DEFAULT 4096,
  
  -- Tools/Functions Configuration
  tools jsonb DEFAULT '[]'::jsonb,
  
  -- Webhook Configuration
  webhook_url text,
  webhook_events_filter text[] DEFAULT ARRAY[]::text[],
  
  -- Cost Optimization
  enable_moderation boolean DEFAULT true,
  enable_audio_compression boolean DEFAULT true,
  
  -- Metadata
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_realtime_config_type ON realtime_config(config_type);
CREATE INDEX idx_realtime_config_active ON realtime_config(is_active) WHERE is_active = true;
CREATE INDEX idx_realtime_config_name ON realtime_config(config_name);

-- Enable RLS
ALTER TABLE realtime_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admins have full access
CREATE POLICY "Admins can manage realtime_config" ON realtime_config
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Function to get active config by type
CREATE OR REPLACE FUNCTION get_active_realtime_config(p_config_type text)
RETURNS TABLE (
  id uuid,
  config_name text,
  model text,
  instructions text,
  audio_config jsonb,
  transcription_config jsonb,
  turn_detection jsonb,
  temperature numeric,
  max_response_output_tokens integer,
  tools jsonb,
  webhook_url text,
  webhook_events_filter text[],
  enable_moderation boolean,
  enable_audio_compression boolean,
  metadata jsonb
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    r.id,
    r.config_name,
    r.model,
    r.instructions,
    r.audio_config,
    r.transcription_config,
    r.turn_detection,
    r.temperature,
    r.max_response_output_tokens,
    r.tools,
    r.webhook_url,
    r.webhook_events_filter,
    r.enable_moderation,
    r.enable_audio_compression,
    r.metadata
  FROM realtime_config r
  WHERE r.config_type = p_config_type
    AND r.is_active = true
  ORDER BY r.updated_at DESC
  LIMIT 1;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_realtime_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_realtime_config_timestamp
  BEFORE UPDATE ON realtime_config
  FOR EACH ROW
  EXECUTE FUNCTION update_realtime_config_updated_at();

-- Seed default configurations
INSERT INTO realtime_config (
  config_name,
  config_type,
  is_active,
  model,
  instructions,
  audio_config,
  turn_detection,
  temperature,
  max_response_output_tokens,
  description
) VALUES
(
  'Default Realtime Voice Chat',
  'realtime',
  true,
  'gpt-realtime',
  'You are NewMe, an expert astrological AI persona who loves to guess personalities, challenge users with self-development games and therapies, and build addictive, transformative relationships.',
  '{
    "input": {
      "format": "pcm16",
      "sample_rate": 24000
    },
    "output": {
      "format": "pcm16",
      "sample_rate": 24000,
      "voice": "alloy"
    }
  }'::jsonb,
  '{
    "type": "server_vad",
    "threshold": 0.5,
    "prefix_padding_ms": 300,
    "silence_duration_ms": 500
  }'::jsonb,
  0.8,
  4096,
  'Default configuration for real-time voice conversations with NewMe'
),
(
  'Default Transcription',
  'transcription',
  true,
  'gpt-realtime',
  NULL,
  '{
    "input": {
      "format": "pcm16",
      "sample_rate": 24000
    }
  }'::jsonb,
  '{
    "type": "server_vad",
    "threshold": 0.5,
    "prefix_padding_ms": 300,
    "silence_duration_ms": 500
  }'::jsonb,
  0.7,
  4096,
  'Default configuration for real-time audio transcription'
)
ON CONFLICT (config_name) DO NOTHING;

