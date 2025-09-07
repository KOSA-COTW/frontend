<template>
  <div class="page">
    <!-- 헤더 -->
    <a-page-header
      title="회원 정보 관리"
      sub-title="회원 조회 · 수정 · 권한 관리"
    />

    <!-- 필터/검색 -->
    <div class="toolbar">
      <a-input
        v-model:value="q.keyword"
        allowClear
        style="max-width: 320px"
        placeholder="이름/이메일 검색"
        @pressEnter="fetch"
      />
      <a-select
        v-model:value="q.role"
        allowClear
        style="width: 180px"
        placeholder="역할"
        @change="fetch"
      >
        <a-select-option value="ROLE_USER">일반회원</a-select-option>
        <a-select-option value="ROLE_ADMIN">관리자</a-select-option>
      </a-select>
      <a-select
        v-model:value="q.status"
        allowClear
        style="width: 160px"
        placeholder="상태"
        @change="fetch"
      >
        <a-select-option value="ACTIVE">활성</a-select-option>
        <a-select-option value="SUSPENDED">정지</a-select-option>
        <a-select-option value="PENDING">대기</a-select-option>
      </a-select>
      <a-button type="primary" @click="fetch">검색</a-button>
      <a-button @click="reset">초기화</a-button>
    </div>

    <!-- ✅ 선택/일괄 작업 바 -->
    <div class="bulkbar" v-if="selectedRowKeys.length">
      <span>선택됨: {{ selectedRowKeys.length }}건</span>
      <a-popconfirm
        title="선택한 회원을 삭제하시겠습니까?"
        ok-text="삭제"
        cancel-text="취소"
        @confirm="bulkDelete"
      >
        <a-button danger class="ml8">선택 삭제</a-button>
      </a-popconfirm>

      <a-select
        v-model:value="bulkStatus"
        placeholder="상태 일괄 변경"
        style="width: 180px"
        class="ml8"
      >
        <a-select-option value="ACTIVE">활성</a-select-option>
        <a-select-option value="SUSPENDED">정지</a-select-option>
        <a-select-option value="PENDING">대기</a-select-option>
      </a-select>
      <a-button class="ml8" :disabled="!bulkStatus" @click="bulkUpdateStatus">적용</a-button>

      <a-button type="link" class="ml8" @click="clearSelection">선택 해제</a-button>
    </div>

    <!-- 테이블 -->
    <a-table
      :data-source="rows"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
      :locale="tableLocale"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'roles'">
          <a-tag :color="roleColor(record.roles[0])">{{ roleLabel(record.roles[0]) }}</a-tag>
        </template>

        <template v-else-if="column.key === 'status'">
          <a-tag
            :color="record.status === 'ACTIVE'
              ? 'green'
              : record.status === 'SUSPENDED'
                ? 'red'
                : 'orange'"
          >
            {{ statusLabel(record.status) }}
          </a-tag>
        </template>

        <!-- ✅ 가입일시 -->
        <template v-else-if="column.dataIndex === 'createdAt'">
          {{ formatDateTime(record.createdAt) }}
        </template>

        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a-button size="small" @click="openDrawer(record)">보기/수정</a-button>
            <a-popconfirm
              title="이 회원을 삭제하시겠습니까?"
              ok-text="삭제"
              cancel-text="취소"
              @confirm="remove(record)"
            >
              <a-button size="small" danger>삭제</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 상세/권한 Drawer -->
    <a-drawer
      :open="drawer.open"
      :width="640"
      :title="`회원 상세 · ${drawer.data?.name ?? ''}`"
      @close="drawer.open = false"
    >
      <a-tabs v-model:activeKey="tabKey">
        <a-tab-pane key="profile" tab="프로필">
          <a-form
            :model="form"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 16 }"
            @finish="saveProfile"
          >
            <a-form-item label="이름" name="name" :rules="[{ required: true, message: '이름을 입력하세요' }]">
              <a-input v-model:value="form.name" />
            </a-form-item>
            <a-form-item label="이메일" name="email" :rules="[{ type: 'email', required: true, message: '이메일 형식' }]">
              <a-input v-model:value="form.email" />
            </a-form-item>
            <a-form-item label="상태" name="status">
              <a-select v-model:value="form.status">
                <a-select-option value="ACTIVE">활성</a-select-option>
                <a-select-option value="SUSPENDED">정지</a-select-option>
                <a-select-option value="PENDING">대기</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item :wrapper-col="{ offset: 6, span: 16 }">
              <a-button type="primary" html-type="submit">저장</a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <a-tab-pane key="roles" tab="권한 관리">
          <p class="muted">해당 회원의 역할(ROLE)을 관리합니다.</p>
          <a-radio-group v-model:value="roleSelection">
            <a-radio value="ROLE_USER">일반회원</a-radio>
            <a-radio value="ROLE_ADMIN">관리자</a-radio>
          </a-radio-group>

          <div class="mt16">
            <a-button type="primary" :disabled="!roleSelection" @click="saveRoles">권한 저장</a-button>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import {
  fetchMembers,
  getMember,
  updateMember,
  updateMemberRole,
  deleteMember,
  bulkDeleteMembers,
  bulkUpdateMemberStatus,
} from '@/utils/adminMember.js'

