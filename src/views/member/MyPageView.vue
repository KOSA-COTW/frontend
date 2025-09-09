<!-- src/views/mypage/MyInfoView.vue -->
<template>
  <div class="mypage-content">
    <a-space direction="vertical" size="large" style="width:100%">
      <!-- 상단 카드: 내 정보 -->
      <a-card class="top-card">
        <a-skeleton :loading="loading" avatar active>
          <div class="top-section">
            <!-- 프로필 -->
            <a-avatar :size="72" :src="userInfo.pictureUrl">
              {{ userInfo.nickname ? userInfo.nickname[0] : '?' }}
            </a-avatar>

            <div class="user-info">
              <div class="header-line">
                <p class="welcome-text" v-if="userInfo.name">
                  {{ userInfo.nickname }}님,<br />
                  함께한지 <span class="highlight">{{ daysSinceJoined }}</span>일이 되었어요.
                </p>
                <div class="badges">
                  <a-tag v-if="userInfo.role" color="green">{{ roleLabel }}</a-tag>
                  <a-tag v-if="userInfo.provider" color="blue">{{ providerLabel }}</a-tag>
                </div>
              </div>

              <div class="link-buttons">
                <a-button type="link" size="small" @click="goEdit">내정보수정</a-button>
                <a-divider type="vertical" />
                <a-button type="link" size="small" @click="logout">로그아웃</a-button>
                <a-divider type="vertical" />
                <a-button type="link" size="small" danger @click="openDeleteModal">회원 탈퇴</a-button>
              </div>

              <!-- 상세 -->
              <a-descriptions :column="1" size="small" class="desc">
                <a-descriptions-item label="이메일">{{ userInfo.email || '-' }}</a-descriptions-item>
                <a-descriptions-item label="가입일">{{ formattedJoinDate || '-' }}</a-descriptions-item>
                <a-descriptions-item label="프로필 완성도">
                  <div class="progress-line">
                    <a-progress :percent="profileCompletion" :show-info="false" stroke-linecap="round" style="width: 140px" />
                    <span class="progress-text">{{ profileCompletion }}%</span>
                  </div>
                </a-descriptions-item>
              </a-descriptions>

              <!-- 초대 -->
<!--              <div class="invite-box">-->
<!--                <div class="invite-header">-->
<!--                  <p class="invite-title">친구 초대하기</p>-->
<!--                  <a-button v-if="referralLink" size="small" type="text" class="copy-btn" @click="copyInviteLink">링크 복사</a-button>-->
<!--                </div>-->
<!--                <div class="invite-summary">-->
<!--                  <span>초대한 친구 <b>{{ inviteCount }}</b>명</span>-->
<!--                  <div class="share-actions">-->
<!--                    <a-button size="small" @click="shareInvite">공유</a-button>-->
<!--                    <a-input v-if="referralLink" :value="referralLink" size="small" readonly />-->
<!--                  </div>-->
<!--                </div>-->
<!--              </div>-->
            </div>
          </div>
        </a-skeleton>
      </a-card>

      <!-- 통계 요약 -->
      <a-card class="donation-card">
        <div class="donation-summary">
          <div>
            <p class="label">총 기부금액</p>
            <p class="amount">{{ (stats.totalDonation || 0).toLocaleString() }}원</p>
          </div>

          <div class="count">
            <p>기부 <b>{{ stats.oneTimeCount || 0 }}회</b></p>
<!--            <p v-if="stats.points !== null">포인트 <b>{{ (stats.points || 0).toLocaleString() }}</b></p>-->
          </div>
        </div>
        <div class="more-link">
          <a-button type="link" size="small" @click="router.push('/mypage/donations')">자세히보기 ></a-button>
        </div>
      </a-card>
    </a-space>


    <!-- 회원 탈퇴 모달 -->
    <a-modal
      v-model:open="deleteOpen"
      title="회원 탈퇴"
      :ok-button-props="{ danger: true, disabled: !deletePassword }"
      ok-text="탈퇴하기"
      cancel-text="취소"
      :confirm-loading="deleteLoading"
      :mask-closable="false"
      centered
      @ok="handleDelete"
      @cancel="closeDeleteModal"
      class="danger-modal"
    >
      <div class="delete-box">
        <p class="delete-text">정말 삭제하시겠습니까? 삭제를 원하신다면 현재 비밀번호를 입력해주세요.</p>
        <a-descriptions :column="1" size="small" class="mini-desc">
          <a-descriptions-item label="계정 이메일">{{ userInfo.email || '-' }}</a-descriptions-item>
        </a-descriptions>

        <a-input-password
          v-model:value="deletePassword"
          placeholder="현재 비밀번호"
          :disabled="deleteLoading"
          @pressEnter="deletePassword && handleDelete()"
        />

        <a-alert v-if="deleteError" type="error" :message="deleteError" show-icon banner class="mt8" />
        <div class="danger-note">탈퇴 시 계정 정보가 30일 뒤 영구 삭제될 수 있습니다.</div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue'
