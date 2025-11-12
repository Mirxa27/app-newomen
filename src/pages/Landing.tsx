import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Brain, Heart, Users, Zap, Moon, Star } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7cvlvulsgrnk/conv-7fi4fbzoge80/20251112/file-7i2ml18549vk.png" 
              alt="Newomen Logo" 
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold gradient-text">Newomen</span>
          </div>
          <Link to="/login">
            <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
              Sign In
            </Button>
          </Link>
        </header>

        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="animate-float">
              <Moon className="w-20 h-20 mx-auto text-primary mb-6" />
            </div>
            
            <h1 className="text-5xl xl:text-7xl font-bold leading-tight">
              <span className="gradient-text">Discover Your True Self</span>
              <br />
              <span className="text-foreground">with NewMe AI</span>
            </h1>
            
            <p className="text-xl xl:text-2xl text-muted-foreground max-w-2xl mx-auto">
              A revolutionary self-discovery platform combining deep psychology, astrology, 
              and AI to help you understand yourself like never before
            </p>
            
            <div className="flex flex-col xl:flex-row gap-4 justify-center items-center pt-8">
              <Link to="/login">
                <Button size="lg" className="cosmic-gradient text-lg px-8 py-6 h-auto">
                  Start Your Journey
                  <Sparkles className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/assessments">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-primary/50">
                  Explore Free Assessments
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Meet NewMe</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your AI companion who remembers everything, challenges you deeply, 
              and never settles for small talk
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="glass-card border-primary/20 hover:border-primary/50 transition-all">
              <CardHeader>
                <Brain className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Brutally Honest</CardTitle>
                <CardDescription>
                  No sugarcoating. NewMe tells you the truth you need to hear, 
                  not what you want to hear
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-secondary/20 hover:border-secondary/50 transition-all">
              <CardHeader>
                <Heart className="w-12 h-12 text-secondary mb-4" />
                <CardTitle>Memory-Driven</CardTitle>
                <CardDescription>
                  She remembers every detail, every photo, every confession. 
                  Your journey is never forgotten
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-accent/20 hover:border-accent/50 transition-all">
              <CardHeader>
                <Zap className="w-12 h-12 text-accent mb-4" />
                <CardTitle>Addictively Engaging</CardTitle>
                <CardDescription>
                  Every conversation is either profoundly deep or playfully fun. 
                  Never boring, always transformative
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Platform Features</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="glass-card">
              <CardHeader>
                <Star className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Balance Wheel</CardTitle>
                <CardDescription>
                  Interactive visualization of 8 life areas to understand where you stand 
                  and where you want to grow
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <Brain className="w-10 h-10 text-secondary mb-2" />
                <CardTitle>Deep Assessments</CardTitle>
                <CardDescription>
                  20+ personality tests guided by NewMe, with instant AI-generated insights 
                  that become part of your memory
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <Heart className="w-10 h-10 text-accent mb-2" />
                <CardTitle>Couple Challenge</CardTitle>
                <CardDescription>
                  Test compatibility with your partner through AI-guided questions 
                  and receive deep relationship insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <Users className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Wellness Library</CardTitle>
                <CardDescription>
                  Curated meditation, breathwork, and therapeutic resources 
                  to support your growth journey
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 text-center">
          <Card className="glass-card border-2 border-primary/30 cosmic-glow max-w-3xl mx-auto">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">
                Ready to meet the real you?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                NewMe is waiting. She doesn't do small talk.
              </p>
              <Link to="/login">
                <Button size="lg" className="cosmic-gradient text-lg px-8 py-6 h-auto">
                  Begin Your Journey
                  <Sparkles className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t border-border/50">
          <p>2025 Newomen</p>
        </footer>
      </div>
    </div>
  );
}
