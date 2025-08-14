<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCounterStore } from '@/stores/counter'

const mainColor = '#00C851'
const catImgUrl = 'https://placekitten.com/120/120'
const newComment = ref('')
const comments = ref([])

const route = useRoute()
const store = useCounterStore()

// id로 store에서 해당 게시글 찾기
const postId = computed(() => Number(route.params.id) || 1)
const post = computed(() => store.donations.find(item => item.id === postId.value))

function addComment() {
  if (newComment.value.trim()) {
    comments.value.push(newComment.value)
    newComment.value = ''
  }
}
</script>

<template>
  <div class="detail-root" v-if="post">
    <!-- 상단 카테고리 뱃지 & 제목 -->
    <div class="badge-row">
      <span class="badge">{{ post.category }}</span>
      <!-- 필요하면 badge2, badge3도 store 데이터에 추가해서 사용 -->
    </div>
    <h2 class="detail-title">{{ post.title }}</h2>

    <div class="main-row">
      <div class="main-left">
        <a-carousel autoplay style="width:100%;border-radius:16px;">
          <div>
            <div class="img-wrap">
              <img class="main-img" :src="post.image" />

            </div>
          </div>
        </a-carousel>
      </div>
      <div class="main-right">
        <div class="progress-card">
          <div class="progress-header">
            <span>
              마감까지 {{ (post.target - post.raised).toLocaleString() }}원
            </span>
            <span class="percent">
              {{ ((post.raised / post.target) * 100).toFixed(1) }}%
            </span>
          </div>
          <a-progress
            :percent="Number(((post.raised / post.target) * 100).toFixed(1))"
            :stroke-color="mainColor"
            show-info="false"
          />
          <div class="current">
            {{ post.raised ? post.raised.toLocaleString() + '원 모금' : '---' }}
          </div>
          <div class="progress-info">
            <div>모금 시작일 <span>{{ post.startDate || '---' }}</span></div>
            <div>모금목표 <span>{{ post.target ? post.target.toLocaleString() + '원' : '---' }}</span></div>
            <div>후원잔액까지 <span>
              {{ (post.target - post.raised).toLocaleString() }}원
            </span></div>
            <div>총 참여인원 <span>{{ post.participants || '---' }}명</span></div>
          </div>
          <a-button type="primary" class="donate-btn" :style="{background: mainColor, borderColor: mainColor}">
            곧장기부하기
          </a-button>
        </div>
      </div>
    </div>
    <div class="desc-section">
      <div class="desc-title">
        기부금이 <span style="color:#FFC107">곧장</span>
      </div>
      <div class="desc-box">
        <div class="desc-block" v-html="post.desc"></div>
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
</style>
