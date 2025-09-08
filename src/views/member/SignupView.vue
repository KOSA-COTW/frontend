<!-- src/views/auth/Signup.vue -->
<template>
  <div class="signup-wrap">
    <!-- 1) 테마 Primary 컬러를 #00C851로 통일 -->
    <a-config-provider :theme="{ token: { colorPrimary: '#00C851' } }">
      <a-card class="signup-card">
        <h1 class="title">회원가입</h1>

        <a-steps :current="currentStep" class="steps">
          <a-step title="계정 정보" />
          <a-step title="이메일 인증" />
          <a-step title="약관 동의" />
        </a-steps>

        <a-form
          ref="signupFormRef"
          :model="form"
          :rules="rules"
          layout="vertical"
          :colon="false"
          @finish="handleSubmit"
        >
          <!-- STEP 1: 계정 정보 -->
          <div v-show="currentStep === 0">
            <a-form-item label="이름" name="name">
              <a-input v-model:value="form.name" placeholder="이름을 입력하세요" size="large" />
            </a-form-item>

            <a-form-item label="별명" name="nickname">
              <a-input
                v-model:value="form.nickname"
                placeholder="별명을 입력하세요"
                size="large"
                @blur="debouncedCheckNickname()"
              />
            </a-form-item>

            <a-form-item label="로그인 이메일" name="email">
              <a-input
                v-model:value="form.email"
                placeholder="※ 로그인 시 사용할 이메일을 입력하세요"
                size="large"
                @blur="debouncedCheckEmail()"
              />
            </a-form-item>

            <a-form-item label="비밀번호" name="password">
              <a-input-password
                v-model:value="form.password"
                placeholder="영문, 숫자, 특수문자 포함 8~64자"
                size="large"
              />
            </a-form-item>

            <!-- 비밀번호 강도: 초록색 -->
            <div class="pw-strength">
              <span>비밀번호 강도</span>
              <a-progress
                :percent="passwordScore"
                :show-info="false"
                :status="passwordScore < 40 ? 'exception' : (passwordScore < 70 ? 'active' : 'success')"
                :stroke-color="passwordScore < 40 ? '#ff4d4f' : '#00C851'"
              />
              <div class="pw-hint">{{ passwordHint }}</div>
            </div>

            <a-form-item label="비밀번호 확인" name="confirmPassword">
              <a-input-password v-model:value="form.confirmPassword" placeholder="비밀번호를 다시 입력하세요" size="large" />
            </a-form-item>

            <div class="step-actions">
              <a-button type="primary" size="large" @click="gotoStep2" :loading="submitting">
                다음 (이메일 인증)
              </a-button>
            </div>
          </div>

          <!-- STEP 2: 이메일 인증 (인증용 이메일 직접 입력) -->
          <div v-show="currentStep === 1">
            <a-alert
              v-if="emailVerified"
              type="success"
              message="이메일 인증 완료"
              description="인증이 완료되었습니다. 다음 단계로 진행하세요."
              show-icon
              class="mb-16"
            />

            <a-form-item label="인증할 이메일" name="verifyEmail">
              <a-input
                v-model:value="verifyEmail"
                placeholder="인증코드를 받을 이메일을 입력하세요"
                size="large"
                :disabled="emailVerified"
                @blur="debouncedCheckVerifyEmail()"
              />
              <div class="verify-hint">
                ※ 1단계에서 입력한 이메일은 로그인용도로 사용됩니다. 현재 단계에서 사용하는 이메일은 인증용도로만 사용됩니다.
              </div>
            </a-form-item>

            <div class="code-row">
              <a-input
                v-model:value="emailCode"
                placeholder="인증코드 6자리"
                maxlength="6"
                size="large"
                :disabled="emailVerified"
                style="flex:1"
              />
              <a-button
                class="ml-8"
                size="large"
                :disabled="sendingCode || !canSendCode || emailVerified"
                @click="sendCode"
              >
                {{ sendButtonText }}
              </a-button>
              <a-button
                class="ml-8"
                size="large"
                type="primary"
                :disabled="!emailCode || emailVerified"
                @click="verifyCode"
                :loading="verifyingCode"
              >
                인증하기
              </a-button>
            </div>

            <div class="step-actions">
              <a-button size="large" @click="currentStep = 0">이전</a-button>
              <a-button type="primary" size="large" @click="gotoStep3" :disabled="!emailVerified">다음 (약관 동의)</a-button>
            </div>
          </div>

          <!-- STEP 3: 약관 동의 -->
          <div v-show="currentStep === 2">
            <a-card size="small" class="info-card">
              <h3>수집정보</h3>
              <ul>
                <li>회원 가입 의사 확인, 연령 확인</li>
                <li>이용자 식별 및 중복가입 확인</li>
                <li>고지/불만처리 안내</li>
              </ul>
            </a-card>

            <a-form-item name="agreements">
              <div class="agreements">
                <a-checkbox
                  :checked="form.agreements.includes('age14')"
                  @change="onAgreeChange('age14', $event.target.checked)"
                >
                  * 만 14세 이상입니다 (필수)
                </a-checkbox>
                <br />

                <a-checkbox
                  :checked="form.agreements.includes('terms')"
                  @change="onAgreeChange('terms', $event.target.checked)"
                >
                  * 이용약관 동의 (필수)
                </a-checkbox>
                <a-button type="link" size="small" @click="openTerms = true">보기</a-button>
                <br />

                <a-checkbox
                  :checked="form.agreements.includes('privacy')"
                  @change="onAgreeChange('privacy', $event.target.checked)"
                >
                  * 개인정보 처리방침 동의 (필수)
                </a-checkbox>
                <a-button type="link" size="small" @click="openPrivacy = true">보기</a-button>
                <br />

                <a-checkbox
                  :checked="form.agreements.includes('marketing')"
                  @change="onAgreeChange('marketing', $event.target.checked)"
                >
                  마케팅 정보 수신 동의 (선택)
                </a-checkbox>
                <a-button type="link" size="small" @click="openMarketing = true">보기</a-button>
                <a-divider />
                <a-checkbox :checked="allAgreed" @change="toggleAllAgree">위의 모든 약관을 확인하고 전체 동의합니다</a-checkbox>
              </div>
            </a-form-item>

            <div class="step-actions">
              <a-button size="large" @click="currentStep = 1">이전</a-button>
              <a-button
                type="primary"
                html-type="submit"
                size="large"
                :loading="submitting"
              >
                회원가입 완료
              </a-button>
            </div>
          </div>
        </a-form>
      </a-card>

      <!-- 약관 모달 -->
      <a-modal v-model:open="openTerms" title="이용약관" width="880px" :footer="null">
        <div class="doc" v-html="TERMS_HTML"></div>
      </a-modal>

      <a-modal v-model:open="openPrivacy" title="개인정보 처리방침" width="880px" :footer="null">
        <div class="doc" v-html="PRIVACY_HTML"></div>
      </a-modal>

      <a-modal v-model:open="openMarketing" title="마케팅 정보 수신 동의" width="880px" :footer="null">
        <div class="doc" v-html="MARKETING_HTML"></div>
      </a-modal>

    </a-config-provider>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axios'

