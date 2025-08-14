// src/stores/auth.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,   // 최초엔 null, persist 쓰면 자동 복원
    user: null           // 필요하면 사용자 정보
  }),
  getters: {
    isLoggedIn: (state) => !!state.accessToken
  },
  actions: {
    // 로그인 성공 시 호출
    login(token, user = null) {
      if (!token) {
        console.warn('No token provided to login()')
        return
      }
      this.accessToken = token.replace(/^Bearer\s+/i, '')
      this.user = user
      // persist 플러그인 안 쓰는 경우:
      // localStorage.setItem('accessToken', token)
      // localStorage.setItem('user', JSON.stringify(user))
    },
    // 앱 시작 시(또는 새로고침 시) 수동 복원: persist 미사용 시에만 필요
    hydrateFromStorage() {
      const t = localStorage.getItem('accessToken')
      this.accessToken = t
      const u = localStorage.getItem('user')
      this.user = u ? JSON.parse(u) : null
    },
    logout() {
      this.accessToken = null
      this.user = null
      // persist 미사용 시
      // localStorage.removeItem('accessToken')
      // localStorage.removeItem('user')
    },
    // 다중 탭 동기화용(선택)
    setTokenFromExternal(token) {
      this.accessToken = token
    }
  },
  // persist 플러그인 사용 시 자동 저장/복구
  persist: true // <-- 플러그인 쓴다면 이 한 줄로 끝
})
