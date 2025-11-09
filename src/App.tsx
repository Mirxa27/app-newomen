import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { RequireAuth } from '@/components/auth/RequireAuth';
import routes from './routes';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <Router>
        <AuthProvider>
          <RequireAuth whiteList={['/', '/login', '/assessments', '/404']}>
            <Toaster position="top-right" richColors />
            <Routes>
              {routes.map((route, index) => (
                <Route key={index} path={route.path} element={route.element} />
              ))}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </RequireAuth>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
