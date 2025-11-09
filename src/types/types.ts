export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  avatar_url: string | null;
  role: UserRole;
  birth_date: string | null;
  birth_time: string | null;
  birth_location: string | null;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  personality_traits: Record<string, unknown>;
  balance_wheel_data: Record<string, unknown>;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  message: string;
  sender: 'user' | 'newme';
  photo_url: string | null;
  context_data: Record<string, unknown>;
  created_at: string;
}

export interface NewMeMemory {
  id: string;
  user_id: string;
  memory_text: string;
  memory_type: 'fact' | 'emotion' | 'pattern' | 'confession';
  importance_score: number;
  source_conversation_id: string | null;
  created_at: string;
}

export interface PhotoMemory {
  id: string;
  user_id: string;
  photo_url: string;
  context: string | null;
  ai_analysis: Record<string, unknown>;
  conversation_id: string | null;
  created_at: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string | null;
  category: 'personality' | 'relationships' | 'career' | 'wellness' | 'astrology';
  is_free: boolean;
  questions: unknown[];
  ai_prompt_template: string | null;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAssessment {
  id: string;
  user_id: string;
  assessment_id: string;
  responses: Record<string, unknown>;
  ai_insights: string | null;
  score_data: Record<string, unknown>;
  completed_at: string;
}

export interface CoupleSession {
  id: string;
  session_code: string;
  host_user_id: string;
  guest_name: string | null;
  guest_email: string | null;
  status: 'waiting' | 'in_progress' | 'completed' | 'expired';
  host_responses: Record<string, unknown>;
  guest_responses: Record<string, unknown>;
  compatibility_score: number | null;
  ai_analysis: string | null;
  expires_at: string;
  created_at: string;
  completed_at: string | null;
}

export interface WellnessResource {
  id: string;
  title: string;
  description: string | null;
  category: 'meditation' | 'breathwork' | 'affirmation' | 'therapy' | 'music';
  resource_type: 'youtube' | 'audio' | 'video';
  resource_url: string;
  duration_minutes: number | null;
  thumbnail_url: string | null;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  resource_id: string;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  post_type: 'text' | 'image' | 'poll';
  images: string[];
  poll_options: string[];
  poll_votes: Record<string, number>;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: 'virtual' | 'in_person';
  event_date: string;
  location: string | null;
  max_participants: number | null;
  created_by: string;
  created_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'interested' | 'not_going';
  created_at: string;
}

export interface UserConnection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface BalanceWheelData {
  career: number;
  relationships: number;
  health: number;
  personal_growth: number;
  finances: number;
  fun_recreation: number;
  physical_environment: number;
  contribution: number;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'yes_no';
  options?: string[];
  min?: number;
  max?: number;
}

export interface CommunityPostWithProfile extends CommunityPost {
  profile: Profile;
}

export interface PostCommentWithProfile extends PostComment {
  profile: Profile;
}

export interface CommunityEventWithProfile extends CommunityEvent {
  profile: Profile;
  participants_count?: number;
}

export interface WellnessResourceWithFavorite extends WellnessResource {
  is_favorited?: boolean;
}
