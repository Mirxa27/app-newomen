import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CosmicBackground } from '@/components/cosmic/CosmicBackground';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { db } from '@/db/api';
import { supabase } from '@/db/supabase';
import { VoiceRecorder } from '@/components/chat/VoiceRecorder';
import { PhotoUpload } from '@/components/chat/PhotoUpload';
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
      
      if (data.length === 0) {
        const welcomeMessage = await db.conversations.create({
          user_id: profile.id,
          message: `Hey ${profile.nickname || 'there'}. I'm NewMe. Let's skip the pleasantries—I don't do small talk. Tell me something real. What's actually going on with you right now?`,
          sender: 'newme',
          photo_url: null,
          context_data: {},
        });
        setConversations([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && !photoUrl) || !profile || loading) return;

    const userMessage = message.trim() || (photoUrl ? '[Photo shared]' : '');
    const currentPhotoUrl = photoUrl;
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
            },
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
        <CosmicBackground />
        <Loader2 className="w-8 h-8 animate-spin text-primary relative z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <CosmicBackground />
      
      <div className="relative z-10 flex-1 flex flex-col container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <span className="gradient-text">NewMe</span>
          </h1>
          <p className="text-muted-foreground">
            Your AI companion who remembers everything
          </p>
        </div>

        <Card className="glass-card flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex ${conv.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    conv.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {conv.photo_url && (
                    <img
                      src={conv.photo_url}
                      alt="Shared"
                      className="rounded-lg mb-2 max-w-full"
                    />
                  )}
                  <p className="whitespace-pre-wrap">{conv.message}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {format(new Date(conv.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl p-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-4">
            <div className="flex gap-2 items-end">
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
                placeholder="Type your message... (Press Enter to send)"
                className="min-h-[60px] resize-none flex-1"
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={(!message.trim() && !photoUrl) || loading}
                size="icon"
                className="cosmic-gradient"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              NewMe remembers everything you share. Be honest.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
