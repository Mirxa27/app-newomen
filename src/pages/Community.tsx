import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { CosmicBackground } from '@/components/cosmic/CosmicBackground';
import { Heart, MessageCircle, Send, Users, Calendar } from 'lucide-react';
import { db } from '@/db/api';
import type { CommunityPostWithProfile } from '@/types/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function Community() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPostWithProfile[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await db.communityPosts.list();
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !profile || posting) return;

    try {
      setPosting(true);
      const post = await db.communityPosts.create({
        user_id: profile.id,
        content: newPost.trim(),
        post_type: 'text',
        images: [],
        poll_options: [],
        poll_votes: {},
      });

      const postWithProfile = await db.communityPosts.getById(post.id);
      if (postWithProfile) {
        setPosts((prev) => [postWithProfile, ...prev]);
      }
      setNewPost('');
      toast.success('Post created successfully');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!profile) {
      toast.error('Please sign in to like posts');
      return;
    }

    try {
      const isLiked = await db.postLikes.toggle(profile.id, postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likes_count: p.likes_count + (isLiked ? 1 : -1) }
            : p
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Community</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect with others on their self-discovery journey
          </p>
        </div>

        {profile && (
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle>Share with the community</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind? Share your thoughts, insights, or questions..."
                className="min-h-[100px]"
              />
              <Button
                onClick={handleCreatePost}
                disabled={!newPost.trim() || posting}
                className="cosmic-gradient"
              >
                <Send className="w-4 h-4 mr-2" />
                {posting ? 'Posting...' : 'Post'}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No posts yet. Be the first to share something!
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="glass-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.profile.avatar_url || undefined} />
                      <AvatarFallback>
                        {post.profile.nickname?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{post.profile.nickname || 'Anonymous'}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="whitespace-pre-wrap">{post.content}</p>
                  
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {post.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Post image ${idx + 1}`}
                          className="rounded-lg w-full h-48 object-cover"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className="gap-2"
                    >
                      <Heart className="w-4 h-4" />
                      <span>{post.likes_count}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments_count}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
