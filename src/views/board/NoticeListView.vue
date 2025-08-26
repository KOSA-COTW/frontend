<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { postAPI } from '@/utils/post'

const router = useRouter()
const allNotices = ref([])
const openedId = ref(null)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const isLoading = ref(false)

const auth = useAuthStore()
const { isAdmin } = storeToRefs(auth)

// 전체 공지사항 불러오기
const fetchAllNotices = async () => {
  try {
    isLoading.value = true
    const res = await postAPI.getAllNotices()
    allNotices.value = Array.isArray(res) ? res : res.notices || []
  } catch (e) {
    console.error('공지사항 불러오기 실패:', e)
    allNotices.value = []
  } finally {
    isLoading.value = false
  }
}

// 검색 필터링된 공지사항
const filteredNotices = computed(() => {
  if (!searchKeyword.value.trim()) {
    return allNotices.value
  }

  const keyword = searchKeyword.value.toLowerCase()
  return allNotices.value.filter(
    (notice) =>
      notice.title.toLowerCase().includes(keyword) ||
      notice.content.toLowerCase().includes(keyword),
  )
})

// 고정글과 일반글 분리
const pinnedNotices = computed(() => {
  return filteredNotices.value.filter((notice) => notice.isPinned)
})

const regularNotices = computed(() => {
  return filteredNotices.value.filter((notice) => !notice.isPinned)
})

// 현재 페이지에 표시할 공지사항들
const paginatedNotices = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value

  // 고정글은 항상 상단에, 일반글은 페이징 적용
  let result = []

  if (currentPage.value === 1) {
    // 첫 페이지: 고정글 + 일반글 일부
    const pinnedCount = pinnedNotices.value.length
    const remainingSlots = pageSize.value - pinnedCount

    result = [...pinnedNotices.value, ...regularNotices.value.slice(0, Math.max(0, remainingSlots))]
  } else {
    // 2페이지부터: 일반글만 (고정글 개수만큼 오프셋 조정)
    const pinnedCount = pinnedNotices.value.length
    const adjustedStart = startIndex - pinnedCount
    const adjustedEnd = endIndex - pinnedCount

    if (adjustedStart >= 0) {
      result = regularNotices.value.slice(adjustedStart, adjustedEnd)
    }
  }

  return result
})

// 전체 개수 (필터링된)
const totalCount = computed(() => {
  return filteredNotices.value.length
})

// 총 페이지 수 계산
const totalPages = computed(() => {
  if (totalCount.value === 0) return 1

  const pinnedCount = pinnedNotices.value.length
  const regularCount = regularNotices.value.length

  // 첫 페이지에서 고정글이 차지하는 공간을 고려
  const firstPageRegularSlots = Math.max(0, pageSize.value - pinnedCount)
  const remainingRegular = Math.max(0, regularCount - firstPageRegularSlots)

  const additionalPages = Math.ceil(remainingRegular / pageSize.value)
  return 1 + additionalPages
})

