import { supabase } from './supabase';
import type {
  Profile,
  Conversation,
  NewMeMemory,
  PhotoMemory,
  Assessment,
  UserAssessment,
  CoupleSession,
  WellnessResource,
  UserFavorite,
  CommunityPost,
  PostComment,
  PostLike,
  CommunityEvent,
  EventParticipant,
  UserConnection,
  CommunityPostWithProfile,
  PostCommentWithProfile,
  CommunityEventWithProfile,
  WellnessResourceWithFavorite,
  BalanceWheelData,
  DivinationQuestion,
  UserDivinationResponse,
  DailyDivinationSchedule,
  DivinationQuestionWithResponse,
  UserStats,
  CrystalTransaction,
  Achievement,
  UserAchievement,
  AchievementWithDetails,
  MemoryPattern,
  MemoryCluster,
  SubscriptionHistory,
  SubscriptionTier,
  SubscriptionStatus,
  ShadowWorkJourney,
  ShadowWorkResponse,
  ShadowJourneyType,
  ApiProvider,
  ApiProviderSafe,
  AiModel,
  AiVoice,
  AiBehavior,
  PromptTemplate,
  ModelWithProvider,
  VoiceWithProvider,
  BehaviorWithModel,
  AiProvider,
  AiModelConfig,
  AiFunction,
  AiFunctionConfig,
  AiInteractionLog,
  SupervisorReport,
  AiModelWithProvider,
  AiFunctionConfigWithRelations,
  AiInteractionLogWithRelations,
  SupervisorReportWithRelations,
} from '@/types/types';

