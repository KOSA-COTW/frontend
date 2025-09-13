<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Progress } from 'ant-design-vue'
import { usePostStore } from '@/stores/post'
import { storeToRefs } from 'pinia'

const router = useRouter()
const postStore = usePostStore()
const categoryContainer = ref(null)

const { posts, totalPostAll, loading } = storeToRefs(postStore)
const postItems = posts
const totalDonation = computed(() => (totalPostAll.value || 0).toLocaleString() + '원')

// 카테고리 클릭(같은 것 재클릭 시 전체로)
function onClickCategory(name) {
  selectedCategory.value === name ? postStore.clearCategory() : postStore.setCategory(name)
}

// 상세페이지 이동
function goDetail(id) {
  router.push({ name: 'postDetail', params: { id } })
}

// 페이지 로드시 API 호출
onMounted(() => {
  console.log('메인페이지 onMounted 실행됨')
  postStore.fetchPostsHome()
  postStore.fetchDonationTotal()
})

// 카테고리 스크롤 함수
function scrollCategories(direction) {
  if (!categoryContainer.value) return

  const scrollAmount = 200
  const currentScroll = categoryContainer.value.scrollLeft

  if (direction === 'left') {
    categoryContainer.value.scrollTo({
      left: currentScroll - scrollAmount,
      behavior: 'smooth'
    })
  } else {
    categoryContainer.value.scrollTo({
      left: currentScroll + scrollAmount,
      behavior: 'smooth'
    })
  }
}

