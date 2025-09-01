<template>
  <div class="pending-posts">
    <!-- 헤더 -->
    <div class="header">
      <h2>승인 대기 게시글</h2>
    </div>

    <!-- 검색 & 정렬 -->
    <div class="search-bar">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="제목 또는 작성자 검색"
        style="width: 280px"
        allow-clear
      />
      <a-select
        v-model:value="sortBy"
        style="width: 160px; margin-left:auto"
      >
        <a-select-option value="createdAt-desc">최신순</a-select-option>
        <a-select-option value="createdAt-asc">오래된순</a-select-option>
        <a-select-option value="title-asc">제목순(가나다)</a-select-option>
        <a-select-option value="title-desc">제목순(다나가)</a-select-option>
      </a-select>
    </div>

    <!-- 필터 패널 -->
    <a-card class="filter-panel" size="small">
      <template #title>필터</template>
      <div class="filter-grid">
        <!-- 카테고리 -->
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

        <!-- 기간 -->
        <div class="filter-item">
          <label>작성일</label>
          <a-range-picker v-model:value="filterDateRange" style="width:100%" />
        </div>

        <!-- 목표 금액 -->
        <div class="filter-item">
          <label>목표 금액</label>
          <div style="display:flex; gap:4px">
            <a-input-number v-model:value="filterAmountMin" placeholder="최소" :min="0" style="flex:1"/>
            <span>~</span>
            <a-input-number v-model:value="filterAmountMax" placeholder="최대" :min="0" style="flex:1"/>
          </div>
        </div>
      </div>

      <div style="margin-top:12px; text-align:right">
        <a-button @click="resetFilters" :disabled="!hasActiveFilters">초기화</a-button>
      </div>
    </a-card>

    <!-- 테이블 -->
    <a-table
      :data-source="displayPosts"
      :loading="loading"
      row-key="id"
      bordered
      :pagination="paginationConfig"
      :scroll="{ x: 800 }"
      style="margin-top: 16px"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
    >
    <template #title>
    <div class="table-toolbar">
      <span>총 {{ totalPosts }}개의 승인 대기 게시글</span>
      <div v-if="selectedRowKeys.length > 0" class="bulk-actions">
        <a-button type="primary" @click="approveSelected" style="margin-right:8px">
          ✅ 승인
        </a-button>
        <a-button danger @click="openRejectModalBulk">
          ❌ 반려
        </a-button>
      </div>
    </div>
  </template>
      <!-- 번호 -->
      <a-table-column title="번호" key="index" width="60" align="center">
        <template #default="{ index }">
          {{ (currentPage - 1) * pageSize + index + 1 }}
        </template>
      </a-table-column>

      <!-- 제목 -->
      <a-table-column title="제목" dataIndex="title" key="title" :ellipsis="true">
        <template #default="{ record }">
          <a-tooltip :title="record.title" placement="topLeft">
            <span class="title-link" @click="viewPost(record.id)">
              {{ record.title }}
            </span>
          </a-tooltip>
        </template>
      </a-table-column>

      <!-- 작성자 -->
      <a-table-column title="작성자" dataIndex="authorName" key="authorName" width="120" align="center" />

      <!-- 카테고리 -->
      <a-table-column title="카테고리" dataIndex="category" key="category" width="120" align="center">
        <template #default="{ record }">
          <a-tag color="blue">{{ record.category }}</a-tag>
        </template>
      </a-table-column>

      <!-- 몰표 금액 -->
      <a-table-column title="목표 금액" dataIndex="amount" key="amount" width="120" align="right">
        <template #default="{ record }">
          {{ record.amount.toLocaleString() }} 원
        </template>
      </a-table-column>

      <!-- 작성일 -->
      <a-table-column title="작성일" dataIndex="createdAt" key="createdAt" width="120" align="center">
        <template #default="{ record }">
          <a-tooltip :title="formatFullDate(record.createdAt)">
            {{ formatDate(record.createdAt) }}
          </a-tooltip>
        </template>
      </a-table-column>

      <!-- 작업 -->
      <a-table-column title="작업" key="actions" width="100" align="center" fixed="right">
        <template #default="{ record }">
          <a-dropdown trigger="click">
            <a-button type="text" size="small">⋮</a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="approvePost(record.id)">✅ 승인</a-menu-item>
                <a-menu-item danger @click="openRejectModal(record.id)">❌ 반려</a-menu-item>
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
      <div class="empty-icon">📝</div>
      <div class="empty-text">
        <template v-if="hasActiveFilters"> 검색/필터 조건에 맞는 게시글이 없습니다. </template>
        <template v-else> 승인 대기 중인 게시글이 없습니다. </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import axios from '@/utils/axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const posts = ref([])
const loading = ref(false)

// 검색/정렬 상태
const searchKeyword = ref('')
const sortBy = ref('createdAt-desc')

// 필터 상태
const filterCategory = ref(null)
const filterDateRange = ref([])
const filterAmountMin = ref(null)
const filterAmountMax = ref(null)

// 페이지네이션
const currentPage = ref(1)
const pageSize = ref(10)

