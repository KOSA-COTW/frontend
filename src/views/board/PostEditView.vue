<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostStore } from '@/stores/post'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const postId = route.params.id
const postStore = usePostStore()
const auth = useAuthStore()

// 수정용 form
const form = reactive({
  title: '',
  category: undefined,
  amount: '',
  content: '',
  deadline: null, // 지금은 보여주기만
  agreeTerms: true
})

const submitting = ref(false)
const loading = ref(true)
const canEdit = ref(true)

// 금액 표시용
const amountDisplay = computed(() =>
  form.amount ? Number(form.amount).toLocaleString() : '0'
)
const formatAmount = e => {
  form.amount = e.target.value.replace(/[^\d]/g, '')
}

// 기존 데이터 불러오기
const loadPost = async () => {
  loading.value = true
  try {
    const data = await postStore.fetchPostDetail(postId)
    if (!data) {
      message.error('존재하지 않는 게시글입니다.')
      router.replace('/posts')
      return
    }
    form.title = data.title
    form.category = data.category
    form.amount = data.amount
    form.content = data.content
    form.deadline = data.deadline // 프론트에서만 표시

    // 권한 체크: 본인 글이거나 관리자만 통과
    // 백엔드 응답에 authorEmail 같은 필드가 있다고 가정 (없으면 제거)
    const authorEmail = data.authorEmail || data.author?.email
    const myEmail = auth.user?.email
    const isAdmin = auth.isAdmin === true

    canEdit.value = isAdmin || (!!authorEmail && !!myEmail && authorEmail === myEmail)

    if (!canEdit.value) {
      Modal.warning({
        title: '수정 권한이 없습니다',
        content: '본인이 작성한 글만 수정할 수 있습니다.',
        onOk: () => router.replace(`/posts/${postId}`),
      })
    }
  } catch (err) {
    // 401/403 등 서버에서 막힌 경우
    if (err?.response?.status === 403) {
      Modal.error({
        title: '권한 없음',
        content: '이 글을 수정할 권한이 없습니다.',
        onOk: () => router.replace(`/posts/${postId}`),
      })
    } else if (err?.response?.status === 404) {
      message.error('존재하지 않는 게시글입니다.')
      router.replace('/posts')
    } else if (err?.code === 'ERR_NETWORK') {
      message.error('서버와 연결할 수 없습니다. 네트워크 상태를 확인해주세요.')
    } else {
      message.error(err?.response?.data?.message || '게시글 정보를 불러오는 중 오류가 발생했습니다.')
    }
  } finally {
    loading.value = false
  }
}
onMounted(loadPost)

// 수정 제출
const onSubmit = async () => {
  if (!canEdit.value) return
  submitting.value = true
  try {
    const payload = {
      title: form.title,
      category: form.category,
      amount: Number(form.amount),
      content: form.content
      // deadline, imageUrls 제외
    }
    await postStore.updatePost(postId, payload)
    message.success('글이 성공적으로 수정되었습니다!')
    router.push(`/posts/${postId}`)
  } catch (err) {
    // ✅ 에러 케이스별 메시지
    if (err?.response?.status === 401) {
      Modal.warning({
        title: '로그인이 필요합니다',
        content: '로그인 후 다시 시도해주세요.',
        onOk: () => router.push('/login'),
      })
    } else if (err?.response?.status === 403) {
      Modal.error({
        title: '권한 없음',
        content: '이 글을 수정할 권한이 없습니다.',
        onOk: () => router.replace(`/posts/${postId}`),
      })
    } else if (err?.response?.status === 404) {
      message.error('존재하지 않는 게시글입니다.')
      router.replace('/posts')
    } else if (err?.code === 'ERR_NETWORK') {
      message.error('서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    } else {
      message.error(err?.response?.data?.message || '수정 중 오류가 발생했습니다.')
    }
  } finally {
    submitting.value = false
  }
}

const categories = [
  { value: 'CHILD', label: '아동' },
  { value: 'DISABLED', label: '장애인' },
  { value: 'SENIOR', label: '어르신' },
  { value: 'ANIMAL', label: '동물' },
  { value: 'ENVIRONMENT', label: '환경' },
  { value: 'GLOBAL', label: '지구촌' },
  { value: 'SOCIETY', label: '사회' }
]
</script>

<template>
  <div class="editor-container">
    <div class="header">
      <h1>✏️ 기부 글 수정</h1>
    </div>

    <div class="form-section">
      <a-form :model="form" layout="vertical" @finish="onSubmit">
        <!-- 제목 -->
        <a-form-item label="제목" name="title" required>
          <a-input v-model:value="form.title" size="large" />
        </a-form-item>

        <!-- 카테고리 & 금액 -->
        <a-row :gutter="24">
          <a-col :xs="24" :md="12">
            <a-form-item label="카테고리" name="category" required>
              <a-select v-model:value="form.category" size="large">
                <a-select-option
                  v-for="c in categories"
                  :key="c.value"
                  :value="c.value"
                >
                  {{ c.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="목표 금액" name="amount" required>
              <a-input-group compact>
                <a-input
                  v-model:value="form.amount"
                  placeholder="1000000"
                  size="large"
                  style="width: calc(100% - 40px)"
                  @input="formatAmount"
                />
                <span class="currency-suffix">원</span>
              </a-input-group>
              <div style="margin-top:6px;color:#888;">표시: {{ amountDisplay }}원</div>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 마감일 (수정 불가, 표시만) -->
        <a-form-item label="기부 마감일" name="deadline">
          <a-input v-model:value="form.deadline" size="large" disabled />
        </a-form-item>

        <!-- 내용 -->
        <a-form-item label="내용" name="content" required>
          <a-textarea
            v-model:value="form.content"
            :auto-size="{ minRows: 10, maxRows: 20 }"
          />
          <div class="character-count">
            {{ form.content.length }} / 2000자
          </div>
        </a-form-item>

        <!-- 버튼 -->
        <div class="action-buttons">
          <a-button
            type="primary"
            size="large"
            @click="onSubmit"
            :loading="submitting"
          >
            ✏️ 글 수정하기
          </a-button>
        </div>
      </a-form>
    </div>
  </div>
</template>

<style scoped>
.editor-container { max-width: 900px; margin: 0 auto; padding: 24px; }
.header { text-align: center; margin-bottom: 32px; padding: 24px 0; border-bottom: 2px solid #f0f0f0; }
.header h1 { color: #00C851; font-size: 28px; margin: 0; font-weight: 600; }
.form-section { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 32px; }
.character-count { text-align: right; margin-top: 8px; color: #999; font-size: 12px; }
.currency-suffix { background: #f5f5f5; border: 1px solid #d9d9d9; border-left: none; padding: 4px 11px; color: #666; }
.action-buttons { display: flex; justify-content: flex-end; margin-top: 32px; gap: 16px; }
</style>
