import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '@/views/MainPage.vue'
import PostCreateView from '@/views/board/PostCreateView.vue'

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
  ],
})

export default router
