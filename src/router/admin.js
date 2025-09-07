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
    component: () => import('@/views/admin/board/PendingPostListView.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/board/public_posts',
    name: 'adminBoardPublicPosts',
    component: () => import('@/views/admin/board/PublicPostListView.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/comments',
    name: 'adminComments',
    component: () => import('@/views/admin/comment/CommentListView.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/donations/:postId',
    name: 'adminDonations',
    component: () => import('@/views/admin/donation/AdminDonationView.vue'),
    meta: { requiresAdmin: true },
    props: true
  },
  {
    path: '/admin/stats',
    name: 'adminStats',
    component: () => import('@/views/admin/statistics/AdminStatsView.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/stats/donation-top10',
    name: 'adminDonationTop10',
    component: () => import('@/views/admin/statistics/AdminDonationTop10View.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/stats/category-ranking',
    name: 'adminCategoryRanking',
    component: () => import('@/views/admin/statistics/AdminCategoryRankingView.vue'),
    meta: { requiresAdmin: true }
  }
]
