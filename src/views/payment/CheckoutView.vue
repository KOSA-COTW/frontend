<template>
  <div class="payment-checkout">
    <div class="payment-container">
      <div class="payment-header">
        <h2>결제하기</h2>
        <p>{{ post.title }}</p>
        <span class="category-badge">{{ post.category }}</span>
      </div>

      <div class="payment-info">
        <div class="amount-display-section">
          <h3>선택한 후원 금액</h3>
          <div class="selected-amount-display">
            {{ amount.toLocaleString() }}원
          </div>
        </div>
      </div>

      <!-- Toss Payment Widget -->
      <div class="payment-widget">
        <div ref="paymentWidgetRef" id="payment-widget"></div>
        <div ref="agreementRef" id="agreement"></div>
      </div>

      <div class="payment-summary">
        <div class="summary-row">
          <span>후원 금액</span>
          <span class="amount">{{ amount.toLocaleString() }}원</span>
        </div>
        <div class="summary-row total">
          <span>총 결제 금액</span>
          <span class="amount">{{ amount.toLocaleString() }}원</span>
        </div>
      </div>

      <button
        @click="requestPayment"
        :disabled="!canPay"
        class="payment-button"
        :class="{ disabled: !canPay }"
      >
        <span v-if="loading">결제 처리 중...</span>
        <span v-else>{{ amount.toLocaleString() }}원 결제하기</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// Toss Payments는 CDN으로 로드됩니다
import { usePaymentStore } from '@/stores/payment'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()
const authStore = useAuthStore()

// 데이터
const paymentWidgetRef = ref(null)
const agreementRef = ref(null)
const paymentWidget = ref(null)
// 스토어에서 직접 금액을 가져오도록 변경
const amount = computed(() => paymentStore.donationAmount || 10000)

const loading = ref(false)
const post = computed(() => ({
  title: route.query.title || '기부 게시글',
  category: route.query.category || '기부'
}))

// 계산된 속성
const canPay = computed(() => {
  return amount.value >= 1000 && !loading.value
})

// 메소드 - 금액 관련 함수들 제거됨

const initPaymentWidget = async () => {
  try {
    // PaymentWidget CDN 로드 확인 (v1 API)
    if (typeof window.PaymentWidget === 'undefined') {
      console.error('PaymentWidget SDK not loaded')
      alert('결제 SDK가 로드되지 않았습니다. 페이지를 새로고침해주세요.')
      return
    }

    const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY
    console.log('Client Key:', clientKey ? 'exists' : 'missing')

    if (!clientKey) {
      console.error('VITE_TOSS_CLIENT_KEY not found')
      alert('결제 설정이 올바르지 않습니다.')
      return
    }

    // 고객 키 생성 (UUID 또는 사용자 ID 사용)
    const customerKey = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log('Customer Key:', customerKey)

    // PaymentWidget 인스턴스 생성 (v1 API)
    paymentWidget.value = window.PaymentWidget(clientKey, customerKey)
    console.log('PaymentWidget created:', paymentWidget.value)

    // 결제 수단 렌더링
    console.log('Rendering payment methods...')
    await paymentWidget.value.renderPaymentMethods('#payment-widget', { value: amount.value })

    // 약관 렌더링
    console.log('Rendering agreement...')
    await paymentWidget.value.renderAgreement('#agreement')

    console.log('Payment widget initialized successfully')

  } catch (error) {
    console.error('Payment widget initialization error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    alert(`결제 위젯을 불러오는데 실패했습니다: ${error.message}`)
  }
}

const requestPayment = async () => {
  if (!authStore.isLoggedIn) {
    alert('로그인이 필요합니다.')
    router.push('/login')
    return
  }

  loading.value = true

  try {
    // 1. orderId 먼저 생성 (백엔드와 독립적으로)
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log('Generated orderId:', orderId)

    // 2. 서버에 결제 정보 저장 시도 (실패해도 결제는 진행)
    let paymentResponse = null
    try {
      const paymentData = {
        postId: Number(route.params.postId),
        amount: amount.value,
        orderId: orderId // orderId도 백엔드에 전달
      }
      paymentResponse = await paymentStore.createPayment(paymentData)
      console.log('Backend payment created:', paymentResponse)
    } catch (backendError) {
      console.warn('Backend payment creation failed, proceeding with Toss payment only:', backendError)
    }

    // 3. Toss Payments로 결제 요청 (백엔드 실패와 관계없이 진행)
    await paymentWidget.value.requestPayment({
      orderId: orderId,
      orderName: post.value?.title || '기부금',
      successUrl: `${import.meta.env.VITE_API_BASE_URL}/api/payments/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    })
  } catch (error) {
    console.error('Payment request error:', error)
    const errorMessage =
      error.response?.data?.message || error.message || '결제 요청에 실패했습니다.'
    alert(errorMessage)
  } finally {
    loading.value = false
  }
}

// 금액 변경시 위젯 다시 렌더링
watch(amount, async (newAmount) => {
  if (paymentWidget.value && newAmount >= 1000) {
    try {
      console.log('Re-rendering payment widget with amount:', newAmount)
      await paymentWidget.value.renderPaymentMethods('#payment-widget', { value: newAmount })
    } catch (error) {
      console.error('Widget re-render error:', error)
    }
  }
}, { immediate: false })

// 라이프사이클
onMounted(async () => {
  // DOM 완전히 로드될 때까지 기다린 후 위젯 초기화
  await new Promise(resolve => setTimeout(resolve, 100))
  await initPaymentWidget()
})
</script>

<style scoped>
.payment-checkout {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Noto Sans KR', sans-serif;
}

.payment-container {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.payment-header {
  text-align: center;
  margin-bottom: 32px;
}

.payment-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.payment-header p {
  color: #6b7280;
  font-size: 16px;
  margin-bottom: 8px;
}

.category-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.payment-info {
  margin-bottom: 32px;
}

.amount-display-section {
  text-align: center;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
}

.amount-display-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
}

.selected-amount-display {
  font-size: 32px;
  font-weight: 700;
  color: #3b82f6;
}

/* 금액 선택 관련 스타일들 제거됨 */

.payment-widget {
  margin: 32px 0;
  min-height: 300px;
}

.payment-summary {
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 16px;
}

.summary-row.total {
  font-weight: 600;
  font-size: 18px;
  color: #1f2937;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
  margin-bottom: 0;
}

.amount {
  font-weight: 600;
  color: #3b82f6;
}

.payment-button {
  width: 100%;
  padding: 18px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.payment-button:hover:not(.disabled) {
  background: #2563eb;
}

.payment-button.disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* 반응형 */
@media (max-width: 768px) {
  .payment-checkout {
    padding: 16px;
  }

  .payment-container {
    padding: 24px 20px;
  }

  .quick-amounts {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