export const db = {
  profiles: {
    async getById(id: string): Promise<Profile | null> {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },

    async getCurrent(): Promise<Profile | null> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      return this.getById(user.id);
    },

    async update(id: string, updates: Partial<Profile>): Promise<Profile> {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Profile not found');
      return data;
    },

    async search(query: string, limit = 20): Promise<Profile[]> {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`nickname.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async list(page = 0, pageSize = 20): Promise<Profile[]> {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async listAll(): Promise<Profile[]> {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async updateBalanceWheel(userId: string, wheelData: BalanceWheelData): Promise<Profile> {
      return this.update(userId, { balance_wheel_data: wheelData });
    },

    async completeOnboarding(userId: string): Promise<Profile> {
      return this.update(userId, { onboarding_completed: true });
    },
  },

  conversations: {
    async list(userId: string, limit = 50): Promise<Conversation[]> {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async create(conversation: Omit<Conversation, 'id' | 'created_at'>): Promise<Conversation> {
      const { data, error } = await supabase
        .from('conversations')
        .insert(conversation)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create conversation');
      return data;
    },

    async deleteAll(userId: string): Promise<void> {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    },
  },

  memories: {
    async list(userId: string, limit = 100): Promise<NewMeMemory[]> {
      const { data, error } = await supabase
        .from('newme_memories')
        .select('*')
        .eq('user_id', userId)
        .order('importance_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async create(memory: Omit<NewMeMemory, 'id' | 'created_at' | 'recall_count' | 'last_recalled_at'>): Promise<NewMeMemory> {
      const { data, error } = await supabase
        .from('newme_memories')
        .insert({
          ...memory,
          recall_count: 0,
          emotion_tags: memory.emotion_tags || [],
          memory_themes: memory.memory_themes || [],
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create memory');
      return data;
    },

    async getTopMemories(userId: string, limit = 10): Promise<NewMeMemory[]> {
      const { data, error } = await supabase
        .from('newme_memories')
        .select('*')
        .eq('user_id', userId)
        .gte('importance_score', 7)
        .order('importance_score', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async incrementRecall(memoryId: string): Promise<void> {
      const { error } = await supabase.rpc('increment_memory_recall', {
        memory_id: memoryId,
      });
      
      if (error) throw error;
    },

    async searchByEmotion(userId: string, emotion: string): Promise<NewMeMemory[]> {
      const { data, error } = await supabase
        .from('newme_memories')
        .select('*')
        .eq('user_id', userId)
        .contains('emotion_tags', [emotion])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async searchByTheme(userId: string, theme: string): Promise<NewMeMemory[]> {
      const { data, error } = await supabase
        .from('newme_memories')
        .select('*')
        .eq('user_id', userId)
        .contains('memory_themes', [theme])
        .order('created_at', { ascending: false});
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
  },

  photoMemories: {
    async list(userId: string): Promise<PhotoMemory[]> {
      const { data, error } = await supabase
        .from('photo_memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async create(photo: Omit<PhotoMemory, 'id' | 'created_at'>): Promise<PhotoMemory> {
      const { data, error } = await supabase
        .from('photo_memories')
        .insert(photo)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create photo memory');
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('photo_memories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
  },

  assessments: {
    async list(isFree?: boolean, category?: string): Promise<Assessment[]> {
      let query = supabase
        .from('assessments')
        .select('*')
        .eq('is_active', true);
      
      if (isFree !== undefined) {
        query = query.eq('is_free', isFree);
      }
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getById(id: string): Promise<Assessment | null> {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },

    async create(assessment: Omit<Assessment, 'id' | 'created_at' | 'updated_at'>): Promise<Assessment> {
      const { data, error } = await supabase
        .from('assessments')
        .insert(assessment)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create assessment');
      return data;
    },

    async update(id: string, updates: Partial<Assessment>): Promise<Assessment> {
      const { data, error } = await supabase
        .from('assessments')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Assessment not found');
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('assessments')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
  },

  userAssessments: {
    async list(userId: string): Promise<UserAssessment[]> {
      const { data, error } = await supabase
        .from('user_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async listAll(): Promise<UserAssessment[]> {
      const { data, error } = await supabase
        .from('user_assessments')
        .select('*')
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getById(id: string): Promise<UserAssessment | null> {
      const { data, error } = await supabase
        .from('user_assessments')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },

    async create(userAssessment: Omit<UserAssessment, 'id' | 'completed_at'>): Promise<UserAssessment> {
      const { data, error } = await supabase
        .from('user_assessments')
        .insert(userAssessment)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to save assessment results');
      return data;
    },

    async hasCompleted(userId: string, assessmentId: string): Promise<boolean> {
      const { data, error } = await supabase
        .from('user_assessments')
        .select('id')
        .eq('user_id', userId)
        .eq('assessment_id', assessmentId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
  },

  coupleSessions: {
    async create(hostUserId: string): Promise<CoupleSession> {
      const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await supabase
        .from('couple_sessions')
        .insert({
          session_code: sessionCode,
          host_user_id: hostUserId,
          status: 'waiting',
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create couple session');
      return data;
    },

    async getByCode(code: string): Promise<CoupleSession | null> {
      const { data, error } = await supabase
        .from('couple_sessions')
        .select('*')
        .eq('session_code', code)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<CoupleSession>): Promise<CoupleSession> {
      const { data, error } = await supabase
        .from('couple_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Session not found');
      return data;
    },

    async listByUser(userId: string): Promise<CoupleSession[]> {
      const { data, error } = await supabase
        .from('couple_sessions')
        .select('*')
        .eq('host_user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
  },

  wellnessResources: {
    async list(category?: string): Promise<WellnessResource[]> {
      let query = supabase
        .from('wellness_resources')
        .select('*')
        .eq('is_active', true);
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async listWithFavorites(userId: string | null, category?: string): Promise<WellnessResourceWithFavorite[]> {
      const resources = await this.list(category);
      
      if (!userId) {
        return resources.map(r => ({ ...r, is_favorited: false }));
      }
      
      const { data: favorites } = await supabase
        .from('user_favorites')
        .select('resource_id')
        .eq('user_id', userId);
      
      const favoriteIds = new Set(favorites?.map(f => f.resource_id) || []);
      
      return resources.map(r => ({
        ...r,
        is_favorited: favoriteIds.has(r.id),
      }));
    },

    async create(resource: Omit<WellnessResource, 'id' | 'created_at'>): Promise<WellnessResource> {
      const { data, error } = await supabase
        .from('wellness_resources')
        .insert(resource)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create wellness resource');
      return data;
    },

    async update(id: string, updates: Partial<WellnessResource>): Promise<WellnessResource> {
      const { data, error } = await supabase
        .from('wellness_resources')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Resource not found');
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('wellness_resources')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
  },

  favorites: {
    async toggle(userId: string, resourceId: string): Promise<boolean> {
      const { data: existing } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('resource_id', resourceId)
        .maybeSingle();
      
      if (existing) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('id', existing.id);
        return false;
      }
      
      await supabase
        .from('user_favorites')
        .insert({ user_id: userId, resource_id: resourceId });
      return true;
    },

    async list(userId: string): Promise<UserFavorite[]> {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
  },

  communityPosts: {
    async list(page = 0, pageSize = 20): Promise<CommunityPostWithProfile[]> {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*, profile:profiles(*)')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getById(id: string): Promise<CommunityPostWithProfile | null> {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*, profile:profiles(*)')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },

    async create(post: Omit<CommunityPost, 'id' | 'likes_count' | 'comments_count' | 'created_at' | 'updated_at'>): Promise<CommunityPost> {
      const { data, error } = await supabase
        .from('community_posts')
        .insert(post)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create post');
      return data;
    },

    async update(id: string, updates: Partial<CommunityPost>): Promise<CommunityPost> {
      const { data, error } = await supabase
        .from('community_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Post not found');
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },

    async votePoll(postId: string, optionIndex: number): Promise<void> {
      const post = await this.getById(postId);
      if (!post || post.post_type !== 'poll') {
        throw new Error('Invalid poll post');
      }
      
      const pollVotes = { ...post.poll_votes };
      const key = optionIndex.toString();
      pollVotes[key] = (pollVotes[key] || 0) + 1;
      
      await this.update(postId, { poll_votes: pollVotes });
    },
  },

  postComments: {
    async list(postId: string): Promise<PostCommentWithProfile[]> {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*, profile:profiles(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async create(comment: Omit<PostComment, 'id' | 'created_at'>): Promise<PostComment> {
      const { data, error } = await supabase
        .from('post_comments')
        .insert(comment)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create comment');
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
  },

  postLikes: {
    async toggle(userId: string, postId: string): Promise<boolean> {
      const { data: existing } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();
      
      if (existing) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('id', existing.id);
        return false;
      }
      
      await supabase
        .from('post_likes')
        .insert({ user_id: userId, post_id: postId });
      return true;
    },

    async hasLiked(userId: string, postId: string): Promise<boolean> {
      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();
      
      return !!data;
    },
  },

  communityEvents: {
    async list(upcoming = true): Promise<CommunityEventWithProfile[]> {
      let query = supabase
        .from('community_events')
        .select('*, profile:profiles(*)');
      
      if (upcoming) {
        query = query.gte('event_date', new Date().toISOString());
      }
      
      const { data, error } = await query.order('event_date', { ascending: true });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getById(id: string): Promise<CommunityEventWithProfile | null> {
      const { data, error } = await supabase
        .from('community_events')
        .select('*, profile:profiles(*)')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },

    async create(event: Omit<CommunityEvent, 'id' | 'created_at'>): Promise<CommunityEvent> {
      const { data, error } = await supabase
        .from('community_events')
        .insert(event)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create event');
      return data;
    },

    async update(id: string, updates: Partial<CommunityEvent>): Promise<CommunityEvent> {
      const { data, error } = await supabase
        .from('community_events')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Event not found');
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('community_events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
  },

  eventParticipants: {
    async list(eventId: string): Promise<EventParticipant[]> {
      const { data, error } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async updateStatus(userId: string, eventId: string, status: 'going' | 'interested' | 'not_going'): Promise<void> {
      const { data: existing } = await supabase
        .from('event_participants')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .maybeSingle();
      
      if (existing) {
        await supabase
          .from('event_participants')
          .update({ status })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('event_participants')
          .insert({ user_id: userId, event_id: eventId, status });
      }
    },

    async getStatus(userId: string, eventId: string): Promise<string | null> {
      const { data } = await supabase
        .from('event_participants')
        .select('status')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .maybeSingle();
      
      return data?.status || null;
    },
  },

  userConnections: {
    async list(userId: string, status?: string): Promise<UserConnection[]> {
      let query = supabase
        .from('user_connections')
        .select('*')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async create(requesterId: string, receiverId: string): Promise<UserConnection> {
      const { data, error } = await supabase
        .from('user_connections')
        .insert({
          requester_id: requesterId,
          receiver_id: receiverId,
          status: 'pending',
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create connection request');
      return data;
    },

    async updateStatus(id: string, status: 'accepted' | 'rejected'): Promise<UserConnection> {
      const { data, error } = await supabase
        .from('user_connections')
        .update({ status })
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Connection not found');
      return data;
    },

    async getConnectionStatus(userId1: string, userId2: string): Promise<string | null> {
      const { data } = await supabase
        .from('user_connections')
        .select('status')
        .or(`and(requester_id.eq.${userId1},receiver_id.eq.${userId2}),and(requester_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .maybeSingle();
      
      return data?.status || null;
    },
  },

  storage: {
    async uploadAvatar(userId: string, file: File): Promise<string> {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('app-7fi4fbzoge81_avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('app-7fi4fbzoge81_avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    },

    async uploadPhoto(userId: string, file: File): Promise<string> {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('app-7fi4fbzoge81_photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('app-7fi4fbzoge81_photos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    },

    async uploadCommunityImage(userId: string, file: File): Promise<string> {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('app-7fi4fbzoge81_community')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('app-7fi4fbzoge81_community')
        .getPublicUrl(filePath);

      return data.publicUrl;
    },

    async uploadWellnessResource(file: File): Promise<string> {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('app-7fi4fbzoge81_wellness')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('app-7fi4fbzoge81_wellness')
        .getPublicUrl(filePath);

      return data.publicUrl;
    },
  },

  divinations: {
    async getTodayQuestion(userId: string): Promise<DivinationQuestionWithResponse | null> {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: schedule, error: scheduleError } = await supabase
        .from('daily_divination_schedule')
        .select('*, divination_questions(*)')
        .eq('user_id', userId)
        .eq('scheduled_date', today)
        .maybeSingle();

      if (scheduleError) throw scheduleError;
      
      if (!schedule) {
        const randomQuestion = await this.getRandomQuestion();
        if (!randomQuestion) return null;
        
        await this.scheduleQuestion(userId, randomQuestion.id, today);
        return randomQuestion;
      }

      const question = schedule.divination_questions as unknown as DivinationQuestion;
      
      if (schedule.completed) {
        const { data: response } = await supabase
          .from('user_divination_responses')
          .select('*')
          .eq('user_id', userId)
          .eq('question_id', question.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...question,
          user_response: response || undefined,
        };
      }

      return question;
    },

    async getRandomQuestion(): Promise<DivinationQuestion | null> {
      const { data, error } = await supabase
        .from('divination_questions')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true })
        .limit(100);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex];
    },

    async scheduleQuestion(userId: string, questionId: string, date: string): Promise<void> {
      const { error } = await supabase
        .from('daily_divination_schedule')
        .insert({
          user_id: userId,
          question_id: questionId,
          scheduled_date: date,
        });

      if (error) throw error;
    },

    async submitResponse(
      userId: string,
      questionId: string,
      responseText: string,
      responseData: Record<string, unknown> = {}
    ): Promise<UserDivinationResponse> {
      const { data, error } = await supabase
        .from('user_divination_responses')
        .insert({
          user_id: userId,
          question_id: questionId,
          response_text: responseText,
          response_data: responseData,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create response');

      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('daily_divination_schedule')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .eq('scheduled_date', today);

      return data;
    },

    async getQuestionsByType(type: string): Promise<DivinationQuestion[]> {
      const { data, error } = await supabase
        .from('divination_questions')
        .select('*')
        .eq('question_type', type)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getUserResponses(userId: string, limit = 20): Promise<UserDivinationResponse[]> {
      const { data, error } = await supabase
        .from('user_divination_responses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async updateAIInsight(responseId: string, insight: string): Promise<void> {
      const { error } = await supabase
        .from('user_divination_responses')
        .update({ ai_insight: insight })
        .eq('id', responseId);

      if (error) throw error;
    },

    async listQuestions(): Promise<DivinationQuestion[]> {
      const { data, error } = await supabase
        .from('divination_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async createQuestion(question: { question: string; description?: string }): Promise<DivinationQuestion> {
      const { data, error } = await supabase
        .from('divination_questions')
        .insert({
          question: question.question,
          description: question.description || null,
          question_type: 'general',
          is_active: true,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create question');
      return data;
    },

    async updateQuestion(id: string, updates: { question?: string; description?: string }): Promise<DivinationQuestion> {
      const { data, error } = await supabase
        .from('divination_questions')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Question not found');
      return data;
    },

    async deleteQuestion(id: string): Promise<void> {
      const { error } = await supabase
        .from('divination_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
  },

  gamification: {
    async getUserStats(userId: string): Promise<UserStats | null> {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        const { data: newStats, error: createError } = await supabase
          .from('user_stats')
          .insert({ user_id: userId })
          .select()
          .maybeSingle();

        if (createError) throw createError;
        return newStats;
      }

      return data;
    },

    async awardCrystals(
      userId: string,
      amount: number,
      source: string,
      description: string
    ): Promise<void> {
      const { error } = await supabase.rpc('award_crystals', {
        p_user_id: userId,
        p_amount: amount,
        p_source: source,
        p_description: description,
      });

      if (error) throw error;
    },

    async updateXP(userId: string, xpAmount: number): Promise<void> {
      const { error } = await supabase.rpc('update_xp', {
        p_user_id: userId,
        p_xp_amount: xpAmount,
      });

      if (error) throw error;
    },

    async updateStreak(userId: string): Promise<void> {
      const { error } = await supabase.rpc('update_streak', {
        p_user_id: userId,
      });

      if (error) throw error;
    },

    async getCrystalTransactions(userId: string, limit = 50): Promise<CrystalTransaction[]> {
      const { data, error } = await supabase
        .from('crystal_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getAllAchievements(): Promise<Achievement[]> {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .limit(100);

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getUserAchievements(userId: string): Promise<AchievementWithDetails[]> {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      return Array.isArray(data)
        ? data.map((ua) => ({
            ...ua,
            achievement: ua.achievements as unknown as Achievement,
          }))
        : [];
    },

    async checkAndAwardAchievement(
      userId: string,
      achievementType: string,
      currentValue: number
    ): Promise<void> {
      const achievements = await this.getAllAchievements();
      const userAchievements = await this.getUserAchievements(userId);
      const completedIds = new Set(
        userAchievements.filter((ua) => ua.completed).map((ua) => ua.achievement_id)
      );

      for (const achievement of achievements) {
        if (completedIds.has(achievement.id)) continue;

        const criteria = achievement.criteria as { type: string; count?: number; days?: number };
        if (criteria.type !== achievementType) continue;

        const targetValue = criteria.count || criteria.days || 1;
        if (currentValue >= targetValue) {
          const { error: upsertError } = await supabase
            .from('user_achievements')
            .upsert({
              user_id: userId,
              achievement_id: achievement.id,
              progress: currentValue,
              completed: true,
              completed_at: new Date().toISOString(),
            });

          if (upsertError) {
            console.error('Error awarding achievement:', upsertError);
            continue;
          }

          await this.awardCrystals(
            userId,
            achievement.crystal_reward,
            'achievement',
            `Achievement unlocked: ${achievement.name}`
          );

          await this.updateXP(userId, achievement.xp_reward);
        } else {
          await supabase.from('user_achievements').upsert({
            user_id: userId,
            achievement_id: achievement.id,
            progress: currentValue,
            completed: false,
          });
        }
      }
    },

    async incrementStat(
      userId: string,
      statName: 'total_conversations' | 'total_assessments' | 'total_divinations'
    ): Promise<void> {
      const { error } = await supabase.rpc('increment', {
        table_name: 'user_stats',
        column_name: statName,
        row_id: userId,
      });

      if (error) {
        const { data: stats } = await supabase
          .from('user_stats')
          .select(statName)
          .eq('user_id', userId)
          .maybeSingle();

        const currentValue = stats ? (stats[statName] as number) : 0;

        await supabase
          .from('user_stats')
          .upsert({
            user_id: userId,
            [statName]: currentValue + 1,
          });
      }
    },
  },

  // Newme Brain - Stealth AI Personality Engine API
  // These functions are for internal use only and should never be exposed to users
  newmeBrain: {
    async trackBehavior(userId: string, actionType: string, metadata: Record<string, unknown> = {}): Promise<void> {
      const { error } = await supabase.rpc('track_user_behavior', {
        user_id_param: userId,
        action_type_param: actionType,
        metadata: metadata,
      });
      
      if (error) {
        console.error('Error tracking behavior:', error);
      }
    },

    async getPersonalityInsights(userId: string): Promise<Record<string, unknown>> {
      const { data, error } = await supabase.rpc('get_personality_insights', {
        user_id_param: userId,
      });
      
      if (error) {
        console.error('Error getting personality insights:', error);
        return {};
      }
      
      return data || {};
    },

    async analyzeCommunication(
      userId: string,
      conversationId: string,
      message: string,
      responseTimeSeconds: number
    ): Promise<void> {
      // Calculate message metrics
      const messageLength = message.length;
      const words = message.split(/\s+/).filter(word => word.length > 0);
      const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / (words.length || 1);
      
      // Simple vocabulary complexity (1-10 scale based on average word length)
      const vocabularyComplexity = Math.min(10, Math.max(1, Math.round(avgWordLength)));
      
      // Detect emotional tone (simple heuristic)
      const emotionalTone = this.detectEmotionalTone(message);
      
      // Detect punctuation style
      const punctuationStyle = this.detectPunctuationStyle(message);
      
      const { error } = await supabase
        .from('communication_analysis')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          message_length: messageLength,
          vocabulary_complexity: vocabularyComplexity,
          emotional_tone: emotionalTone,
          response_time_seconds: responseTimeSeconds,
          punctuation_style: punctuationStyle,
        });
      
      if (error) {
        console.error('Error analyzing communication:', error);
      }
    },

    detectEmotionalTone(message: string): string {
      const lowerMessage = message.toLowerCase();
      
      // Positive indicators
      const positiveWords = ['happy', 'joy', 'love', 'excited', 'great', 'wonderful', 'amazing', 'good', 'better', 'best'];
      const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
      
      // Negative indicators
      const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'bad', 'worse', 'worst', 'depressed', 'anxious'];
      const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
      
      // Neutral/questioning
      const questionMarks = (message.match(/\?/g) || []).length;
      
      if (positiveCount > negativeCount) return 'positive';
      if (negativeCount > positiveCount) return 'negative';
      if (questionMarks > 0) return 'curious';
      return 'neutral';
    },

    detectPunctuationStyle(message: string): string {
      const exclamationCount = (message.match(/!/g) || []).length;
      const questionCount = (message.match(/\?/g) || []).length;
      const periodCount = (message.match(/\./g) || []).length;
      const commaCount = (message.match(/,/g) || []).length;
      
      if (exclamationCount > 2) return 'enthusiastic';
      if (questionCount > 1) return 'inquisitive';
      if (commaCount > 3 && periodCount > 1) return 'formal';
      if (message.length > 50 && periodCount === 0) return 'stream_of_consciousness';
      return 'casual';
    },

    async updatePersonalityAnalysis(): Promise<void> {
      const { error } = await supabase.rpc('update_personality_from_behavior');
      
      if (error) {
        console.error('Error updating personality analysis:', error);
      }
    },
  },

  memoryPatterns: {
    async list(userId: string): Promise<MemoryPattern[]> {
      const { data, error } = await supabase
        .from('memory_patterns')
        .select('*')
        .eq('user_id', userId)
        .order('confidence_score', { ascending: false })
        .order('frequency', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async detectPatterns(userId: string): Promise<void> {
      const { error } = await supabase.rpc('detect_memory_patterns', {
        p_user_id: userId,
      });
      
      if (error) throw error;
    },

    async getByType(userId: string, patternType: string): Promise<MemoryPattern[]> {
      const { data, error } = await supabase
        .from('memory_patterns')
        .select('*')
        .eq('user_id', userId)
        .eq('pattern_type', patternType)
        .order('confidence_score', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
  },

  memoryClusters: {
    async list(userId: string): Promise<MemoryCluster[]> {
      const { data, error } = await supabase
        .from('memory_clusters')
        .select('*')
        .eq('user_id', userId)
        .order('time_period_end', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async createClusters(userId: string): Promise<void> {
      const { error } = await supabase.rpc('create_memory_clusters', {
        p_user_id: userId,
      });
      
      if (error) throw error;
    },

    async getByTheme(userId: string, theme: string): Promise<MemoryCluster | null> {
      const { data, error } = await supabase
        .from('memory_clusters')
        .select('*')
        .eq('user_id', userId)
        .eq('cluster_theme', theme)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  },

  subscriptions: {
    async getHistory(userId: string): Promise<SubscriptionHistory[]> {
      const { data, error } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async updateSubscription(
      userId: string,
      tier: SubscriptionTier,
      status: SubscriptionStatus,
      endDate?: string
    ): Promise<void> {
      const updates: Record<string, unknown> = {
        subscription_tier: tier,
        subscription_status: status,
      };

      if (endDate) {
        updates.subscription_end_date = endDate;
      }

      if (status === 'trial') {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);
        updates.trial_end_date = trialEnd.toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    },

    async hasAccess(userId: string, requiredTier: SubscriptionTier): Promise<boolean> {
      const { data, error } = await supabase.rpc('has_active_subscription', {
        uid: userId,
        required_tier: requiredTier,
      });

      if (error) throw error;
      return data || false;
    },

    async startTrial(userId: string, tier: SubscriptionTier): Promise<void> {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          subscription_status: 'trial',
          trial_end_date: trialEnd.toISOString(),
          subscription_start_date: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
    },

    async cancelSubscription(userId: string): Promise<void> {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'canceled',
        })
        .eq('id', userId);

      if (error) throw error;
    },
  },

  shadowWork: {
    async listJourneys(userId: string): Promise<ShadowWorkJourney[]> {
      const { data, error } = await supabase
        .from('shadow_work_journeys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getJourney(journeyId: string): Promise<ShadowWorkJourney | null> {
      const { data, error } = await supabase
        .from('shadow_work_journeys')
        .select('*')
        .eq('id', journeyId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async createJourney(userId: string, journeyType: ShadowJourneyType): Promise<ShadowWorkJourney> {
      const { data, error } = await supabase
        .from('shadow_work_journeys')
        .insert({
          user_id: userId,
          journey_type: journeyType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async getResponses(journeyId: string): Promise<ShadowWorkResponse[]> {
      const { data, error } = await supabase
        .from('shadow_work_responses')
        .select('*')
        .eq('journey_id', journeyId)
        .order('question_number', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async saveResponse(
      journeyId: string,
      userId: string,
      questionNumber: number,
      questionText: string,
      responseText: string,
      reflectionNotes?: string,
      emotionTags?: string[]
    ): Promise<void> {
      const { error } = await supabase
        .from('shadow_work_responses')
        .upsert({
          journey_id: journeyId,
          user_id: userId,
          question_number: questionNumber,
          question_text: questionText,
          response_text: responseText,
          reflection_notes: reflectionNotes,
          emotion_tags: emotionTags || [],
        });

      if (error) throw error;
    },

    async advanceQuestion(journeyId: string): Promise<void> {
      const { error } = await supabase.rpc('advance_shadow_question', {
        p_journey_id: journeyId,
      });

      if (error) throw error;
    },

    async completeJourney(journeyId: string): Promise<void> {
      const { error } = await supabase.rpc('complete_shadow_journey', {
        p_journey_id: journeyId,
      });

      if (error) throw error;
    },
  },

  // API Management
  apiProviders: {
    async list(): Promise<ApiProviderSafe[]> {
      const { data, error } = await supabase
        .from('api_providers_safe')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getById(id: string): Promise<ApiProvider | null> {
      const { data, error } = await supabase
        .from('api_providers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async create(provider: Partial<ApiProvider>): Promise<ApiProvider> {
      const { data, error } = await supabase
        .from('api_providers')
        .insert(provider)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<ApiProvider>): Promise<ApiProvider> {
      const { data, error } = await supabase
        .from('api_providers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('api_providers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    async testConnection(id: string): Promise<{ success: boolean; message: string }> {
      const { data, error } = await supabase.functions.invoke('test-api-connection', {
        body: { provider_id: id },
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        throw new Error(errorMsg || 'Failed to test connection');
      }

      return data;
    },

    async fetchModels(id: string): Promise<AiModel[]> {
      const { data, error } = await supabase.functions.invoke('fetch-provider-models', {
        body: { provider_id: id },
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        throw new Error(errorMsg || 'Failed to fetch models');
      }

      return data.models || [];
    },

    async fetchVoices(id: string): Promise<AiVoice[]> {
      const { data, error } = await supabase.functions.invoke('fetch-provider-voices', {
        body: { provider_id: id },
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        throw new Error(errorMsg || 'Failed to fetch voices');
      }

      return data.voices || [];
    },
  },

  aiModels: {
    async list(): Promise<AiModel[]> {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .order('model_name', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async listWithProvider(): Promise<ModelWithProvider[]> {
      const { data, error } = await supabase
        .from('ai_models')
        .select(`
          *,
          provider:api_providers_safe(*)
        `)
        .order('model_name', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getById(id: string): Promise<AiModel | null> {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async create(model: Partial<AiModel>): Promise<AiModel> {
      const { data, error } = await supabase
        .from('ai_models')
        .insert(model)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<AiModel>): Promise<AiModel> {
      const { data, error } = await supabase
        .from('ai_models')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('ai_models')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    async setDefault(id: string, modelType: string): Promise<void> {
      // First, unset all defaults for this model type
      await supabase
        .from('ai_models')
        .update({ is_default: false })
        .eq('model_type', modelType);

      // Then set the new default
      const { error } = await supabase
        .from('ai_models')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
    },
  },

  aiVoices: {
    async list(): Promise<AiVoice[]> {
      const { data, error } = await supabase
        .from('ai_voices')
        .select('*')
        .order('voice_name', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async listWithProvider(): Promise<VoiceWithProvider[]> {
      const { data, error } = await supabase
        .from('ai_voices')
        .select(`
          *,
          provider:api_providers_safe(*)
        `)
        .order('voice_name', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getById(id: string): Promise<AiVoice | null> {
      const { data, error } = await supabase
        .from('ai_voices')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async create(voice: Partial<AiVoice>): Promise<AiVoice> {
      const { data, error } = await supabase
        .from('ai_voices')
        .insert(voice)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<AiVoice>): Promise<AiVoice> {
      const { data, error } = await supabase
        .from('ai_voices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('ai_voices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    async setDefault(id: string): Promise<void> {
      // First, unset all defaults
      await supabase
        .from('ai_voices')
        .update({ is_default: false });

      // Then set the new default
      const { error } = await supabase
        .from('ai_voices')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
    },
  },

  aiBehaviors: {
    async list(): Promise<AiBehavior[]> {
      const { data, error } = await supabase
        .from('ai_behaviors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async listWithModel(): Promise<BehaviorWithModel[]> {
      const { data, error } = await supabase
        .from('ai_behaviors')
        .select(`
          *,
          model:ai_models(*)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getById(id: string): Promise<AiBehavior | null> {
      const { data, error } = await supabase
        .from('ai_behaviors')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async create(behavior: Partial<AiBehavior>): Promise<AiBehavior> {
      const { data, error } = await supabase
        .from('ai_behaviors')
        .insert(behavior)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<AiBehavior>): Promise<AiBehavior> {
      const { data, error } = await supabase
        .from('ai_behaviors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('ai_behaviors')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    async setDefault(id: string): Promise<void> {
      // First, unset all defaults
      await supabase
        .from('ai_behaviors')
        .update({ is_default: false });

      // Then set the new default
      const { error } = await supabase
        .from('ai_behaviors')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
    },
  },

  promptTemplates: {
    async list(): Promise<PromptTemplate[]> {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async listByCategory(category: string): Promise<PromptTemplate[]> {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('category', category)
        .order('name', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getById(id: string): Promise<PromptTemplate | null> {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async create(template: Partial<PromptTemplate>): Promise<PromptTemplate> {
      const { data, error } = await supabase
        .from('prompt_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate> {
      const { data, error } = await supabase
        .from('prompt_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    async incrementUsage(id: string): Promise<void> {
      const { error } = await supabase.rpc('increment_template_usage', {
        template_id: id,
      });

      if (error) throw error;
    },
  },

  // AI Management System
  aiMgmtProviders: {
    async list(): Promise<AiProvider[]> {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getById(id: string): Promise<AiProvider | null> {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async create(provider: Omit<AiProvider, 'id' | 'created_at' | 'updated_at'>): Promise<AiProvider> {
      const { data, error } = await supabase
        .from('ai_providers')
        .insert(provider)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create AI provider');
      return data;
    },

    async update(id: string, updates: Partial<AiProvider>): Promise<AiProvider> {
      const { data, error } = await supabase
        .from('ai_providers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to update AI provider');
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('ai_providers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
  },

  aiMgmtModels: {
    async list(): Promise<AiModelWithProvider[]> {
      const { data, error } = await supabase
        .from('ai_mgmt_models')
        .select('*, provider:ai_providers(*)')
        .order('display_name', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async listByProvider(providerId: string): Promise<AiModelConfig[]> {
      const { data, error } = await supabase
        .from('ai_mgmt_models')
        .select('*')
        .eq('provider_id', providerId)
        .order('display_name', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getById(id: string): Promise<AiModelConfig | null> {
      const { data, error } = await supabase
        .from('ai_mgmt_models')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async create(model: Omit<AiModelConfig, 'id' | 'created_at' | 'updated_at'>): Promise<AiModelConfig> {
      const { data, error } = await supabase
        .from('ai_mgmt_models')
        .insert(model)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create AI model');
      return data;
    },

    async update(id: string, updates: Partial<AiModelConfig>): Promise<AiModelConfig> {
      const { data, error } = await supabase
        .from('ai_mgmt_models')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to update AI model');
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('ai_mgmt_models')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
  },

  aiMgmtFunctions: {
    async list(): Promise<AiFunction[]> {
      const { data, error } = await supabase
        .from('ai_mgmt_functions')
        .select('*')
        .order('display_name', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getById(id: string): Promise<AiFunction | null> {
      const { data, error } = await supabase
        .from('ai_mgmt_functions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async getByKey(functionKey: string): Promise<AiFunction | null> {
      const { data, error } = await supabase
        .from('ai_mgmt_functions')
        .select('*')
        .eq('function_key', functionKey)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async create(func: Omit<AiFunction, 'id' | 'created_at' | 'updated_at'>): Promise<AiFunction> {
      const { data, error } = await supabase
        .from('ai_mgmt_functions')
        .insert(func)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create AI function');
      return data;
    },

    async update(id: string, updates: Partial<AiFunction>): Promise<AiFunction> {
      const { data, error } = await supabase
        .from('ai_mgmt_functions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to update AI function');
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('ai_mgmt_functions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
  },

  aiMgmtFunctionConfigs: {
    async list(): Promise<AiFunctionConfigWithRelations[]> {
      const { data, error } = await supabase
        .from('ai_mgmt_function_configs')
        .select(`
          *,
          function:ai_functions(*),
          provider:ai_providers(*),
          model:ai_models(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async listByFunction(functionId: string): Promise<AiFunctionConfigWithRelations[]> {
      const { data, error } = await supabase
        .from('ai_mgmt_function_configs')
        .select(`
          *,
          function:ai_functions(*),
          provider:ai_providers(*),
          model:ai_models(*)
        `)
        .eq('function_id', functionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getActiveConfig(functionKey: string): Promise<AiFunctionConfigWithRelations | null> {
      const { data, error } = await supabase
        .from('ai_mgmt_function_configs')
        .select(`
          *,
          function:ai_functions!inner(*),
          provider:ai_providers(*),
          model:ai_models(*)
        `)
        .eq('function:ai_functions.function_key', functionKey)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async getById(id: string): Promise<AiFunctionConfig | null> {
      const { data, error } = await supabase
        .from('ai_mgmt_function_configs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async create(config: Omit<AiFunctionConfig, 'id' | 'created_at' | 'updated_at'>): Promise<AiFunctionConfig> {
      const { data, error } = await supabase
        .from('ai_mgmt_function_configs')
        .insert(config)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create AI function config');
      return data;
    },

    async update(id: string, updates: Partial<AiFunctionConfig>): Promise<AiFunctionConfig> {
      const { data, error } = await supabase
        .from('ai_mgmt_function_configs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to update AI function config');
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('ai_mgmt_function_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    async setActive(id: string, functionId: string): Promise<void> {
      // Deactivate all configs for this function
      await supabase
        .from('ai_mgmt_function_configs')
        .update({ is_active: false })
        .eq('function_id', functionId);

      // Activate the selected config
      const { error } = await supabase
        .from('ai_mgmt_function_configs')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
  },

  aiMgmtInteractionLogs: {
    async list(limit = 100, offset = 0): Promise<AiInteractionLogWithRelations[]> {
      const { data, error } = await supabase
        .from('ai_mgmt_interaction_logs')
        .select(`
          *,
          function:ai_functions(*),
          provider:ai_providers(*),
          model:ai_models(*),
          user:profiles(id, nickname, email)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async listByFunction(functionId: string, limit = 50): Promise<AiInteractionLog[]> {
      const { data, error } = await supabase
        .from('ai_mgmt_interaction_logs')
        .select('*')
        .eq('function_id', functionId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async listByUser(userId: string, limit = 50): Promise<AiInteractionLog[]> {
      const { data, error } = await supabase
        .from('ai_mgmt_interaction_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async create(log: Omit<AiInteractionLog, 'id' | 'created_at'>): Promise<AiInteractionLog> {
      const { data, error } = await supabase
        .from('ai_mgmt_interaction_logs')
        .insert(log)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create interaction log');
      return data;
    },

    async getStats(functionId?: string): Promise<{
      total: number;
      success: number;
      error: number;
      avgResponseTime: number;
      totalTokens: number;
    }> {
      let query = supabase.from('ai_mgmt_interaction_logs').select('*');
      
      if (functionId) {
        query = query.eq('function_id', functionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const logs = Array.isArray(data) ? data : [];
      const total = logs.length;
      const success = logs.filter(l => l.status === 'success').length;
      const errorCount = logs.filter(l => l.status === 'error').length;
      const avgResponseTime = logs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / (total || 1);
      const totalTokens = logs.reduce((sum, l) => sum + (l.tokens_used || 0), 0);

      return {
        total,
        success,
        error: errorCount,
        avgResponseTime: Math.round(avgResponseTime),
        totalTokens,
      };
    },
  },

  aiMgmtSupervisorReports: {
    async list(limit = 50, offset = 0): Promise<SupervisorReportWithRelations[]> {
      const { data, error } = await supabase
        .from('ai_mgmt_supervisor_reports')
        .select(`
          *,
          interaction:ai_interaction_logs(*),
          function:ai_functions(*),
          reviewed_by_profile:profiles(id, nickname, email)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async listByStatus(status: string, limit = 50): Promise<SupervisorReport[]> {
      const { data, error } = await supabase
        .from('ai_mgmt_supervisor_reports')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async listBySeverity(severity: string, limit = 50): Promise<SupervisorReport[]> {
      const { data, error } = await supabase
        .from('ai_mgmt_supervisor_reports')
        .select('*')
        .eq('severity', severity)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },

    async getById(id: string): Promise<SupervisorReportWithRelations | null> {
      const { data, error } = await supabase
        .from('ai_mgmt_supervisor_reports')
        .select(`
          *,
          interaction:ai_interaction_logs(*),
          function:ai_functions(*),
          reviewed_by_profile:profiles(id, nickname, email)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async create(report: Omit<SupervisorReport, 'id' | 'created_at' | 'reviewed_at'>): Promise<SupervisorReport> {
      const { data, error } = await supabase
        .from('ai_mgmt_supervisor_reports')
        .insert(report)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create supervisor report');
      return data;
    },

    async updateStatus(
      id: string,
      status: 'pending' | 'reviewed' | 'resolved' | 'dismissed',
      reviewedBy?: string
    ): Promise<SupervisorReport> {
      const updates: Partial<SupervisorReport> = {
        status,
        reviewed_at: new Date().toISOString(),
      };

      if (reviewedBy) {
        updates.reviewed_by = reviewedBy;
      }

      const { data, error } = await supabase
        .from('ai_mgmt_supervisor_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to update supervisor report');
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('ai_mgmt_supervisor_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    async getStats(): Promise<{
      total: number;
      pending: number;
      reviewed: number;
      resolved: number;
      dismissed: number;
      bySeverity: Record<string, number>;
    }> {
      const { data, error } = await supabase
        .from('ai_mgmt_supervisor_reports')
        .select('*');

      if (error) throw error;

      const reports = Array.isArray(data) ? data : [];
      const total = reports.length;
      const pending = reports.filter(r => r.status === 'pending').length;
      const reviewed = reports.filter(r => r.status === 'reviewed').length;
      const resolved = reports.filter(r => r.status === 'resolved').length;
      const dismissed = reports.filter(r => r.status === 'dismissed').length;

      const bySeverity: Record<string, number> = {
        low: reports.filter(r => r.severity === 'low').length,
        medium: reports.filter(r => r.severity === 'medium').length,
        high: reports.filter(r => r.severity === 'high').length,
        critical: reports.filter(r => r.severity === 'critical').length,
      };

      return {
        total,
        pending,
        reviewed,
        resolved,
        dismissed,
        bySeverity,
      };
    },
  },
};
