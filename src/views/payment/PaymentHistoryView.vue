<template>
  <div class="payment-history">
    <div class="payment-history-header">
      <h2>{{ title || '기부 내역' }}</h2>
      <p class="subtitle">{{ subtitle || '나의 기부 내역을 확인해보세요' }}</p>
    </div>

    <!-- 필터 및 정렬 -->
    <div class="filters-section">
      <div class="filter-row">
        <a-select
          v-model:value="filters.status"
          placeholder="결제 상태"
          style="width: 150px"
          @change="fetchPayments"
        >
          <a-select-option value="">전체</a-select-option>
          <a-select-option value="DONE">완료</a-select-option>
          <a-select-option value="FAILED">실패</a-select-option>
          <a-select-option value="PENDING">대기중</a-select-option>
          <a-select-option value="CANCELED">취소</a-select-option>
        </a-select>

        <a-range-picker
          v-model:value="filters.dateRange"
          :placeholder="['시작일', '종료일']"
          @change="fetchPayments"
          style="margin-left: 12px"
        />

        <a-select
          v-model:value="filters.sortBy"
          placeholder="정렬"
          style="width: 120px; margin-left: 12px"
          @change="fetchPayments"
        >
          <a-select-option value="createdAt_desc">최신순</a-select-option>
          <a-select-option value="createdAt_asc">오래된순</a-select-option>
          <a-select-option value="amount_desc">금액 높은순</a-select-option>
          <a-select-option value="amount_asc">금액 낮은순</a-select-option>
        </a-select>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-section" v-if="!hideStats">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">총 기부 횟수</div>
          <div class="stat-value">{{ stats.totalCount }}회</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">총 기부 금액</div>
          <div class="stat-value">{{ stats.totalAmount.toLocaleString() }}원</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">평균 기부 금액</div>
          <div class="stat-value">{{ Math.round(stats.averageAmount).toLocaleString() }}원</div>
        </div>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-section">
      <a-spin size="large" />
      <p>기부 내역을 불러오는 중...</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="error-section">
      <a-alert
        :message="error"
        type="error"
        show-icon
        action
      >
        <template #action>
          <a-button size="small" @click="fetchPayments">다시 시도</a-button>
        </template>
      </a-alert>
    </div>

    <!-- 결제 내역 리스트 -->
    <div v-else-if="payments.length > 0" class="payments-section">
      <div class="payment-item" v-for="payment in payments" :key="payment.id">
        <div class="payment-header">
          <div class="payment-info">
            <h3 class="payment-title">{{ props.adminMode ? payment.memberName : payment.postTitle }}</h3>
            <p class="payment-date">{{ formatDate(payment.createdAt) }}</p>
          </div>
          <div class="payment-amount">
            <span class="amount" :class="{ 'cancelled-amount': payment.status === 'CANCELED' }">{{ payment.amount.toLocaleString() }}원</span>
            <span
              class="status-badge"
              :class="getStatusClass(payment.status)"
            >
              {{ getStatusText(payment.status) }}
            </span>
          </div>
        </div>

        <div class="payment-details">
          <div class="detail-row">
            <span class="label">주문번호:</span>
            <span class="value">{{ payment.orderId }}</span>
          </div>
          <div class="detail-row">
            <span class="label">결제수단:</span>
            <span class="value">{{ payment.paymentMethod || '토스페이먼츠' }}</span>
          </div>
          <div class="detail-row" v-if="payment.canceledAt">
            <span class="label">취소일시:</span>
            <span class="value">{{ formatDate(payment.canceledAt) }}</span>
          </div>
          <div class="detail-row" v-if="payment.cancelReason">
            <span class="label">취소사유:</span>
            <span class="value">{{ payment.cancelReason }}</span>
          </div>
        </div>

        <div class="payment-actions" v-if="(payment.status === 'DONE' || payment.status === 'SUCCESS') && payment.status !== 'CANCELED' && !props.adminMode">
          <a-button
            type="link"
            size="small"
            @click="goToPost(payment.postId)"
            v-if="payment.postId"
          >
            게시글 보기
          </a-button>
          <a-button
            type="primary"
            danger
            size="small"
            @click="cancelPayment(payment.paymentKey)"
            class="cancel-button"
          >
            취소
          </a-button>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div class="pagination-section" v-if="payments.length > 0">
      <a-pagination
        v-model:current="pagination.current"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :show-size-changer="true"
        :page-size-options="['10', '20', '50']"
        :show-quick-jumper="true"
        :show-total="(total, range) => `${range[0]}-${range[1]} / 총 ${total}개`"
        @change="onPageChange"
        @showSizeChange="onPageSizeChange"
      />
    </div>

    <!-- 빈 상태 -->
    <div v-else class="empty-section">
      <a-empty
        description="아직 기부 내역이 없습니다"
        :image="'/empty/donation.svg'"
      >
        <a-button type="primary" @click="goToDonate">
          기부하러 가기
        </a-button>
      </a-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import axios from '@/utils/axios'
import { paymentAPI } from '@/utils/payment'

// Props
const props = defineProps({
  title: {
    type: String,
    default: '기부 내역'
  },
  subtitle: {
    type: String,
    default: '나의 기부 내역을 확인해보세요'
  },
  hideStats: {
    type: Boolean,
    default: false
  },
  limit: {
    type: Number,
    default: null
  },
  adminMode: {
    type: Boolean,
    default: false
  },
  postId: {
    type: [String, Number],
    default: null
  }
})

