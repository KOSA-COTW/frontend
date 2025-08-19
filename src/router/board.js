// 게시판 관련 라우트
export const boardRoutes = [
  {
    path: '/posts/create',
    name: 'createPost',
    component: () => import('@/views/board/PostCreateView.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'ORGANIZATION'] }
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
    props: true,
    meta: { requiresAuth: true, roles: ['ADMIN', 'ORGANIZATION'] }
  },
  {
    path: '/posts',
    name: 'postList',
    component: () => import('@/views/board/PostListView.vue')
  },
]
