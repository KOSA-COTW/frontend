<template>
  <div class="all-posts">
    <div class="header">
      <h2>기부글</h2>
      <div class="stats">
        <span>총 {{ totalElements }}개의 게시글</span>
      </div>
    </div>

    <!-- 모금중 / 모금완료 탭 -->
    <a-tabs v-model:activeKey="fundStatus" @change="handleSearch" style="margin-bottom: 16px;">
      <a-tab-pane key="ONGOING" tab="모금중" />
      <a-tab-pane key="COMPLETED" tab="모금완료" />
    </a-tabs>

    <!-- 검색 및 필터 영역 -->
    <div class="search-filter-section">
      <div class="search-area">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="제목으로 검색하세요"
          style="width: 300px"
          @search="handleSearch"
          allow-clear
        />
      </div>

      <div class="filter-area">
        <a-input
          v-model:value="authorFilter"
          placeholder="작성자명"
          style="width: 160px"
          allow-clear
          @change="handleSearch"
        />

        <a-select
          v-model:value="categoryFilter"
          placeholder="카테고리"
          style="width: 120px; margin-left: 8px"
          allow-clear
          @change="handleSearch"
        >
          <a-select-option value="ALL">전체</a-select-option>
          <a-select-option value="아동">아동</a-select-option>
          <a-select-option value="장애인">장애인</a-select-option>
          <a-select-option value="어르신">어르신</a-select-option>
          <a-select-option value="동물">동물</a-select-option>
          <a-select-option value="환경">환경</a-select-option>
          <a-select-option value="지구촌">지구촌</a-select-option>
          <a-select-option value="사회">사회</a-select-option>
        </a-select>

        <a-select
          v-model:value="sortBy"
          style="width: 140px; margin-left: 8px"
          @change="handleSearch"
        >
          <a-select-option value="date-desc">최신순</a-select-option>
          <a-select-option value="date-asc">오래된순</a-select-option>
          <a-select-option value="title-asc">제목순(가나다)</a-select-option>
          <a-select-option value="title-desc">제목순(다나가)</a-select-option>
        </a-select>

        <a-button @click="resetFilters" style="margin-left: 8px" :disabled="!hasActiveFilters">
          초기화
        </a-button>
      </div>
    </div>

    <!-- 카드 리스트 -->
    <a-row :gutter="16" style="margin-top:24px;">
      <a-col
        v-for="item in posts"
        :key="item.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <a-card
          hoverable
          class="custom-card"
          :bordered="false"
          @click="viewPost(item.id)"
          :class="{ 'completed-card': item.status === 'COMPLETED' }"
        >
          <div class="image-wrap">
            <img :src="item.image || 'https://placehold.co/300x180'" class="donation-image" />
            <!-- 완료 배지 -->
            <div v-if="item.status === 'COMPLETED'" class="overlay">
              <span class="overlay-text">모금 완료</span>
            </div>
          </div>

          <div class="donation-text">
            <div class="category">#{{ item.category }}</div>
            <div class="title">{{ item.title }}</div>

            <a-progress
              :percent="item.percent"
              :stroke-color="item.status === 'COMPLETED' ? '#999' : '#00C851'"
              :show-info="false"
              style="margin-top: 10px"
            />

            <div class="bottom-info">
              <span v-if="item.status === 'ONGOING'" class="remaining">
                마감까지 {{ (item.remaining || 0).toLocaleString() }}원
              </span>
              <span class="percent">
                {{ Math.trunc(item.percentRaw) }}%
                <span v-if="item.percentRaw >= 100"> 🎉</span>
              </span>
            </div>
          </div>
        </a-card>
      </a-col>

      <!-- 빈 상태 -->
      <a-col v-if="!loading && posts.length === 0" :span="24" style="text-align:center; color:#999; padding:40px 0;">
        <div class="empty-icon">📭</div>
        <div class="empty-text">
          검색 조건에 맞는 게시글이 없습니다.
        </div>
      </a-col>
    </a-row>

    <!-- 페이징 -->
    <div class="pagination-wrap" v-if="totalElements > 0">
      <a-pagination
      :current="currentPage"
      :page-size="limit"
      :total="totalElements"
      show-size-changer
      show-quick-jumper
      :page-size-options="['12', '24', '48']"
      @change="handlePageChange"
      @showSizeChange="handlePageSizeChange"
    />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/utils/axios'
