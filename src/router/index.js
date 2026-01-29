import { createRouter, createWebHistory } from 'vue-router';

// Import layouts
import AdminLayout from '../layouts/AdminLayout.jsx';
import ClientLayout from '../layouts/ClientLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import MobileUserLayout from '../layouts/MobileUserLayout.jsx';
import SuperAdminLayout from '../layouts/SuperAdminLayout.jsx';

const routes = [
  {
    path: '/',
    redirect: '/mobile/user/dashboard'
  },
  
  // Auth routes
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.jsx')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.jsx')
  },
  
  // User auth routes
  {
    path: '/user/login',
    name: 'UserLogin',
    component: () => import('../views/auth/UserLogin.jsx')
  },
  {
    path: '/user/register',
    name: 'UserRegister',
    component: () => import('../views/auth/UserRegister.jsx')
  },
  {
    path: '/user/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/auth/ForgotPassword.jsx')
  },
  {
    path: '/user/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/auth/ResetPassword.jsx')
  },
  {
    path: '/user/verify-otp',
    name: 'VerifyResetOTP',
    component: () => import('../views/auth/VerifyResetOTP.jsx')
  },
  
  // Client auth routes
  {
    path: '/client/login',
    name: 'ClientLogin',
    component: () => import('../views/auth/ClientLogin.jsx')
  },
  {
    path: '/client/register',
    name: 'ClientRegister',
    component: () => import('../views/auth/ClientRegister.jsx')
  },
  
  // Admin auth routes
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/auth/AdminLogin.jsx')
  },
  
  // Super Admin auth routes
  {
    path: '/super-admin/login',
    name: 'SuperAdminLogin',
    component: () => import('../views/auth/SuperAdminLogin.jsx')
  },
  
  // Partner routes
  {
    path: '/partner/login',
    name: 'PartnerLogin',
    component: () => import('../views/partner/PartnerLogin.jsx')
  },
  {
    path: '/partner/register',
    name: 'PartnerRegister',
    component: () => import('../views/partner/PartnerRegister.jsx')
  },
  {
    path: '/partner/dashboard',
    name: 'PartnerDashboard',
    component: () => import('../views/partner/PartnerDashboard.jsx')
  },
  
  // Mobile user routes
  {
    path: '/mobile/user',
    component: MobileUserLayout,
    children: [
      {
        path: 'dashboard',
        name: 'MobileUserDashboard',
        component: () => import('../views/mobile/MobileUserDashboard.jsx')
      },
      {
        path: 'profile',
        name: 'MobileUserProfile',
        component: () => import('../views/mobile/MobileUserProfile.jsx')
      },
      {
        path: 'register',
        name: 'MobileUserRegister',
        component: () => import('../views/mobile/MobileUserRegister.jsx')
      },
      {
        path: 'activities',
        name: 'MobileActivities',
        component: () => import('../views/mobile/SpiritualCheck-in/SpiritualActivities.jsx')
      },
      {
        path: 'spiritual-activities',
        name: 'SpiritualActivities',
        component: () => import('../views/mobile/SpiritualCheck-in/SpiritualActivities.jsx')
      },
      {
        path: 'spiritual-stats',
        name: 'SpiritualStats',
        component: () => import('../views/mobile/SpiritualStats.jsx')
      },
      {
        path: 'chat',
        name: 'MobileChatPage',
        component: () => import('../views/mobile/MobileChatPage.jsx')
      },
      {
        path: 'voice',
        name: 'MobileVoicePage',
        component: () => import('../views/mobile/MobileVoicePage.jsx')
      },
      {
        path: 'ask-bi',
        name: 'MobileAskBI',
        component: () => import('../views/mobile/MobileAskBI.jsx')
      },
      {
        path: 'brahm-avatar-reels',
        name: 'MobileBrahmAvatarReels',
        component: () => import('../views/mobile/MobileBrahmAvatarReels.jsx')
      },
      {
        path: 'brahm-avatar',
        name: 'MobileBrahmAvatar',
        component: () => import('../views/mobile/MobileBrahmAvatarReels.jsx')
      },
      {
        path: 'realtime-agent',
        name: 'RealTimeAgent',
        component: () => import('../views/mobile/RealTimeAgent.jsx')
      },
      {
        path: 'brahma-bazar',
        name: 'MobileBrahmaBazar',
        component: () => import('../views/mobile/MobileBrahmaBazar.jsx')
      },
      {
        path: 'rewards',
        name: 'MobileRewards',
        component: () => import('../views/mobile/MobileRewards.jsx')
      },
      {
        path: 'sadhana',
        name: 'MobileSadhana',
        component: () => import('../views/mobile/MobileSadhana.jsx')
      },
      {
        path: 'utility',
        name: 'MobileUtility',
        component: () => import('../views/mobile/MobileUtility.jsx')
      },
      {
        path: 'coming-soon',
        name: 'ComingSoon',
        component: () => import('../views/mobile/ComingSoon.jsx')
      },
      {
        path: 'meditate',
        name: 'MobileMeditate',
        component: () => import('../views/mobile/SpiritualCheck-in/MobileMeditate.jsx')
      },
      {
        path: 'pray',
        name: 'MobilePray',
        component: () => import('../views/mobile/SpiritualCheck-in/MobilePray.jsx')
      },
      {
        path: 'chant',
        name: 'MobileChant',
        component: () => import('../views/mobile/SpiritualCheck-in/MobileChant.jsx')
      },
      {
        path: 'silence',
        name: 'MobileSilence',
        component: () => import('../views/mobile/SpiritualCheck-in/MobileSilence.jsx')
      }
    ]
  },
  

  
  // Client routes
  {
    path: '/client',
    component: ClientLayout,
    children: [
      {
        path: 'overview',
        name: 'ClientOverview',
        component: () => import('../views/client/Overview.jsx')
      },
      {
        path: 'spiritual-management',
        name: 'SpiritualManagement',
        component: () => import('../views/client/SpiritualManagement.jsx')
      },
      {
        path: 'spiritual-management/:category',
        name: 'SpiritualManagementCategory',
        component: () => import('../views/client/SpiritualManagement.jsx')
      },
      {
        path: 'spiritual-checkin',
        name: 'SpiritualCheckin',
        component: () => import('../views/client/SpiritualCheckin.jsx')
      },
      {
        path: 'users',
        name: 'ClientUsers',
        component: () => import('../views/client/Users.jsx')
      },
      {
        path: 'users/:id/kundali',
        name: 'ClientUserKundali',
        component: () => import('../views/client/UserKundali.jsx')
      },
      {
        path: 'profile',
        name: 'ClientProfile',
        component: () => import('../views/client/Profile.jsx')
      },
      {
        path: 'settings',
        name: 'ClientSettings',
        component: () => import('../views/client/Settings.jsx')
      },
      {
        path: 'payments',
        name: 'ClientPayments',
        component: () => import('../views/client/Payments.jsx')
      },
      {
        path: 'support',
        name: 'ClientSupport',
        component: () => import('../views/client/Support.jsx')
      },
      {
        path: 'health',
        name: 'ClientHealth',
        component: () => import('../views/client/Health.jsx')
      },
      {
        path: 'charts',
        name: 'ClientCharts',
        component: () => import('../views/client/Charts.jsx')
      },
      {
        path: 'kundali',
        name: 'ClientKundali',
        component: () => import('../views/client/Kundali.jsx')
      },
      {
        path: 'user-kundali',
        name: 'UserKundali',
        component: () => import('../views/client/UserKundali.jsx')
      },
      {
        path: 'services',
        name: 'ClientServices',
        component: () => import('../views/client/Services.jsx')
      },
      {
        path: 'ai-agents',
        name: 'ClientAIAgents',
        component: () => import('../views/client/AIAgents.jsx')
      },
      {
        path: 'avatar',
        name: 'ClientAvatar',
        component: () => import('../views/client/Avatar.jsx')
      },
      {
        path: 'expert-connect',
        name: 'ClientExpertConnect',
        component: () => import('../views/client/services/ExpertConnect.jsx')
      },
      {
        path: 'experts',
        name: 'ClientExperts',
        component: () => import('../views/client/services/ExpertManagement.jsx')
      },
      {
        path: 'expert-details/:id',
        name: 'ClientExpertDetails',
        component: () => import('../views/client/services/ExpertDetails.jsx')
      },
      {
        path: 'brahma-bazar',
        name: 'ClientBrahmaBazar',
        component: () => import('../views/client/services/BrahmaBazar.jsx')
      },
      {
        path: 'tools',
        name: 'ClientTools',
        component: () => import('../views/client/Tools.jsx')
      },
      // Client Tools
      {
        path: 'tools/brahm-avatar',
        name: 'BrahmAvatar',
        component: () => import('../views/client/tools/BrahmAvatar.jsx')
      },
      {
        path: 'tools/live-avatar',
        name: 'LiveAvatar',
        component: () => import('../views/client/tools/LiveAvatar.jsx')
      },
      {
        path: 'tools/branding',
        name: 'Branding',
        component: () => import('../views/client/tools/Branding.jsx')
      },
      {
        path: 'tools/founder-message',
        name: 'FounderMessage',
        component: () => import('../views/client/tools/FounderMessage.jsx')
      },
      {
        path: 'tools/testimonial',
        name: 'Testimonial',
        component: () => import('../views/client/tools/Testimonial.jsx')
      },
      {
        path: 'tools/sponsors',
        name: 'Sponsors',
        component: () => import('../views/client/tools/Sponsors.jsx')
      },
      {
        path: 'tools/rating',
        name: 'Rating',
        component: () => import('../views/client/tools/Rating.jsx')
      },
      {
        path: 'tools/survey',
        name: 'Survey',
        component: () => import('../views/client/tools/Survey.jsx')
      },
      {
        path: 'tools/tickets',
        name: 'Tickets',
        component: () => import('../views/client/tools/Tickets.jsx')
      },
      {
        path: 'tools/offers',
        name: 'Offers',
        component: () => import('../views/client/tools/Offers.jsx')
      },
      {
        path: 'tools/advertisement',
        name: 'Advertisement',
        component: () => import('../views/client/tools/Advertisement.jsx')
      },
      {
        path: 'tools/push-notification',
        name: 'PushNotification',
        component: () => import('../views/client/tools/PushNotification.jsx')
      },
      // Client Services
      {
        path: 'services/brahma-bazar',
        name: 'BrahmaBazar',
        component: () => import('../views/client/services/BrahmaBazar.jsx')
      },
      {
        path: 'services/expert-connect',
        name: 'ExpertConnect',
        component: () => import('../views/client/services/ExpertConnect.jsx')
      },
      {
        path: 'services/expert-management',
        name: 'ExpertManagement',
        component: () => import('../views/client/services/ExpertManagement.jsx')
      },
      {
        path: 'services/expert-details/:id',
        name: 'ExpertDetails',
        component: () => import('../views/client/services/ExpertDetails.jsx')
      },
      // Client Activity
      {
        path: 'activity',
        name: 'Activity',
        component: () => import('../views/client/activity/Activity.jsx')
      },
      {
        path: 'activity/meditation',
        name: 'Meditation',
        component: () => import('../views/client/activity/activityTools/Meditation.jsx')
      },
      {
        path: 'activity/chanting',
        name: 'Chanting',
        component: () => import('../views/client/activity/activityTools/Chanting.jsx')
      },
      {
        path: 'activity/prathana',
        name: 'Prathana',
        component: () => import('../views/client/activity/activityTools/Prathana.jsx')
      },
      {
        path: 'activity/silence',
        name: 'Silence',
        component: () => import('../views/client/activity/activityTools/Silence.jsx')
      },
      {
        path: 'activity/yoga',
        name: 'Yoga',
        component: () => import('../views/client/activity/activityTools/Yoga.jsx')
      },
      {
        path: 'activity/mindfulness',
        name: 'Mindfulness',
        component: () => import('../views/client/activity/activityTools/Mindfulness.jsx')
      },
      {
        path: 'activity/gratitude',
        name: 'Gratitude',
        component: () => import('../views/client/activity/activityTools/Gratitude.jsx')
      },
      {
        path: 'activity/self-reflection',
        name: 'SelfReflection',
        component: () => import('../views/client/activity/activityTools/SelfReflection.jsx')
      },
      {
        path: 'activity/soul-music',
        name: 'SoulMusic',
        component: () => import('../views/client/activity/activityTools/SoulMusic.jsx')
      },
      {
        path: 'activity/wisdom',
        name: 'Wisdom',
        component: () => import('../views/client/activity/activityTools/Wisdom.jsx')
      },
      {
        path: 'activity/prayanam',
        name: 'Prayanam',
        component: () => import('../views/client/activity/activityTools/Prayanam.jsx')
      }
    ]
  },
  
  // Admin routes
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: 'overview',
        name: 'AdminOverview',
        component: () => import('../views/admin/Overview.jsx')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/Users.jsx')
      },
      {
        path: 'clients',
        name: 'AdminClients',
        component: () => import('../views/admin/Clients.jsx')
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: () => import('../views/admin/Profile.jsx')
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('../views/admin/Settings.jsx')
      },
      {
        path: 'payments',
        name: 'AdminPayments',
        component: () => import('../views/admin/Payments.jsx')
      },
      {
        path: 'support',
        name: 'AdminSupport',
        component: () => import('../views/admin/Support.jsx')
      },
      {
        path: 'health',
        name: 'AdminHealth',
        component: () => import('../views/admin/Health.jsx')
      },
      {
        path: 'tools',
        name: 'AdminTools',
        component: () => import('../views/admin/Tools.jsx')
      },
      {
        path: 'ai-agents',
        name: 'AdminAIAgents',
        component: () => import('../views/admin/AIAgents.jsx')
      },
      {
        path: 'credits',
        name: 'AdminCredits',
        component: () => import('../views/admin/Credits.jsx')
      }
    ]
  },
  
  // Super Admin routes
  {
    path: '/super-admin',
    component: SuperAdminLayout,
    children: [
      {
        path: 'overview',
        name: 'SuperAdminOverview',
        component: () => import('../views/super-admin/Overview.jsx')
      },
      {
        path: 'users',
        name: 'SuperAdminUsers',
        component: () => import('../views/super-admin/Users.jsx')
      },
      {
        path: 'admins',
        name: 'SuperAdminAdmins',
        component: () => import('../views/super-admin/Admins.jsx')
      },
      {
        path: 'pending-approvals',
        name: 'PendingApprovals',
        component: () => import('../views/super-admin/PendingApprovals.jsx')
      },
      {
        path: 'profile',
        name: 'SuperAdminProfile',
        component: () => import('../views/super-admin/Profile.jsx')
      }
    ]
  },
  
  // User routes
  {
    path: '/user',
    component: DashboardLayout,
    children: [
      {
        path: 'overview',
        name: 'UserOverview',
        component: () => import('../views/user/Overview.jsx')
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('../views/user/Profile.jsx')
      }
    ]
  },
  
  // Standalone pages
  {
    path: '/chat',
    name: 'ChatPage',
    component: () => import('../pages/ChatPage.jsx')
  },
  {
    path: '/voice',
    name: 'VoicePage',
    component: () => import('../pages/VoicePage.jsx')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../pages/Home.jsx')
  },
  
  // 404 route
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.jsx')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guards
router.beforeEach((to, from, next) => {
  // Add any global navigation logic here
  next();
});

export default router;