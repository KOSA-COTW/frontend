<!-- views/auth/OAuth2SuccessView.vue -->
<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

onMounted(() => {
  // #access=... 꺼내기
  const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : ''
  const params = new URLSearchParams(hash)
  const access = params.get('access')

  if (access) {
    auth.login(access)           // Pinia + 저장소 반영
    // URL에 토큰 안 남도록 정리
    window.history.replaceState({}, document.title, '/')
    router.replace('/')          // 원하는 랜딩으로 이동
  } else {
    router.replace('/login?error=no_token')
  }
})
</script>

<template><div>로그인 처리중...</div></template>
