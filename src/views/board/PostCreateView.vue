<script>
import { reactive, ref, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { postAPI } from '@/utils/post'

export default {
  name: 'DonationEditor',
  setup() {
    const form = reactive({
      title: '',
      category: undefined,
      amount: '',
      content: '',
      deadline: null,
      agreeTerms: false
    })

    const previewImages = ref([]) // { file, url(dataURL), name }
    const previewModal = ref(false)
    const submitting = ref(false)
    const fileInput = ref(null)
    const router = useRouter()
    // 표시용 포맷
    const amountDisplay = computed(() =>
      form.amount ? Number(form.amount).toLocaleString() : '0'
    )

    // 입력 숫자만
    const formatAmount = (e) => {
      form.amount = e.target.value.replace(/[^\d]/g, '')
    }

    // 파일 선택
    const triggerFileInput = () => fileInput.value?.click()

    const handleFileSelect = (e) => {
      const files = Array.from(e.target.files || [])
      if (previewImages.value.length + files.length > 5) {
        message.warning('최대 5개의 이미지만 업로드할 수 있습니다.')
        return
      }
      files.forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
          message.error(`${file.name}은 10MB를 초과합니다.`)
          return
        }
        const reader = new FileReader()
        reader.onload = ev => {
          previewImages.value.push({
            file,
            url: ev.target.result, // data URL (임시)
            name: file.name
          })
        }
        reader.readAsDataURL(file)
      })
      e.target.value = ''
    }

    const removeImage = (idx) => previewImages.value.splice(idx, 1)

    const preview = () => {
      if (!form.title || !form.content) {
        message.warning('제목과 내용을 입력해주세요.')
        return
      }
      previewModal.value = true
    }

    const reset = () => {
      Modal.confirm({
        title: '정말 초기화하시겠습니까?',
        content: '작성한 모든 내용이 삭제됩니다.',
        okText: '초기화',
        cancelText: '취소',
        onOk() {
          form.title = ''
          form.category = undefined
          form.amount = ''
          form.content = ''
          form.deadline = null
          form.agreeTerms = false
          previewImages.value = []
          message.success('초기화되었습니다.')
        }
      })
    }

    const validateForm = () => {
      if (!form.title || !form.category || !form.amount || !form.content) {
        message.error('필수 항목을 모두 입력해주세요.')
        return false
      }
      if (!form.agreeTerms) {
        message.error('이용약관에 동의해주세요.')
        return false
      }
      return true
    }

    const onSubmit = async () => {
  if (!validateForm()) return
  submitting.value = true
  try {
    // 1. 이미지 업로드 (있을 경우)
    const imageUrls = []
    for (const img of previewImages.value) {
      const url = await postAPI.uploadImage(img.file)  // S3 업로드
      imageUrls.push(url)
    }

    // 2. 게시글 생성 payload
    const payload = {
      title: form.title,
      category: form.category,
      amount: Number(form.amount),
      content: form.content,
      deadline: dayjs(form.deadline).format('YYYY-MM-DD'),
      imageUrls: imageUrls
    }

    // 3. 게시글 생성 요청
    const res = await postAPI.createPost(payload)

    message.success('글이 성공적으로 등록되었습니다!').then(() => {
      router.push('/')
    })
  } catch (err) {
    console.error("❌ Post Create Error:", err)
    message.error('등록 중 오류가 발생했습니다.')
  } finally {
    submitting.value = false
  }
}


    // 카테고리 표시 텍스트
    const categories = [
      { value: 'CHILD', label: '아동' },
      { value: 'DISABLED', label: '장애인' },
      { value: 'SENIOR', label: '어르신' },
      { value: 'ANIMAL', label: '동물' },
      { value: 'ENVIRONMENT', label: '환경' },
      { value: 'GLOBAL', label: '지구촌' },
      { value: 'SOCIETY', label: '사회' }
    ]

    return {
      form,
      categories,
      amountDisplay,
      previewImages,
      previewModal,
      submitting,
      fileInput,
      formatAmount,
      triggerFileInput,
      handleFileSelect,
      removeImage,
      preview,
      reset,
      onSubmit
    }
  }
}
</script>

