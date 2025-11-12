import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Gem, Zap, Trophy, TrendingUp, Flame, Calendar } from 'lucide-react';
import { db } from '@/db/api';
import { supabase } from '@/db/supabase';
import { useToast } from '@/hooks/use-toast';
import type { UserStats, AchievementWithDetails, CrystalTransaction } from '@/types/types';
import * as LucideIcons from 'lucide-react';

export default function Gamification() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<AchievementWithDetails[]>([]);
  const [transactions, setTransactions] = useState<CrystalTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to view your progress.',
          variant: 'destructive',
        });
        return;
      }

      const [userStats, userAchievements, crystalTransactions] = await Promise.all([
        db.gamification.getUserStats(user.id),
        db.gamification.getUserAchievements(user.id),
        db.gamification.getCrystalTransactions(user.id, 20),
      ]);

      setStats(userStats);
      setAchievements(userAchievements);
      setTransactions(crystalTransactions);
    } catch (error) {
      console.error('Error loading gamification data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your progress data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getXPForNextLevel = (level: number) => {
    return Math.pow(level, 2) * 100;
  };

  const getXPProgress = () => {
    if (!stats) return 0;
    const currentLevelXP = Math.pow(stats.level - 1, 2) * 100;
    const nextLevelXP = getXPForNextLevel(stats.level);
    const xpInCurrentLevel = stats.xp - currentLevelXP;
    const xpNeededForLevel = nextLevelXP - currentLevelXP;
    return (xpInCurrentLevel / xpNeededForLevel) * 100;
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return Icon || LucideIcons.Star;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="cosmic-card max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Unable to load your progress data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedAchievements = achievements.filter((a) => a.completed);
  const inProgressAchievements = achievements.filter((a) => !a.completed);

  return (
    <div className="min-h-screen p-4 xl:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl xl:text-4xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Your Journey
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your progress, earn crystals, and unlock achievements
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="cosmic-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gem className="h-5 w-5 text-primary" />
                Crystals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.crystals.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground mt-1">Cosmic currency</p>
            </CardContent>
          </Card>

          <Card className="cosmic-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Level {stats.level}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{stats.xp.toLocaleString()} XP</div>
              <Progress value={getXPProgress()} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {getXPForNextLevel(stats.level) - stats.xp} XP to level {stats.level + 1}
              </p>
            </CardContent>
          </Card>

          <Card className="cosmic-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.streak_days} days</div>
              <p className="text-sm text-muted-foreground mt-1">Keep it going!</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="cosmic-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                  <p className="text-2xl font-bold">{stats.total_conversations}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="cosmic-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assessments</p>
                  <p className="text-2xl font-bold">{stats.total_assessments}</p>
                </div>
                <Trophy className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="cosmic-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Divinations</p>
                  <p className="text-2xl font-bold">{stats.total_divinations}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="achievements">
              Achievements ({completedAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="transactions">Crystal History</TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="mt-6 space-y-6">
            {completedAchievements.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Unlocked</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {completedAchievements.map((ua) => {
                    const Icon = getIconComponent(ua.achievement.icon);
                    return (
                      <Card key={ua.id} className="cosmic-card border-primary/50">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-primary/20">
                                <Icon className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{ua.achievement.name}</CardTitle>
                                <CardDescription>{ua.achievement.description}</CardDescription>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Gem className="h-3 w-3" />
                              {ua.achievement.crystal_reward}
                            </Badge>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {ua.achievement.xp_reward} XP
                            </Badge>
                            <span className="text-muted-foreground ml-auto">
                              {ua.completed_at && formatDate(ua.completed_at)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {inProgressAchievements.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">In Progress</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {inProgressAchievements.map((ua) => {
                    const Icon = getIconComponent(ua.achievement.icon);
                    const criteria = ua.achievement.criteria as { count?: number; days?: number };
                    const target = criteria.count || criteria.days || 1;
                    const progress = (ua.progress / target) * 100;

                    return (
                      <Card key={ua.id} className="cosmic-card">
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <Icon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base">{ua.achievement.name}</CardTitle>
                              <CardDescription>{ua.achievement.description}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">
                                {ua.progress} / {target}
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Gem className="h-3 w-3" />
                              {ua.achievement.crystal_reward}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {ua.achievement.xp_reward} XP
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {achievements.length === 0 && (
              <Card className="cosmic-card">
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Start your journey to unlock achievements!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            {transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="cosmic-card">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {transaction.source} • {formatDate(transaction.created_at)}
                          </p>
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : ''}
                          {transaction.amount}
                          <Gem className="inline h-4 w-4 ml-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="cosmic-card">
                <CardContent className="py-12 text-center">
                  <Gem className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No crystal transactions yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
