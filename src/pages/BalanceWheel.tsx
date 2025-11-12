import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { db } from '@/db/api';
import type { BalanceWheelData } from '@/types/types';
import { toast } from 'sonner';
import { 
  Briefcase, 
  Heart, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Smile, 
  Home, 
  Users 
} from 'lucide-react';

const lifeAreas = [
  { key: 'career', label: 'Career', icon: Briefcase, color: 'hsl(var(--chart-1))' },
  { key: 'relationships', label: 'Relationships', icon: Heart, color: 'hsl(var(--chart-2))' },
  { key: 'health', label: 'Health', icon: Activity, color: 'hsl(var(--chart-3))' },
  { key: 'personal_growth', label: 'Personal Growth', icon: TrendingUp, color: 'hsl(var(--chart-4))' },
  { key: 'finances', label: 'Finances', icon: DollarSign, color: 'hsl(var(--chart-5))' },
  { key: 'fun_recreation', label: 'Fun & Recreation', icon: Smile, color: 'hsl(var(--chart-1))' },
  { key: 'physical_environment', label: 'Physical Environment', icon: Home, color: 'hsl(var(--chart-2))' },
  { key: 'contribution', label: 'Contribution', icon: Users, color: 'hsl(var(--chart-3))' },
] as const;

export default function BalanceWheel() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [scores, setScores] = useState<BalanceWheelData>({
    career: 5,
    relationships: 5,
    health: 5,
    personal_growth: 5,
    finances: 5,
    fun_recreation: 5,
    physical_environment: 5,
    contribution: 5,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.balance_wheel_data && Object.keys(profile.balance_wheel_data).length > 0) {
      const wheelData = profile.balance_wheel_data as Record<string, unknown>;
      const validatedData: BalanceWheelData = {
        career: typeof wheelData.career === 'number' ? wheelData.career : 5,
        relationships: typeof wheelData.relationships === 'number' ? wheelData.relationships : 5,
        health: typeof wheelData.health === 'number' ? wheelData.health : 5,
        personal_growth: typeof wheelData.personal_growth === 'number' ? wheelData.personal_growth : 5,
        finances: typeof wheelData.finances === 'number' ? wheelData.finances : 5,
        fun_recreation: typeof wheelData.fun_recreation === 'number' ? wheelData.fun_recreation : 5,
        physical_environment: typeof wheelData.physical_environment === 'number' ? wheelData.physical_environment : 5,
        contribution: typeof wheelData.contribution === 'number' ? wheelData.contribution : 5,
      };
      setScores(validatedData);
    }
  }, [profile]);

  const handleScoreChange = (key: keyof BalanceWheelData, value: number[]) => {
    setScores((prev) => ({ ...prev, [key]: value[0] }));
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      await db.profiles.updateBalanceWheel(profile.id, scores);
      await refreshProfile();
      toast.success('Balance Wheel saved successfully');
      
      if (!profile.onboarding_completed) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error saving balance wheel:', error);
      toast.error('Failed to save Balance Wheel');
    } finally {
      setSaving(false);
    }
  };

  const averageScore = Object.values(scores).reduce((a, b) => a + b, 0) / 8;

  return (
    <div className="min-h-screen relative">
      
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Balance Wheel</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Rate your satisfaction in each life area from 1 (lowest) to 10 (highest)
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            {lifeAreas.map((area) => {
              const Icon = area.icon;
              return (
                <Card key={area.key} className="glass-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: area.color, opacity: 0.2 }}
                      >
                        <Icon className="w-5 h-5" style={{ color: area.color }} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{area.label}</CardTitle>
                        <CardDescription>Score: {scores[area.key]}/10</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Slider
                      value={[scores[area.key]]}
                      onValueChange={(value) => handleScoreChange(area.key, value)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-6">
            <Card className="glass-card border-primary/30 cosmic-glow sticky top-8">
              <CardHeader>
                <CardTitle>Your Balance Wheel</CardTitle>
                <CardDescription>
                  Visual representation of your life balance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full aspect-square max-w-md mx-auto">
                  <svg viewBox="0 0 400 400" className="w-full h-full">
                    <circle
                      cx="200"
                      cy="200"
                      r="180"
                      fill="none"
                      stroke="hsl(var(--border))"
                      strokeWidth="1"
                    />
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                      <circle
                        key={level}
                        cx="200"
                        cy="200"
                        r={level * 18}
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth="0.5"
                        opacity="0.3"
                      />
                    ))}
                    
                    {lifeAreas.map((_, index) => {
                      const angle = (index * 45 - 90) * (Math.PI / 180);
                      const x2 = 200 + 180 * Math.cos(angle);
                      const y2 = 200 + 180 * Math.sin(angle);
                      return (
                        <line
                          key={index}
                          x1="200"
                          y1="200"
                          x2={x2}
                          y2={y2}
                          stroke="hsl(var(--border))"
                          strokeWidth="1"
                          opacity="0.3"
                        />
                      );
                    })}

                    <polygon
                      points={lifeAreas
                        .map((area, index) => {
                          const angle = (index * 45 - 90) * (Math.PI / 180);
                          const radius = scores[area.key] * 18;
                          const x = 200 + radius * Math.cos(angle);
                          const y = 200 + radius * Math.sin(angle);
                          return `${x},${y}`;
                        })
                        .join(' ')}
                      fill="hsl(var(--primary) / 0.3)"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                    />

                    {lifeAreas.map((area, index) => {
                      const angle = (index * 45 - 90) * (Math.PI / 180);
                      const radius = scores[area.key] * 18;
                      const x = 200 + radius * Math.cos(angle);
                      const y = 200 + radius * Math.sin(angle);
                      return (
                        <circle
                          key={area.key}
                          cx={x}
                          cy={y}
                          r="6"
                          fill={area.color}
                          stroke="white"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="font-medium">Average Score</span>
                    <span className="text-2xl font-bold gradient-text">
                      {averageScore.toFixed(1)}/10
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {lifeAreas.map((area) => (
                      <div key={area.key} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: area.color }}
                        />
                        <span className="text-muted-foreground">{area.label}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full cosmic-gradient"
                    size="lg"
                  >
                    {saving ? 'Saving...' : 'Save Balance Wheel'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
