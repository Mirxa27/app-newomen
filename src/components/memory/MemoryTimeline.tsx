import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Calendar, Tag, TrendingUp } from 'lucide-react';
import { db } from '@/db/api';
import type { NewMeMemory } from '@/types/types';

interface MemoryTimelineProps {
  userId: string;
  limit?: number;
}

interface GroupedMemories {
  [key: string]: NewMeMemory[];
}

export default function MemoryTimeline({ userId, limit }: MemoryTimelineProps) {
  const [memories, setMemories] = useState<NewMeMemory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, [userId]);

  const loadMemories = async () => {
    try {
      const data = await db.memories.list(userId);
      const sortedMemories = data.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setMemories(limit ? sortedMemories.slice(0, limit) : sortedMemories);
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupMemoriesByDate = (memories: NewMeMemory[]): GroupedMemories => {
    const grouped: GroupedMemories = {};
    
    memories.forEach((memory) => {
      const date = new Date(memory.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey: string;
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(memory);
    });
    
    return grouped;
  };

  const getMemoryTypeColor = (type?: string) => {
    if (!type) return 'bg-muted';
    
    const typeColors: { [key: string]: string } = {
      fact: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      emotion: 'bg-pink-500/20 text-pink-700 dark:text-pink-300',
      pattern: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
      confession: 'bg-red-500/20 text-red-700 dark:text-red-300',
    };
    
    return typeColors[type.toLowerCase()] || 'bg-muted';
  };

  const getImportanceIcon = (importance?: number) => {
    if (!importance) return null;
    
    if (importance >= 8) {
      return <TrendingUp className="w-4 h-4 text-red-500" />;
    } else if (importance >= 5) {
      return <TrendingUp className="w-4 h-4 text-yellow-500" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2 bg-muted" />
              <Skeleton className="h-4 w-full bg-muted" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Memories Yet</h3>
          <p className="text-muted-foreground">
            Start chatting with NewMe to create your first memory
          </p>
        </CardContent>
      </Card>
    );
  }

  const groupedMemories = groupMemoriesByDate(memories);

  return (
    <div className="space-y-6">
      {Object.entries(groupedMemories).map(([date, dateMemories]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">{date}</h3>
          </div>
          
          <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border">
            {dateMemories.map((memory) => (
              <div key={memory.id} className="relative pl-8">
                <div className="absolute left-0 top-2 w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-2">
                          {memory.memory_text}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(memory.created_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </CardDescription>
                      </div>
                      {getImportanceIcon(memory.importance_score)}
                    </div>
                  </CardHeader>
                  
                  {(memory.memory_type || memory.memory_themes) && (
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2">
                        {memory.memory_type && (
                          <Badge variant="secondary" className={getMemoryTypeColor(memory.memory_type)}>
                            {memory.memory_type}
                          </Badge>
                        )}
                        {memory.memory_themes && memory.memory_themes.length > 0 && (
                          <>
                            {memory.memory_themes.slice(0, 3).map((theme, index) => (
                              <Badge key={index} variant="outline" className="gap-1">
                                <Tag className="w-3 h-3" />
                                {theme}
                              </Badge>
                            ))}
                            {memory.memory_themes.length > 3 && (
                              <Badge variant="outline">
                                +{memory.memory_themes.length - 3} more
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
