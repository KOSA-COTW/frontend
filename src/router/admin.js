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
        component: () => import('@/views/admin/payment/AdminpaymentView.vue'),
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
        path: 'board/pending_posts', // ✅ 비공개/승인 대기 게시글
        name: 'adminBoardPosts',
        component: () => import('@/views/admin/board/PendingPostListView.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'board/public_posts', // ✅ 전체(공개) 게시글
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

    ]
  }
]
