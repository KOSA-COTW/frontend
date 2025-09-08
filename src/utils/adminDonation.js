import axios from '@/utils/axios'

// 관리자 기부 대시보드 통계
export const getDashboardStats = () =>
  axios.get('/api/admin/donations/dashboard')

// 상위 기부자
export const getTopDonors = () =>
  axios.get('/api/admin/donations/top-donors')

// 전체 기부 내역
export const getDonations = (page = 1, size = 10, search = '', status = '') =>
  axios.get('/api/admin/donations', {
    params: { page, size, search, status }
  })
