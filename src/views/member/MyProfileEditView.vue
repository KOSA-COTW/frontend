<!-- src/views/mypage/MyProfileEdit.vue -->
<template>
  <div class="edit-wrap">
    <div class="edit-header">
      <a-button type="text" @click="router.push({ name: 'mypage.home' })">← 내 정보로 돌아가기</a-button>
      <h3>내 정보 수정</h3>
    </div>

    <!-- 프로필 사진 -->
    <a-card class="card">
      <template #title>프로필 사진</template>
      <div class="avatar-row">
        <a-avatar :size="80" :src="avatarPreview || userInfo.pictureUrl">
          {{ userInfo.name ? userInfo.name[0] : '?' }}
        </a-avatar>

        <div class="avatar-actions">
          <a-upload
            :before-upload="beforeUpload"
            :show-upload-list="false"
            :max-count="1"
            accept="image/png,image/jpeg,image/jpg,image/webp"
          >
            <a-button>사진 선택</a-button>
          </a-upload>
          <div class="hint">PNG/JPG/WebP, 2MB 이하 권장</div>
          <div class="action-buttons">
            <a-button
              type="primary"
              :disabled="!avatarFile"
              :loading="savingAvatar"
              @click="saveAvatar"
            >
              사진 저장
            </a-button>
            <a-button v-if="avatarFile" @click="resetAvatar" :disabled="savingAvatar">취소</a-button>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 비밀번호 변경 -->
    <a-card class="card">
      <template #title>비밀번호 변경</template>
      <a-form layout="vertical" @submit.prevent="savePassword">
        <a-form-item label="현재 비밀번호" :validate-status="v.current.status" :help="v.current.help">
          <a-input-password v-model:value="pw.current" autocomplete="current-password" />
        </a-form-item>

        <a-form-item label="새 비밀번호" :validate-status="v.new.status" :help="v.new.help">
          <a-input-password v-model:value="pw.new" autocomplete="new-password" />
        </a-form-item>

        <a-form-item label="새 비밀번호 확인" :validate-status="v.confirm.status" :help="v.confirm.help">
          <a-input-password v-model:value="pw.confirm" autocomplete="new-password" />
        </a-form-item>

        <div class="pw-hints">
          <span :class="{ ok: checks.length }">8자 이상</span>
          <span :class="{ ok: checks.mix }">영문/숫자 조합</span>
        </div>

        <a-space>
          <a-button
            type="primary"
            html-type="submit"
            :loading="savingPw"
            :disabled="!canSubmitPw"
          >
            비밀번호 변경
          </a-button>
          <a-button @click="resetPw" :disabled="savingPw">초기화</a-button>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import axios from 'axios'

const router = useRouter()

// ---- 사용자 정보 로드 (아바타 프리뷰용) ----
const userInfo = reactive({
  email: null, name: null, pictureUrl: null
})
const loadingInfo = ref(true)

const loadInfo = async () => {
  try {
    const user = localStorage.getItem('auth')
    const accessToken = user ? JSON.parse(user).accessToken : null
    const { data } = await axios.get('/api/info', { headers: { Authorization: `Bearer ${accessToken}` } })
    userInfo.email = data.email ?? null
    userInfo.name = data.name ?? null
    userInfo.pictureUrl = data.pictureUrl ?? null
  } catch (e) {
    message.error('내 정보를 불러오지 못했어요.')
  } finally {
    loadingInfo.value = false
  }
}

// ---- 프로필 사진 변경 ----
const avatarFile = ref(null)
const avatarPreview = ref('')
const savingAvatar = ref(false)

const beforeUpload = (file) => {
  const isImage = /image\/(png|jpeg|webp|jpg)/.test(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) message.warning('이미지 파일만 업로드할 수 있어요.')
  if (!isLt2M) message.warning('2MB 이하 파일을 사용해 주세요.')
  if (!isImage || !isLt2M) return false

  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
  return false // auto-upload 막기
}

const resetAvatar = () => {
  avatarFile.value = null
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  avatarPreview.value = ''
}

const saveAvatar = async () => {
  if (!avatarFile.value) return
  savingAvatar.value = true
  try {
    const user = localStorage.getItem('auth')
    const accessToken = user ? JSON.parse(user).accessToken : null

    const fd = new FormData()
    fd.append('image', avatarFile.value)

    // ✅ 실제 엔드포인트로 교체 가능
    await axios.patch('/api/changeimage', fd, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' }
    })
    message.success('프로필 사진이 저장되었어요.')
    // 최신 이미지 반영
    await loadInfo()
    resetAvatar()
  } catch (e) {
    message.error(e?.response?.data?.message || '사진 저장 중 오류가 발생했어요.')
  } finally {
    savingAvatar.value = false
  }
}

// ---- 비밀번호 변경 ----
const pw = reactive({ current: '', new: '', confirm: '' })
const savingPw = ref(false)
const v = reactive({
  current: { status: '', help: '' },
  new: { status: '', help: '' },
  confirm: { status: '', help: '' }
})

const checks = computed(() => ({
  length: pw.new.length >= 8,
  mix: /[A-Za-z]/.test(pw.new) && /\d/.test(pw.new)
}))
const canSubmitPw = computed(() =>
  pw.current && pw.new && pw.confirm && checks.value.length && checks.value.mix && pw.new === pw.confirm
)

const resetPw = () => {
  pw.current = ''; pw.new = ''; pw.confirm = ''
  v.current = { status: '', help: '' }
  v.new = { status: '', help: '' }
  v.confirm = { status: '', help: '' }
}

const savePassword = async () => {
  // 간단 검증
  v.current = { status: pw.current ? '' : 'error', help: pw.current ? '' : '현재 비밀번호를 입력해 주세요.' }
  v.new = { status: (checks.value.length && checks.value.mix) ? '' : 'error',
    help: (checks.value.length && checks.value.mix) ? '' : '8자 이상, 영문+숫자 조합이어야 합니다.' }
  v.confirm = { status: (pw.confirm === pw.new) ? '' : 'error',
    help: (pw.confirm === pw.new) ? '' : '새 비밀번호가 일치하지 않습니다.' }

  if (!canSubmitPw.value) return

  savingPw.value = true
  try {
    const user = localStorage.getItem('auth')
    const accessToken = user ? JSON.parse(user).accessToken : null

    // ✅ 변경(change)이므로 PATCH 권장
    await axios.patch('/api/editpass', {
      currentPassword: pw.current,
      newPassword: pw.new
    }, { headers: { Authorization: `Bearer ${accessToken}` } })

    message.success('비밀번호가 변경되었습니다.')
    resetPw()
  } catch (e) {
    const msg =
      e?.response?.status === 401 || e?.response?.status === 403
        ? '현재 비밀번호가 올바르지 않습니다.'
        : e?.response?.data?.message || '변경 처리 중 오류가 발생했습니다.'
    message.error(msg)
  } finally {
    savingPw.value = false
  }
}

onMounted(loadInfo)
</script>

<style scoped>
.edit-wrap { display: flex; flex-direction: column; gap: 16px; }
.edit-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.card { border-radius: 16px; }
.avatar-row { display: flex; align-items: center; gap: 16px; }
.avatar-actions { display: flex; flex-direction: column; gap: 8px; }
.hint { font-size: 12px; color: #777; }
.action-buttons { display: flex; gap: 8px; }

.pw-hints { display: flex; gap: 12px; margin: 8px 0 16px; font-size: 12px; color: #999; }
.pw-hints .ok { color: #00C851; }

@media (max-width: 768px) {
  .avatar-row { flex-direction: column; align-items: flex-start; }
}
</style>
