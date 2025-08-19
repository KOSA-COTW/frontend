<script>
import { reactive, ref, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import axios from 'axios'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'PostEditView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const postId = route.params.id // 라우트 파라미터에서 postId 가져오기

    const form = reactive({
      title: '',
      category: undefined,
      amount: '',
      content: '',
      deadline: null,
      agreeTerms: true // 수정 시엔 이미 작성자니까 기본 true
    })

    const previewImages = ref([]) // { file, url, name }
    const previewModal = ref(false)
    const submitting = ref(false)
    const fileInput = ref(null)

    // 금액 표시용
    const amountDisplay = computed(() =>
      form.amount ? Number(form.amount).toLocaleString() : '0'
    )

    const formatAmount = (e) => {
      form.amount = e.target.value.replace(/[^\d]/g, '')
    }

    // 기존 데이터 불러오기
    const loadPost = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}`,
          {
            headers: getAuthHeader()
          }
        )
        const data = res.data
        form.title = data.title
        form.category = data.category
        form.amount = data.amount
        form.content = data.content
        form.deadline = dayjs(data.deadline)
        previewImages.value =
          data.imageUrls?.map((url, idx) => ({
            file: null,
            url,
            name: `image-${idx}`
          })) || []
      } catch (err) {
        console.error(err)
        message.error('게시글 정보를 불러오는 중 오류가 발생했습니다.')
      }
    }

    onMounted(() => {
      loadPost()
    })

    // 파일 처리
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
            url: ev.target.result,
            name: file.name
          })
        }
        reader.readAsDataURL(file)
      })
      e.target.value = ''
    }
    const removeImage = (idx) => previewImages.value.splice(idx, 1)

    // 미리보기
    const preview = () => {
      if (!form.title || !form.content) {
        message.warning('제목과 내용을 입력해주세요.')
        return
      }
      previewModal.value = true
    }

    // 수정 제출
    const onSubmit = async () => {
      submitting.value = true
      try {
        const payload = {
          title: form.title,
          category: form.category,
          amount: Number(form.amount),
          content: form.content,
          deadline: dayjs(form.deadline).format('YYYY-MM-DD'),
          imageUrls: previewImages.value.map(i => i.url)
        }

        await axios.patch(
          `${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}`,
          payload,
          { headers: getAuthHeader() }
        )

        message.success('글이 성공적으로 수정되었습니다!')
        router.push(`/posts/${postId}`)
      } catch (err) {
        console.error(err)
        message.error('수정 중 오류가 발생했습니다.')
      } finally {
        submitting.value = false
      }
    }

    const getAuthHeader = () => {
      const auth = localStorage.getItem('auth')
      const accessToken = auth ? JSON.parse(auth).accessToken : null
      return { access: accessToken }
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
      onSubmit
    }
  }
}
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

        <!-- 마감일 -->
        <a-form-item label="기부 마감일" name="deadline" required>
          <a-date-picker
            v-model:value="form.deadline"
            style="width: 100%"
            size="large"
            format="YYYY-MM-DD"
            :disabled-date="(current) => current && current < Date.now()"
          />
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

        <!-- 이미지 -->
        <a-form-item label="이미지 첨부 (최대 5개)">
          <div class="image-upload-area" @click="triggerFileInput">
            <p><strong>📷 이미지 업로드</strong></p>
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

        <!-- 버튼 -->
        <div class="action-buttons">
          <a-button size="large" @click="preview">
            👁️ 미리보기
          </a-button>
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

    <!-- 미리보기 모달 -->
    <a-modal v-model:open="previewModal" title="미리보기" width="800px" :footer="null">
      <div class="preview-content">
        <h2 class="preview-title">{{ form.title }}</h2>
        <p><strong>카테고리:</strong> {{ (categories.find(c => c.value === form.category)?.label) || '-' }}</p>
        <p><strong>목표 금액:</strong> {{ amountDisplay }}원</p>
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
/* 기존 DonationEditor 스타일 대부분 재사용 */
.editor-container { max-width: 900px; margin: 0 auto; padding: 24px; }
.header { text-align: center; margin-bottom: 32px; padding: 24px 0; border-bottom: 2px solid #f0f0f0; }
.header h1 { color: #00C851; font-size: 28px; margin: 0; font-weight: 600; }
.form-section { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 32px; }
.content-textarea { min-height: 300px !important; resize: vertical; }
.character-count { text-align: right; margin-top: 8px; color: #999; font-size: 12px; }
.image-upload-area { border: 2px dashed #d9d9d9; border-radius: 6px; padding: 24px; text-align: center; cursor: pointer; }
.preview-images { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.preview-image { position: relative; width: 120px; height: 120px; border-radius: 6px; overflow: hidden; border: 1px solid #d9d9d9; }
.preview-image img { width: 100%; height: 100%; object-fit: cover; }
.remove-image { position: absolute; top: 4px; right: 4px; background: rgba(255,255,255,.9); border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; }
.currency-suffix { background: #f5f5f5; border: 1px solid #d9d9d9; border-left: none; padding: 4px 11px; color: #666; }
.action-buttons { display: flex; justify-content: flex-end; margin-top: 32px; gap: 16px; }
.preview-content { max-height: 70vh; overflow-y: auto; }
.preview-title { color: #00C851; margin-bottom: 16px; }
.preview-description { white-space: pre-wrap; line-height: 1.6; margin-bottom: 16px; }
.preview-gallery { display: flex; flex-wrap: wrap; gap: 8px; }
.preview-gallery-image { width: 120px; height: 120px; object-fit: cover; border-radius: 6px; }
</style>
