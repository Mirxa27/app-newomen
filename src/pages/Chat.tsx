import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Loader2, MessageSquare, Phone } from 'lucide-react';
import { db } from '@/db/api';
import { supabase } from '@/db/supabase';
import { VoiceRecorder } from '@/components/chat/VoiceRecorder';
import { PhotoUpload } from '@/components/chat/PhotoUpload';
import { RealtimeVoiceChat } from '@/components/chat/RealtimeVoiceChat';
import type { Conversation } from '@/types/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Chat() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      loadConversations();
    }
  }, [profile]);

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!profile) return;
    try {
      const data = await db.conversations.list(profile.id);
      setConversations(data);
      
      // If no conversations, initiate with memory-driven message
      if (data.length === 0) {
        await initiateConversation();
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setInitialLoading(false);
    }
  };

  const initiateConversation = async () => {
    if (!profile) return;
    try {
      // Fetch memories, photo memories, and personality insights for context
      const [memories, photoMemories, personalityInsights] = await Promise.all([
        db.memories.getTopMemories(profile.id, 15),
        db.photoMemories.list(profile.id).then(photos => photos.slice(0, 10)),
        db.newmeBrain.getPersonalityInsights(profile.id),
      ]);

      // Call Edge Function for memory-driven initiation
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'newme-chat',
        {
          body: {
            isInitiation: true,
            conversationHistory: [],
            userProfile: {
              nickname: profile.nickname || 'there',
              preferences: profile.personality_traits,
              personalityInsights: personalityInsights,
              sunSign: profile.sun_sign,
              moonSign: profile.moon_sign,
              risingSign: profile.rising_sign,
            },
            userId: profile.id,
            memories: memories.map(m => ({
              memory_text: m.memory_text,
              memory_type: m.memory_type,
              importance_score: m.importance_score,
              emotion_tags: m.emotion_tags || [],
              memory_themes: m.memory_themes || [],
              created_at: m.created_at,
            })),
            photoMemories: photoMemories.map(p => ({
              photo_url: p.photo_url,
              context: p.context || '',
              ai_analysis: p.ai_analysis || {},
              created_at: p.created_at,
            })),
          },
        }
      );

      if (functionError) {
        console.error('Edge Function error:', functionError);
        // Fallback with enhanced persona
        const astroInsight = profile.sun_sign
          ? ` Your ${profile.sun_sign} sun makes you think you can hide from yourself, but you can't.`
          : '';
        const welcomeMessage = await db.conversations.create({
          user_id: profile.id,
          message: `${profile.nickname || 'Hey'}, I'm NewMe. Let's skip the pleasantries—I don't do small talk.${astroInsight} Tell me something real. What's actually going on with you right now?`,
          sender: 'newme',
          photo_url: null,
          context_data: { isInitiation: true },
        });
        setConversations([welcomeMessage]);
        return;
      }

      const initiationMessage = functionData.response;
      
      // Save the initiation message
      const welcomeMessage = await db.conversations.create({
        user_id: profile.id,
        message: initiationMessage,
        sender: 'newme',
        photo_url: null,
        context_data: { isInitiation: true },
      });
      
      setConversations([welcomeMessage]);
    } catch (error) {
      console.error('Error initiating conversation:', error);
      // Fallback with enhanced persona
      const astroInsight = profile.sun_sign
        ? ` Your ${profile.sun_sign} sun makes you think you can hide from yourself, but you can't.`
        : '';
      const welcomeMessage = await db.conversations.create({
        user_id: profile.id,
        message: `${profile.nickname || 'Hey'}, I'm NewMe. Let's skip the pleasantries—I don't do small talk.${astroInsight} Tell me something real. What's actually going on with you right now?`,
        sender: 'newme',
        photo_url: null,
        context_data: { isInitiation: true, fallback: true },
      });
      setConversations([welcomeMessage]);
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && !photoUrl) || !profile || loading) return;

    const userMessage = message.trim() || (photoUrl ? '[Photo shared]' : '');
    const currentPhotoUrl = photoUrl;
    const messageStartTime = Date.now();
    setMessage('');
    setPhotoUrl(null);
    setLoading(true);

    try {
      // Save user message with photo
      const userConv = await db.conversations.create({
        user_id: profile.id,
        message: userMessage,
        sender: 'user',
        photo_url: currentPhotoUrl,
        context_data: currentPhotoUrl ? { hasPhoto: true } : {},
      });

      setConversations((prev) => [...prev, userConv]);

      // Track user behavior (Newme Brain)
      await db.newmeBrain.trackBehavior(profile.id, 'chat_message', {
        message_length: userMessage.length,
        has_photo: !!currentPhotoUrl,
      });

      // Analyze communication patterns (Newme Brain)
      const responseTime = Math.floor((Date.now() - messageStartTime) / 1000);
      await db.newmeBrain.analyzeCommunication(
        profile.id,
        userConv.id,
        userMessage,
        responseTime
      );

      // Fetch memories, photo memories, and personality insights for AI context
      const [memories, photoMemories, personalityInsights] = await Promise.all([
        db.memories.getTopMemories(profile.id, 15),
        db.photoMemories.list(profile.id).then(photos => photos.slice(0, 10)),
        db.newmeBrain.getPersonalityInsights(profile.id),
      ]);

      // If photo was shared, analyze it and create photo memory
      if (currentPhotoUrl) {
        try {
          // Analyze photo with AI
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
            'analyze-photo-memory',
            {
              body: {
                photoUrl: currentPhotoUrl,
                userId: profile.id,
                context: userMessage || 'Photo shared',
                userMessage: userMessage,
              },
            }
          );

          let aiAnalysis: Record<string, unknown> = {
            has_photo: true,
            user_message: userMessage,
            analyzed_at: new Date().toISOString(),
          };

          if (!analysisError && analysisData?.analysis) {
            aiAnalysis = {
              ...aiAnalysis,
              ...analysisData.analysis,
            };
          }

          // Create photo memory with AI analysis
          await db.photoMemories.create({
            user_id: profile.id,
            photo_url: currentPhotoUrl,
            context: userMessage || 'Photo shared',
            ai_analysis: aiAnalysis,
            conversation_id: userConv.id,
          });

          // Create a memory about the photo
          await db.memories.create({
            user_id: profile.id,
            memory_text: `User shared a photo that made them feel good. ${aiAnalysis.why_they_liked_it ? `Why they liked it: ${aiAnalysis.why_they_liked_it}` : 'Photo shared.'}`,
            memory_type: 'emotion',
            importance_score: 8,
            source_conversation_id: userConv.id,
            emotion_tags: Array.isArray(aiAnalysis.emotions) ? aiAnalysis.emotions as string[] : ['contentment'],
            memory_themes: Array.isArray(aiAnalysis.themes) ? aiAnalysis.themes as string[] : ['photo', 'feeling'],
          });
        } catch (error) {
          console.error('Error creating photo memory:', error);
          // Still create basic photo memory even if analysis fails
          try {
            await db.photoMemories.create({
              user_id: profile.id,
              photo_url: currentPhotoUrl,
              context: userMessage || 'Photo shared',
              ai_analysis: {
                has_photo: true,
                user_message: userMessage,
                analyzed_at: new Date().toISOString(),
              },
              conversation_id: userConv.id,
            });
          } catch (createError) {
            console.error('Error creating basic photo memory:', createError);
          }
        }
      }

      // Call Edge Function to get AI response
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'newme-chat',
        {
          body: {
            userMessage: currentPhotoUrl 
              ? `${userMessage} [User shared a photo: ${currentPhotoUrl}]`
              : userMessage,
            conversationHistory: conversations.map(c => ({
              sender: c.sender,
              message: c.message,
              created_at: c.created_at,
            })),
            userProfile: {
              nickname: profile.nickname,
              preferences: profile.personality_traits,
              personalityInsights: personalityInsights,
              sunSign: profile.sun_sign,
              moonSign: profile.moon_sign,
              risingSign: profile.rising_sign,
            },
            userId: profile.id,
            memories: memories.map(m => ({
              memory_text: m.memory_text,
              memory_type: m.memory_type,
              importance_score: m.importance_score,
              emotion_tags: m.emotion_tags || [],
              memory_themes: m.memory_themes || [],
              created_at: m.created_at,
            })),
            photoMemories: photoMemories.map(p => ({
              photo_url: p.photo_url,
              context: p.context || '',
              ai_analysis: p.ai_analysis || {},
              created_at: p.created_at,
            })),
          },
        }
      );

      if (functionError) {
        console.error('Edge Function error:', functionError);
        toast.error('Failed to get response from NewMe');
        return;
      }

      const aiResponse = functionData.response;

      // Save AI response
      const aiConv = await db.conversations.create({
        user_id: profile.id,
        message: aiResponse,
        sender: 'newme',
        photo_url: null,
        context_data: {},
      });

      setConversations((prev) => [...prev, aiConv]);

      // Randomly create memories for important conversations
      if (Math.random() > 0.7) {
        await db.memories.create({
          user_id: profile.id,
          memory_text: `User shared: ${userMessage}`,
          memory_type: 'fact',
          importance_score: Math.floor(Math.random() * 5) + 5,
          source_conversation_id: userConv.id,
          emotion_tags: [],
          memory_themes: ['conversation'],
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        
        <Loader2 className="w-8 h-8 animate-spin text-primary relative z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="relative z-10 flex-1 flex flex-col container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <div className="mb-4 sm:mb-6 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <img 
              src="/images/newomen-icon.png" 
              alt="NewMe" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
            />
            <span className="gradient-text">NewMe</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your AI companion who remembers everything
          </p>
        </div>

        <Tabs defaultValue="text" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-3 sm:mb-4 h-11 sm:h-10">
            <TabsTrigger value="text" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Text Chat</span>
              <span className="xs:hidden">Text</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Voice Chat</span>
              <span className="xs:hidden">Voice</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="flex-1 flex flex-col mt-0 min-h-0">
            <Card className="glass-card flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 overscroll-contain">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex gap-2 sm:gap-3 ${conv.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {conv.sender === 'newme' && (
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10">
                    <img
                      src="/images/newomen-icon.png"
                      alt="NewMe"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl p-3 sm:p-4 ${
                    conv.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {conv.photo_url && (
                    <img
                      src={conv.photo_url}
                      alt="Shared"
                      className="rounded-lg mb-2 max-w-full h-auto"
                      loading="lazy"
                    />
                  )}
                  <p className="whitespace-pre-wrap text-sm sm:text-base break-words">{conv.message}</p>
                  <p className="text-xs opacity-70 mt-1.5 sm:mt-2">
                    {format(new Date(conv.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10">
                  <img
                    src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7cvlvulsgrnk/conv-7fi4fbzoge80/20251112/file-7i2qocv7vev4.png"
                    alt="NewMe"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="bg-muted rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-2 sm:p-4 safe-area-inset-bottom">
            <div className="flex gap-1.5 sm:gap-2 items-end">
              <VoiceRecorder
                onTranscript={(text) => setMessage(text)}
                disabled={loading}
              />
              <PhotoUpload
                onPhotoUploaded={(url) => setPhotoUrl(url)}
                disabled={loading}
              />
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="min-h-[52px] sm:min-h-[60px] resize-none flex-1 text-sm sm:text-base"
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={(!message.trim() && !photoUrl) || loading}
                size="icon"
                className="cosmic-gradient h-[52px] w-[52px] sm:h-10 sm:w-10 flex-shrink-0 touch-manipulation"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 sm:mt-2 px-1">
              NewMe remembers everything you share. Be honest.
            </p>
          </div>
        </Card>
          </TabsContent>

          <TabsContent value="voice" className="flex-1 flex flex-col mt-0">
            <RealtimeVoiceChat
              onConversationEnd={() => {
                toast.success('Voice conversation saved');
                loadConversations();
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
