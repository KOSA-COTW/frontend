<!--<template>-->
<!--  <a-row justify="center" align="middle" style="min-height: 100vh;">-->
<!--    <a-col :xs="22" :sm="20" :md="18" :lg="16" :xl="14">-->
<!--      <a-card-->
<!--        style="border-radius: 16px; padding: 0; overflow: hidden;"-->
<!--        :bodyStyle="{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', padding: '0' }"-->
<!--      >-->
<!--        &lt;!&ndash; 로그인 영역 &ndash;&gt;-->
<!--        <div style="flex: 1; padding: 40px; background: white;">-->
<!--          <h2 style="margin-bottom: 30px;">로그인</h2>-->
<!--          <a-form :model="form" layout="vertical" @submit.prevent="handleSubmit">-->
<!--            <a-form-item label="이메일">-->
<!--              <a-input v-model:value="form.email" placeholder="이메일 입력" />-->
<!--            </a-form-item>-->
<!--            <a-form-item label="비밀번호">-->
<!--              <a-input-password v-model:value="form.password" placeholder="비밀번호 입력" />-->
<!--            </a-form-item>-->
<!--            <a-form-item>-->
<!--              <a-checkbox v-model:checked="form.remember">이메일 기억하기</a-checkbox>-->
<!--              <a style="float: right;" href="#">아이디/비밀번호 찾기</a>-->
<!--            </a-form-item>-->
<!--            <a-button-->
<!--              block-->
<!--              type="primary"-->
<!--              html-type="submit"-->
<!--              style="background-color: #1a1a1a; border-color: #1a1a1a; height: 45px; font-weight: bold;"-->
<!--            >-->
<!--              로그인-->
<!--            </a-button>-->
<!--&lt;!&ndash;            <a-button&ndash;&gt;-->
<!--&lt;!&ndash;              block&ndash;&gt;-->
<!--&lt;!&ndash;              style="background-color: #ffeb00; color: #000; margin-top: 10px; height: 45px; font-weight: bold;"&ndash;&gt;-->
<!--&lt;!&ndash;            >&ndash;&gt;-->
<!--&lt;!&ndash;              <template #icon><img src="https://developers.kakao.com/tool/resource/static/img/button/kakaologin/ko/kakao_login_medium_narrow.png" style="height: 16px;" /></template>&ndash;&gt;-->
<!--&lt;!&ndash;              <template #icon><img src="https://developers.kakao.com/tool/resource/static/img/button/kakaologin/ko/kakao_login_medium_narrow.png" style="height: 16px;" /></template>&ndash;&gt;-->
<!--&lt;!&ndash;              카카오톡 로그인&ndash;&gt;-->
<!--&lt;!&ndash;            </a-button>&ndash;&gt;-->
<!--          </a-form>-->
<!--        </div>-->

<!--        &lt;!&ndash; 회원가입 유도 영역 &ndash;&gt;-->
<!--        <div-->
<!--          style="flex: 1; background-color: #f5faf5; padding: 40px; text-align: center; display: flex; flex-direction: column; justify-content: center;"-->
<!--        >-->
<!--          <p style="font-size: 18px; font-weight: bold;">아직 회원이 아니신가요?</p>-->
<!--          <p style="font-size: 16px; color: #333;">-->
<!--            <span style="color: #f9a825; font-weight: bold;">마음이 그대로 전달</span>되는 💓 <br />-->
<!--            가장 단순한 기부를 경험하세요!-->
<!--          </p>-->
<!--          <div style="margin-top: 20px;">-->
<!--            <a-button type="default" style="border-color: #fbc02d; color: #fbc02d;" @click="goToSignUp">-->
<!--              회원가입-->
<!--            </a-button>-->
<!--          </div>-->
<!--        </div>-->
<!--      </a-card>-->
<!--    </a-col>-->
<!--  </a-row>-->
<!--</template>-->
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
            <a-button block type="primary" html-type="submit" class="login-btn">로그인</a-button>
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
import { reactive, computed, onMounted, watch } from 'vue';
import axios from 'axios'
import { message } from 'ant-design-vue'
import {useRouter} from 'vue-router'

const router = useRouter()

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

const handleSubmit = async () => {
  console.log('로그인 요청:', form);

  try {
    const response = await axios.post('/api/login', form, {
      headers: {
        "Content-type": "application/json"
      }
    })

    message.success("로그인에 성공하셨습니다.")

    const token = response.headers["authorization"]
    localStorage.setItem("accessToken", token)
    // 로그인 성공 시 home으로 이동
    router.push('/')
  }catch (error){
    message.error("로그인에 실패하셨습니다. 다시 시도해주세요.")
    console.error("에러:", error)
  }

}

function goToSignUp() {
  window.location.href = '/signup';
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
