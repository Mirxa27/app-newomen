import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Brain, Flower2, Target, Play } from 'lucide-react';
import { db } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { DivinationQuestion } from '@/types/types';
import { useNavigate } from 'react-router-dom';

export default function DivinationGames() {
  const [therapyGames, setTherapyGames] = useState<DivinationQuestion[]>([]);
  const [truthGames, setTruthGames] = useState<DivinationQuestion[]>([]);
  const [olfactoryQuiz, setOlfactoryQuiz] = useState<DivinationQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      const [therapy, truth, olfactory] = await Promise.all([
        db.divinations.getQuestionsByType('therapy_game'),
        db.divinations.getQuestionsByType('truth_game'),
        db.divinations.getQuestionsByType('olfactory_quiz'),
      ]);

      setTherapyGames(therapy);
      setTruthGames(truth);
      setOlfactoryQuiz(olfactory);
    } catch (error) {
      console.error('Error loading games:', error);
      toast({
        title: 'Error',
        description: 'Failed to load divination games.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const startGameSession = async (question: DivinationQuestion) => {
    try {
      // Create a new game session
      const sessionId = `game-${question.id}-${Date.now()}`;
      
      // Navigate to game session page with question data
      navigate(`/divinations/game/${sessionId}`, {
        state: {
          question,
          sessionId,
          gameType: question.question_type,
        },
      });
    } catch (error) {
      console.error('Error starting game session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start game session.',
        variant: 'destructive',
      });
    }
  };

  const renderQuestionCard = (question: DivinationQuestion) => (
    <Card key={question.id} className="cosmic-card hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-base leading-relaxed">
              {question.question_text}
            </CardTitle>
            <CardDescription className="capitalize">{question.category}</CardDescription>
          </div>
          <span
            className={`px-2 py-1 rounded-md text-xs font-medium border ${getDifficultyColor(
              question.difficulty
            )}`}
          >
            {question.difficulty}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => startGameSession(question)}
        >
          <Play className="h-4 w-4 mr-2" />
          Start This Exercise
        </Button>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Card className="cosmic-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="therapy" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="therapy" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <span className="hidden sm:inline">Therapy</span>
        </TabsTrigger>
        <TabsTrigger value="truth" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          <span className="hidden sm:inline">Truth</span>
        </TabsTrigger>
        <TabsTrigger value="olfactory" className="flex items-center gap-2">
          <Flower2 className="h-4 w-4" />
          <span className="hidden sm:inline">Olfactory</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="therapy" className="mt-6 space-y-4">
        <div className="space-y-2 mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Therapy Games
          </h3>
          <p className="text-muted-foreground">
            Therapeutic exercises designed to help you explore your inner world
          </p>
        </div>
        {therapyGames.length === 0 ? (
          <Card className="cosmic-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No therapy games available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {therapyGames.map(renderQuestionCard)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="truth" className="mt-6 space-y-4">
        <div className="space-y-2 mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Truth Games
          </h3>
          <p className="text-muted-foreground">
            Brutally honest questions that cut through your defenses
          </p>
        </div>
        {truthGames.length === 0 ? (
          <Card className="cosmic-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No truth games available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {truthGames.map(renderQuestionCard)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="olfactory" className="mt-6 space-y-4">
        <div className="space-y-2 mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Flower2 className="h-5 w-5 text-primary" />
            Olfactory Profiling
          </h3>
          <p className="text-muted-foreground">
            Explore your emotional landscape through scent associations
          </p>
        </div>
        {olfactoryQuiz.length === 0 ? (
          <Card className="cosmic-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No olfactory questions available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {olfactoryQuiz.map(renderQuestionCard)}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
