import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: ReactNode;
  whiteList?: string[];
}

export function RequireAuth({ children, whiteList = [] }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isWhitelisted = whiteList.some((path) => {
    if (path.endsWith('/*')) {
      const basePath = path.slice(0, -2);
      return location.pathname.startsWith(basePath);
    }
    return location.pathname === path;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !isWhitelisted) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
