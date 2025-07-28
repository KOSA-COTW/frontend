<script setup>
import { Progress } from 'ant-design-vue'

const totalDonation = '9,999,999,999원'

const donationItems = [
  {
    id: 1,
    image: 'https://picsum.photos/400/200?random=1',
    category: '아동',
    title: '전라북도 전주시 새누리지역아동센터 아이들 28명에게 따뜻한 간식을',
    percent: 79.4,
    remaining: '마감까지 103,700원',
  },
  {
    id: 2,
    image: 'https://picsum.photos/400/200?random=2',
    category: '장애인',
    title: '서울시 중랑구 해오름지역아동센터 장애 아동들에게 안전한 교통비를',
    percent: 52.1,
    remaining: '마감까지 51,200원',
  },
  {
    id: 3,
    image: 'https://picsum.photos/400/200?random=3',
    category: '어르신',
    title: '부산시 사하구 사랑지역아동센터 어르신들께 건강 검진비를',
    percent: 92.6,
    remaining: '마감까지 12,800원',
  },
  {
    id: 4,
    image: 'https://picsum.photos/400/200?random=4',
    category: '동물',
    title: '대전시 서구 아람지역 내 유기동물 보호소에 사료와 의약품을',
    percent: 33.3,
    remaining: '마감까지 80,000원',
  },
  {
    id: 5,
    image: 'https://picsum.photos/400/200?random=5',
    category: '환경',
    title: '경기도 수원시 하늘지역 환경 정화 활동에 필요한 물품을',
    percent: 45.7,
    remaining: '마감까지 60,300원',
  },
  {
    id: 6,
    image: 'https://picsum.photos/400/200?random=6',
    category: '지구촌',
    title: '인천시 연수구 드림지역 아이들에게 지구촌 교육 지원을',
    percent: 67.2,
    remaining: '마감까지 42,600원',
  },
]
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
  </div>

  <!-- 카드 목록 -->
  <div style="padding: 20px">
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
        <a-card :hoverable="true" class="custom-card" :bordered="false">
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
              <span class="remaining">{{ item.remaining }}</span>
              <span class="percent">{{ item.percent }}%</span>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>

  <!-- 이벤트 배너 영역 -->
<div class="event-banner-section">
  <a-row :gutter="16">
    <a-col :span="12">
      <div class="event-banner pink-banner">
        <div>
          <div class="banner-title">Center of the World 알림 신청하고</div>
          <div class="banner-subtitle">기부포인트 3,000P 받기 &gt;</div>
        </div>
        <img src="https://cdn-icons-png.flaticon.com/512/833/833472.png" class="banner-icon" />
      </div>
    </a-col>
    <a-col :span="12">
      <div class="event-banner dark-banner">
        <div>
          <div class="banner-title">친구 초대하고 기부포인트 받기</div>
          <div class="banner-subtitle">이벤트 보러가기 &gt;</div>
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
    <div v-for="category in categories" :key="category.id" class="category-item">
      <div class="circle-icon">
        <img :src="category.icon" alt="icon" />
      </div>
      <div class="category-name">{{ category.name }}</div>
    </div>
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
}

.category {
  color: #00C851;
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.bottom-info {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  color: #777;
  font-size: 0.85rem;
}

.percent {
  color: #00C851;
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
  background-color: #fcfcf6;
  padding: 30px 20px 10px;
  margin-bottom: 30px;
}

.category-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 20px;
}

.category-list {
  display: flex;
  justify-content: center;
  gap: clamp(12px, 3vw, 40px);
  padding-bottom: 10px;
  flex-wrap: wrap;        
}

.category-item {
  flex: 0 0 auto;
  text-align: center;
  width: 80px;
}

.circle-icon {
  width: 60px;
  height: 60px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 3px 6px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 6px;
}

.circle-icon img {
  width: 32px;
  height: 32px;
}

.category-name {
  font-size: 0.8rem;
}

</style>
