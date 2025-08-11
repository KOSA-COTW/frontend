
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

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
  const donations = ref([
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&w=400&q=80',
      category: '아동',
      title: '전라북도 전주시 새누리지역아동센터 아이들 28명에게 따뜻한 간식을',
      percent: 79.4,
      raised: 378200,
      target: 481900,
      remaining: 103700,
      participants: 11,
      startDate: '2025.07.20',
      desc: `<b>새누리지역아동센터</b><br>
        전주시 새누리지역아동센터에는 형편이 어려운 가정의 아이들이 방과 후를 보내고 있습니다.<br>
        최근 센터에서는 아이들이 건강하게 자라기 위한 다양한 간식 지원이 절실한 상황입니다.<br>
        여러분의 소중한 후원으로 아이들에게 신선한 과일, 우유, 영양 간식을 제공하고자 합니다.<br><br>
        아이들에게 따뜻한 간식을 전해주어 배고픔 걱정 없이 밝게 성장할 수 있도록 힘을 보태주세요.<br>
        여러분의 작은 정성이 아이들에게 큰 힘이 됩니다!`,
      stat: ['0명', '12명', '12명', '5명']
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
      category: '장애인',
      title: '서울시 중랑구 해오름지역아동센터 장애 아동들에게 안전한 교통비를',
      percent: 52.1,
      raised: 251000,
      target: 482200,
      remaining: 51200,
      participants: 9,
      startDate: '2025.07.20',
      desc: `<b>해오름지역아동센터</b><br>
        해오름지역아동센터에는 이동이 불편한 장애 아동들이 많이 있습니다.<br>
        이 아이들이 안전하게 센터에 오가며 다양한 교육과 돌봄을 받을 수 있도록 교통비 지원이 필요합니다.<br><br>
        여러분의 후원으로 아이들에게 택시, 버스 등 교통비를 지원해 주고, 아이들이 안전하게 등하원할 수 있도록 도와주세요.<br>
        작은 관심과 나눔이 장애 아동들에게 자유롭고 안전한 일상을 선물할 수 있습니다.`,
      stat: ['0명', '7명', '10명', '5명']
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80',
      category: '어르신',
      title: '부산시 사하구 사랑지역아동센터 어르신들께 건강 검진비를',
      percent: 92.6,
      raised: 469100,
      target: 482000,
      remaining: 12800,
      participants: 14,
      startDate: '2025.07.20',
      desc: `<b>사랑지역아동센터</b><br>
        사랑지역아동센터에서는 인근 지역 어르신들도 함께 돌보고 있습니다.<br>
        최근 건강에 어려움을 겪는 어르신들이 늘어나 건강 검진 지원이 절실한 상황입니다.<br><br>
        여러분의 소중한 기부금으로 어르신들께 무료 건강검진을 제공하여, 질병을 미리 예방하고 건강하게 생활하실 수 있도록 도와주세요.<br>
        작은 정성이 어르신들의 건강을 지키는 큰 힘이 됩니다.`,
      stat: ['-', '-', '-', '15명']
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1454023492550-5696f8ff10e1?auto=format&fit=crop&w=400&q=80',
      category: '동물',
      title: '대전시 서구 아람지역 내 유기동물 보호소에 사료와 의약품을',
      percent: 33.3,
      raised: 40000,
      target: 120000,
      remaining: 80000,
      participants: 7,
      startDate: '2025.07.20',
      desc: `<b>아람지역 유기동물 보호소</b><br>
        대전시 서구 아람지역의 유기동물 보호소에는 도움이 필요한 동물들이 많이 있습니다.<br>
        이 아이들이 배고프지 않게, 아프지 않게 지낼 수 있도록 사료와 필수 의약품 지원이 절실합니다.<br><br>
        여러분의 따뜻한 후원이 보호소 동물들에게 희망과 생명을 선물할 수 있습니다.<br>
        유기동물들이 건강하게 생활하고 새로운 가족을 만날 수 있도록 함께 해주세요.`,
      stat: ['-', '-', '-', '80마리']
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
      category: '환경',
      title: '경기도 수원시 하늘지역 환경 정화 활동에 필요한 물품을',
      percent: 45.7,
      raised: 50800,
      target: 111100,
      remaining: 60300,
      participants: 10,
      startDate: '2025.07.20',
      desc: `<b>하늘지역 환경 정화</b><br>
        하늘지역에서는 학생들과 지역주민들이 함께 환경 정화 활동을 펼치고 있습니다.<br>
        쓰레기봉투, 집게, 장갑 등 환경미화에 필요한 물품이 부족한 상황입니다.<br><br>
        여러분의 소중한 기부금으로 더 깨끗한 지역사회를 만들어갈 수 있습니다.<br>
        모두가 함께 깨끗한 환경에서 살아갈 수 있도록 환경정화 물품 지원에 동참해주세요!`,
      stat: ['-', '40명', '-', '-']
    },
    {
      id: 6,
      image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80',
      category: '지구촌',
      title: '인천시 연수구 드림지역 아이들에게 지구촌 교육 지원을',
      percent: 67.2,
      raised: 87500,
      target: 130100,
      remaining: 42600,
      participants: 8,
      startDate: '2025.07.20',
      desc: `<b>드림지역 지구촌 교육</b><br>
        인천 연수구 드림지역 아이들은 다양한 배경과 문화를 가지고 있습니다.<br>
        이 아이들이 글로벌 시민으로 성장할 수 있도록 지구촌 교육(언어, 문화, 세계시민 교육 등) 지원이 필요합니다.<br><br>
        여러분의 후원이 아이들에게 새로운 꿈과 희망, 넓은 세상을 경험할 기회를 만들어줍니다.<br>
        아이들이 차별 없이 성장할 수 있도록 지구촌 교육 지원에 동참해주세요!`,
      stat: ['-', '18명', '22명', '8명']
    },
  ])

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
  }
})
