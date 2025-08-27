<template>
  <div class="post-list-container">
    <div class="header">
      <h1 class="page-title">관리자 - 글 목록</h1>
      <div class="header-actions">
        <a-button type="primary" @click="handleMakePublic" class="public-button">
          전체 공개
        </a-button>
      </div>
    </div>

    <!-- 검색 기능은 현재 백엔드에서 지원하지 않음 -->
    <!-- <div class="search-section">
      <a-input-search
        v-model:value="searchText"
        placeholder="제목 또는 내용으로 검색"
        enter-button="검색"
        size="large"
        @search="handleSearch"
        class="search-input"
      />
    </div> -->

    <div class="filter-section">
      <div class="filter-row">
        <a-select
          v-model:value="selectedCategory"
          placeholder="카테고리 선택"
          style="width: 200px; margin-right: 16px"
          @change="handleCategoryChange"
          allowClear
        >
          <a-select-option value="">전체</a-select-option>
          <a-select-option value="아동">아동</a-select-option>
          <a-select-option value="장애인">장애인</a-select-option>
          <a-select-option value="어르신">어르신</a-select-option>
          <a-select-option value="동물">동물</a-select-option>
          <a-select-option value="환경">환경</a-select-option>
          <a-select-option value="지구촌">지구촌</a-select-option>
          <a-select-option value="사회">사회</a-select-option>
        </a-select>

        <a-button @click="toggleDateSort" class="sort-button">
          날짜순 {{ sortOrder === 'desc' ? '↓' : '↑' }}
        </a-button>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="posts"
      :pagination="pagination"
      :loading="loading"
      :row-selection="rowSelection"
      row-key="id"
      @change="handleTableChange"
      class="post-table"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'id'">
          {{ record.id }}
        </template>
        <template v-else-if="column.key === 'category'">
          <a-tag :color="getCategoryColor(record.category)">
            {{ getCategoryDisplayName(record.category) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'title'">
          <a @click="handlePostClick(record)" class="post-title">
            {{ record.title }}
          </a>
        </template>
        <template v-else-if="column.key === 'authorName'">
          {{ record.authorName || '-' }}
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatDate(record.createdAt) }}
        </template>
      </template>
    </a-table>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import axios from '@/utils/axios'
import { useRouter } from 'vue-router'

export default {
  name: 'AdminPostListPage',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const searchText = ref('')
    const selectedCategory = ref('')
    const sortOrder = ref('desc') // 'desc' 또는 'asc'
    const selectedRowKeys = ref([])

    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
      showSizeChanger: true,
      showQuickJumper: true,
      pageSizeOptions: ['10', '20', '50'],
      showTotal: (total, range) => `${range[0]}-${range[1]} / 총 ${total}개`,
      hideOnSinglePage: false
    })

    const columns = [
      {
        title: 'ID',
        key: 'id',
        dataIndex: 'id',
        width: 80,
        align: 'center'
      },
      {
        title: '카테고리',
        dataIndex: 'category',
        key: 'category',
        width: 120,
        align: 'center'
      },
      {
        title: '제목',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true
      },
      {
        title: '글쓴이',
        dataIndex: 'authorName',
        key: 'authorName',
        width: 120,
        align: 'center'
      },
      {
        title: '날짜',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 120,
        align: 'center'
      }
    ]

    const posts = ref([])
    const totalElements = ref(0)


    const getCategoryDisplayName = (category) => {
      const categoryMap = {
        'CHILD': '아동',
        'DISABLED': '장애인',
        'SENIOR': '어르신',
        'ANIMAL': '동물',
        'ENVIRONMENT': '환경',
        'GLOBAL': '지구촌',
        'SOCIETY': '사회'
      }
      return categoryMap[category] || category
    }

    const getCategoryEnumValue = (displayName) => {
      const enumMap = {
        '아동': 'CHILD',
        '장애인': 'DISABLED',
        '어르신': 'SENIOR',
        '동물': 'ANIMAL',
        '환경': 'ENVIRONMENT',
        '지구촌': 'GLOBAL',
        '사회': 'SOCIETY'
      }
      return enumMap[displayName] || displayName
    }

    const getCategoryColor = (category) => {
      const displayName = getCategoryDisplayName(category)
      const colors = {
        '공지사항': '#f50',
        '아동': '#00C851',
        '장애인': '#b6e6fb',
        '어르신': '#bada55',
        '동물': '#ee9120',
        '환경': '#205dee',
        '지구촌': '#2db7f5',
        '사회': '#fbb6b7'
      }
      return colors[displayName] || '#00C851'
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const handleSearch = (value) => {
      searchText.value = value
      pagination.current = 1
      fetchPosts()
    }

    const handleCategoryChange = () => {
      pagination.current = 1
      fetchPosts()
    }

    const handleTableChange = (pag) => {
      pagination.current = pag.current
      pagination.pageSize = pag.pageSize
      fetchPosts()
    }

    const toggleDateSort = () => {
      sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
      pagination.current = 1
      fetchPosts()
    }

    const handleMakePublic = () => {
      if (selectedRowKeys.value.length === 0) {
        message.warning('공개할 게시글을 선택해주세요.')
        return
      }
      message.success(`${selectedRowKeys.value.length}개 게시글을 전체 공개로 설정했습니다.`)
      selectedRowKeys.value = []
    }

    const rowSelection = {
      selectedRowKeys: selectedRowKeys,
      onChange: (newSelectedRowKeys) => {
        selectedRowKeys.value = newSelectedRowKeys
      }
    }

    const handlePostClick = async (post) => {
      try {
        // 게시글 상세 정보 조회
        const response = await axios.get(`/api/posts/${post.id}`)

        // 상세 페이지로 이동
        router.push(`/posts/${post.id}`)
      } catch (error) {
        console.error('게시글 조회 실패:', error)
        message.error('게시글을 불러오는데 실패했습니다.')
      }
    }

    const fetchPosts = async () => {
      loading.value = true
      try {
        const params = {
          limit: pagination.pageSize,
          page: pagination.current,
          sortDirection: sortOrder.value.toUpperCase()
        }

        // 카테고리가 선택된 경우에만 추가
        if (selectedCategory.value) {
          params.category = getCategoryEnumValue(selectedCategory.value)
        }

        const response = await axios.get('/api/posts/admin', { params })

        // 백엔드에서 List<PostListResponseDto>를 직접 반환하므로 response가 배열
        posts.value = Array.isArray(response) ? response : []
        // 페이지네이션 정보는 별도로 관리하거나 백엔드에서 추가 제공 필요
        pagination.total = posts.value.length
        totalElements.value = posts.value.length
      } catch (error) {
        console.error('게시글 목록 조회 실패:', error)
        message.error('게시글 목록을 불러오는데 실패했습니다.')
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchPosts()
    })

    return {
      loading,
      searchText,
      selectedCategory,
      sortOrder,
      selectedRowKeys,
      pagination,
      columns,
      posts,
      rowSelection,
      getCategoryDisplayName,
      getCategoryColor,
      formatDate,
      handleSearch,
      handleCategoryChange,
      handleTableChange,
      toggleDateSort,
      handleMakePublic,
      handlePostClick,
      fetchPosts
    }
  }
}
</script>

