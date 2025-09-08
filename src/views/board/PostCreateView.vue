<script>
import { reactive, ref, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { postAPI } from '@/utils/post'

export default {
  name: 'DonationEditor',
  setup() {
    const router = useRouter()

    // ✅ 초기 상태
    const initialForm = {
      title: '',
      category: undefined,
      amount: '',
      content: '',
      deadline: null,
      agreeTerms: false,
    }
    const form = reactive({ ...initialForm })

    // 이미지 상태
    const previewImages = ref([]) // { file, url, name }
    const fileInput = ref(null)

    const submitting = ref(false)

    // ✅ 표시용 포맷
    const amountDisplay = computed(() =>
      form.amount ? Number(form.amount).toLocaleString() : '0'
    )

    // ✅ 헬퍼 함수
    const validateAmount = (value) => {
      const num = Number(value)
      if (num < 100 || num > 1_000_000_000) {
        return '목표 금액은 100원 이상 10억 이하로 입력해주세요.'
      }
      if (num % 100 !== 0) {
        return '목표 금액은 100원 단위로 입력해주세요.'
      }
      return ''
    }

    const handleApiError = (err, defaultMsg) => {
      console.error('❌ API Error:', err)
      message.error(err?.response?.data?.message || err.message || defaultMsg)
    }

    // ✅ 금액 입력 처리
    const formatAmount = (e) => {
      let value = e.target.value.replace(/[^\d]/g, '')
      if (Number(value) > 1_000_000_000) {
        message.warning('목표 금액은 10억 원 이하로 입력해주세요.')
        value = '1000000000'
      }
      form.amount = value
    }

    // ✅ 파일 처리
    const triggerFileInput = () => fileInput.value?.click()
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
    const removeImage = (idx) => previewImages.value.splice(idx, 1)

    // ✅ 초기화
    const reset = () => {
      Modal.confirm({
        title: '정말 초기화하시겠습니까?',
        content: '작성한 모든 내용이 삭제됩니다.',
        okText: '초기화',
        cancelText: '취소',
        onOk() {
          Object.assign(form, initialForm)
          previewImages.value = []
          message.success('초기화되었습니다.')
        },
      })
    }

    // ✅ 검증
    const validateForm = () => {
      if (!form.title) return message.error('제목을 입력해주세요.'), false
      if (form.title.length > 100)
        return message.error('제목은 100자 이하로 입력해주세요.'), false

      if (!form.content) return message.error('내용을 입력해주세요.'), false
      if (form.content.length < 10 || form.content.length > 5000)
        return message.error('내용은 10자 이상 5000자 이하로 입력해주세요.'), false

      if (!form.category) return message.error('카테고리를 선택해주세요.'), false

      if (!form.amount || isNaN(form.amount))
        return message.error('목표 금액을 입력해주세요.'), false
      const amountError = validateAmount(form.amount)
      if (amountError) return message.error(amountError), false

      if (!form.deadline) return message.error('마감일을 선택해주세요.'), false
      const today = dayjs().startOf('day')
      const deadline = dayjs(form.deadline).startOf('day')
      if (deadline.isBefore(today))
        return message.error('마감일은 오늘 이후여야 합니다.'), false
      if (deadline.isAfter(today.add(1, 'year')))
        return message.error('마감일은 1년 이내로 설정해주세요.'), false

      if (previewImages.value.length > 5)
        return message.error('이미지는 최대 5개까지만 등록할 수 있습니다.'), false

      if (!form.agreeTerms)
        return message.error('이용약관에 동의해주세요.'), false

      return true
    }

    // ✅ 제출
    const onSubmit = async () => {
      if (!validateForm()) return
      submitting.value = true
      try {
        // 이미지 업로드
        const imageUrls = []
        for (const img of previewImages.value) {
          if (img.file) {
            const url = await postAPI.uploadImage(img.file)
            imageUrls.push(url)
          } else {
            imageUrls.push(img.url)
          }
        }

        // payload
        const payload = {
          title: form.title,
          category: form.category,
          amount: Number(form.amount),
          content: form.content,
          deadline: dayjs(form.deadline).format('YYYY-MM-DD'),
          imageUrls,
        }

        await postAPI.createPost(payload)
        message.success('글이 등록되었습니다! 내 게시글에서 승인 요청을 진행하세요.')
        router.push('/mypage/posts')
      } catch (err) {
        handleApiError(err, '등록 중 알 수 없는 오류가 발생했습니다.')
      } finally {
        submitting.value = false
      }
    }

    // ✅ 카테고리
    const categories = [
      { value: 'CHILD', label: '아동' },
      { value: 'DISABLED', label: '장애인' },
      { value: 'SENIOR', label: '어르신' },
      { value: 'ANIMAL', label: '동물' },
      { value: 'ENVIRONMENT', label: '환경' },
      { value: 'GLOBAL', label: '지구촌' },
      { value: 'SOCIETY', label: '사회' },
    ]

    return {
      form,
      categories,
      amountDisplay,
      previewImages,
      fileInput,
      submitting,
      formatAmount,
      triggerFileInput,
      handleFileSelect,
      removeImage,
      reset,
      onSubmit,
    }
  },
}
</script>

<template>
  <div class="editor-container" :class="{ submitting: submitting }">
    <div class="header">
      <h1>📝 기부 글 작성</h1>
    </div>

    <div class="form-section">
      <a-form :model="form" layout="vertical" @finish="onSubmit">
        <!-- 제목 -->
        <a-form-item label="제목 *" name="title">
          <a-input
            v-model:value="form.title"
            placeholder="기부 캠페인의 제목을 입력하세요"
            size="large"
            maxlength="100"
          />
          <div class="form-hint">{{ form.title.length }}/100자</div>
        </a-form-item>

        <!-- 카테고리 & 금액 -->
        <a-row :gutter="24">
          <a-col :xs="24" :md="12">
            <a-form-item label="카테고리 *" name="category">
              <a-select v-model:value="form.category" placeholder="선택하세요" size="large">
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
            <a-form-item label="목표 금액 *" name="amount">
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
              <div class="form-hint">
                {{ amountDisplay }}원 (100원 단위, 최대 10억)
              </div>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 기부 마감일 -->
        <a-form-item label="기부 마감일 *" name="deadline">
          <a-date-picker
            v-model:value="form.deadline"
            style="width: 100%"
            size="large"
            format="YYYY-MM-DD"
            placeholder="마감일을 선택하세요"
            :disabled-date="(current) => current && current < Date.now()"
          />
          <div class="form-hint">오늘 이후, 1년 이내</div>
        </a-form-item>

        <!-- 내용 -->
        <a-form-item label="내용 *" name="content">
          <a-textarea
            v-model:value="form.content"
            placeholder="기부가 필요한 상황과 이유를 자세히 설명해주세요."
            class="content-textarea"
            :auto-size="{ minRows: 10, maxRows: 20 }"
            maxlength="5000"
          />
          <div class="form-hint">{{ form.content.length }}/5000자</div>
        </a-form-item>

        <!-- 이미지 업로드 -->
        <a-form-item label="이미지 (최대 5개)">
          <div class="image-upload-area" @click="triggerFileInput">
            <p>📷 이미지 업로드</p>
            <p class="upload-hint">최대 5개, 각 파일 10MB 이하</p>
            <p class="upload-hint">{{ previewImages.length }}/5 등록됨</p>
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
            <div
              v-for="(image, index) in previewImages"
              :key="index"
              class="preview-image"
            >
              <img :src="image.url" :alt="image.name" />
              <button type="button" class="remove-image" @click="removeImage(index)">×</button>
            </div>
          </div>
        </a-form-item>

        <!-- 약관 -->
        <a-form-item>
          <a-checkbox v-model:checked="form.agreeTerms">
            개인정보 처리방침 및 이용약관에 동의합니다 *
          </a-checkbox>
        </a-form-item>

        <!-- 버튼 -->
        <div class="action-buttons">
          <a-button size="large" @click="reset">🔄 초기화</a-button>
          <a-button
            type="primary"
            size="large"
            @click="onSubmit"
            :disabled="!form.agreeTerms"
            :loading="submitting"
          >
            📝 글 작성하기
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
  color: #00C851;
  font-size: 28px;
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
.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
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
.upload-hint {
  font-size: 12px;
  color: #999;
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
  justify-content: flex-end;
  margin-top: 32px;
  gap: 16px;
}
.submitting {
  pointer-events: none;
  opacity: 0.6;
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
</style>