import axios from 'axios'
import api from '@/utils/axios.js'


const router = useRouter()
const auth = useAuthStore()

// 상태
const loading = ref(true)
const inviteCount = ref(0)
const userInfo = reactive({
  email: null, name: null, nickname: null, pictureUrl: null, role: null, provider: null, createAt: null, referralCode: null
})
const stats = reactive({ totalDonation: 0, oneTimeCount: 0, points: 0 })

// 라벨
const providerLabel = computed(() => {
  if (!userInfo.provider) return ''
  const map = { google: 'Google', kakao: 'Kakao', naver: 'Naver', local: '이메일' }
  return map[userInfo.provider?.toLowerCase()] || userInfo.provider
})
const roleLabel = computed(() => {
  if (!userInfo.role) return ''
  const map = { USER: '일반회원', ADMIN: '관리자', ORGANIZATION: '단체회원' }
  return map[userInfo.role] || userInfo.role
})

// 날짜
const daysSinceJoined = computed(() => {
  if (!userInfo.createAt) return '-'
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const j = new Date(userInfo.createAt)
  const startOfJoined = new Date(j.getFullYear(), j.getMonth(), j.getDate()).getTime()
  return Math.max(1, Math.floor((startOfToday - startOfJoined) / 86400000) + 1)
})
const formattedJoinDate = computed(() => {
  if (!userInfo.createAt) return null
  const d = new Date(userInfo.createAt)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})
const profileCompletion = computed(() => {
  let s = 0
  if (userInfo.name) s += 35
  if (userInfo.email) s += 35
  if (userInfo.pictureUrl) s += 30
  return s
})
const referralLink = computed(() =>
  userInfo.referralCode ? `${location.origin}/signup?ref=${userInfo.referralCode}` : null
)

// API
const information = async () => {
  loading.value = true
  try {
    const info = await api.get('/api/info')

    userInfo.email = info.email ?? null
    userInfo.name = info.name ?? null
    userInfo.nickname = info.nickname ?? info.name ?? null
    userInfo.pictureUrl = info.pictureUrl ?? null
    userInfo.role = info.role ?? null
    userInfo.provider = info.provider ?? null
    userInfo.createAt = info.createAt ?? info.createdAt ?? null
    userInfo.referralCode = info.referralCode ?? null

    stats.totalDonation = info.totalDonation ?? 0
    stats.oneTimeCount = info.oneTimeCount ?? 0
    stats.points = info.points ?? 0
    inviteCount.value = info.inviteCount ?? 0
  } catch (e) {
    console.error(e)
    message.error('내 정보를 불러오지 못했어요.')
  } finally {
    loading.value = false
  }
}

// 이동/액션
const goEdit = () => router.push('/mypage/edit')
const logout = () => { auth.logout(); message.success('로그아웃되었습니다.'); router.push('/') }

// 탈퇴 모달
const deleteOpen = ref(false)
const deletePassword = ref('')
const deleteLoading = ref(false)
const deleteError = ref('')
const openDeleteModal = () => { deleteError.value=''; deletePassword.value=''; deleteOpen.value = true }
const closeDeleteModal = () => { deleteOpen.value=false; deleteLoading.value=false; deletePassword.value=''; deleteError.value='' }
const handleDelete = async () => {
  if (!deletePassword.value) return
  deleteLoading.value = true; deleteError.value = ''
  try {
    const user = localStorage.getItem('auth')
    const accessToken = user ? JSON.parse(user).accessToken : null
    // 프로젝트 컨벤션에 맞춰 POST 사용
    await axios.post('/api/deactivate', { password: deletePassword.value }, { headers: { Authorization: `Bearer ${accessToken}` }})
    message.success('계정이 삭제되었습니다. 그동안 이용해 주셔서 감사합니다.')
    closeDeleteModal(); auth.logout(); router.replace('/')
  } catch (e) {
    const msg = (e?.response?.status === 401 || e?.response?.status === 403)
      ? '비밀번호가 올바르지 않습니다.'
      : e?.response?.data?.message || '삭제 처리 중 오류가 발생했습니다.'
    deleteError.value = msg
  } finally { deleteLoading.value = false }
}