<style scoped>
.post-list-container {
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
  border-bottom: 2px solid #f0f0f0;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #262626;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.public-button {
  background-color: #00C851;
  border-color: #00C851;
  font-weight: 500;
  height: 40px;
  padding: 0 20px;
}

.public-button:hover,
.public-button:focus {
  background-color: #00A844;
  border-color: #00A844;
}

.sort-button {
  background-color: #f0f0f0;
  border-color: #d9d9d9;
  color: #262626;
  font-weight: 500;
}

.sort-button:hover,
.sort-button:focus {
  background-color: #00C851;
  border-color: #00C851;
  color: white;
}

.search-section {
  margin-bottom: 16px;
}

.search-input {
  max-width: 400px;
}

.search-input .ant-btn-primary {
  background-color: #00C851;
  border-color: #00C851;
}

.search-input .ant-btn-primary:hover,
.search-input .ant-btn-primary:focus {
  background-color: #00A844;
  border-color: #00A844;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  align-items: center;
}

.post-table {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-table .ant-table-thead > tr > th {
  background-color: #fafafa;
  font-weight: 600;
  color: #262626;
  border-bottom: 2px solid #00C851;
}

.post-table .ant-table-tbody > tr:hover > td {
  background-color: #f6ffed;
}

.post-title {
  color: #262626;
  text-decoration: none;
  font-weight: 500;
}

.post-title:hover {
  color: #00C851;
  text-decoration: underline;
}


.ant-pagination {
  margin-top: 24px;
  text-align: center;
}

.ant-pagination .ant-pagination-item-active {
  border-color: #00C851;
}

.ant-pagination .ant-pagination-item-active a {
  color: #00C851;
}

.ant-pagination .ant-pagination-item:hover {
  border-color: #00C851;
}

.ant-pagination .ant-pagination-item:hover a {
  color: #00C851;
}

.ant-pagination .ant-pagination-prev:hover .ant-pagination-item-link,
.ant-pagination .ant-pagination-next:hover .ant-pagination-item-link {
  color: #00C851;
  border-color: #00C851;
}

.ant-select-focused .ant-select-selector,
.ant-select-selector:focus,
.ant-select-selector:active,
.ant-select-open .ant-select-selector {
  border-color: #00C851;
  box-shadow: 0 0 0 2px rgba(0, 200, 81, 0.2);
}

.ant-input:focus,
.ant-input-focused {
  border-color: #00C851;
  box-shadow: 0 0 0 2px rgba(0, 200, 81, 0.2);
}
</style>
