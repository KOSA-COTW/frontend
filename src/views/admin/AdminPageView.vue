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

        <!-- ✅ 빠른메뉴 토글 -->
        <a-switch
          v-model:checked="showQuickMenu"
          class="ml8"
          checked-children="ON"
          un-checked-children="OFF"
        />
        <span class="switch-label">빠른메뉴</span>
      </div>
    </div>

    <!-- KPI 카드 -->
    <a-row :gutter="[16,16]" class="mb16">
      <a-col :xs="12" :sm="12" :md="6" :lg="6">
        <a-card class="kpi-card" :bordered="false">
          <div class="kpi-head">
            <span class="kpi-title">오늘 기부액</span>
            <a-tag color="success">Today</a-tag>
          </div>
          <div class="kpi-value">{{ formatCurrency(kpi.todayDonation) }}</div>
          <div class="kpi-sub">전체 {{ formatCurrency(kpi.totalDonation) }}</div>
        </a-card>
      </a-col>

      <a-col :xs="12" :sm="12" :md="6" :lg="6">
        <a-card class="kpi-card" :bordered="false">
          <div class="kpi-head">
            <span class="kpi-title">신규 회원</span>
            <a-tag color="processing">Users</a-tag>
          </div>
          <div class="kpi-value">{{ kpi.newUsers }}</div>
          <div class="kpi-sub">전체 {{ kpi.totalUsers }}</div>
        </a-card>
      </a-col>

      <a-col :xs="12" :sm="12" :md="6" :lg="6">
        <a-card class="kpi-card" :bordered="false">
          <div class="kpi-head">
            <span class="kpi-title">미처리 신고</span>
            <a-tag color="warning">Reports</a-tag>
          </div>
          <div class="kpi-value">{{ kpi.pendingReports }}</div>
          <div class="kpi-sub">48시간 내 처리 대상 {{ kpi.dueIn48h }}</div>
        </a-card>
      </a-col>

      <a-col :xs="12" :sm="12" :md="6" :lg="6">
        <a-card class="kpi-card" :bordered="false">
          <div class="kpi-head">
            <span class="kpi-title">결제 성공률</span>
            <a-tag color="blue">Payments</a-tag>
          </div>
          <div class="kpi-value">{{ kpi.paymentSuccessRate }}%</div>
          <div class="kpi-sub">성공 {{ kpi.paymentSuccess }} / 실패 {{ kpi.paymentFail }}</div>
        </a-card>
      </a-col>
    </a-row>

    <!-- ✅ 관리자 빠른메뉴: 토글 OFF면 전체 섹션 제거 -->
    <a-card
      v-if="showQuickMenu"
      class="mb24"
      :bordered="false"
      title="관리자 빠른메뉴"
    >
      <a-row :gutter="[16,16]" justify="center">
        <a-col :xs="24" :sm="12" :lg="8">
          <a-card title="회원" hoverable>
            <a-button class="btn-outline" size="large" block @click="goToMemberManagement">
              회원 관리
            </a-button>
          </a-card>
        </a-col>

        <a-col :xs="24" :sm="12" :lg="8">
          <a-card title="기부/결제" hoverable>
            <a-button class="btn-outline" size="large" block @click="goToPaymentView">
              기부/결제 관리
            </a-button>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="[16,16]" justify="center">
        <a-col :xs="24" :sm="12" :lg="8">
          <a-card title="게시글" hoverable>
            <a-button class="btn-outline" size="large" block @click="goToBoardManagement">
              게시글 관리
            </a-button>
          </a-card>
        </a-col>


        <a-col :xs="24" :sm="12" :lg="8">
          <a-card title="댓글" hoverable>
            <a-button class="btn-outline" size="large" block @click="goToCommentManagement">
              댓글 관리
            </a-button>
          </a-card>
        </a-col>
      </a-row>


    </a-card>

    <!-- 📈 일간 기부액 라인차트 -->
    <a-row :gutter="[16,16]" class="mb24">
      <a-col :span="24">
        <a-card :bordered="false" title="일간 기부액 추이" :extra="chartSubtitle">
          <div ref="chartRef" class="donation-linechart"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 경보/알림 -->
    <a-row :gutter="[16,16]" class="mb16" v-if="alerts.length">
      <a-col :span="24">
        <a-alert
          v-for="(al,idx) in alerts"
          :key="idx"
          :message="al.title"
          :description="al.message"
          :type="al.type"
          show-icon
          class="mb8"
        />
      </a-col>
    </a-row>

    <!-- 최근 테이블 2단 -->
    <a-row :gutter="[16,16]">
      <a-col :xs="24" :lg="12">
        <a-card :bordered="false" title="최근 결제 내역 5건" extra="<a>자세히</a>">
          <a-table :data-source="recentPayments" :columns="paymentCols" :pagination="false" row-key="id" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card :bordered="false" title="최근 신고 댓글 5건" extra="<a>자세히</a>">
          <a-table :data-source="recentReports" :columns="reportCols" :pagination="false" row-key="id" />
        </a-card>
      </a-col>
    </a-row>
  </a-layout-content>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import * as echarts from 'echarts'

const mainColor = '#00C851'
const router = useRouter()

/* ✅ 빠른메뉴 토글 상태 (영구 저장) */
const showQuickMenu = ref(true)

/* 빠른 이동 */
const goToBoardManagement = () => router.push('/admin/board')
const goToCommentManagement = () => router.push('/admin/comments')
const goToAnalytics = () => router.push('/admin/analytics')
const goToMemberManagement = () => router.push({ name: 'adminMemberInfo' })
const goToPaymentView = () => router.push('/admin/payments/view')
/* 날짜 선택/새로고침 */
const dateRange = ref([])
const onChangeRange = (val) => { dateRange.value = val }
const reload = () => { message.success('대시보드를 새로고침 했습니다.'); drawChart() }