// ====== Router / State ======
const router = useRouter()
const signupFormRef = ref()

const currentStep = ref(0)
const submitting = ref(false)

const form = reactive({
  name: '',
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreements: []       // ['age14','terms','privacy','marketing']
})

// ====== 비밀번호 강도 ======
const passwordScore = computed(() => {
  const v = form.password || ''
  let score = 0
  if (v.length >= 8) score += 30
  if (/[A-Z]/.test(v) || /[a-z]/.test(v)) score += 20
  if (/\d/.test(v)) score += 20
  if (/[^A-Za-z0-9]/.test(v)) score += 30
  return Math.min(score, 100)
})
const passwordHint = computed(() => {
  if (passwordScore.value < 40) return '약함'
  if (passwordScore.value < 70) return '보통'
  return '강함'
})

// ====== 이메일 중복 / 닉네임 중복 체크(디바운스) ======
let emailCheckTimer = null
let nicknameCheckTimer = null
const emailAvailable = ref(true) // Step1 이메일은 선택 입력 → 기본 true
const nicknameAvailable = ref(false)

const checkEmail = async () => {
  emailAvailable.value = true
  if (!form.email) return
  try {
    const { data } = await axios.get('/api/members/dup-check/email', { params: { email: form.email }})
    emailAvailable.value = !!data.available
    if (!emailAvailable.value) message.warning('이미 사용 중인 이메일입니다.')
  } catch {}
}
const checkNickname = async () => {
  nicknameAvailable.value = false
  if (!form.nickname) return
  try {
    const { data } = await axios.get('/api/members/dup-check/nickname', { params: { nickname: form.nickname }})
    nicknameAvailable.value = !!data.available
    if (!nicknameAvailable.value) message.warning('이미 사용 중인 별명입니다.')
  } catch {}
}
const debouncedCheckEmail = () => {
  clearTimeout(emailCheckTimer)
  emailCheckTimer = setTimeout(checkEmail, 400)
}
const debouncedCheckNickname = () => {
  clearTimeout(nicknameCheckTimer)
  nicknameCheckTimer = setTimeout(checkNickname, 400)
}

