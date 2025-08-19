<template>
  <div class="my-payments">
    <div class="payments-container">
      <div class="page-header">
        <h1>내 후원 내역</h1>
        <p>지금까지의 후원 내역을 확인해보세요.</p>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>후원 내역을 불러오는 중...</p>
      </div>

      <!-- 오류 상태 -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>내역을 불러올 수 없습니다</h3>
        <p>{{ error }}</p>
        <button @click="fetchPayments" class="retry-btn">다시 시도</button>
      </div>

      <!-- 결제 내역이 없는 경우 -->
      <div v-else-if="payments.length === 0" class="empty-state">
        <div class="empty-icon">💝</div>
        <h3>아직 후원 내역이 없습니다</h3>
        <p>따뜻한 마음으로 첫 후원을 시작해보세요!</p>
        <button @click="goToHome" class="cta-btn">후원하러 가기</button>
      </div>

      <!-- 결제 내역 리스트 -->
      <div v-else class="payments-list">
        <!-- 통계 정보 -->
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">총 후원 횟수</span>
            <span class="stat-value">{{ payments.length }}회</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">총 후원 금액</span>
            <span class="stat-value">{{ totalAmount.toLocaleString() }}원</span>
          </div>
        </div>

        <!-- 필터 -->
        <div class="filter-section">
          <select v-model="statusFilter" class="filter-select">
            <option value="">모든 상태</option>
            <option value="DONE">완료</option>
            <option value="CANCELED">취소</option>
            <option value="PARTIAL_CANCELED">부분취소</option>
          </select>

          <select v-model="sortBy" class="filter-select">
            <option value="createdAt_desc">최신순</option>
            <option value="createdAt_asc">오래된순</option>
            <option value="amount_desc">금액 높은순</option>
            <option value="amount_asc">금액 낮은순</option>
          </select>
        </div>

        <!-- 결제 카드 리스트 -->
        <div class="payment-cards">
          <div
            v-for="payment in filteredPayments"
            :key="payment.id"
            class="payment-card"
            :class="getStatusClass(payment.status)"
          >
            <div class="payment-header">
              <div class="payment-info">
                <h3 class="payment-title">{{ payment.orderName }}</h3>
                <p class="payment-date">{{ formatDate(payment.createdAt) }}</p>
              </div>
              <div class="payment-status">
                <span class="status-badge" :class="getStatusClass(payment.status)">
                  {{ getStatusText(payment.status) }}
                </span>
              </div>
            </div>

            <div class="payment-details">
              <div class="detail-row">
                <span class="detail-label">주문번호</span>
                <span class="detail-value">{{ payment.orderId }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">결제 방식</span>
                <span class="detail-value">{{ getPaymentMethodText(payment.type) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">결제 금액</span>
                <span class="detail-value amount">{{ payment.amount.toLocaleString() }}원</span>
              </div>
            </div>

            <!-- 취소/환불 버튼 (필요한 경우) -->
            <div v-if="payment.status === 'DONE'" class="payment-actions">
              <button @click="requestCancel(payment)" class="cancel-btn">결제 취소</button>
            </div>
          </div>
        </div>

        <!-- 페이지네이션 (필요한 경우) -->
        <div v-if="hasMorePages" class="pagination">
          <button @click="loadMore" class="load-more-btn" :disabled="loadingMore">
            {{ loadingMore ? '로딩 중...' : '더보기' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'

const router = useRouter()
const paymentStore = usePaymentStore()

// 데이터
const payments = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const statusFilter = ref('')
const sortBy = ref('createdAt_desc')
const hasMorePages = ref(false)

// 계산된 속성
const totalAmount = computed(() => {
  return payments.value
    .filter((p) => p.status === 'DONE')
    .reduce((sum, payment) => sum + payment.amount, 0)
})

const filteredPayments = computed(() => {
  let filtered = [...payments.value]

  // 상태 필터링
  if (statusFilter.value) {
    filtered = filtered.filter((p) => p.status === statusFilter.value)
  }

  // 정렬
  const [field, order] = sortBy.value.split('_')
  filtered.sort((a, b) => {
    let valueA = a[field]
    let valueB = b[field]

    if (field === 'createdAt') {
      valueA = new Date(valueA)
      valueB = new Date(valueB)
    }

    if (order === 'desc') {
      return valueB > valueA ? 1 : -1
    } else {
      return valueA > valueB ? 1 : -1
    }
  })

  return filtered
})

// 메서드
const fetchPayments = async () => {
  try {
    loading.value = true
    error.value = ''
    await paymentStore.fetchMyPayments()
    payments.value = paymentStore.payments
  } catch (err) {
    error.value = err.message || '후원 내역을 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  // 페이지네이션 구현 (필요한 경우)
  loadingMore.value = true
  try {
    // API 호출로 더 많은 데이터 로드
  } finally {
    loadingMore.value = false
  }
}

const requestCancel = async (payment) => {
  if (confirm('정말로 이 결제를 취소하시겠습니까?')) {
    try {
      // 결제 취소 API 호출
      // await paymentAPI.cancelPayment(payment.paymentKey)
      alert('결제 취소가 요청되었습니다.')
      await fetchPayments() // 목록 새로고침
    } catch (err) {
      alert('결제 취소에 실패했습니다.')
    }
  }
}

const getStatusText = (status) => {
  const statusMap = {
    DONE: '완료',
    CANCELED: '취소',
    PARTIAL_CANCELED: '부분취소',
    ABORTED: '승인실패',
    WAITING_FOR_DEPOSIT: '입금대기',
    IN_PROGRESS: '진행중',
  }
  return statusMap[status] || status
}

const getStatusClass = (status) => {
  const classMap = {
    DONE: 'status-success',
    CANCELED: 'status-canceled',
    PARTIAL_CANCELED: 'status-warning',
    ABORTED: 'status-error',
    WAITING_FOR_DEPOSIT: 'status-pending',
    IN_PROGRESS: 'status-pending',
  }
  return classMap[status] || 'status-default'
}

const getPaymentMethodText = (type) => {
  const typeMap = {
    NORMAL: '일반 결제',
    BILLING: '자동 결제',
    BRANDPAY: '브랜드페이',
  }
  return typeMap[type] || '일반 결제'
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const goToHome = () => {
  router.push('/')
}

// 생명주기
onMounted(() => {
  fetchPayments()
})
</script>

<style scoped>
.my-payments {
  min-height: 100vh;
  background: #f8fafc;
  padding: 20px;
}

.payments-container {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.page-header p {
  font-size: 16px;
  color: #6b7280;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.error-icon,
.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.error-state h3,
.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.error-state p,
.empty-state p {
  color: #6b7280;
  margin-bottom: 24px;
}

.retry-btn,
.cta-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover,
.cta-btn:hover {
  background: #2563eb;
}

.stats-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
}

.filter-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.filter-select {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.payment-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payment-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.payment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.payment-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.payment-date {
  color: #6b7280;
  font-size: 14px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-success {
  background: #dcfce7;
  color: #16a34a;
}

.status-canceled {
  background: #fef2f2;
  color: #dc2626;
}

.status-warning {
  background: #fef3c7;
  color: #d97706;
}

.status-error {
  background: #fef2f2;
  color: #dc2626;
}

.status-pending {
  background: #e0f2fe;
  color: #0369a1;
}

.payment-details {
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: #6b7280;
  font-size: 14px;
}

.detail-value {
  color: #374151;
  font-weight: 500;
}

.detail-value.amount {
  color: #059669;
  font-weight: 600;
  font-size: 16px;
}

.payment-actions {
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.cancel-btn {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #fecaca;
}

.pagination {
  text-align: center;
  margin-top: 32px;
}

.load-more-btn {
  background: #f3f4f6;
  color: #374151;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .my-payments {
    padding: 16px;
  }

  .stats-card {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .filter-section {
    flex-direction: column;
  }

  .payment-header {
    flex-direction: column;
    gap: 12px;
  }

  .payment-title {
    font-size: 16px;
  }
}
</style>
