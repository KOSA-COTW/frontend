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
        placeholder="역할(ROLE)"
        @change="fetch"
      >
        <a-select-option value="ROLE_USER">ROLE_USER</a-select-option>
        <a-select-option value="ROLE_ORG">ROLE_ORG</a-select-option>
        <a-select-option value="ROLE_ADMIN">ROLE_ADMIN</a-select-option>
      </a-select>
      <a-select
        v-model:value="q.status"
        allowClear
        style="width: 160px"
        placeholder="상태"
        @change="fetch"
      >
        <a-select-option value="ACTIVE">ACTIVE</a-select-option>
        <a-select-option value="SUSPENDED">SUSPENDED</a-select-option>
        <a-select-option value="PENDING">PENDING</a-select-option>
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
        <a-select-option value="ACTIVE">ACTIVE</a-select-option>
        <a-select-option value="SUSPENDED">SUSPENDED</a-select-option>
        <a-select-option value="PENDING">PENDING</a-select-option>
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
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'roles'">
          <a-space wrap>
            <a-tag v-for="r in record.roles" :key="r" :color="roleColor(r)">{{ r }}</a-tag>
          </a-space>
        </template>

        <template v-else-if="column.key === 'status'">
          <a-tag
            :color="record.status === 'ACTIVE'
              ? 'green'
              : record.status === 'SUSPENDED'
                ? 'red'
                : 'orange'"
          >
            {{ record.status }}
          </a-tag>
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
                <a-select-option value="ACTIVE">ACTIVE</a-select-option>
                <a-select-option value="SUSPENDED">SUSPENDED</a-select-option>
                <a-select-option value="PENDING">PENDING</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item :wrapper-col="{ offset: 6, span: 16 }">
              <a-button type="primary" html-type="submit">저장</a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <a-tab-pane key="roles" tab="권한 관리">
          <p class="muted">해당 회원의 역할(ROLE)을 관리합니다.</p>
          <a-checkbox-group v-model:value="roleSelection" :options="roleOptions" />
          <div class="mt16">
            <a-button type="primary" @click="saveRoles">권한 저장</a-button>
            <a-button class="ml8" @click="revokeAll">모두 해제</a-button>
          </div>

          <a-divider />

          <p class="muted">변경 이력</p>
          <a-timeline>
            <a-timeline-item v-for="(l, idx) in roleLogs" :key="idx">{{ l }}</a-timeline-item>
          </a-timeline>
        </a-tab-pane>
      </a-tabs>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'

const mainColor = '#00C851'

// 검색/필터
const q = reactive({
  keyword: '',
  role: undefined,
  status: undefined,
  page: 1,
  size: 10,
})

// 데이터
const loading = ref(false)
const rows = ref([])
const total = ref(0)
const pagination = reactive({
  current: q.page,
  pageSize: q.size,
  total: total.value,
  showTotal: (t) => `총 ${t}건`,
})

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '이름', dataIndex: 'name' },
  { title: '이메일', dataIndex: 'email' },
  { title: '역할', key: 'roles' },
  { title: '상태', key: 'status', width: 110 },
  { title: '가입일', dataIndex: 'createdAt', width: 160 },
  { title: '작업', key: 'actions', width: 180 },
]

function roleColor(r) {
  if (r === 'ROLE_ADMIN') return 'red'
  if (r === 'ROLE_ORG') return 'blue'
  return 'green'
}

// Drawer 상태
const drawer = reactive({ open: false, data: null })
const tabKey = ref('profile')

// 폼/권한
const form = reactive({ id: null, name: '', email: '', status: 'ACTIVE' })
const roleSelection = ref([])
const roleOptions = [
  { label: 'ROLE_USER', value: 'ROLE_USER' },
  { label: 'ROLE_ORG', value: 'ROLE_ORG' },
  { label: 'ROLE_ADMIN', value: 'ROLE_ADMIN' },
]
const roleLogs = ref([])

/* =========================
   ✅ 선택/일괄 작업 상태 & 함수
   ========================= */
const selectedRowKeys = ref([])     // 선택된 row의 id 목록
const bulkStatus = ref(undefined)   // 일괄 변경 상태 값

