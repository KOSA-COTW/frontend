import api from './axios.js'

export const paymentAPI = {
  // 결제 생성
  createPayment: async (paymentData) => {
    console.log('Payment request data:', paymentData)
    console.log('Request headers will include:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth') || '{}').accessToken}`
    })
    const response = await api.post('/api/payments', paymentData)
    return response // axios 인터셉터가 이미 response.data를 반환
  },

  // 결제 승인 확인
  confirmPayment: async (confirmData) => {
    const response = await api.post('/api/payments/confirm', confirmData)
    return response // axios 인터셉터가 이미 response.data를 반환
  },

  // 내 결제 내역 조회 (필터링 및 페이지네이션 지원)
  getMyPayments: async (params = {}) => {
    console.log('[PaymentAPI] getMyPayments called with params:', params)
    
    const queryParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })
    
    const url = `/api/payments/my?${queryParams.toString()}`
    console.log('[PaymentAPI] Request URL:', url)
    
    try {
      const response = await api.get(url)
      console.log('[PaymentAPI] Raw axios response:', response)
      console.log('[PaymentAPI] Response data:', response.data)
      console.log('[PaymentAPI] Response data type:', typeof response.data)
      
      // axios 인터셉터가 이미 response.data를 반환하므로 response 자체가 데이터입니다
      return response
    } catch (error) {
      console.error('[PaymentAPI] Request failed:', error)
      throw error
    }
  },

  // 특정 회원의 결제 내역 조회
  getPaymentsByMember: async (memberId) => {
    const response = await api.get(`/api/payments/member/${memberId}`)
    return response // axios 인터셉터가 이미 response.data를 반환
  },

  // 특정 게시글의 결제 내역 조회
  getPaymentsByPost: async (postId) => {
    const response = await api.get(`/api/payments/post/${postId}`)
    return response // axios 인터셉터가 이미 response.data를 반환
  },
}
