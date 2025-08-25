<template>
  <div class="my-page">
    <a-row :gutter="24" justify="center">
      <a-col :xs="24" :sm="6" :md="5" :lg="5" :xl="4">
        <div class="sidebar">
          <ul>
            <li
              v-for="item in menuItems"
              :key="item.name"
              :class="{ active: $route.name === item.name }"
              @click="router.push({ name: item.name })"
            >
              {{ item.label }}
            </li>
          </ul>
        </div>
      </a-col>

      <a-col :xs="24" :sm="18" :md="17" :lg="15" :xl="14">
        <router-view />
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const menuItems = [
  { label: '내 정보', name: 'mypage.home' },
  { label: '기부내역', name: 'mypage.donations' },
]
</script>

<style scoped>
.my-page { min-height: 100vh; padding: 32px 16px; }
.sidebar ul { list-style: none; padding: 0; margin: 0; }
.sidebar li {
  padding: 12px 16px; margin-bottom: 8px; background: none; border-radius: 20px;
  cursor: pointer; transition: all 0.2s; font-weight: 500; color: #333; border: 1px solid #ccc; text-align: center;
}
.sidebar li:hover { border-color: #00C851; color: #00C851; background-color: transparent; }
.sidebar li.active { border: 2px solid #00C851; color: #00C851; background-color: transparent; font-weight: 600; }
</style>
