<template>
  <a-row justify="center" align="middle" class="login-wrapper">
    <a-col :xs="22" :sm="20" :md="18" :lg="16" :xl="14">
      <a-card
        class="login-card"
        :bodyStyle="{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', padding: '0' }"
      >
        <!-- 로그인 영역 -->
        <div class="login-form-section">
          <h2 class="login-title">로그인</h2>
          <a-form :model="form" layout="vertical" @submit.prevent="handleSubmit">
            <a-form-item label="이메일">
              <a-input v-model:value="form.email" placeholder="이메일 입력" />
            </a-form-item>
            <a-form-item label="비밀번호">
              <a-input-password v-model:value="form.password" placeholder="비밀번호 입력" />
            </a-form-item>
            <a-form-item>
              <a-checkbox v-model:checked="form.remember">이메일 기억하기</a-checkbox>
<!--              이메일 인증 추가 시 이메일을 통해 찾는 로직 구현 예정. 후순위-->
              <a class="forgot-link" href="" @click.prevent="goToFindAccount">아이디/비밀번호 찾기</a>
            </a-form-item>
            <a-button block type="primary" html-type="submit" class="login-btn" :loading="loading">
              로그인
            </a-button>
          </a-form>
          <!-- 로그인 폼 아래 -->
<!--          <div class="social-login">-->
<!--            <a :href="`${API_BASE}/oauth2/authorization/google`" class="oauth-link" aria-label="Sign in with Google">-->
<!--              <img src="/button/google_login.png" alt="Sign in with Google" />-->
<!--            </a>-->
<!--            <a :href="`${API_BASE}/oauth2/authorization/kakao`" class="oauth-link kakao" aria-label="카카오로 로그인">-->
<!--              <img src="/button/kakao_login.png" alt="카카오로 로그인" />-->
<!--            </a>-->
<!--            <a :href="`${API_BASE}/oauth2/authorization/naver`" class="oauth-link naver" aria-label="네이버로 로그인">-->
<!--              <img src="/button/naver_login.png" alt="네이버로 로그인" />-->
<!--            </a>-->
<!--          </div>-->
          <!-- 소셜 로그인 섹션 -->
          <div class="social-login">
            <a :href="`${API_BASE}/oauth2/authorization/google`" class="oauth-btn google" aria-label="Sign in with Google">
              <span class="btn-icon">
                <img src="/button/google_logo.png" alt="Google" />
              </span>
              <span class="btn-text">Google로 로그인하기</span>
            </a>

            <a :href="`${API_BASE}/oauth2/authorization/kakao`" class="oauth-btn kakao" aria-label="Sign in with Kakao">
              <span class="btn-icon">
                <img src="/button/kakao_logo.png" alt="Kakao" />
              </span>
              <span class="btn-text">Kakao로 로그인하기</span>
            </a>

            <a :href="`${API_BASE}/oauth2/authorization/naver`" class="oauth-btn naver" aria-label="Sign in with Naver">
              <span class="btn-icon">
                <img src="/button/naver_logo.png" alt="Naver" />
              </span>
              <span class="btn-text">Naver로 로그인하기</span>
            </a>
          </div>


        </div>


        <!-- 회원가입 유도 영역 -->
        <div class="signup-guide-section">
          <p class="signup-guide-title">아직 회원이 아니신가요?</p>
          <p class="signup-guide-desc">
            <span class="highlight">마음이 그대로 전달</span>되는 💓 <br />
            가장 단순한 기부를 경험하세요!
          </p>
          <div class="signup-btn-wrapper">
            <a-button type="default" class="signup-btn" @click="goToSignUp">회원가입</a-button>
          </div>
        </div>
      </a-card>
    </a-col>
  </a-row>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import axios from 'axios'
import api from '@/utils/axios'
import { message, Modal } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
  remember: false,
});

// 초기 마운트 시 저장된 이메일 불러오기
onMounted(() => {
  const savedEmail = localStorage.getItem('rememberedEmail');
  if (savedEmail) {
    form.email = savedEmail;
    form.remember = true;
  }
});

