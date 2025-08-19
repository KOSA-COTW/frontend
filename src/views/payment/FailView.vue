<template>
  <div class="payment-fail">
    <div class="fail-container">
      <div class="fail-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#EF4444" />
          <path d="M8 8l8 8M16 8l-8 8" stroke="white" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>

      <h1>결제에 실패했습니다</h1>

      <div class="error-info">
        <div v-if="errorCode" class="error-row">
          <span class="error-label">오류 코드</span>
          <span class="error-value">{{ errorCode }}</span>
        </div>
        <div v-if="errorMessage" class="error-row">
          <span class="error-label">오류 메시지</span>
          <span class="error-value">{{ errorMessage }}</span>
        </div>
        <div v-if="orderId" class="error-row">
          <span class="error-label">주문번호</span>
          <span class="error-value">{{ orderId }}</span>
        </div>
      </div>

      <div class="common-errors">
        <h3>주요 실패 원인</h3>
        <ul>
          <li>카드 한도 초과 또는 잔액 부족</li>
          <li>결제 정보 입력 오류</li>
          <li>카드사 또는 은행 시스템 오류</li>
          <li>네트워크 연결 문제</li>
        </ul>
      </div>

      <div class="action-buttons">
        <button @click="goToHome" class="btn-secondary">홈으로 돌아가기</button>
        <button @click="retryPayment" class="btn-primary">다시 시도하기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const errorCode = ref('')
const errorMessage = ref('')
const orderId = ref('')

const goToHome = () => {
  router.push('/')
}

const retryPayment = () => {
  // 이전 페이지로 돌아가거나 결제 페이지로 다시 이동
  if (orderId.value) {
    router.go(-1) // 이전 페이지로
  } else {
    router.push('/') // 홈으로
  }
}

onMounted(() => {
  // URL 쿼리 파라미터에서 오류 정보 추출
  errorCode.value = route.query.code || ''
  errorMessage.value = route.query.message || '알 수 없는 오류가 발생했습니다.'
  orderId.value = route.query.orderId || ''
})
</script>

<style scoped>
.payment-fail {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  padding: 20px;
}

.fail-container {
  background: white;
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.fail-icon {
  margin: 0 auto 24px;
  width: 80px;
  height: 80px;
}

.fail-icon svg {
  width: 100%;
  height: 100%;
}

h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 24px;
}

.error-info {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 32px;
  text-align: left;
}

.error-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #fecaca;
}

.error-row:last-child {
  border-bottom: none;
}

.error-label {
  color: #b91c1c;
  font-weight: 600;
  min-width: 80px;
}

.error-value {
  color: #991b1b;
  font-weight: 500;
  text-align: right;
  word-break: break-word;
}

.common-errors {
  background: #f9fafb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  text-align: left;
}

.common-errors h3 {
  color: #374151;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.common-errors ul {
  color: #6b7280;
  line-height: 1.6;
  padding-left: 20px;
}

.common-errors li {
  margin-bottom: 8px;
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
  .fail-container {
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
