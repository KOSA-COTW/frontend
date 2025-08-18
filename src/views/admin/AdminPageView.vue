<template>
  <div class="admin-page">
    <a-card title="관리자 페이지" style="margin-bottom: 24px">
      <a-typography-paragraph>
        관리자 전용 페이지입니다. 여기에서 시스템을 관리할 수 있습니다.
      </a-typography-paragraph>
    </a-card>

    <a-row :gutter="[16, 16]" justify="center">
      <a-col :span="8">
        <a-card title="게시글 관리" hoverable>
          <p>게시글을 관리합니다.</p>
          <a-button type="primary" size="large" block>
            게시글 관리로 이동
          </a-button>
        </a-card>
      </a-col>
      
      <a-col :span="8">
        <a-card title="댓글 관리" hoverable>
          <p>댓글을 관리합니다.</p>
          <a-button type="primary" size="large" block>
            댓글 관리로 이동
          </a-button>
        </a-card>
      </a-col>
      
      <a-col :span="8">
        <a-card title="통계" hoverable>
          <p>사이트 이용 통계를 확인합니다.</p>
          <a-button type="primary" size="large" block>
            통계 보기
          </a-button>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  if (!authStore.isAdmin) {
    router.push('/')
  }
})
</script>

<style scoped>
.admin-page {
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