// 카테고리 목록
const categories = [
  { id: 0, name: '전체', icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png' },
  { id: 1, name: '아동', icon: 'https://cdn-icons-png.flaticon.com/512/921/921347.png' },
  { id: 2, name: '장애인', icon: 'https://cdn-icons-png.flaticon.com/512/8731/8731087.png' },
  { id: 3, name: '어르신', icon: 'https://cdn-icons-png.flaticon.com/512/9301/9301483.png' },
  { id: 4, name: '동물', icon: 'https://cdn-icons-png.flaticon.com/512/616/616408.png' },
  { id: 5, name: '환경', icon: 'https://cdn-icons-png.flaticon.com/512/1598/1598431.png' },
  { id: 6, name: '지구촌', icon: 'https://cdn-icons-png.flaticon.com/512/10218/10218091.png' },
  { id: 7, name: '사회', icon: 'https://cdn-icons-png.flaticon.com/512/14931/14931623.png' },
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
  </div>

  <!-- 로딩 상태 -->
  <div v-if="loading" style="text-align: center; padding: 2rem">로딩 중…</div>

  <!-- 카드 목록 -->
  <div v-else>
    <a-row :gutter="16">
      <a-col v-for="item in postItems" :key="item.id" :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
        <a-card
          :hoverable="true"
          class="custom-card"
          :bordered="false"
          @click="goDetail(item.id)"
          style="cursor: pointer"
        >
          <img :src="item.image || '/post/default_post.png'" class="donation-image" />

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
              <span class="percent" :class="{ over: item.percentRaw >= 100 }">
                {{ Math.trunc(item.percentRaw) }}%
                <span v-if="item.percentRaw >= 100"> 🎉</span>
              </span>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>

  <!-- 소개/공지 배너 -->
  <div class="event-banner-section">
    <a-row :gutter="16">
      <a-col :span="12">
        <div class="event-banner pink-banner" @click="router.push('/about')" style="cursor: pointer">
          <div>
            <div class="banner-title">세상의 중심은 어디일까요?</div>
            <div class="banner-subtitle">
              힘들어 하는 사람의 손을 잡아주는 곳, 바로 그곳이 세상의 중심입니다. &gt;
            </div>
          </div>
          <img src="https://cdn-icons-png.flaticon.com/512/833/833472.png" class="banner-icon" />
        </div>
      </a-col>
      <a-col :span="12">
        <div class="event-banner dark-banner" @click="router.push('/notices')" style="cursor: pointer">
          <div>
            <div class="banner-title">공지사항</div>
            <div class="banner-subtitle">커뮤니티 이용 규칙 안내 &gt;</div>
          </div>
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="banner-icon" />
        </div>
      </a-col>
    </a-row>
  </div>

  <!-- 새로운 카테고리 디자인 -->
  <div class="category-section">
    <div class="category-header">
      <h2 class="category-title">카테고리</h2>
      <div class="category-nav">
        <button class="nav-btn prev" @click="scrollCategories('left')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="nav-btn next" @click="scrollCategories('right')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="category-scroll-container" ref="categoryContainer">
      <div class="category-list">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          @click="() => {
            if (category.name === '전체') {
              router.push({ name: 'postList' })
            } else {
              router.push({
              name: 'postList',
              query: { category: category.name }
            })
            }
          }"
        >
          <div class="category-circle">
            <img :src="category.icon" :alt="category.name" />
          </div>
          <span class="category-name">{{ category.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.donation-summary-box {
  background-color: #00c851;
  color: white;
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  max-width: 100%;
  margin: 2rem auto;
}
.label {
  font-size: 1.1rem;
  margin-right: 1rem;
  font-weight: 500;
}
.amount {
  font-size: 2rem;
  margin: 0;
}
.custom-card {
  padding: 0;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 30px;
}
.donation-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
.donation-text {
  padding: 12px 16px;
  background-color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 150px;
}
.category {
  color: #00c851;
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 0.9rem;
}
.title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 2.8em;
}
.bottom-info {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  color: #777;
  font-size: 0.85rem;
}
.percent {
  color: #00c851;
  font-weight: bold;
}
.event-banner-section {
  margin: 40px 20px;
}
.event-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  color: white;
  height: 100px;
}
.pink-banner {
  background-color: #f9848a;
}
.dark-banner {
  background-color: #2e2e2e;
}
.banner-title {
  font-size: 1rem;
  font-weight: bold;
}
.banner-subtitle {
  font-size: 0.85rem;
  margin-top: 4px;
  color: #fff;
  opacity: 0.9;
}
.banner-icon {
  width: 50px;
  height: 50px;
}

.category-section {
  padding: 30px 20px;
  background: white;
  margin: 40px 0;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 4px;
}

.category-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.category-nav {
  display: flex;
  gap: 8px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

.nav-btn:hover {
  border-color: #00c851;
  color: #00c851;
  background: #f8f9fa;
}

.category-scroll-container {
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.category-scroll-container::-webkit-scrollbar {
  display: none;
}

.category-list {
  display: flex;
  gap: 56px;
  padding: 8px 4px 20px 4px;
  min-width: fit-content;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 12px;
  border-radius: 12px;
  min-width: 80px;
}

.category-item:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
}

.category-circle {
  width: 80px;
  height: 80px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.category-circle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  background: #ffd700;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.category-circle img {
  width: 36px;
  height: 36px;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
}

.category-item:hover .category-circle {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.category-item:hover .category-circle::before {
  background: #00c851;
  transform: translate(-50%, -50%) scale(1.1);
}

.category-name {
  font-size: 1.2rem;
  font-weight: 500;
  color: #333;
  text-align: center;
  transition: all 0.3s ease;
}

.category-item:hover .category-name {
  color: #00c851;
  font-weight: 600;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .category-header {
    padding: 0;
  }

  .category-title {
    font-size: 1.2rem;
  }

  .category-list {
    gap: 20px;
  }

  .category-circle {
    width: 60px;
    height: 60px;
  }

  .category-circle img {
    width: 28px;
    height: 28px;
  }

  .category-circle::before {
    width: 20px;
    height: 20px;
  }

  .category-name {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .category-section {
    padding: 25px 16px;
    margin: 30px 0;
  }

  .category-list {
    gap: 16px;
  }

  .category-circle {
    width: 55px;
    height: 55px;
  }

  .category-circle img {
    width: 26px;
    height: 26px;
  }
}
.percent.over {
  color: #00C851;   /* 메인컬러나 강조색 */
  font-weight: bold;
}
</style>