// 페이지 번호 배열 생성
const pageNumbers = computed(() => {
  const pages = []
  const maxVisiblePages = 5
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(totalPages.value, start + maxVisiblePages - 1)

  // 끝에서부터 계산해서 시작점 조정
  if (end - start < maxVisiblePages - 1) {
    start = Math.max(1, end - maxVisiblePages + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// 현재 페이지 아이템들의 전체 순서 번호 계산
const getItemNumber = (index) => {
  if (currentPage.value === 1) {
    return index + 1
  } else {
    const pinnedCount = pinnedNotices.value.length
    const adjustedStart = (currentPage.value - 1) * pageSize.value - pinnedCount
    return pinnedCount + adjustedStart + index + 1
  }
}

// 날짜 포맷
const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return d.toISOString().slice(0, 10)
}

// 토글 (같은 제목 클릭 시 닫힘)
const toggleNotice = (id) => {
  if (openedId.value === id) {
    openedId.value = null
  } else {
    openedId.value = id
  }
}

// 검색 실행
const handleSearch = () => {
  currentPage.value = 1 // 검색 시 첫 페이지로
  openedId.value = null // 열린 공지사항 닫기
}

// 검색어 초기화
const clearSearch = () => {
  searchKeyword.value = ''
  currentPage.value = 1
  openedId.value = null
}

// 페이지 변경
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page
    openedId.value = null // 페이지 변경 시 열린 공지사항 닫기
    // 스크롤을 상단으로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Enter 키로 검색
const handleKeyup = (event) => {
  if (event.key === 'Enter') {
    handleSearch()
  }
}

// 검색어 변경 시 첫 페이지로
watch(searchKeyword, () => {
  currentPage.value = 1
  openedId.value = null
})

// 페이지 크기 변경 감지
watch(pageSize, (newSize) => {
  currentPage.value = 1
  openedId.value = null
})

onMounted(() => {
  fetchAllNotices()
})

// 글쓰기 버튼 클릭 시 이동
const goCreate = () => {
  router.push('/notices/create')
}

// 수정 모달 상태
const showEditModal = ref(false)
const editingId = ref(null)
const editTitle = ref('')
const editContent = ref('')

const openEditModal = (notice) => {
  editingId.value = notice.id
  editTitle.value = notice.title
  editContent.value = notice.content
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingId.value = null
  editTitle.value = ''
  editContent.value = ''
}

const saveEdit = async () => {
  try {
    await postAPI.updateNotice(editingId.value, {
      title: editTitle.value,
      content: editContent.value,
    })
    const target = allNotices.value.find((n) => n.id === editingId.value)
    if (target) {
      target.title = editTitle.value
      target.content = editContent.value
    }
    alert('수정 완료!')
    closeEditModal()
  } catch (e) {
    console.error('공지 수정 실패:', e)
    alert('수정 실패')
  }
}

const deleteNotice = async (id) => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  try {
    await postAPI.deleteNotice(id)
    allNotices.value = allNotices.value.filter((n) => n.id !== id)
    alert('삭제 완료!')
  } catch (e) {
    console.error('공지 삭제 실패:', e)
    alert('삭제 실패')
  }
}
</script>

<template>
  <div class="notice-container">
    <!-- 🔹 상단 헤더 -->
    <div class="notice-header">
      <p class="notice-subtitle">공지사항</p>
      <h1>COTW에서<br />빠르게 새로운 소식을 전합니다.</h1>

      <!-- 검색 영역 -->
      <div class="search-section">
        <div class="search-box">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="공지사항 제목이나 내용을 검색하세요..."
            class="search-input"
            @keyup="handleKeyup"
          />
          <button class="search-btn" @click="handleSearch" :disabled="isLoading">🔍</button>
          <button v-if="searchKeyword" class="clear-btn" @click="clearSearch" title="검색 초기화">
            ✕
          </button>
        </div>
      </div>

      <!-- 관리자 전용 버튼 -->
      <div v-if="isAdmin" class="notice-actions">
        <a-button
          type="primary"
          :style="{ background: '#00C851', borderColor: '#00C851' }"
          @click="goCreate"
        >
          글쓰기
        </a-button>
      </div>
    </div>

    <!-- 🔹 검색 결과 정보 -->
    <div class="search-info" v-if="!isLoading">
      <div class="result-count">
        <span v-if="searchKeyword">
          '<strong>{{ searchKeyword }}</strong
          >' 검색 결과: {{ totalCount }}건
        </span>
        <span v-else> 전체 {{ totalCount }}개의 공지사항 </span>

      </div>

      <!-- 페이지 크기 선택 -->
      <div class="page-size-selector">
        <select v-model="pageSize" class="page-size-select">
          <option value="5">5개씩</option>
          <option value="10">10개씩</option>
          <option value="20">20개씩</option>
          <option value="50">50개씩</option>
        </select>
      </div>
    </div>

    <!-- 🔹 로딩 상태 -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>공지사항을 불러오는 중...</p>
    </div>

    <!-- 🔹 공지 리스트 -->
    <div v-else-if="paginatedNotices.length > 0" class="notice-list">
      <div
        v-for="(notice, idx) in paginatedNotices"
        :key="notice.id"
        class="notice-item"
        :class="{ 'is-open': openedId === notice.id }"
      >
        <div class="notice-header-row" @click="toggleNotice(notice.id)">
          <div class="notice-title">
            <span v-if="notice.isPinned" class="pin-icon">📌</span>
            <span class="notice-number">{{ getItemNumber(idx) }}.</span>
            <span class="notice-text">{{ notice.title }}</span>
          </div>
          <div class="notice-meta">
            <span class="notice-date">{{ formatDate(notice.createdAt) }}</span>
            <span class="toggle-icon" :class="{ rotated: openedId === notice.id }">▼</span>
          </div>
        </div>

        <!-- 본문 영역 -->
        <div v-if="openedId === notice.id" class="notice-content">
          <div class="content-wrapper">
            {{ notice.content }}
            <div v-if="isAdmin" class="admin-actions">
              <button @click.stop="openEditModal(notice)">✏️ 수정</button>
              <button @click.stop="deleteNotice(notice.id)">🗑 삭제</button>
            </div>
          </div>
        </div>

        <!-- 수정 모달 -->
        <div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
          <div class="modal">
            <h2>공지사항 수정</h2>
            <input v-model="editTitle" class="edit-input" placeholder="제목을 입력하세요" />
            <textarea
              v-model="editContent"
              class="edit-textarea"
              placeholder="내용을 입력하세요"
            ></textarea>
            <div class="modal-actions">
              <button class="save-btn" @click="saveEdit">💾 저장</button>
              <button class="cancel-btn" @click="closeEditModal">취소</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🔹 검색 결과 없음 -->
    <div v-else-if="!isLoading" class="no-results">
      <div class="no-results-icon">📭</div>
      <h3>{{ searchKeyword ? '검색 결과가 없습니다' : '등록된 공지사항이 없습니다' }}</h3>
      <p v-if="searchKeyword">다른 검색어로 다시 시도해보세요.</p>
    </div>

    <!-- 🔹 페이징 -->
    <div v-if="totalPages > 1 && !isLoading" class="pagination">
      <!-- 맨 처음 페이지 -->
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(1)">≪</button>

      <!-- 이전 페이지 -->
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        ‹
      </button>

      <!-- 페이지 번호들 -->
      <button
        v-for="page in pageNumbers"
        :key="page"
        class="page-btn"
        :class="{ active: page === currentPage }"
        @click="changePage(page)"
      >
        {{ page }}
      </button>

      <!-- 다음 페이지 -->
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        ›
      </button>

      <!-- 마지막 페이지 -->
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(totalPages)"
      >
        ≫
      </button>
    </div>
  </div>
</template>

<style scoped>
.notice-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 🔹 헤더 */
.notice-header {
  text-align: center;
  margin-bottom: 40px;
}
.notice-subtitle {
  color: #00c851;
  font-weight: bold;
  margin-bottom: 8px;
}
.notice-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 30px;
}

/* 🔹 검색 영역 */
.search-section {
  margin: 30px auto 20px;
  max-width: 500px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 12px 50px 12px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: #00c851;
}

.search-btn {
  position: absolute;
  right: 40px;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.search-btn:hover:not(:disabled) {
  background-color: rgba(0, 200, 81, 0.1);
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #999;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  color: #666;
  background-color: rgba(0, 0, 0, 0.05);
}

.notice-actions {
  margin-top: 20px;
  text-align: right;
}

/* 🔹 검색 정보 */
.search-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.result-count {
  font-size: 0.9rem;
  color: #666;
}

.result-count strong {
  color: #00c851;
}

.pinned-info {
  color: #f59e0b;
  font-size: 0.8rem;
  margin-left: 8px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #666;
}

.page-size-select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  outline: none;
}

.page-size-select:focus {
  border-color: #00c851;
}

/* 🔹 로딩 */
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #00c851;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 🔹 검색 결과 없음 */
.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.no-results h3 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  color: #333;
}

