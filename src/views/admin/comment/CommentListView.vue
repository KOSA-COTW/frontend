<template>
  <div class="comment-list-container">
    <div class="header">
      <h1 class="page-title">관리자 - 댓글 관리</h1>
      <div class="header-actions">
        <a-button type="danger" @click="handleDeleteSelected" class="delete-button">
          선택 삭제
        </a-button>
        <a-button @click="handleResetReports" class="reset-button">
          신고수 초기화
        </a-button>
      </div>
    </div>

    <div class="search-section">
      <a-input-search
        v-model:value="searchText"
        placeholder="내용 또는 작성자로 검색"
        enter-button="검색"
        size="large"
        @search="handleSearch"
        class="search-input"
      />
    </div>

    <div class="filter-section">
      <div class="filter-row">
        <a-button @click="toggleDateSort" class="sort-button">
          날짜순 {{ sortOrder === 'desc' ? '↓' : '↑' }}
        </a-button>
        
        <a-button @click="toggleReportSort" class="sort-button" style="margin-left: 12px">
          신고수순 {{ reportSortOrder === 'desc' ? '↓' : '↑' }}
        </a-button>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="sortedComments"
      :pagination="pagination"
      :loading="loading"
      :row-selection="rowSelection"
      row-key="id"
      @change="handleTableChange"
      class="comment-table"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'id'">
          {{ record.id }}
        </template>
        <template v-else-if="column.key === 'content'">
          <div class="comment-content">
            {{ record.content }}
            <div class="post-info">
              <a-tag size="small" color="blue">
                게시글: {{ record.postTitle }}
              </a-tag>
            </div>
          </div>
        </template>
        <template v-else-if="column.key === 'reportCount'">
          <a-badge 
            :count="record.reportCount" 
            :number-style="{ backgroundColor: record.reportCount > 0 ? '#f5222d' : '#52c41a' }"
            show-zero
          />
        </template>
        <template v-else-if="column.key === 'date'">
          {{ formatDate(record.date) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a-button 
              type="text" 
              danger 
              size="small" 
              @click="handleDeleteComment(record)"
            >
              삭제
            </a-button>
            <a-button 
              type="text" 
              size="small" 
              @click="handleResetReport(record)"
              :disabled="record.reportCount === 0"
            >
              신고 초기화
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'

export default {
  name: 'AdminCommentListView',
  setup() {
    const loading = ref(false)
    const searchText = ref('')
    const sortOrder = ref('desc') // 날짜 정렬
    const reportSortOrder = ref('desc') // 신고수 정렬
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
        title: '내용',
        dataIndex: 'content',
        key: 'content',
        ellipsis: true,
        width: '40%'
      },
      {
        title: '작성자',
        dataIndex: 'author',
        key: 'author',
        width: 120,
        align: 'center'
      },
      {
        title: '신고수',
        dataIndex: 'reportCount',
        key: 'reportCount',
        width: 100,
        align: 'center'
      },
      {
        title: '작성일',
        dataIndex: 'date',
        key: 'date',
        width: 120,
        align: 'center'
      },
      {
        title: '작업',
        key: 'actions',
        width: 150,
        align: 'center'
      }
    ]

    // 샘플 댓글 데이터
    const comments = ref([
      {
        id: 1,
        content: '정말 좋은 기부 프로젝트네요! 응원합니다.',
        author: '김기부',
        reportCount: 0,
        date: new Date('2024-01-15'),
        postTitle: '전라북도 전주시 새누리지역아동센터 아이들에게...'
      },
      {
        id: 2,
        content: '이런 사기 프로젝트를 왜 승인했나요? 신고합니다!',
        author: '악성유저',
        reportCount: 15,
        date: new Date('2024-01-14'),
        postTitle: '서울시 중랑구 해오름지역아동센터 장애 아동들에게...'
      },
      {
        id: 3,
        content: '저희 지역에도 이런 센터가 있었으면 좋겠어요.',
        author: '이웃사랑',
        reportCount: 1,
        date: new Date('2024-01-13'),
        postTitle: '부산시 사하구 사랑지역아동센터 어르신들께...'
      },
      {
        id: 4,
        content: '욕설이 포함된 부적절한 댓글입니다. [욕설]',
        author: '문제댓글',
        reportCount: 8,
        date: new Date('2024-01-12'),
        postTitle: '대전시 서구 아람지역 내 유기동물 보호소에...'
      },
      {
        id: 5,
        content: '기부 완료했습니다. 좋은 일에 사용되길 바라요.',
        author: '따뜻한마음',
        reportCount: 0,
        date: new Date('2024-01-11'),
        postTitle: '경기도 수원시 하늘지역 환경 정화 활동에...'
      },
      {
        id: 6,
        content: '스팸성 광고 댓글입니다. 여기서 돈벌기 클릭!',
        author: '스팸계정',
        reportCount: 12,
        date: new Date('2024-01-10'),
        postTitle: '인천시 연수구 드림지역 아이들에게...'
      },
      {
        id: 7,
        content: '감동적인 프로젝트네요. 많은 도움이 되길!',
        author: '자원봉사자',
        reportCount: 0,
        date: new Date('2024-01-09'),
        postTitle: 'KOSA 602호 학생들에게 간식을'
      },
      {
        id: 8,
        content: '개인정보를 요구하는 의심스러운 댓글',
        author: '의심계정',
        reportCount: 6,
        date: new Date('2024-01-08'),
        postTitle: '대구시 달서구 대한교육문화원지역아동센터...'
      },
      {
        id: 9,
        content: '좋은 취지의 프로젝트 같네요. 참여하고 싶습니다.',
        author: '참여희망',
        reportCount: 0,
        date: new Date('2024-01-07'),
        postTitle: '강지냥이쉼터'
      },
      {
        id: 10,
        content: '이런 허위 정보로 기부금을 모으면 안 되죠!',
        author: '비판적시각',
        reportCount: 3,
        date: new Date('2024-01-06'),
        postTitle: '전라북도 전주시 새누리지역아동센터 아이들에게...'
      }
    ])

    const filteredComments = computed(() => {
      let filtered = comments.value

      // 검색 필터링
      if (searchText.value) {
        const search = searchText.value.toLowerCase()
        filtered = filtered.filter(comment =>
          comment.content.toLowerCase().includes(search) ||
          comment.author.toLowerCase().includes(search)
        )
      }

      return filtered
    })

    const sortedComments = computed(() => {
      const sorted = [...filteredComments.value]
      
      // 신고수 정렬이 우선
      if (reportSortOrder.value) {
        sorted.sort((a, b) => {
          if (reportSortOrder.value === 'desc') {
            return b.reportCount - a.reportCount
          } else {
            return a.reportCount - b.reportCount
          }
        })
      } else {
        // 날짜 정렬
        sorted.sort((a, b) => {
          if (sortOrder.value === 'desc') {
            return new Date(b.date) - new Date(a.date)
          } else {
            return new Date(a.date) - new Date(b.date)
          }
        })
      }
      
      pagination.total = sorted.length
      
      // 최대 10페이지 제한
      const maxTotal = pagination.pageSize * 10
      if (pagination.total > maxTotal) {
        pagination.total = maxTotal
        return sorted.slice(0, maxTotal)
      }
      
      return sorted
    })

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

    const handleTableChange = (pag) => {
      pagination.current = pag.current
      pagination.pageSize = pag.pageSize
    }

    const toggleDateSort = () => {
      sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
      reportSortOrder.value = null // 날짜 정렬 시 신고수 정렬 해제
      pagination.current = 1
    }

    const toggleReportSort = () => {
      reportSortOrder.value = reportSortOrder.value === 'desc' ? 'asc' : 'desc'
      pagination.current = 1
    }

    const handleDeleteComment = (comment) => {
      message.success(`댓글 ID ${comment.id} 삭제 완료`)
      // TODO: 실제 삭제 API 호출
    }

    const handleResetReport = (comment) => {
      message.success(`댓글 ID ${comment.id}의 신고수를 초기화했습니다`)
      comment.reportCount = 0
      // TODO: 실제 신고수 초기화 API 호출
    }

    const handleDeleteSelected = () => {
      if (selectedRowKeys.value.length === 0) {
        message.warning('삭제할 댓글을 선택해주세요.')
        return
      }
      message.success(`${selectedRowKeys.value.length}개 댓글을 삭제했습니다.`)
      selectedRowKeys.value = []
      // TODO: 실제 일괄 삭제 API 호출
    }

    const handleResetReports = () => {
      if (selectedRowKeys.value.length === 0) {
        message.warning('신고수를 초기화할 댓글을 선택해주세요.')
        return
      }
      selectedRowKeys.value.forEach(id => {
        const comment = comments.value.find(c => c.id === id)
        if (comment) comment.reportCount = 0
      })
      message.success(`${selectedRowKeys.value.length}개 댓글의 신고수를 초기화했습니다.`)
      selectedRowKeys.value = []
      // TODO: 실제 일괄 신고수 초기화 API 호출
    }

    const rowSelection = {
      selectedRowKeys: selectedRowKeys,
      onChange: (newSelectedRowKeys) => {
        selectedRowKeys.value = newSelectedRowKeys
      }
    }

    return {
      loading,
      searchText,
      sortOrder,
      reportSortOrder,
      selectedRowKeys,
      pagination,
      columns,
      sortedComments,
      rowSelection,
      formatDate,
      handleSearch,
      handleTableChange,
      toggleDateSort,
      toggleReportSort,
      handleDeleteComment,
      handleResetReport,
      handleDeleteSelected,
      handleResetReports
    }
  }
}
</script>

<style scoped>
.comment-list-container {
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

.delete-button {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
  font-weight: 500;
  height: 40px;
  padding: 0 20px;
}

.delete-button:hover,
.delete-button:focus {
  background-color: #ff7875;
  border-color: #ff7875;
  color: white;
}

.reset-button {
  background-color: #faad14;
  border-color: #faad14;
  color: white;
  font-weight: 500;
  height: 40px;
  padding: 0 20px;
}

.reset-button:hover,
.reset-button:focus {
  background-color: #ffc53d;
  border-color: #ffc53d;
  color: white;
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

.comment-table {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comment-table .ant-table-thead > tr > th {
  background-color: #fafafa;
  font-weight: 600;
  color: #262626;
  border-bottom: 2px solid #00C851;
}

.comment-table .ant-table-tbody > tr:hover > td {
  background-color: #f6ffed;
}

.comment-content {
  line-height: 1.5;
}

.post-info {
  margin-top: 8px;
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

.ant-input:focus,
.ant-input-focused {
  border-color: #00C851;
  box-shadow: 0 0 0 2px rgba(0, 200, 81, 0.2);
}
</style>