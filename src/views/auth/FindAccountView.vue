<!-- src/views/auth/FindAccount.vue -->
<template>
  <div class="find-wrap">
    <!-- 전체 테마 프라이머리 컬러를 초록으로 통일 -->
    <a-config-provider :theme="{ token: { colorPrimary: '#00c851' } }">
      <a-card class="find-card">
        <h2 class="title">아이디 · 비밀번호 찾기</h2>

        <a-tabs v-model:activeKey="activeKey" centered class="tight-tabs">
          <!-- =======================
               탭 1: 아이디(이메일) 찾기
          ======================== -->
          <a-tab-pane key="id" tab="아이디 찾기">
            <a-form :model="idForm" layout="vertical" class="compact-form">
              <a-form-item label="가입 이메일" class="compact-item">
                <a-input
                  size="middle"
                  v-model:value="idForm.email"
                  placeholder="가입 시 사용한 이메일 주소"
                  @blur="debouncedCheckIdEmail()"
                />
              </a-form-item>

              <div class="code-row">
                <a-input
                  size="middle"
                  v-model:value="idForm.code"
                  placeholder="인증코드 6자리"
                  maxlength="6"
                  :disabled="idVerified"
                />
                <a-button
                  size="middle"
                  class="ml-8"
                  :disabled="idSending || !idCanSend || idVerified"
                  @click="sendIdCode"
                >
                  {{ idSendBtnText }}
                </a-button>
                <a-button
                  size="middle"
                  class="ml-8"
                  type="primary"
                  :disabled="!idForm.code || idVerified"
                  :loading="idVerifying"
                  @click="verifyIdCode"
                >
                  인증하기
                </a-button>
              </div>

              <a-alert
                v-if="idVerified"
                class="mt-10"
                type="success"
                show-icon
                :message="`인증 완료`"
                :description="`가입 아이디: ${displayUsername}`"
              />

              <div class="actions">
                <a-button size="middle" @click="goLogin">로그인으로</a-button>
              </div>
            </a-form>
          </a-tab-pane>

          <!-- =======================
               탭 2: 비밀번호 재설정
          ======================== -->
          <a-tab-pane key="pw" tab="비밀번호 재설정">
            <!-- Steps를 컴팩트하게 -->
            <a-steps size="small" :current="pwStep" class="steps tight-steps">
              <a-step title="이메일" />
              <a-step title="인증" />
              <a-step title="새 비번" />
            </a-steps>

            <!-- STEP 0: 이메일 -->
            <div v-show="pwStep === 0" class="mt-12">
              <a-form :model="pwForm" layout="vertical" class="compact-form">
                <a-form-item label="가입 인증 이메일" class="compact-item">
                  <a-input
                    size="middle"
                    v-model:value="pwForm.email"
                    placeholder="가입 시 인증한 이메일 주소"
                    @blur="debouncedCheckPwEmail()"
                  />
                </a-form-item>
                <div class="actions">
                  <a-button size="middle" type="primary" :disabled="!pwEmailCanProceed" @click="goPwStep1">다음</a-button>
                </div>
              </a-form>
            </div>

            <!-- STEP 1: 코드 인증 -->
            <div v-show="pwStep === 1" class="mt-12">
              <div class="code-row">
                <a-input
                  size="middle"
                  v-model:value="pwForm.code"
                  placeholder="인증코드 6자리"
                  maxlength="6"
                  :disabled="pwVerified"
                />
                <a-button
                  size="middle"
                  class="ml-8"
                  :disabled="pwSending || !pwCanSend || pwVerified"
                  @click="sendPwCode"
                >
                  {{ pwSendBtnText }}
                </a-button>
                <a-button
                  size="middle"
                  class="ml-8"
                  type="primary"
                  :disabled="!pwForm.code || pwVerified"
                  :loading="pwVerifying"
                  @click="verifyPwCode"
                >
                  인증하기
                </a-button>
              </div>

              <a-alert
                v-if="pwVerified"
                type="success"
                class="mt-10"
                show-icon
                message="이메일 인증 완료"
              />

              <div class="actions">
                <a-button size="middle" @click="pwStep = 0">이전</a-button>
                <a-button size="middle" type="primary" :disabled="!pwVerified" @click="pwStep = 2">다음</a-button>
              </div>
            </div>

            <!-- STEP 2: 새 비밀번호 설정 -->
            <div v-show="pwStep === 2" class="mt-12">
              <a-form :model="pwForm" layout="vertical" class="compact-form">
                <a-form-item label="새 비밀번호" class="compact-item">
                  <a-input-password
                    size="middle"
                    v-model:value="pwForm.newPassword"
                    placeholder="영문, 숫자, 특수문자 포함 8~64자"
                  />
                </a-form-item>
                <a-form-item label="새 비밀번호 확인" class="compact-item">
                  <a-input-password
                    size="middle"
                    v-model:value="pwForm.confirmPassword"
                    placeholder="새 비밀번호와 동일하게 입력"
                  />
                </a-form-item>
                <div class="actions">
                  <a-button size="middle" @click="pwStep = 1">이전</a-button>
                  <a-button
                    size="middle"
                    type="primary"
                    :loading="pwResetting"
                    :disabled="!pwPasswordValid"
                    @click="submitNewPassword"
                  >비밀번호 변경</a-button>
                </div>
              </a-form>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </a-config-provider>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const goLogin = () => router.push('/login')

