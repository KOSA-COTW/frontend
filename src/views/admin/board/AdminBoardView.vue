<template>
  <div class="admin-board-page">
    <a-card title="게시글 관리" style="margin-bottom: 24px">
      <a-typography-paragraph>
        기부 게시글을 관리하고 승인할 수 있습니다.
      </a-typography-paragraph>
    </a-card>

    <a-row :gutter="[16, 16]" justify="center">
      <a-col :span="10">
        <a-card title="게시글 조회" hoverable>
          <p>전체 기부 게시글을 조회하고 관리합니다.</p>
          <a-button type="primary" size="large" block @click="goToPostList">
            게시글 조회
          </a-button>
        </a-card>
      </a-col>

      <a-col :span="10">
        <a-card title="게시글 상태 관리" hoverable>
          <p>기부 프로젝트의 진행 상태를 관리합니다.</p>
          <a-button type="primary" size="large" block @click="goToStatusManagement">
            상태 관리
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

// onMounted에서 권한 체크 제거 - 라우터 가드에서 처리
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
}

.ant-card {
  height: 100%;
}

.ant-card-body {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
