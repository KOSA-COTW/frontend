import { defineStore } from 'pinia'
import { ref } from 'vue'
import { paymentAPI } from '@/utils/payment'

export const usePaymentStore = defineStore('payment', () => {
  const payments = ref([])
  const loading = ref(false)
  const error = ref(null)
  const donationAmount = ref(10000) // 기부금액 상태 추가

  // 기부금액 설정 액션 추가
  const setDonationAmount = (amount) => {
    console.log(`[PaymentStore] Setting amount to: ${amount}`);
    if (amount >= 1000) {
      donationAmount.value = amount;
      console.log(`[PaymentStore] donationAmount is now: ${donationAmount.value}`);
    } else {
      console.error('Donation amount must be at least 1000');
    }
  }

  // 내 결제 내역 조회
  const fetchMyPayments = async () => {
    loading.value = true
    error.value = null
    try {
      payments.value = await paymentAPI.getMyPayments()
    } catch (err) {
      error.value = err.response?.data?.message || '결제 내역을 불러오는데 실패했습니다.'
      console.error('Payment fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  // 결제 생성
  const createPayment = async (paymentData) => {
    loading.value = true
    error.value = null
    try {
      const response = await paymentAPI.createPayment(paymentData)
      return response
    } catch (err) {
      error.value = err.response?.data?.message || '결제 생성에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 결제 승인
  const confirmPayment = async (confirmData) => {
    loading.value = true
    error.value = null
    try {
      const response = await paymentAPI.confirmPayment(confirmData)
      return response
    } catch (err) {
      error.value = err.response?.data?.message || '결제 승인에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 내 결제 내역 조회 (필터링 및 페이지네이션 지원)
  const getMyPayments = async (params = {}) => {
    console.log('[PaymentStore] getMyPayments called with params:', params)
    
    // 인증 상태 확인
    const authData = localStorage.getItem('auth')
    console.log('[PaymentStore] Auth data exists:', !!authData)
    if (authData) {
      const parsed = JSON.parse(authData)
      console.log('[PaymentStore] Access token exists:', !!parsed.accessToken)
    }
    
    try {
      const response = await paymentAPI.getMyPayments(params)
      console.log('[PaymentStore] API call successful')
      return response
    } catch (err) {
      console.error('[PaymentStore] API call failed:', err)
      error.value = err.response?.data?.message || '결제 내역을 불러오는데 실패했습니다.'
      throw err
    }
  }

  return {
    payments,
    loading,
    error,
    donationAmount,
    setDonationAmount,
    fetchMyPayments,
    createPayment,
    confirmPayment,
    getMyPayments,
  }
}, { persist: true })
