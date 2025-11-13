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
import Divinations from './pages/Divinations';
import Gamification from './pages/Gamification';
import Subscription from './pages/Subscription';
import ShadowWork from './pages/ShadowWork';
import ShadowWorkJourney from './pages/ShadowWorkJourney';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AssessmentManagement from './pages/admin/AssessmentManagement';
import DivinationManagement from './pages/admin/DivinationManagement';
import SubscriptionManagement from './pages/admin/SubscriptionManagement';
import Analytics from './pages/admin/Analytics';
import ApiProviders from './pages/admin/ApiProviders';
import AiModels from './pages/admin/AiModels';
import AiVoices from './pages/admin/AiVoices';
import AiBehaviors from './pages/admin/AiBehaviors';
import PromptTemplates from './pages/admin/PromptTemplates';
import AiFunctionConfig from './pages/admin/AiFunctionConfig';
import SupervisorDashboard from './pages/admin/SupervisorDashboard';
import AiInteractionLogs from './pages/admin/AiInteractionLogs';

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
    name: 'Divinations',
    path: '/divinations',
    element: <Divinations />,
    visible: true,
  },
  {
    name: 'Progress',
    path: '/progress',
    element: <Gamification />,
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
  {
    name: 'Subscription',
    path: '/subscription',
    element: <Subscription />,
    visible: true,
  },
  {
    name: 'Shadow Work',
    path: '/shadow-work',
    element: <ShadowWork />,
    visible: true,
  },
  {
    name: 'Shadow Work Journey',
    path: '/shadow-work/:id',
    element: <ShadowWorkJourney />,
    visible: false,
  },
  {
    name: 'Admin Dashboard',
    path: '/admin',
    element: <AdminDashboard />,
    visible: false,
  },
  {
    name: 'User Management',
    path: '/admin/users',
    element: <UserManagement />,
    visible: false,
  },
  {
    name: 'Assessment Management',
    path: '/admin/assessments',
    element: <AssessmentManagement />,
    visible: false,
  },
  {
    name: 'Divination Management',
    path: '/admin/divinations',
    element: <DivinationManagement />,
    visible: false,
  },
  {
    name: 'Subscription Management',
    path: '/admin/subscriptions',
    element: <SubscriptionManagement />,
    visible: false,
  },
  {
    name: 'Analytics',
    path: '/admin/analytics',
    element: <Analytics />,
    visible: false,
  },
  {
    name: 'API Providers',
    path: '/admin/api-providers',
    element: <ApiProviders />,
    visible: false,
  },
  {
    name: 'AI Models',
    path: '/admin/ai-models',
    element: <AiModels />,
    visible: false,
  },
  {
    name: 'AI Voices',
    path: '/admin/ai-voices',
    element: <AiVoices />,
    visible: false,
  },
  {
    name: 'AI Behaviors',
    path: '/admin/ai-behaviors',
    element: <AiBehaviors />,
    visible: false,
  },
  {
    name: 'Prompt Templates',
    path: '/admin/prompt-templates',
    element: <PromptTemplates />,
    visible: false,
  },
  {
    name: 'AI Function Config',
    path: '/admin/ai-function-config',
    element: <AiFunctionConfig />,
    visible: false,
  },
  {
    name: 'Supervisor Dashboard',
    path: '/admin/supervisor',
    element: <SupervisorDashboard />,
    visible: false,
  },
  {
    name: 'AI Interaction Logs',
    path: '/admin/ai-logs',
    element: <AiInteractionLogs />,
    visible: false,
  },
];

export default routes;