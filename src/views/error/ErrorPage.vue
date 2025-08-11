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

<script>
export default {
  name: 'ErrorPage',
  props: {
    errorType: {
      type: String,
      default: '404',
    },
    customMessage: {
      type: String,
      default: null,
    },
  },
  computed: {
    errorCode() {
      const codes = {
        404: '404',
        403: '403',
        500: '500',
        network: 'NET',
        timeout: 'TIMEOUT',
      }
      return codes[this.errorType] || '오류'
    },
    errorTitle() {
      const titles = {
        404: '페이지를 찾을 수 없습니다',
        403: '접근이 금지되었습니다',
        500: '서버 오류가 발생했습니다',
        network: '네트워크 연결 오류',
        timeout: '요청 시간이 초과되었습니다',
      }
      return titles[this.errorType] || '알 수 없는 오류'
    },
    errorMessage() {
      if (this.customMessage) {
        return this.customMessage
      }

      const messages = {
        404: '요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.',
        403: '이 페이지에 접근할 권한이 없습니다.',
        500: '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        network: '인터넷 연결을 확인하고 다시 시도해 주세요.',
        timeout: '요청 처리 시간이 너무 오래 걸렸습니다.',
      }
      return messages[this.errorType] || '예상치 못한 오류가 발생했습니다.'
    },
    showRetry() {
      return ['500', 'network', 'timeout'].includes(this.errorType)
    },
  },
  methods: {
    goHome() {
      this.$router.push('/')
    },
    goBack() {
      if (window.history.length > 1) {
        this.$router.go(-1)
      } else {
        this.$router.push('/')
      }
    },
    retry() {
      // 현재 페이지 새로고침 또는 재시도 로직
      window.location.reload()
    },
  },
  mounted() {
    // 에러 로그 전송 (선택사항)
    this.logError()
  },
  methods: {
    ...this.methods,
    logError() {
      const errorInfo = {
        type: this.errorType,
        path: this.$route.fullPath,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }

      // 에러 로깅 서비스로 전송
      console.log('Error logged:', errorInfo)

      // 실제 로깅 서비스 예시:
      // this.$http.post('/api/errors', errorInfo)
    },
  },
}
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