watch(() => form.password, () => {
  signupFormRef.value?.validateFields?.(['confirmPassword']).catch(() => {})
})

// ====== Step2: 인증 이메일 별도 입력 ======
const verifyEmail = ref('')
const verifyEmailAvailable = ref(false)
let verifyEmailTimer = null

const checkVerifyEmail = async () => {
  verifyEmailAvailable.value = false
  if (!verifyEmail.value) return
  try {
    const { data } = await axios.get('/api/members/dup-check/email', { params: { email: verifyEmail.value }})
    verifyEmailAvailable.value = !!data.available
    if (!verifyEmailAvailable.value) message.warning('이미 사용 중인 이메일입니다.')
  } catch {}
}
const debouncedCheckVerifyEmail = () => {
  clearTimeout(verifyEmailTimer)
  verifyEmailTimer = setTimeout(checkVerifyEmail, 400)
}

// Step1 → Step2 진입 시 프리필
// watch(currentStep, (s) => {
//   if (s === 1 && !verifyEmail.value && form.email) verifyEmail.value = form.email
// })

// ====== 이메일 인증 ======
const emailVerified = ref(false)
const emailCode = ref('')
const sendingCode = ref(false)
const verifyingCode = ref(false)
const resendCooldown = ref(0) // 초

const canSendCode = computed(() => resendCooldown.value === 0 && !!verifyEmail.value && verifyEmailAvailable.value)
const sendButtonText = computed(() => resendCooldown.value > 0 ? `재발송 (${resendCooldown.value}s)` : '인증코드 발송')

let cooldownTimer = null
const startCooldown = (sec = 60) => {
  resendCooldown.value = sec
  clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    resendCooldown.value -= 1
    if (resendCooldown.value <= 0) clearInterval(cooldownTimer)
  }, 1000)
}

const sendCode = async () => {
  // 인증용 이메일 형식/중복 체크
  if (!verifyEmail.value) {
    message.error('인증할 이메일을 입력하세요.')
    return
  }
  await checkVerifyEmail()
  if (!verifyEmailAvailable.value) {
    message.error('이미 사용 중인 이메일입니다.')
    return
  }
  sendingCode.value = true
  try {
    await axios.post('/api/auth/email/send', { email: verifyEmail.value, purpose: 'SIGNUP' })
    message.success('인증코드를 전송했습니다. 메일함을 확인하세요.')
    startCooldown(60)
  } catch {
    message.error('코드 전송에 실패했습니다.')
  } finally {
    sendingCode.value = false
  }
}

const verifyCode = async () => {
  if (!emailCode.value || emailCode.value.length < 4) {
    message.warning('인증코드를 입력하세요.')
    return
  }
  verifyingCode.value = true
  try {
    const { data } = await axios.post('/api/auth/email/verify', {
      email: verifyEmail.value,
      code: emailCode.value,
      purpose: 'SIGNUP'
    })
    if (data?.verified) {
      emailVerified.value = true
      message.success('이메일 인증이 완료되었습니다.')
    } else {
      message.error('인증코드가 올바르지 않습니다.')
    }
  } catch {
    message.error('인증 처리 중 오류가 발생했습니다.')
  } finally {
    verifyingCode.value = false
  }
}

