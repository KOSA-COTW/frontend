// 관리자 관련 라우트
export const adminRoutes = [
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/admin/AdminPageView.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/board',
    name: 'adminBoard',
    component: () => import('@/views/admin/board/AdminBoardView.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/board/posts',
    name: 'adminBoardPosts',
    component: () => import('@/views/admin/board/PostListView.vue'),
    meta: { requiresAdmin: true }
  }
]