<template>
  <div class="admin-board-page">
    <a-card title="게시글 관리" style="margin-bottom: 24px">
      <a-typography-paragraph>
        기부 게시글을 관리하고 승인할 수 있습니다.
      </a-typography-paragraph>
    </a-card>

    <a-row :gutter="[16, 16]" justify="center">
      <a-col :span="10">
        <a-card title="게시글 승인 관리" hoverable>
          <p>승인 대기 중인 기부 게시글을 검토하고 승인/반려할 수 있습니다.</p>
          <a-button class="btn-outline" size="large" block @click="goToPostList">
            승인 관리
          </a-button>
        </a-card>
      </a-col>

      <a-col :span="10">
        <a-card title="전체 게시글 관리" hoverable>
          <p>모든 기부 게시글을 조회하고 공개/비공개, 삭제 등을 관리합니다.</p>
          <a-button class="btn-outline" size="large" block @click="goToStatusManagement">
            전체 게시글 관리
          </a-button>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  // 관리자 권한은 라우터 가드에서 체크됨
})

const goToPostList = () => {
  router.push('/admin/board/posts')
}

const goToStatusManagement = () => {
  router.push('/admin/board/public_posts')
}
</script>

<style scoped>
.admin-board-page {
  padding: 24px;
  min-height: calc(100vh - 140px);
  --brand: #00C851; /* 브랜드 컬러 */
}

.ant-card { height: 100%; }
.ant-card-body {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* ✅ 아웃라인 버튼 (연두색 테두리/텍스트만) */
.btn-outline {
  background: transparent !important;
  color: var(--brand) !important;
  border: 2px solid var(--brand) !important;
  border-radius: 10px;
  font-weight: 700;
}
.btn-outline:hover,
.btn-outline:focus {
  background: rgba(0, 200, 81, 0.06) !important;
  color: var(--brand) !important;
  border-color: var(--brand) !important;
}
.btn-outline:active {
  background: rgba(0, 200, 81, 0.12) !important;
}
</style>