// 초대 공유
const copyInviteLink = async () => {
  if (!referralLink.value) return
  try { await navigator.clipboard.writeText(referralLink.value); message.success('초대 링크를 복사했어요.') }
  catch { message.warning('클립보드 접근이 실패했어요. 링크를 직접 선택해 복사해 주세요.') }
}
const shareInvite = async () => {
  if (!referralLink.value) return
  if (navigator.share) {
    try { await navigator.share({ title:'함께 기부해요', text:'아래 링크로 가입하고 함께 기부에 참여해요!', url: referralLink.value }) }
    catch {}
  } else { copyInviteLink() }
}

onMounted(information)
</script>

<style scoped>
/* 우측 콘텐츠 전용 스타일 (사이드바 관련 코드/스타일 제거) */
.mypage-content {
  padding: 16px 24px;
  width: 100%;
}

.top-card, .donation-card {
  border-radius: 16px;
  padding: 32px 36px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}
.top-section { display: grid; grid-template-columns: 72px 1fr; gap: 16px; }
.user-info { display: flex; flex-direction: column; gap: 8px; }
.header-line { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.badges :deep(.ant-tag) { margin-left: 4px; }

.welcome-text { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.highlight { color: #00C851; }
.link-buttons { font-size: 12px; color: #888; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }

.desc { margin-top: 4px; }
.progress-line { display: flex; align-items: center; gap: 8px; }
.progress-text { font-size: 12px; color: #555; }

.invite-box { background-color: #f9f9f9; padding: 16px; border-radius: 8px; }
.invite-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.invite-title { font-size: 14px; font-weight: 600; }
.invite-summary { display: flex; gap: 8px; align-items: center; justify-content: space-between; font-size: 12px; color: #555; }
.copy-btn { padding: 0; }

.donation-summary { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.label { font-size: 14px; color: #888; margin-bottom: 4px; }
.amount { font-size: 28px; font-weight: bold; }
.count { font-size: 13px; text-align: right; color: #444; }
.more-link { text-align: right; margin-top: 8px; }

/* 탈퇴 모달 */
.danger-modal :deep(.ant-modal-content) { border-radius: 16px; }
.delete-box { background: #f9f9f9; padding: 16px; border-radius: 8px; }
.delete-text { margin-bottom: 12px; font-size: 14px; color: #333; }
.mini-desc { margin-bottom: 8px; }
.mt8 { margin-top: 8px; }
.danger-note { margin-top: 8px; font-size: 12px; color: #c0342b; }

/* PaymentHistoryView 컴포넌트가 포함된 경우 너비 조정 */
.mypage-content :deep(.payment-history) {
  max-width: none;
  margin: 0;
  padding: 0;
}

.mypage-content :deep(.payment-history .stats-grid) {
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: 12px;
}

.mypage-content :deep(.payment-history .stat-card) {
  padding: 16px 12px;
  min-width: 160px;
}

.mypage-content :deep(.payment-history .stat-value) {
  font-size: 20px;
}

.mypage-content :deep(.payment-history .stat-label) {
  font-size: 13px;
}

@media (max-width: 768px) {
  .mypage-content {
    padding: 16px 20px;
    max-width: none;
  }

  .top-card, .donation-card {
    padding: 24px 20px;
  }

  .top-section { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .header-line { flex-direction: column; align-items: center; }
  .link-buttons { justify-content: center; }
  .invite-summary { flex-direction: column; gap: 6px; }
  .donation-summary { flex-direction: column; align-items: center; text-align: center; gap: 8px; }
  .count { text-align: center; }

  /* 모바일에서 PaymentHistoryView 통계 카드 1열로 배치 */
  .mypage-content :deep(.payment-history .stats-grid) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
