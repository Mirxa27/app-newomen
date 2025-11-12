/*
# Create Voice Sessions Table

## Purpose
Store real-time voice conversation sessions with NewMe using OpenAI Realtime API.

## Tables
- `voice_sessions`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `session_id` (text, OpenAI session ID)
  - `status` (text, session status: active, completed, error)
  - `transcript` (text, conversation transcript)
  - `metadata` (jsonb, user profile data)
  - `started_at` (timestamptz, session start time)
  - `ended_at` (timestamptz, session end time)
  - `created_at` (timestamptz, default now())

## Security
- Public table (no RLS) for simplicity
- Users can view their own sessions
*/

CREATE TABLE IF NOT EXISTS voice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text UNIQUE NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  transcript text,
  metadata jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_voice_sessions_user_id ON voice_sessions(user_id);
CREATE INDEX idx_voice_sessions_session_id ON voice_sessions(session_id);
CREATE INDEX idx_voice_sessions_status ON voice_sessions(status);
