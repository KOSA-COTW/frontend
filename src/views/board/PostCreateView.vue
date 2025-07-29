<script>
import { reactive, ref, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'

export default {
  name: 'DonationEditor',
  setup() {
    const form = reactive({
      title: '',
      category: undefined,
      goalAmount: '',
      endDate: undefined,
      contact: '',
      content: '',
      agreeTerms: false
    })

    const previewImages = ref([])
    const previewModal = ref(false)
    const submitting = ref(false)
    const fileInput = ref(null)

    // Computed properties
    const formatGoalAmount = computed(() => {
      return form.goalAmount ? Number(form.goalAmount).toLocaleString() : '0'
    })

    const formatEndDate = computed(() => {
      return form.endDate ? form.endDate.format('YYYY년 MM월 DD일') : '미설정'
    })

    // Methods
    const formatAmount = (e) => {
      let value = e.target.value.replace(/[^\d]/g, '')
      form.goalAmount = value
    }

    const disabledDate = (current) => {
      return current && current < dayjs().endOf('day')
    }

    const triggerFileInput = () => {
      fileInput.value.click()
    }

    const handleFileSelect = (e) => {
      const files = Array.from(e.target.files)

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
        reader.onload = (e) => {
          previewImages.value.push({
            file: file,
            url: e.target.result,
            name: file.name
          })
        }
        reader.readAsDataURL(file)
      })

      e.target.value = ''
    }

    const removeImage = (index) => {
      previewImages.value.splice(index, 1)
    }

    const getCategoryText = (category) => {
      const categories = {
        medical: '의료비 지원',
        education: '교육 지원',
        disaster: '재해 복구',
        animal: '동물 보호',
        environment: '환경 보호',
        community: '지역사회',
        other: '기타'
      }
      return categories[category] || category
    }

    const saveDraft = () => {
      const draftData = {
        ...form,
        images: previewImages.value,
        savedAt: new Date().toISOString()
      }

      // TODO: 서버에 임시저장 API 호출
      console.log('Draft saved:', draftData)
      message.success('임시저장되었습니다.')
    }

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
          Object.keys(form).forEach(key => {
            if (key === 'agreeTerms') {
              form[key] = false
            } else {
              form[key] = key === 'goalAmount' ? '' : undefined
            }
          })
          previewImages.value = []
          message.success('초기화되었습니다.')
        }
      })
    }

    const validateForm = () => {
      if (!form.title || !form.category || !form.goalAmount || !form.endDate || !form.content) {
        message.error('필수 항목을 모두 입력해주세요.')
        return false
      }

      if (!form.agreeTerms) {
        message.error('이용약관에 동의해주세요.')
        return false
      }

      if (form.content.length > 2000) {
        message.error('내용은 2000자 이하로 입력해주세요.')
        return false
      }

      return true
    }

    const onSubmit = async () => {
      if (!validateForm()) {
        return
      }

      submitting.value = true

      try {
        const submitData = {
          ...form,
          images: previewImages.value,
          submittedAt: new Date().toISOString()
        }

        // TODO: 실제 API 호출
        console.log('Form submitted:', submitData)

        // 시뮬레이션을 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 2000))

        message.success('글이 성공적으로 등록되었습니다!')

        // TODO: 성공 후 페이지 이동
        // this.$router.push('/donations')

      } catch (error) {
        message.error('등록 중 오류가 발생했습니다. 다시 시도해주세요.')
        console.error('Submit error:', error)
      } finally {
        submitting.value = false
      }
    }

    return {
      form,
      previewImages,
      previewModal,
      submitting,
      fileInput,
      formatGoalAmount,
      formatEndDate,
      formatAmount,
      disabledDate,
      triggerFileInput,
      handleFileSelect,
      removeImage,
      getCategoryText,
      saveDraft,
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
                <a-select-option value="medical">의료비 지원</a-select-option>
                <a-select-option value="education">교육 지원</a-select-option>
                <a-select-option value="disaster">재해 복구</a-select-option>
                <a-select-option value="animal">동물 보호</a-select-option>
                <a-select-option value="environment">환경 보호</a-select-option>
                <a-select-option value="community">지역사회</a-select-option>
                <a-select-option value="other">기타</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item
              label="목표 금액"
              name="goalAmount"
              :rules="[{ required: true, message: '목표 금액을 입력해주세요!' }]"
            >
              <a-input-group compact>
                <a-input
                  v-model:value="form.goalAmount"
                  placeholder="1000000"
                  size="large"
                  style="width: calc(100% - 40px)"
                  @input="formatAmount"
                />
                <span class="currency-suffix">원</span>
              </a-input-group>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :xs="24" :md="12">
            <a-form-item
              label="마감일"
              name="endDate"
              :rules="[{ required: true, message: '마감일을 선택해주세요!' }]"
            >
              <a-date-picker
                v-model:value="form.endDate"
                placeholder="마감일을 선택하세요"
                size="large"
                style="width: 100%"
                :disabled-date="disabledDate"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="연락처" name="contact">
              <a-input
                v-model:value="form.contact"
                placeholder="연락 가능한 전화번호나 이메일"
                size="large"
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
            placeholder="기부가 필요한 상황과 이유를 자세히 설명해주세요. 투명하고 진실한 내용일수록 더 많은 도움을 받을 수 있습니다."
            class="content-textarea"
            :auto-size="{ minRows: 10, maxRows: 20 }"
          />
          <div class="character-count">
            {{ form.content.length }} / 2000자
          </div>
        </a-form-item>

        <a-form-item label="이미지 첨부">
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
          <a-button size="large" @click="saveDraft">
            💾 임시저장
          </a-button>
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
          <p><strong>카테고리:</strong> {{ getCategoryText(form.category) }}</p>
          <p><strong>목표 금액:</strong> {{ formatGoalAmount }}원</p>
          <p><strong>마감일:</strong> {{ formatEndDate }}</p>
          <p v-if="form.contact"><strong>연락처:</strong> {{ form.contact }}</p>
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 32px;
}

