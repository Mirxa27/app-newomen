import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Flower2, Brain, Target } from 'lucide-react';
import DailyDivination from '@/components/divinations/DailyDivination';
import DivinationHistory from '@/components/divinations/DivinationHistory';
import DivinationGames from '@/components/divinations/DivinationGames';

export default function Divinations() {
  const [activeTab, setActiveTab] = useState('today');

  return (
    <div className="min-h-screen p-4 xl:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl xl:text-4xl font-bold flex items-center gap-3">
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7cvlvulsgrnk/conv-7fi4fbzoge80/20251112/file-7i2qocv7vev4.png" 
              alt="NewMe" 
              className="h-10 w-10 object-contain"
            />
            Daily Divinations
          </h1>
          <p className="text-muted-foreground text-lg">
            Deep questions, brutal honesty, and transformative insights. NewMe doesn't do small talk.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Today's Question</span>
              <span className="sm:hidden">Today</span>
            </TabsTrigger>
            <TabsTrigger value="games" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Therapy Games</span>
              <span className="sm:hidden">Games</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Your Journey</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-6">
            <DailyDivination />
          </TabsContent>

          <TabsContent value="games" className="mt-6">
            <DivinationGames />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <DivinationHistory />
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-8">
          <div className="cosmic-card p-6 space-y-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h3 className="font-semibold">Daily Divinations</h3>
            <p className="text-sm text-muted-foreground">
              One profound question each day to pierce through your defenses
            </p>
          </div>

          <div className="cosmic-card p-6 space-y-2">
            <Flower2 className="h-6 w-6 text-primary" />
            <h3 className="font-semibold">Olfactory Profiling</h3>
            <p className="text-sm text-muted-foreground">
              Discover your emotional landscape through scent associations
            </p>
          </div>

          <div className="cosmic-card p-6 space-y-2">
            <Brain className="h-6 w-6 text-primary" />
            <h3 className="font-semibold">Therapy Games</h3>
            <p className="text-sm text-muted-foreground">
              Playful exercises with serious therapeutic impact
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
