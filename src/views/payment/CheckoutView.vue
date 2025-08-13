<template>
  <div class="payment-checkout">
    <div class="payment-container">
      <div class="payment-header">
        <h2>결제하기</h2>
        <p>{{ post?.title || '기부 게시글' }}</p>
      </div>

      <div class="payment-info">
        <div class="amount-section">
          <label for="amount">후원 금액</label>
          <div class="amount-input-group">
            <span class="currency">₩</span>
            <input
              id="amount"
              v-model.number="amount"
              type="number"
              placeholder="후원하실 금액을 입력해주세요"
              min="1000"
              step="1000"
              class="amount-input"
              @input="validateAmount"
            />
          </div>
          <div v-if="amountError" class="error-message">
            {{ amountError }}
          </div>
        </div>

        <div class="quick-amounts">
          <button
            v-for="quickAmount in quickAmounts"
            :key="quickAmount"
            @click="setAmount(quickAmount)"
            class="quick-amount-btn"
            :class="{ active: amount === quickAmount }"
          >
            {{ quickAmount.toLocaleString() }}원
          </button>
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
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { usePaymentStore } from '@/stores/payment'
import { authUtils } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()

// 데이터
const paymentWidgetRef = ref(null)
const agreementRef = ref(null)
const paymentWidget = ref(null)
const amount = ref(10000)
const amountError = ref('')
const loading = ref(false)
const post = ref(null)

// 빠른 금액 선택 옵션
const quickAmounts = [5000, 10000, 20000, 50000, 100000, 200000]

// 계산된 속성
const canPay = computed(() => {
  return amount.value >= 1000 && !amountError.value && !loading.value
})

// 메소드
const validateAmount = () => {
  if (amount.value < 1000) {
    amountError.value = '최소 결제 금액은 1,000원입니다.'
  } else if (amount.value > 10000000) {
    amountError.value = '최대 결제 금액은 10,000,000원입니다.'
  } else {
    amountError.value = ''
  }
}

const setAmount = (value) => {
  amount.value = value
  validateAmount()
}

const initPaymentWidget = async () => {
  try {
    const tossPayments = await loadTossPayments(import.meta.env.VITE_TOSS_CLIENT_KEY)

    paymentWidget.value = tossPayments.widgets({
      customerKey: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    })

    // 결제 위젯 렌더링
    await paymentWidget.value.renderPaymentMethods({
      selector: '#payment-widget',
      variantKey: 'DEFAULT',
    })

    // 약관 위젯 렌더링
    await paymentWidget.value.renderAgreement({
      selector: '#agreement',
    })
  } catch (error) {
    console.error('Payment widget initialization error:', error)
    alert('결제 위젯을 불러오는데 실패했습니다.')
  }
}

const requestPayment = async () => {
  if (!authUtils.isAuthenticated()) {
    alert('로그인이 필요합니다.')
    router.push('/login')
    return
  }

  loading.value = true

  try {
    // 1. 서버에 결제 정보 저장 (PaymentEvent 생성)
    const paymentData = {
      postId: Number(route.params.postId),
      amount: amount.value,
    }

    const paymentResponse = await paymentStore.createPayment(paymentData)

    // 2. Toss Payments로 결제 요청
    await paymentWidget.value.requestPayment({
      orderId: paymentResponse.orderId,
      orderName: paymentResponse.orderName,
      amount: paymentResponse.amount,
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

// 금액 변경시 결제 위젯 업데이트
watch(amount, async (newAmount) => {
  if (paymentWidget.value && newAmount >= 1000) {
    try {
      await paymentWidget.value.updateAmount(newAmount)
    } catch (error) {
      console.error('Amount update error:', error)
    }
  }
})

// 라이프사이클
onMounted(async () => {
  // 게시글 정보 가져오기 (실제 구현시 API 호출)
  const postId = route.params.postId
  if (postId) {
    // post.value = await fetchPost(postId) // 실제 구현 필요
    post.value = { title: '기부 게시글 제목' } // 임시 데이터
  }

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
}

.payment-info {
  margin-bottom: 32px;
}

.amount-section {
  margin-bottom: 20px;
}

.amount-section label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.amount-input-group {
  position: relative;
}

.currency {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-weight: 600;
}

.amount-input {
  width: 100%;
  padding: 16px 16px 16px 40px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  transition: border-color 0.2s;
}

.amount-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.error-message {
  color: #ef4444;
  font-size: 14px;
  margin-top: 8px;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.quick-amount-btn {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-amount-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.quick-amount-btn.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}

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
