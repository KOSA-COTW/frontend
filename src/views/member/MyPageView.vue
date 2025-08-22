<template>
  <div class="my-page">
    <a-row :gutter="24" justify="center">
      <!-- 좌측 메뉴 -->
      <a-col :xs="24" :sm="6" :md="5" :lg="5" :xl="4">
        <div class="sidebar">
          <ul>

            <li
              v-for="item in menuItems"
              :key="item"
              :class="{ active: selectedMenu === item }"
              @click="selectedMenu = item"
            >

              {{ item }}
            </li>
          </ul>
        </div>
      </a-col>

      <!-- 우측 본문 -->
      <a-col :xs="24" :sm="18" :md="17" :lg="15" :xl="14">

        <!-- 상단 카드: 내 정보 -->
        <a-card class="top-card" v-if="selectedMenu === '내 정보'">
          <a-skeleton :loading="loading" avatar active>
            <div class="top-section">
              <!-- 사용자 프로필 -->
              <a-avatar :size="72" :src="userInfo.pictureUrl">
                {{ userInfo.name ? userInfo.name[0] : '?' }}
              </a-avatar>

              <div class="user-info">
                <div class="header-line">
                  <p class="welcome-text" v-if="userInfo.name">
                    {{ userInfo.name }}님,
                    <br />
                    함께한지
                    <span class="highlight">{{ daysSinceJoined }}</span>일이 되었어요.
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
                  <!-- 회원 탈퇴 버튼 -->
                  <a-button type="link" size="small" danger @click="openDeleteModal">
                    회원 탈퇴
                  </a-button>
                </div>

                <!-- 상세 정보 -->
                <a-descriptions :column="1" size="small" class="desc">
                  <a-descriptions-item label="이메일">
                    {{ userInfo.email || '-' }}
                  </a-descriptions-item>
                  <a-descriptions-item label="가입일">
                    {{ formattedJoinDate || '-' }}
                  </a-descriptions-item>
                  <a-descriptions-item label="프로필 완성도">
                    <div class="progress-line">
                      <a-progress
                        :percent="profileCompletion"
                        :show-info="false"
                        stroke-linecap="round"
                        style="width: 140px"
                      />
                      <span class="progress-text">{{ profileCompletion }}%</span>
                    </div>
                  </a-descriptions-item>
                </a-descriptions>

                <!-- 친구 초대 -->
                <div class="invite-box">
                  <div class="invite-header">
                    <p class="invite-title">친구 초대하기</p>
                    <a-button
                      v-if="referralLink"
                      size="small"
                      type="text"
                      class="copy-btn"
                      @click="copyInviteLink"
                    >
                      링크 복사
                    </a-button>
                  </div>
                  <div class="invite-summary">
                    <span>초대한 친구 <b>{{ inviteCount }}</b>명</span>
                    <div class="share-actions">
                      <a-button size="small" @click="shareInvite">공유</a-button>
                      <a-input
                        v-if="referralLink"
                        :value="referralLink"
                        size="small"
                        readonly
                      />
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </a-skeleton>
        </a-card>

        <!-- 통계 요약 -->
        <a-card class="donation-card" v-if="selectedMenu === '내 정보'">
          <div class="donation-summary">
            <div>
              <p class="label">총 기부금액</p>
              <p class="amount">{{ (stats.totalDonation || 0).toLocaleString() }}원</p>
            </div>
            <div class="count">
              <p>일시기부 <b>{{ stats.oneTimeCount || 0 }}회</b></p>
              <p>정기기부 <b>{{ stats.recurringCount || 0 }}회</b></p>
              <p v-if="stats.points !== null">포인트 <b>{{ (stats.points || 0).toLocaleString() }}</b></p>
            </div>
          </div>
          <div class="more-link">
            <a-button type="link" size="small" @click="selectedMenu = '기부내역'">자세히보기 ></a-button>
          </div>
        </a-card>

        <!-- 다른 탭들 (간단 자리표시자) -->
        <a-card v-if="selectedMenu === '기부내역'">
          <p>내 기부내역을 확인할 수 있어요. (목록 컴포넌트 연결 예정)</p>
        </a-card>
        <a-card v-if="selectedMenu === '포인트내역'">
          <p>포인트 적립/사용 내역을 확인할 수 있어요.</p>
        </a-card>
        <a-card v-if="selectedMenu === '증서출급'">
          <p>기부 증서를 내려받을 수 있어요.</p>
        </a-card>
        <a-card v-if="selectedMenu === '기부금영수증'">
          <p>연말정산용 기부금 영수증을 발급할 수 있어요.</p>
        </a-card>

      </a-col>
    </a-row>

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
        <p class="delete-text">
          정말 삭제하시겠습니까? 삭제를 원하신다면 현재 비밀번호를 입력해주세요.
        </p>
        <a-descriptions :column="1" size="small" class="mini-desc">
          <a-descriptions-item label="계정 이메일">
            {{ userInfo.email || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-input-password
          v-model:value="deletePassword"
          placeholder="현재 비밀번호"
          :disabled="deleteLoading"
          @pressEnter="deletePassword && handleDelete()"
        />

        <a-alert
          v-if="deleteError"
          type="error"
          :message="deleteError"
          show-icon
          banner
          class="mt8"
        />
        <div class="danger-note">
          탈퇴 시 보유 포인트 및 계정 정보가 영구 삭제될 수 있습니다.
        </div>
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

const router = useRouter()
const auth = useAuthStore()

const menuItems = ['내 정보', '기부내역', '포인트내역']
const selectedMenu = ref('내 정보')

const loading = ref(true)
const inviteCount = ref(0)

const userInfo = reactive({
  email: null,
  name: null,
  pictureUrl: null,
  role: null,
  provider: null,
  createAt: null,
  referralCode: null
})

const stats = reactive({
  totalDonation: 0,
  oneTimeCount: 0,
  recurringCount: 0,
  points: 0
})

// --- 회원 탈퇴 상태 ---
const deleteOpen = ref(false)
const deletePassword = ref('')
const deleteLoading = ref(false)
const deleteError = ref('')

// 라벨 매핑
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

// 날짜 계산 (정확한 일수)
const daysSinceJoined = computed(() => {
  if (!userInfo.createAt) return '-'
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const joinedDate = new Date(userInfo.createAt)
  const startOfJoined = new Date(joinedDate.getFullYear(), joinedDate.getMonth(), joinedDate.getDate()).getTime()
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

// 프로필 완성도 (간단 가중치)
const profileCompletion = computed(() => {
  let score = 0
  if (userInfo.name) score += 35
  if (userInfo.email) score += 35
  if (userInfo.pictureUrl) score += 30
  return score
})

// 초대 링크
const referralLink = computed(() => {
  if (!userInfo.referralCode) return null
  return `${location.origin}/signup?ref=${userInfo.referralCode}`
})

// API
const information = async () => {
  loading.value = true
  try {
    const user = localStorage.getItem('auth')
    const accessToken = user ? JSON.parse(user).accessToken : null

    const { data: info } = await axios.get('/api/info', {
      headers: { access: accessToken }
    })

    userInfo.email = info.email ?? null
    userInfo.name = info.name ?? null
    userInfo.pictureUrl = info.pictureUrl ?? null
    userInfo.role = info.role ?? null
    userInfo.provider = info.provider ?? null
    userInfo.createAt = info.createAt ?? info.createdAt ?? null
    userInfo.referralCode = info.referralCode ?? null

    // 선택: 서버가 내려주면 바로 반영
    stats.totalDonation = info.totalDonation ?? 0
    stats.oneTimeCount = info.oneTimeCount ?? 0
    stats.recurringCount = info.recurringCount ?? 0
    stats.points = info.points ?? 0
    inviteCount.value = info.inviteCount ?? 0
  } catch (e) {
    console.error(e)
    message.error('내 정보를 불러오지 못했어요.')
  } finally {
    loading.value = false
  }
}

// 내정보수정 이동
const goEdit = () => router.push('/mypage/profile')

// 로그아웃
const logout = () => {
  auth.logout()
  message.success('로그아웃되었습니다.')
  router.push('/')
}

// --- 회원 탈퇴 로직 ---
const openDeleteModal = () => {
  deleteError.value = ''
  deletePassword.value = ''
  deleteOpen.value = true
}

const closeDeleteModal = () => {
  deleteOpen.value = false
  deleteLoading.value = false
  deletePassword.value = ''
  deleteError.value = ''
}

const handleDelete = async () => {
  if (!deletePassword.value) return
  deleteLoading.value = true
  deleteError.value = ''
  try {
    const user = localStorage.getItem('auth')
    const accessToken = user ? JSON.parse(user).accessToken : null

    // 비밀번호를 전송하기 때문에 delete가 아닌 post를 채택
    await axios.post('/api/deactivate',
      { password: deletePassword.value },
      { headers: { access: accessToken }
    })

    message.success('계정이 삭제되었습니다. 그동안 이용해 주셔서 감사합니다.')
    closeDeleteModal()
    // 세션/토큰 정리 후 홈으로
    auth.logout()
    router.replace('/')
  } catch (e) {
    console.error(e)
    const msg =
      e?.response?.status === 401 || e?.response?.status === 403
        ? '비밀번호가 올바르지 않습니다.'
        : e?.response?.data?.message || '삭제 처리 중 오류가 발생했습니다.'
    deleteError.value = msg
  } finally {
    deleteLoading.value = false
  }
}

// 초대: 복사/공유
const copyInviteLink = async () => {
  try {
    await navigator.clipboard.writeText(referralLink.value)
    message.success('초대 링크를 복사했어요.')
  } catch {
    message.warning('클립보드 접근이 실패했어요. 링크를 직접 선택해 복사해 주세요.')
  }
}

const shareInvite = async () => {
  if (!referralLink.value) return
  if (navigator.share) {
    try {
      await navigator.share({
        title: '함께 기부해요',
        text: '아래 링크로 가입하고 함께 기부에 참여해요!',
        url: referralLink.value
      })
    } catch { /* 공유 취소/실패 무시 */ }
  } else {
    copyInviteLink()
  }
}

onMounted(information)
</script>

<style scoped>
.my-page { min-height: 100vh; padding: 32px 16px; }
.sidebar ul { list-style: none; padding: 0; margin: 0; }
.sidebar li {
  padding: 12px 16px; margin-bottom: 8px; background: none; border-radius: 20px;
  cursor: pointer; transition: all 0.2s; font-weight: 500; color: #333; border: 1px solid #ccc; text-align: center;
}
.sidebar li:hover { border-color: #00C851; color: #00C851; background-color: transparent; }
.sidebar li.active { border: 2px solid #00C851; color: #00C851; background-color: transparent; font-weight: 600; }

.top-card, .donation-card { border-radius: 16px; padding: 24px; }
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

/* --- 탈퇴 모달 --- */
.danger-modal :deep(.ant-modal-content) { border-radius: 16px; }
.delete-box { background: #f9f9f9; padding: 16px; border-radius: 8px; }
.delete-text { margin-bottom: 12px; font-size: 14px; color: #333; }
.mini-desc { margin-bottom: 8px; }
.mt8 { margin-top: 8px; }
.danger-note { margin-top: 8px; font-size: 12px; color: #c0342b; }

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
  .top-section { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .header-line { flex-direction: column; align-items: center; }
  .link-buttons { justify-content: center; }
  .invite-summary { flex-direction: column; gap: 6px; }
  .donation-summary { flex-direction: column; align-items: center; text-align: center; gap: 8px; }
  .count { text-align: center; }
  .sidebar li { text-align: center; }
}
</style>
