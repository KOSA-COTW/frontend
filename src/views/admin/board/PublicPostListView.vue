<template>
  <div class="all-posts">
    <!-- 헤더 + 통계 -->
    <div class="header">
      <h2>전체 게시글 관리</h2>
      <div class="stats">
        <span>총 {{ totalPosts }}개의 게시글</span>
        <span class="divider">|</span>
        <span style="color: #00c851">공개 {{ countStatus('APPROVED') }}개</span>
        <span class="divider">|</span>
        <span style="color: #ff4d4f">비공개 {{ countStatus('PRIVATE') }}개</span>
        <span class="divider">|</span>
        <span style="color: #faad14">승인 대기 {{ countStatus('PENDING') }}개</span>
        <span class="divider">|</span>
        <span style="color: #8c8c8c">반려됨 {{ countStatus('REJECTED') }}개</span>
      </div>
    </div>

    <!-- 상태 탭 -->
    <a-tabs v-model:activeKey="activeStatusTab" @change="handleTabChange" class="status-tabs">
      <a-tab-pane key="ALL" tab="전체" />
      <a-tab-pane key="APPROVED" tab="공개" />
      <a-tab-pane key="PRIVATE" tab="비공개" />
      <a-tab-pane key="PENDING" tab="승인 대기" />
      <a-tab-pane key="REJECTED" tab="반려됨" />
    </a-tabs>

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

    <!-- 테이블 -->
    <a-table
      :data-source="displayPosts"
      :loading="loading"
      row-key="id"
      bordered
      :pagination="paginationConfig"
      :scroll="{ x: 1100 }"
      style="margin-top: 16px"
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

      <a-table-column title="상태" key="visibilityStatus" width="120" align="center">
        <template #default="{ record }">
          <a-tooltip v-if="record.visibilityStatus === 'REJECTED' && record.rejectionReason"
                     :title="'반려 사유: ' + record.rejectionReason">
            <a-tag :color="getStatusTag(record.visibilityStatus).color">
              {{ getStatusTag(record.visibilityStatus).label }}
            </a-tag>
          </a-tooltip>
          <a-tag v-else :color="getStatusTag(record.visibilityStatus).color">
            {{ getStatusTag(record.visibilityStatus).label }}
          </a-tag>
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
                <a-menu-item @click="changeStatus(record.id, 'APPROVED')">✅ 공개</a-menu-item>
                <a-menu-item @click="changeStatus(record.id, 'PRIVATE')">🔒 비공개</a-menu-item>
                <a-menu-item @click="changeStatus(record.id, 'PENDING')">🕒 승인 대기</a-menu-item>
                <a-menu-item @click="openRejectModal(record.id)">❌ 반려</a-menu-item>
                <a-menu-divider />
                <a-menu-item danger>
                  <a-popconfirm
                    title="정말 삭제하시겠습니까?"
                    ok-text="삭제"
                    cancel-text="취소"
                    @confirm="deletePost(record.id)"
                  >
                    🗑️ 삭제
                  </a-popconfirm>
                </a-menu-item>
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
        조건에 맞는 게시글이 없습니다.<br />
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
const statsData = ref({
  totalCount: 0,
  approvedCount: 0,
  privateCount: 0,
  pendingCount: 0,
  rejectedCount: 0
})

// 쿼리 파라미터와 동기화되는 상태
const currentPage = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const sortBy = ref('date')
const sortDirection = ref('desc')
const filterCategory = ref(null)
const filterDateRange = ref([])
const activeStatusTab = ref('ALL')

// 반려 모달 상태
const rejectModalVisible = ref(false)
const rejectReason = ref('')
const targetPostId = ref(null)

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

// 게시글 통계 조회
const fetchStats = async () => {
  try {
    const res = await axios.get('/api/admin/posts/count')
    statsData.value = res
  } catch (e) {
    console.error('통계 조회 실패:', e)
  }
}

// 서버사이드 페이징으로 게시글 조회
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
    
    if (activeStatusTab.value !== 'ALL') {
      params.visibility = activeStatusTab.value
    }
    
    if (filterDateRange.value?.length === 2) {
      params.startDate = filterDateRange.value[0].format('YYYY-MM-DD')
      params.endDate = filterDateRange.value[1].format('YYYY-MM-DD')
    }
    
    const res = await axios.get('/api/admin/posts', { params })
    posts.value = res.posts || []
    total.value = res.totalElements || 0
    
    // URL 업데이트는 조건부로 실행
    if (updateURL) {
      updateURLParams()
    }
  } catch (e) {
    console.error('게시글 불러오기 실패:', e)
    message.error('게시글을 불러오는 중 오류가 발생했습니다.')
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
  if (activeStatusTab.value !== 'ALL') query.status = activeStatusTab.value
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
  activeStatusTab.value = query.status || 'ALL'
  
  if (query.startDate && query.endDate) {
    filterDateRange.value = [
      dayjs(query.startDate),
      dayjs(query.endDate)
    ]
  }
}

