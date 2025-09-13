<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostStore } from '@/stores/post'
import { useAuthStore } from '@/stores/auth'
import { postAPI } from '@/utils/post'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const postId = route.params.id
const postStore = usePostStore()
const auth = useAuthStore()

// 게시글 단건 데이터
const post = ref(null)

// 수정용 form
const form = reactive({
  title: '',
  category: undefined,
  amount: '',
  content: '',
  deadline: null,
  agreeTerms: true,
})

// 이미지 관련 상태
const previewImages = ref([]) // { file?, url, name }
const fileInput = ref(null)
// X 버튼 누르면 배열에서만 삭제
const removeImage = (idx) => {
  previewImages.value.splice(idx, 1)
}
const submitting = ref(false)
const loading = ref(true)

// 금액 표시용
const amountDisplay = computed(() => (form.amount ? Number(form.amount).toLocaleString() : '0'))
const formatAmount = (e) => {
  // 숫자만 추출
  let value = e.target.value.replace(/[^\d]/g, '')

  // 10억 초과 입력시 잘라내기
  if (Number(value) > 1_000_000_000) {
    message.warning('목표 금액은 10억 원 이하로 입력해주세요.')
    value = '1000000000'
  }

  form.amount = value
}
// 파일 input 열기
const triggerFileInput = () => fileInput.value?.click()

// 새 파일 선택 시
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

// 권한 체크
const canEdit = computed(() => {
  const authData = JSON.parse(localStorage.getItem('auth') || '{}')

  const myEmail = authData.user?.username
  const isAdmin = authData.user?.role === 'ADMIN'
  const authorEmail = post.value?.authorEmail

  return isAdmin || (!!authorEmail && !!myEmail && authorEmail === myEmail)
})

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
    post.value = data

    form.title = data.title
    form.category = data.category
    form.amount = data.amount
    form.content = data.content
    form.deadline = data.deadline ? dayjs(data.deadline) : null

    if (data.imageUrls?.length) {
      previewImages.value = data.imageUrls.map((url, idx) => ({
        url,
        name: `image-${idx}`,
      }))
    }

    if (!canEdit.value) {
      Modal.warning({
        title: '수정 권한이 없습니다',
        content: '본인이 작성한 글만 수정할 수 있습니다.',
        onOk: () => router.replace(`/posts/${postId}`),
      })
    }
  } catch (err) {
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
      message.error(
        err?.response?.data?.message || '게시글 정보를 불러오는 중 오류가 발생했습니다.',
      )
    }
  } finally {
    loading.value = false
  }
}
onMounted(loadPost)

const validateForm = () => {
  if (!form.title || form.title.length > 100) {
    message.error('제목은 1~100자 이내로 입력해주세요.')
    return false
  }
  if (!form.content || form.content.length < 10 || form.content.length > 5000) {
    message.error('내용은 10자 이상 5000자 이하로 입력해주세요.')
    return false
  }
  const amountNum = Number(form.amount)
  if (amountNum < 100 || amountNum > 1_000_000_000) {
    message.error('목표 금액은 100원 이상 10억 이하로 입력해주세요.')
    return false
  }
  if (amountNum % 100 !== 0) {
    message.error('목표 금액은 100원 단위로 입력해주세요.')
    return false
  }
  if (!form.deadline) {
    message.error('마감일을 선택해주세요.')
    return false
  }
  const today = dayjs()
  if (form.deadline.isBefore(today, 'day')) {
    message.error('마감일은 오늘 이후여야 합니다.')
    return false
  }
  if (form.deadline.isAfter(today.add(1, 'year'))) {
    message.error('마감일은 1년 이내여야 합니다.')
    return false
  }
  return true
}
// 수정 제출
const onSubmit = async () => {
  if (!canEdit.value) return
  submitting.value = true
  try {
    // 1. 새 파일들은 업로드, 기존 URL은 그대로 유지
    const imageUrls = []
    for (const img of previewImages.value) {
      if (img.file) {
        const url = await postAPI.uploadImage(img.file)
        imageUrls.push(url)
      } else {
        imageUrls.push(img.url) // 기존 url 그대로
      }
    }
    const payload = {
      title: form.title,
      category: form.category,
      amount: Number(form.amount),
      content: form.content,
      imageUrls,
      deadline: form.deadline ? form.deadline.format('YYYY-MM-DD') : null
    }
    await postStore.updatePost(postId, payload)
    message.success('글이 성공적으로 수정되었습니다!')
    router.push(`/posts/${postId}`)
  } catch (err) {
    message.error(err?.response?.data?.message || '수정 중 오류가 발생했습니다.')
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
  { value: 'SOCIETY', label: '사회' },
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
                <a-select-option v-for="c in categories" :key="c.value" :value="c.value">
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
              <div style="margin-top: 6px; color: #888">표시: {{ amountDisplay }}원</div>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 마감일 (수정 가능) -->
        <a-form-item label="기부 마감일" name="deadline" required>
          <a-date-picker
            v-model:value="form.deadline"
            style="width: 100%"
            size="large"
            :disabled-date="(current) => current && current < Date.now()"
          />
        </a-form-item>

        <!-- 내용 -->
        <a-form-item label="내용" name="content" required>
          <a-textarea v-model:value="form.content" :auto-size="{ minRows: 10, maxRows: 20 }" />
          <div class="character-count">{{ form.content.length }} / 5000자</div>
        </a-form-item>

        <!-- 이미지 업로드 -->
        <a-form-item label="이미지 (최대 5개)">
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
          <!-- 이미지 미리보기 -->
          <div v-if="previewImages.length > 0" class="preview-images">
            <div v-for="(image, index) in previewImages" :key="index" class="preview-image">
              <img :src="image.url || image" :alt="'image-' + index" />
              <button type="button" class="remove-image" @click="removeImage(index)">×</button>
            </div>
          </div>
        </a-form-item>

        <!-- 버튼 -->
        <div class="action-buttons">
          <a-button type="primary" size="large" @click="onSubmit" :loading="submitting">
            ✏️ 글 수정하기
          </a-button>
        </div>
      </a-form>
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  max-width: 900px;
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
  font-size: 28px;
  margin: 0;
  font-weight: 600;
}
.form-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 32px;
}
.character-count {
  text-align: right;
  margin-top: 8px;
  color: #999;
  font-size: 12px;
}
.currency-suffix {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-left: none;
  padding: 4px 11px;
  color: #666;
}
.action-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 32px;
  gap: 16px;
}
.preview-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.preview-image {
  position: relative;
  width: 150px;
  height: 150px;
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
</style>
