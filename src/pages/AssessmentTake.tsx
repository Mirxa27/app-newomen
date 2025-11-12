import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { db } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { Assessment } from '@/types/types';
import { toast } from 'sonner';

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'scale' | 'text';
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  scale_labels?: { min: string; max: string };
}

interface Answer {
  question_id: string;
  answer: string | number;
}

export default function AssessmentTake() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadAssessment();
    }
  }, [id]);

  const loadAssessment = async () => {
    if (!id) return;

    try {
      const data = await db.assessments.getById(id);
      if (!data) {
        toast.error('Assessment not found');
        navigate('/assessments');
        return;
      }

      if (!data.is_free && !profile) {
        toast.error('Please sign in to access this assessment');
        navigate('/login');
        return;
      }

      setAssessment(data);
      
      const assessmentQuestions = data.questions as Question[];
      if (assessmentQuestions && assessmentQuestions.length > 0) {
        setQuestions(assessmentQuestions);
      } else {
        generateDefaultQuestions(data.category);
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
      toast.error('Failed to load assessment');
      navigate('/assessments');
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultQuestions = (category: string) => {
    const questionSets: Record<string, Question[]> = {
      personality: [
        {
          id: '1',
          text: 'How do you typically recharge after a long day?',
          type: 'multiple_choice',
          options: [
            'Spending time alone with my thoughts',
            'Socializing with friends or family',
            'Engaging in a hobby or creative activity',
            'Physical exercise or outdoor activities'
          ]
        },
        {
          id: '2',
          text: 'When faced with a difficult decision, I tend to:',
          type: 'multiple_choice',
          options: [
            'Analyze all options logically',
            'Trust my gut feeling',
            'Seek advice from others',
            'Consider how it affects people around me'
          ]
        },
        {
          id: '3',
          text: 'Rate your comfort level with spontaneity and change',
          type: 'scale',
          scale_min: 1,
          scale_max: 10,
          scale_labels: { min: 'I prefer routine', max: 'I thrive on change' }
        },
        {
          id: '4',
          text: 'Describe a recent situation where you felt most like yourself',
          type: 'text'
        },
        {
          id: '5',
          text: 'In group settings, I usually:',
          type: 'multiple_choice',
          options: [
            'Take the lead and organize',
            'Contribute ideas when asked',
            'Observe and listen more than speak',
            'Facilitate and ensure everyone is heard'
          ]
        }
      ],
      relationships: [
        {
          id: '1',
          text: 'What matters most to you in a relationship?',
          type: 'multiple_choice',
          options: [
            'Deep emotional connection',
            'Intellectual compatibility',
            'Shared values and goals',
            'Physical attraction and chemistry'
          ]
        },
        {
          id: '2',
          text: 'How do you typically handle conflict in relationships?',
          type: 'multiple_choice',
          options: [
            'Address it immediately and directly',
            'Take time to cool down before discussing',
            'Avoid confrontation when possible',
            'Seek compromise and middle ground'
          ]
        },
        {
          id: '3',
          text: 'Rate your need for independence in relationships',
          type: 'scale',
          scale_min: 1,
          scale_max: 10,
          scale_labels: { min: 'I prefer togetherness', max: 'I need lots of space' }
        },
        {
          id: '4',
          text: 'Describe your ideal way to spend quality time with a partner',
          type: 'text'
        },
        {
          id: '5',
          text: 'When your partner is upset, you:',
          type: 'multiple_choice',
          options: [
            'Try to fix the problem immediately',
            'Listen and offer emotional support',
            'Give them space to process',
            'Distract them with something positive'
          ]
        }
      ],
      career: [
        {
          id: '1',
          text: 'What drives you most in your career?',
          type: 'multiple_choice',
          options: [
            'Financial success and stability',
            'Making a positive impact',
            'Personal growth and learning',
            'Recognition and achievement'
          ]
        },
        {
          id: '2',
          text: 'Your ideal work environment is:',
          type: 'multiple_choice',
          options: [
            'Structured with clear expectations',
            'Flexible and autonomous',
            'Collaborative and team-oriented',
            'Fast-paced and dynamic'
          ]
        },
        {
          id: '3',
          text: 'Rate your satisfaction with your current career path',
          type: 'scale',
          scale_min: 1,
          scale_max: 10,
          scale_labels: { min: 'Very dissatisfied', max: 'Very satisfied' }
        },
        {
          id: '4',
          text: 'Describe what success looks like to you in 5 years',
          type: 'text'
        },
        {
          id: '5',
          text: 'When taking on new projects, you prefer:',
          type: 'multiple_choice',
          options: [
            'Clear instructions and guidelines',
            'Creative freedom to innovate',
            'Collaborative brainstorming',
            'Challenging problems to solve'
          ]
        }
      ],
      wellness: [
        {
          id: '1',
          text: 'How would you describe your current stress level?',
          type: 'scale',
          scale_min: 1,
          scale_max: 10,
          scale_labels: { min: 'Very calm', max: 'Very stressed' }
        },
        {
          id: '2',
          text: 'What helps you feel most grounded and centered?',
          type: 'multiple_choice',
          options: [
            'Meditation or mindfulness practices',
            'Physical exercise',
            'Time in nature',
            'Creative expression'
          ]
        },
        {
          id: '3',
          text: 'Rate your current work-life balance',
          type: 'scale',
          scale_min: 1,
          scale_max: 10,
          scale_labels: { min: 'Very unbalanced', max: 'Very balanced' }
        },
        {
          id: '4',
          text: 'Describe your biggest wellness challenge right now',
          type: 'text'
        },
        {
          id: '5',
          text: 'When you feel overwhelmed, you typically:',
          type: 'multiple_choice',
          options: [
            'Push through and keep going',
            'Take a break and rest',
            'Talk to someone about it',
            'Engage in a stress-relief activity'
          ]
        }
      ],
      astrology: [
        {
          id: '1',
          text: 'How connected do you feel to cosmic energies?',
          type: 'scale',
          scale_min: 1,
          scale_max: 10,
          scale_labels: { min: 'Not at all', max: 'Very connected' }
        },
        {
          id: '2',
          text: 'Which element resonates most with you?',
          type: 'multiple_choice',
          options: [
            'Fire - Passionate, dynamic, energetic',
            'Earth - Grounded, practical, stable',
            'Air - Intellectual, communicative, social',
            'Water - Emotional, intuitive, empathetic'
          ]
        },
        {
          id: '3',
          text: 'Rate your belief in astrology and cosmic influence',
          type: 'scale',
          scale_min: 1,
          scale_max: 10,
          scale_labels: { min: 'Skeptical', max: 'Strong believer' }
        },
        {
          id: '4',
          text: 'Describe a time when you felt aligned with the universe',
          type: 'text'
        },
        {
          id: '5',
          text: 'How do you use astrology in your life?',
          type: 'multiple_choice',
          options: [
            'Daily horoscopes and guidance',
            'Understanding myself and others',
            'Timing important decisions',
            'Just for fun and curiosity'
          ]
        }
      ]
    };

    setQuestions(questionSets[category] || questionSets.personality);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.question_id === currentQuestion?.id);
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = (value: string | number) => {
    if (!currentQuestion) return;

    const newAnswers = answers.filter(a => a.question_id !== currentQuestion.id);
    newAnswers.push({ question_id: currentQuestion.id, answer: value });
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!assessment || !profile) return;

    if (answers.length < questions.length) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    try {
      setSubmitting(true);
      
      // Call Edge Function to generate AI insights
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'generate-assessment-insights',
        {
          body: {
            category: assessment.category,
            assessmentTitle: assessment.title,
            answers: answers.map((a, i) => ({
              questionId: a.question_id,
              questionText: questions.find(q => q.id === a.question_id)?.text || '',
              answer: a.answer,
            })),
          },
        }
      );

      if (functionError) {
        console.error('Edge Function error:', functionError);
        toast.error('Failed to generate insights. Please try again.');
        return;
      }

      const insights = functionData.insights;
      
      // Save assessment results to database
      await db.userAssessments.create({
        user_id: profile.id,
        assessment_id: assessment.id,
        responses: answers as unknown,
        ai_insights: insights as unknown,
        score_data: {},
      });

      toast.success('Assessment completed successfully!');
      navigate(`/assessment/${assessment.id}/results`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        
        <div className="relative z-10">
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        
        <div className="relative z-10">
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Assessment not available</p>
              <Button onClick={() => navigate('/assessments')} className="mt-4">
                Back to Assessments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">{assessment.title}</span>
          </h1>
          <p className="text-muted-foreground">{assessment.description}</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion.type === 'multiple_choice' && (
              <RadioGroup
                value={currentAnswer?.answer?.toString()}
                onValueChange={handleAnswer}
              >
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {currentQuestion.type === 'scale' && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{currentQuestion.scale_labels?.min}</span>
                  <span>{currentQuestion.scale_labels?.max}</span>
                </div>
                <RadioGroup
                  value={currentAnswer?.answer?.toString()}
                  onValueChange={(value) => handleAnswer(Number(value))}
                  className="flex justify-between"
                >
                  {Array.from(
                    { length: (currentQuestion.scale_max || 10) - (currentQuestion.scale_min || 1) + 1 },
                    (_, i) => (currentQuestion.scale_min || 1) + i
                  ).map((num) => (
                    <div key={num} className="flex flex-col items-center gap-2">
                      <RadioGroupItem value={num.toString()} id={`scale-${num}`} />
                      <Label htmlFor={`scale-${num}`} className="cursor-pointer">
                        {num}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <Textarea
                value={currentAnswer?.answer?.toString() || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Share your thoughts..."
                className="min-h-[150px]"
              />
            )}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!currentAnswer}
                  className="cosmic-gradient"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={answers.length < questions.length || submitting}
                  className="cosmic-gradient"
                >
                  {submitting ? 'Submitting...' : 'Complete Assessment'}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
