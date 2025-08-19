<script setup>
import { ref, onMounted  } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MoreOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import { usePaymentStore } from '@/stores/payment'
import api from '@/utils/axios'
const mainColor = '#00C851'
const newComment = ref('')
const comments = ref([])

// 모달 관련 상태
const donationModalVisible = ref(false)
const donationAmount = ref(10000)
const customAmount = ref('')
const quickAmounts = [5000, 10000, 20000, 50000, 100000, 200000]

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const paymentStore = usePaymentStore()
const postId = route.params.id

// 상태값
const post = ref(null)
const loading = ref(true)
const error = ref(null)

async function fetchPostDetail() {
  try {
    const data = await api.get(`/api/posts/${postId}`)
    post.value = data
  } catch (err) {
    console.error('게시글 불러오기 실패:', err)
    error.value = '게시글을 불러오는 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}

function addComment() {
  if (newComment.value.trim()) {
    comments.value.push(newComment.value)
    newComment.value = ''
  }
}

async function deletePost() {
  if (!confirm('정말 삭제하시겠습니까?')) return
  try {
    await api.delete(`/api/posts/${postId}`)
    alert('삭제 완료!')
    router.push('/') // 삭제 후 메인으로 이동
  } catch (err) {
    console.error('삭제 실패:', err)
    alert(err?.response?.status === 403
     ? '삭제 권한이 없습니다.'
     : '삭제 중 오류가 발생했습니다.')
  }
}

function editPost() {
  router.push(`/posts/${postId}/edit`)
}

// 기부 모달 관련 함수
function openDonationModal() {
  if (!auth.isLoggedIn) {
    message.warning('로그인이 필요합니다.')
    router.push('/login')
    return
  }
  donationModalVisible.value = true
}

function closeDonationModal() {
  donationModalVisible.value = false
  donationAmount.value = 10000
  customAmount.value = ''
}

function setQuickAmount(amount) {
  donationAmount.value = amount
  customAmount.value = ''
}

function setCustomAmount() {
  const amount = parseInt(customAmount.value)
  if (amount && amount >= 1000) {
    donationAmount.value = amount
  } else {
    message.error('최소 기부 금액은 1,000원입니다.')
  }
}

function proceedToPayment() {
  if (donationAmount.value < 1000) {
    message.error('최소 기부 금액은 1,000원입니다.')
    return
  }

  // 1. Pinia 스토어에 금액 저장
  console.log(`[PostDetailView] Proceeding to payment with amount: ${donationAmount.value}`);
  paymentStore.setDonationAmount(donationAmount.value)

  // 2. window.location.href로 강제 이동 (하드 리로드)
  closeDonationModal()
  const url = `/payment/checkout/${postId}?title=${encodeURIComponent(post.value?.title || '')}&category=${encodeURIComponent(post.value?.category || '')}`
  window.location.href = url
}

// 컴포넌트 로드 시 실행
onMounted(fetchPostDetail)
</script>

<template>
  <div class="detail-root" v-if="post">
    <!-- 상단 카테고리 뱃지 & 제목 -->
    <div class="badge-row">
      <span class="badge">{{ post.category }}</span>
      <!-- 필요하면 badge2, badge3도 store 데이터에 추가해서 사용 -->
    </div>
    <div class="title-row">
      <h2 class="detail-title">{{ post.title }}</h2>
      <a-dropdown placement="bottomRight">
        <a class="ant-dropdown-link" @click.prevent>
          <more-outlined style="font-size: 20px; cursor: pointer;" />
        </a>
        <template #overlay>
          <a-menu>
            <a-menu-item @click="editPost">수정하기</a-menu-item>
            <a-menu-item danger @click="deletePost">삭제하기</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>

    <div class="main-row">
      <div class="main-left">
        <a-carousel v-if="post.imageUrls && post.imageUrls.length" autoplay style="width:100%;border-radius:16px;">
  <div v-for="(img, idx) in post.imageUrls" :key="idx">
    <div class="img-wrap">
      <img class="main-img" :src="img || 'https://placehold.co/300x180'" />
    </div>
  </div>
</a-carousel>

<!-- fallback -->
<div v-else class="img-wrap">
  <img class="main-img" src="https://placehold.co/300x180" />
</div>

      </div>
      <div class="main-right">
        <div class="progress-card">
          <div class="progress-header">
            <span>
              마감까지 {{ (post.amount - post.currentAmount).toLocaleString() }}원
            </span>
            <span class="percent">
              {{ ((post.currentAmount / post.amount) * 100).toFixed(1) }}%
            </span>
          </div>
          <a-progress
            :percent="Number(((post.currentAmount / post.amount) * 100).toFixed(1))"
            :stroke-color="mainColor"
            :show-info="false"
          />
          <div class="current">
            {{ post.raised ? post.raised.toLocaleString() + '원 모금' : '---' }}
          </div>
          <div class="progress-info">
            <div>모금 시작일 <span>{{ post.createdAt }}</span></div>
            <div>모금목표 <span>{{ post.amount ? post.amount.toLocaleString() + '원' : '---' }}</span></div>
            <div>후원잔액까지 <span>
              {{ (post.amount - post.currentAmount).toLocaleString() }}원
            </span></div>
            <div>총 참여인원 <span>{{ post.participants?.length || 0 }}명</span></div>
          </div>
          <a-button type="primary" class="donate-btn" :style="{background: mainColor, borderColor: mainColor}" @click="openDonationModal">
            곧장기부하기
          </a-button>
        </div>
      </div>
    </div>

    <!-- 상세 내용 -->
    <div class="desc-section">
      <div class="desc-title">
        기부금이 <span style="color:#FFC107">곧장</span>
      </div>
      <div class="desc-box">
        <div class="desc-block" v-html="post.content"></div>
      </div>
      <div class="stat-row">
        <div class="stat-col" v-for="(s, idx) in post.stat" :key="idx">
          <div class="stat-label">
            <template v-if="idx === 0">미취학</template>
            <template v-else-if="idx === 1">초등학교 저학년</template>
            <template v-else-if="idx === 2">초등학교 고학년</template>
            <template v-else>중학생 이상</template>
          </div>
          <div class="stat-value">{{ s }}</div>
        </div>
      </div>
    </div>
    <!-- 댓글/한마디 영역 -->
    <div class="comment-section">
      <div class="comment-title">
        따뜻한 <span style="color:#FFC107;">한마디</span>
      </div>
      <div class="comment-input-row">
        <a-input
          v-model:value="newComment"
          placeholder="따뜻한 댓글을 남겨주세요!"
          @keyup.enter="addComment"
          allow-clear
          size="large"
          style="width:70%;margin-right:8px;"
        />
        <a-button type="primary" size="large" :style="{background: mainColor, borderColor: mainColor}" @click="addComment">
          등록
        </a-button>
      </div>
      <div class="comment-count">
        댓글 <span style="color:#00C851;">{{ comments.length }}</span>
      </div>
      <div v-if="comments.length === 0" class="no-comments">등록된 한마디가 없습니다.</div>
      <ul v-else class="comment-list">
        <li v-for="(c, i) in comments" :key="i" class="comment-item">{{ c }}</li>
      </ul>
    </div>

    <!-- 기부 모달 -->
    <a-modal 
      v-model:open="donationModalVisible" 
      title="기부하기" 
      :footer="null"
      width="500px"
      @cancel="closeDonationModal"
    >
      <div class="donation-modal">
        <div class="modal-post-info">
          <h3>{{ post?.title }}</h3>
          <p class="modal-description">{{ post?.category }}에 기부합니다</p>
        </div>

        <div class="amount-section">
          <h4>기부 금액</h4>
          <div class="quick-amounts">
            <button 
              v-for="amount in quickAmounts" 
              :key="amount"
              @click="setQuickAmount(amount)"
              class="quick-amount-btn"
              :class="{ active: donationAmount === amount }"
            >
              {{ amount.toLocaleString() }}원
            </button>
          </div>

          <div class="custom-amount">
            <a-input
              v-model:value="customAmount"
              placeholder="직접 입력"
              @blur="setCustomAmount"
              @keyup.enter="setCustomAmount"
              style="margin-top: 12px;"
            >
              <template #suffix>원</template>
            </a-input>
          </div>

          <div class="selected-amount">
            <span>선택된 금액: </span>
            <span class="amount-display">{{ donationAmount.toLocaleString() }}원</span>
          </div>
        </div>

        <div class="modal-footer">
          <a-button @click="closeDonationModal" style="margin-right: 8px;">
            취소
          </a-button>
          <a-button 
            type="primary" 
            :style="{background: mainColor, borderColor: mainColor}"
            @click="proceedToPayment"
          >
            {{ donationAmount.toLocaleString() }}원 기부하기
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
  <div v-else style="text-align:center;padding:100px 0;">잘못된 접근입니다.</div>
</template>

<style scoped>
/* 스타일은 동일하게 사용 */
.detail-root {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 10px 60px 10px;
  font-family: 'Noto Sans KR', sans-serif;
}
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.detail-title {
  font-size: 21px;
  font-weight: 700;
  margin: 0;
}
.badge-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.badge {
  background: #F5F5F5;
  color: #333;
  border-radius: 12px;
  font-size: 13px;
  padding: 3px 10px;
  font-weight: 500;
}
.detail-title {
  font-size: 21px;
  font-weight: 700;
  margin-bottom: 24px;
}
.main-row {
  display: flex;
  gap: 28px;
  align-items: flex-start;
}
.main-left {
  flex: 1 1 350px;
}
.main-right {
  flex: 0 0 310px;
}
.img-wrap {
  width: 100%;
  height: 220px;
  border-radius: 16px;
  position: relative;
  background: #f9f9f9;
  overflow: hidden;
}
.main-img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 16px;
}
.cat-img {
  position: absolute;
  left: 50%;
  top: 70%;
  width: 120px;
  transform: translate(-50%, -50%);
  z-index: 2;
}
.progress-card {
  background: #fff;
  border-radius: 16px;
  padding: 26px 18px 22px 18px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
}
.progress-header {
  font-size: 17px;
  margin-bottom: 10px;
  display: flex; justify-content: space-between; align-items: center;
}
.percent {
  font-size: 22px;
  font-weight: 800;
  color: #00C851;
}
.current {
  margin: 10px 0 14px 0;
  font-size: 18px;
  font-weight: 600;
  color: #222;
}
.progress-info {
  margin-bottom: 22px;
  font-size: 14px;
  color: #888;
  line-height: 1.7;
}
.progress-info span {
  float: right;
  color: #111;
  font-weight: 500;
}
.donate-btn {
  width: 100%;
  height: 46px;
  font-size: 17px;
  font-weight: bold;
}
.desc-section {
  margin-top: 44px;
  background: #FCFCF6;
  border-radius: 18px;
  padding: 32px 22px 24px 22px;
}
.desc-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
}
.desc-box {
  display: flex;
  gap: 30px;
  font-size: 14px;
  color: #444;
  margin-bottom: 24px;
}
.desc-block {
  flex: 1;
  min-width: 180px;
  line-height: 1.6;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  background: #fff;
  border-radius: 10px;
  padding: 20px 10px;
  gap: 12px;
}
.stat-col {
  text-align: center;
  flex: 1;
}
.stat-label {
  font-size: 14px;
  color: #888;
  margin-bottom: 5px;
}
.stat-value {
  font-size: 20px;
  color: #00C851;
  font-weight: 700;
}
.comment-section {
  margin-top: 54px;
}
.comment-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 18px;
}
.comment-input-row {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}
.comment-count {
  margin-bottom: 10px;
  color: #333;
  font-size: 15px;
  font-weight: 500;
}
.no-comments {
  color: #bbb;
  padding: 30px 0 20px 0;
  font-size: 15px;
  text-align: center;
}
.comment-list {
  margin: 0; padding: 0 0 14px 0; list-style: none;
}
.comment-item {
  background: #f6f6f6;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 10px;
  font-size: 15px;
}
@media (max-width: 1000px) {
  .main-row { flex-direction: column; gap:16px; }
  .main-right { width: 100%; }
}

/* 기부 모달 스타일 */
.donation-modal {
  padding: 16px 0;
}

.modal-post-info {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-post-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.modal-description {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.amount-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.quick-amount-btn {
  padding: 12px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.quick-amount-btn:hover {
  border-color: #00C851;
  color: #00C851;
}

.quick-amount-btn.active {
  border-color: #00C851;
  background: #00C851;
  color: white;
}

.selected-amount {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.amount-display {
  font-size: 18px;
  font-weight: 600;
  color: #00C851;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