/* 공통: 쿨다운 타이머 유틸 */
function useCooldown() {
  const sec = ref(0)
  let t = null
  const start = (s = 60) => {
    clearInterval(t)
    sec.value = s
    t = setInterval(() => {
      sec.value -= 1
      if (sec.value <= 0) clearInterval(t)
    }, 1000)
  }
  return { sec, start }
}

/* =========================
   탭1: 아이디(이메일) 찾기
========================= */
const idForm = reactive({ email: '', code: '' })
const idVerified = ref(false)
const { sec: idCooldown, start: startIdCooldown } = useCooldown()
const idCanSend = computed(() => idCooldown.value === 0 && /\S+@\S+\.\S+/.test(idForm.email))
const idSendBtnText = computed(() => idCooldown.value > 0 ? `재발송 (${idCooldown.value}s)` : '인증코드 발송')
const idSending = ref(false)
const idVerifying = ref(false)
const debouncedCheckIdEmail = () => {/* 필요시 dup-check */ }
const maskedIdEmail = computed(() => {
  const [user, domain] = idForm.email.split('@')
  if (!user || !domain) return idForm.email
  const head = user.slice(0, 2)
  return `${head}${'*'.repeat(Math.max(user.length - 2, 1))}@${domain}`
})
const foundUsername = ref('')              //  조회된 아이디 저장
const displayUsername = computed(() =>     // 표시용(조회 결과 없으면 기존 마스킹 이메일 사용)
  foundUsername.value || maskedIdEmail.value
)

async function sendIdCode() {
  if (!idCanSend.value) return
  idSending.value = true
  try {
    await axios.post('/api/auth/email/send', { email: idForm.email, purpose: 'USERNAME_LOOKUP' })
    message.success('인증코드를 전송했어요.')
    startIdCooldown(60)
  } catch (e) {
    const code = e?.response?.data?.codeType
    if (code === 'NOT_FOUND') message.error('가입 이력이 없는 이메일입니다.')
    else if(code === 'ACCOUNT_DELETED') promptRecover(idForm.email)
    else message.error('코드 전송에 실패했어요.')
  } finally {
    idSending.value = false
  }
}

async function verifyIdCode() {
  if (!idForm.code) return
  idVerifying.value = true
  try {
    const { data } = await axios.post('/api/auth/email/verify', {
      email: idForm.email,
      code: idForm.code,
      purpose: 'USERNAME_LOOKUP'
    })
    if (data?.verified) {
      idVerified.value = true
      // 인증 성공 → 가입 아이디 조회
      try {
        const res = await axios.post('/api/auth/username/lookup', { email: idForm.email })
        // 서버 응답 형태에 따라 필드명 조정 (username / userId 등)
        foundUsername.value = res.data?.email ?? ''
      } catch {
        // 인증 성공은 유지, 조회 실패만 안내
        message.warning('인증은 완료되었지만 아이디 조회에 실패했어요.')
      }
      message.success('인증이 완료되었습니다.')


    } else {
      message.error('인증코드가 올바르지 않습니다.')
    }
  } catch {
    message.error('인증 처리 중 오류가 발생했어요.')
  } finally {
    idVerifying.value = false
  }
}

