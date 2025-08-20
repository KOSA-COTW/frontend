// 결제 관련 라우트
export const paymentRoutes = [
  {
    path: '/payment/checkout/:postId',
    name: 'PaymentCheckout',
    component: () => import('@/views/payment/CheckoutView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/payment/success',
    name: 'PaymentSuccess',
    component: () => import('@/views/payment/SuccessView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/payment/fail',
    name: 'PaymentFail',
    component: () => import('@/views/payment/FailView.vue')
  },
  {
    path: '/my/payments',
    name: 'MyPayments',
    component: () => import('@/views/payment/MyPayments.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/payment/history',
    name: 'PaymentHistory',
    component: () => import('@/views/payment/PaymentHistoryView.vue'),
    meta: { requiresAuth: true }
  }
]