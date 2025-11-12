import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { RequireAuth } from '@/components/auth/RequireAuth';
import RequireAdmin from '@/components/auth/RequireAdmin';
import InstallPrompt from '@/components/common/InstallPrompt';
import OfflineIndicator from '@/components/common/OfflineIndicator';
import routes from './routes';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <RequireAuth whiteList={['/', '/login', '/assessments', '/404']}>
            <Toaster position="top-right" richColors />
            <OfflineIndicator />
            <InstallPrompt />
            <Routes>
              {routes.map((route, index) => {
                // Admin routes require admin role
                if (route.path.startsWith('/admin')) {
                  return (
                    <Route
                      key={index}
                      path={route.path}
                      element={<RequireAdmin>{route.element}</RequireAdmin>}
                    />
                  );
                }
                return <Route key={index} path={route.path} element={route.element} />;
              })}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </RequireAuth>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