// ====== 약관 동의 ======
const requiredAgreements = ['age14', 'terms', 'privacy']
const allAgreed = computed(() =>
  ['age14', 'terms', 'privacy', 'marketing'].every(a => form.agreements.includes(a))
)
const onAgreeChange = (key, checked) => {
  if (checked) {
    if (!form.agreements.includes(key)) form.agreements.push(key)
  } else {
    form.agreements = form.agreements.filter(k => k !== key)
  }
}
const toggleAllAgree = (e) => {
  form.agreements = e.target.checked
    ? ['age14','terms','privacy','marketing']
    : []
}

// ====== 폼 검증 규칙 ======
const rules = {
  name: [{ required: true, message: '이름을 입력하세요', trigger: 'blur' }],
  nickname: [
    { required: true, message: '별명을 입력하세요', trigger: 'blur' },
    {
      async validator(_, value) {
        if (!value) return Promise.resolve()
        await checkNickname()
        if (!nicknameAvailable.value) return Promise.reject(new Error('이미 사용 중인 별명입니다'))
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  // Step1 이메일은 선택 입력 → 형식만 체크(입력했을 때만)
  email: [
    {
      validator(_, value) {
        if (!value) return Promise.resolve()
        const ok = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)
        return ok ? Promise.resolve() : Promise.reject(new Error('올바른 이메일 형식이 아닙니다'))
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '비밀번호를 입력하세요', trigger: 'blur' },
    {
      validator(_, value) {
        if (!value) return Promise.resolve()
        const okLen = value.length >= 8 && value.length <= 64
        const okMix = /[A-Z]/.test(value) || /[a-z]/.test(value)
        const okNum = /\d/.test(value)
        const okSpc = /[^A-Za-z0-9]/.test(value)
        if (okLen && okMix && okNum && okSpc) return Promise.resolve()
        return Promise.reject(new Error('영문, 숫자, 특수문자 포함 8~64자여야 합니다'))
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    // { required: true, message: '비밀번호 확인을 입력하세요', trigger: 'blur' },
    {
      validator(_, value) {
        if (!value) return Promise.reject(new Error('비밀번호 확인을 입력하세요'))
        if (value !== form.password) return Promise.reject(new Error('비밀번호가 일치하지 않습니다'))
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  agreements: [
    {
      validator() {
        const ok = requiredAgreements.every(a => form.agreements.includes(a))
        return ok ? Promise.resolve() : Promise.reject(new Error('필수 약관에 동의해야 합니다'))
      },
      trigger: 'change'
    }
  ]
}

// ====== 단계 이동 ======
const gotoStep2 = async () => {
  try {
    // 이메일은 선택 → Step2에서 verifyEmail을 필수로 받음
    await signupFormRef.value?.validateFields?.(['name','nickname','password','confirmPassword'])
    currentStep.value = 1
  } catch {}
}
const gotoStep3 = () => {
  if (!emailVerified.value) {
    message.warning('이메일 인증을 완료해주세요.')
    return
  }
  currentStep.value = 2
}

// ====== 제출 ======
const handleSubmit = async () => {
  if (!emailVerified.value) {
    message.warning('이메일 인증을 완료해주세요.')
    return
  }
  submitting.value = true
  try {
    const payload = {
      name: form.name,
      nickname: form.nickname,
      email: form.email,
      verifiedEmail: verifyEmail.value,
      password: form.password,
      marketingConsent: form.agreements.includes('marketing')
    }
    await axios.post('/api/auth/signup', payload)
    message.success('회원가입이 완료되었습니다!')
    router.push('/login')
  } catch (e) {
    message.error('회원가입에 실패했습니다. 다시 시도해주세요.')
    console.log("error", e)
  } finally {
    submitting.value = false
  }
}

// 모달
const openTerms = ref(false)
const openPrivacy = ref(false)
const openMarketing = ref(false)

// 문서 공통 메타
const POLICY_EFFECTIVE_DATE = '2025-09-05'
const COMPANY_NAME = '{{회사명}}'
const COMPANY_ADDRESS = '{{주소}}'
const COMPANY_OWNER = '{{대표자}}'
const CONTACT_EMAIL = '{{문의 이메일}}'
const CONTACT_TEL = '{{문의 전화}}'
const DPO_NAME = '{{개인정보 보호책임자}}'
const DPO_EMAIL = '{{DPO 이메일}}'

const TERMS_HTML = `
  <h2>제1조 (목적)</h2>
  <p>본 약관은 ${COMPANY_NAME}(${COMPANY_ADDRESS}, 대표자: ${COMPANY_OWNER}, 이하 “회사”)가 제공하는 기부 플랫폼 서비스(이하 “서비스”)의 이용과 관련하여 회사와 회원 간 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>

  <h2>제2조 (정의)</h2>
  <ol>
    <li>“회원”이란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
    <li>“프로젝트”란 서비스에 등록된 모금/캠페인 등 기부 대상 활동을 말합니다.</li>
    <li>“기부금”이란 회원이 프로젝트에 자발적으로 납부하는 금액을 말합니다.</li>
    <li>“결제수단”이란 카드, 계좌이체, 간편결제 등 회사가 제공·연동하는 수단을 말합니다.</li>
  </ol>

  <h2>제3조 (약관의 게시와 개정)</h2>
  <ol>
    <li>회사는 본 약관을 서비스 화면에 게시하며, 관련 법령에 따라 개정할 수 있습니다.</li>
    <li>중요 변경 시 시행 7일 전(회원에게 불리하거나 중대한 사항은 30일 전) 공지합니다.</li>
  </ol>

  <h2>제4조 (회원가입 및 계정)</h2>
  <ol>
    <li>회원은 만 14세 이상만 가입할 수 있으며, 회사는 필요 시 본인확인을 요청할 수 있습니다.</li>
    <li>회원은 계정 정보의 정확성을 유지해야 하며, 타인의 정보를 도용할 수 없습니다.</li>
  </ol>

  <h2>제5조 (이메일 인증 및 보안)</h2>
  <ol>
    <li>회사는 계정 보호와 부정 이용 방지를 위해 이메일 인증을 요구할 수 있습니다.</li>
    <li>인증코드의 유효기간, 재발송 제한 등 세부 정책은 서비스 화면에 고지된 기준을 따릅니다.</li>
  </ol>

  <h2>제6조 (서비스의 내용)</h2>
  <ol>
    <li>회원은 서비스에서 프로젝트를 조회하고 기부할 수 있습니다.</li>
    <li>프로젝트 운영 주체(단체/기관/개인)가 별도로 존재할 수 있으며, 각 프로젝트의 상세 및 결과 책임은 해당 주체에게 있습니다. 회사는 플랫폼 제공자입니다.</li>
  </ol>

  <h2>제7조 (기부 절차 및 결제)</h2>
  <ol>
    <li>회원은 선택한 프로젝트에 기부금을 지불합니다. 결제 승인 시점에 기부가 확정됩니다.</li>
    <li>회사 또는 결제대행사는 결제 처리 및 법정 의무 이행을 위해 필요한 정보를 수집·이용할 수 있습니다.</li>
  </ol>

  <h2>제8조 (영수증 및 기부금 영수증)</h2>
  <ol>
    <li>단순 결제 영수증은 결제대행사를 통해 제공될 수 있습니다.</li>
    <li>세액공제용 기부금 영수증은 해당 모금 주체의 자격 및 법령 요건 충족 시에만 발급 가능하며, 발급 주체·시점·방법은 프로젝트별 안내에 따릅니다.</li>
  </ol>

  <h2>제9조 (수수료 및 환불)</h2>
  <ol>
    <li>회사는 서비스 운영·결제 처리에 필요한 수수료를 프로젝트 주체 측에 부과할 수 있으며, 회원에게는 별도 고지 없는 한 수수료를 부과하지 않습니다.</li>
    <li>기부금의 특성상 단순 변심 환불은 제한됩니다. 이중 결제·오류 결제 등 회사 책임 또는 법령상 필요한 경우에 한해 절차에 따라 환불이 가능하며, 환불 가능 여부 및 범위는 프로젝트·결제수단·정산 상태에 따라 달라질 수 있습니다.</li>
  </ol>

  <h2>제10조 (회원의 의무와 금지행위)</h2>
  <ol>
    <li>법령·약관·공지 및 서비스 이용 안내를 준수해야 합니다.</li>
    <li>불법 모금, 거짓 정보 유포, 타인의 권리 침해, 시스템 장애 유발 행위가 금지됩니다.</li>
  </ol>

  <h2>제11조 (지식재산권)</h2>
  <p>서비스 및 제공 콘텐츠에 대한 권리는 회사 또는 정당한 권리자에게 귀속됩니다. 회원은 허용된 범위 내에서만 이용할 수 있습니다.</p>

  <h2>제12조 (서비스 변경·중단)</h2>
  <p>회사는 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경·중단할 수 있으며, 사전에 공지합니다(부득이한 경우 사후 공지).</p>

  <h2>제13조 (면책 및 책임의 한계)</h2>
  <p>자연재해, 외부 통신 장애 등 불가항력 사유로 인한 서비스 장애에 대해 회사는 책임을 지지 않습니다. 프로젝트의 이행·성과는 해당 주체의 책임입니다.</p>

  <h2>제14조 (계정 해지)</h2>
  <p>회원은 언제든지 탈퇴할 수 있으며, 관련 법령 및 회사 정책에 따라 필요한 범위에서 정보가 보관될 수 있습니다.</p>

  <h2>제15조 (준거법 및 분쟁 해결)</h2>
  <p>본 약관은 대한민국 법률을 준거법으로 하며, 분쟁은 민사소송법에 따른 관할 법원에 제기합니다.</p>

  <h2>제16조 (고지 및 연락)</h2>
  <p>문의: ${CONTACT_EMAIL} / ${CONTACT_TEL}</p>

  <hr />
  <p>시행일: ${POLICY_EFFECTIVE_DATE}</p>
`

const PRIVACY_HTML = `
  <h2>1. 총칙</h2>
  <p>${COMPANY_NAME}(이하 “회사”)는 개인정보 보호법 등 관련 법령을 준수하며, 본 처리방침에 따라 이용자의 개인정보를 안전하게 취급합니다.</p>

  <h2>2. 수집 항목 및 수집 방법</h2>
  <ul>
    <li><b>회원가입</b>: 이메일, 비밀번호, 이름, 별명, 만 14세 이상 여부</li>
    <li><b>이메일 인증</b>: 이메일 주소, 인증코드(일시적으로 저장)</li>
    <li><b>결제</b>: 결제수단 정보(카드/계좌 일부 식별정보), 결제 식별자, 영수증/정산 관련 정보</li>
    <li><b>기기/로그</b>: 접속 IP, 쿠키, 서비스 이용 기록, 오류 로그</li>
    <li><b>선택</b>: 마케팅 수신 동의 여부</li>
  </ul>

  <h2>3. 이용 목적</h2>
  <ul>
    <li>회원 식별 및 가입 의사 확인, 중복 가입 방지</li>
    <li>이메일 인증, 보안 및 부정 이용 방지</li>
    <li>결제 처리, 정산 및 법정 의무 이행</li>
    <li>서비스 제공, 고지/공지 전달, 민원 처리</li>
    <li>서비스 품질 개선 및 통계 분석(비식별·집계 형태)</li>
    <li>마케팅 정보 발송(수신 동의자에 한함)</li>
  </ul>

  <h2>4. 보유 및 이용 기간</h2>
  <ul>
    <li>회원 탈퇴 시 지체 없이 파기하되, 관계 법령에 따라 다음 기간 동안 보관할 수 있습니다.</li>
    <li>계약/청약철회/대금결제/재화공급 기록: 5년</li>
    <li>소비자 불만/분쟁 처리 기록: 3년</li>
    <li>접속 로그: 3개월</li>
    <li>이메일 인증코드: 발급 후 10분 이내 자동 파기</li>
  </ul>

  <h2>5. 제3자 제공 및 처리위탁</h2>
  <p>회사는 원칙적으로 이용자의 동의 없이 제3자에게 개인정보를 제공하지 않습니다. 다만 결제대행사, 메일/문자 발송, 클라우드/백업, 데이터 분석 등 서비스 운영을 위해 수탁사에 처리를 위탁할 수 있으며, 위탁사는 계약에 의해 개인정보 보호 의무를 부담합니다. (구체 목록은 서비스 내 공지 또는 본 방침 부록에 게시)</p>

  <h2>6. 해외 이전</h2>
  <p>해외 사업자 서비스 사용 시(예: 글로벌 클라우드) 개인정보가 국외로 이전될 수 있으며, 이전 국가/이전 일시/보유기간/관리 책임자 등은 별도 고지합니다.</p>

  <h2>7. 이용자 및 법정대리인의 권리</h2>
  <ul>
    <li>열람·정정·삭제·처리정지 요구 및 동의 철회 권리를 행사할 수 있습니다.</li>
    <li>만 14세 미만은 법정대리인 동의가 필요합니다.</li>
  </ul>

  <h2>8. 쿠키</h2>
  <p>서비스 편의를 위해 쿠키를 사용할 수 있으며, 브라우저 설정을 통해 저장을 거부할 수 있습니다. 다만 일부 기능 이용에 제한이 있을 수 있습니다.</p>

  <h2>9. 안전성 확보 조치</h2>
  <ul>
    <li>접근 권한 관리, 비밀번호/토큰의 암호화 저장</li>
    <li>전송 구간의 암호화(HTTPS)</li>
    <li>개인정보 취급자 최소화 및 교육</li>
    <li>접속 기록 보관 및 위·변조 방지</li>
  </ul>

  <h2>10. 파기 절차 및 방법</h2>
  <p>보유 기간 경과 또는 처리 목적 달성 시 지체 없이 복구·재생이 불가능한 방법으로 파기합니다.</p>

  <h2>11. 개인정보 보호책임자</h2>
  <p>책임자: ${DPO_NAME} / 이메일: ${DPO_EMAIL} / 연락처: ${CONTACT_TEL}</p>

  <h2>12. 고지 의무</h2>
  <p>본 방침은 ${POLICY_EFFECTIVE_DATE}부터 시행됩니다. 변경 시 사전 공지합니다.</p>
`

const MARKETING_HTML = `
  <h2>마케팅 정보 수신 동의(선택)</h2>
  <p>회사는 이벤트/프로모션/서비스 안내 등 정보를 이메일/푸시/문자 등으로 제공할 수 있습니다. 동의하지 않아도 서비스 이용에는 제한이 없습니다.</p>

  <h3>수집·이용 항목</h3>
  <ul>
    <li>이메일, 푸시 토큰, 앱·웹 이용 기록(캠페인 반응 분석 목적)</li>
  </ul>

  <h3>이용 목적</h3>
  <ul>
    <li>이벤트·혜택·신규 기능·뉴스레터 제공</li>
    <li>맞춤형 콘텐츠/광고 제공을 위한 통계·분석</li>
  </ul>

  <h3>보유 기간</h3>
  <p>동의 철회 또는 회원 탈퇴 시까지. 법령상 보존이 필요한 경우 해당 기간 동안 보관.</p>

  <h3>동의 철회</h3>
  <ul>
    <li>마이페이지 &gt; 알림/마케팅 설정에서 변경 가능</li>
    <li>또는 ${CONTACT_EMAIL}로 연락 시 지체 없이 반영</li>
  </ul>

  <hr />
  <p>시행일: ${POLICY_EFFECTIVE_DATE}</p>
`

</script>

<style scoped>
.signup-wrap {
  min-height: 100vh;
  padding: 40px 16px;
  display: flex; align-items: flex-start; justify-content: center;
}
.signup-card { width: 100%; max-width: 720px; border-radius: 16px; }
.title { text-align: center; margin: 0 0 16px; }
.steps { max-width: 520px; margin: 0 auto 24px; }
/* 프로그레스/프라이머리 톤은 ConfigProvider로 통일되지만, 강도바는 strokeColor로 지정 */
.pw-strength { margin: -8px 0 16px; }
.pw-strength .pw-hint { font-size: 12px; color: #999; margin-top: 4px; }
.code-row { display: flex; align-items: center; }
.ml-8 { margin-left: 8px; }
.mb-16 { margin-bottom: 16px; }
.info-card { background: #fafafa; margin-bottom: 24px; }
.agreements { font-size: 13px; }
.step-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
.verify-hint { margin-top: 6px; font-size: 12px; color: #888; }

.doc {
  max-height: 60vh;
  overflow: auto;
  line-height: 1.6;
  font-size: 13.5px;
  white-space: normal;
}
.doc h2 { margin-top: 16px; font-size: 16px; }
.doc h3 { margin-top: 12px; font-size: 14px; }
.doc ul, .doc ol { padding-left: 18px; }
.doc hr { margin: 16px 0; }

</style>
