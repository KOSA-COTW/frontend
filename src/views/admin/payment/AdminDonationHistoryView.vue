<template>
  <div class="page">
    <a-page-header title="기부 현황 대시보드" sub-title="전체 기부금액 및 상위 기부자 현황" />

    <!-- 통계 카드 -->
    <div class="stats-cards">
      <a-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ formatCurrency(totalAmount) }}</div>
          <div class="stat-label">전체 기부금액</div>
        </div>
      </a-card>
      <a-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ totalDonations.toLocaleString() }}건</div>
          <div class="stat-label">총 기부 건수</div>
        </div>
      </a-card>
      <a-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ totalMembers.toLocaleString() }}명</div>
          <div class="stat-label">참여 회원수</div>
        </div>
      </a-card>
    </div>

    <!-- 상위 기부자 10명 -->
    <a-card title="상위 기부자 TOP 10" class="top-donors-card">
      <a-table
        :data-source="topDonors"
        :columns="donorColumns"
        :loading="loading"
        :pagination="false"
        row-key="rank"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key==='rank'">
            <div class="rank-cell">
              <a-tag v-if="record.rank <= 3" :color="getRankColor(record.rank)">
                {{ record.rank }}위
              </a-tag>
              <span v-else class="rank-number">{{ record.rank }}위</span>
            </div>
          </template>
          <template v-else-if="column.key==='totalAmount'">
            <span class="amount-text">{{ formatCurrency(record.totalAmount) }}</span>
          </template>
          <template v-else-if="column.key==='donationCount'">
            <a-tag color="blue">{{ record.donationCount }}건</a-tag>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 전체 기부 내역 -->
    <a-card title="전체 기부 내역" class="all-donations-card">
      <div class="toolbar">
        <a-input
          v-model:value="searchText"
          placeholder="기부자명, 게시글 제목으로 검색"
          style="width: 300px"
          @keyup.enter="searchDonations"
        />
        <a-select
          v-model:value="statusFilter"
          allowClear
          placeholder="상태 필터"
          style="width: 150px"
          @change="searchDonations"
        >
          <a-select-option value="DONE">성공</a-select-option>
          <a-select-option value="FAILED">실패</a-select-option>
          <a-select-option value="CANCELED">취소</a-select-option>
          <a-select-option value="REFUND">환불</a-select-option>
          <a-select-option value="PENDING">대기</a-select-option>
        </a-select>
        <a-button type="primary" @click="searchDonations">검색</a-button>
        <a-button @click="resetSearch">초기화</a-button>
      </div>

      <a-table
        :data-source="allDonations"
        :columns="allDonationsColumns"
        :loading="loading"
        :pagination="donationPagination"
        row-key="id"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key==='status'">
            <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key==='amount'">
            {{ formatCurrency(record.amount) }}
          </template>
          <template v-else-if="column.dataIndex==='method'">
            {{ methodLabel(record.method) }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { getDashboardStats, getTopDonors, getDonations } from '@/utils/adminDonation.js'

const loading = ref(false)
const totalAmount = ref(0)
const totalDonations = ref(0)
const totalMembers = ref(0)
const topDonors = ref([])
const allDonations = ref([])
const searchText = ref('')
const statusFilter = ref(undefined)

const donationPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (total) => `총 ${total}건`
})

const donorColumns = [
  { title: '순위', key: 'rank', width: 80, align: 'center' },
  { title: '기부자', dataIndex: 'memberName', width: 140 },
  { title: '이메일', dataIndex: 'memberEmail', width: 200, ellipsis: true },
  { title: '총 기부금액', key: 'totalAmount', width: 140, align: 'right' },
  { title: '기부횟수', key: 'donationCount', width: 100, align: 'center' },
  { title: '최근 기부일', dataIndex: 'lastDonationDate', width: 160,
    customRender: ({ text }) => formatDateTime(text) }
]

