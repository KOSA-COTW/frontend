import api from './axios.js'

export const paymentAPI = {
  // 결제 생성
  createPayment: async (paymentData) => {
    const response = await api.post('/api/payments', paymentData)
    return response.data
  },

  // 결제 승인 확인
  confirmPayment: async (confirmData) => {
    const response = await api.post('/api/payments/confirm', confirmData)
    return response.data
  },

  // 내 결제 내역 조회
  getMyPayments: async () => {
    const response = await api.get('/api/payments/my')
    return response.data
  },

  // 특정 회원의 결제 내역 조회
  getPaymentsByMember: async (memberId) => {
    const response = await api.get(`/api/payments/member/${memberId}`)
    return response.data
  },

  // 특정 게시글의 결제 내역 조회
  getPaymentsByPost: async (postId) => {
    const response = await api.get(`/api/payments/post/${postId}`)
    return response.data
  },
}
