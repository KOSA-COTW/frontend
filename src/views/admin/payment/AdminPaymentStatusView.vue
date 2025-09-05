<template>
  <div class="page">
    <a-page-header title="결제 현황" sub-title="성공/실패/환불 및 수단별 통계" />

    <a-row :gutter="[16,16]" class="mb16">
      <a-col :xs="12" :md="6"><a-card :bordered="false" class="kpi">
        <div class="kpi-title">총 결제 금액</div>
        <div class="kpi-value">{{ currency(kpi.totalAmount) }}</div>
      </a-card></a-col>
      <a-col :xs="12" :md="6"><a-card :bordered="false" class="kpi">
        <div class="kpi-title">성공 수</div>
        <div class="kpi-value">{{ kpi.done }}</div>
      </a-card></a-col>
      <a-col :xs="12" :md="6"><a-card :bordered="false" class="kpi">
        <div class="kpi-title">실패 수</div>
        <div class="kpi-value">{{ kpi.failed }}</div>
      </a-card></a-col>
      <a-col :xs="12" :md="6"><a-card :bordered="false" class="kpi">
        <div class="kpi-title">성공률</div>
        <div class="kpi-value">{{ kpi.successRate }}%</div>
      </a-card></a-col>
    </a-row>

    <a-row :gutter="[16,16]">
      <a-col :xs="24" :lg="12">
        <a-card :bordered="false" title="일간 결제 건수">
          <div ref="lineRef" class="chart"></div>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card :bordered="false" title="상태 비율">
          <div ref="pieRef" class="chart"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16,16]" class="mt16">
      <a-col :xs="24" :lg="12">
        <a-card :bordered="false" title="결제 수단별 금액">
          <div ref="barRef" class="chart"></div>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card :bordered="false" title="최근 실패 사유 Top 5">
          <a-table :data-source="failList" :columns="failCols" :pagination="false" size="small" row-key="reason" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

const kpi = ref({ totalAmount: 382000000, done: 112, failed: 5, successRate: 95.7 })

// 더미 fail 사유
const failList = ref([
  { reason:'카드한도 초과', count:12 },
  { reason:'인증 실패(3DS)', count:9 },
  { reason:'잔액 부족', count:7 },
  { reason:'만료카드', count:4 },
  { reason:'PG 오류', count:3 },
])
const failCols = [
  { title:'사유', dataIndex:'reason' },
  { title:'건수', dataIndex:'count' }
]

const lineRef = ref(null)
const pieRef = ref(null)
const barRef = ref(null)
let lineChart, pieChart, barChart

function currency(n){ return new Intl.NumberFormat('ko-KR',{style:'currency',currency:'KRW',maximumFractionDigits:0}).format(n ?? 0) }

function genDaily(days=14){
  const labels=[], values=[]
  const today = new Date()
  for(let i=days-1;i>=0;i--){
    const d = new Date(today); d.setDate(today.getDate()-i)
    labels.push(`${d.getMonth()+1}-${String(d.getDate()).padStart(2,'0')}`)
    values.push(40 + Math.round(Math.random()*60))
  }
  return { labels, values }
}
const daily = genDaily()

const statusAgg = [
  { name:'DONE', value: 112 },
  { name:'FAILED', value: 5 },
  { name:'CANCELED', value: 3 },
  { name:'REFUND', value: 7 },
  { name:'PENDING', value: 2 }
]

const byMethod = [
  { name:'CARD', value: 182000000 },
  { name:'VBANK', value: 76000000 },
  { name:'TRANSFER', value: 54000000 },
  { name:'MOBILE', value: 7000000 },
]

async function draw(){
  await nextTick()
  lineChart = echarts.init(lineRef.value)
  pieChart  = echarts.init(pieRef.value)
  barChart  = echarts.init(barRef.value)

  lineChart.setOption({
    tooltip:{trigger:'axis'},
    xAxis:{type:'category', data: daily.labels},
    yAxis:{type:'value'},
    grid:{left:24,right:18,top:16,bottom:18,containLabel:true},
    series:[{ type:'line', data: daily.values, smooth:true }]
  })
  pieChart.setOption({
    tooltip:{trigger:'item'},
    legend:{bottom:0},
    series:[{ type:'pie', radius:['40%','70%'], avoidLabelOverlap:false, data: statusAgg }]
  })
  barChart.setOption({
    tooltip:{trigger:'axis'},
    xAxis:{ type:'category', data: byMethod.map(x=>x.name) },
    yAxis:{ type:'value' },
    grid:{left:24,right:18,top:16,bottom:18,containLabel:true},
    series:[{ type:'bar', data: byMethod.map(x=>x.value) }]
  })

  window.addEventListener('resize', onResize)
}
function onResize(){
  lineChart?.resize(); pieChart?.resize(); barChart?.resize()
}
onMounted(draw)
onBeforeUnmount(()=>{
  window.removeEventListener('resize', onResize)
  lineChart?.dispose(); pieChart?.dispose(); barChart?.dispose()
})
</script>

<style scoped>
.page{ padding: 12px 16px 28px; }
.mb16{ margin-bottom: 16px; }
.mt16{ margin-top: 16px; }
.kpi{ border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,.06); }
.kpi-title{ color:#666; font-weight:600; }
.kpi-value{ font-size:24px; font-weight:800; margin-top:4px; }
.chart{ width:100%; height:320px; }
</style>
