import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  FileText,
  Calendar,
  Activity,
  DollarSign,
  Brain,
  Zap,
  BarChart3,
  Clock,
  AlertCircle
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
  aiUsage: {
    totalInteractions: number;
    successfulInteractions: number;
    failedInteractions: number;
    totalTokens: number;
    avgResponseTime: number;
    totalCost: number;
  };
  revenue: {
    totalRevenue: number;
    activeSubscriptions: number;
    monthlyRecurringRevenue: number;
    freeUsers: number;
    paidUsers: number;
  };
  providerPerformance: Array<{
    providerName: string;
    totalCalls: number;
    successRate: number;
    avgResponseTime: number;
    totalTokens: number;
    errorRate: number;
  }>;
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
    aiUsage: {
      totalInteractions: 0,
      successfulInteractions: 0,
      failedInteractions: 0,
      totalTokens: 0,
      avgResponseTime: 0,
      totalCost: 0,
    },
    revenue: {
      totalRevenue: 0,
      activeSubscriptions: 0,
      monthlyRecurringRevenue: 0,
      freeUsers: 0,
      paidUsers: 0,
    },
    providerPerformance: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [users, assessments, userAssessments, posts, events, aiStats, subscriptions] = await Promise.all([
        db.profiles.listAll(),
        db.assessments.list(),
        db.userAssessments.listAll(),
        db.communityPosts.list(1, 1000),
        db.communityEvents.list(),
        db.aiMgmtInteractionLogs.getStats(),
        db.subscriptionHistory.listAll(),
      ]);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const newUsersThisWeek = users.filter(
        (user) => new Date(user.created_at) >= oneWeekAgo
      ).length;

      // Count conversations (sample-based estimation for performance)
      let totalConversations = 0;
      try {
        const sampleSize = Math.min(10, users.length);
        for (const user of users.slice(0, sampleSize)) {
          const conversations = await db.conversations.list(user.id, 1);
          totalConversations += conversations.length;
        }
        // Estimate total based on sample
        if (users.length > sampleSize) {
          totalConversations = Math.round((totalConversations / sampleSize) * users.length);
        }
      } catch (error) {
        console.error('Error counting conversations:', error);
        // Continue with 0 if counting fails
      }

      // Calculate revenue metrics
      const activeSubscriptions = subscriptions.filter(
        (sub) => sub.status === 'active' || sub.status === 'trial'
      );
      const paidUsers = users.filter(
        (u) => u.subscription_tier !== 'free' && u.subscription_status === 'active'
      );
      
      // Calculate MRR (Monthly Recurring Revenue)
      // Assuming average subscription prices: Discovery $9.99, Growth $19.99, Transformation $29.99
      const tierPrices: Record<string, number> = {
        discovery: 9.99,
        growth: 19.99,
        transformation: 29.99,
      };
      
      const monthlyRecurringRevenue = paidUsers.reduce((sum, user) => {
        const price = tierPrices[user.subscription_tier as keyof typeof tierPrices] || 0;
        return sum + price;
      }, 0);

      // Calculate total revenue from subscription history
      const totalRevenue = subscriptions
        .filter((sub) => sub.status === 'active' && sub.amount_paid)
        .reduce((sum, sub) => sum + (sub.amount_paid || 0), 0);

      // Calculate AI usage costs (rough estimate: $0.01 per 1K tokens for GPT-4, $0.001 for GPT-3.5)
      // Using average of $0.005 per 1K tokens
      const estimatedCostPer1KTokens = 0.005;
      const totalCost = (aiStats.totalTokens / 1000) * estimatedCostPer1KTokens;

      // Get provider performance data
      const interactionLogs = await db.aiMgmtInteractionLogs.list(1000, 0);
      const providerMap = new Map<string, {
        totalCalls: number;
        successfulCalls: number;
        failedCalls: number;
        totalResponseTime: number;
        totalTokens: number;
      }>();

      interactionLogs.forEach((log) => {
        const providerName = (log.provider as any)?.name || 'Unknown';
        const existing = providerMap.get(providerName) || {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          totalResponseTime: 0,
          totalTokens: 0,
        };

        existing.totalCalls++;
        if (log.status === 'success') {
          existing.successfulCalls++;
        } else {
          existing.failedCalls++;
        }
        existing.totalResponseTime += log.response_time_ms || 0;
        existing.totalTokens += log.tokens_used || 0;

        providerMap.set(providerName, existing);
      });

      const providerPerformance = Array.from(providerMap.entries()).map(([name, data]) => ({
        providerName: name,
        totalCalls: data.totalCalls,
        successRate: data.totalCalls > 0 ? (data.successfulCalls / data.totalCalls) * 100 : 0,
        avgResponseTime: data.totalCalls > 0 ? Math.round(data.totalResponseTime / data.totalCalls) : 0,
        totalTokens: data.totalTokens,
        errorRate: data.totalCalls > 0 ? (data.failedCalls / data.totalCalls) * 100 : 0,
      }));

      setAnalytics({
        totalUsers: users.length,
        newUsersThisWeek,
        totalConversations,
        totalAssessments: assessments.length,
        completedAssessments: userAssessments.length,
        totalPosts: posts.length,
        totalEvents: events.length,
        activeUsers: users.filter((u) => u.onboarding_completed).length,
        aiUsage: {
          totalInteractions: aiStats.total,
          successfulInteractions: aiStats.success,
          failedInteractions: aiStats.error,
          totalTokens: aiStats.totalTokens,
          avgResponseTime: aiStats.avgResponseTime,
          totalCost: totalCost,
        },
        revenue: {
          totalRevenue,
          activeSubscriptions: activeSubscriptions.length,
          monthlyRecurringRevenue,
          freeUsers: users.length - paidUsers.length,
          paidUsers: paidUsers.length,
        },
        providerPerformance,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const overviewMetrics = [
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

  const aiMetrics = [
    {
      title: 'AI Interactions',
      value: analytics.aiUsage.totalInteractions.toLocaleString(),
      change: `${analytics.aiUsage.successfulInteractions} successful`,
      icon: Brain,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Total Tokens',
      value: analytics.aiUsage.totalTokens.toLocaleString(),
      change: `${(analytics.aiUsage.totalTokens / 1000000).toFixed(2)}M tokens`,
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Avg Response Time',
      value: `${analytics.aiUsage.avgResponseTime}ms`,
      change: 'Average latency',
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Success Rate',
      value: analytics.aiUsage.totalInteractions > 0
        ? `${Math.round((analytics.aiUsage.successfulInteractions / analytics.aiUsage.totalInteractions) * 100)}%`
        : '0%',
      change: `${analytics.aiUsage.failedInteractions} failed`,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Estimated Cost',
      value: `$${analytics.aiUsage.totalCost.toFixed(2)}`,
      change: 'AI API usage',
      icon: DollarSign,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Error Rate',
      value: analytics.aiUsage.totalInteractions > 0
        ? `${Math.round((analytics.aiUsage.failedInteractions / analytics.aiUsage.totalInteractions) * 100)}%`
        : '0%',
      change: `${analytics.aiUsage.failedInteractions} errors`,
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const revenueMetrics = [
    {
      title: 'Monthly Recurring Revenue',
      value: `$${analytics.revenue.monthlyRecurringRevenue.toFixed(2)}`,
      change: 'MRR',
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Active Subscriptions',
      value: analytics.revenue.activeSubscriptions,
      change: `${analytics.revenue.paidUsers} paid users`,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Paid Users',
      value: analytics.revenue.paidUsers,
      change: `${analytics.revenue.freeUsers} free users`,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Conversion Rate',
      value: analytics.totalUsers > 0
        ? `${Math.round((analytics.revenue.paidUsers / analytics.totalUsers) * 100)}%`
        : '0%',
      change: 'Free to paid',
      icon: BarChart3,
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ai">AI Usage</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Overview Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {overviewMetrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <Card key={metric.title} className="glass-card">
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
                <Card className="glass-card">
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

                <Card className="glass-card">
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
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              {/* AI Usage Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiMetrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <Card key={metric.title} className="glass-card">
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

              {/* Provider Performance */}
              {analytics.providerPerformance.length > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Provider Performance</CardTitle>
                    <CardDescription>AI provider usage and reliability metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 text-sm font-medium">Provider</th>
                            <th className="text-right p-2 text-sm font-medium">Total Calls</th>
                            <th className="text-right p-2 text-sm font-medium">Success Rate</th>
                            <th className="text-right p-2 text-sm font-medium">Avg Response</th>
                            <th className="text-right p-2 text-sm font-medium">Total Tokens</th>
                            <th className="text-right p-2 text-sm font-medium">Error Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.providerPerformance.map((provider) => (
                            <tr key={provider.providerName} className="border-b">
                              <td className="p-2 font-medium">{provider.providerName}</td>
                              <td className="p-2 text-right">{provider.totalCalls.toLocaleString()}</td>
                              <td className="p-2 text-right text-green-500">
                                {provider.successRate.toFixed(1)}%
                              </td>
                              <td className="p-2 text-right">{provider.avgResponseTime}ms</td>
                              <td className="p-2 text-right">{provider.totalTokens.toLocaleString()}</td>
                              <td className="p-2 text-right text-red-500">
                                {provider.errorRate.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              {/* Revenue Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {revenueMetrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <Card key={metric.title} className="glass-card">
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

              {/* Revenue Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Subscription Breakdown</CardTitle>
                    <CardDescription>User subscription distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Paid Users</span>
                        <span className="font-medium text-green-500">{analytics.revenue.paidUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Free Users</span>
                        <span className="font-medium">{analytics.revenue.freeUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Active Subscriptions</span>
                        <span className="font-medium">{analytics.revenue.activeSubscriptions}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Conversion Rate</span>
                        <span className="font-medium">
                          {analytics.totalUsers > 0
                            ? `${Math.round((analytics.revenue.paidUsers / analytics.totalUsers) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Financial metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Monthly Recurring Revenue</span>
                        <span className="font-medium text-green-500">
                          ${analytics.revenue.monthlyRecurringRevenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Revenue</span>
                        <span className="font-medium">${analytics.revenue.totalRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">AI Costs</span>
                        <span className="font-medium text-red-500">
                          ${analytics.aiUsage.totalCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Net Profit Margin</span>
                        <span className="font-medium">
                          {analytics.revenue.monthlyRecurringRevenue > 0
                            ? `${Math.round(((analytics.revenue.monthlyRecurringRevenue - analytics.aiUsage.totalCost) / analytics.revenue.monthlyRecurringRevenue) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>AI Performance</CardTitle>
                    <CardDescription>Response time and reliability metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Average Response Time</span>
                        <span className="font-medium">{analytics.aiUsage.avgResponseTime}ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                        <span className="font-medium text-green-500">
                          {analytics.aiUsage.totalInteractions > 0
                            ? `${Math.round((analytics.aiUsage.successfulInteractions / analytics.aiUsage.totalInteractions) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Error Rate</span>
                        <span className="font-medium text-red-500">
                          {analytics.aiUsage.totalInteractions > 0
                            ? `${Math.round((analytics.aiUsage.failedInteractions / analytics.aiUsage.totalInteractions) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Interactions</span>
                        <span className="font-medium">{analytics.aiUsage.totalInteractions.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Token Usage</CardTitle>
                    <CardDescription>AI token consumption metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Tokens</span>
                        <span className="font-medium">{analytics.aiUsage.totalTokens.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tokens (Millions)</span>
                        <span className="font-medium">
                          {(analytics.aiUsage.totalTokens / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Avg Tokens per Request</span>
                        <span className="font-medium">
                          {analytics.aiUsage.totalInteractions > 0
                            ? Math.round(analytics.aiUsage.totalTokens / analytics.aiUsage.totalInteractions)
                            : 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Estimated Cost</span>
                        <span className="font-medium text-red-500">
                          ${analytics.aiUsage.totalCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Provider Performance Table */}
              {analytics.providerPerformance.length > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Provider Performance Details</CardTitle>
                    <CardDescription>Detailed metrics for each AI provider</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 text-sm font-medium">Provider</th>
                            <th className="text-right p-3 text-sm font-medium">Total Calls</th>
                            <th className="text-right p-3 text-sm font-medium">Success Rate</th>
                            <th className="text-right p-3 text-sm font-medium">Error Rate</th>
                            <th className="text-right p-3 text-sm font-medium">Avg Response Time</th>
                            <th className="text-right p-3 text-sm font-medium">Total Tokens</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.providerPerformance.map((provider) => (
                            <tr key={provider.providerName} className="border-b hover:bg-muted/50">
                              <td className="p-3 font-medium">{provider.providerName}</td>
                              <td className="p-3 text-right">{provider.totalCalls.toLocaleString()}</td>
                              <td className="p-3 text-right">
                                <span className="text-green-500 font-medium">
                                  {provider.successRate.toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <span className="text-red-500 font-medium">
                                  {provider.errorRate.toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-3 text-right">{provider.avgResponseTime}ms</td>
                              <td className="p-3 text-right">{provider.totalTokens.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
