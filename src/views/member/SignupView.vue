<template>
  <div class="signup-container">
    <a-card class="signup-card">
      <div class="signup-title">
        <h1>회원가입</h1>
      </div>

      <a-form
        :model="formData"
        :rules="validationRules"
        ref="signupFormRef"
        @finish="onSubmit"
        layout="vertical"
        :colon="false"
      >
        <a-form-item>
          <div class="required-text">* 필수입력</div>
        </a-form-item>

        <a-form-item label="이메일" name="email">
          <a-input v-model:value="formData.email" placeholder="이메일을 입력하세요" size="large" />
        </a-form-item>

        <a-form-item label="비밀번호" name="password">
          <a-input-password v-model:value="formData.password" placeholder="비밀번호를 입력하세요" size="large" />
        </a-form-item>

        <a-form-item label="비밀번호 확인" name="confirmPassword">
          <a-input-password v-model:value="formData.confirmPassword" placeholder="비밀번호를 다시 입력하세요" size="large" />
        </a-form-item>

        <a-form-item label="이름" name="name">
          <a-input v-model:value="formData.name" placeholder="이름을 입력하세요" size="large" />
        </a-form-item>

        <a-form-item label="휴대폰 번호" name="phone">
          <a-space class="phone-space">
            <a-input v-model:value="formData.phone" placeholder="휴대폰 번호를 입력하세요" size="large" />
            <a-button @click="sendVerificationCode" :loading="sendingCode" size="large" type="primary" class="primary-btn">인증번호 전송</a-button>
          </a-space>
        </a-form-item>

        <a-form-item v-if="showVerificationInput" label="인증번호" name="verificationCode">
          <a-space class="phone-space">
            <a-input v-model:value="formData.verificationCode" placeholder="인증번호를 입력하세요" size="large" />
            <div class="countdown-text">{{ formatTime(remainingTime) }}</div>
          </a-space>
        </a-form-item>

        <a-form-item label="추천인 코드" name="referralCode">
          <a-input v-model:value="formData.referralCode" placeholder="추천인 코드가 있다면 입력하세요" size="large" />
        </a-form-item>

        <a-card size="small" class="info-card">
          <h3>수집정보</h3>
          <p>개인정보를 수집하는 목적은 다음과 같습니다.</p>
          <ul>
            <li>회원 가입 의사의 확인, 연령 확인 및 법정대리인 동의 진행</li>
            <li>이용자 식별, 개인식별, 중복가입 확인</li>
            <li>고지사항 전달, 불만처리 의사소통 경로 확보</li>
          </ul>
        </a-card>

        <div class="agreement-section">
          <h3>서비스 약관 동의</h3>
          <a-form-item name="agreements">
            <a-checkbox :checked="formData.agreements.includes('terms')" @change="(e) => handleAgreementChange('terms', e.target.checked)">
              * 이용약관 동의 (필수)
            </a-checkbox>
            <a-button type="link" size="small">보기</a-button>
            <br />

            <a-checkbox :checked="formData.agreements.includes('privacy')" @change="(e) => handleAgreementChange('privacy', e.target.checked)">
              * 개인정보 처리방침 동의 (필수)
            </a-checkbox>
            <a-button type="link" size="small">보기</a-button>
            <br />

            <a-checkbox :checked="formData.agreements.includes('marketing')" @change="(e) => handleAgreementChange('marketing', e.target.checked)">
              마케팅 정보 수신 동의 (선택)
            </a-checkbox>
            <a-button type="link" size="small">보기</a-button>
            <br />

            <a-divider />
            <a-checkbox :checked="isAllAgreed" @change="handleAllAgreement">
              위의 모든 약관을 확인하고 전체 동의합니다
            </a-checkbox>
          </a-form-item>
        </div>

        <a-form-item>
          <a-button type="primary" html-type="submit" size="large" :loading="submitting" class="submit-btn">
            회원가입
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>


