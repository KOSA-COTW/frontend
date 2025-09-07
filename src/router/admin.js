// 관리자 관련 라우트 (중첩: /admin + children)
export const adminRoutes = [
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'), // 좌측 메뉴 레이아웃
    meta: { requiresAdmin: true },
    children: [
      // 기본 진입(/admin)
      {
        path: '',
        name: 'admin',
        component: () => import('@/views/admin/AdminPageView.vue'),
        meta: { requiresAdmin: true }
      },

      // 회원/단체 관리
      {
        path: 'members',
        name: 'adminMemberInfo',
        component: () => import('@/views/admin/member/MemberInfoView.vue'),
        meta: { requiresAdmin: true }
      },

      // 기부/결제 관리
      {
        path: 'donations',
        name: 'adminDonationHistory',
        component: () => import('@/views/admin/payment/AdminDonationHistoryView.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'payments/status',
        name: 'adminPaymentStatus',
        component: () => import('@/views/admin/payment/AdminPaymentStatusView.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'payments/view',
        name: 'adminPaymentView',
        component: () => import('@/views/admin/payment/AdminPaymentView.vue'),
        meta: { requiresAdmin: true }
      },

      // 게시글 관리
      {
        path: 'board',
        name: 'adminBoard',
        component: () => import('@/views/admin/board/AdminBoardView.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'board/posts',
        name: 'adminBoardPosts',
        component: () => import('@/views/admin/board/PostListView.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'board/public_posts',
        name: 'adminBoardPublicPosts',
        component: () => import('@/views/admin/board/PublicPostListView.vue'),
        meta: { requiresAdmin: true }
      },

      // 댓글 관리
      {
        path: 'comments',
        name: 'adminComments',
        component: () => import('@/views/admin/comment/CommentListView.vue'),
        meta: { requiresAdmin: true }
      },

      // 기부/결제 상세
      {
        path: 'donations/:postId',
        name: 'adminDonations',
        component: () => import('@/views/admin/donation/AdminDonationView.vue'),
        meta: { requiresAdmin: true },
        props: true
      },

      // 통계/리포트
      {
        path: 'stats',
        name: 'adminStats',
        component: () => import('@/views/admin/statistics/AdminStatsView.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'stats/donation-top10',
        name: 'adminDonationTop10',
        component: () => import('@/views/admin/statistics/AdminDonationTop10View.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'stats/category-ranking',
        name: 'adminCategoryRanking',
        component: () => import('@/views/admin/statistics/AdminCategoryRankingView.vue'),
        meta: { requiresAdmin: true }
      }
    ]
  }
]
