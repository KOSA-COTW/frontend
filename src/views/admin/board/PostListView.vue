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

    <div class="search-section">
      <a-input-search
        v-model:value="searchText"
        placeholder="제목 또는 내용으로 검색"
        enter-button="검색"
        size="large"
        @search="handleSearch"
        class="search-input"
      />
    </div>

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
          <a-select-option value="학생">학생</a-select-option>
          <a-select-option value="생활">생활</a-select-option>
        </a-select>
        
        <a-button @click="toggleDateSort" class="sort-button">
          날짜순 {{ sortOrder === 'desc' ? '↓' : '↑' }}
        </a-button>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="sortedPosts"
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
            {{ record.category }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'title'">
          <a @click="handlePostClick(record)" class="post-title">
            {{ record.title }}
          </a>
        </template>
        <template v-else-if="column.key === 'date'">
          {{ formatDate(record.date) }}
        </template>
      </template>
    </a-table>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'

export default {
  name: 'AdminPostListPage',
  setup() {
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
        dataIndex: 'author',
        key: 'author',
        width: 120,
        align: 'center'
      },
      {
        title: '날짜',
        dataIndex: 'date',
        key: 'date',
        width: 120,
        align: 'center'
      }
    ]

    // 샘플 데이터
    const posts = ref([
      {
        id: 1,
        category: '아동',
        title: '전라북도 전주시 새누리지역아동센터 아이들 28에게 따뜻한 간식을',
        author: '관리자',
        date: new Date('2024-01-15')
      },
      {
        id: 2,
        category: '장애인',
        title: '서울시 중랑구 해오름지역아동센터 장애 아동들에게 안전한 교통비를',
        author: '홍길동',
        date: new Date('2024-01-14')
      },
      {
        id: 3,
        category: '어르신',
        title: '부산시 사하구 사랑지역아동센터 어르신들께 건강 검진비를',
        author: '김개발',
        date: new Date('2024-01-13')
      },
      {
        id: 4,
        category: '동물',
        title: '대전시 서구 아람지역 내 유기동물 보호소에 사료와 의약품을\n',
        author: '이코딩',
        date: new Date('2024-01-12')
      },
      {
        id: 5,
        category: '환경',
        title: '경기도 수원시 하늘지역 환경 정화 활동에 필요한 물품을',
        author: '박프론트',
        date: new Date('2024-01-11')
      },
      {
        id: 6,
        category: '지구촌',
        title: '인천시 연수구 드림지역 아이들에게 지구촌 교육 지원을',
        author: '최초보',
        date: new Date('2024-01-10')
      },
      {
        id: 7,
        category: '공지사항',
        title: '커뮤니티 이용 규칙 안내',
        author: '관리자',
        date: new Date('2024-01-09')
      },
      {
        id: 8,
        category: '학생',
        title: 'KOSA 602호 학생들에게 간식을',
        author: '정디자인',
        date: new Date('2024-01-08')
      },
      {
        id: 9,
        category: '생활',
        title: '대구시 달서구 대한교육문화원지역아동센터 아이들 28명에게',
        author: '강모임',
        date: new Date('2024-01-07')
      },
      {
        id: 10,
        category: '동물',
        title: '강지냥이쉼터',
        author: '윤백엔드',
        date: new Date('2024-01-06')
      }
    ])

    const filteredPosts = computed(() => {
      let filtered = posts.value

      // 카테고리 필터링
      if (selectedCategory.value) {
        filtered = filtered.filter(post => post.category === selectedCategory.value)
      }

      // 검색 필터링
      if (searchText.value) {
        const search = searchText.value.toLowerCase()
        filtered = filtered.filter(post =>
          post.title.toLowerCase().includes(search) ||
          post.author.toLowerCase().includes(search)
        )
      }

      return filtered
    })

    const sortedPosts = computed(() => {
      const sorted = [...filteredPosts.value]
      sorted.sort((a, b) => {
        if (sortOrder.value === 'desc') {
          return new Date(b.date) - new Date(a.date)
        } else {
          return new Date(a.date) - new Date(b.date)
        }
      })
      
      // 페이지네이션 총 개수 업데이트
      pagination.total = sorted.length
      
      // 최대 10페이지 제한
      const maxTotal = pagination.pageSize * 10
      if (pagination.total > maxTotal) {
        pagination.total = maxTotal
        return sorted.slice(0, maxTotal)
      }
      
      return sorted
    })

    const getCategoryColor = (category) => {
      const colors = {
        '공지사항': '#f50',
        '아동': '#00C851',
        '장애인': '#b6e6fb',
        '어르신': '#bada55',
        '동물': '#ee9120',
        '환경': '#205dee',
        '지구촌': '#2db7f5',
        '학생': '#fbb6b7',
        '생활': '#e9b6fb',
      }
      return colors[category] || '#00C851'
    }

    const formatDate = (date) => {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const handleSearch = (value) => {
      searchText.value = value
      pagination.current = 1
    }

    const handleCategoryChange = () => {
      pagination.current = 1
    }

    const handleTableChange = (pag) => {
      pagination.current = pag.current
      pagination.pageSize = pag.pageSize
    }

    const toggleDateSort = () => {
      sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
      pagination.current = 1
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

    const handlePostClick = (post) => {
      message.info(`"${post.title}" 게시글 보기`)
    }

    onMounted(() => {
      // 초기 데이터 로드 시 정렬된 데이터 기준으로 총 개수 설정
    })

    return {
      loading,
      searchText,
      selectedCategory,
      sortOrder,
      selectedRowKeys,
      pagination,
      columns,
      sortedPosts,
      rowSelection,
      getCategoryColor,
      formatDate,
      handleSearch,
      handleCategoryChange,
      handleTableChange,
      toggleDateSort,
      handleMakePublic,
      handlePostClick
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
