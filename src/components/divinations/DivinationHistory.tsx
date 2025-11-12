import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, Sparkles } from 'lucide-react';
import { db } from '@/db/api';
import { supabase } from '@/db/supabase';
import { useToast } from '@/hooks/use-toast';
import type { UserDivinationResponse } from '@/types/types';

export default function DivinationHistory() {
  const [responses, setResponses] = useState<UserDivinationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to view your history.',
          variant: 'destructive',
        });
        return;
      }

      const history = await db.divinations.getUserResponses(user.id, 50);
      setResponses(history);
    } catch (error) {
      console.error('Error loading history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your divination history.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (isLoading) {
    return (
      <Card className="cosmic-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (responses.length === 0) {
    return (
      <Card className="cosmic-card">
        <CardContent className="py-12 text-center space-y-4">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <p className="text-lg font-medium">No responses yet</p>
            <p className="text-muted-foreground">
              Start your journey by answering today's divination question
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {responses.map((response) => (
        <Card key={response.id} className="cosmic-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              {formatDate(response.created_at)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Your Response</p>
              <p className="text-sm leading-relaxed">{response.response_text}</p>
            </div>

            {response.ai_insight && (
              <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                <p className="text-sm font-medium text-primary mb-2">NewMe's Insight</p>
                <p className="text-sm leading-relaxed">{response.ai_insight}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