const router = useRouter()
const paymentStore = usePaymentStore()

// 데이터
const payments = ref([])
const loading = ref(true)
const error = ref(null)

// 필터
const filters = reactive({
  status: '',
  dateRange: null,
  sortBy: 'createdAt_desc'
})

// 페이지네이션
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

// 통계
const stats = computed(() => {
  const successPayments = payments.value.filter(p => p.status === 'DONE' || p.status === 'SUCCESS')
  const totalAmount = successPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalCount = successPayments.length

  return {
    totalCount,
    totalAmount,
    averageAmount: totalCount > 0 ? totalAmount / totalCount : 0
  }
})

// 메서드
const fetchPayments = async () => {
  loading.value = true
  error.value = null

  try {
    const params = {
      page: pagination.current - 1,
      size: props.limit || pagination.pageSize,
      status: filters.status || undefined,
      sortBy: filters.sortBy,
      startDate: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: filters.dateRange?.[1]?.format('YYYY-MM-DD')
    }

    // 관리자 모드일 때 다른 API 사용
    let response
    if (props.adminMode && props.postId) {
      response = await paymentAPI.getPaymentsByPost(props.postId, params)
    } else {
      response = await paymentStore.getMyPayments(params)
    }

    // 응답 구조에 따른 안전한 데이터 처리
    if (Array.isArray(response)) {
      payments.value = response
      pagination.total = response.length
    } else if (response && typeof response === 'object') {
      if (response.content && Array.isArray(response.content)) {
        payments.value = response.content
        pagination.total = response.totalElements || response.content.length
      } else if (response.data && Array.isArray(response.data)) {
        payments.value = response.data
        pagination.total = response.total || response.data.length
      } else if (response.payments && Array.isArray(response.payments)) {
        payments.value = response.payments
        pagination.total = response.total || response.payments.length
      } else {
        payments.value = []
        pagination.total = 0
      }
    } else {
      payments.value = []
      pagination.total = 0
    }
  } catch (err) {
    error.value = err.response?.data?.message || '기부 내역을 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY.MM.DD HH:mm')
}

const getStatusClass = (status) => {
  switch (status) {
    case 'DONE':
    case 'SUCCESS': return 'status-success'
    case 'FAILED': return 'status-failed'
    case 'PENDING': return 'status-pending'
    case 'CANCELED': return 'status-cancel'
    default: return 'status-unknown'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'DONE': return '완료'
    case 'SUCCESS': return '성공'
    case 'FAILED': return '실패'
    case 'PENDING': return '대기중'
    case 'CANCELED': return '취소'
    default: return '알 수 없음'
  }
}

const goToPost = (postId) => {
  router.push(`/posts/${postId}`)
}

const goToDonate = () => {
  router.push('/posts')
}

const onPageChange = (page, pageSize) => {
  pagination.current = page
  pagination.pageSize = pageSize
  fetchPayments()
}

const onPageSizeChange = (current, size) => {
  pagination.current = 1
  pagination.pageSize = size
  fetchPayments()
}

const cancelPayment = async (paymentKey) => {
  try {
    await axios.post('/api/payments/cancel', {
      paymentKey: paymentKey
    })

    message.success('결제가 취소되었습니다.')
    fetchPayments()
  } catch (error) {
    message.error(error.response?.data?.message || '결제 취소에 실패했습니다.')
  }
}

// 라이프사이클
onMounted(() => {
  fetchPayments()
})
</script>

<style scoped>
.payment-history {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.payment-history-header {
  margin-bottom: 32px;
  text-align: center;
}

.payment-history-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 16px;
}

.filters-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: 12px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
  border: 1px solid #e5e7eb;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #00c851;
}

.loading-section,
.error-section {
  text-align: center;
  padding: 60px 20px;
}

.loading-section p {
  margin-top: 16px;
  color: #6b7280;
}

.payments-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.payment-item {
  padding: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.payment-item:last-child {
  border-bottom: none;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.payment-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.payment-date {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.payment-amount {
  text-align: right;
}

.amount {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
}

.status-failed {
  background: #fee2e2;
  color: #991b1b;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-unknown {
  background: #f3f4f6;
  color: #6b7280;
}

.status-cancel {
  background: #fee2e2;
  color: #991b1b;
}

.payment-details {
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 14px;
}

.detail-row .label {
  color: #6b7280;
  min-width: 80px;
}

.detail-row .value {
  color: #1f2937;
  font-family: monospace;
}

.payment-actions {
  display: flex;
  justify-content: flex-start;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.cancel-button {
  background-color: #dc2626 !important;
  border-color: #dc2626 !important;
  color: white !important;
}

.cancelled-amount {
  text-decoration: line-through;
  color: #9ca3af !important;
}

.pagination-section {
  margin-top: 32px;
  text-align: center;
}

.empty-section {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}


/* 반응형 */
@media (max-width: 768px) {
  .payment-history {
    padding: 16px;
  }

  .payment-header {
    flex-direction: column;
    gap: 12px;
  }

  .payment-amount {
    text-align: left;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-row > * {
    width: 100% !important;
    margin-left: 0 !important;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
