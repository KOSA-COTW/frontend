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
            </a-form-item>
            <a-button block type="primary" html-type="submit" class="login-btn" :loading="loading">
              로그인
            </a-button>
          </a-form>
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
import { reactive, computed, onMounted, watch, ref } from 'vue';
import api from '@/utils/axios'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
  remember: false,
});

// 화면 크기 감지를 위한 computed
const isMobile = computed(() => {
  // 실제 구현에서는 window.innerWidth 등을 활용
  return window.innerWidth <= 768;
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

const handleSubmit = async () => {
  if (!form.email || !form.password) {
    message.error('이메일과 비밀번호를 모두 입력해주세요.');
    return;
  }

  loading.value = true;

  try {
    const response = await api.post('/api/auth/login', {
      email: form.email,
      password: form.password
    });

    // JWT 토큰 저장 (응답 데이터에서 또는 헤더에서)
    const accessToken = response.data.accessToken || response.headers.authorization;

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      message.success('로그인에 성공하셨습니다.');

      // 홈페이지로 리다이렉트
      await router.push('/');
    } else {
      throw new Error('토큰을 받지 못했습니다.');
    }

  } catch (error) {
    console.error('로그인 에러:', error);

    if (error.response?.status === 401) {
      message.error('이메일 또는 비밀번호가 올바르지 않습니다.');
    } else if (error.response?.status === 400) {
      message.error('입력 정보를 확인해주세요.');
    } else {
      message.error('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  } finally {
    loading.value = false;
  }
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
  border-color: #fbc02d;
  color: #fbc02d;
}

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
