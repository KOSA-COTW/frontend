<script setup>
import { RouterView } from 'vue-router'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
</script>

<template>
  <a-layout style="min-height: 100vh">
    <!-- 상단 -->
    <a-layout-header style="background: white; padding: 0">
      <Header />
    </a-layout-header>

    <!-- 본문 -->
    <a-layout-content style="padding: 12px; background: #ffffff">
      <div style="max-width: 1200px; margin: 0 auto">
        <RouterView :key="$route.fullPath" />
      </div>
    </a-layout-content>

    <!-- 하단 -->
    <a-layout-footer style="text-align: center; background: #ffffff">
      <Footer />
    </a-layout-footer>
  </a-layout>
</template>

<style scoped>
</style>