.content-textarea {
  min-height: 300px !important;
  resize: vertical;
}

.character-count {
  text-align: right;
  margin-top: 8px;
  color: #999;
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
  border-color: #00C851;
}

.upload-text {
  color: #666;
  font-size: 14px;
}

.upload-hint {
  font-size: 12px !important;
  color: #999 !important;
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

.currency-suffix {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-left: none;
  padding: 4px 11px;
  color: #666;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
  gap: 16px;
}

.left-buttons,
.right-buttons {
  display: flex;
  gap: 12px;
}

.preview-content {
  max-height: 70vh;
  overflow-y: auto;
}

.preview-title {
  color: #00C851;
  margin-bottom: 16px;
}

.preview-info {
  margin-bottom: 16px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.preview-info p {
  margin: 0 0 8px 0;
}

.preview-info p:last-child {
  margin-bottom: 0;
}

.preview-description {
  white-space: pre-wrap;
  line-height: 1.6;
  margin-bottom: 16px;
}

.preview-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-gallery-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .editor-container {
    padding: 16px;
  }

  .form-section {
    padding: 20px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .left-buttons,
  .right-buttons {
    justify-content: center;
  }
}
</style>

<style>
/* 전역 스타일 - Ant Design 컴포넌트 커스터마이징 */
.ant-btn-primary {
  background-color: #00C851;
  border-color: #00C851;
}

.ant-btn-primary:hover,
.ant-btn-primary:focus {
  background-color: #00b049;
  border-color: #00b049;
}

.ant-input:focus,
.ant-input-focused {
  border-color: #00C851;
  box-shadow: 0 0 0 2px rgba(0, 200, 81, 0.2);
}

.ant-select:not(.ant-select-disabled):hover .ant-select-selector {
  border-color: #00C851;
}

.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector {
  border-color: #00C851;
  box-shadow: 0 0 0 2px rgba(0, 200, 81, 0.2);
}

.ant-picker:hover,
.ant-picker-focused {
  border-color: #00C851;
}

.ant-picker-focused {
  box-shadow: 0 0 0 2px rgba(0, 200, 81, 0.2);
}
</style>
