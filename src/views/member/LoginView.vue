<template>
  <a-row justify="center" align="middle" style="min-height: 100vh;">
    <a-col :xs="22" :sm="20" :md="18" :lg="16" :xl="14">
      <a-card
        style="border-radius: 16px; padding: 0; overflow: hidden;"
        :bodyStyle="{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', padding: '0' }"
      >
        <!-- 로그인 영역 -->
        <div style="flex: 1; padding: 40px; background: white;">
          <h2 style="margin-bottom: 30px;">로그인</h2>
          <a-form :model="form" layout="vertical" @submit.prevent="handleSubmit">
            <a-form-item label="이메일">
              <a-input v-model:value="form.email" placeholder="이메일 입력" />
            </a-form-item>
            <a-form-item label="비밀번호">
              <a-input-password v-model:value="form.password" placeholder="비밀번호 입력" />
            </a-form-item>
            <a-form-item>
              <a-checkbox v-model:checked="form.remember">이메일 기억하기</a-checkbox>
              <a style="float: right;" href="#">아이디/비밀번호 찾기</a>
            </a-form-item>
            <a-button
              block
              type="primary"
              html-type="submit"
              style="background-color: #1a1a1a; border-color: #1a1a1a; height: 45px; font-weight: bold;"
            >
              로그인
            </a-button>
<!--            <a-button-->
<!--              block-->
<!--              style="background-color: #ffeb00; color: #000; margin-top: 10px; height: 45px; font-weight: bold;"-->
<!--            >-->
<!--              <template #icon><img src="https://developers.kakao.com/tool/resource/static/img/button/kakaologin/ko/kakao_login_medium_narrow.png" style="height: 16px;" /></template>-->
<!--              <template #icon><img src="https://developers.kakao.com/tool/resource/static/img/button/kakaologin/ko/kakao_login_medium_narrow.png" style="height: 16px;" /></template>-->
<!--              카카오톡 로그인-->
<!--            </a-button>-->
          </a-form>
        </div>

        <!-- 회원가입 유도 영역 -->
        <div
          style="flex: 1; background-color: #f5faf5; padding: 40px; text-align: center; display: flex; flex-direction: column; justify-content: center;"
        >
          <p style="font-size: 18px; font-weight: bold;">아직 회원이 아니신가요?</p>
          <p style="font-size: 16px; color: #333;">
            <span style="color: #f9a825; font-weight: bold;">마음이 그대로 전달</span>되는 💓 <br />
            가장 단순한 기부를 경험하세요!
          </p>
          <div style="margin-top: 20px;">
            <a-button type="default" style="border-color: #fbc02d; color: #fbc02d;" @click="goToSignUp">
              회원가입
            </a-button>
          </div>
        </div>
      </a-card>
    </a-col>
  </a-row>
</template>

<script setup>
import { reactive, computed, onMounted, watch } from 'vue';

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

function handleSubmit() {
  console.log('로그인 요청:', form);
}

function goToSignUp() {
  window.location.href = '/signup';
}
</script>

<style scoped>
a {
  text-decoration: none;
}
</style>
