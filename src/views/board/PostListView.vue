<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePostStore } from '@/stores/post'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const router = useRouter()
const postStore = usePostStore()
const { posts } = storeToRefs(postStore)

const activeTab = ref('ongoing')              // 'ongoing' | 'completed'
const selectedCategory = ref('ALL')           // 카테고리 필터
const searchQuery = ref('')                   // 검색어

// 카테고리 목록 (필요 시 백엔드에서 내려주는 값으로 대체 가능)
const categories = [
  { value: 'ALL', label: '전체' },
  { value: '아동', label: '아동' },
  { value: '장애인', label: '장애인' },
  { value: '어르신', label: '어르신' },
  { value: '동물', label: '동물' },
  { value: '환경', label: '환경' },
  { value: '지구촌', label: '지구촌' },
  { value: '사회', label: '사회' },
]

onMounted(() => {
  postStore.fetchPostsAll()
})

// 1) 탭(상태)별 1차 분류
const baseByTab = computed(() => {
  return activeTab.value === 'completed'
    ? posts.value.filter(p => p.status === 'COMPLETED')
    : posts.value.filter(p => p.status !== 'COMPLETED')
})

// 2) 카테고리 필터
const byCategory = computed(() => {
  if (selectedCategory.value === 'ALL') return baseByTab.value
  return baseByTab.value.filter(p => p.category === selectedCategory.value)
})

// 3) 검색어 필터 (제목/카테고리)
const filteredPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return byCategory.value
  return byCategory.value.filter(p => {
    const title = (p.title || '').toLowerCase()
    const cat = (p.category || '').toLowerCase()
    return title.includes(q) || cat.includes(q)
  })
})

function goDetail(id) {
  router.push({ name: 'postDetail', params: { id } })
}
</script>

<template>
  <div class="wrap">
    <!-- 가운데 큰 탭 -->
    <div class="tab-container">
      <div
        :class="['tab-item', activeTab === 'ongoing' ? 'active' : '']"
        @click="activeTab = 'ongoing'"
      >
        모금중인 기부
      </div>
      <div
        :class="['tab-item', activeTab === 'completed' ? 'active' : '']"
        @click="activeTab = 'completed'"
      >
        모금완료된 기부
      </div>
    </div>

    <!-- 필터 바 -->
    <div class="filter-bar">
      <a-select
        v-model:value="selectedCategory"
        size="large"
        class="category-select"
      >
        <a-select-option
          v-for="c in categories"
          :key="c.value"
          :value="c.value"
        >
          {{ c.label }}
        </a-select-option>
      </a-select>

      <a-input
        v-model:value="searchQuery"
        size="large"
        placeholder="검색어"
        allow-clear
        class="search-input"
      />
    </div>

    <!-- 카드 리스트 -->
    <a-row :gutter="16" style="margin-top:24px;">
      <a-col
        v-for="item in filteredPosts"
        :key="item.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <a-card
          hoverable
          class="custom-card"
          :class="activeTab === 'completed' ? 'completed' : ''"
          :bordered="false"
          @click="goDetail(item.id)"
        >
          <div class="image-wrap">
            <img :src="item.image || 'https://placehold.co/300x180'" class="donation-image" />
            <!-- 완료 배지 -->
            <div v-if="activeTab === 'completed'" class="badge">모금완료</div>
          </div>

          <div class="donation-text">
            <div class="category">#{{ item.category }}</div>
            <div class="title">{{ item.title }}</div>

            <a-progress
              :percent="item.percent"
              :stroke-color="'#00C851'"
              :show-info="false"
              style="margin-top: 10px"
            />

            <div class="bottom-info">
              <span class="remaining">
                마감까지 {{ (item.remaining || 0).toLocaleString() }}원
              </span>
              <span class="percent">{{ item.percentRaw ?? 0 }}%</span>
            </div>
          </div>
        </a-card>
      </a-col>

      <!-- 빈 상태 -->
      <a-col v-if="filteredPosts.length === 0" :span="24" style="text-align:center; color:#999; padding:40px 0;">
        해당 조건의 기부가 없습니다.
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.wrap { max-width:1100px; margin:24px auto; padding:0 12px; }

/* 탭 */
.tab-container {
  display: flex; justify-content: center; gap: 40px;
  font-size: 1.25rem; font-weight: 700; margin: 10px 0 14px;
}
.tab-item {
  cursor: pointer; padding: 10px 2px; border-bottom: 3px solid transparent;
  transition: all .25s ease;
}
.tab-item.active { color: #00C851; border-bottom-color: #00C851; }

/* 필터 바 */
.filter-bar {
  margin-top: 6px;
  display: flex; justify-content: flex-end; gap: 12px; flex-wrap: wrap;
}
.category-select { width: 220px; }
.search-input   { width: 260px; }

/* 카드 */
.custom-card { padding:0; overflow:hidden; border-radius:12px; box-shadow:0 6px 12px rgba(0,0,0,.15); margin-bottom:24px; position:relative; }
.image-wrap { position: relative; }
.donation-image { width:100%; height:180px; object-fit:cover; border-top-left-radius:12px; border-top-right-radius:12px; }
.donation-text { padding:12px 16px; background:#fff; }
.category { color:#00C851; font-weight:700; margin-bottom:4px; font-size:.9rem; }
.title { font-size:1rem; font-weight:600; margin-bottom:8px; }
.bottom-info { display:flex; justify-content:space-between; margin-top:4px; color:#777; font-size:.85rem; }
.percent { color:#00C851; font-weight:700; }

/* 완료 상태 오버레이 & 배지 */
.custom-card.completed .donation-image { filter: grayscale(1); }
.custom-card.completed::after {
  content: ""; position: absolute; inset: 0; background: rgba(0,0,0,.15); border-radius: 12px;
}
.badge {
  position: absolute; left: 16px; top: 16px;
  background: rgba(0,0,0,.65); color: #fff;
  padding: 8px 14px; border-radius: 999px; font-weight: 700; font-size: .95rem;
  display: inline-flex; align-items: center; gap: 6px;
}
</style>
