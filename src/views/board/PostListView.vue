<script setup>
import { onMounted } from 'vue'
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = useCounterStore()
const { donations } = storeToRefs(store)

// 전체 공개글 로드
onMounted(() => {
  store.fetchDonationsAll()
})

// 상세 이동
function goDetail(id) {
  router.push({ name: 'postDetail', params: { id } })
}
</script>

<template>
  <div style="max-width:1100px;margin:24px auto;padding:0 12px;">

    <a-row :gutter="16">
      <a-col
        v-for="item in donations"
        :key="item.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <a-card
          hoverable
          class="custom-card"
          :bordered="false"
          @click="goDetail(item.id)"
          style="cursor:pointer"
        >
          <img :src="item.image || 'https://placehold.co/300x180'" class="donation-image" />
          <div class="donation-text">
            <div class="category">#{{ item.category }}</div>
            <div class="title">{{ item.title }}</div>
            <a-progress
              :percent="item.percent"
              :stroke-color="'#00C851'"
              :show-info="false"
              style="margin-top: 10px"
            />
            <div class="bottom-info">
              <span class="remaining">마감까지 {{ (item.target - item.raised).toLocaleString() }}원</span>
              <span class="percent">{{ ((item.raised / item.target) * 100).toFixed(1) }}%</span>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.custom-card { padding:0; overflow:hidden; border-radius:12px; box-shadow:0 6px 12px rgba(0,0,0,.15); margin-bottom:24px; }
.donation-image { width:100%; height:180px; object-fit:cover; border-top-left-radius:12px; border-top-right-radius:12px; }
.donation-text { padding:12px 16px; background:#fff; }
.category { color:#00C851; font-weight:700; margin-bottom:4px; font-size:.9rem; }
.title { font-size:1rem; font-weight:600; margin-bottom:8px; }
.bottom-info { display:flex; justify-content:space-between; margin-top:4px; color:#777; font-size:.85rem; }
.percent { color:#00C851; font-weight:700; }
</style>
