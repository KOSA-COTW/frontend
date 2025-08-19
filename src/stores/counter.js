
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useCounterStore = defineStore('counter', () => {
  // 기존 카운터
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  // ===========================
  // 👇 기부 게시글 store 추가
  // ===========================
const donations = ref([])

  // 선택된 카테고리 (null이면 전체)
  const selectedCategory = ref(null)

  // 필터된 목록
  const filteredDonations = computed(() => {
    if (!selectedCategory.value) return donations.value
    return donations.value.filter(d => d.category === selectedCategory.value)
  })

  // 합계(전체/필터 반영)
  const totalDonationAll = computed(() =>
    donations.value.reduce((sum, d) => sum + d.raised, 0)
  )
  const totalDonationFiltered = computed(() =>
    filteredDonations.value.reduce((sum, d) => sum + d.raised, 0)
  )

  // 액션
  function setCategory(name) { selectedCategory.value = name }
  function clearCategory() { selectedCategory.value = null }

  // id로 상세 게시글 조회 (computed 반환)
  function getDonationById(id) {
    return computed(() => donations.value.find(item => item.id === Number(id)))
  }

// 메인용 6개: 공개 + 마감임박
async function fetchDonationsHome() {
  try {
    const data = await api.get('/api/posts/home')  // 백엔드에서 6개만 내려주도록 구현
    donations.value = data
  } catch (err) {
    console.error('기부 데이터(메인) 가져오기 실패:', err)
  }
}

// 전체 공개글
async function fetchDonationsAll() {
  try {
    const data = await api.get('/api/posts')       // 전체 공개글
    donations.value = data
  } catch (err) {
    console.error('기부 데이터(전체) 가져오기 실패:', err)
  }
}

  // ===========================
  // 반환
  // ===========================
  return {
    count,
    doubleCount,
    increment,
    donations,
    getDonationById,
    selectedCategory,
    filteredDonations,
    totalDonationAll,
    totalDonationFiltered,
    setCategory, clearCategory,
    fetchDonationsHome,
    fetchDonationsAll,
  }
})