/* KPI (더미) */
const kpi = ref({
  todayDonation: 1285000,
  totalDonation: 238000000,
  newUsers: 12,
  totalUsers: 5412,
  pendingReports: 7,
  dueIn48h: 3,
  paymentSuccessRate: 97.8,
  paymentSuccess: 112,
  paymentFail: 3
})

/* 알림 */
const alerts = ref([
  { type: 'warning', title: '신고 급증', message: '최근 1시간 신고 15건 발생. 스팸 계정 의심.' },
  { type: 'error', title: '결제 실패율 증가', message: '금일 실패율 5% 초과. PG 로그 확인 필요.' }
])

/* 최근 테이블 (더미) */
const recentPayments = ref([
  { id: 1, donor: 'kim***', amount: 50000, status: '성공', at: '2025-09-01 14:12' },
  { id: 2, donor: 'lee***', amount: 20000, status: '성공', at: '2025-09-01 13:54' },
  { id: 3, donor: 'park***', amount: 10000, status: '환불', at: '2025-09-01 13:21' },
  { id: 4, donor: 'choi***', amount: 30000, status: '성공', at: '2025-09-01 12:58' },
  { id: 5, donor: 'yoo***', amount: 100000, status: '성공', at: '2025-09-01 12:31' }
])
const paymentCols = [
  { title: '기부자', dataIndex: 'donor' },
  { title: '금액', dataIndex: 'amount', customRender: ({ text }) => formatCurrency(text) },
  { title: '상태', dataIndex: 'status' },
  { title: '시간', dataIndex: 'at' }
]

const recentReports = ref([
  { id: 11, commentId: 842, reason: 'SPAM', count: 4, at: '2025-09-01 14:40' },
  { id: 12, commentId: 799, reason: 'ABUSE', count: 3, at: '2025-09-01 14:22' },
  { id: 13, commentId: 788, reason: 'INAPPROPRIATE', count: 5, at: '2025-09-01 14:10' },
  { id: 14, commentId: 760, reason: 'SPAM', count: 3, at: '2025-09-01 13:49' },
  { id: 15, commentId: 742, reason: 'ABUSE', count: 6, at: '2025-09-01 13:32' }
])
const reportCols = [
  { title: '댓글ID', dataIndex: 'commentId' },
  { title: '사유', dataIndex: 'reason' },
  { title: '신고수', dataIndex: 'count' },
  { title: '시간', dataIndex: 'at' }
]

/* 차트 */
const chartRef = ref(null)
let chart
const chartSubtitle = computed(() => {
  if (!dateRange.value || dateRange.value.length !== 2) return '최근 14일'
  const [s, e] = dateRange.value
  return `${s.format('YYYY.MM.DD')} ~ ${e.format('YYYY.MM.DD')}`
})
const genDailyDonation = (days = 14) => {
  const labels = []; const values = []; const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    const mm = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0')
    labels.push(`${mm}-${dd}`)
    const base = 20000 + Math.round(Math.random() * 180000)
    const wave = Math.round(30000 * Math.sin((i / days) * Math.PI * 2))
    values.push(Math.max(10000, base + wave))
  }
  return { labels, values }
}
const state = ref(genDailyDonation())

const drawChart = async () => {
  await nextTick()
  if (!chartRef.value) return
  if (!chart) { chart = echarts.init(chartRef.value); window.addEventListener('resize', handleResize) }
  chart.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v) => formatCurrency(v) },
    grid: { left: 12, right: 12, top: 24, bottom: 8, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: state.value.labels, axisLine: { lineStyle: { color: '#e5e5e5' } }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLabel: { formatter: (v) => `${Math.round(v/1000)}k` }, splitLine: { lineStyle: { type: 'dashed', color: '#eee' } } },
    series: [{
      name: '일간 기부액', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
      lineStyle: { width: 3, color: mainColor }, areaStyle: { opacity: 0.2, color: mainColor },
      itemStyle: { color: mainColor }, data: state.value.values
    }]
  })
}
const handleResize = () => { chart && chart.resize() }

/* ✅ 토글 상태 영구 저장 */
onMounted(() => {
  const v = localStorage.getItem('admin:quick')
  if (v !== null) showQuickMenu.value = v === '1'
  drawChart()
})
watch(showQuickMenu, v => localStorage.setItem('admin:quick', v ? '1' : '0'))

/* 날짜 변경 시 데이터 리로드(실제로는 API 호출) */
watch(dateRange, () => { state.value = genDailyDonation(); drawChart() })

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) { chart.dispose(); chart = null }
})

/* 유틸 */
const formatCurrency = (n) =>
  new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(n)
</script>

<style scoped>
.admin-dashboard { padding: 16px 21px 28px; background: #f7f9fb; --brand: #00C851; }
.header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
.title h2 { margin: 0; }
.subtitle { color: #7a7a7a; margin: 4px 0 0; }
.filters { display: flex; align-items: center; }
.switch-label { margin-left: 6px; color: #7a7a7a; font-size: 12px; }
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

/* 📌 Outline 버튼(빠른메뉴 전용) */
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

/* Chart */
.donation-linechart { width: 100%; height: 320px; }

/* 카드 내부 링크 색상 */
:deep(.ant-card-head-title) { font-weight: 700; }
:deep(.ant-card-extra) { color: #9aa0a6; font-size: 12px; }
:deep(.ant-card-extra a) { color: var(--brand); }
</style>
