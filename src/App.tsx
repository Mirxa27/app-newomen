import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { RequireAuth } from '@/components/auth/RequireAuth';
import RequireAdmin from '@/components/auth/RequireAdmin';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import InstallPrompt from '@/components/common/InstallPrompt';
import OfflineIndicator from '@/components/common/OfflineIndicator';
import routes from './routes';
import NotFound from './pages/NotFound';
import Header from '@/components/common/Header';
import MobileNavBar from '@/components/common/MobileNavBar';

function App() {
  const publicRoutes = ['/', '/login', '/assessments', '/assessment/:id', '/assessment/:id/results', '/404'];

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <Toaster position="top-right" richColors />
            <OfflineIndicator />
            <InstallPrompt />
            <Header />
            <main className="min-h-[calc(100vh-4rem)] pb-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Routes>
                  {routes.map((route, index) => {
                    // Admin routes require admin role
                    if (route.path.startsWith('/admin')) {
                      return (
                        <Route
                          key={index}
                          path={route.path}
                          element={
                            <RequireAuth whiteList={[]}>
                              <RequireAdmin>{route.element}</RequireAdmin>
                            </RequireAuth>
                          }
                        />
                      );
                    }

                    // Public routes (whitelisted)
                    if (publicRoutes.includes(route.path)) {
                      return (
                        <Route
                          key={index}
                          path={route.path}
                          element={route.element}
                        />
                      );
                    }

                    // Protected routes
                    return (
                      <Route
                        key={index}
                        path={route.path}
                        element={
                          <RequireAuth whiteList={[]}>
                            {route.element}
                          </RequireAuth>
                        }
                      />
                    );
                  })}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </div>
            </main>
            <MobileNavBar />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