import { message } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()

const posts = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const authorFilter = ref('')
const categoryFilter = ref('ALL')
const sortBy = ref('date-desc')
const currentPage = ref(1)
const limit = ref(12)
const totalElements = ref(0)
const fundStatus = ref('ONGOING')

const getCategoryEnum = (displayName) => {
  const categoryMap = {
    '아동': 'CHILD',
    '장애인': 'DISABLED',
    '어르신': 'SENIOR',
    '동물': 'ANIMAL',
    '환경': 'ENVIRONMENT',
    '지구촌': 'GLOBAL',
    '사회': 'SOCIETY'
  }
  return categoryMap[displayName] || null
}

const hasActiveFilters = computed(() => {
  return (
    searchKeyword.value ||
    (categoryFilter.value && categoryFilter.value !== 'ALL') ||
    authorFilter.value ||
    sortBy.value !== 'date-desc'
  )
})

const fetchPosts = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value - 1,
      size: limit.value,
      sortBy: sortBy.value.split('-')[0],
      sortDirection: sortBy.value.split('-')[1],
      fundStatus: fundStatus.value
    }

    if (categoryFilter.value && categoryFilter.value !== 'ALL') {
      params.category = getCategoryEnum(categoryFilter.value)
    }
    if (searchKeyword.value) {
      params.title = searchKeyword.value
    }
    if (authorFilter.value) {
      params.authorName = authorFilter.value
    }

    const res = await axios.get('/api/posts/paged', { params })
    posts.value = res.content
    totalElements.value = res.totalElements
  } catch (e) {
    console.error('기부글 불러오기 실패:', e)
    message.error('게시글을 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchPosts()
}

const resetFilters = () => {
  searchKeyword.value = ''
  categoryFilter.value = 'ALL'
  authorFilter.value = ''
  sortBy.value = 'date-desc'
  currentPage.value = 1
  fetchPosts()
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchPosts()
}

const handlePageSizeChange = (current, size) => {
  limit.value = size
  currentPage.value = 1
  fetchPosts()
}

const viewPost = (postId) => {
  router.push({ name: 'postDetail', params: { id: postId } })
}

// 메인에서 category query로 들어온 경우 반영
onMounted(() => {
  if (route.query.category) {
    categoryFilter.value = route.query.category
  }
  fetchPosts()
})
</script>

<style scoped>
.all-posts { max-width:1100px; margin:24px auto; padding:0 12px; }
.header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0;
}
.header h2 { margin: 0; font-size: 24px; color: #262626; }
.stats { font-size: 14px; color: #666; }
.search-filter-section {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; padding: 20px; background: #fafafa;
  border-radius: 8px; flex-wrap: wrap; gap: 16px;
}
.filter-area { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.custom-card { padding:0; overflow:hidden; border-radius:12px; box-shadow:0 6px 12px rgba(0,0,0,.15); margin-bottom:24px; position:relative; }
.image-wrap { position: relative; }
.donation-image { width:100%; height:180px; object-fit:cover; border-top-left-radius:12px; border-top-right-radius:12px; }
.donation-text {
  padding: 12px 16px; background: #fff; display: flex;
  flex-direction: column; justify-content: space-between; min-height: 150px;
}
.category { color:#00C851; font-weight:700; margin-bottom:4px; font-size:.9rem; }
.title {
  font-size: 1rem; font-weight: 600; margin-bottom: 8px; line-height: 1.4;
  overflow: hidden; text-overflow: ellipsis; display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 2.8em;
}
.bottom-info { display:flex; justify-content:space-between; margin-top:4px; color:#777; font-size:.85rem; }
.percent { color:#00C851; font-weight:700; }

.pagination-wrap { margin-top: 24px; display: flex; justify-content: center; }

.completed-card .donation-image { filter: grayscale(1); }
.completed-card::after {
  content: ""; position: absolute; inset: 0; background: rgba(0,0,0,0.3); border-radius: 12px;
}
.overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  border-top-left-radius: 12px; border-top-right-radius: 12px;
}
.overlay-text {
  color: #fff; font-size: 1.2rem; font-weight: bold;
  background: rgba(0,0,0,0.65); padding: 8px 16px; border-radius: 999px;
}
</style>
