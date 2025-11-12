import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Heart, Briefcase, TrendingUp, Star, Lock, CheckCircle2 } from 'lucide-react';
import { db } from '@/db/api';
import type { Assessment } from '@/types/types';

const categoryIcons = {
  personality: Brain,
  relationships: Heart,
  career: Briefcase,
  wellness: TrendingUp,
  astrology: Star,
};

export default function Assessments() {
  const { user, profile } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadAssessments();
  }, [user]);

  const loadAssessments = async () => {
    try {
      const data = await db.assessments.list();
      setAssessments(data);

      if (profile) {
        const userAssessments = await db.userAssessments.list(profile.id);
        setCompletedIds(new Set(userAssessments.map((ua) => ua.assessment_id)));
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((assessment) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'free') return assessment.is_free;
    if (selectedCategory === 'completed') return completedIds.has(assessment.id);
    return assessment.category === selectedCategory;
  });

  const freeAssessments = assessments.filter((a) => a.is_free);
  const paidAssessments = assessments.filter((a) => !a.is_free);

  return (
    <div className="min-h-screen relative">
      
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Assessments</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover yourself through AI-guided personality tests and insights
          </p>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{assessments.length}</div>
              <p className="text-sm text-muted-foreground">Total Assessments</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{freeAssessments.length}</div>
              <p className="text-sm text-muted-foreground">Free Assessments</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{paidAssessments.length}</div>
              <p className="text-sm text-muted-foreground">Premium Assessments</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{completedIds.size}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="glass-card">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="free">Free</TabsTrigger>
            <TabsTrigger value="personality">Personality</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="career">Career</TabsTrigger>
            <TabsTrigger value="wellness">Wellness</TabsTrigger>
            <TabsTrigger value="astrology">Astrology</TabsTrigger>
            {user && <TabsTrigger value="completed">Completed</TabsTrigger>}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading assessments...</p>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No assessments found in this category</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredAssessments.map((assessment) => {
              const Icon = categoryIcons[assessment.category];
              const isCompleted = completedIds.has(assessment.id);
              const isLocked = !assessment.is_free && !user;

              return (
                <Card
                  key={assessment.id}
                  className={`glass-card ${
                    isCompleted ? 'border-primary/50' : 'border-border'
                  } hover:border-primary/50 transition-all`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {assessment.title}
                            {isCompleted && (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            )}
                          </CardTitle>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">
                              {assessment.category}
                            </Badge>
                            {assessment.is_free ? (
                              <Badge variant="secondary">Free</Badge>
                            ) : (
                              <Badge variant="default" className="cosmic-gradient">
                                Premium
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription>{assessment.description}</CardDescription>
                    
                    {isLocked ? (
                      <Button variant="outline" className="w-full" disabled>
                        <Lock className="w-4 h-4 mr-2" />
                        Sign in to access
                      </Button>
                    ) : (
                      <Link to={`/assessment/${assessment.id}`}>
                        <Button className="w-full cosmic-gradient">
                          {isCompleted ? 'Retake Assessment' : 'Start Assessment'}
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
