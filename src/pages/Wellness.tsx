import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Wind, Mic, Brain, Music, Play } from 'lucide-react';
import { db } from '@/db/api';
import type { WellnessResourceWithFavorite } from '@/types/types';
import { toast } from 'sonner';

const categoryIcons = {
  meditation: Brain,
  breathwork: Wind,
  affirmation: Mic,
  therapy: Heart,
  music: Music,
};

export default function Wellness() {
  const { profile } = useAuth();
  const [resources, setResources] = useState<WellnessResourceWithFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadResources();
    
    // Track wellness page visit (Newme Brain)
    if (profile) {
      db.newmeBrain.trackBehavior(profile.id, 'wellness_visit', {});
    }
  }, [profile]);

  const loadResources = async () => {
    try {
      const data = await db.wellnessResources.listWithFavorites(profile?.id || null);
      setResources(data);
    } catch (error) {
      console.error('Error loading wellness resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (resourceId: string) => {
    if (!profile) {
      toast.error('Please sign in to favorite resources');
      return;
    }

    try {
      const isFavorited = await db.favorites.toggle(profile.id, resourceId);
      setResources((prev) =>
        prev.map((r) =>
          r.id === resourceId ? { ...r, is_favorited: isFavorited } : r
        )
      );
      toast.success(isFavorited ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const handlePlayResource = (resource: WellnessResourceWithFavorite) => {
    // Track resource play (Newme Brain)
    if (profile) {
      db.newmeBrain.trackBehavior(profile.id, 'wellness_resource_played', {
        resource_id: resource.id,
        resource_category: resource.category,
        resource_type: resource.resource_type,
      });
    }
    
    window.open(resource.resource_url, '_blank');
  };

  const filteredResources = resources.filter((resource) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'favorites') return resource.is_favorited;
    return resource.category === selectedCategory;
  });

  return (
    <div className="min-h-screen relative">
      
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Wellness Library</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Curated resources to support your growth journey
          </p>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="glass-card">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="meditation">Meditation</TabsTrigger>
            <TabsTrigger value="breathwork">Breathwork</TabsTrigger>
            <TabsTrigger value="affirmation">Affirmation</TabsTrigger>
            <TabsTrigger value="therapy">Therapy</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            {profile && <TabsTrigger value="favorites">Favorites</TabsTrigger>}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="glass-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32 bg-muted" />
                        <Skeleton className="h-4 w-20 bg-muted" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="w-full h-40 rounded-lg bg-muted" />
                  <Skeleton className="h-4 w-full bg-muted" />
                  <Skeleton className="h-4 w-3/4 bg-muted" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1 bg-muted" />
                    <Skeleton className="h-10 w-10 bg-muted" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {selectedCategory === 'favorites'
                  ? 'No favorites yet. Start exploring and save your favorite resources!'
                  : 'No resources found in this category'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {filteredResources.map((resource) => {
              const Icon = categoryIcons[resource.category];
              return (
                <Card
                  key={resource.id}
                  className="glass-card hover:border-primary/50 transition-all"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                          <Badge variant="outline" className="capitalize mt-1">
                            {resource.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resource.thumbnail_url && (
                      <img
                        src={resource.thumbnail_url}
                        alt={resource.title}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    )}
                    <CardDescription>{resource.description}</CardDescription>
                    {resource.duration_minutes && (
                      <p className="text-sm text-muted-foreground">
                        Duration: {resource.duration_minutes} minutes
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        className="flex-1 cosmic-gradient"
                        onClick={() => handlePlayResource(resource)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {resource.resource_type === 'youtube' ? 'Watch' : 'Listen'}
                      </Button>
                      {profile && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleFavorite(resource.id)}
                          className={resource.is_favorited ? 'text-primary' : ''}
                        >
                          <Heart
                            className="w-5 h-5"
                            fill={resource.is_favorited ? 'currentColor' : 'none'}
                          />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
