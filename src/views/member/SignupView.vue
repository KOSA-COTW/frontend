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

        <a-form-item label="이름" name="name">
          <a-input v-model:value="formData.name" placeholder="이름을 입력하세요" size="large" />
        </a-form-item>

        <a-form-item label="별명" name="nickname">
          <a-input v-model:value="formData.nickname" placeholder="별명을 입력하세요" size="large" />
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


<script setup>
import { reactive, ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axios'

const router = useRouter()
const signupFormRef = ref(null)
const submitting = ref(false)

const formData = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  nickname: '',
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

const onSubmit = async () => {
  submitting.value = true

  try {
    const payload = {
      name: formData.name,
      nickname: formData.nickname,
      email: formData.email,
      password: formData.password
    }

    const response = await axios.post('/api/auth/signup', payload)

    message.success('회원가입이 완료되었습니다!')
    console.log('서버 응답:', response)

    router.push('/login')

  } catch (error) {
    message.error('회원가입에 실패했습니다. 다시 시도해주세요.')
    console.error('에러:', error)
  } finally {
    submitting.value = false
  }
}

</script>

<style scoped>
.signup-container {
  min-height: 100vh;
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
</style>
