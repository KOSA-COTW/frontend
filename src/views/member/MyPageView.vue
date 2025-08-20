<template>
  <div class="my-page">
    <a-row :gutter="24" justify="center">
      <!-- 좌측 메뉴 -->
      <a-col :xs="24" :sm="6" :md="5" :lg="5" :xl="4">
        <div class="sidebar">
          <ul>
            <li v-for="item in menuItems" :key="item" :class="{ active: selectedMenu === item }" @click="handleMenuClick(item)">
              {{ item }}
            </li>
          </ul>
        </div>
      </a-col>

      <!-- 우측 본문 -->
      <a-col :xs="24" :sm="18" :md="17" :lg="15" :xl="14">
        <!-- 정보수정 섹션 -->
        <div v-if="selectedMenu === '정보수정'">
          <!-- 상단 카드 -->
          <a-card class="top-card">
            <div class="top-section">
              <!-- 사용자 프로필 사진 들어갈 부분 -->
              <a-avatar :size="64" src="https://via.placeholder.com/64" />
              <div class="user-info">
                <p class="welcome-text">
                  {{ userName }}님,<br />함께한지 <span class="highlight">1일</span>이 되었어요.
                </p>
                <div class="link-buttons">
                  <a-button type="link" size="small">내정보수정</a-button>
                  <a-divider type="vertical" />
                  <a-button type="link" size="small" @click="logout">로그아웃</a-button>
                </div>

                <div class="invite-box">
                  <div class="invite-header">
                    <div>
                      <p class="invite-title">친구 초대하기</p>
                    </div>
                  </div>
                  <div class="invite-summary">
                    <span>초대한 친구 <b>0명</b></span>

                  </div>
                </div>
              </div>
            </div>
          </a-card>

          <!-- 기부내역 요약 카드 -->
          <a-card class="donation-card">
            <div class="donation-summary">
              <div>
                <p class="label">총 기부금액</p>
                <p class="amount">0원</p>
              </div>
              <div class="count">
                <p>일시기부 <b>0회</b></p>
                <p>정기기부 <b>0회</b></p>
              </div>
            </div>
            <div class="more-link">
              <a-button type="link" size="small" @click="handleMenuClick('기부내역')">자세히보기 ></a-button>
            </div>
          </a-card>
        </div>

        <!-- 기부내역 섹션 -->
        <div v-else-if="selectedMenu === '기부내역'" class="payment-history-section">
          <PaymentHistoryView 
            title="내 기부 내역"
            subtitle="지금까지의 기부 활동을 확인해보세요"
            :hide-stats="false"
          />
        </div>

        <!-- 다른 메뉴 섹션들 -->
        <div v-else class="other-menu-section">
          <a-card>
            <div style="text-align: center; padding: 60px 20px;">
              <h3>{{ selectedMenu }}</h3>
              <p>{{ selectedMenu }} 기능은 준비 중입니다.</p>
            </div>
          </a-card>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';
import PaymentHistoryView from '@/views/payment/PaymentHistoryView.vue';

const router = useRouter();
const auth = useAuthStore();

const userName = '박주성';
const menuItems = ['정보수정', '기부내역', '포인트내역', '증서출급', '기부금영수증'];
const selectedMenu = ref('정보수정');

// 메뉴 클릭 핸들러
const handleMenuClick = (item) => {
  console.log('[MyPageView] Menu clicked:', item)
  console.log('[MyPageView] Current selectedMenu before:', selectedMenu.value)
  selectedMenu.value = item;
  console.log('[MyPageView] Current selectedMenu after:', selectedMenu.value)
};

// 로그아웃
const logout = () => {
  auth.logout();
  message.success('로그아웃되었습니다.');
  router.push('/');
};
</script>

<style scoped>
.my-page {
  min-height: 100vh;
  padding: 32px 16px;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar li {
  padding: 12px 16px;
  margin-bottom: 8px;
  background: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  color: #333;
  border: 1px solid #ccc;
  text-align: center;
}

.sidebar li:hover {
  border-color: #00C851;
  color: #00C851;
  background-color: transparent;
}

.sidebar li.active {
  border: 2px solid #00C851;
  color: #00C851;
  background-color: transparent;
  font-weight: 600;
}

.top-card,
.donation-card {
  border-radius: 16px;
  padding: 24px;
}

.top-section {
  display: flex;
  gap: 16px;
}

.user-info {
  flex: 1;
}

.welcome-text {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.highlight {
  color: #00C851;
}

.link-buttons {
  font-size: 12px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.invite-box {
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
}

.invite-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.invite-title {
  font-size: 14px;
  font-weight: 600;
}

.invite-sub {
  font-size: 12px;
  color: #666;
}

.invite-summary {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #555;
}

.donation-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.label {
  font-size: 14px;
  color: #888;
  margin-bottom: 4px;
}

.amount {
  font-size: 28px;
  font-weight: bold;
}

.count {
  font-size: 13px;
  text-align: right;
  color: #444;
}

.more-link {
  text-align: right;
  margin-top: 8px;
}

.ri-share-line {
  font-size: 16px;
  color: #666;
}

/* PaymentHistoryView 통합 스타일 */
.payment-history-section {
  margin-top: 0;
}

.payment-history-section :deep(.payment-history) {
  max-width: none;
  margin: 0;
  padding: 0;
}

.payment-history-section :deep(.payment-history-header) {
  margin-bottom: 24px;
  text-align: left;
}

.other-menu-section {
  margin-top: 0;
}

@media (max-width: 768px) {
  .top-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .link-buttons {
    justify-content: center;
  }

  .invite-summary {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }

  .donation-summary {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }

  .count {
    text-align: center;
  }

  .sidebar li {
    text-align: center;
  }
}

</style>
