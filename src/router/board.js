// 게시판 관련 라우트
export const boardRoutes = [
  {
    path: '/posts/create',
    name: 'createPost',
    component: () => import('@/views/board/PostCreateView.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'USER'] }
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
    meta: { requiresAuth: true, roles: ['ADMIN', 'USER'] }
  },
  {
    path: '/posts',
    name: 'postList',
    component: () => import('@/views/board/PostListView.vue')
  },
  { path: '/notices',
    name: 'notices',
    component: () => import('@/views/board/NoticeListView.vue')
  },
  { path: '/notices/create',
    name: 'createNotice',
    component: () => import('@/views/board/NoticeCreateView.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] }
  },
  { path: '/about',  
    name: 'about', 
    component: () => import('@/views/board/AboutView.vue') 
  },
]
