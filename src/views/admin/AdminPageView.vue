<template>
  <a-layout-content class="admin-dashboard">
    <!-- 상단 헤더 / 기간 필터 -->
    <div class="header-row">
      <div class="title">
        <h2>관리자 대시보드</h2>
        <p class="subtitle">오늘 현황과 주요 바로가기를 한 곳에서</p>
      </div>
      <div class="filters">
        <a-range-picker
          :allowClear="false"
          @change="onChangeRange"
          :value="dateRange"
        />
        <a-button type="primary" class="ml8" @click="reload">새로고침</a-button>
      </div>
    </div>

    <!-- KPI 카드 -->
    <a-row :gutter="[16,16]" class="mb16">
      <a-col :xs="12" :sm="12" :md="8" :lg="8">
        <a-card class="kpi-card" :bordered="false">
          <div class="kpi-head">
            <span class="kpi-title">오늘 기부액</span>
            <a-tag color="success">Today</a-tag>
          </div>
          <div class="kpi-value">{{ formatCurrency(kpi.todayDonation) }}원</div>
          <div class="kpi-sub">전체 {{ formatCurrency(kpi.totalDonation) }}원</div>
        </a-card>
      </a-col>

      <a-col :xs="12" :sm="12" :md="8" :lg="8">
        <a-card class="kpi-card" :bordered="false">
          <div class="kpi-head">
            <span class="kpi-title">신규 회원</span>
            <a-tag color="processing">Users</a-tag>
          </div>
          <div class="kpi-value">{{ kpi.newUsers }}명</div>
          <div class="kpi-sub">전체 {{ kpi.totalUsers }}명</div>
        </a-card>
      </a-col>

      <a-col :xs="12" :sm="12" :md="8" :lg="8">
        <a-card class="kpi-card" :bordered="false">
          <div class="kpi-head">
            <span class="kpi-title">미처리 신고</span>
            <a-tag color="warning">Reports</a-tag>
          </div>
          <div class="kpi-value">{{ kpi.pendingReports }}건</div>
          <div class="kpi-sub">48시간 내 처리 대상 {{ kpi.dueIn48h }}건</div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 📈 일간 기부액 라인차트 -->
    <a-row :gutter="[16,16]" class="mb24">
      <a-col :span="24">
        <a-card :bordered="false" title="일간 기부액 추이">
          <template #extra>
            <span>{{ currentMonth }}</span> <!-- ✅ 연월 표시 -->
          </template>
          <div ref="chartRef" class="donation-linechart"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 최근 테이블 2단 -->
    <a-row :gutter="[16,16]">
      <a-col :xs="24" :lg="12">
        <a-card :bordered="false" title="최근 기부 내역 5건">
          <template #extra>
            <a @click="goToDonationHistory">자세히</a>
          </template>
          <a-table
            :data-source="recentPayments"
            :columns="paymentCols"
            :pagination="false"
            :row-key="record => record.donorEmail + '_' + record.at"
          />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card :bordered="false" title="최근 신고 댓글 5건">
          <template #extra>
            <a @click="goToCommentList">자세히</a>
          </template>
          <a-table
            :data-source="recentReports"
            :columns="reportCols"
            :pagination="false"
            row-key="reportedMemberEmail"
          />
        </a-card>
      </a-col>
    </a-row>
  </a-layout-content>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { message } from 'ant-design-vue'
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import { fetchAdminDashboard } from '@/utils/adminDash'
import dayjs from 'dayjs'

const router = useRouter()
const mainColor = '#00C851'

/* 날짜 선택/새로고침 */
const dateRange = ref([])
const onChangeRange = (val) => { dateRange.value = val }
const reload = () => {
  dateRange.value = []   // ✅ 완전 초기화 (placeholder 상태로)
  loadDashboard()
  message.success('대시보드를 새로고침 했습니다.')
}

const goToDonationHistory = () => router.push({ name: 'adminDonationHistory' })
const goToCommentList = () => router.push({ name: 'adminComments' })

/* 상태 */
const kpi = ref({
  todayDonation: 0,
  totalDonation: 0,
  newUsers: 0,
  totalUsers: 0,
  pendingReports: 0,
  dueIn48h: 0
})
const recentPayments = ref([])
const recentReports = ref([])
const daily = ref({ labels: [], values: [] })

/* 현재 연월 표시 */
const currentMonth = computed(() => {
  if (!daily.value || daily.value.labels.length === 0) return ''
  // ✅ 마지막 라벨 기준으로 표시
  return dayjs(daily.value.labels.at(-1)).format('YYYY-MM')
})

