<template>
  <div class="admin-category-ranking-page">
    <a-card title="카테고리별 기부금액 순위" style="margin-bottom: 24px">
      <a-typography-paragraph>
        카테고리별 총 기부금액 순위입니다.
      </a-typography-paragraph>
      <a-button @click="goBack" style="margin-bottom: 16px">
        <ArrowLeftOutlined /> 통계 관리로 돌아가기
      </a-button>
    </a-card>

    <a-card>
      <a-table 
        :columns="columns" 
        :dataSource="categoryStats" 
        :loading="loading"
        :pagination="false"
        row-key="category"
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
const categoryStats = ref([])
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
    title: '카테고리명',
    dataIndex: 'categoryName',
    key: 'categoryName',
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
  return 'green'
}

const formatAmount = (amount) => {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

const fetchCategoryStats = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/admin/stats/categories')
    categoryStats.value = response
  } catch (error) {
    console.error('카테고리 통계 조회 실패:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCategoryStats()
})
</script>

<style scoped>
.admin-category-ranking-page {
  padding: 24px;
  min-height: calc(100vh - 140px);
}
</style>