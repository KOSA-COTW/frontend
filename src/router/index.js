
import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '@/views/MainPage.vue'
import SignupView from '@/views/member/SignupView.vue'
import LoginView from '@/views/member/LoginView.vue'
import MyPageView from '@/views/member/MyPageView.vue'
import { useAuthStore } from '@/stores/auth'
import { adminRoutes } from './admin.js'

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
      path: '/posts/create',
      name: 'createPost',
      component: () => import('@/views/board/PostCreateView.vue')
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
      path: '/mypage',
      name: 'mypage',
      component: MyPageView
    },
    {
      path: '/posts/:id',
      name: 'postDetail',
      component: () => import('@/views/board/PostDetailView.vue'),
      props: true,
    },
    {
      path: '/posts/:id/edit',
      name: 'postEdit',
      component: () => import('@/views/board/PostEditView.vue'),
      props: true
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

    // 관리자 라우트
    ...adminRoutes
  ],
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
