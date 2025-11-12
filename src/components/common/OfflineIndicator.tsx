import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/usePWA';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>You are offline. Some features may be limited.</span>
      </div>
    </div>
  );
}