// 데이터 불러오기
const fetchPendingPosts = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/admin/posts/pending')
    posts.value = Array.isArray(res) ? res : res.data
  } catch (e) {
    console.error('승인 대기 게시글 불러오기 실패:', e)
    message.error('승인 대기 게시글을 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

// 검색 + 필터 적용
const filteredPosts = computed(() => {
  let result = [...posts.value]

  // 검색 (제목 + 작성자)
  if (searchKeyword.value) {
    result = result.filter(
      (p) =>
        p.title?.includes(searchKeyword.value) ||
        p.authorName?.includes(searchKeyword.value)
    )
  }

  // 카테고리
  if (filterCategory.value) {
    result = result.filter((p) => p.category === filterCategory.value)
  }

  // 기간 (작성일)
  if (filterDateRange.value?.length === 2) {
    const [start, end] = filterDateRange.value
    result = result.filter((p) => {
      const createdAt = new Date(p.createdAt)
      return createdAt >= new Date(start) && createdAt <= new Date(end)
    })
  }

  // 목표 금액
  if (filterAmountMin.value !== null) {
    result = result.filter((p) => p.amount >= filterAmountMin.value)
  }
  if (filterAmountMax.value !== null) {
    result = result.filter((p) => p.amount <= filterAmountMax.value)
  }

  return result
})

// 정렬 적용
const sortedPosts = computed(() => {
  const result = [...filteredPosts.value]
  const [field, order] = sortBy.value.split('-')

  result.sort((a, b) => {
    let valueA = a[field]
    let valueB = b[field]

    if (field === 'createdAt') {
      valueA = new Date(valueA)
      valueB = new Date(valueB)
    } else if (field === 'title') {
      valueA = valueA?.toLowerCase?.() ?? ''
      valueB = valueB?.toLowerCase?.() ?? ''
    }
    return order === 'asc' ? (valueA > valueB ? 1 : -1) : valueA < valueB ? 1 : -1
  })
  return result
})

// 페이지네이션 적용
const displayPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedPosts.value.slice(start, start + pageSize.value)
})

const totalPosts = computed(() => posts.value.length)

const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: sortedPosts.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `${range[0]}-${range[1]} / 총 ${total}개`,
  pageSizeOptions: ['5', '10', '20', '50'],
  size: 'default',
}))

// 초기화
const resetFilters = () => {
  searchKeyword.value = ''
  filterCategory.value = null
  filterDateRange.value = []
  filterAmountMin.value = null
  filterAmountMax.value = null
  sortBy.value = 'createdAt-desc'
  currentPage.value = 1
}
const hasActiveFilters = computed(
  () =>
    searchKeyword.value ||
    filterCategory.value ||
    (filterDateRange.value?.length === 2) ||
    filterAmountMin.value !== null ||
    filterAmountMax.value !== null ||
    sortBy.value !== 'createdAt-desc'
)

// 날짜 포맷
const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
const formatFullDate = (dateString) => new Date(dateString).toLocaleString('ko-KR')

// 게시글 상세 이동
const viewPost = (postId) => router.push({ name: 'postDetail', params: { id: postId } })

const selectedRowKeys = ref([])
const onSelectChange = (keys) => {
  selectedRowKeys.value = keys
}

// 단건 승인
const approvePost = async (postId) => {
  try {
    await axios.patch('/api/admin/posts/status', { postIds: [postId], status: 'APPROVED' })
    message.success('게시글이 승인되었습니다.')
    fetchPendingPosts()
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
    message.success('선택한 게시글이 승인되었습니다.')
    selectedRowKeys.value = []
    fetchPendingPosts()
  } catch (e) {
    console.error('일괄 승인 실패:', e)
    message.error('승인 처리 중 오류가 발생했습니다.')
  }
}

const rejectModalVisible = ref(false)
const rejectReason = ref('')
const targetPostId = ref(null)

// 단건 반려 열기
const openRejectModal = (postId) => {
  targetPostId.value = [postId]
  rejectReason.value = ''
  rejectModalVisible.value = true
}

// 일괄 반려 열기
const openRejectModalBulk = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('반려할 게시글을 선택하세요.')
    return
  }
  targetPostId.value = [...selectedRowKeys.value] // 선택된 ID들
  rejectReason.value = ''
  rejectModalVisible.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    message.warning('반려 사유를 입력해주세요.')
    return
  }
  try {
    await axios.patch('/api/admin/posts/status', {
      postIds: targetPostId.value,
      status: 'REJECTED',
      rejectionReason: rejectReason.value,
    })
    message.info('게시글이 반려되었습니다.')
    rejectModalVisible.value = false
    selectedRowKeys.value = [] // 선택 초기화
    fetchPendingPosts()
  } catch (e) {
    console.error('반려 실패:', e)
    message.error('반려 처리 중 오류가 발생했습니다.')
  }
}


// 리렌더링
watch(
  [searchKeyword, filterCategory, filterDateRange, filterAmountMin, filterAmountMax, sortBy],
  () => (currentPage.value = 1)
)

onMounted(fetchPendingPosts)
</script>

<style scoped>
.pending-posts {
  padding: 24px;
  background: #fff;
  min-height: 100vh;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.stats {
  font-size: 14px;
  color: #666;
}
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.filter-panel {
  margin-bottom: 12px;
}
.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.filter-item label {
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
  color: #666;
}
.title-link {
  cursor: pointer;
  color: #1890ff;
}
.title-link:hover {
  color: #40a9ff;
}
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.category-select {
  width: 110px;
}
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}
</style>
