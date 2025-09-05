<template>
  <div class="pending-posts">
    <!-- 헤더 -->
    <div class="header">
      <h2>승인 대기 게시글</h2>
      <div class="stats">
        <span>총 {{ totalPosts }}개의 승인 대기 게시글</span>
      </div>
    </div>

    <!-- 검색 & 정렬 -->
    <div class="search-bar">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="제목, 작성자 검색"
        allow-clear
        enter-button="검색"
        style="max-width: 400px"
        @search="handleSearch"
      />
      <a-select v-model:value="sortBy" style="width: 120px; margin-left:auto">
        <a-select-option value="date">날짜순</a-select-option>
        <a-select-option value="title">제목순</a-select-option>
      </a-select>
      <a-select v-model:value="sortDirection" style="width: 80px; margin-left: 8px">
        <a-select-option value="desc">↓</a-select-option>
        <a-select-option value="asc">↑</a-select-option>
      </a-select>
    </div>

    <!-- 필터 패널 -->
    <a-card class="filter-panel" size="small">
      <template #title>🔎 필터</template>
      <div class="filter-grid">
        <div class="filter-item">
          <label>카테고리</label>
          <a-select v-model:value="filterCategory" allow-clear placeholder="전체" class="category-select">
            <a-select-option value="아동">아동</a-select-option>
            <a-select-option value="장애인">장애인</a-select-option>
            <a-select-option value="동물">동물</a-select-option>
            <a-select-option value="환경">환경</a-select-option>
            <a-select-option value="지구촌">지구촌</a-select-option>
            <a-select-option value="어르신">어르신</a-select-option>
            <a-select-option value="사회">사회</a-select-option>
          </a-select>
        </div>
        <div class="filter-item">
          <label>작성일</label>
          <a-range-picker v-model:value="filterDateRange" style="width:100%" />
        </div>
      </div>

      <div style="margin-top:12px; text-align:right">
        <a-button @click="resetFilters" :disabled="!hasActiveFilters">↩️ 초기화</a-button>
      </div>
    </a-card>

    <!-- 일괄 작업 툴바 -->
    <div v-if="selectedRowKeys.length > 0" class="bulk-toolbar">
      <span>{{ selectedRowKeys.length }}개 선택됨</span>
      <div class="bulk-actions">
        <a-button type="primary" @click="approveSelected" style="margin-right: 8px">
          ✅ 일괄 승인
        </a-button>
        <a-button danger @click="openRejectModalBulk">
          ❌ 일괄 반려
        </a-button>
      </div>
    </div>

    <!-- 테이블 -->
    <a-table
      :data-source="displayPosts"
      :loading="loading"
      row-key="id"
      bordered
      :pagination="paginationConfig"
      :scroll="{ x: 1100 }"
      style="margin-top: 16px"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
      @change="handleTableChange"
    >
      <a-table-column title="#" key="index" width="60" align="center">
        <template #default="{ index }">
          {{ (currentPage - 1) * pageSize + index + 1 }}
        </template>
      </a-table-column>

      <!-- 제목 및 달성률 -->
      <a-table-column title="제목 및 달성률" key="title-progress" :ellipsis="true">
        <template #default="{ record }">
          <div class="title-progress">
            <!-- 제목 -->
            <div class="title-link" @click="viewPost(record.id)">
              <a-tooltip :title="record.title" placement="topLeft">
                <span>{{ record.title }}</span>
              </a-tooltip>
            </div>

            <!-- 달성률 -->
            <div class="progress-section">
              <a-progress
                :percent="record.percent"
                size="small"
                :status="record.percent >= 100 ? 'success' : 'active'"
                :show-info="false"
              />
              <div class="progress-text">
                <span class="raised">{{ record.currentAmount.toLocaleString() }}원</span>
                /
                <span class="goal">{{ record.amount.toLocaleString() }}원</span>
                <span class="percent"> ({{ Math.trunc(record.percentRaw) }}%)</span>
              </div>
            </div>
          </div>
        </template>
      </a-table-column>

      <a-table-column title="작성자" key="authorName" width="160" align="center">
        <template #default="{ record }">
          <a-tooltip :title="record.authorEmail">
            <span>{{ record.authorName }}</span>
          </a-tooltip>
        </template>
      </a-table-column>

      <a-table-column title="카테고리" dataIndex="category" key="category" width="120" align="center">
        <template #default="{ record }">
          <a-tag color="blue">{{ record.category }}</a-tag>
        </template>
      </a-table-column>

      <a-table-column title="작성일" dataIndex="createdAt" key="createdAt" width="140" align="center">
        <template #default="{ record }">
          <a-tooltip :title="formatFullDate(record.createdAt)">
            {{ formatDate(record.createdAt) }}
          </a-tooltip>
        </template>
      </a-table-column>

      <!-- 작업 -->
      <a-table-column title="작업" key="actions" width="120" align="center" fixed="right">
        <template #default="{ record }">
          <a-dropdown trigger="click">
            <a-button type="text" size="small">⋮</a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="approvePost(record.id)">✅ 승인</a-menu-item>
                <a-menu-item @click="openRejectModal(record.id)">❌ 반려</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </a-table-column>
    </a-table>

    <!-- 반려 모달 -->
    <a-modal
      v-model:open="rejectModalVisible"
      title="게시글 반려"
      ok-text="반려"
      cancel-text="취소"
      @ok="confirmReject"
    >
      <p>반려 사유를 입력해주세요:</p>
      <a-textarea v-model:value="rejectReason" rows="4" />
    </a-modal>

    <!-- 빈 상태 -->
    <div v-if="!loading && displayPosts.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-text">
        조건에 맞는 승인 대기 게시글이 없습니다.<br />
        <a @click="resetFilters">초기화</a> 후 다시 시도해보세요.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import axios from '@/utils/axios'