/* 상태/사유 매핑 */
const statusMap = {
  DONE: '완료',
  FAILED: '실패',
  CANCELED: '취소',
  REFUND: '환불',
  PENDING: '대기'
}

const reasonMap = {
  SPAM: '스팸/광고',
  ABUSE: '욕설/괴롭힘',
  INAPPROPRIATE: '부적절/선정',
  PERSONAL_INFO: '개인정보 노출',
  ILLEGAL: '불법/범죄',
  ETC: '기타'
}

/* API 호출 */
const loadDashboard = async () => {
  try {
    let start = null, end = null
    if (dateRange.value && dateRange.value.length === 2) {
      start = dateRange.value[0].format('YYYY-MM-DD')
      end = dateRange.value[1].format('YYYY-MM-DD')
    }
    const res = await fetchAdminDashboard(start, end)

    kpi.value = res.kpi || kpi.value
    recentPayments.value = res.recentPayments || []
    recentReports.value = res.recentReports || []
    daily.value = res.dailyDonation || { labels: [], values: [] }

    drawChart()
  } catch (err) {
    console.error(err)
    message.error('대시보드 데이터를 불러오지 못했습니다.')
  }
}

/* 테이블 컬럼 */
const paymentCols = [
  { title: '기부자', dataIndex: 'donorEmail' },
  { title: '금액', dataIndex: 'amount', customRender: ({ text }) => formatCurrency(text) + '원' },
  {
    title: '상태',
    dataIndex: 'status',
    customRender: ({ text }) => statusMap[text] || text  // ✅ 한글 매핑
  },
  {
    title: '시간',
    dataIndex: 'at',
    customRender: ({ text }) => dayjs(text).format('YYYY-MM-DD HH:mm')
  }
]

const reportCols = [
  { title: '작성자', dataIndex: 'reportedMemberEmail' },
  {
    title: '사유',
    dataIndex: 'reason',
    customRender: ({ text }) => reasonMap[text] || text  // ✅ 한글 매핑
  },
  { title: '신고수', dataIndex: 'count' },
  {
    title: '시간',
    dataIndex: 'at',
    customRender: ({ text }) => dayjs(text).format('YYYY-MM-DD HH:mm')
  }
]

/* 차트 */
const chartRef = ref(null)
let chart

const drawChart = async () => {
  await nextTick()
  if (!chartRef.value || !daily.value) return

  // ✅ 기존 차트 완전 재생성
  if (chart) {
    chart.dispose()
  }
  chart = echarts.init(chartRef.value)

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => formatCurrency(v) + '원'
    },
    grid: { left: 12, right: 12, top: 24, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: daily.value.labels.map(d => d.slice(8, 10)) // ✅ 일(day)만
    },
    yAxis: {
      type: 'value',
      minInterval: 10000, // ✅ 최소 1만 원 단위
      axisLabel: {
        formatter: (v) => v === 0 ? '0원' : `${Math.floor(v / 10000)}만 원`
      }
    },
    series: [{
      name: '일간 기부액',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 3, color: mainColor },
      areaStyle: { opacity: 0.2, color: mainColor },
      itemStyle: { color: mainColor },
      data: daily.value.values
    }]
  }, true)  // ✅ notMerge = true (옵션 완전 덮어쓰기)
}

onMounted(() => {
  loadDashboard()
})
watch(dateRange, () => loadDashboard())

/* 유틸 */
const formatCurrency = (n) =>
  new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n)
</script>

<style scoped>
.admin-dashboard { padding: 16px 21px 28px; background: #f7f9fb; --brand: #00C851; }
.header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
.title h2 { margin: 0; }
.subtitle { color: #7a7a7a; margin: 4px 0 0; }
.filters { display: flex; align-items: center; }
.ml8 { margin-left: 8px; }
.mb8 { margin-bottom: 8px; }
.mb16 { margin-bottom: 16px; }
.mb24 { margin-bottom: 24px; }

/* KPI */
.kpi-card { background: #fff; border-radius: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); padding: 8px 12px; height: 120px; }
.kpi-head { display: flex; justify-content: space-between; align-items: center; }
.kpi-title { font-weight: 600; color: #444; }
.kpi-value { margin-top: 6px; font-size: 24px; font-weight: 800; color: #111; }
.kpi-sub { color: #888; font-size: 12px; }

/* Chart */
.donation-linechart { width: 100%; height: 320px; }

/* 카드 내부 링크 색상 */
:deep(.ant-card-head-title) { font-weight: 700; }
:deep(.ant-card-extra) { color: #9aa0a6; font-size: 12px; }
:deep(.ant-card-extra a) { color: var(--brand); }
</style>