.no-results p {
  margin: 0;
  font-size: 0.9rem;
}

/* 🔹 리스트 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
}

.notice-item {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  transition: all 0.3s ease;
}

.notice-item:hover {
  border-color: #00c851;
  box-shadow: 0 2px 8px rgba(0, 200, 81, 0.1);
}

.notice-item.is-open {
  border-color: #00c851;
  box-shadow: 0 4px 12px rgba(0, 200, 81, 0.15);
}

.notice-item.is-pinned {
  background: linear-gradient(135deg, #fff9e6, #ffffff);
  border-color: #f59e0b;
}

.notice-item.is-pinned:hover {
  border-color: #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

.notice-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.notice-header-row:hover {
  background-color: #f9f9f9;
}

.notice-item.is-open .notice-header-row {
  background-color: #f8fffe;
  border-bottom: 1px solid #e8e8e8;
}

.notice-item.is-pinned.is-open .notice-header-row {
  background-color: #fffbeb;
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.pin-icon {
  font-size: 14px;
  color: #f59e0b;
}

.notice-number {
  font-weight: 600;
  color: #666;
  min-width: 25px;
}

.notice-text {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notice-date {
  font-size: 0.85rem;
  color: #888;
  white-space: nowrap;
}

.toggle-icon {
  font-size: 12px;
  color: #999;
  transition: transform 0.3s ease;
  transform-origin: center;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.notice-content {
  overflow: hidden;
}

.content-wrapper {
  padding: 20px;
  background-color: #fafafa;
  font-size: 0.9rem;
  color: #555;
  line-height: 1.6;
  white-space: pre-wrap;
  border-top: 1px solid #f0f0f0;
}

.notice-item.is-pinned .content-wrapper {
  background-color: #fffbeb;
}

/* 🔹 페이징 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 40px;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  min-width: 40px;
}

.page-btn:hover:not(:disabled):not(.active) {
  border-color: #00c851;
  color: #00c851;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn.active {
  background: #00c851;
  color: white;
  border-color: #00c851;
}

/* 🔹 슬라이드 페이드 애니메이션 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  max-height: 0;
}

.slide-fade-enter-to {
  opacity: 1;
  max-height: 200px;
}

.slide-fade-leave-from {
  opacity: 1;
  max-height: 200px;
}

.slide-fade-leave-to {
  opacity: 0;
  max-height: 0;
}

/* 🔹 반응형 */
@media (max-width: 768px) {
  .search-info {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .pagination {
    gap: 4px;
  }

  .page-btn {
    padding: 6px 10px;
    font-size: 0.85rem;
    min-width: 36px;
  }
}

@media (max-width: 600px) {
  .notice-header-row {
    padding: 12px 16px;
  }

  .notice-title {
    gap: 6px;
  }

  .notice-text {
    font-size: 0.9rem;
  }

  .notice-meta {
    gap: 8px;
  }

  .notice-date {
    font-size: 0.8rem;
  }

  .content-wrapper {
    padding: 16px;
  }

  .search-input {
    padding: 10px 50px 10px 14px;
    font-size: 0.9rem;
  }
}
/* 모달 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;


  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.modal h2 {
  margin-bottom: 16px;
  font-size: 1.2rem;
  font-weight: bold;
}
.edit-input,
.edit-textarea {
  width: 100%;
  padding: 10px;
  margin-bottom: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}
.edit-textarea {
  min-height: 120px;
  resize: vertical;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.save-btn {
  background: #10b981;
  color: white;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.save-btn:hover {
  background: #059669;
}
.cancel-btn {
  background: #e5e7eb;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.cancel-btn:hover {
  background: #d1d5db;
}
.admin-actions {
  margin-top: 16px; /* 본문과 간격 */
  display: flex;
  justify-content: flex-end; /* 왼쪽 정렬 */
  gap: 8px; /* 버튼 사이 간격 */
}

.admin-actions button {
  background: #f1f5f9; /* 연한 배경 */
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-actions button:hover {
  background: #e2e8f0; /* hover 시 약간 진해짐 */
}
</style>
