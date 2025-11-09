import type { ReactNode } from 'react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import BalanceWheel from './pages/BalanceWheel';
import Assessments from './pages/Assessments';
import AssessmentTake from './pages/AssessmentTake';
import AssessmentResults from './pages/AssessmentResults';
import Wellness from './pages/Wellness';
import Community from './pages/Community';
import CoupleChallenge from './pages/CoupleChallenge';
import Profile from './pages/Profile';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Landing',
    path: '/',
    element: <Landing />,
    visible: false,
  },
  {
    name: 'Login',
    path: '/login',
    element: <Login />,
    visible: false,
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <Dashboard />,
    visible: true,
  },
  {
    name: 'Chat with NewMe',
    path: '/chat',
    element: <Chat />,
    visible: true,
  },
  {
    name: 'Balance Wheel',
    path: '/balance-wheel',
    element: <BalanceWheel />,
    visible: true,
  },
  {
    name: 'Assessments',
    path: '/assessments',
    element: <Assessments />,
    visible: true,
  },
  {
    name: 'Take Assessment',
    path: '/assessment/:id',
    element: <AssessmentTake />,
    visible: false,
  },
  {
    name: 'Assessment Results',
    path: '/assessment/:id/results',
    element: <AssessmentResults />,
    visible: false,
  },
  {
    name: 'Wellness',
    path: '/wellness',
    element: <Wellness />,
    visible: true,
  },
  {
    name: 'Community',
    path: '/community',
    element: <Community />,
    visible: true,
  },
  {
    name: 'Couple Challenge',
    path: '/couple-challenge',
    element: <CoupleChallenge />,
    visible: true,
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <Profile />,
    visible: true,
  },
];

export default routes;