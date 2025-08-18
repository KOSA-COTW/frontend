// src/stores/auth.js
import { defineStore } from 'pinia'

// JWT 디코딩 함수
const decodeJWT = (token) => {
  try {
    const cleanToken = token.replace(/^Bearer\s+/i, '')
    const base64Url = cleanToken.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('JWT 디코딩 실패:', error)
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,   // 최초엔 null, persist 쓰면 자동 복원
    user: null           // 필요하면 사용자 정보
  }),
  getters: {
    isLoggedIn: (state) => !!state.accessToken,
    isAdmin: (state) => state.user?.role === 'ADMIN'
  },
  actions: {
    // 로그인 성공 시 호출
    login(token, user = null) {
      if (!token) {
        console.warn('No token provided to login()')
        return
      }
      this.accessToken = token.replace(/^Bearer\s+/i, '')
      
      // JWT에서 사용자 정보 추출
      const decodedToken = decodeJWT(token)
      if (decodedToken) {
        this.user = {
          username: decodedToken.username,
          role: decodedToken.role
        }
      } else {
        this.user = user
      }
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
  persist: {
    afterRestore: (ctx) => {
      // persist로 복원된 후, accessToken이 있지만 user가 없다면 토큰 디코딩
      if (ctx.store.accessToken && !ctx.store.user) {
        const decodedToken = decodeJWT(ctx.store.accessToken)
        if (decodedToken) {
          ctx.store.user = {
            username: decodedToken.username,
            role: decodedToken.role
          }
        }
      }
    }
  }
})
