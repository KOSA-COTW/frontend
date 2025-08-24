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
              <a class="forgot-link" href="#">아이디/비밀번호 찾기</a>
            </a-form-item>
            <a-button block type="primary" html-type="submit" class="login-btn" :loading="loading">
              로그인
            </a-button>
          </a-form>
          <!-- 로그인 폼 아래 -->
          <div class="social-login">
            <a :href="`${API_BASE}/oauth2/authorization/google`" class="oauth-link" aria-label="Sign in with Google">
              <img src="/button/google_login.png" alt="Sign in with Google" />
            </a>
            <a :href="`${API_BASE}/oauth2/authorization/kakao`" class="oauth-link kakao" aria-label="카카오로 로그인">
              <img src="/button/kakao_login.png" alt="카카오로 로그인" />
            </a>
            <a :href="`${API_BASE}/oauth2/authorization/naver`" class="oauth-link naver" aria-label="네이버로 로그인">
              <img src="/button/naver_login.png" alt="네이버로 로그인" />
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
    const response = await axios.post('/api/auth/login', {
      email: form.email,
      password: form.password
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
      message.error("로그인에 실패하셨습니다. 다시 시도해주세요.")

      console.error('로그인 에러:', error);

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

function promptRecover(email) {
  Modal.confirm({
    title: '계정 복구',
    content: '해당 계정은 현재 탈퇴 상태입니다. 복구를 진행하시겠습니까?',
    okText: '복구 메일 보내기',
    cancelText: '취소',
    // onOk가 Promise를 반환하면 confirm 버튼에 로딩이 자동 표시됨
    onOk: async () => {
      try {
        await api.post('/api/recover', { email }) // ← 서버의 “복구 링크 발송” 엔드포인트
        message.success('복구 메일을 전송했어요. 메일함을 확인해 주세요.')
        // (선택) 바로 복구 페이지로 보내고 싶으면:
        // router.push({ name: 'recover', query: { email } })
      } catch (err) {
        message.error(err?.response?.data?.message ?? '복구 요청에 실패했어요.')
        throw err // 실패 시 confirm 닫히지 않게 하려면 throw 유지
      }
    }
  })
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


.social-login {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  justify-content: center; /* 가운데 정렬 */
}

/* 클릭 영역까지 300x45로 고정 */
.oauth-link {
  display: inline-block;
  width: 300px;
  height: 45px;
}

/* 이미지를 박스에 정확히 맞추기 */
.oauth-link img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 원본 비율 유지, 필요 시 cover로 변경 */
  display: block;      /* 밑줄/여백 제거 */
}


.social-btn {
  height: 44px;
  padding: 0;
  border-radius: 8px;
  font-weight: 600;
}

.btn-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
}

.btn-icon {
  width: 18px;
  height: 18px;
  display: inline-block;
}

/* Google (화이트 버튼) */
.google-btn {
  background: #ffffff;
  border: 1px solid #dadce0;
  color: #3c4043;
}
.google-btn:hover { border-color: #c6c6c6; }
.google-btn:active { border-color: #a8a8a8; }
.google-btn[disabled],
.google-btn.ant-btn-loading { opacity: .8; }

/* Kakao */
.kakao-btn {
  background: #FEE500;
  border-color: #FEE500;
  color: #191600;
}
.kakao-btn:hover { filter: brightness(0.98); }
.kakao-btn:active { filter: brightness(0.96); }
.kakao-btn[disabled],
.kakao-btn.ant-btn-loading { opacity: .9; }

/* Naver */
.naver-btn {
  background: #03C75A;
  border-color: #03C75A;
  color: #ffffff;
}
.naver-btn:hover { filter: brightness(1.03); }
.naver-btn:active { filter: brightness(0.98); }
.naver-btn[disabled],
.naver-btn.ant-btn-loading { opacity: .9; }


/* --------------------
   🔽 반응형 스타일
-------------------- */

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
</style>
