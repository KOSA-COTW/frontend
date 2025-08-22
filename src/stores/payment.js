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
    if (amount >= 1000) {
      donationAmount.value = amount;
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
      throw err
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

  // 내 결제 내역 조회 (필터링 및 페이지네이션 지원)
  const getMyPayments = async (params = {}) => {
    try {
      const response = await paymentAPI.getMyPayments(params)
      return response
    } catch (err) {
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
    getMyPayments,
  }
}, { persist: true })