// 이메일 인증을 통한 복구
function promptRecover(email) {
  Modal.confirm({
    title: '계정 복구',
    content: '해당 계정은 현재 탈퇴 상태입니다. 복구를 진행하시겠습니까?',
    okText: '복구 하기',
    cancelText: '취소',
    // onOk가 Promise를 반환하면 confirm 버튼에 로딩이 자동 표시됨
    onOk: () => {
      return router.push({ path: '/recover-account', query: { email } })
    }
  })
}

/* =========================
   탭2: 비밀번호 재설정
========================= */
const pwStep = ref(0)
const pwForm = reactive({ email: '', code: '', newPassword: '', confirmPassword: '' })

const { sec: pwCooldown, start: startPwCooldown } = useCooldown()
const pwCanSend = computed(() => pwCooldown.value === 0 && /\S+@\S+\.\S+/.test(pwForm.email))
const pwSendBtnText = computed(() => pwCooldown.value > 0 ? `재발송 (${pwCooldown.value}s)` : '인증코드 발송')

const pwSending = ref(false)
const pwVerifying = ref(false)
const pwVerified = ref(false)
const pwResetting = ref(false)

const debouncedCheckPwEmail = () => {/* 필요시 exists 체크 */ }
const pwEmailCanProceed = computed(() => /\S+@\S+\.\S+/.test(pwForm.email))

function goPwStep1() { pwStep.value = 1 }

async function sendPwCode() {
  if (!pwCanSend.value) return
  pwSending.value = true
  try {
    await axios.post('/api/auth/email/send', { email: pwForm.email, purpose: 'PASSWORD_RESET' })
    message.success('인증코드를 전송했어요.')
    startPwCooldown(60)
  } catch (e) {
    const code = e?.response?.data?.codeType
    if (code === 'NOT_FOUND') message.error('가입 이력이 없는 이메일입니다.')
    else if(code === 'ACCOUNT_DELETED') promptRecover(pwForm.email)
    else message.error('코드 전송에 실패했어요.')
  } finally {
    pwSending.value = false
  }
}

async function verifyPwCode() {
  if (!pwForm.code) return
  pwVerifying.value = true
  try {
    const { data } = await axios.post('/api/auth/email/verify', {
      email: pwForm.email,
      code: pwForm.code,
      purpose: 'PASSWORD_RESET'
    })
    if (data?.verified) {
      pwVerified.value = true
      message.success('이메일 인증이 완료되었습니다.')
    } else {
      message.error('인증코드가 올바르지 않습니다.')
    }
  } catch {
    message.error('인증 처리 중 오류가 발생했어요.')
  } finally {
    pwVerifying.value = false
  }
}

const pwPasswordValid = computed(() => {
  const v = pwForm.newPassword || ''
  const okLen = v.length >= 8 && v.length <= 64
  const okNum = /\d/.test(v)
  const okSpc = /[^A-Za-z0-9]/.test(v)
  const okAlpha = /[A-Za-z]/.test(v)
  const same = pwForm.newPassword === pwForm.confirmPassword
  return okLen && okNum && okSpc && okAlpha && same && pwVerified.value
})

async function submitNewPassword() {
  if (!pwPasswordValid.value) return
  pwResetting.value = true
  try {
    await axios.post('/api/auth/password/reset', {
      email: pwForm.email,
      code: pwForm.code,
      newPassword: pwForm.newPassword
    })
    message.success('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.')
    router.push('/login')
  } catch (e) {
    const code = e?.response?.data?.codeType
    if (code === 'EXPIRED') message.error('코드가 만료되었습니다. 다시 요청해 주세요.')
    else if (code === 'MISMATCH') message.error('코드가 일치하지 않습니다.')
    else message.error('비밀번호 변경에 실패했습니다.')
  } finally {
    pwResetting.value = false
  }
}