<template>
  <div class="editor-container">
    <div class="header">
      <h1>📝 기부 글 작성</h1>
    </div>

    <div class="form-section">
      <a-form :model="form" layout="vertical" @finish="onSubmit">
        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item
              label="제목"
              name="title"
              :rules="[{ required: true, message: '제목을 입력해주세요!' }]"
            >
              <a-input
                v-model:value="form.title"
                placeholder="기부 캠페인의 제목을 입력하세요"
                size="large"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :xs="24" :md="12">
            <a-form-item
              label="카테고리"
              name="category"
              :rules="[{ required: true, message: '카테고리를 선택해주세요!' }]"
            >
              <a-select
                v-model:value="form.category"
                placeholder="카테고리를 선택하세요"
                size="large"
              >
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
            <a-form-item
              label="목표 금액"
              name="amount"
              :rules="[{ required: true, message: '목표 금액을 입력해주세요!' }]"
            >
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

        <!-- 기부 마감일 -->
        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item label="기부 마감일" name="deadline" :rules="[{ required: true, message: '마감일을 선택해주세요!' }]">
              <a-date-picker
                v-model:value="form.deadline"
                style="width: 100%"
                size="large"
                format="YYYY-MM-DD"
                placeholder="마감일을 선택하세요"
                :disabled-date="(current) => current && current < Date.now()"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="내용"
          name="content"
          :rules="[{ required: true, message: '내용을 입력해주세요!' }]"
        >
          <a-textarea
            v-model:value="form.content"
            placeholder="기부가 필요한 상황과 이유를 자세히 설명해주세요."
            class="content-textarea"
            :auto-size="{ minRows: 10, maxRows: 20 }"
          />
          <div class="character-count">
            {{ form.content.length }} / 2000자
          </div>
        </a-form-item>

        <a-form-item label="이미지 첨부 (최대 5개)">
          <div class="image-upload-area" @click="triggerFileInput">
            <div class="upload-text">
              <p><strong>📷 이미지 업로드</strong></p>
              <p>클릭해서 이미지를 선택하거나 드래그 앤 드롭하세요</p>
              <p class="upload-hint">최대 5개, 각 파일 10MB 이하</p>
            </div>
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

        <a-form-item>
          <a-checkbox v-model:checked="form.agreeTerms">
            개인정보 처리방침 및 이용약관에 동의합니다
          </a-checkbox>
        </a-form-item>
      </a-form>

      <div class="action-buttons">
        <div class="left-buttons">
          <a-button size="large" @click="preview">
            👁️ 미리보기
          </a-button>
        </div>
        <div class="right-buttons">
          <a-button size="large" @click="reset">
            🔄 초기화
          </a-button>
          <a-button
            type="primary"
            size="large"
            @click="onSubmit"
            :disabled="!form.agreeTerms"
            :loading="submitting"
          >
            📝 글 등록하기
          </a-button>
        </div>
      </div>
    </div>

    <!-- 미리보기 모달 -->
    <a-modal
      v-model:open="previewModal"
      title="미리보기"
      width="800px"
      :footer="null"
    >
      <div class="preview-content">
        <h2 class="preview-title">{{ form.title }}</h2>
        <div class="preview-info">
          <p><strong>카테고리:</strong> {{
            (categories.find(c => c.value === form.category)?.label) || '-'
          }}</p>
          <p><strong>목표 금액:</strong> {{ amountDisplay }}원</p>
        </div>
        <div class="preview-description">{{ form.content }}</div>
        <div v-if="previewImages.length > 0" class="preview-gallery">
          <img
            v-for="image in previewImages"
            :key="image.name"
            :src="image.url"
            class="preview-gallery-image"
          />
        </div>
      </div>
    </a-modal>
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
  color: #00C851;
  font-size: 28px;
  margin: 0;
  font-weight: 600;
}
.form-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 32px;
}
.content-textarea { min-height: 300px !important; resize: vertical; }
.character-count { text-align: right; margin-top: 8px; color: #999; font-size: 12px; }
.image-upload-area {
  border: 2px dashed #d9d9d9; border-radius: 6px; padding: 24px;
  text-align: center; transition: border-color .3s; cursor: pointer;
}
.image-upload-area:hover { border-color: #00C851; }
.upload-text { color: #666; font-size: 14px; }
.upload-hint { font-size: 12px !important; color: #999 !important; }
.preview-images {
  display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px;
}
.preview-image {
  position: relative; width: 120px; height: 120px; border-radius: 6px;
  overflow: hidden; border: 1px solid #d9d9d9;
}
.preview-image img { width: 100%; height: 100%; object-fit: cover; }
.remove-image {
  position: absolute; top: 4px; right: 4px; background: rgba(255,255,255,.9);
  border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 12px;
}
.currency-suffix {
  background: #f5f5f5; border: 1px solid #d9d9d9; border-left: none;
  padding: 4px 11px; color: #666;
}
.action-buttons { display: flex; justify-content: space-between; margin-top: 32px; gap: 16px; }
.left-buttons, .right-buttons { display: flex; gap: 12px; }
.preview-content { max-height: 70vh; overflow-y: auto; }
.preview-title { color: #00C851; margin-bottom: 16px; }
.preview-info { margin-bottom: 16px; padding: 12px; background: #f9f9f9; border-radius: 6px; }
.preview-info p { margin: 0 0 8px 0; }
.preview-description { white-space: pre-wrap; line-height: 1.6; margin-bottom: 16px; }
.preview-gallery { display: flex; flex-wrap: wrap; gap: 8px; }
.preview-gallery-image { width: 120px; height: 120px; object-fit: cover; border-radius: 6px; }
@media (max-width: 768px) {
  .editor-container { padding: 16px; }
  .form-section { padding: 20px; }
  .action-buttons { flex-direction: column; }
  .left-buttons, .right-buttons { justify-content: center; }
}
</style>

<style>
.ant-btn-primary { background-color: #00C851; border-color: #00C851; }
.ant-btn-primary:hover, .ant-btn-primary:focus { background-color: #00b049; border-color: #00b049; }
.ant-input:focus, .ant-input-focused { border-color: #00C851; box-shadow: 0 0 0 2px rgba(0,200,81,.2); }
.ant-select:not(.ant-select-disabled):hover .ant-select-selector { border-color: #00C851; }
.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector {
  border-color: #00C851; box-shadow: 0 0 0 2px rgba(0,200,81,.2);
}
</style>
