import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Moon, Heart, Brain, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { db } from '@/db/api';
import { toast } from 'sonner';
import type { ShadowWorkJourney, ShadowJourneyType } from '@/types/types';

interface JourneyTemplate {
  type: ShadowJourneyType;
  title: string;
  description: string;
  icon: typeof Moon;
  color: string;
  questions: string[];
}

const journeyTemplates: JourneyTemplate[] = [
  {
    type: 'inner_child',
    title: 'Inner Child Healing',
    description: 'Reconnect with your inner child and heal childhood wounds',
    icon: Heart,
    color: 'text-pink-500',
    questions: [
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
  },
  {
    type: 'shadow_self',
    title: 'Shadow Self Integration',
    description: 'Explore and integrate the hidden aspects of your personality',
    icon: Moon,
    color: 'text-purple-500',
    questions: [
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
  },
  {
    type: 'limiting_beliefs',
    title: 'Limiting Beliefs Release',
    description: 'Identify and transform beliefs that hold you back',
    icon: Brain,
    color: 'text-blue-500',
    questions: [
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
  },
  {
    type: 'emotional_wounds',
    title: 'Emotional Wound Healing',
    description: 'Process and heal deep emotional wounds',
    icon: Sparkles,
    color: 'text-yellow-500',
    questions: [
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
  },
];

export default function ShadowWork() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [journeys, setJourneys] = useState<ShadowWorkJourney[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadJourneys();
    }
  }, [profile]);

  const loadJourneys = async () => {
    if (!profile) return;

    try {
      const data = await db.shadowWork.listJourneys(profile.id);
      setJourneys(data);
    } catch (error) {
      console.error('Error loading journeys:', error);
      toast.error('Failed to load journeys');
    } finally {
      setLoading(false);
    }
  };

  const handleStartJourney = async (type: ShadowJourneyType) => {
    if (!profile) {
      toast.error('Please sign in to start a journey');
      navigate('/login');
      return;
    }

    try {
      const journey = await db.shadowWork.createJourney(profile.id, type);
      toast.success('Journey started!');
      navigate(`/shadow-work/${journey.id}`);
    } catch (error) {
      console.error('Error starting journey:', error);
      toast.error('Failed to start journey');
    }
  };

  const handleContinueJourney = (journeyId: string) => {
    navigate(`/shadow-work/${journeyId}`);
  };

  const getJourneyProgress = (journey: ShadowWorkJourney) => {
    return (journey.current_question / 10) * 100;
  };

  const getJourneyTemplate = (type: ShadowJourneyType) => {
    return journeyTemplates.find((t) => t.type === type);
  };

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      <div className="relative container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Shadow Work Journeys</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Embark on a transformative journey of self-discovery through structured shadow work
          </p>
        </div>

        {/* Active Journeys */}
        {journeys.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Your Journeys</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {journeys.map((journey) => {
                const template = getJourneyTemplate(journey.journey_type);
                if (!template) return null;
                
                const Icon = template.icon;
                const progress = getJourneyProgress(journey);

                return (
                  <Card key={journey.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-8 h-8 ${template.color}`} />
                        {journey.is_completed ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <CardTitle>{template.title}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                              {journey.current_question}/10 questions
                            </span>
                          </div>
                          <Progress value={progress} />
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => handleContinueJourney(journey.id)}
                        >
                          {journey.is_completed ? 'Review Journey' : 'Continue Journey'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Journeys */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Start a New Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {journeyTemplates.map((template) => {
              const Icon = template.icon;
              const hasActiveJourney = journeys.some(
                (j) => j.journey_type === template.type && !j.is_completed
              );

              return (
                <Card key={template.type} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Icon className={`w-12 h-12 ${template.color} mb-4`} />
                    <CardTitle>{template.title}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-2">This journey includes:</p>
                        <ul className="space-y-1">
                          <li>• 10 deep reflection questions</li>
                          <li>• Guided self-discovery process</li>
                          <li>• Personal insights and revelations</li>
                          <li>• Emotional healing and integration</li>
                        </ul>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleStartJourney(template.type)}
                        disabled={hasActiveJourney || loading}
                      >
                        {hasActiveJourney ? 'Journey In Progress' : 'Start Journey'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Info Section */}
        <Card className="mt-12 max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>About Shadow Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Shadow work is a powerful practice of exploring the hidden, unconscious aspects of yourself. 
              Through structured journeys, you'll uncover limiting beliefs, heal emotional wounds, and 
              integrate all parts of yourself into a more whole and authentic being.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Benefits</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Increased self-awareness</li>
                  <li>• Emotional healing and release</li>
                  <li>• Greater self-acceptance</li>
                  <li>• Improved relationships</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Best Practices</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Find a quiet, safe space</li>
                  <li>• Be honest and vulnerable</li>
                  <li>• Take your time with each question</li>
                  <li>• Practice self-compassion</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
