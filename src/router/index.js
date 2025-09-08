
import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '@/views/MainPage.vue'
import SignupView from '@/views/member/SignupView.vue'
import LoginView from '@/views/member/LoginView.vue'
import { useAuthStore } from '@/stores/auth'
import { boardRoutes } from './board.js'
import { adminRoutes } from './admin.js'
import { paymentRoutes } from './payment.js'
import VerifyEmailView from '@/views/auth/VerifyEmailView.vue'
import FindAccountView from '@/views/auth/FindAccountView.vue'
import RecoverAccount from '@/views/auth/RecoverAccount.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 일반 사용자 라우트
    {
      path: '/',
      name: 'home',
      component: MainPage,
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: VerifyEmailView
    },
    {
      path: '/find-account',
      name: 'find-account',
      component: FindAccountView
    },
    {
      path: '/recover-account',
      name: 'recover-account',
      component: RecoverAccount
    },
    {
      path: '/oauth2/success',
      name: 'oauthSuccess',
      component: () => import('@/views/auth/OAuth2SuccessView.vue')
    },
    {
      path: '/mypage',
      component: () => import('@/views/member/MyPageLayoutView.vue'),
      children: [
        { path: '', name: 'mypage.home', component: () => import('@/views/member/MyPageView.vue') },
        { path: 'edit', name: 'mypage.edit', component: () => import('@/views/member/MyProfileEditView.vue') },
        { path: 'donations', name: 'mypage.donations', component: () => import('@/views/payment/PaymentHistoryView.vue') },
        // { path: 'points', name: 'mypage.points', component: () => import('@/views/member/PointHistoryView.vue') },
      ]
    },
    // 특정 에러 타입별 라우트
    {
      path: '/error/:type',
      name: 'Error',
      component: () => import('@/views/error/ErrorPage.vue'),
      props: true
    },
    // 404 catch-all (마지막에 위치)
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/error/ErrorPage.vue'),
      props: { errorType: '404' }
    },

    // 게시판 관련 라우트
    ...boardRoutes,

    // 결제 관련 라우트
    ...paymentRoutes,

    // 관리자 라우트
    ...adminRoutes
  ],
    scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    // /about 으로 갈 때만 항상 맨 위로
    if (to.path === '/about') {
      return { top: 0 }
    }
    return {}
  }
})

// 네비게이션 가드 - 관리자 권한 체크
router.beforeEach((to, from, next) => {
  // requiresAdmin 메타 정보가 있는 경우 관리자 권한 체크
  if (to.meta.requiresAdmin) {
    const authStore = useAuthStore()

    if (!authStore.isLoggedIn) {
      // 로그인이 안되어 있으면 로그인 페이지로
      next('/login')
      return
    }

    if (!authStore.isAdmin) {
      // 관리자가 아니면 메인 페이지로
      next('/')
      return
    }
  }

  next()
})

export default router
