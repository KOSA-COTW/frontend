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
  isPinned: false,
  images: [],
})

const submitting = ref(false)
const previewImages = ref([]) // { file, url, name }
const fileInput = ref(null)

// 파일 input 열기
const triggerFileInput = () => fileInput.value?.click()

// 이미지 선택 시
const handleFileSelect = (e) => {
  const files = Array.from(e.target.files || [])
  if (previewImages.value.length + files.length > 5) {
    message.warning('최대 5개의 이미지만 업로드할 수 있습니다.')
    return
  }
  files.forEach((file) => {
    if (file.size > 10 * 1024 * 1024) {
      message.error(`${file.name}은 10MB를 초과합니다.`)
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      previewImages.value.push({
        file,
        url: ev.target.result,
        name: file.name,
      })
    }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

const removeImage = (idx) => {
  previewImages.value.splice(idx, 1)
}

const validateForm = () => {
  if (!form.title || !form.content) {
    message.error('제목과 내용을 모두 입력해주세요.')
    return false
  }
  if (form.title.length > 100) {
    message.error('제목은 100자 이하로 입력해주세요.')
    return false
  }
  if (form.content.length > 5000) {
    message.error('내용은 5000자 이하로 입력해주세요.')
    return false
  }
  return true
}

const onSubmit = async () => {
  if (!validateForm()) return
  submitting.value = true
  try {
    // 1. 이미지 업로드 (있으면 S3 업로드)
    const imageUrls = []
    for (const img of previewImages.value) {
      if (img.file) {
        const url = await postAPI.uploadImage(img.file) // 기부글과 동일하게 사용
        imageUrls.push(url)
      }
    }

    // 2. 최종 payload
    const payload = {
      title: form.title,
      content: form.content,
      isPinned: form.isPinned,
      imageUrls: imageUrls, // 이미지 URL 리스트 전달
    }

    await postAPI.createNotice(payload)

    message.success('공지사항이 등록되었습니다.')
    router.push('/notices')
  } catch (err) {
    console.error('❌ Notice Create Error:', err)
    const backendMsg = err.response?.data?.message
    if (backendMsg) {
      message.error(backendMsg)
    } else {
      message.error('등록 중 알 수 없는 오류가 발생했습니다.')
    }
  } finally {
    submitting.value = false
  }
}
const saveEdit = async () => {
  try {
    const imageUrls = []
    for (const img of editImages.value) {
      if (img.file) {
        const url = await postAPI.uploadImage(img.file) // 새 파일은 업로드
        imageUrls.push(url)
      } else {
        imageUrls.push(img.url) // 기존 URL은 그대로 유지
      }
    }

    await postAPI.updateNotice(editingId.value, {
      title: editTitle.value,
      content: editContent.value,
      isPinned: form.isPinned,
      imageUrls,
    })

    message.success('공지사항 수정 완료!')
    fetchAllNotices()
    closeEditModal()
  } catch (e) {
    console.error('공지 수정 실패:', e)
    message.error('수정 실패')
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

        <!-- 이미지 업로드 -->
        <a-form-item label="이미지 첨부 (최대 5개)">
          <div class="image-upload-area" @click="triggerFileInput">
            <p>📷 이미지 업로드</p>
            <p class="upload-hint">최대 5개, 각 파일 10MB 이하</p>
          </div>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            style="display: none"
            @change="handleFileSelect"
          />
          <div v-if="previewImages.length > 0" class="preview-images">
            <div v-for="(image, index) in previewImages" :key="index" class="preview-image">
              <img :src="image.url" :alt="image.name" />
              <button class="remove-image" @click="removeImage(index)">×</button>
            </div>
          </div>
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
          <a-button type="primary" size="large" @click="onSubmit" :loading="submitting">
            글 작성하기
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
  color: #00c851;
  font-size: 26px;
  margin: 0;
  font-weight: 600;
}
.form-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 32px;
}
.content-textarea {
  min-height: 250px;
  resize: vertical;
}
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
  background-color: #00c851;
  border-color: #00c851;
}
:deep(.ant-btn-primary:hover),
:deep(.ant-btn-primary:focus) {
  background-color: #00b049;
  border-color: #00b049;
}

:deep(.ant-input:focus),
:deep(.ant-input-focused) {
  border-color: #00c851;
  box-shadow: 0 0 0 2px rgba(0, 200, 81, 0.2);
}
.preview-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}
.preview-image {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #d9d9d9;
}
.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.remove-image {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.image-upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  padding: 24px;
  text-align: center;
  transition: border-color 0.3s;
  cursor: pointer;
}
.image-upload-area:hover {
  border-color: #00c851;
}
.upload-hint {
  font-size: 12px;
  color: #999;
}
</style>
