<!-- src/views/VerifyEmailView.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md rounded-2xl shadow-lg p-6">
      <h1 class="text-2xl font-semibold mb-2">이메일 인증</h1>
      <p class="text-gray-600 mb-6">아래 버튼을 눌러 이메일 인증을 완료하세요.</p>

      <!-- 토큰 없음 -->
      <div v-if="!token" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
        인증 토큰이 없습니다. 올바른 링크로 다시 접속해 주세요.
      </div>

      <!-- 상태 메시지 -->
      <div v-if="status === 'success'" class="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">
        이메일 인증이 완료되었습니다. 잠시 후 메인으로 이동합니다…
      </div>
      <div v-else-if="status === 'error'" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
        {{ errorMessage }}
      </div>

      <!-- 인증 버튼 -->
      <button
        :disabled="!token || status === 'loading' || status === 'success'"
        @click="confirm"
        class="w-full rounded-xl px-4 py-3 font-medium border
               disabled:opacity-60 disabled:cursor-not-allowed
               transition hover:shadow"
        :class="status === 'loading' ? 'bg-gray-200' : 'bg-black text-white'"
      >
        <span v-if="status === 'loading'">인증 중…</span>
        <span v-else>이메일 인증하기</span>
      </button>

      <!-- 재전송 섹션 -->
      <div class="mt-8 border-t pt-6">
        <h2 class="text-lg font-semibold mb-2">메일이 오지 않았나요?</h2>
        <p class="text-gray-600 mb-3">가입한 이메일 주소로 인증 메일을 다시 보낼 수 있어요.</p>

        <input
          v-model.trim="resendEmail"
          type="email"
          placeholder="가입한 이메일 주소"
          class="w-full border rounded-xl px-4 py-3 mb-2"
          :disabled="resendStatus === 'loading'"
        />

        <div v-if="resendStatus === 'sent'" class="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-3">
          인증 메일을 다시 보냈습니다. 메일함(스팸함 포함)을 확인해 주세요.
        </div>
        <div v-else-if="resendStatus === 'error'" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-3">
          {{ resendError }}
        </div>

        <button
          :disabled="resendDisabled"
          @click="resend"
          class="w-full rounded-xl px-4 py-3 font-medium border
                 disabled:opacity-60 disabled:cursor-not-allowed
                 transition hover:shadow"
          :class="resendStatus === 'loading' ? 'bg-gray-200' : 'bg-white'"
        >
          <span v-if="resendStatus === 'loading'">재전송 중…</span>
          <span v-else>
            인증 메일 재전송
            <template v-if="cooldown > 0"> ({{ cooldown }}s)</template>
          </span>
        </button>
      </div>

      <!-- 보조 링크 -->
      <div class="text-sm text-gray-500 mt-4 flex items-center justify-between">
        <router-link to="/" class="hover:underline">메인으로 가기</router-link>
        <button class="hover:underline" @click="copyLink">현재 링크 복사</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const token = ref(null);
const status = ref('idle'); // 'idle' | 'loading' | 'success' | 'error'
const errorMessage = ref('오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');

// 재전송 상태
const resendEmail = ref('');
const resendStatus = ref('idle'); // 'idle' | 'loading' | 'sent' | 'error'
const resendError = ref('재전송에 실패했습니다.');
const cooldown = ref(0);
let cooldownTimer = null;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

onMounted(() => {
  const t = route.query.token;
  token.value = typeof t === 'string' ? t : Array.isArray(t) ? t[0] : null;

  // 쿼리에 email이 있으면 프리필
  const e = route.query.email;
  const maybeEmail = typeof e === 'string' ? e : Array.isArray(e) ? e[0] : '';
  if (maybeEmail && emailPattern.test(maybeEmail)) {
    resendEmail.value = maybeEmail;
  }
});

onBeforeUnmount(() => {
  if (cooldownTimer) window.clearInterval(cooldownTimer);
});

// 인증 요청
async function confirm() {
  if (!token.value || status.value === 'loading' || status.value === 'success') return;

  status.value = 'loading';
  try {
    const res = await fetch(`${API_BASE}/auth/email/verify/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.value }),
    });

    if (!res.ok) {
      let serverMsg = '유효하지 않거나 만료된 링크입니다.';
      try {
        const data = await res.json();
        if (data && data.error) serverMsg = data.error;
      } catch {}
      throw new Error(serverMsg);
    }

    status.value = 'success';
    setTimeout(() => router.push({ path: '/' }), 1500);
  } catch (err) {
    status.value = 'error';
    errorMessage.value = err?.message || '인증에 실패했습니다.';
  }
}

// 재전송 요청
async function resend() {
  if (resendStatus.value === 'loading' || cooldown.value > 0) return;

  const email = resendEmail.value.trim().toLowerCase();
  if (!emailPattern.test(email)) {
    resendStatus.value = 'error';
    resendError.value = '올바른 이메일 주소를 입력해 주세요.';
    return;
  }

  resendStatus.value = 'loading';
  try {
    const res = await fetch(`${API_BASE}/auth/email/verify/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      let serverMsg = '재전송에 실패했습니다.';
      try {
        const data = await res.json();
        if (data && data.error) {
          if (data.error === 'TOO_MANY_REQUESTS') serverMsg = '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
          else if (data.error === 'VALIDATION_ERROR') serverMsg = '이메일 형식을 확인해 주세요.';
          else serverMsg = data.error;
        }
      } catch {}
      throw new Error(serverMsg);
    }

    resendStatus.value = 'sent';
    startCooldown(60); // 60초 쿨다운
  } catch (err) {
    resendStatus.value = 'error';
    resendError.value = err?.message || '재전송에 실패했습니다.';
  }
}

function startCooldown(seconds) {
  cooldown.value = seconds;
  if (cooldownTimer) window.clearInterval(cooldownTimer);
  cooldownTimer = window.setInterval(() => {
    cooldown.value -= 1;
    if (cooldown.value <= 0 && cooldownTimer) {
      window.clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }, 1000);
}

const resendDisabled = computed(() =>
  resendStatus.value === 'loading' || cooldown.value > 0 || !resendEmail.value
);

// 현재 링크 복사
async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    alert('링크가 복사되었습니다.');
  } catch {
    alert('복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요.');
  }
}
</script>

<style scoped>
.min-h-screen { min-height: 100vh; }
.rounded-2xl { border-radius: 1rem; }
.rounded-xl { border-radius: 0.75rem; }
.shadow-lg { box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
.p-6 { padding: 1.5rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-3 { padding-top: .75rem; padding-bottom: .75rem; }
.mb-2 { margin-bottom: .5rem; }
.mb-3 { margin-bottom: .75rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mt-8 { margin-top: 2rem; }
.pt-6 { padding-top: 1.5rem; }
.border { border: 1px solid #e5e7eb; }
.border-t { border-top: 1px solid #e5e7eb; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.text-gray-600 { color: #4b5563; }
.text-gray-500 { color: #6b7280; }
.text-green-700 { color: #047857; }
.bg-green-50 { background: #ecfdf5; }
.bg-red-50 { background: #fef2f2; }
.text-red-700 { color: #b91c1c; }
.bg-black { background: #111827; }
.text-white { color: #fff; }
.transition { transition: all .15s ease; }
.hover\:underline:hover { text-decoration: underline; }
.hover\:shadow:hover { box-shadow: 0 10px 15px rgba(0,0,0,0.12); }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.w-full { width: 100%; }
.max-w-md { max-width: 28rem; }
.disabled\:opacity-60:disabled { opacity: .6; }
.disabled\:cursor-not-allowed:disabled { cursor: not-allowed; }
</style>
