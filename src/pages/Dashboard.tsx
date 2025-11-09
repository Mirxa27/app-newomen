import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CosmicBackground } from '@/components/cosmic/CosmicBackground';
import { MessageSquare, Target, Brain, Heart, Users, TrendingUp } from 'lucide-react';
import { db } from '@/db/api';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    conversations: 0,
    assessments: 0,
    memories: 0,
  });

  useEffect(() => {
    if (profile) {
      Promise.all([
        db.conversations.list(profile.id),
        db.userAssessments.list(profile.id),
        db.memories.list(profile.id),
      ]).then(([conversations, assessments, memories]) => {
        setStats({
          conversations: conversations.length,
          assessments: assessments.length,
          memories: memories.length,
        });
      });
    }
  }, [profile]);

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{profile?.nickname || 'Explorer'}</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            {profile?.onboarding_completed 
              ? "Ready to continue your journey of self-discovery?" 
              : "Let's complete your onboarding to unlock the full experience"}
          </p>
        </div>

        {!profile?.onboarding_completed && (
          <Card className="glass-card border-primary/30 mb-8 cosmic-glow">
            <CardHeader>
              <CardTitle>Complete Your Onboarding</CardTitle>
              <CardDescription>
                Set up your profile and take the Balance Wheel assessment to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/onboarding">
                <Button className="cosmic-gradient">
                  Start Onboarding
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversations}</div>
              <p className="text-xs text-muted-foreground">
                Messages with NewMe
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessments</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assessments}</div>
              <p className="text-xs text-muted-foreground">
                Completed tests
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memories</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.memories}</div>
              <p className="text-xs text-muted-foreground">
                Stored by NewMe
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Link to="/chat">
            <Card className="glass-card border-primary/20 hover:border-primary/50 transition-all cursor-pointer h-full">
              <CardHeader>
                <MessageSquare className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Chat with NewMe</CardTitle>
                <CardDescription>
                  Continue your conversation with your AI companion who remembers everything
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/balance-wheel">
            <Card className="glass-card border-secondary/20 hover:border-secondary/50 transition-all cursor-pointer h-full">
              <CardHeader>
                <Target className="w-12 h-12 text-secondary mb-4" />
                <CardTitle>Balance Wheel</CardTitle>
                <CardDescription>
                  Visualize and track your life balance across 8 key areas
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/assessments">
            <Card className="glass-card border-accent/20 hover:border-accent/50 transition-all cursor-pointer h-full">
              <CardHeader>
                <Brain className="w-12 h-12 text-accent mb-4" />
                <CardTitle>Assessments</CardTitle>
                <CardDescription>
                  Take personality tests and receive AI-generated insights
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/wellness">
            <Card className="glass-card border-primary/20 hover:border-primary/50 transition-all cursor-pointer h-full">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Wellness Library</CardTitle>
                <CardDescription>
                  Access meditation, breathwork, and therapeutic resources
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/community">
            <Card className="glass-card border-secondary/20 hover:border-secondary/50 transition-all cursor-pointer h-full">
              <CardHeader>
                <Users className="w-12 h-12 text-secondary mb-4" />
                <CardTitle>Community</CardTitle>
                <CardDescription>
                  Connect with others on their self-discovery journey
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/couple-challenge">
            <Card className="glass-card border-accent/20 hover:border-accent/50 transition-all cursor-pointer h-full">
              <CardHeader>
                <Heart className="w-12 h-12 text-accent mb-4" />
                <CardTitle>Couple Challenge</CardTitle>
                <CardDescription>
                  Test compatibility and receive relationship insights
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
