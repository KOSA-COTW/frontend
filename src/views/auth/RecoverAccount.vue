<template>
  <div class="recover-wrap">
    <a-config-provider :theme="{ token: { colorPrimary: '#00c851' } }">
      <a-card class="recover-card">
        <h2 class="title">계정 복구</h2>
        <p class="desc">
          탈퇴 처리된 계정을 다시 사용하려면 이메일 인증을 완료해 주세요.
        </p>

        <a-form :model="form" layout="vertical" class="compact-form">
          <a-form-item label="로그인 이메일" class="compact-item">
            <a-input
              size="middle"
              v-model:value="form.email"
              placeholder="로그인 시 사용한 이메일 주소"
              :disabled="verified"
            />
          </a-form-item>

          <div class="code-row">
            <a-input
              size="middle"
              v-model:value="form.code"
              placeholder="인증코드 6자리"
              maxlength="6"
              :disabled="verified"
            />
            <a-button
              size="middle"
              class="ml-8"
              :disabled="sending || !canSend || verified"
              @click="sendCode"
            >
              {{ sendBtnText }}
            </a-button>
            <a-button
              size="middle"
              class="ml-8"
              type="primary"
              :disabled="!form.code || verified"
              :loading="verifying"
              @click="verifyCode"
            >
              인증하기
            </a-button>
          </div>

          <a-alert
            v-if="verified"
            type="success"
            class="mt-10"
            show-icon
            :message="'이메일 인증 완료'"
            :description="`계정 복구를 진행할 수 있습니다 (${maskedEmail}).`"
          />

          <div class="actions">
            <a-button size="middle" @click="goLogin">로그인으로</a-button>
            <a-button
              size="middle"
              type="primary"
              :disabled="!verified"
              :loading="recovering"
              @click="recover"
            >
              계정 복구
            </a-button>
          </div>
        </a-form>
      </a-card>
    </a-config-provider>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import axios from 'axios'

const PURPOSE = 'ACCOUNT_RECOVER' // 서버 EmailTokenPurpose에 동일하게 정의되어 있어야 함.

const route = useRoute()
const router = useRouter()

const form = reactive({ email: '', code: '' })
const sending = ref(false)
const verifying = ref(false)
const verified = ref(false)
const recovering = ref(false)

/* 쿨다운 유틸 */
const cooldown = ref(0)
let timer = null
const startCooldown = (sec = 60) => {
  clearInterval(timer)
  cooldown.value = sec
  timer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) clearInterval(timer)
  }, 1000)
}

const emailValid = computed(() => /\S+@\S+\.\S+/.test(form.email))
const canSend = computed(() => cooldown.value === 0 && emailValid.value)
const sendBtnText = computed(() => cooldown.value > 0 ? `재발송 (${cooldown.value}s)` : '인증코드 발송')

const maskedEmail = computed(() => {
  const [u, d] = (form.email || '').split('@')
  if (!u || !d) return form.email
  const head = u.slice(0, 2)
  return `${head}${'*'.repeat(Math.max(u.length - 2, 1))}@${d}`
})

onMounted(() => {
  // 로그인 화면에서 쿼리로 넘어온 이메일 프리필 지원
  const qEmail = route.query.email
  if (typeof qEmail === 'string' && qEmail) form.email = qEmail
})

async function sendCode() {
  if (!emailValid.value) {
    message.error('올바른 이메일을 입력하세요.')
    return
  }
  sending.value = true
  try {
    await axios.post('/api/auth/email/send', { email: form.email, purpose: PURPOSE })
    message.success('인증코드를 전송했어요. 메일함을 확인해 주세요.')
    startCooldown(60)
  } catch (e) {
    const code = e?.response?.data?.codeType
    if (code === 'NOT_FOUND') message.error('가입 이력이 없는 이메일입니다.')
    else if (code === 'RATE_LIMIT') message.warning('요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.')
    else message.error('코드 전송에 실패했어요.')
  } finally {
    sending.value = false
  }
}

async function verifyCode() {
  if (!form.code) return
  verifying.value = true
  try {
    const { data } = await axios.post('/api/auth/email/verify', {
      email: form.email,
      code: form.code,
      purpose: PURPOSE
    })
    if (data?.verified) {
      verified.value = true
      message.success('이메일 인증이 완료되었습니다.')
    } else {
      message.error('인증코드가 올바르지 않습니다.')
    }
  } catch (e) {
    const code = e?.response?.data?.codeType
    if (code === 'EXPIRED') message.error('코드가 만료되었습니다. 다시 요청해 주세요.')
    else if (code === 'MISMATCH') message.error('코드가 일치하지 않습니다.')
    else message.error('인증 처리 중 오류가 발생했습니다.')
  } finally {
    verifying.value = false
  }
}

async function recover() {
  if (!verified.value) return
  recovering.value = true
  try {
    await axios.post('/api/account/recover', { email: form.email })
    message.success('계정 복구가 완료되었습니다. 새로 로그인해 주세요.')
    router.push('/login')
  } catch (e) {
    const code = e?.response?.data?.codeType
    if (code === 'NOT_FOUND') message.error('해당 이메일의 계정을 찾을 수 없습니다.')
    else if (code === 'ALREADY_ACTIVE') message.info('이미 활성 상태의 계정입니다. 바로 로그인해 주세요.')
    else message.error('계정 복구에 실패했습니다.')
  } finally {
    recovering.value = false
  }
}

function goLogin() {
  router.push('/login')
}
</script>

<style scoped>
/* 한 화면에 들어오게 컴팩트 + 초록 테마 윤곽 강조 */
.recover-wrap {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  box-sizing: border-box;
}

.recover-card {
  width: 100%;
  max-width: 640px;
  border-radius: 14px;
  padding: 18px 20px;
  border: 1.5px solid #00c85166;      /* 초록 라이트 윤곽 */
  box-shadow: 0 2px 12px rgba(0,0,0,.06), 0 0 0 1px #00c85122;
}

.title {
  text-align: center;
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
}
.desc {
  text-align: center;
  margin: 0 0 14px;
  color: #666;
  font-size: 13.5px;
}

.compact-form { margin-top: 6px; }
.compact-item :deep(.ant-form-item-label) { padding-bottom: 4px; }
.compact-item { margin-bottom: 10px; }

.code-row {
  display: flex;
  align-items: center;
  margin-top: 4px;
}
.ml-8 { margin-left: 8px; }
.mt-10 { margin-top: 10px; }

/* 버튼 영역 */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

/* 윤곽/포커스 공통 강화 */
:deep(.ant-input),
:deep(.ant-input-affix-wrapper),
:deep(.ant-select-selector),
:deep(.ant-btn) {
  border-radius: 10px;
  border-width: 1.5px;
  border-color: #c9c9c9;
}
:deep(.ant-input:hover),
:deep(.ant-input:focus),
:deep(.ant-input-affix-wrapper:hover),
:deep(.ant-input-affix-wrapper-focused),
:deep(.ant-select-selector:hover),
:deep(.ant-select-focused .ant-select-selector),
:deep(.ant-btn:hover),
:deep(.ant-btn:focus) {
  border-color: #00c851 !important;
  box-shadow: 0 0 0 2px rgba(0, 200, 81, 0.12);
}

/* 프라이머리 버튼 */
:deep(.ant-btn-primary) {
  background-color: #00c851;
  border-color: #00c851;
  font-weight: 600;
}

/* 모바일 대응 */
@media (max-width: 576px) {
  .recover-card { max-width: 360px; padding: 14px; }
  .title { font-size: 18px; }
  .desc { font-size: 12.5px; }
}
</style>
