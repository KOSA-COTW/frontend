<template>
  <div class="my-posts">
    <div class="header">
      <h2>내 게시글</h2>
      <div class="stats">
        <span>총 {{ totalElements }}개의 게시글</span>
      </div>
    </div>

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
        <a-select
          v-model:value="statusFilter"
          placeholder="상태 필터"
          style="width: 140px"
          allow-clear
        >
          <a-select-option value="APPROVED">공개</a-select-option>
          <a-select-option value="PRIVATE">비공개</a-select-option>
          <a-select-option value="PENDING">승인 대기</a-select-option>
          <a-select-option value="REJECTED">반려됨</a-select-option>
        </a-select>

        <a-select
          v-model:value="categoryFilter"
          placeholder="카테고리"
          style="width: 120px; margin-left: 8px"
          allow-clear
        >
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

    <!-- 테이블 -->
    <a-table
      :data-source="posts"
      :loading="loading"
      row-key="id"
      bordered
      :pagination="paginationConfig"
      @change="handleTableChange"
      :scroll="{ x: 600 }"
    >
      <a-table-column title="번호" key="index" width="60" align="center">
        <template #default="{ record, index }">
          {{ (currentPage - 1) * limit + index + 1 }}
        </template>
      </a-table-column>

      <a-table-column title="제목" dataIndex="title" key="title" :ellipsis="true">
        <template #default="{ record }">
          <a-tooltip :title="record.title" placement="topLeft">
            <span
              class="title-link"
              @click="viewPost(record.id)"
              :style="{
                cursor: 'pointer',
                color: '#1890ff',
                textDecoration: 'underline',
              }"
            >
              {{ record.title }}
            </span>
          </a-tooltip>
        </template>
      </a-table-column>

      <a-table-column title="상태" key="visibilityStatus" width="120" align="center">
        <template #default="{ record }">
          <a-tooltip
            v-if="record.visibilityStatus === 'REJECTED' && record.rejectionReason"
            :title="`반려 사유: ${record.rejectionReason}`"
            placement="top"
          >
            <a-tag color="gray">반려됨</a-tag>
          </a-tooltip>
          <a-tag v-else :color="getStatusTag(record.visibilityStatus).color">
            {{ getStatusTag(record.visibilityStatus).label }}
          </a-tag>
        </template>
      </a-table-column>

      <a-table-column
        title="작성일"
        dataIndex="createdAt"
        key="createdAt"
        width="120"
        align="center"
      >
        <template #default="{ record }">
          <a-tooltip :title="formatFullDate(record.createdAt)" placement="top">
            {{ formatDate(record.createdAt) }}
          </a-tooltip>
        </template>
      </a-table-column>

      <a-table-column title="마감일" key="deadline" width="140" align="center">
        <template #default="{ record }">
          <span>
            <!-- {{ formatDate(record.deadline) }} -->
            <span v-if="record.daysLeft > 0"> {{ formatDate(record.deadline) }}</span>
            <span v-else style="color: #ff4d4f"> (마감)</span>
          </span>
        </template>
      </a-table-column>

      <a-table-column title="달성률" key="percent" width="100" align="center">
        <template #default="{ record }">
          <a-progress
            :percent="record.percent"
            size="small"
            :status="record.percent >= 100 ? 'success' : 'active'"
          />
        </template>
      </a-table-column>

      <a-table-column title="작업" key="actions" width="80" align="center" :fixed="'right'">
        <template #default="{ record }">
          <a-dropdown trigger="click">
            <a-button type="text" size="small">
              <template #icon>
                <span style="font-size: 16px; cursor: pointer">⋮</span>
              </template>
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="editPost(record.id)">✏️ 수정</a-menu-item>
                <a-menu-item danger @click="deletePost(record.id)">🗑️ 삭제</a-menu-item>

                <a-menu-divider />

                <!-- 승인 요청 -->
                <a-menu-item
                  v-if="['PRIVATE', 'REJECTED'].includes(record.visibilityStatus)"
                  @click="requestApproval(record.id)"
                >
                  📢 승인 요청
                </a-menu-item>

                <!-- 승인 취소 -->
                <a-menu-item
                  v-if="record.visibilityStatus === 'PENDING'"
                  @click="cancelApproval(record.id)"
                >
                  ❌ 요청 취소
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </a-table-column>
    </a-table>

    <!-- 빈 상태 -->
    <div v-if="!loading && posts.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-text">
        <template v-if="hasActiveFilters"> 검색 조건에 맞는 게시글이 없습니다. </template>
        <template v-else> 작성한 게시글이 없습니다. </template>
      </div>
      <a-button
        v-if="hasActiveFilters"
        type="primary"
        @click="resetFilters"
        style="margin-top: 12px"
      >
        전체 게시글 보기
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from '@/utils/axios'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 반응형 데이터
const posts = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref(undefined)
const categoryFilter = ref(undefined)
const sortBy = ref('date-desc')
const currentPage = ref(1)
const limit = ref(10)
const totalPages = ref(0)
const totalElements = ref(0)
const hasNext = ref(false)
const hasPrevious = ref(false)

