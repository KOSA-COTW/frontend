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
      />
      <a-select v-model:value="sortBy" style="width: 180px; margin-left:auto">
        <a-select-option value="createdAt-desc"> 최신순</a-select-option>
        <a-select-option value="createdAt-asc"> 오래된순</a-select-option>
        <a-select-option value="title-asc"> 제목순(가나다)</a-select-option>
        <a-select-option value="title-desc"> 제목순(다나가)</a-select-option>
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
import { useRouter } from 'vue-router'

const router = useRouter()
const posts = ref([])
const loading = ref(false)

const searchKeyword = ref('')
const sortBy = ref('createdAt-desc')
const filterCategory = ref(null)
const filterDateRange = ref([])
const activeStatusTab = ref('ALL')

const currentPage = ref(1)
const pageSize = ref(10)

// 반려 모달 상태
const rejectModalVisible = ref(false)
const rejectReason = ref('')
const targetPostId = ref(null)

const fetchAllPosts = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/admin/posts')
    posts.value = Array.isArray(res) ? res : res.data
  } catch (e) {
    console.error('전체 게시글 불러오기 실패:', e)
    message.error('전체 게시글을 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

// 상태 변경
const changeStatus = async (postId, status) => {
  try {
    await axios.patch('/api/admin/posts/status', { postIds: [postId], status })
    message.success(`게시글 상태가 '${status}'로 변경되었습니다.`)
    fetchAllPosts()
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
    fetchAllPosts()
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
    fetchAllPosts()
  } catch (e) {
    console.error('삭제 실패:', e)
    message.error('게시글 삭제 중 오류가 발생했습니다.')
  }
}

// ====== 필터/정렬/검색 로직 ======
const countStatus = (status) => posts.value.filter(p => p.visibilityStatus === status).length
const filteredPosts = computed(() => {
  let result = [...posts.value]
  if (searchKeyword.value) {
    result = result.filter(
      (p) =>
        p.title?.includes(searchKeyword.value) ||
        p.authorName?.includes(searchKeyword.value)
    )
  }
  if (filterCategory.value) {
    result = result.filter((p) => p.category === filterCategory.value)
  }
  if (activeStatusTab.value !== 'ALL') {
    result = result.filter((p) => p.visibilityStatus === activeStatusTab.value)
  }
  if (filterDateRange.value?.length === 2) {
    const [start, end] = filterDateRange.value
    result = result.filter((p) => {
      const createdAt = new Date(p.createdAt)
      return createdAt >= new Date(start) && createdAt <= new Date(end)
    })
  }
  return result
})
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
const displayPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedPosts.value.slice(start, start + pageSize.value)
})
const handleTableChange = (pagination) => {
  currentPage.value = pagination.current
  pageSize.value = pagination.pageSize
}
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
const resetFilters = () => {
  searchKeyword.value = ''
  filterCategory.value = null
  filterDateRange.value = []
  sortBy.value = 'createdAt-desc'
  currentPage.value = 1
  activeStatusTab.value = 'ALL'
}
const hasActiveFilters = computed(
  () =>
    searchKeyword.value ||
    filterCategory.value ||
    (filterDateRange.value?.length === 2) ||
    sortBy.value !== 'createdAt-desc' ||
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
const setTab = (key) => { activeStatusTab.value = key; currentPage.value = 1 }
const handleTabChange = () => { currentPage.value = 1 }
watch([searchKeyword, filterCategory, filterDateRange, sortBy], () => (currentPage.value = 1))
onMounted(fetchAllPosts)
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

</style>