/* 탭 상태 (기본: 비밀번호 재설정) */
const activeKey = ref('pw')
</script>

<style scoped>
/* ======= 레이아웃: 한 화면에 쏙 들어오게 컴팩트 ======= */
.find-wrap {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;       /* 세로 중앙 정렬 */
  padding: 16px;             /* 모바일도 스크롤 없게 여백 최소화 */
  box-sizing: border-box;
}

.find-card {
  width: 100%;
  max-width: 640px;          /* 데스크탑에서 과도하게 넓지 않게 */
  border-radius: 14px;
  padding: 18px 20px;        /* 내부 여백 컴팩트 */
  border: 1.5px solid #00c85166;     /*  윤곽선 또렷하게(초록 라이트) */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06), 0 0 0 1px #00c85122; /* 미세 외곽선 */
}

/* 제목/탭 여백을 줄여서 전체 높이 축소 */
.title {
  text-align: center;
  margin: 4px 0 8px;
  font-size: 18px;
  font-weight: 700;
}

.tight-tabs :deep(.ant-tabs-nav) {
  margin: 0 0 8px 0;
}

/* Steps도 낮게 */
.steps {
  max-width: 500px;
  margin: 0 auto;
}
.tight-steps :deep(.ant-steps-item) {
  padding-inline: 8px;
}

/* 폼/아이템 간 간격 축소(컴팩트 폼) */
.compact-form {
  margin-top: 4px;
}
.compact-item :deep(.ant-form-item-label) {
  padding-bottom: 4px;
}
.compact-item {
  margin-bottom: 10px;
}

/* 코드 입력/버튼 행 */
.code-row {
  display: flex;
  align-items: center;
  margin-top: 4px;
}
.ml-8 { margin-left: 8px; }
.mt-10 { margin-top: 10px; }
.mt-12 { margin-top: 12px; }

/* 우측 정렬 버튼행 */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

/* ======= 윤곽선(아웃라인) 또렷하게: 입력/버튼 공통 ======= */
:deep(.ant-input),
:deep(.ant-input-affix-wrapper),
:deep(.ant-select-selector),
:deep(.ant-btn) {
  border-radius: 10px;
  border-width: 1.5px;                      /* 테두리 두께 살짝 증가 */
  border-color: #c9c9c9;
}

/* 포커스/호버 시 초록 포커스라인 */
:deep(.ant-input:hover),
:deep(.ant-input:focus),
:deep(.ant-input-affix-wrapper:hover),
:deep(.ant-input-affix-wrapper-focused),
:deep(.ant-select-selector:hover),
:deep(.ant-select-focused .ant-select-selector),
:deep(.ant-btn:hover),
:deep(.ant-btn:focus) {
  border-color: #00c851 !important;         /*  초록 포커스 */
  box-shadow: 0 0 0 2px rgba(0, 200, 81, 0.12);
}

/* 프라이머리 버튼(초록) 대비 강화 */
:deep(.ant-btn-primary) {
  background-color: #00c851;
  border-color: #00c851;
  font-weight: 600;
}
:deep(.ant-btn-primary:hover) {
  filter: brightness(0.98);
}
:deep(.ant-btn-primary:active) {
  filter: brightness(0.95);
}

/* 성공 Alert 아이콘/테두리 초록 계열과 조화 */
:deep(.ant-alert-success) {
  border-radius: 10px;
}

/* 반응형: 모바일에서도 스크롤 없이 들어오게 폰트/여백 최소화 */
@media (max-width: 576px) {
  .find-card {
    max-width: 360px;
    padding: 14px 14px;
  }
  .title { font-size: 16px; }
  .steps { max-width: 320px; }
  .compact-item { margin-bottom: 8px; }
  .actions { margin-top: 8px; }
}
</style>
