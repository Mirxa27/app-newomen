import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CosmicBackground } from '@/components/cosmic/CosmicBackground';
import { Send, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { db } from '@/db/api';
import type { Conversation } from '@/types/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Chat() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const generateNewMeResponse = (userMessage: string): string => {
    const responses = [
      `Interesting. But you're holding back. What are you not telling me?`,
      `That's surface level. Let's go deeper. What's the real reason behind that?`,
      `I hear what you're saying, but I'm more interested in what you're NOT saying. What are you avoiding?`,
      `Okay, but on a scale of 1-10, how much are you lying to yourself about this right now?`,
      `You're that person who smiles when they hate the joke. Am I wrong?`,
      `Keep going, but control your own breathing; you think 'later' is a safe word. It's not. It's a death sentence.`,
      `You hate mirrors, but not because you look ugly; you hate remembering you choose this version of yourself every day.`,
      `That's a pattern. I've noticed it before. Want to talk about why you keep doing this?`,
      `Interesting choice of words. What does that really mean to you?`,
      `I remember you mentioned something similar before. See the connection?`,
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSend = async () => {
    if (!message.trim() || !profile || loading) return;

    const userMessage = message.trim();
    setMessage('');
    setLoading(true);

    try {
      const userConv = await db.conversations.create({
        user_id: profile.id,
        message: userMessage,
        sender: 'user',
        photo_url: null,
        context_data: {},
      });

      setConversations((prev) => [...prev, userConv]);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiResponse = generateNewMeResponse(userMessage);
      const aiConv = await db.conversations.create({
        user_id: profile.id,
        message: aiResponse,
        sender: 'newme',
        photo_url: null,
        context_data: {},
      });

      setConversations((prev) => [...prev, aiConv]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      setLoading(true);
      const photoUrl = await db.storage.uploadPhoto(profile.id, file);
      
      const userConv = await db.conversations.create({
        user_id: profile.id,
        message: '[Photo shared]',
        sender: 'user',
        photo_url: photoUrl,
        context_data: {},
      });

      setConversations((prev) => [...prev, userConv]);

      await db.photoMemories.create({
        user_id: profile.id,
        photo_url: photoUrl,
        context: 'Shared in conversation',
        ai_analysis: {},
        conversation_id: userConv.id,
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiConv = await db.conversations.create({
        user_id: profile.id,
        message: "Interesting photo. What's the story behind it? And more importantly, what are you not telling me about it?",
        sender: 'newme',
        photo_url: null,
        context_data: {},
      });

      setConversations((prev) => [...prev, aiConv]);
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
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
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Press Enter to send)"
                className="min-h-[60px] resize-none"
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || loading}
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
