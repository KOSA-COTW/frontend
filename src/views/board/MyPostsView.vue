<template>
  <div class="my-posts">
    <div class="header">
      <h2>내 게시글</h2>
      <div class="stats">
        <span>총 {{ totalPosts }}개의 게시글</span>
        <span class="divider">|</span>
        <span style="color: #00c851">공개 {{ approvedCount }}개</span>
        <span class="divider">|</span>
        <span style="color: #ff4d4f">비공개 {{ privateCount }}개</span>
        <span class="divider">|</span>
        <span style="color: #faad14">승인 대기 {{ pendingCount }}개</span>
        <span class="divider">|</span>
        <span style="color: #8c8c8c">반려됨 {{ rejectedCount }}개</span>
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
          @change="handleSearchChange"
          allow-clear
        />
      </div>

      <div class="filter-area">
        <a-select
          v-model:value="statusFilter"
          placeholder="상태 필터"
          style="width: 140px"
          @change="handleFilter"
          allow-clear
        >
          <a-select-option value="APPROVED">공개</a-select-option>
          <a-select-option value="PRIVATE">비공개</a-select-option>
          <a-select-option value="PENDING">승인 대기</a-select-option>
          <a-select-option value="REJECTED">반려됨</a-select-option>
        </a-select>

        <a-select
          v-model:value="sortBy"
          style="width: 140px; margin-left: 8px"
          @change="handleSort"
        >
          <a-select-option value="createdAt-desc">최신순</a-select-option>
          <a-select-option value="createdAt-asc">오래된순</a-select-option>
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
      :data-source="displayPosts"
      :loading="loading"
      row-key="id"
      bordered
      :pagination="paginationConfig"
      @change="handleTableChange"
      :scroll="{ x: 600 }"
    >
      <a-table-column title="번호" key="index" width="60" align="center">
        <template #default="{ record, index }">
          {{ (currentPage - 1) * pageSize + index + 1 }}
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
    <div v-if="!loading && displayPosts.length === 0" class="empty-state">
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
import { postAPI } from '@/utils/post'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 반응형 데이터
const posts = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref(undefined)
const sortBy = ref('createdAt-desc')
const currentPage = ref(1)
const pageSize = ref(10)

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

const filteredPosts = computed(() => {
  let result = [...posts.value]

  // 검색
  if (searchKeyword.value) {
    result = result.filter((post) =>
      post.title?.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  // 상태 필터
  if (statusFilter.value) {
    result = result.filter((post) => post.visibilityStatus === statusFilter.value)
  }

  return result
})

// 정렬된 게시글 계산
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
      valueA = valueA.toLowerCase()
      valueB = valueB.toLowerCase()
    }

    if (order === 'asc') {
      return valueA > valueB ? 1 : -1
    } else {
      return valueA < valueB ? 1 : -1
    }
  })

  return result
})

// 페이지네이션을 위한 표시될 게시글
const displayPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedPosts.value.slice(start, end)
})

// 통계 계산
const totalPosts = computed(() => posts.value.length)

const approvedCount = computed(
  () => posts.value.filter((post) => post.visibilityStatus === 'APPROVED').length,
)

const privateCount = computed(
  () => posts.value.filter((post) => post.visibilityStatus === 'PRIVATE').length,
)

const pendingCount = computed(
  () => posts.value.filter((post) => post.visibilityStatus === 'PENDING').length,
)

const rejectedCount = computed(
  () => posts.value.filter((post) => post.visibilityStatus === 'REJECTED').length,
)

// 활성화된 필터가 있는지 확인
const hasActiveFilters = computed(() => {
  return searchKeyword.value || statusFilter.value || sortBy.value !== 'createdAt-desc'
})

// 페이지네이션 설정
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

// 메서드
const fetchMyPosts = async () => {
  loading.value = true
  try {
    posts.value = await postAPI.getMyPosts()
  } catch (e) {
    console.error('내 게시글 불러오기 실패:', e)
    message.error('게시글을 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSearchChange = (e) => {
  if (!e.target.value) {
    currentPage.value = 1
  }
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleSort = () => {
  currentPage.value = 1
}

const handleTableChange = (pagination, filters, sorter) => {
  currentPage.value = pagination.current
  pageSize.value = pagination.pageSize
}

const resetFilters = () => {
  searchKeyword.value = ''
  statusFilter.value = undefined
  sortBy.value = 'createdAt-desc'
  currentPage.value = 1
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
    await postAPI.deletePost(postId)
    posts.value = posts.value.filter((post) => post.id !== postId)
    message.success('게시글이 삭제되었습니다.')
  } catch (e) {
    console.error('게시글 삭제 실패:', e)
    message.error('게시글 삭제 중 오류가 발생했습니다.')
  }
}

const requestApproval = async (postId) => {
  try {
    await postAPI.requestApproval(postId)
    message.success('승인 요청 완료!')
    fetchMyPosts()
  } catch (e) {
    console.error('승인 요청 실패:', e)
    message.error('승인 요청 중 오류가 발생했습니다.')
  }
}

const cancelApproval = async (postId) => {
  try {
    await postAPI.cancelApproval(postId)
    message.info('승인 요청이 취소되었습니다.')
    fetchMyPosts()
  } catch (e) {
    console.error('승인 취소 실패:', e)
    message.error('승인 취소 중 오류가 발생했습니다.')
  }
}

// 필터나 검색이 변경될 때 첫 페이지로 이동
watch([searchKeyword, statusFilter], () => {
  currentPage.value = 1
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
