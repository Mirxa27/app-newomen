import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Save, CheckCircle2, Sparkles } from 'lucide-react';
import { db } from '@/db/api';
import { toast } from 'sonner';
import type { ShadowWorkJourney, ShadowWorkResponse } from '@/types/types';

const journeyQuestions: Record<string, string[]> = {
  inner_child: [
    'What did you love to do as a child that you no longer do?',
    'What did you need to hear as a child that you never heard?',
    'What childhood memory still brings you pain or sadness?',
    'How did you express your emotions as a child?',
    'What did you believe about yourself as a child?',
    'What would your inner child want you to know right now?',
    'How can you nurture your inner child today?',
    'What childhood dream did you abandon and why?',
    'What does your inner child need from you to feel safe?',
    'Write a letter to your inner child expressing love and acceptance.',
  ],
  shadow_self: [
    'What traits in others trigger strong negative reactions in you?',
    'What parts of yourself do you try to hide from others?',
    'What would you do if no one was watching or judging you?',
    'What emotions do you find most difficult to express?',
    'What aspects of yourself do you judge most harshly?',
    'What would happen if you accepted these shadow aspects?',
    'How do your shadow traits actually serve or protect you?',
    'What would it feel like to integrate these hidden parts?',
    'What gifts might your shadow self be offering you?',
    'How can you honor and embrace your whole self?',
  ],
  limiting_beliefs: [
    'What do you believe about yourself that limits your potential?',
    'Where did this belief come from? Who taught it to you?',
    'What evidence contradicts this limiting belief?',
    'How has this belief protected you in the past?',
    'What would be possible if you no longer believed this?',
    'What new empowering belief could replace this one?',
    'What small action could challenge this belief today?',
    'Who would you be without this limiting belief?',
    'What fears arise when you consider letting this belief go?',
    'What commitment can you make to your new empowering belief?',
  ],
  emotional_wounds: [
    'What emotional wound are you ready to heal?',
    'When did this wound first occur? Describe the experience.',
    'What emotions are you still carrying from this wound?',
    'How has this wound shaped your relationships and choices?',
    'What would healing this wound mean for you?',
    'What do you need to forgive yourself or others for?',
    'What wisdom or strength have you gained from this wound?',
    'How can you show compassion to the part of you that was hurt?',
    'What does complete healing look and feel like to you?',
    'What is one step you can take today toward healing?',
  ],
};

export default function ShadowWorkJourney() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<ShadowWorkJourney | null>(null);
  const [responses, setResponses] = useState<ShadowWorkResponse[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadJourney();
    }
  }, [id]);

  const loadJourney = async () => {
    if (!id) return;

    try {
      const [journeyData, responsesData] = await Promise.all([
        db.shadowWork.getJourney(id),
        db.shadowWork.getResponses(id),
      ]);

      if (!journeyData) {
        toast.error('Journey not found');
        navigate('/shadow-work');
        return;
      }

      setJourney(journeyData);
      setResponses(responsesData);

      // Load current question's response if it exists
      const currentQuestionResponse = responsesData.find(
        (r) => r.question_number === journeyData.current_question
      );
      if (currentQuestionResponse) {
        setCurrentResponse(currentQuestionResponse.response_text);
        setReflectionNotes(currentQuestionResponse.reflection_notes || '');
      }
    } catch (error) {
      console.error('Error loading journey:', error);
      toast.error('Failed to load journey');
      navigate('/shadow-work');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentQuestion = () => {
    if (!journey) return '';
    const questions = journeyQuestions[journey.journey_type];
    return questions[journey.current_question - 1] || '';
  };

  const handleSaveResponse = async () => {
    if (!journey || !profile || !currentResponse.trim()) {
      toast.error('Please write a response before saving');
      return;
    }

    setSaving(true);
    try {
      await db.shadowWork.saveResponse(
        journey.id,
        profile.id,
        journey.current_question,
        getCurrentQuestion(),
        currentResponse,
        reflectionNotes
      );
      toast.success('Response saved');
      loadJourney();
    } catch (error) {
      console.error('Error saving response:', error);
      toast.error('Failed to save response');
    } finally {
      setSaving(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!journey || !profile) return;

    if (!currentResponse.trim()) {
      toast.error('Please answer the current question before proceeding');
      return;
    }

    setSaving(true);
    try {
      // Save current response
      await db.shadowWork.saveResponse(
        journey.id,
        profile.id,
        journey.current_question,
        getCurrentQuestion(),
        currentResponse,
        reflectionNotes
      );

      // Check if this is the last question
      if (journey.current_question === 10) {
        await db.shadowWork.completeJourney(journey.id);
        toast.success('Journey completed! 🎉');
        navigate('/shadow-work');
      } else {
        // Advance to next question
        await db.shadowWork.advanceQuestion(journey.id);
        setCurrentResponse('');
        setReflectionNotes('');
        loadJourney();
      }
    } catch (error) {
      console.error('Error advancing question:', error);
      toast.error('Failed to proceed to next question');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (!journey || journey.current_question === 1) return;
    
    const prevResponse = responses.find(
      (r) => r.question_number === journey.current_question - 1
    );
    
    if (prevResponse) {
      setCurrentResponse(prevResponse.response_text);
      setReflectionNotes(prevResponse.reflection_notes || '');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your journey...</p>
        </div>
      </div>
    );
  }

  if (!journey) {
    return null;
  }

  const progress = (journey.current_question / 10) * 100;

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      <div className="relative container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/shadow-work')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Journeys
          </Button>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {journey.journey_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h1>
              <p className="text-muted-foreground">
                Question {journey.current_question} of 10
              </p>
            </div>
            {journey.is_completed && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{getCurrentQuestion()}</CardTitle>
            <CardDescription>
              Take your time to reflect deeply. There are no right or wrong answers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="response">Your Response</Label>
              <Textarea
                id="response"
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Write your thoughts and feelings here..."
                className="min-h-[200px] mt-2"
                disabled={journey.is_completed}
              />
            </div>

            <div>
              <Label htmlFor="reflection">Additional Reflections (Optional)</Label>
              <Textarea
                id="reflection"
                value={reflectionNotes}
                onChange={(e) => setReflectionNotes(e.target.value)}
                placeholder="Any additional insights, emotions, or observations..."
                className="min-h-[100px] mt-2"
                disabled={journey.is_completed}
              />
            </div>

            {!journey.is_completed && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSaveResponse}
                  disabled={saving || !currentResponse.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Progress
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={saving || !currentResponse.trim()}
                  className="flex-1"
                >
                  {journey.current_question === 10 ? 'Complete Journey' : 'Next Question'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Previous Responses */}
        {responses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Journey So Far</CardTitle>
              <CardDescription>
                Review your previous responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {responses
                  .sort((a, b) => a.question_number - b.question_number)
                  .map((response) => (
                    <div key={response.id} className="border-l-2 border-primary pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Question {response.question_number}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(response.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-2">{response.question_text}</p>
                      <p className="text-sm text-muted-foreground">{response.response_text}</p>
                      {response.reflection_notes && (
                        <p className="text-sm text-muted-foreground italic mt-2">
                          Reflection: {response.reflection_notes}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