// 체크 여부에 따라 이메일 저장 또는 제거
watch(
  () => form.remember,
  (newVal) => {
    if (newVal) {
      localStorage.setItem('rememberedEmail', form.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  }
);

// 이메일 입력값 변경 시 실시간 저장
watch(
  () => form.email,
  (newEmail) => {
    if (form.remember) {
      localStorage.setItem('rememberedEmail', newEmail);
    }
  }
);

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function oauthLogin(provider) {
  // Spring Security 표준 엔드포인트:
  // /oauth2/authorization/{registrationId}
  window.location.href = `${API_BASE}/oauth2/authorization/${provider}`;
}

const handleSubmit = async () => {
  if (!form.email || !form.password) {
    message.error('이메일과 비밀번호를 모두 입력해주세요.');
    return;
  }

  loading.value = true;

  try {
    // 상대 경로 사용 (로컬: 프록시, 배포: 같은 도메인)
    const response = await axios.post('/api/auth/login', {
      email: form.email,
      password: form.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      transformRequest: [(data) => {
        return JSON.stringify(data);
      }]
    });

    // JWT 토큰 저장 (응답 데이터에서 또는 헤더에서)
    const token = response.headers['authorization']

    // pinia에 반영
    auth.login(token)
      if (token) {
        message.success('로그인에 성공하셨습니다.');

        // 홈페이지로 리다이렉트
        await router.push('/');
      } else {
        throw new Error('토큰을 받지 못했습니다.');
      }


  }catch (error) {
    const code = error?.response?.data?.error
    switch (code) {
      case 'ACCOUNT_DELETED': // 복구 플로우 진입
        promptRecover(form.email)
        break
      case 'ACCOUNT_SUSPENDED':
        message.error('관리자에 의해 정지된 계정입니다.')
        break
      case 'ACCOUNT_PENDING':
        message.info('이메일 인증이 필요합니다. 메일함을 확인하세요.')
        break
      default:
        message.error('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
    } finally {
      loading.value = false;
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

function goToFindAccount() {
  router.push('/find-account')
}

function goToSignUp() {
  router.push('/signup');
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
}

.login-card {
  border-radius: 16px;
  border: 1.2px solid #d9d9d9;  /* 굵기 & 색상 */
  padding: 0;
  overflow: hidden;
}

/* 로그인 폼 영역 */
.login-form-section {
  flex: 1;
  padding: 40px;
  background-color: white;
}

.login-title {
  margin-bottom: 30px;
}

.forgot-link {
  float: right;
  text-decoration: none;
  font-size: 0.9rem;
}

.login-btn {
  background-color: #1a1a1a;
  border-color: #1a1a1a;
  height: 45px;
  font-weight: bold;
}

/* 회원가입 유도 영역 */
.signup-guide-section {
  flex: 1;
  background-color: #f5faf5;
  padding: 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.signup-guide-title {
  font-size: 18px;
  font-weight: bold;
}

.signup-guide-desc {
  font-size: 16px;
  color: #333;
}

.signup-guide-desc .highlight {
  color: #f9a825;
  font-weight: bold;
}

.signup-btn-wrapper {
  margin-top: 20px;
}

.signup-btn {
  border-color:  #00c851;
  color:  #00c851;
}


.oauth-btn .btn-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;  /* 이미지 비율 유지하며 버튼 영역에 맞게 크기 조정 */
}

.social-login {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  justify-content: center;
}

/* 소셜 로그인 버튼 스타일 */
.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 300px;
  height: 45px;
  padding: 0;
  border-radius: 8px;
  font-weight: bold;
  text-decoration: none;
}

.oauth-btn .btn-icon {
  width: 40px;  /* 로고 사이즈 40px */
  height: 40px; /* 로고 사이즈 40px */
  overflow: hidden;
  margin-right: 10px;  /* .btn-text 기준으로 10px 간격 */
}

.oauth-btn .btn-text {
  flex: 1;
  font-size: 14px;
  text-align: center;
}

/* Google */
.oauth-btn.google {
  background: #ffffff;
  border: 1px solid #dadce0;
}

.oauth-btn.google:hover {
  border-color: #c6c6c6;
}

.oauth-btn.google:active {
  border-color: #a8a8a8;
}

/* Kakao */
.oauth-btn.kakao {
  background: #FEE500;
  border-color: #FEE500;
  color: #191600;
}

.oauth-btn.kakao:hover {
  filter: brightness(0.98);
}

.oauth-btn.kakao:active {
  filter: brightness(0.96);
}

/* Naver */
.oauth-btn.naver {
  background: #03C75A;
  border-color: #03C75A;
  color: #ffffff;
}

.oauth-btn.naver:hover {
  filter: brightness(1.03);
}

.oauth-btn.naver:active {
  filter: brightness(0.98);
}

/* 아이디 기억하기 체크박스 */
:deep(.ant-checkbox-checked .ant-checkbox-inner) {
  background-color: #00c851 !important; /* 테마 색상 */
  border-color: #00c851 !important;    /* 테마 색상 */
}

:deep(.ant-checkbox-input:focus + .ant-checkbox-inner) {
  border-color: #00c851 !important;    /* 테마 색상 */
}

/* --------------------
   🔽 반응형 스타일
-------------------- */

/* 작은 모바일 화면 대응 */
@media (max-width: 576px) {
  .oauth-btn {
    width: 100%;
  }

  .btn-text {
    font-size: 12px;
  }
}

/* 작은 모바일 화면 대응 */
@media (max-width: 576px) {
  .login-form-section,
  .signup-guide-section {
    padding: 24px;
  }

  .signup-guide-desc {
    font-size: 14px;
  }

  .signup-guide-title {
    font-size: 16px;
  }

  .login-title {
    font-size: 1.25rem;
  }

  .login-btn {
    height: 42px;
    font-size: 14px;
  }

  .signup-btn {
    font-size: 14px;
    padding: 0 12px;
  }
}

/* 태블릿 대응 */
@media (max-width: 768px) {
  .login-card {
    flex-direction: column !important;
  }

  .forgot-link {
    float: none;
    display: block;
    margin-top: 8px;
    text-align: right;
  }
}

/* 데스크탑 이상일 경우 */
@media (min-width: 1200px) {
  .login-form-section,
  .signup-guide-section {
    padding: 50px;
  }

  .login-title {
    font-size: 1.75rem;
  }
}
/* 반응형 스타일 */
@media (max-width: 576px) {
  .oauth-btn {
    width: 100%;
  }

  .btn-text {
    font-size: 12px;
  }
}

</style>
