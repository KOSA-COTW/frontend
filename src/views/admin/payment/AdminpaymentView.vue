<template>
  <div class="admin-board-page">

    <a-card title="기부/결제 관리" style="margin-bottom: 24px">
      <a-typography-paragraph>
        기부내역 관리와 결제현황 조회를 할 수 있습니다.
      </a-typography-paragraph>
    </a-card>

    <a-row :gutter="[16, 16]" justify="center">
      <a-col :span="10">
        <a-card title="전체 기부내역 조회" hoverable>
          <p>전체 기부내역을 조회할 수 있습니다.</p>

          <a-button class="btn-outline" size="large" block @click="goToDonationHistory">
            전체 기부 내역
          </a-button>
        </a-card>
      </a-col>

      <a-col :span="10">
        <a-card title="결제 현황 조회" hoverable>
          <p>결제 현황을 조회 할 수 있습니다.</p>

          <a-button class="btn-outline" size="large" block @click="goToPaymentStatus">
            결제현황
          </a-button>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
// useAuthStore를 현재 코드에서 사용하지 않아 제거(원하면 유지해도 무방)
import { onMounted } from 'vue'

const router = useRouter()

onMounted(() => {
  // 관리자 권한은 라우터 가드에서 체크됨
})


const goToDonationHistory = () => {
  router.push({ name: 'adminDonationHistory' }) // /admin/donations
}
const goToPaymentStatus = () => {
  router.push({ name: 'adminPaymentStatus' })   // /admin/payments
}

</script>

<style scoped>
.admin-board-page {
  padding: 24px;
  min-height: calc(100vh - 140px);
  --brand: #00C851; /* 브랜드 컬러 */
}

.ant-card { height: 100%; }
.ant-card-body {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}


.btn-outline {
  background: transparent !important;
  color: var(--brand) !important;
  border: 2px solid var(--brand) !important;
  border-radius: 10px;
  font-weight: 700;
}
.btn-outline:hover,
.btn-outline:focus {
  background: rgba(0, 200, 81, 0.06) !important;
  color: var(--brand) !important;
  border-color: var(--brand) !important;
}
.btn-outline:active {
  background: rgba(0, 200, 81, 0.12) !important;
}
</style>
