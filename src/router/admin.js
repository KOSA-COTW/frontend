// 관리자 관련 라우트 (중첩: /admin + children)
export const adminRoutes = [
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'), // ✅ 좌측 메뉴 레이아웃
    meta: { requiresAdmin: true }, // 부모에도 두고,
    children: [
      // 기본 진입(/admin)
      {
        path: '',
        name: 'admin',
        component: () => import('@/views/admin/AdminPageView.vue'),
        meta: { requiresAdmin: true } // ✅ 자식에도 둬서 가드가 확실히 잡도록
      },

      // ✅ 회원/단체
      { path: 'members', name: 'adminMemberInfo', component: () => import('@/views/admin/member/MemberInfoView.vue'), meta: { requiresAdmin: true } },

      // ✅ 기부/결제 관리
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

      // ✅ 새 허브 뷰 (빠른메뉴 연결용)
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

      // 댓글 관리 (한 탭)
      {
        path: 'comments',
        name: 'adminComments',
        component: () => import('@/views/admin/comment/CommentListView.vue'),
        meta: { requiresAdmin: true }
      },

      // 기부/결제 상세 (옵션)
      {
        path: 'donations/:postId',
        name: 'adminDonations',
        component: () => import('@/views/admin/donation/AdminDonationView.vue'),
        meta: { requiresAdmin: true },
        props: true
      }
    ]
  }
]
