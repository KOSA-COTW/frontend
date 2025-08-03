<template>
  <div class="header-container">
    <div class="header-inner">
      <router-link to="/" class="logo">COTW</router-link>

      <a-menu mode="horizontal" :selected-keys="[selectedKey]" theme="light" class="menu">
        <a-menu-item key="home">
          <router-link to="/">홈</router-link>
        </a-menu-item>
        <a-menu-item key="donate">
          <router-link to="/donations">기부하기</router-link>
        </a-menu-item>
        <a-menu-item key="login">
          <router-link to="/login">로그인</router-link>
        </a-menu-item>
        <a-menu-item key="signup">
          <router-link to="/signup">회원가입</router-link>
        </a-menu-item>
      </a-menu>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const selectedKey = ref('home')

watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/donations')) selectedKey.value = 'donate'
    else if (path.startsWith('/login')) selectedKey.value = 'login'
    else if (path.startsWith('/signup')) selectedKey.value = 'signup'
    else selectedKey.value = 'home'
  },
  { immediate: true }
)
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
  justify-content: space-between;
  align-items: center;
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
