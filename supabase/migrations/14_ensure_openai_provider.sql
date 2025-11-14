/*
# Ensure OpenAI Provider Exists

This migration ensures that an OpenAI provider entry exists in the api_providers table
for use with Realtime Voice Chat and Transcription features.
*/

-- Insert OpenAI provider if it doesn't exist
INSERT INTO api_providers (name, type, api_url, is_active, config)
VALUES (
  'OpenAI',
  'ai_chat',
  'https://api.openai.com/v1',
  true,
  '{
    "supports_realtime": true,
    "supports_transcription": true,
    "realtime_endpoint": "https://api.openai.com/v1/realtime",
    "transcription_endpoint": "https://api.openai.com/v1/audio/transcriptions"
  }'::jsonb
)
ON CONFLICT (name) DO UPDATE
SET 
  api_url = EXCLUDED.api_url,
  config = EXCLUDED.config,
  updated_at = now();

-- Add unique constraint on name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'api_providers_name_key'
  ) THEN
    ALTER TABLE api_providers ADD CONSTRAINT api_providers_name_key UNIQUE (name);
  END IF;
END $$;

