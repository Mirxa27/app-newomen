/*
# Initial Database Schema

This migration creates the core database schema for the Newomen platform.
It includes all base tables, enums, functions, and RLS policies.

## Core Tables
- profiles: User profiles with authentication and astrological data
- conversations: Chat history with NewMe
- newme_memories: Semantic memory storage
- photo_memories: User photos with AI analysis
- assessments: Assessment definitions
- user_assessments: User assessment results
- couple_sessions: Couple compatibility sessions
- wellness_resources: Wellness content library
- user_favorites: User favorite resources
- community_posts: Community social posts
- post_comments: Post comments
- post_likes: Post likes
- community_events: Community events
- event_participants: Event participation
- user_connections: User friend connections
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE conversation_sender AS ENUM ('user', 'newme');
CREATE TYPE memory_type AS ENUM ('fact', 'emotion', 'pattern', 'confession');
CREATE TYPE assessment_category AS ENUM ('personality', 'relationships', 'career', 'wellness', 'astrology');
CREATE TYPE couple_session_status AS ENUM ('waiting', 'in_progress', 'completed', 'expired');
CREATE TYPE wellness_category AS ENUM ('meditation', 'breathwork', 'affirmation', 'therapy', 'music');
CREATE TYPE resource_type AS ENUM ('youtube', 'audio', 'video');
CREATE TYPE post_type AS ENUM ('text', 'image', 'poll');
CREATE TYPE event_type AS ENUM ('virtual', 'in_person');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  nickname text,
  avatar_url text,
  role user_role DEFAULT 'user' NOT NULL,
  birth_date date,
  birth_time time,
  birth_location text,
  sun_sign text,
  moon_sign text,
  rising_sign text,
  personality_traits jsonb DEFAULT '{}'::jsonb,
  balance_wheel_data jsonb DEFAULT '{}'::jsonb,
  onboarding_completed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Function to set first user as admin
CREATE OR REPLACE FUNCTION set_first_user_as_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Check if this is the first user
  IF (SELECT COUNT(*) FROM profiles) = 1 THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to set first user as admin
CREATE TRIGGER trigger_set_first_user_as_admin
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_first_user_as_admin();

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin'
  );
$$;

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  sender conversation_sender NOT NULL,
  photo_url text,
  context_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- NewMe memories table
CREATE TABLE IF NOT EXISTS newme_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  memory_text text NOT NULL,
  memory_type memory_type DEFAULT 'fact' NOT NULL,
  importance_score integer DEFAULT 5 CHECK (importance_score >= 1 AND importance_score <= 10),
  source_conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  emotion_tags text[] DEFAULT ARRAY[]::text[],
  memory_themes text[] DEFAULT ARRAY[]::text[],
  recall_count integer DEFAULT 0 NOT NULL,
  last_recalled_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Photo memories table
CREATE TABLE IF NOT EXISTS photo_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  context text,
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category assessment_category NOT NULL,
  is_free boolean DEFAULT false NOT NULL,
  questions jsonb DEFAULT '[]'::jsonb,
  ai_prompt_template text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true NOT NULL,
  is_visitor_accessible boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- User assessments table
CREATE TABLE IF NOT EXISTS user_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  responses jsonb DEFAULT '{}'::jsonb,
  ai_insights jsonb,
  score_data jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, assessment_id)
);

-- Couple sessions table
CREATE TABLE IF NOT EXISTS couple_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code text UNIQUE NOT NULL,
  host_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  guest_name text,
  guest_email text,
  guest_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  share_link text UNIQUE,
  status couple_session_status DEFAULT 'waiting' NOT NULL,
  host_responses jsonb DEFAULT '{}'::jsonb,
  guest_responses jsonb DEFAULT '{}'::jsonb,
  compatibility_score numeric,
  ai_analysis text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Wellness resources table
CREATE TABLE IF NOT EXISTS wellness_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category wellness_category NOT NULL,
  resource_type resource_type NOT NULL,
  resource_url text NOT NULL,
  duration_minutes integer,
  thumbnail_url text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- User favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resource_id uuid REFERENCES wellness_resources(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, resource_id)
);

-- Community posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  post_type post_type DEFAULT 'text' NOT NULL,
  images text[] DEFAULT ARRAY[]::text[],
  poll_options text[] DEFAULT ARRAY[]::text[],
  poll_votes jsonb DEFAULT '{}'::jsonb,
  likes_count integer DEFAULT 0 NOT NULL,
  comments_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Community events table
CREATE TABLE IF NOT EXISTS community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type event_type NOT NULL,
  event_date timestamptz NOT NULL,
  location text,
  max_participants integer,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Event participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES community_events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'interested' CHECK (status IN ('going', 'interested', 'not_going')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- User connections table
CREATE TABLE IF NOT EXISTS user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status connection_status DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(requester_id, receiver_id),
  CHECK (requester_id != receiver_id)
);

-- Create indexes
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);
CREATE INDEX idx_memories_user ON newme_memories(user_id);
CREATE INDEX idx_memories_importance ON newme_memories(importance_score DESC);
CREATE INDEX idx_photo_memories_user ON photo_memories(user_id);
CREATE INDEX idx_photo_memories_created ON photo_memories(created_at DESC);
CREATE INDEX idx_assessments_category ON assessments(category);
CREATE INDEX idx_assessments_free ON assessments(is_free);
CREATE INDEX idx_user_assessments_user ON user_assessments(user_id);
CREATE INDEX idx_couple_sessions_code ON couple_sessions(session_code);
CREATE INDEX idx_couple_sessions_host ON couple_sessions(host_user_id);
CREATE INDEX idx_wellness_resources_category ON wellness_resources(category);
CREATE INDEX idx_community_posts_user ON community_posts(user_id);
CREATE INDEX idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX idx_post_comments_post ON post_comments(post_id);
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_user_connections_requester ON user_connections(requester_id);
CREATE INDEX idx_user_connections_receiver ON user_connections(receiver_id);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE newme_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations" ON conversations
  FOR SELECT USING (is_admin(auth.uid()));

-- RLS Policies for memories
CREATE POLICY "Users can view own memories" ON newme_memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage memories" ON newme_memories
  FOR ALL USING (true);

-- RLS Policies for photo memories
CREATE POLICY "Users can view own photo memories" ON photo_memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own photo memories" ON photo_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for assessments
CREATE POLICY "Anyone can view active assessments" ON assessments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage assessments" ON assessments
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for user assessments
CREATE POLICY "Users can view own assessments" ON user_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assessments" ON user_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for couple sessions
CREATE POLICY "Users can view own sessions" ON couple_sessions
  FOR SELECT USING (auth.uid() = host_user_id OR auth.uid() = guest_user_id);

CREATE POLICY "Users can create own sessions" ON couple_sessions
  FOR INSERT WITH CHECK (auth.uid() = host_user_id);

-- RLS Policies for wellness resources
CREATE POLICY "Anyone can view active resources" ON wellness_resources
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage resources" ON wellness_resources
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for user favorites
CREATE POLICY "Users can manage own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for community posts
CREATE POLICY "Anyone can view posts" ON community_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for post comments
CREATE POLICY "Anyone can view comments" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for post likes
CREATE POLICY "Anyone can view likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own likes" ON post_likes
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for community events
CREATE POLICY "Anyone can view events" ON community_events
  FOR SELECT USING (true);

CREATE POLICY "Users can create events" ON community_events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for event participants
CREATE POLICY "Anyone can view participants" ON event_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own participation" ON event_participants
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user connections
CREATE POLICY "Users can view own connections" ON user_connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create connections" ON user_connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own connections" ON user_connections
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_connections_updated_at
  BEFORE UPDATE ON user_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

