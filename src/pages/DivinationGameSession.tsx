import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Save, Sparkles } from 'lucide-react';
import { db } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { DivinationQuestion } from '@/types/types';

interface GameSessionState {
  question: DivinationQuestion;
  sessionId: string;
  gameType: string;
}

export default function DivinationGameSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const [sessionData, setSessionData] = useState<GameSessionState | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (location.state) {
      setSessionData(location.state as GameSessionState);
      setIsLoading(false);
    } else {
      navigate('/divinations');
    }
  }, [location.state, navigate]);

  const handleSubmitResponse = async () => {
    if (!sessionData || !profile) {
      toast({
        title: 'Error',
        description: 'Session data or profile is missing.',
        variant: 'destructive',
      });
      return;
    }

    const trimmedResponse = userResponse.trim();
    if (!trimmedResponse) {
      toast({
        title: 'Validation Error',
        description: 'Please write a response before submitting.',
        variant: 'destructive',
      });
      return;
    }

    if (trimmedResponse.length > 5000) {
      toast({
        title: 'Validation Error',
        description: 'Response must be less than 5000 characters.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Save the response
      await db.divinations.submitResponse(
        profile.id,
        sessionData.question.id,
        trimmedResponse,
        {
          gameType: sessionData.gameType,
          sessionId: sessionData.sessionId,
          difficulty: sessionData.question.difficulty,
        }
      );

      toast({
        title: 'Response Saved',
        description: 'Your reflection has been recorded successfully.',
      });

      // Navigate back to divinations page
      navigate('/divinations');
    } catch (error) {
      console.error('Error saving response:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save your response.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGameTypeLabel = (gameType: string) => {
    switch (gameType) {
      case 'therapy_game':
        return 'Therapy Game';
      case 'truth_game':
        return 'Truth Game';
      case 'olfactory_quiz':
        return 'Olfactory Quiz';
      default:
        return 'Game';
    }
  };

  const getGameTypeColor = (gameType: string) => {
    switch (gameType) {
      case 'therapy_game':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'truth_game':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'olfactory_quiz':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Session not found</p>
            <Button onClick={() => navigate('/divinations')} className="mt-4">
              Back to Divinations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/divinations')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Game Session</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getGameTypeColor(sessionData.gameType)}>
                {getGameTypeLabel(sessionData.gameType)}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {sessionData.question.difficulty}
              </Badge>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="cosmic-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Your Question</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed text-foreground/90">
              {sessionData.question.question_text}
            </p>
            {sessionData.question.category && (
              <p className="text-sm text-muted-foreground mt-2 capitalize">
                Category: {sessionData.question.category}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Response Area */}
        <Card className="cosmic-card">
          <CardHeader>
            <CardTitle>Your Response</CardTitle>
            <p className="text-sm text-muted-foreground">
              Take your time to reflect deeply on this question. Your honest response will help you gain valuable insights.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Write your thoughts here..."
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              className="min-h-32 resize-none"
            />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/divinations')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitResponse}
                disabled={isSubmitting || !userResponse.trim()}
                className="flex-1 cosmic-gradient"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Reflection
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="cosmic-card mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Tips for Reflection</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Be honest and authentic with yourself</p>
            <p>• Don't rush - take time to explore your feelings</p>
            <p>• Consider how this relates to your life experiences</p>
            <p>• Notice any patterns or recurring themes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
