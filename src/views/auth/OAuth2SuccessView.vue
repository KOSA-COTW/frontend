<!-- views/auth/OAuth2SuccessView.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const error = ref('')
const provider = ref('')
const email = ref('')
const message = ref('')
const recovering = ref(false)

const showRecover = computed(() =>
  error.value === 'account_deleted' ||
  error.value === 'account_inactive' ||
  error.value === 'authorization_request_not_found'
)

const bannerType = computed(() => {
  if (error.value === 'account_deleted') return 'error'
  if (error.value === 'account_inactive') return 'warning'
  if (error.value === 'authorization_request_not_found') return 'info'
  return 'info'
})
const bannerText = computed(() => {
  if (error.value === 'account_deleted') return '이 계정은 삭제 상태입니다. 복구 후 이용할 수 있어요.'
  if (error.value === 'account_inactive') return '이 계정은 비활성화 상태입니다. 복구 후 이용할 수 있어요.'
  if (error.value === 'authorization_request_not_found') return '세션이 만료되었거나 인증 요청을 찾을 수 없습니다. 복구 또는 재로그인을 진행해 주세요.'
  return '계정 복구를 진행해 주세요.'
})

onMounted(async () => {
  // 1) 성공 케이스: #access 토큰 처리
  const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : ''
  const h = new URLSearchParams(hash)
  const access = h.get('access')

  // 2) 실패 케이스: ?error 파라미터 처리
  const q = new URLSearchParams(window.location.search)
  error.value = q.get('error') || ''
  provider.value = (q.get('provider') || q.get('registrationId') || 'google').toLowerCase()
  email.value = q.get('email') || ''

  if (access && !error.value) {
    await auth.login(access)
    window.history.replaceState({}, document.title, '/oauth2/success') // 해시 제거
    router.replace('/')
    return
  }

  // 복구 대상이 아니면 로그인 화면으로 이동
  if (!showRecover.value) {
    router.replace(`/login?error=${encodeURIComponent(error.value || 'no_token')}`)
  }
})

async function recover() {
  recovering.value = true
  message.value = ''
  try {
    const res = await fetch('/api/recover/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        provider: provider.value.toLocaleString().toUpperCase(), // google/kakao/naver
        email: email.value || undefined
      })
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `HTTP ${res.status}`)
    }
    const data = await res.json().catch(() => ({}))

    if (data.access) {
      auth.login(data.access)
      window.history.replaceState({}, document.title, '/')
      router.replace('/')
      return
    }
    message.value = '계정이 복구되었습니다. 다시 로그인해 주세요.'
  } catch (e) {
    message.value = e?.message?.slice(0, 300) || '복구 중 오류가 발생했습니다.'
  } finally {
    recovering.value = false
  }
}
</script>

<template>
  <a-config-provider :theme="{ token: { colorPrimary: '#00C851' } }">
    <div class="page">
      <!-- 로딩/성공 진입 -->
      <div v-if="!showRecover" class="center">
        <a-card class="card">
          <a-space direction="vertical" align="center" style="width:100%">
            <a-spin />
            <div>로그인 처리중...</div>
          </a-space>
        </a-card>
      </div>

      <!-- 복구 UI -->
      <div v-else class="center">
        <a-card class="card" :bordered="true" title="계정 복구">
          <a-alert :type="bannerType" :message="bannerText" show-icon banner class="mb12" />
          <a-form layout="vertical">
            <a-form-item label="소셜 제공자">
              <a-select v-model:value="provider" :options="[
                { value: 'google', label: 'Google' },
                { value: 'kakao', label: 'Kakao' },
                { value: 'naver', label: 'Naver' }
              ]" />
            </a-form-item>

            <a-form-item label="소셜 아이디(이메일)">
              <a-input v-model:value="email" type="email" placeholder="연결된 이메일 (알고 있다면 입력)" />
            </a-form-item>

            <a-space>
              <a-button type="primary" :loading="recovering" :disabled="recovering" @click="recover">
                복구하기
              </a-button>
              <a-button :disabled="recovering" @click="$router.replace('/login')">취소</a-button>
            </a-space>

            <a-alert v-if="message" class="mt12" type="info" :message="message" show-icon />
          </a-form>
        </a-card>
      </div>
    </div>
  </a-config-provider>
</template>

<style scoped>
.page { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
.center { width: 100%; max-width: 520px; }
.card { border-radius: 16px; }
.mb12 { margin-bottom: 12px; }
.mt12 { margin-top: 12px; }
</style>
