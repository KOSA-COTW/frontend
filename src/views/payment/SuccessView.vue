<template>
  <div class="payment-success">
    <div class="success-container">
      <div class="success-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#10B981" />
          <path
            d="M8 12l2 2 4-4"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <h1>결제가 완료되었습니다!</h1>
      <p class="success-message">
        소중한 후원에 감사드립니다.<br />
        여러분의 마음이 따뜻한 변화를 만들어갑니다.
      </p>

      <div v-if="paymentInfo" class="payment-details">
        <div class="detail-row">
          <span class="label">주문번호</span>
          <span class="value">{{ paymentInfo.orderId }}</span>
        </div>
        <div class="detail-row">
          <span class="label">후원 게시글</span>
          <span class="value">{{ paymentInfo.postTitle }}</span>
        </div>
        <div class="detail-row">
          <span class="label">후원 금액</span>
          <span class="value amount">{{ paymentInfo.amount?.toLocaleString() }}원</span>
        </div>
        <div class="detail-row">
          <span class="label">결제 방식</span>
          <span class="value">{{ getPaymentMethodText(paymentInfo.type) }}</span>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="goToHome" class="btn-secondary">홈으로 돌아가기</button>
        <button @click="goToMyPayments" class="btn-primary">내 후원 내역 보기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'

const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()

const paymentInfo = ref(null)
const loading = ref(true)

const getPaymentMethodText = (type) => {
  const typeMap = {
    NORMAL: '일반 결제',
    BILLING: '자동 결제',
    BRANDPAY: '브랜드페이',
  }
  return typeMap[type] || '일반 결제'
}

const goToHome = () => {
  router.push('/')
}

const goToMyPayments = () => {
  router.push('/payment/history')
}

onMounted(async () => {
  console.log('[SuccessView] Route query params:', route.query)
  
  const orderId = route.query.orderId
  const paymentKey = route.query.paymentKey

  if (orderId) {
    try {
      // 결제 내역을 다시 조회해서 최신 정보 표시
      const response = await paymentStore.getMyPayments()
      console.log('[SuccessView] Payment store response:', response)
      
      let payments = []
      if (Array.isArray(response)) {
        payments = response
      } else if (response && response.content) {
        payments = response.content
      } else if (response && response.data) {
        payments = response.data
      }
      
      console.log('[SuccessView] Payments:', payments)
      
      // orderId 또는 paymentKey로 결제 정보 찾기
      paymentInfo.value = payments.find((p) => 
        p.orderId === orderId || p.paymentKey === paymentKey
      )
      
      console.log('[SuccessView] Found payment info:', paymentInfo.value)

      if (!paymentInfo.value) {
        // 임시로 쿼리 파라미터 정보 사용
        paymentInfo.value = {
          orderId: orderId,
          orderName: route.query.orderName || '후원 완료',
          amount: parseInt(route.query.amount) || 0,
          type: route.query.type || 'NORMAL',
          postTitle: route.query.postTitle || route.query.orderName || '후원 게시글'
        }
        console.log('[SuccessView] Using fallback payment info:', paymentInfo.value)
      }
    } catch (error) {
      console.error('Failed to fetch payment info:', error)
      // 에러 시에도 쿼리 파라미터 정보 사용
      paymentInfo.value = {
        orderId: orderId,
        orderName: route.query.orderName || '후원 완료', 
        amount: parseInt(route.query.amount) || 0,
        type: route.query.type || 'NORMAL',
        postTitle: route.query.postTitle || route.query.orderName || '후원 게시글'
      }
    }
  }

  loading.value = false
})
</script>

<style scoped>
.payment-success {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.success-container {
  background: white;
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.success-icon {
  margin: 0 auto 24px;
  width: 80px;
  height: 80px;
}

.success-icon svg {
  width: 100%;
  height: 100%;
}

h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
}

.success-message {
  color: #6b7280;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 32px;
}

.payment-details {
  background: #f9fafb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  text-align: left;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  color: #6b7280;
  font-weight: 500;
}

.value {
  color: #1f2937;
  font-weight: 600;
}

.value.amount {
  color: #10b981;
  font-size: 18px;
}

.action-buttons {
  display: flex;
  gap: 16px;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 14px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .success-container {
    padding: 32px 24px;
  }

  .action-buttons {
    flex-direction: column;
  }

  h1 {
    font-size: 24px;
  }
}
</style>
