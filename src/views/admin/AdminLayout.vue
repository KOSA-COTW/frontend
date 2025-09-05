<template>
  <a-layout class="admin-layout">
    <!-- 좌측 메뉴 -->
    <a-layout-sider width="220" theme="light" class="admin-sider">
      <div class="logo">관리자 페이지</div>

      <a-menu mode="inline" :selectedKeys="[selectedKey]" @click="onMenuClick">
        <a-menu-item key="dashboard">대시보드</a-menu-item>

        <!-- 회원/단체 관리 -->
        <a-sub-menu key="member">
          <template #title>회원/단체 관리</template>
          <a-menu-item key="member-info">회원 정보 관리</a-menu-item>
        </a-sub-menu>

        <!-- 기부/결제 관리 -->
        <a-sub-menu key="donation">
          <template #title>기부/결제 관리</template>
          <a-menu-item key="donation-history">전체 기부 내역</a-menu-item>
          <a-menu-item key="payment-status">결제 현황</a-menu-item>
        </a-sub-menu>

        <!-- 게시글 관리 -->
        <a-sub-menu key="board">
          <template #title>게시글 관리</template>
          <a-menu-item key="post-approval">게시글 승인 관리</a-menu-item>
          <a-menu-item key="post-all">전체 게시글 관리</a-menu-item>
        </a-sub-menu>

        <!-- 댓글 관리 -->
        <a-sub-menu key="comment">
          <template #title>댓글 관리</template>
          <a-menu-item key="comment-list">댓글 목록</a-menu-item>
        </a-sub-menu>





      </a-menu>
    </a-layout-sider>

    <!-- 우측 콘텐츠 -->
    <a-layout class="admin-content">
      <a-layout-content style="padding:24px">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const selectedKey = ref('dashboard')

// ✅ adminRoutes 의 name 과 1:1 매핑
watch(
  () => route.name,
  (name) => {
    if (name === 'admin') selectedKey.value = 'dashboard'
    else if (name === 'adminBoard' || name === 'adminBoardPosts') selectedKey.value = 'post-approval'
    else if (name === 'adminBoardPublicPosts') selectedKey.value = 'post-all'
    else if (name === 'adminComments') selectedKey.value = 'comment-list'
    else if (name === 'adminMemberInfo') selectedKey.value = 'member-info'
    else if (name === 'adminDonationHistory') selectedKey.value = 'donation-history'
    else if (name === 'adminPaymentStatus') selectedKey.value = 'payment-status'
    else if (name === 'adminNewsNotice') selectedKey.value = 'news-notice'
    else if (name === 'adminBannerManagement') selectedKey.value = 'banner-management'
    else if (name === 'adminFaqManagement') selectedKey.value = 'faq-management'
    else if (name === 'adminSiteInfo') selectedKey.value = 'site-info'
    else if (name === 'adminStatisticsDashboard') selectedKey.value = 'statistics-dashboard'
    else if (name === 'adminReportDownload') selectedKey.value = 'report-download'
  },
  { immediate: true }
)

const onMenuClick = (e) => {
  selectedKey.value = e.key
  switch (e.key) {
    case 'dashboard':
      router.push({ name: 'admin' }); break
    case 'post-approval':
      router.push({ name: 'adminBoardPosts' }); break
    case 'post-all':
      router.push({ name: 'adminBoardPublicPosts' }); break
    case 'comment-list':
      router.push({ name: 'adminComments' }); break
    case 'member-info':
      router.push({ name: 'adminMemberInfo' }); break
    case 'donation-history':
      router.push({ name: 'adminDonationHistory' }); break
    case 'payment-status':
      router.push({ name: 'adminPaymentStatus' }); break
    case 'news-notice':
      router.push({ name: 'adminNewsNotice' }); break
    case 'banner-management':
      router.push({ name: 'adminBannerManagement' }); break
    case 'faq-management':
      router.push({ name: 'adminFaqManagement' }); break
    case 'site-info':
      router.push({ name: 'adminSiteInfo' }); break
    case 'statistics-dashboard':
      router.push({ name: 'adminStatisticsDashboard' }); break
    case 'report-download':
      router.push({ name: 'adminReportDownload' }); break
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}
.admin-sider {
  background: #fff;
  border-right: 1px solid #f0f0f0;
}
.logo {
  padding: 16px;
  font-weight: 700;
  color: #00C851;
  text-align: center;
}
.admin-content {
  background: #f9f9f9;
}
/* 테마(메인색) */
:deep(.ant-btn-primary) {
  background: #00C851;
  border-color: #00C851;
}
:deep(.ant-menu-item-selected),
:deep(.ant-menu-item:hover),
:deep(.ant-menu-submenu-title:hover) {
  color: #00C851;
}
</style>