// 상태 변경
const changeStatus = async (postId, status) => {
  try {
    await axios.patch('/api/admin/posts/status', { postIds: [postId], status })
    message.success(`게시글 상태가 '${status}'로 변경되었습니다.`)
    fetchPosts()
    fetchStats() // 상태 변경 후 통계도 새로고침
  } catch (e) {
    console.error('상태 변경 실패:', e)
    message.error('상태 변경 중 오류가 발생했습니다.')
  }
}

// 반려 모달 열기
const openRejectModal = (postId) => {
  targetPostId.value = postId
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
      postIds: [targetPostId.value],
      status: 'REJECTED',
      rejectionReason: rejectReason.value,
    })
    message.info('게시글이 반려되었습니다.')
    rejectModalVisible.value = false
    fetchPosts()
    fetchStats() // 반려 후 통계도 새로고침
  } catch (e) {
    console.error('반려 실패:', e)
    message.error('반려 처리 중 오류가 발생했습니다.')
  }
}

// 삭제
const deletePost = async (postId) => {
  try {
    await axios.delete(`/api/admin/posts/${postId}`)
    message.success('게시글이 삭제되었습니다.')
    fetchPosts()
    fetchStats() // 삭제 후 통계도 새로고침
  } catch (e) {
    console.error('삭제 실패:', e)
    message.error('게시글 삭제 중 오류가 발생했습니다.')
  }
}

// 서버에서 받은 데이터를 그대로 표시 (서버사이드 페이징)
const displayPosts = computed(() => posts.value)

// 실제 통계 데이터 사용
const countStatus = (status) => {
  switch (status) {
    case 'APPROVED': return statsData.value.approvedCount
    case 'PRIVATE': return statsData.value.privateCount
    case 'PENDING': return statsData.value.pendingCount
    case 'REJECTED': return statsData.value.rejectedCount
    default: return 0
  }
}
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
const totalPosts = computed(() => statsData.value.totalCount)
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
  activeStatusTab.value = 'ALL'
  fetchPosts()
  fetchStats()
}
const hasActiveFilters = computed(
  () =>
    searchKeyword.value ||
    filterCategory.value ||
    (filterDateRange.value?.length === 2) ||
    sortBy.value !== 'date' ||
    sortDirection.value !== 'desc' ||
    activeStatusTab.value !== 'ALL'
)

// ====== Utils ======
const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
const formatFullDate = (dateString) => new Date(dateString).toLocaleString('ko-KR')
const getStatusTag = (status) => {
  switch (status) {
    case 'APPROVED': return { color: 'green', label: '공개' }
    case 'PRIVATE': return { color: 'red', label: '비공개' }
    case 'PENDING': return { color: 'orange', label: '승인 대기' }
    case 'REJECTED': return { color: 'gray', label: '반려됨' }
    default: return { color: 'default', label: status }
  }
}
const viewPost = (postId) => router.push({ name: 'postDetail', params: { id: postId } })
const handleTabChange = () => {
  currentPage.value = 1
  fetchPosts()
}

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
  fetchStats() // 통계 데이터도 로딩
})
</script>

<style scoped>
.all-posts { padding: 24px; background: #fff; min-height: 100vh; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0; }
.header h2 { margin: 0; font-size: 24px; color: #262626; }
.stats { display: flex; align-items: center; font-size: 14px; color: #666; }
.divider { margin: 0 12px; color: #d9d9d9; }
.search-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.filter-panel { margin-bottom: 12px; }
.filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.filter-item label { display: block; font-size: 12px; margin-bottom: 4px; color: #666; }
.title-link { cursor: pointer; color: #1890ff; }
.title-link:hover { color: #40a9ff; }
.row-actions { display: flex; gap: 4px; justify-content: center; }
.empty-state { text-align: center; padding: 60px 20px; color: #999; }
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.category-select { width: 140px; }
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
  color: #00c851; /* 현재 모금액 강조 */
  font-weight: 600;
}
.progress-text .goal {
  color: #999;
}
.progress-text .percent {
  color: #00c851;
  font-weight: 500;
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
  color: #00c851; /* 현재 모금액 강조 */
  font-weight: 600;
}
.progress-text .goal {
  color: #999;
}
.progress-text .percent {
  color: #00c851;
  font-weight: 500;
}

/* 페이지네이션에서 더 많은 페이지 번호 표시 */
:deep(.ant-pagination) {
  /* 페이지 번호를 더 많이 표시하기 위한 스타일 조정 */
}

:deep(.ant-pagination-item) {
  /* 페이지 번호 항목 스타일 */
}

/* 페이지네이션 항목들이 숨겨지지 않도록 설정 */
:deep(.ant-pagination .ant-pagination-item-container .ant-pagination-item-ellipsis) {
  /* 생략 부호 스타일 조정 */
}
</style>
