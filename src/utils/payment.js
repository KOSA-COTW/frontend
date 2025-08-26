import api from './axios.js'

export const paymentAPI = {
  // 결제 생성
  createPayment: async (paymentData) => {
    const response = await api.post('/api/payments', paymentData)
    return response
  },

  // 내 결제 내역 조회 (필터링 및 페이지네이션 지원)
  getMyPayments: async (params = {}) => {
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })

    const url = `/api/payments/queries/my?${queryParams.toString()}`
    const response = await api.get(url)
    return response
  },

  // 특정 회원의 결제 내역 조회
  getPaymentsByMember: async (memberId) => {
    const response = await api.get(`/api/payments/queries/member/${memberId}`)
    return response
  },

  // 특정 게시글의 결제 내역 조회 (필터링 및 페이지네이션 지원)
  getPaymentsByPost: async (postId, params = {}) => {
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })

    const url = `/api/payments/queries/post/${postId}?${queryParams.toString()}`
    const response = await api.get(url)
    return response
  },
}