/* 검색/페이징 상태 */
const q = reactive({ keyword: '', role: undefined, status: undefined, page: 1, size: 10 })
const loading = ref(false)
const rows = ref([])
const total = ref(0)
const pagination = reactive({
  current: q.page, pageSize: q.size, total: total.value,
  showTotal: (t) => `총 ${t}건`,
})

/* 컬럼 정의 */
const columns = [
  { title: '이름', dataIndex: 'name' },
  { title: '이메일', dataIndex: 'email' },
  { title: '역할', key: 'roles' },
  { title: '상태', key: 'status', width: 110 },
  {
    title: '가입일시',
    dataIndex: 'createdAt',
    width: 180,
    sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    defaultSortOrder: 'descend'
  },
  { title: '작업', key: 'actions', width: 180 },
]

/* locale */
const tableLocale = {
  cancelSort: '정렬 취소',
  triggerAsc: '오래된순',
  triggerDesc: '최신순'
}

/* 라벨 변환 */
function roleColor(r) { return r === 'ROLE_ADMIN' ? 'red' : 'green' }
function statusLabel(code) {
  if (code === 'ACTIVE') return '활성'
  if (code === 'SUSPENDED') return '정지'
  if (code === 'PENDING') return '대기'
  return code
}
function roleLabel(code) {
  if (code === 'ROLE_ADMIN') return '관리자'
  if (code === 'ROLE_USER') return '일반회원'
  return code
}

/* 날짜 포맷 */
function formatDateTime(v) {
  if (!v) return '-'
  const d = new Date(v)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

/* Drawer 상태 */
const drawer = reactive({ open: false, data: null })
const tabKey = ref('profile')

/* 폼/권한 */
const form = reactive({ id: null, name: '', email: '', status: 'ACTIVE' })
const roleSelection = ref('')

/* 동작 */
async function fetch() {
  loading.value = true
  try {
    const res = await fetchMembers(q)
    rows.value = res.content
    total.value = res.totalElements
    pagination.current = q.page
    pagination.pageSize = q.size
    pagination.total = total.value
  } finally {
    loading.value = false
  }
}
function reset() { q.keyword=''; q.role=undefined; q.status=undefined; q.page=1; fetch() }
function onTableChange(pag) { q.page=pag.current; q.size=pag.pageSize; fetch() }

async function openDrawer(record) {
  const data = await getMember(record.id)
  drawer.data = data
  form.id = data.id
  form.name = data.name
  form.email = data.email
  form.status = data.status
  roleSelection.value = data.roles?.[0] ?? ''
  tabKey.value = 'profile'
  drawer.open = true
}
async function saveProfile() {
  await updateMember(form.id, { name: form.name, email: form.email, status: form.status })
  message.success('회원 정보가 저장되었습니다.')
  fetch()
}
async function saveRoles() {
  if (!roleSelection.value) {
    message.error('권한을 반드시 선택해야 합니다.')
    return
  }
  await updateMemberRole(form.id, { role: roleSelection.value })
  message.success('권한이 저장되었습니다.')
  fetch()
}
async function remove(record) {
  await deleteMember(record.id)
  message.success('회원이 삭제되었습니다.')
  fetch()
}

/* ✅ 선택/일괄 */
const selectedRowKeys = ref([])
const bulkStatus = ref(undefined)
function onSelectChange(keys) { selectedRowKeys.value = keys }
function clearSelection() { selectedRowKeys.value = []; bulkStatus.value=undefined }
async function bulkDelete() {
  if (!selectedRowKeys.value.length) return
  await bulkDeleteMembers(selectedRowKeys.value)
  message.success('선택 삭제 완료')
  clearSelection()
  fetch()
}
async function bulkUpdateStatus() {
  if (!selectedRowKeys.value.length || !bulkStatus.value) return
  await bulkUpdateMemberStatus(selectedRowKeys.value, bulkStatus.value)
  message.success(`상태가 '${statusLabel(bulkStatus.value)}'로 변경됨`)
  clearSelection()
  fetch()
}

/* 최초 로드 */
fetch()
</script>

<style scoped>
.page { padding: 12px 16px 32px; }
.toolbar {
  display: flex; gap: 8px; flex-wrap: wrap;
  padding: 12px 0 16px;
}
.bulkbar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0 12px;
}
.mt16 { margin-top: 16px; }
.ml8 { margin-left: 8px; }
.muted { color: #888; }
:deep(.ant-page-header-heading-title) { color: #00C851; }
:deep(.ant-btn-primary) { background: #00C851; border-color: #00C851; }
</style>
