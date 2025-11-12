import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  FileText,
  Calendar,
  Activity
} from 'lucide-react';
import { db } from '@/db/api';
import { toast } from 'sonner';

interface AnalyticsData {
  totalUsers: number;
  newUsersThisWeek: number;
  totalConversations: number;
  totalAssessments: number;
  completedAssessments: number;
  totalPosts: number;
  totalEvents: number;
  activeUsers: number;
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    newUsersThisWeek: 0,
    totalConversations: 0,
    totalAssessments: 0,
    completedAssessments: 0,
    totalPosts: 0,
    totalEvents: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [users, assessments, userAssessments, posts, events] = await Promise.all([
        db.profiles.listAll(),
        db.assessments.list(),
        db.userAssessments.listAll(),
        db.communityPosts.list(1, 1000),
        db.communityEvents.list(),
      ]);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const newUsersThisWeek = users.filter(
        (user) => new Date(user.created_at) >= oneWeekAgo
      ).length;

      setAnalytics({
        totalUsers: users.length,
        newUsersThisWeek,
        totalConversations: 0,
        totalAssessments: assessments.length,
        completedAssessments: userAssessments.length,
        totalPosts: posts.length,
        totalEvents: events.length,
        activeUsers: users.filter((u) => u.onboarding_completed).length,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    {
      title: 'Total Users',
      value: analytics.totalUsers,
      change: `+${analytics.newUsersThisWeek} this week`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Users',
      value: analytics.activeUsers,
      change: `${Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}% of total`,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Assessments',
      value: analytics.totalAssessments,
      change: `${analytics.completedAssessments} completed`,
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Community Posts',
      value: analytics.totalPosts,
      change: 'User-generated content',
      icon: MessageSquare,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      title: 'Events',
      value: analytics.totalEvents,
      change: 'Community events',
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Engagement Rate',
      value: analytics.totalUsers > 0 
        ? `${Math.round((analytics.completedAssessments / analytics.totalUsers) * 100)}%`
        : '0%',
      change: 'Assessment completion',
      icon: TrendingUp,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      <div className="relative container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Platform insights and key metrics
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg">Loading analytics...</div>
          </div>
        ) : (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <Card key={metric.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {metric.title}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                        <Icon className={`w-5 h-5 ${metric.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-1">
                        {metric.value}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {metric.change}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>User registration trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Users</span>
                      <span className="font-medium">{analytics.totalUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">New This Week</span>
                      <span className="font-medium text-green-500">
                        +{analytics.newUsersThisWeek}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Users</span>
                      <span className="font-medium">{analytics.activeUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Activation Rate</span>
                      <span className="font-medium">
                        {analytics.totalUsers > 0
                          ? `${Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Metrics</CardTitle>
                  <CardDescription>Platform content overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Assessments</span>
                      <span className="font-medium">{analytics.totalAssessments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Completed</span>
                      <span className="font-medium">{analytics.completedAssessments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Community Posts</span>
                      <span className="font-medium">{analytics.totalPosts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Events</span>
                      <span className="font-medium">{analytics.totalEvents}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
