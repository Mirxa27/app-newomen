import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          {/* 404 Text */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold gradient-text mb-4">404</h1>
            <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
            <p className="text-lg text-muted-foreground mb-8">
              The page you're looking for doesn't exist or has been moved.
              Let's get you back on track.
            </p>
          </div>

          {/* Illustration */}
          <div className="mb-8 flex justify-center">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <div className="absolute inset-8 bg-primary/20 rounded-full animate-pulse delay-75" />
              <div className="absolute inset-16 bg-primary/30 rounded-full animate-pulse delay-150" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-24 h-24 text-primary/50" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              You might be looking for:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button asChild variant="ghost" size="sm">
                <Link to="/chat">AI Chat</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/assessments">Assessments</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/shadow-work">Shadow Work</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/community">Community</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-12 text-sm text-muted-foreground">
          2025 NewMe
        </p>
      </div>
    </div>
  );
}
