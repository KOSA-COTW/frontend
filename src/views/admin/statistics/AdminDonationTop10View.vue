<template>
  <div class="admin-donation-top10-page">
    <a-card title="기부금액 Top 10 유저" style="margin-bottom: 24px">
      <a-typography-paragraph>
        기부금액이 많은 상위 10명의 유저 목록입니다.
      </a-typography-paragraph>
      <a-button @click="goBack" style="margin-bottom: 16px">
        <ArrowLeftOutlined /> 통계 관리로 돌아가기
      </a-button>
    </a-card>

    <a-card>
      <a-table 
        :columns="columns" 
        :dataSource="donationStats" 
        :loading="loading"
        :pagination="false"
        row-key="memberId"
      >
        <template #bodyCell="{ column, text, record, index }">
          <template v-if="column.dataIndex === 'rank'">
            <a-tag :color="getRankColor(index + 1)">
              {{ index + 1 }}위
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'totalAmount'">
            {{ formatAmount(text) }}원
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import axios from '@/utils/axios'

const router = useRouter()
const donationStats = ref([])
const loading = ref(false)

const columns = [
  {
    title: '순위',
    dataIndex: 'rank',
    key: 'rank',
    width: '80px',
    align: 'center'
  },
  {
    title: '유저명',
    dataIndex: 'memberName',
    key: 'memberName',
  },
  {
    title: '총 기부금액',
    dataIndex: 'totalAmount',
    key: 'totalAmount',
    align: 'right'
  }
]

const goBack = () => {
  router.push('/admin/stats')
}

const getRankColor = (rank) => {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver' 
  if (rank === 3) return 'orange'
  return 'blue'
}

const formatAmount = (amount) => {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

const fetchDonationStats = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/admin/stats/donations')
    donationStats.value = response.topDonors || []
  } catch (error) {
    console.error('기부 통계 조회 실패:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDonationStats()
})
</script>

<style scoped>
.admin-donation-top10-page {
  padding: 24px;
  min-height: calc(100vh - 140px);
}
</style>