function onSelectChange(keys) {
  selectedRowKeys.value = keys
}
function clearSelection() {
  selectedRowKeys.value = []
  bulkStatus.value = undefined
}

// 더미 API (실서비스에 맞게 교체)
async function apiSearchMembers(params) {
  await wait(400)
  const list = Array.from({ length: params.size }, (_, i) => {
    const id = (params.page - 1) * params.size + i + 1
    return {
      id,
      name: `사용자${id}`,
      email: `user${id}@example.com`,
      roles: id % 7 === 0 ? ['ROLE_ADMIN'] : id % 3 === 0 ? ['ROLE_ORG'] : ['ROLE_USER'],
      status: id % 11 === 0 ? 'SUSPENDED' : id % 13 === 0 ? 'PENDING' : 'ACTIVE',
      createdAt: '2025-09-02',
    }
  })
  return { content: list, totalElements: 127 }
}
async function apiGetMember(id) {
  await wait(200)
  return {
    id,
    name: `사용자${id}`,
    email: `user${id}@example.com`,
    status: 'ACTIVE',
    roles: id % 3 === 0 ? ['ROLE_ORG'] : ['ROLE_USER'],
    roleLogs: ['2025-09-01 ROLE_USER 부여', '2025-08-25 ROLE_ORG 해제'],
  }
}
async function apiSaveMemberProfile(payload) {
  await wait(250)
  return payload
}
async function apiSaveMemberRoles(id, roles) {
  await wait(250)
  return { id, roles }
}
async function apiDeleteMember(id) {
  await wait(250)
  return true
}

/* ✅ 일괄 API 더미 */
async function apiBulkDelete(ids) {
  await wait(250)
  return { success: true, count: ids.length }
}
async function apiBulkUpdateStatus(ids, status) {
  await wait(250)
  return { success: true, count: ids.length, status }
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

// 동작
async function fetch() {
  loading.value = true
  try {
    const res = await apiSearchMembers(q)
    rows.value = res.content
    total.value = res.totalElements
    pagination.current = q.page
    pagination.pageSize = q.size
    pagination.total = total.value
  } finally {
    loading.value = false
  }
}

function reset() {
  q.keyword = ''
  q.role = undefined
  q.status = undefined
  q.page = 1
  fetch()
}

function onTableChange(pag) {
  q.page = pag.current
  q.size = pag.pageSize
  fetch()
}

async function openDrawer(record) {
  const data = await apiGetMember(record.id)
  drawer.data = data
  form.id = data.id
  form.name = data.name
  form.email = data.email
  form.status = data.status
  roleSelection.value = [...data.roles]
  roleLogs.value = data.roleLogs ?? []
  tabKey.value = 'profile'
  drawer.open = true
}

async function saveProfile() {
  await apiSaveMemberProfile({ ...form })
  message.success('회원 정보가 저장되었습니다.')
  fetch()
}

async function saveRoles() {
  await apiSaveMemberRoles(form.id, roleSelection.value)
  message.success('권한이 저장되었습니다.')
  fetch()
}

function revokeAll() {
  roleSelection.value = []
}

async function remove(record) {
  await apiDeleteMember(record.id)
  message.success('회원이 삭제되었습니다.')
  fetch()
}

/* ✅ 선택/일괄 동작 */
async function bulkDelete() {
  if (!selectedRowKeys.value.length) return
  try {
    await apiBulkDelete(selectedRowKeys.value)
    message.success('선택 삭제가 완료되었습니다.')
  } catch (e) {
    message.error('선택 삭제 중 오류가 발생했습니다.')
  } finally {
    clearSelection()
    fetch()
  }
}

async function bulkUpdateStatus() {
  if (!selectedRowKeys.value.length || !bulkStatus.value) return
  try {
    await apiBulkUpdateStatus(selectedRowKeys.value, bulkStatus.value)
    message.success(`상태가 '${bulkStatus.value}'로 변경되었습니다.`)
  } catch (e) {
    message.error('상태 일괄 변경 중 오류가 발생했습니다.')
  } finally {
    clearSelection()
    fetch()
  }
}

// 최초 로드
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
