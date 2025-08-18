
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

  // API로 데이터 가져오기
async function fetchDonations() {
  console.log('fetchDonations 호출됨')
  try {
    const data = await api.get('/api/posts')
    console.log('API 응답:', data)
    donations.value = data
    console.log('store.donations 갱신됨:', donations.value)
  } catch (err) {
    console.error('기부 데이터 가져오기 실패:', err)
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
    fetchDonations,
  }
})
