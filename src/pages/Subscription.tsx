import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Crown, X } from 'lucide-react';
import { db } from '@/db/api';
import { toast } from 'sonner';
import type { SubscriptionTier } from '@/types/types';

interface TierFeature {
  name: string;
  included: boolean;
}

interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: string;
  description: string;
  icon: typeof Sparkles;
  color: string;
  features: TierFeature[];
}

const plans: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: '$0',
    description: 'Start your journey of self-discovery',
    icon: Sparkles,
    color: 'text-gray-500',
    features: [
      { name: 'Basic NewMe chat', included: true },
      { name: '3 assessments per month', included: true },
      { name: 'Daily divination', included: true },
      { name: 'Community access', included: true },
      { name: 'Advanced AI insights', included: false },
      { name: 'Unlimited assessments', included: false },
      { name: 'Priority support', included: false },
      { name: 'Exclusive content', included: false },
    ],
  },
  {
    tier: 'discovery',
    name: 'Discovery',
    price: '$9.99',
    description: 'Deepen your self-awareness',
    icon: Zap,
    color: 'text-blue-500',
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Advanced AI insights', included: true },
      { name: '10 assessments per month', included: true },
      { name: 'Detailed personality analysis', included: true },
      { name: 'Memory pattern detection', included: true },
      { name: 'Unlimited assessments', included: false },
      { name: 'Priority support', included: false },
      { name: 'Exclusive content', included: false },
    ],
  },
  {
    tier: 'growth',
    name: 'Growth',
    price: '$19.99',
    description: 'Accelerate your personal growth',
    icon: Sparkles,
    color: 'text-purple-500',
    features: [
      { name: 'Everything in Discovery', included: true },
      { name: 'Unlimited assessments', included: true },
      { name: 'Advanced memory clustering', included: true },
      { name: 'Couple challenge access', included: true },
      { name: 'Priority AI responses', included: true },
      { name: 'Weekly insights report', included: true },
      { name: 'Priority support', included: false },
      { name: 'Exclusive content', included: false },
    ],
  },
  {
    tier: 'transformation',
    name: 'Transformation',
    price: '$39.99',
    description: 'Complete transformation toolkit',
    icon: Crown,
    color: 'text-yellow-500',
    features: [
      { name: 'Everything in Growth', included: true },
      { name: 'Priority support', included: true },
      { name: 'Exclusive content', included: true },
      { name: '1-on-1 coaching sessions', included: true },
      { name: 'Custom AI personality model', included: true },
      { name: 'Advanced analytics dashboard', included: true },
      { name: 'Early access to new features', included: true },
      { name: 'Lifetime memory archive', included: true },
    ],
  },
];

export default function Subscription() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleStartTrial = async (tier: SubscriptionTier) => {
    if (!profile) {
      toast.error('Please sign in to start a trial');
      return;
    }

    if (tier === 'free') {
      toast.info('You are already on the free plan');
      return;
    }

    setLoading(tier);
    try {
      await db.subscriptions.startTrial(profile.id, tier);
      toast.success(`Started 7-day free trial for ${tier} plan!`);
      window.location.reload();
    } catch (error) {
      console.error('Error starting trial:', error);
      toast.error('Failed to start trial');
    } finally {
      setLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!profile) return;

    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      await db.subscriptions.cancelSubscription(profile.id);
      toast.success('Subscription canceled successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const isCurrentPlan = (tier: SubscriptionTier) => {
    return profile?.subscription_tier === tier;
  };

  const getTrialDaysRemaining = () => {
    if (!profile?.trial_end_date) return 0;
    const trialEnd = new Date(profile.trial_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  };

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      <div className="relative container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Choose Your Path</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the plan that best fits your journey of self-discovery and personal growth
          </p>
          
          {profile && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Current Plan: {profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)}
              </Badge>
              {profile.subscription_status === 'trial' && (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Trial: {getTrialDaysRemaining()} days remaining
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = isCurrentPlan(plan.tier);
            
            return (
              <Card
                key={plan.tier}
                className={`relative ${
                  isCurrent ? 'border-primary shadow-lg' : ''
                } ${plan.tier === 'growth' ? 'md:scale-105 z-10' : ''}`}
              >
                {plan.tier === 'growth' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-8 h-8 ${plan.color}`} />
                    {isCurrent && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.tier !== 'free' && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? '' : 'text-muted-foreground'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  {isCurrent ? (
                    <>
                      {profile?.subscription_status === 'trial' ? (
                        <Button className="w-full" disabled>
                          Trial Active
                        </Button>
                      ) : plan.tier === 'free' ? (
                        <Button className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleCancelSubscription}
                        >
                          Cancel Subscription
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleStartTrial(plan.tier)}
                      disabled={loading === plan.tier || plan.tier === 'free'}
                    >
                      {loading === plan.tier
                        ? 'Starting...'
                        : plan.tier === 'free'
                        ? 'Free Forever'
                        : 'Start 7-Day Trial'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens after the trial?</h3>
              <p className="text-muted-foreground">
                After your 7-day trial ends, you'll be automatically subscribed to the plan you chose. You can cancel before the trial ends to avoid charges.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I upgrade or downgrade?</h3>
              <p className="text-muted-foreground">
                Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is my data secure?</h3>
              <p className="text-muted-foreground">
                Absolutely. We use industry-standard encryption and security practices to protect your personal information and conversations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
