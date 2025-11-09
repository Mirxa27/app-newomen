import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CosmicBackground } from '@/components/cosmic/CosmicBackground';
import { Heart, Copy, Check } from 'lucide-react';
import { db } from '@/db/api';
import { toast } from 'sonner';

export default function CoupleChallenge() {
  const { profile } = useAuth();
  const [sessionCode, setSessionCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreateSession = async () => {
    if (!profile || creating) return;

    try {
      setCreating(true);
      const session = await db.coupleSessions.create(profile.id);
      setCreatedCode(session.session_code);
      toast.success('Session created! Share the code with your partner');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSession = async () => {
    if (!sessionCode.trim()) {
      toast.error('Please enter a session code');
      return;
    }

    try {
      const session = await db.coupleSessions.getByCode(sessionCode.toUpperCase());
      if (!session) {
        toast.error('Invalid session code');
        return;
      }

      if (session.status === 'expired') {
        toast.error('This session has expired');
        return;
      }

      toast.info('Session joining feature coming soon!');
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session');
    }
  };

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-primary animate-float" />
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Couple Challenge</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Test your compatibility and receive AI-powered relationship insights
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card className="glass-card border-primary/30">
            <CardHeader>
              <CardTitle>Create a Session</CardTitle>
              <CardDescription>
                Start a new compatibility challenge and invite your partner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!createdCode ? (
                <Button
                  onClick={handleCreateSession}
                  disabled={creating || !profile}
                  className="w-full cosmic-gradient"
                  size="lg"
                >
                  {creating ? 'Creating...' : 'Create New Session'}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-6 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-2">Your Session Code</p>
                    <p className="text-3xl font-bold gradient-text tracking-wider">
                      {createdCode}
                    </p>
                  </div>
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    className="w-full"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Share this code with your partner. The session expires in 24 hours.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-secondary/30">
            <CardHeader>
              <CardTitle>Join a Session</CardTitle>
              <CardDescription>
                Enter the code your partner shared with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-code">Session Code</Label>
                <Input
                  id="session-code"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="text-center text-2xl tracking-wider"
                />
              </div>
              <Button
                onClick={handleJoinSession}
                disabled={!sessionCode.trim()}
                className="w-full cosmic-gradient"
                size="lg"
              >
                Join Session
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card mt-8">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Create Session</h3>
                <p className="text-sm text-muted-foreground">
                  One partner creates a session and receives a unique code
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-secondary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Answer Questions</h3>
                <p className="text-sm text-muted-foreground">
                  Both partners answer NewMe's guided compatibility questions
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-accent">3</span>
                </div>
                <h3 className="font-semibold mb-2">Get Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Receive AI-generated compatibility score and relationship insights
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
