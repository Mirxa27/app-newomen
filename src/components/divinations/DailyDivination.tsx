import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Check } from 'lucide-react';
import { db } from '@/db/api';
import { supabase } from '@/db/supabase';
import { useToast } from '@/hooks/use-toast';
import type { DivinationQuestionWithResponse } from '@/types/types';

export default function DailyDivination() {
  const [question, setQuestion] = useState<DivinationQuestionWithResponse | null>(null);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTodayQuestion();
  }, []);

  const loadTodayQuestion = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to access daily divinations.',
          variant: 'destructive',
        });
        return;
      }

      const todayQuestion = await db.divinations.getTodayQuestion(user.id);
      setQuestion(todayQuestion);
      
      if (todayQuestion?.user_response) {
        setResponse(todayQuestion.user_response.response_text || '');
        setIsCompleted(true);
      }
    } catch (error) {
      console.error('Error loading divination:', error);
      toast({
        title: 'Error',
        description: 'Failed to load today\'s divination. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!response.trim() || !question) return;

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await db.divinations.submitResponse(user.id, question.id, response.trim());

      try {
        const memory = await db.memories.create({
          user_id: user.id,
          memory_text: `Daily Divination Response - ${question.question_text}: ${response.trim()}`,
          memory_type: 'confession',
          importance_score: 0.7,
          source_conversation_id: null,
        });

        if (memory) {
          console.log('Memory created for divination response');
        }
      } catch (memoryError) {
        console.error('Error creating memory:', memoryError);
      }

      try {
        await db.gamification.incrementStat(user.id, 'total_divinations');
        await db.gamification.awardCrystals(user.id, 5, 'divination', 'Completed daily divination');
        await db.gamification.updateXP(user.id, 25);
        await db.gamification.updateStreak(user.id);

        const stats = await db.gamification.getUserStats(user.id);
        if (stats) {
          await db.gamification.checkAndAwardAchievement(
            user.id,
            'divinations',
            stats.total_divinations
          );
          await db.gamification.checkAndAwardAchievement(user.id, 'streak', stats.streak_days);
        }
      } catch (gamificationError) {
        console.error('Error updating gamification:', gamificationError);
      }

      setIsCompleted(true);
      toast({
        title: 'Response Saved! 🎉',
        description: 'Earned 5 crystals and 25 XP. Your journey continues.',
      });
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'hard':
        return 'text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'daily_divination':
        return 'Daily Divination';
      case 'olfactory_quiz':
        return 'Olfactory Profiling';
      case 'therapy_game':
        return 'Therapy Game';
      case 'truth_game':
        return 'Truth Game';
      default:
        return 'Divination';
    }
  };

  if (isLoading) {
    return (
      <Card className="cosmic-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!question) {
    return (
      <Card className="cosmic-card">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No divination available today. Check back tomorrow!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cosmic-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {getQuestionTypeLabel(question.question_type)}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="text-muted-foreground capitalize">{question.category}</span>
              <span className="text-muted-foreground">•</span>
              <span className={getDifficultyColor(question.difficulty)}>
                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
              </span>
            </CardDescription>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1 text-green-400">
              <Check className="h-4 w-4" />
              <span className="text-sm">Completed</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="rounded-lg bg-primary/10 p-6 border border-primary/20">
            <p className="text-lg font-medium leading-relaxed">{question.question_text}</p>
          </div>

          {question.metadata && typeof question.metadata === 'object' && 'scale' in question.metadata && (
            <div className="text-sm text-muted-foreground">
              <p>Rate on a scale of {String((question.metadata.scale as { min: number; max: number }).min)} to {String((question.metadata.scale as { min: number; max: number }).max)}</p>
            </div>
          )}

          {question.metadata && typeof question.metadata === 'object' && 'word_count' in question.metadata && (
            <div className="text-sm text-muted-foreground">
              <p>Use exactly {String(question.metadata.word_count)} words</p>
            </div>
          )}

          {question.metadata && typeof question.metadata === 'object' && 'technique' in question.metadata && (
            <div className="text-sm text-muted-foreground">
              <p>Technique: {String(question.metadata.technique)}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Share your truth here... NewMe is listening."
            className="min-h-[150px] resize-none"
            disabled={isCompleted}
          />

          {!isCompleted && (
            <Button
              onClick={handleSubmit}
              disabled={!response.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Submit Response
                </>
              )}
            </Button>
          )}

          {isCompleted && question.user_response?.ai_insight && (
            <div className="rounded-lg bg-secondary/50 p-4 border border-secondary">
              <h4 className="font-medium mb-2 text-sm text-muted-foreground">NewMe's Insight</h4>
              <p className="text-sm leading-relaxed">{question.user_response.ai_insight}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
