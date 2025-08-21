<template>
  <div class="header-container">
    <div class="header-inner">
      <router-link to="/" class="logo">COTW</router-link>

      <a-menu mode="horizontal" :selected-keys="[selectedKey]" theme="light" class="menu" :disabled-overflow="true">
        <a-menu-item key="home">
          <router-link to="/">홈</router-link>
        </a-menu-item>
        <a-menu-item key="posts">
          <router-link to="/posts">기부하기</router-link>
        </a-menu-item>

        <template v-if="!isLoggedIn">
          <a-menu-item key="login">
            <router-link to="/login">로그인</router-link>
          </a-menu-item>
          <a-menu-item key="signup">
            <router-link to="/signup">회원가입</router-link>
          </a-menu-item>
        </template>

        <template v-else>
          <!-- 로그인한 누구나 기부글 쓰기 가능 -->
          <a-menu-item key="create-post">
            <router-link to="/posts/create">기부글 쓰기</router-link>
          </a-menu-item>
          <template v-if="isAdmin">
            <a-menu-item key="admin">
              <router-link to="/admin">관리자 페이지</router-link>
            </a-menu-item>
            <a-menu-item key="logout">
              <a @click="logout">로그아웃</a>
            </a-menu-item>
          </template>
          <template v-else>
            <a-menu-item key="mypage">
              <router-link to="/mypage">마이페이지</router-link>
            </a-menu-item>
            <a-menu-item key="logout">
              <a @click="logout">로그아웃</a>
            </a-menu-item>
          </template>
        </template>
      </a-menu>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { message } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()

const selectedKey = ref('home')

const auth = useAuthStore()
const { isLoggedIn, isAdmin, isOrganization } = storeToRefs(auth) // 반응형 참조


// 라우팅에 따라 메뉴 선택
watch(() => route.path, (path) => {
  if (path.startsWith('/posts/create')) selectedKey.value = 'create-post'
  else if (path.startsWith('/posts')) selectedKey.value = 'posts'
  else if (path.startsWith('/login')) selectedKey.value = 'login'
  else if (path.startsWith('/signup')) selectedKey.value = 'signup'
  else if (path.startsWith('/mypage')) selectedKey.value = 'mypage'
  else if (path.startsWith('/admin')) selectedKey.value = 'admin'
  else selectedKey.value = 'home'
}, { immediate: true })

// 로그아웃
const logout = () => {
  auth.logout()
  message.success('로그아웃되었습니다.')
  router.push('/')
}

// 다중 탭 동기화: 다른 탭에서 로그인/로그아웃 시 반영
const onStorage = (e) => {
  if (e.key === 'accessToken') {
    auth.setTokenFromExternal(e.newValue)
  }
}
onMounted(() => window.addEventListener('storage', onStorage))
onUnmounted(() => window.removeEventListener('storage', onStorage))
</script>


<style scoped>
.header-container {
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 20px;
  height: 64px;
  display: flex;
  align-items: center;
}

.header-inner {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;

  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px; /* 선택: 로고와 메뉴 사이 여백 */
}

/* 메뉴가 flex 컨테이너 안에서 너비 계산을 제대로 하도록 */
.menu {
  margin-left: auto; /*  오른쪽으로 밀기 */
  min-width: 0;   /*  줄어들 수 있게 허용 */
}

.logo {

  font-size: 1.5rem;
  font-weight: bold;
  color: #00c851;
  text-decoration: none;
}

.menu :deep(.ant-menu-item) {
  font-weight: 500;
  font-size: 1rem;
}
/* 오버플로우 서브메뉴가 숨겨지지 않게 설정*/
.menu :deep(.ant-menu-overflowed-submenu){
  display: inline-flex;
}


:deep(.ant-menu-item-selected) {
  color: #00c851 !important;
}


:deep(.ant-menu-item-selected)::after {
  border-bottom: 2px solid #00c851 !important;
}

:deep(.ant-menu-item:hover) {
  color: #00c851 !important;
}

:deep(.ant-menu-item-active)::after,
:deep(.ant-menu-item:hover)::after {
  border-bottom: 2px solid #00c851 !important;
}
</style>
