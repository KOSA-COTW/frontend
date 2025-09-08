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
          {{ userInfo.nickname ? userInfo.nickname[0] : '?' }}
        </a-avatar>

        <div class="avatar-actions">
          <template v-if="canChangeAvatar">
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
          </template>
          <template v-else>
            <div class="hint blocked">
              소셜 로그인 계정({{ userInfo.provider }})은 프로필 사진을 변경할 수 없어요.
            </div>
          </template>
        </div>
      </div>
    </a-card>

    <!-- 닉네임 변경 -->
    <a-card class="card">
      <template #title>닉네임 변경</template>
      <a-form layout="vertical" @submit.prevent="saveNickname">
        <a-form-item label="현재 닉네임">
          <a-input :value="originalNickname" disabled />
        </a-form-item>

        <a-form-item label="새 닉네임" :validate-status="nv.status" :help="nv.help">
          <a-input
            v-model:value="nickname"
            :maxlength="20"
            show-count
            placeholder="2~20자, 한/영/숫자/공백/-/_"
            @input="validateNickname()"
          />
        </a-form-item>

        <a-space>
          <a-button
            type="primary"
            html-type="submit"
            :loading="savingNick"
            :disabled="!canSubmitNick"
          >
            닉네임 저장
          </a-button>
          <a-button @click="resetNick" :disabled="savingNick">초기화</a-button>
        </a-space>
      </a-form>
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
import axios from '@/utils/axios'

const router = useRouter()

// ---- 사용자 정보 로드 (아바타/닉네임 프리뷰용) ----
const userInfo = reactive({ email: null, nickname: null, pictureUrl: null, provider: null})
const loadingInfo = ref(true)

const loadInfo = async () => {
  try {
    const { data } = await axios.get('/api/info')
    userInfo.email = data.email ?? null
    userInfo.nickname = data.nickname ?? null
    userInfo.pictureUrl = data.pictureUrl ?? null
    userInfo.provider = data.provider ?? null

    // 닉네임 편집 초기화
    originalNickname.value = userInfo.nickname || ''
    nickname.value = userInfo.nickname || ''
    validateNickname()
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

// provider가 LOCAL인 경우만 아바타 변경 허용
const canChangeAvatar = computed(() => (userInfo.provider || '').toUpperCase() === 'LOCAL')

const beforeUpload = (file) => {
  if (!canChangeAvatar.value) {
    message.warning('소셜 로그인 계정은 프로필 사진을 변경할 수 없어요.')
    return false
  }
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
  if (!canChangeAvatar.value) {
    message.warning('소셜 로그인 계정은 프로필 사진을 변경할 수 없어요.')
    return
  }
  if (!avatarFile.value) return
  savingAvatar.value = true
  try {
    const fd = new FormData()
    fd.append('file', avatarFile.value)

    await axios.patch('/api/changeimage', fd, {
      headers: { Authorization : `Bearer ${accessToken}` , 'Content-Type': "multipart/form-data"}
    })
    message.success('프로필 사진이 저장되었어요.')
    await loadInfo()
    resetAvatar()
  } catch (e) {
    message.error(e?.response?.data?.message || '사진 저장 중 오류가 발생했어요.')
  } finally {
    savingAvatar.value = false
  }
}

// ---- 닉네임 변경 ----
const originalNickname = ref('')
const nickname = ref('')
const savingNick = ref(false)
const nv = reactive({ status: '', help: '' })

const nickRules = computed(() => {
  const trimmed = nickname.value.trim()
  const lengthOK = trimmed.length >= 2 && trimmed.length <= 20
  const patternOK = /^[A-Za-z0-9가-힣 _-]+$/.test(trimmed)
  const changed = trimmed !== originalNickname.value
  return { trimmed, lengthOK, patternOK, changed }
})

const canSubmitNick = computed(() =>
  nickRules.value.lengthOK && nickRules.value.patternOK && nickRules.value.changed && !savingNick.value
)

const validateNickname = () => {
  if (!nickRules.value.lengthOK) {
    nv.status = 'error'
    nv.help = '닉네임은 2~20자여야 합니다.'
    return
  }
  if (!nickRules.value.patternOK) {
    nv.status = 'error'
    nv.help = '한글/영문/숫자/공백/-/_만 사용할 수 있어요.'
    return
  }
  if (!nickRules.value.changed) {
    nv.status = ''
    nv.help = '현재 닉네임과 동일합니다.'
    return
  }
  nv.status = 'success'
  nv.help = ''
}

const resetNick = () => {
  nickname.value = originalNickname.value
  validateNickname()
}

const saveNickname = async () => {
  validateNickname()
  if (!canSubmitNick.value) return
  savingNick.value = true
  try {
    await axios.patch('/api/editnickname', { newNickname: nickRules.value.trimmed })

    // 로컬 상태 즉시 반영
    userInfo.name = nickRules.value.trimmed
    originalNickname.value = nickRules.value.trimmed
    message.success('닉네임이 변경되었습니다.')
    validateNickname()
  } catch (e) {
    const msg = e?.response?.data?.message || '닉네임 변경 중 오류가 발생했어요.'
    message.error(msg)
  } finally {
    savingNick.value = false
  }
}

// ---- 비밀번호 변경 ----
const pw = reactive({ current: '', new: '', confirm: '' })
const savingPw = ref(false)
const v = reactive({ current: { status: '', help: '' }, new: { status: '', help: '' }, confirm: { status: '', help: '' } })

const checks = computed(() => ({ length: pw.new.length >= 8, mix: /[A-Za-z]/.test(pw.new) && /\d/.test(pw.new) }))
const canSubmitPw = computed(() => pw.current && pw.new && pw.confirm && checks.value.length && checks.value.mix && pw.new === pw.confirm)

const resetPw = () => {
  pw.current = ''; pw.new = ''; pw.confirm = ''
  v.current = { status: '', help: '' }; v.new = { status: '', help: '' }; v.confirm = { status: '', help: '' }
}

const savePassword = async () => {
  v.current = { status: pw.current ? '' : 'error', help: pw.current ? '' : '현재 비밀번호를 입력해 주세요.' }
  v.new = { status: (checks.value.length && checks.value.mix) ? '' : 'error',
    help: (checks.value.length && checks.value.mix) ? '' : '8자 이상, 영문+숫자 조합이어야 합니다.' }
  v.confirm = { status: (pw.confirm === pw.new) ? '' : 'error',
    help: (pw.confirm === pw.new) ? '' : '새 비밀번호가 일치하지 않습니다.' }
  if (!canSubmitPw.value) return

  savingPw.value = true
  try {
    await axios.patch('/api/editpass', { currentPassword: pw.current, newPassword: pw.new })

    message.success('비밀번호가 변경되었습니다.')
    resetPw()
  } catch (e) {
    const msg = (e?.response?.status === 401 || e?.response?.status === 403)
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
.hint.blocked { color: #999; }
.action-buttons { display: flex; gap: 8px; }

.pw-hints { display: flex; gap: 12px; margin: 8px 0 16px; font-size: 12px; color: #999; }
.pw-hints .ok { color: #00C851; }

@media (max-width: 768px) {
  .avatar-row { flex-direction: column; align-items: flex-start; }
}
</style>
