<template>
  <div class="my-page">
    <a-row :gutter="24" justify="center">
      <a-col :xs="24" :sm="5" :md="4" :lg="4" :xl="3">
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

      <a-col :xs="24" :sm="19" :md="20" :lg="20" :xl="21">
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
  { label: '내 게시글', name: 'mypage.posts' },
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
