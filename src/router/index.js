
import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '@/views/MainPage.vue'
import PostCreateView from '@/views/board/PostCreateView.vue'
import SignupView from '@/views/member/SignupView.vue'
import LoginView from '@/views/member/LoginView.vue'
import MyPageView from '@/views/member/MyPageView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
      path: '/posts/list',
      name: 'postList',
      component: () => import('@/views/board/PostListView.vue')
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

  ],
})

export default router
