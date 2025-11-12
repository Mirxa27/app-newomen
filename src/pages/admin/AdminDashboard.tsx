import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Sparkles, 
  TrendingUp, 
  MessageSquare,
  Heart,
  Calendar,
  Award,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { db } from '@/db/api';
import { toast } from 'sonner';

interface AdminStats {
  totalUsers: number;
  totalConversations: number;
  totalAssessments: number;
  totalPosts: number;
  totalEvents: number;
  totalAchievements: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalConversations: 0,
    totalAssessments: 0,
    totalPosts: 0,
    totalEvents: 0,
    totalAchievements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [users, assessments, posts, events] = await Promise.all([
        db.profiles.listAll(),
        db.assessments.list(),
        db.communityPosts.list(1, 1000),
        db.communityEvents.list(),
      ]);

      setStats({
        totalUsers: users.length,
        totalConversations: 0,
        totalAssessments: assessments.length,
        totalPosts: posts.length,
        totalEvents: events.length,
        totalAchievements: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      link: '/admin/users',
      color: 'text-blue-500',
    },
    {
      title: 'Conversations',
      value: stats.totalConversations,
      icon: MessageSquare,
      link: '/admin/conversations',
      color: 'text-green-500',
    },
    {
      title: 'Assessments',
      value: stats.totalAssessments,
      icon: FileText,
      link: '/admin/assessments',
      color: 'text-purple-500',
    },
    {
      title: 'Community Posts',
      value: stats.totalPosts,
      icon: Heart,
      link: '/admin/posts',
      color: 'text-pink-500',
    },
    {
      title: 'Events',
      value: stats.totalEvents,
      icon: Calendar,
      link: '/admin/events',
      color: 'text-orange-500',
    },
    {
      title: 'Achievements',
      value: stats.totalAchievements,
      icon: Award,
      link: '/admin/achievements',
      color: 'text-yellow-500',
    },
  ];

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: Users,
      link: '/admin/users',
    },
    {
      title: 'Assessment Builder',
      description: 'Create and edit assessments',
      icon: FileText,
      link: '/admin/assessments',
    },
    {
      title: 'Divination Manager',
      description: 'Manage daily divination questions',
      icon: Sparkles,
      link: '/admin/divinations',
    },
    {
      title: 'Subscription Management',
      description: 'Manage user subscriptions and billing',
      icon: DollarSign,
      link: '/admin/subscriptions',
    },
    {
      title: 'Analytics',
      description: 'View platform analytics and insights',
      icon: BarChart3,
      link: '/admin/analytics',
    },
    {
      title: 'Content Moderation',
      description: 'Review and moderate community content',
      icon: TrendingUp,
      link: '/admin/moderation',
    },
  ];

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      <div className="relative container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor the Newomen AI platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} to={stat.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {loading ? '...' : stat.value.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card key={action.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>{action.title}</CardTitle>
                    </div>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={action.link}>
                      <Button className="w-full">
                        Open
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
