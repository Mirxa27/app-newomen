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

    async create(memory: Omit<NewMeMemory, 'id' | 'created_at'>): Promise<NewMeMemory> {
      const { data, error } = await supabase
        .from('newme_memories')
        .insert(memory)
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
};
