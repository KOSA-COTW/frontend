<script setup>
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { postAPI } from '@/utils/post'
import { useRouter } from 'vue-router'

const router = useRouter()

// 폼 상태
const form = reactive({
  title: '',
  content: '',
  isPinned: false
})

const submitting = ref(false)

const validateForm = () => {
  if (!form.title || !form.content) {
    message.error('제목과 내용을 모두 입력해주세요.')
    return false
  }
  return true
}

const onSubmit = async () => {
  if (!validateForm()) return
  submitting.value = true
  try {
    const auth = localStorage.getItem('auth')
    const accessToken = auth ? JSON.parse(auth).accessToken : null

    const payload = {
      title: form.title,
      content: form.content,
      isPinned: form.isPinned
    }

    await postAPI.createNotice(payload)

    message.success('공지사항이 등록되었습니다.')
    router.push('/notices')
  } catch (err) {
    console.error(err)
    message.error('등록 중 오류가 발생했습니다.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="editor-container">
    <div class="header">
      <h1>📢 공지사항 작성</h1>
    </div>

    <div class="form-section">
      <a-form :model="form" layout="vertical" @finish="onSubmit">
        <!-- 제목 -->
        <a-form-item
          label="제목"
          name="title"
          :rules="[{ required: true, message: '제목을 입력해주세요!' }]"
        >
          <a-input
            v-model:value="form.title"
            placeholder="공지사항 제목을 입력하세요"
            size="large"
          />
        </a-form-item>

        <!-- 내용 -->
        <a-form-item
          label="내용"
          name="content"
          :rules="[{ required: true, message: '내용을 입력해주세요!' }]"
        >
          <a-textarea
            v-model:value="form.content"
            placeholder="공지 내용을 입력하세요."
            :auto-size="{ minRows: 10, maxRows: 20 }"
            class="content-textarea"
          />
        </a-form-item>

        <!-- 상단 고정 여부 -->
        <a-form-item>
          <div class="pinned-row">
            <span class="pinned-label">상단 고정</span>
            <a-switch v-model:checked="form.isPinned" />
          </div>
        </a-form-item>

        <!-- 버튼 영역 -->
        <div class="action-buttons">
          <a-button
            type="primary"
            size="large"
            @click="onSubmit"
            :loading="submitting"
          >
            등록하기
          </a-button>
        </div>
      </a-form>
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}
.header {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px 0;
  border-bottom: 2px solid #f0f0f0;
}
.header h1 {
  color: #00C851;
  font-size: 26px;
  margin: 0;
  font-weight: 600;
}
.form-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 32px;
}
.content-textarea { min-height: 250px; resize: vertical; }
.action-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
.pinned-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pinned-label {
  font-weight: 500;
  color: #333;
}
:deep(.ant-btn-primary) {
  background-color: #00C851;
  border-color: #00C851;
}
:deep(.ant-btn-primary:hover),
:deep(.ant-btn-primary:focus) {
  background-color: #00b049;
  border-color: #00b049;
}

:deep(.ant-input:focus),
:deep(.ant-input-focused) {
  border-color: #00C851;
  box-shadow: 0 0 0 2px rgba(0,200,81,.2);
}
</style>
