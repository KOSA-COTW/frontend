<template>
  <div class="admin-donation-view">
    <div class="header-section">
      <a-button @click="goBack" type="text" class="back-button">
        <template #icon>
          <ArrowLeftOutlined />
        </template>
        돌아가기
      </a-button>
      <h1>게시글별 기부 내역</h1>
    </div>
    
    <PaymentHistoryView 
      :title="pageTitle"
      :subtitle="pageSubtitle"
      :hide-stats="false"
      :admin-mode="true"
      :post-id="postId"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import PaymentHistoryView from '@/views/payment/PaymentHistoryView.vue'
import { usePostStore } from '@/stores/post'

const router = useRouter()
const route = useRoute()
const postStore = usePostStore()

const postId = ref(route.params.postId)
const post = ref(null)
const loading = ref(true)

const pageTitle = computed(() => {
  if (!post.value) return '게시글별 기부 내역'
  return `${post.value.title} - 기부 내역`
})

const pageSubtitle = computed(() => {
  if (!post.value) return '게시글에 대한 기부 내역을 확인해보세요'
  return `${post.value.category} · 관리자 전용`
})

const goBack = () => {
  router.go(-1)
}

onMounted(async () => {
  try {
    post.value = await postStore.fetchPostDetail(postId.value)
  } catch (err) {
    console.error('게시글 정보 로딩 실패:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-donation-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 32px;
}

.back-button {
  margin-bottom: 16px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  transition: color 0.2s;
}

.back-button:hover {
  color: #00C851;
}

.header-section h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

@media (max-width: 768px) {
  .admin-donation-view {
    padding: 16px;
  }
  
  .header-section h1 {
    font-size: 20px;
  }
}
</style>