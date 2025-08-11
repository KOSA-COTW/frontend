<script setup>
import { computed } from 'vue'
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'
import { Progress } from 'ant-design-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = useCounterStore()

// Pinia refs를 안전하게 분해 (반응성 유지)
const {
  filteredDonations,
  totalDonationFiltered,
  selectedCategory
} = storeToRefs(store)

// v-for용 목록 / 총합
const donationItems = filteredDonations
const totalDonation = computed(() => totalDonationFiltered.value.toLocaleString() + '원')

// 카테고리 클릭(같은 것 재클릭 시 전체로)
function onClickCategory(name) {
  selectedCategory.value === name
    ? store.clearCategory()
    : store.setCategory(name)
}

// 상세페이지 이동
function goDetail(id) {
  router.push({ name: 'postDetail', params: { id } })
}

// 카테고리 목록 (그대로)
const categories = [
  { id: 1, name: '아동', icon: 'https://cdn-icons-png.flaticon.com/512/921/921347.png' },
  { id: 2, name: '장애인', icon: 'https://cdn-icons-png.flaticon.com/512/8731/8731087.png' },
  { id: 3, name: '어르신', icon: 'https://cdn-icons-png.flaticon.com/512/9301/9301483.png' },
  { id: 4, name: '동물', icon: 'https://cdn-icons-png.flaticon.com/512/616/616408.png' },
  { id: 5, name: '환경', icon: 'https://cdn-icons-png.flaticon.com/512/1598/1598431.png' },
  { id: 6, name: '지구촌', icon: 'https://cdn-icons-png.flaticon.com/512/10218/10218091.png' },
  { id: 7, name: '사회', icon: 'https://cdn-icons-png.flaticon.com/512/14931/14931623.png' }
]
</script>

<template>
  <!-- 총 기부금 박스 -->
  <div class="donation-summary-box">
    <a-row align="middle" justify="center">
      <a-col>
        <span class="label">총 기부금</span>
      </a-col>
      <a-col>
        <h2 class="amount">{{ totalDonation }}</h2>
      </a-col>
    </a-row>
    <!-- 선택된 카테고리 안내 + 전체보기 -->
    <div v-if="store.selectedCategory" style="margin-top:.5rem;font-size:.9rem;">
      현재 카테고리: <b>{{ store.selectedCategory }}</b>
      <a @click="store.clearCategory()" style="margin-left:8px; color:#fff; text-decoration:underline; cursor:pointer;">
        전체보기
      </a>
    </div>
  </div>

  <!-- 카드 목록 -->
  <div>
    <a-row :gutter="16">
      <a-col
        v-for="item in donationItems"
        :key="item.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="8"
        :xl="8"
      >
        <a-card
          :hoverable="true"
          class="custom-card"
          :bordered="false"
          @click="goDetail(item.id)"
          style="cursor:pointer"
        >
          <img :src="item.image" class="donation-image" />

          <div class="donation-text">
            <div class="category">#{{ item.category }}</div>
            <div class="title">{{ item.title }}</div>
            <Progress
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

  <!-- 소개/공지 배너 (그대로) -->
  <div class="event-banner-section">
    <a-row :gutter="16">
      <a-col :span="12">
        <div class="event-banner pink-banner">
          <div>
            <div class="banner-title">세상의 중심은 어디일까요?</div>
            <div class="banner-subtitle">힘들어 하는 사람의 손을 잡아주는 곳, 바로 그곳이 세상의 중심입니다. &gt;</div>
          </div>
          <img src="https://cdn-icons-png.flaticon.com/512/833/833472.png" class="banner-icon" />
        </div>
      </a-col>
      <a-col :span="12">
        <div class="event-banner dark-banner">
          <div>
            <div class="banner-title">공지사항</div>
            <div class="banner-subtitle">커뮤니티 이용 규칙 안내 &gt;</div>
          </div>
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="banner-icon" />
        </div>
      </a-col>
    </a-row>
  </div>

  <!-- 카테고리 리스트 -->
  <div class="category-section">
    <div class="category-title">카테고리</div>
    <div class="category-list">
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-item"
        :class="{ active: selectedCategory === category.name }"
        @click="onClickCategory(category.name)"
      >
        <div class="circle-icon">
          <img :src="category.icon" alt="icon" />
        </div>
        <div class="category-name">{{ category.name }}</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.donation-summary-box {
  background-color: #00C851;
  color: white;
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  max-width: 100%;
  margin: 2rem auto;
}
.label { font-size: 1.1rem; margin-right: 1rem; font-weight: 500; }
.amount { font-size: 2rem; margin: 0; }

.custom-card {
  padding: 0;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 30px;
}
.donation-image {
  width: 100%; height: 180px; object-fit: cover;
  border-top-left-radius: 12px; border-top-right-radius: 12px;
}
.donation-text { padding: 12px 16px; background-color: white; }
.category { color: #00C851; font-weight: bold; margin-bottom: 4px; font-size: 0.9rem; }
.title { font-size: 1rem; font-weight: 600; margin-bottom: 8px; }
.bottom-info { display: flex; justify-content: space-between; margin-top: 4px; color: #777; font-size: 0.85rem; }
.percent { color: #00C851; font-weight: bold; }

.event-banner-section { margin: 40px 20px; }
.event-banner {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px; border-radius: 12px; color: white; height: 100px;
}
.pink-banner { background-color: #f9848a; }
.dark-banner { background-color: #2e2e2e; }
.banner-title { font-size: 1rem; font-weight: bold; }
.banner-subtitle { font-size: 0.85rem; margin-top: 4px; color: #fff; opacity: 0.9; }
.banner-icon { width: 50px; height: 50px; }

.category-section { background-color: #fcfcf6; padding: 30px 20px 10px; margin-bottom: 30px; }
.category-title { font-size: 1.2rem; font-weight: bold; margin-bottom: 20px; }
.category-list {
  display: flex; justify-content: center; gap: clamp(12px, 3vw, 40px);
  padding-bottom: 10px; flex-wrap: wrap;
}

/*  클릭 가능 & 활성화 표시 */
.category-item {
  all: unset;
  cursor: pointer;
  display: inline-block;
  text-align: center;
  width: 80px;
}
.category-item.active .circle-icon { box-shadow: 0 0 0 3px rgba(0,200,81,.25); }
.category-item.active .category-name { color:#00C851; font-weight:700; }

.circle-icon {
  width: 60px; height: 60px; background-color: white; border-radius: 50%;
  box-shadow: 0 3px 6px rgba(0,0,0,0.1);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 6px;
}
.circle-icon img { width: 32px; height: 32px; }
.category-name { font-size: 0.8rem; }
</style>