import { useRouter, useRoute } from 'vue-router'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const posts = ref([])
const total = ref(0)
const loading = ref(false)

// 쿼리 파라미터와 동기화되는 상태
const currentPage = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const sortBy = ref('date')
const sortDirection = ref('desc')
const filterCategory = ref(null)
const filterDateRange = ref([])

// 선택 상태
const selectedRowKeys = ref([])
const onSelectChange = (keys) => {
  selectedRowKeys.value = keys
}

// 반려 모달 상태
const rejectModalVisible = ref(false)
const rejectReason = ref('')
const targetPostIds = ref([])

// 한글 displayName을 Category enum으로 변환
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

// 서버사이드 페이징으로 승인 대기 게시글 조회
const fetchPosts = async (updateURL = true) => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      sortBy: sortBy.value,
      sortDirection: sortDirection.value,
    }
    
    if (searchKeyword.value) {
      params.title = searchKeyword.value
      params.authorName = searchKeyword.value
    }
    
    if (filterCategory.value) {
      params.category = getCategoryEnum(filterCategory.value)
    }
    
    if (filterDateRange.value?.length === 2) {
      params.startDate = filterDateRange.value[0].format('YYYY-MM-DD')
      params.endDate = filterDateRange.value[1].format('YYYY-MM-DD')
    }
    
    const res = await axios.get('/api/admin/posts/pending', { params })
    posts.value = res.posts || []
    total.value = res.totalElements || 0
    
    // URL 업데이트는 조건부로 실행
    if (updateURL) {
      updateURLParams()
    }
  } catch (e) {
    console.error('승인 대기 게시글 불러오기 실패:', e)
    message.error('승인 대기 게시글을 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

// URL 쿼리 파라미터 업데이트
const updateURLParams = () => {
  const query = {
    page: currentPage.value,
    limit: pageSize.value,
    sortBy: sortBy.value,
    sortDirection: sortDirection.value,
  }
  
  if (searchKeyword.value) query.search = searchKeyword.value
  if (filterCategory.value) query.category = filterCategory.value
  if (filterDateRange.value?.length === 2) {
    query.startDate = filterDateRange.value[0].format('YYYY-MM-DD')
    query.endDate = filterDateRange.value[1].format('YYYY-MM-DD')
  }
  
  router.replace({ query })
}

// URL 쿼리 파라미터에서 상태 복원
const initFromURLParams = () => {
  const query = route.query
  
  currentPage.value = parseInt(query.page) || 1
  pageSize.value = parseInt(query.limit) || 10
  sortBy.value = query.sortBy || 'date'
  sortDirection.value = query.sortDirection || 'desc'
  searchKeyword.value = query.search || ''
  filterCategory.value = query.category || null
  
  if (query.startDate && query.endDate) {
    filterDateRange.value = [
      dayjs(query.startDate),
      dayjs(query.endDate)
    ]
  }
}

// 단건 승인
const approvePost = async (postId) => {
  try {
    await axios.patch('/api/admin/posts/status', { postIds: [postId], status: 'APPROVED' })
    message.success('게시글이 승인되었습니다.')
    fetchPosts()
    selectedRowKeys.value = selectedRowKeys.value.filter(id => id !== postId)
  } catch (e) {
    console.error('승인 실패:', e)
    message.error('승인 처리 중 오류가 발생했습니다.')
  }
}

// 일괄 승인
const approveSelected = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('승인할 게시글을 선택하세요.')
    return
  }
  try {
    await axios.patch('/api/admin/posts/status', { postIds: selectedRowKeys.value, status: 'APPROVED' })
    message.success(`${selectedRowKeys.value.length}개 게시글이 승인되었습니다.`)
    selectedRowKeys.value = []
    fetchPosts()
  } catch (e) {
    console.error('일괄 승인 실패:', e)
    message.error('승인 처리 중 오류가 발생했습니다.')
  }
}

