<!-- views/ErrorPage.vue -->
<template>
  <div class="error-page">
    <div class="error-container">
      <div class="error-icon">
        <i v-if="errorType === '404'" class="icon-404">🔍</i>
        <i v-else-if="errorType === '403'" class="icon-403">🔒</i>
        <i v-else-if="errorType === '500'" class="icon-500">⚠️</i>
        <i v-else class="icon-default">❌</i>
      </div>

      <div class="error-code">{{ errorCode }}</div>
      <h1 class="error-title">{{ errorTitle }}</h1>
      <p class="error-message">{{ errorMessage }}</p>

      <div class="error-actions">
        <button @click="goHome" class="btn-primary">홈으로 돌아가기</button>
        <button @click="goBack" class="btn-secondary">이전 페이지로</button>
        <button v-if="showRetry" @click="retry" class="btn-tertiary">다시 시도</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  errorType: { type: String, default: '404' },
  customMessage: { type: String, default: null },
})

const router = useRouter()
const route = useRoute()

const errorCode = computed(() => {
  const codes = { 404: '404', 403: '403', 500: '500', network: 'NET', timeout: 'TIMEOUT' }
  return codes[props.errorType] ?? '오류'
})

const errorTitle = computed(() => {
  const titles = {
    404: '페이지를 찾을 수 없습니다',
    403: '접근이 금지되었습니다',
    500: '서버 오류가 발생했습니다',
    network: '네트워크 연결 오류',
    timeout: '요청 시간이 초과되었습니다',
  }
  return titles[props.errorType] ?? '알 수 없는 오류'
})

const errorMessage = computed(() => {
  if (props.customMessage) return props.customMessage
  const messages = {
    404: '요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.',
    403: '이 페이지에 접근할 권한이 없습니다.',
    500: '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    network: '인터넷 연결을 확인하고 다시 시도해 주세요.',
    timeout: '요청 처리 시간이 너무 오래 걸렸습니다.',
  }
  return messages[props.errorType] ?? '예상치 못한 오류가 발생했습니다.'
})

const showRetry = computed(() => ['500', 'network', 'timeout'].includes(props.errorType))

function goHome() {
  router.push('/')
}
function goBack() {
  if (window.history.length > 1) router.go(-1)
  else router.push('/')
}
function retry() {
  // window.location.reload()는 세션까지 초기화 될 우려가 있어 소프트 리로드 사용.
  router.replace({
    path: route.path,
    params: route.params,
    query: { ...route.query, _r: Date.now() } // 키만 바꿔서 재마운트 유도
  })
}

function logError() {
  const errorInfo = {
    type: props.errorType,
    path: route.fullPath,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  }
  console.log('Error logged:', errorInfo)
  // 실제 전송 예시:
  // await axios.post('/api/errors', errorInfo)
}

onMounted(() => {
  logError()
})
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.error-container {
  text-align: center;
  color: white;
  max-width: 600px;
  padding: 2rem;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-code {
  font-size: 6rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.error-title {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  font-weight: 400;
}

.error-message {
  font-size: 1.1rem;
  margin-bottom: 2.5rem;
  opacity: 0.9;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-tertiary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 140px;
}

.btn-primary {
  background-color: #ff6b6b;
  color: white;
}
.btn-primary:hover {
  background-color: #ff5252;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

.btn-secondary {
  background-color: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.8);
}
.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: white;
  transform: translateY(-2px);
}

.btn-tertiary {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.btn-tertiary:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .error-container {
    padding: 1rem;
  }
  .error-code {
    font-size: 4rem;
  }
  .error-title {
    font-size: 1.4rem;
  }
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
