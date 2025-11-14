export type UserRole = 'user' | 'admin';
export type SubscriptionTier = 'free' | 'discovery' | 'growth' | 'transformation';
export type SubscriptionStatus = 'active' | 'trial' | 'canceled' | 'expired';

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
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  trial_end_date: string | null;
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
  emotion_tags: string[];
  memory_themes: string[];
  recall_count: number;
  last_recalled_at: string | null;
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
  category: 'personality' | 'relationships' | 'career' | 'wellness' | 'astrology' | 'emotional' | 'spiritual';
  is_free: boolean;
  is_visitor_accessible?: boolean;
  requires_auth?: boolean;
  duration_minutes?: number | null;
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
  responses: unknown;
  ai_insights: unknown;
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

export interface VoiceSession {
  id: string;
  user_id: string;
  session_id: string;
  status: 'active' | 'completed' | 'error';
  transcript: string | null;
  metadata: Record<string, unknown>;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface DivinationQuestion {
  id: string;
  question_text: string;
  question_type: 'daily_divination' | 'olfactory_quiz' | 'therapy_game' | 'truth_game';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: unknown[];
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface UserDivinationResponse {
  id: string;
  user_id: string;
  question_id: string;
  response_text: string | null;
  response_data: Record<string, unknown>;
  ai_insight: string | null;
  created_at: string;
}

export interface DailyDivinationSchedule {
  id: string;
  user_id: string;
  question_id: string;
  scheduled_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface DivinationQuestionWithResponse extends DivinationQuestion {
  user_response?: UserDivinationResponse;
}

export interface UserStats {
  user_id: string;
  crystals: number;
  xp: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
  total_conversations: number;
  total_assessments: number;
  total_divinations: number;
  updated_at: string;
}

export interface CrystalTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'earn' | 'spend' | 'bonus' | 'penalty';
  source: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'engagement' | 'exploration' | 'growth' | 'social';
  icon: string;
  crystal_reward: number;
  xp_reward: number;
  criteria: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface AchievementWithDetails extends UserAchievement {
  achievement: Achievement;
}

// Newme Brain - Stealth AI Personality Engine Types
// These types are for internal use only and should never be exposed to users

export type ZodiacSign = 
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export interface ZodiacTraits {
  traits: string[];
  element: 'fire' | 'earth' | 'air' | 'water';
  quality: 'cardinal' | 'fixed' | 'mutable';
  strengths: string[];
  challenges: string[];
}

export interface CommunicationStyle {
  avg_message_length?: number;
  avg_vocabulary_complexity?: number;
  avg_response_time?: number;
  dominant_tone?: string;
  punctuation_style?: string;
}

export interface BehaviorPatterns {
  total_actions?: number;
  most_active_time?: string;
  most_active_day?: string;
  action_types?: string[];
  last_30_days_activity?: number;
}

export interface TemporalPatterns {
  morning_activity?: number;
  afternoon_activity?: number;
  evening_activity?: number;
  night_activity?: number;
}

export interface PersonalityScore {
  openness?: number;
  conscientiousness?: number;
  extraversion?: number;
  agreeableness?: number;
  neuroticism?: number;
}

export interface NewmePersonalityAnalysis {
  id: string;
  user_id: string;
  zodiac_sign: ZodiacSign | null;
  zodiac_traits: ZodiacTraits;
  communication_style: CommunicationStyle;
  behavior_patterns: BehaviorPatterns;
  temporal_patterns: TemporalPatterns;
  personality_score: PersonalityScore;
  confidence_level: number;
  last_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserBehaviorPattern {
  id: string;
  user_id: string;
  action_type: string;
  action_metadata: Record<string, unknown>;
  timestamp: string;
  local_time_of_day: string | null;
  day_of_week: string | null;
  created_at: string;
}

export interface CommunicationAnalysis {
  id: string;
  user_id: string;
  conversation_id: string | null;
  message_length: number | null;
  vocabulary_complexity: number | null;
  emotional_tone: string | null;
  response_time_seconds: number | null;
  punctuation_style: string | null;
  created_at: string;
}

export interface MemoryPattern {
  id: string;
  user_id: string;
  pattern_type: 'recurring_theme' | 'emotional_pattern' | 'temporal_pattern';
  pattern_name: string;
  description: string | null;
  related_memory_ids: string[];
  frequency: number;
  first_detected_at: string;
  last_detected_at: string;
  confidence_score: number;
  created_at: string;
}

export interface MemoryCluster {
  id: string;
  user_id: string;
  cluster_name: string;
  cluster_theme: string;
  memory_ids: string[];
  time_period_start: string | null;
  time_period_end: string | null;
  dominant_emotion: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistory {
  id: string;
  user_id: string;
  previous_tier: SubscriptionTier | null;
  new_tier: SubscriptionTier;
  previous_status: SubscriptionStatus | null;
  new_status: SubscriptionStatus;
  change_reason: string | null;
  changed_by: string | null;
  created_at: string;
}

export type ShadowJourneyType = 'inner_child' | 'shadow_self' | 'limiting_beliefs' | 'emotional_wounds';

export interface ShadowWorkJourney {
  id: string;
  user_id: string;
  journey_type: ShadowJourneyType;
  current_question: number;
  is_completed: boolean;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface ShadowWorkResponse {
  id: string;
  journey_id: string;
  user_id: string;
  question_number: number;
  question_text: string;
  response_text: string;
  reflection_notes: string | null;
  emotion_tags: string[];
  created_at: string;
}

// API Management Types
export type ProviderType = 'ai_chat' | 'ai_image' | 'tts' | 'stt' | 'other';
export type ModelType = 'chat' | 'completion' | 'embedding' | 'image' | 'audio';
export type TestStatus = 'success' | 'failed' | 'pending' | 'never_tested';

export interface ApiProvider {
  id: string;
  name: string;
  type: ProviderType;
  api_key: string | null;
  api_url: string | null;
  config: Record<string, unknown>;
  is_active: boolean;
  last_tested_at: string | null;
  test_status: TestStatus;
  test_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiProviderSafe {
  id: string;
  name: string;
  type: ProviderType;
  api_url: string | null;
  config: Record<string, unknown>;
  is_active: boolean;
  last_tested_at: string | null;
  test_status: TestStatus;
  test_message: string | null;
  has_api_key: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiModel {
  id: string;
  provider_id: string;
  model_id: string;
  model_name: string;
  model_type: ModelType;
  capabilities: Record<string, unknown>;
  parameters: Record<string, unknown>;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiVoice {
  id: string;
  provider_id: string;
  voice_id: string;
  voice_name: string;
  language: string;
  gender: string | null;
  accent: string | null;
  sample_url: string | null;
  parameters: Record<string, unknown>;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export interface AiBehavior {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  personality_traits: Record<string, unknown>;
  response_style: Record<string, unknown>;
  model_id: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  template: string;
  variables: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  version: number;
  is_active: boolean;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelWithProvider extends AiModel {
  provider: ApiProviderSafe;
}

export interface VoiceWithProvider extends AiVoice {
  provider: ApiProviderSafe;
}

export interface BehaviorWithModel extends AiBehavior {
  model: AiModel | null;
}

// AI Management System Types
export interface AiProvider {
  id: string;
  name: string;
  api_base_url: string;
  requires_api_key: boolean;
  is_active: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AiModelConfig {
  id: string;
  provider_id: string;
  model_id: string;
  display_name: string;
  capabilities: string[];
  context_window: number;
  is_active: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AiFunction {
  id: string;
  function_key: string;
  display_name: string;
  description: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiFunctionConfig {
  id: string;
  function_id: string;
  provider_id: string;
  model_id: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  additional_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiInteractionLog {
  id: string;
  function_id: string | null;
  user_id: string | null;
  provider_id: string | null;
  model_id: string | null;
  input_text: string | null;
  output_text: string | null;
  tokens_used: number | null;
  response_time_ms: number | null;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SupervisorReport {
  id: string;
  analyzed_interaction_id: string;
  function_id: string | null;
  analysis_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  findings: string;
  suggestions: string | null;
  metrics: Record<string, unknown>;
  reviewed_by: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reviewed_at: string | null;
}

// Extended types with relations
export interface AiModelWithProvider extends AiModelConfig {
  provider: AiProvider;
}

export interface AiFunctionConfigWithRelations extends AiFunctionConfig {
  function: AiFunction;
  provider: AiProvider;
  model: AiModelConfig;
}

export interface AiInteractionLogWithRelations extends AiInteractionLog {
  function: AiFunction | null;
  provider: AiProvider | null;
  model: AiModelConfig | null;
  user: Profile | null;
}

export interface SupervisorReportWithRelations extends SupervisorReport {
  interaction: AiInteractionLog;
  function: AiFunction | null;
  reviewed_by_profile: Profile | null;
}

// OpenAI Realtime & Transcription Configuration Types
export interface RealtimeConfig {
  id: string;
  config_name: string;
  config_type: 'realtime' | 'transcription';
  is_active: boolean;
  model: string;
  instructions: string | null;
  audio_config: {
    input?: {
      format?: string;
      sample_rate?: number;
    };
    output?: {
      format?: string;
      sample_rate?: number;
      voice?: string;
    };
  };
  transcription_config: {
    model?: string;
    language?: string | null;
    prompt?: string | null;
  };
  turn_detection: {
    type?: string;
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
  temperature: number;
  max_response_output_tokens: number;
  tools: Array<{
    type: string;
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  }>;
  webhook_url: string | null;
  webhook_events_filter: string[];
  enable_moderation: boolean;
  enable_audio_compression: boolean;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type ExperimentStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type SuccessMetric = 'response_time' | 'success_rate' | 'cost' | 'user_satisfaction' | 'engagement';

export interface ABExperiment {
  id: string;
  name: string;
  description: string | null;
  function_key: string;
  status: ExperimentStatus;
  traffic_split: Record<string, number>;
  start_date: string | null;
  end_date: string | null;
  success_metric: SuccessMetric;
  min_sample_size: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ABVariant {
  id: string;
  experiment_id: string;
  variant_name: string;
  function_config_id: string | null;
  traffic_percentage: number;
  is_control: boolean;
  description: string | null;
  created_at: string;
}

export interface ABAssignment {
  id: string;
  experiment_id: string;
  user_id: string;
  variant_id: string;
  assigned_at: string;
  last_used_at: string | null;
}

export interface ABResult {
  id: string;
  experiment_id: string;
  variant_id: string;
  total_interactions: number;
  successful_interactions: number;
  failed_interactions: number;
  avg_response_time_ms: number;
  total_tokens: number;
  estimated_cost: number;
  avg_user_satisfaction: number | null;
  calculated_at: string;
  updated_at: string;
}

export interface ABExperimentWithVariants extends ABExperiment {
  variants: Array<ABVariant & { function_config?: AiFunctionConfigWithRelations; results?: ABResult }>;
  results?: ABResult[];
}

export interface RealtimeConfigCreate {
  config_name: string;
  config_type: 'realtime' | 'transcription';
  is_active?: boolean;
  model?: string;
  instructions?: string | null;
  audio_config?: RealtimeConfig['audio_config'];
  transcription_config?: RealtimeConfig['transcription_config'];
  turn_detection?: RealtimeConfig['turn_detection'];
  temperature?: number;
  max_response_output_tokens?: number;
  tools?: RealtimeConfig['tools'];
  webhook_url?: string | null;
  webhook_events_filter?: string[];
  enable_moderation?: boolean;
  enable_audio_compression?: boolean;
  description?: string | null;
  metadata?: Record<string, unknown>;
}

