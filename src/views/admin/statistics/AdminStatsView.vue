<template>
  <div class="admin-stats-page">
    <a-card title="통계 관리" style="margin-bottom: 24px">
      <a-typography-paragraph>
        사이트 이용 통계를 확인할 수 있습니다.
      </a-typography-paragraph>
    </a-card>

    <a-row :gutter="[16, 16]" justify="center">
      <a-col :span="10">
        <a-card title="기부금액 Top 10 유저" hoverable>
          <p>기부금액이 많은 상위 10명의 유저를 확인할 수 있습니다.</p>
          <a-button type="primary" size="large" block @click="goToDonationTop10">
            기부금액 Top 10 유저
          </a-button>
        </a-card>
      </a-col>

      <a-col :span="10">
        <a-card title="카테고리별 기부금액 순위" hoverable>
          <p>카테고리별 총 기부금액 순위를 확인할 수 있습니다.</p>
          <a-button type="primary" size="large" block @click="goToCategoryRanking">
            카테고리별 기부금액 순위
          </a-button>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  // 관리자 권한은 라우터 가드에서 체크됨
})

const goToDonationTop10 = () => {
  router.push('/admin/stats/donation-top10')
}

const goToCategoryRanking = () => {
  router.push('/admin/stats/category-ranking')
}
</script>

<style scoped>
.admin-stats-page {
  padding: 24px;
  min-height: calc(100vh - 140px);
}

.ant-card {
  height: 100%;
}

.ant-card-body {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>