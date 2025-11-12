import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithSSO({
        domain: 'miaoda-gg.com',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error('SSO login failed:', error);
        toast.error('Login failed. Please try again.');
        return;
      }

      if (data?.url) {
        window.open(data.url, '_self');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      
      
      <div className="relative z-10 w-full max-w-md">
        <Card className="glass-card border-2 border-primary/20 cosmic-glow">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-32 h-32 flex items-center justify-center animate-float">
              <img 
                src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7cvlvulsgrnk/conv-7fi4fbzoge80/20251112/file-7i2qocv7vev4.png" 
                alt="Newomen Icon" 
                className="w-full h-full object-contain"
              />
            </div>
            <CardTitle className="text-4xl font-bold gradient-text">
              Welcome to Newomen
            </CardTitle>
            <CardDescription className="text-lg">
              Your journey of self-discovery begins here
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-12 text-lg cosmic-gradient hover:opacity-90 transition-opacity"
                size="lg"
              >
                {loading ? 'Connecting...' : 'Continue with Google'}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                By continuing, you agree to our Terms of Service
                <br />
                and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            NewMe is waiting to meet you ✨
          </p>
        </div>
      </div>
    </div>
  );
}
