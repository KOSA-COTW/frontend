<template>
  <div class="post-list-container">
    <div class="header">
      <h1 class="page-title">글 목록</h1>
      <a-button type="primary" class="write-button" @click="handleWrite">
        <PlusOutlined />
        글쓰기
      </a-button>
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
      <a-select
        v-model:value="selectedCategory"
        placeholder="카테고리 선택"
        style="width: 200px"
        @change="handleCategoryChange"
        allowClear
      >
        <a-select-option value="">전체</a-select-option>
        <a-select-option value="공지사항">공지사항</a-select-option>
        <a-select-option value="자유게시판">자유게시판</a-select-option>
        <a-select-option value="질문답변">질문답변</a-select-option>
        <a-select-option value="정보공유">정보공유</a-select-option>
      </a-select>
    </div>

    <a-table
      :columns="columns"
      :data-source="filteredPosts"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      @change="handleTableChange"
      class="post-table"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
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
          <span v-if="record.commentCount > 0" class="comment-count">
            [{{ record.commentCount }}]
          </span>
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
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

export default {
  name: 'PostListPage',
  components: {
    PlusOutlined
  },
  setup() {
    const loading = ref(false)
    const searchText = ref('')
    const selectedCategory = ref('')

    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `${range[0]}-${range[1]} / 총 ${total}개`
    })

    const columns = [
      {
        title: 'No',
        key: 'index',
        width: 60,
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
        date: new Date('2024-01-15'),
        commentCount: 3
      },
      {
        id: 2,
        category: '장애인',
        title: '서울시 중랑구 해오름지역아동센터 장애 아동들에게 안전한 교통비를',
        author: '홍길동',
        date: new Date('2024-01-14'),
        commentCount: 12
      },
      {
        id: 3,
        category: '어르신',
        title: '부산시 사하구 사랑지역아동센터 어르신들께 건강 검진비를',
        author: '김개발',
        date: new Date('2024-01-13'),
        commentCount: 5
      },
      {
        id: 4,
        category: '동물',
        title: '대전시 서구 아람지역 내 유기동물 보호소에 사료와 의약품을\n',
        author: '이코딩',
        date: new Date('2024-01-12'),
        commentCount: 8
      },
      {
        id: 5,
        category: '환경',
        title: '경기도 수원시 하늘지역 환경 정화 활동에 필요한 물품을',
        author: '박프론트',
        date: new Date('2024-01-11'),
        commentCount: 15
      },
      {
        id: 6,
        category: '지구촌',
        title: '인천시 연수구 드림지역 아이들에게 지구촌 교육 지원을',
        author: '최초보',
        date: new Date('2024-01-10'),
        commentCount: 7
      },
      {
        id: 7,
        category: '공지사항',
        title: '커뮤니티 이용 규칙 안내',
        author: '관리자',
        date: new Date('2024-01-09'),
        commentCount: 2
      },
      {
        id: 8,
        category: '학생',
        title: 'KOSA 602호 학생들에게 간식을',
        author: '정디자인',
        date: new Date('2024-01-08'),
        commentCount: 11
      },
      {
        id: 9,
        category: '생활',
        title: '대구시 달서구 대한교육문화원지역아동센터 아이들 28명에게',
        author: '강모임',
        date: new Date('2024-01-07'),
        commentCount: 9
      },
      {
        id: 10,
        category: '동물',
        title: '강지냥이쉼터',
        author: '윤백엔드',
        date: new Date('2024-01-06'),
        commentCount: 13
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

      pagination.total = filtered.length
      return filtered
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

    const handleWrite = () => {
      message.success('글쓰기 페이지로 이동')
    }

    const handlePostClick = (post) => {
      message.info(`"${post.title}" 게시글 보기`)
    }

    onMounted(() => {
      pagination.total = posts.value.length
    })

    return {
      loading,
      searchText,
      selectedCategory,
      pagination,
      columns,
      filteredPosts,
      getCategoryColor,
      formatDate,
      handleSearch,
      handleCategoryChange,
      handleTableChange,
      handleWrite,
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

.write-button {
  background-color: #00C851;
  border-color: #00C851;
  font-weight: 500;
  height: 40px;
  padding: 0 20px;
}

.write-button:hover,
.write-button:focus {
  background-color: #00A844;
  border-color: #00A844;
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

.comment-count {
  color: #00C851;
  font-weight: 500;
  margin-left: 8px;
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