// 단건 반려 모달 열기
const openRejectModal = (postId) => {
  targetPostIds.value = [postId]
  rejectReason.value = ''
  rejectModalVisible.value = true
}

// 일괄 반려 모달 열기
const openRejectModalBulk = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('반려할 게시글을 선택하세요.')
    return
  }
  targetPostIds.value = [...selectedRowKeys.value]
  rejectReason.value = ''
  rejectModalVisible.value = true
}

// 반려 확정
const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    message.warning('반려 사유를 입력해주세요.')
    return
  }
  try {
    await axios.patch('/api/admin/posts/status', {
      postIds: targetPostIds.value,
      status: 'REJECTED',
      rejectionReason: rejectReason.value,
    })
    message.info(`${targetPostIds.value.length}개 게시글이 반려되었습니다.`)
    rejectModalVisible.value = false
    selectedRowKeys.value = []
    fetchPosts()
  } catch (e) {
    console.error('반려 실패:', e)
    message.error('반려 처리 중 오류가 발생했습니다.')
  }
}

// 서버에서 받은 데이터를 그대로 표시 (서버사이드 페이징)
const displayPosts = computed(() => posts.value)

const handleTableChange = (pagination) => {
  currentPage.value = pagination.current
  pageSize.value = pagination.pageSize
  
  // URL 업데이트
  const query = {
    ...route.query,
    page: pagination.current,
    limit: pagination.pageSize,
  }
  router.replace({ query })
  
  // 데이터 로드 (URL 업데이트 안 함)
  fetchPosts(false)
}

const totalPosts = computed(() => total.value)
const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `${range[0]}-${range[1]} / 총 ${total}개`,
  pageSizeOptions: ['10', '20', '50'],
  size: 'default',
}))

const resetFilters = () => {
  searchKeyword.value = ''
  filterCategory.value = null
  filterDateRange.value = []
  sortBy.value = 'date'
  sortDirection.value = 'desc'
  currentPage.value = 1
  fetchPosts()
}

const hasActiveFilters = computed(
  () =>
    searchKeyword.value ||
    filterCategory.value ||
    (filterDateRange.value?.length === 2) ||
    sortBy.value !== 'date' ||
    sortDirection.value !== 'desc'
)

// ====== Utils ======
const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
const formatFullDate = (dateString) => new Date(dateString).toLocaleString('ko-KR')
const viewPost = (postId) => router.push({ name: 'postDetail', params: { id: postId } })

// 검색어 변경시에만 첫 페이지로 이동하고 재조회
watch([searchKeyword], () => {
  currentPage.value = 1
  fetchPosts()
})

// 단순 필터/정렬 변경시에는 페이지 유지하고 재조회
watch([filterCategory, filterDateRange, sortBy, sortDirection], () => {
  fetchPosts()
})

// 검색 버튼 클릭시 실행
const handleSearch = () => {
  currentPage.value = 1
  fetchPosts()
}

onMounted(() => {
  initFromURLParams()
  fetchPosts(false) // 초기 로딩 시에는 URL 업데이트 안 함
})
</script>

<style scoped>
.pending-posts { padding: 24px; background: #fff; min-height: 100vh; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0; }
.header h2 { margin: 0; font-size: 24px; color: #262626; }
.stats { display: flex; align-items: center; font-size: 14px; color: #666; }
.search-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.filter-panel { margin-bottom: 12px; }
.filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.filter-item label { display: block; font-size: 12px; margin-bottom: 4px; color: #666; }
.title-link { cursor: pointer; color: #1890ff; }
.title-link:hover { color: #40a9ff; }
.empty-state { text-align: center; padding: 60px 20px; color: #999; }
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.category-select { width: 140px; }

.bulk-toolbar {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bulk-actions {
  display: flex;
  gap: 8px;
}

.title-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title-link {
  cursor: pointer;
  font-weight: 500;
  color: #1890ff;
}
.title-link:hover {
  color: #40a9ff;
}

.progress-section {
  display: flex;
  flex-direction: column;
}

.progress-text {
  font-size: 13px;
  color: #555;
}
.progress-text .raised {
  color: #00c851;
  font-weight: 600;
}
.progress-text .goal {
  color: #999;
}
.progress-text .percent {
  color: #00c851;
  font-weight: 500;
}
</style>