const getStatusTag = (status) => {
  switch (status) {
    case 'APPROVED':
      return { color: 'green', label: '공개' }
    case 'PRIVATE':
      return { color: 'red', label: '비공개' }
    case 'PENDING':
      return { color: 'orange', label: '승인 대기' }
    case 'REJECTED':
      return { color: 'gray', label: '반려됨' }
    default:
      return { color: 'default', label: status }
  }
}

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

// 활성화된 필터가 있는지 확인
const hasActiveFilters = computed(() => {
  return searchKeyword.value || statusFilter.value || categoryFilter.value || sortBy.value !== 'date-desc'
})

// 페이지네이션 설정
const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: limit.value,
  total: totalElements.value,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `${range[0]}-${range[1]} / 총 ${total}개`,
  pageSizeOptions: ['10', '20', '50'],
  size: 'default',
}))

// 메서드
const fetchMyPosts = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: limit.value,
      sortBy: sortBy.value.split('-')[0],
      sortDirection: sortBy.value.split('-')[1]
    }
    
    if (statusFilter.value) {
      params.visibility = statusFilter.value
    }
    
    if (categoryFilter.value) {
      params.category = getCategoryEnum(categoryFilter.value)
    }
    
    if (searchKeyword.value) {
      params.title = searchKeyword.value
    }
    
    const res = await axios.get('/api/posts/me', { params })
    
    posts.value = res.posts
    totalPages.value = res.totalPages
    totalElements.value = res.totalElements
    hasNext.value = res.hasNext
    hasPrevious.value = res.hasPrevious
    
  } catch (e) {
    console.error('내 게시글 불러오기 실패:', e)
    message.error('게시글을 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchMyPosts()
}

const handleTableChange = (pagination, filters, sorter) => {
  currentPage.value = pagination.current
  limit.value = pagination.pageSize
  fetchMyPosts()
}

const resetFilters = () => {
  searchKeyword.value = ''
  statusFilter.value = undefined
  categoryFilter.value = undefined
  sortBy.value = 'date-desc'
  currentPage.value = 1
  fetchMyPosts()
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

const formatFullDate = (dateString) => {
  return new Date(dateString).toLocaleString('ko-KR')
}

const viewPost = (postId) => {
  // 게시글 보기 로직
  router.push({ name: 'postDetail', params: { id: postId } })
}

const editPost = (postId) => {
  // 게시글 수정 로직
  router.push({ name: 'postEdit', params: { id: postId } })
}

const deletePost = async (postId) => {
  try {
    await axios.delete(`/api/posts/${postId}`)
    message.success('게시글이 삭제되었습니다.')
    fetchMyPosts()
  } catch (e) {
    console.error('게시글 삭제 실패:', e)
    if (e?.response?.data?.message === '결제내역이 있는 게시물은 삭제할 수 없습니다.') {
      message.warning('결제 내역이 있는 게시글은 삭제할 수 없습니다.')
    } else {
      message.error(e?.response?.data?.message || '게시글 삭제 중 오류가 발생했습니다.')
    }
  }
}

const requestApproval = async (postId) => {
  try {
    await axios.post(`/api/posts/${postId}/request-approval`)
    message.success('승인 요청 완료!')
    fetchMyPosts()
  } catch (e) {
    console.error('승인 요청 실패:', e)
    message.error('승인 요청 중 오류가 발생했습니다.')
  }
}

const cancelApproval = async (postId) => {
  try {
    await axios.post(`/api/posts/${postId}/cancel-approval`)
    message.info('승인 요청이 취소되었습니다.')
    fetchMyPosts()
  } catch (e) {
    console.error('승인 취소 실패:', e)
    message.error('승인 취소 중 오류가 발생했습니다.')
  }
}

// 필터가 변경될 때 데이터 다시 로드
watch([statusFilter, categoryFilter, sortBy], () => {
  fetchMyPosts()
})

// 검색어 변경 시에만 페이지 초기화
watch(searchKeyword, () => {
  if (searchKeyword.value === '') {
    currentPage.value = 1
    fetchMyPosts()
  }
})

onMounted(fetchMyPosts)
</script>

<style scoped>
.my-posts {
  padding: 24px;
  background: #fff;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #262626;
}

.stats {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
}

.divider {
  margin: 0 12px;
  color: #d9d9d9;
}

.search-filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 16px;
}

.search-area {
  flex: 1;
  min-width: 300px;
}

.filter-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.title-link:hover {
  color: #40a9ff !important;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: #666;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .my-posts {
    padding: 16px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .stats {
    font-size: 12px;
  }

  .search-filter-section {
    flex-direction: column;
    align-items: stretch;
  }

  .search-area {
    min-width: auto;
  }

  .search-area input {
    width: 100% !important;
  }

  .filter-area {
    justify-content: flex-start;
  }

  .filter-area > * {
    flex: 1;
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .filter-area {
    flex-direction: column;
  }

  .filter-area > * {
    width: 100%;
    min-width: auto;
  }
}
</style>