// 문자열 ISO(yyyy-MM-ddTHH:mm:ss) → 공백으로 보기 좋게
// 문자열 ISO(yyyy-MM-ddTHH:mm:ss) → yyyy-MM-dd HH:mm:ss
const formatDateTime = (v) => {
  if (typeof v !== 'string') return v
  return v.replace('T', ' ').slice(0, 19)
}


// ✅ 결제수단/상태 한국어 라벨 매핑
const methodLabel = (m) => ({
  CARD: '카드',
  VIRTUAL_ACCOUNT: '가상계좌',
  BRANDPAY: '브랜드페이',
  TRANSFER: '계좌이체',
  PHONE: '휴대폰결제',
  SIMPLE_PAY: '간편결제',
  CASH: '현금'
}[m] ?? (m || '-'))

const statusLabel = (s) => ({
  DONE: '성공',
  FAILED: '실패',
  CANCELED: '취소',
  REFUND: '환불',
  PENDING: '대기'
}[s] ?? s)

const allDonationsColumns = [
  { title: '이메일', dataIndex: 'memberEmail', width: 200, ellipsis: true },
  { title: '기부자', dataIndex: 'member', width: 140 },
  { title: '게시글', dataIndex: 'post', width: 300, ellipsis: true },
  { title: '금액', key: 'amount', width: 120, align: 'right' },
  { title: '상태', key: 'status', width: 100, align: 'center' },
  { title: '결제수단', dataIndex: 'method', width: 120,
    customRender: ({ text }) => methodLabel(text) },
  { title: '기부일시', dataIndex: 'createdAt', width: 160,
    customRender: ({ text }) => formatDateTime(text) }
]

function statusColor(s) {
  switch (s) {
    case 'DONE': return 'green'
    case 'FAILED': return 'red'
    case 'CANCELED': return 'orange'
    case 'REFUND': return 'geekblue'
    case 'PENDING': return 'gold'
    default: return 'default'
  }
}

function getRankColor(rank) {
  switch (rank) {
    case 1: return 'gold'
    case 2: return 'silver'
    case 3: return 'orange'
    default: return 'default'
  }
}

const formatCurrency = (n) => new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0
}).format(n ?? 0)

async function loadDashboard() {
  loading.value = true
  try {
    const [stats, donors] = await Promise.all([
      getDashboardStats(),
      getTopDonors()
    ])

    totalAmount.value = stats.totalAmount
    totalDonations.value = stats.totalDonations
    totalMembers.value = stats.totalMembers
    topDonors.value = donors

    await loadAllDonations()
  } finally {
    loading.value = false
  }
}

async function loadAllDonations() {
  const result = await getDonations(
    donationPagination.current,
    donationPagination.pageSize,
    searchText.value,
    statusFilter.value
  )
  allDonations.value = result.content
  donationPagination.total = result.totalElements
}

function onTableChange(pagination) {
  donationPagination.current = pagination.current
  donationPagination.pageSize = pagination.pageSize
  loadAllDonations()
}

async function searchDonations() {
  donationPagination.current = 1
  await loadAllDonations()
}

function resetSearch() {
  searchText.value = ''
  statusFilter.value = undefined
  donationPagination.current = 1
  loadAllDonations()
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.page {
  padding: 12px 16px 28px;
  background-color: #f5f5f5;
}

.stats-cards {
  display: flex;
  gap: 16px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 200px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-content {
  text-align: center;
  padding: 8px 0;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.top-donors-card,
.all-donations-card {
  margin: 20px 0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.all-donations-card .ant-table-wrapper {
  overflow-x: auto;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.rank-cell {
  text-align: center;
}

.rank-number {
  font-weight: bold;
  color: #666;
}

.amount-text {
  font-weight: bold;
  color: #f56a00;
}

:deep(.ant-card-head-title) {
  font-size: 16px;
  font-weight: bold;
}

:deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
}
</style>