<script>
import { reactive, ref, computed, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'

export default {
  name: 'SignupPage',
  setup() {
    const signupFormRef = ref(null)
    const sendingCode = ref(false)
    const submitting = ref(false)
    const showVerificationInput = ref(false)
    const remainingTime = ref(180) // 3분
    let timer = null

    const formData = reactive({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
      verificationCode: '',
      referralCode: '',
      agreements: []
    })

    const validationRules = {
      email: [
        { required: true, message: '이메일을 입력하세요', trigger: 'blur' },
        { type: 'email', message: '올바른 이메일 형식이 아닙니다', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '비밀번호를 입력하세요', trigger: 'blur' },
        { min: 8, message: '비밀번호는 8자 이상이어야 합니다', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '비밀번호 확인을 입력하세요', trigger: 'blur' },
        {
          validator: (_, value) => {
            if (value && value !== formData.password) {
              return Promise.reject('비밀번호가 일치하지 않습니다')
            }
            return Promise.resolve()
          },
          trigger: 'blur'
        }
      ],
      name: [
        { required: true, message: '이름을 입력하세요', trigger: 'blur' }
      ],
      phone: [
        { required: true, message: '휴대폰 번호를 입력하세요', trigger: 'blur' },
        { pattern: /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/, message: '올바른 휴대폰 번호를 입력하세요', trigger: 'blur' }
      ],
      agreements: [
        {
          validator: (_, value) => {
            if (!value.includes('terms') || !value.includes('privacy')) {
              return Promise.reject('필수 약관에 동의해야 합니다')
            }
            return Promise.resolve()
          },
          trigger: 'change'
        }
      ]
    }

    const isAllAgreed = computed(() => {
      return formData.agreements.length === 3 &&
        formData.agreements.includes('terms') &&
        formData.agreements.includes('privacy') &&
        formData.agreements.includes('marketing')
    })

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const startTimer = () => {
      timer = setInterval(() => {
        remainingTime.value--
        if (remainingTime.value <= 0) {
          clearInterval(timer)
          showVerificationInput.value = false
          message.warning('인증시간이 만료되었습니다. 다시 시도해주세요.')
        }
      }, 1000)
    }

    const sendVerificationCode = async () => {
      if (!formData.phone) {
        message.warning('휴대폰 번호를 입력해주세요')
        return
      }

      if (!/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/.test(formData.phone)) {
        message.warning('올바른 휴대폰 번호를 입력해주세요')
        return
      }

      sendingCode.value = true

      try {
        // API 호출 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000))

        showVerificationInput.value = true
        remainingTime.value = 180
        startTimer()
        message.success('인증번호가 전송되었습니다')
      } catch (error) {
        message.error('인증번호 전송에 실패했습니다')
      } finally {
        sendingCode.value = false
      }
    }

    const handleAgreementChange = (type, checked) => {
      if (checked) {
        if (!formData.agreements.includes(type)) {
          formData.agreements.push(type)
        }
      } else {
        const index = formData.agreements.indexOf(type)
        if (index > -1) {
          formData.agreements.splice(index, 1)
        }
      }
    }

    const handleAllAgreement = (e) => {
      if (e.target.checked) {
        formData.agreements = ['terms', 'privacy', 'marketing']
      } else {
        formData.agreements = []
      }
    }

    const onSubmit = async (values) => {
      submitting.value = true

      try {
        // API 호출 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 2000))

        message.success('회원가입이 완료되었습니다!')
        console.log('회원가입 데이터:', values)

        // 성공 후 폼 초기화 또는 페이지 이동
        // router.push('/login')
      } catch (error) {
        message.error('회원가입에 실패했습니다. 다시 시도해주세요.')
      } finally {
        submitting.value = false
      }
    }

    onUnmounted(() => {
      if (timer) {
        clearInterval(timer)
      }
    })

    return {
      signupFormRef,
      formData,
      validationRules,
      sendingCode,
      submitting,
      showVerificationInput,
      remainingTime,
      isAllAgreed,
      formatTime,
      sendVerificationCode,
      handleAgreementChange,
      handleAllAgreement,
      onSubmit
    }
  }
}
</script>

<style scoped>
.signup-container {
  min-height: 100vh;
 /* background-color: #f0fdf4; */
  padding: 40px 16px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.signup-card {
  width: 100%;
  max-width: 640px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.signup-title {
  text-align: center;
  margin-bottom: 24px;
}

.required-text {
  text-align: right;
  color: #f5222d;
  font-size: 13px;
}

.phone-space {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.primary-btn {
  background-color: #00C851;
  border-color: #00C851;
  white-space: nowrap;
}

.countdown-text {
  color: #f5222d;
  font-size: 13px;
  align-self: center;
}

.info-card {
  background-color: #fafafa;
  margin-bottom: 24px;
  font-size: 12px;
}

.info-card ul {
  padding-left: 16px;
  margin: 8px 0 0;
}

.agreement-section {
  margin-bottom: 24px;
  font-size: 13px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  background-color: #00C851;
  border-color: #00C851;
}

@media (max-width: 480px) {
  .phone-space {
    flex-direction: column;
  }
  .primary-btn {
    width: 100%;
  }
  .submit-btn {
    height: 44px;
  }
}
</style>
