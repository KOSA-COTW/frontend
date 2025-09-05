<template>
  <div class="admin-comments" ref="rootEl">
    <!-- Sticky Page Header -->
    <div class="page-header">
      <div class="lhs">
        <h1 class="title">
          <span class="accent-dot"></span> 댓글 관리
        </h1>
        <p class="subtitle">신고·숨김·SLA 한눈에, 빠른 일괄 처리</p>
      </div>
      <div class="rhs">
        <a-button type="default" @click="reload" :loading="loading">새로고침</a-button>
      </div>
    </div>

    <!-- Filter / Facets -->
    <div class="filters">
      <a-input-search
        v-model:value="q.keyword"
        allowClear
        class="w320"
        placeholder="내용/작성자/게시글 검색"
        @change="debouncedFetch()"
        @search="fetch()"
        enter-button
      />
      <a-segmented
        v-model:value="category"
        :options="categoryOptions"
        class="seg"
        @change="onCategoryChange"
      />
      <a-select
        v-model:value="q.reason"
        allowClear
        placeholder="신고 사유"
        class="w160"
        @change="onReasonChange"
      >
        <a-select-option :value="''">전체</a-select-option>
        <a-select-option v-for="r in reasons" :key="r" :value="r">
          {{ reasonLabels[r] || r }}
        </a-select-option>
      </a-select>
      <a-range-picker v-model:value="q.range" class="w260" :allowClear="true" @change="fetch()" />
      <div class="min-report">
        <span class="label">최소 신고</span>
        <a-input-number v-model:value="q.minReports" :min="0" :max="99" size="small" @change="fetch()" />
      </div>
      <a-select v-model:value="q.sort" class="w160" @change="fetch()">
        <a-select-option value="REPORT_DESC">신고수↓</a-select-option>
        <a-select-option value="DATE_DESC">최신순</a-select-option>
        <a-select-option value="DATE_ASC">오래된순</a-select-option>
      </a-select>
    </div>

    <!-- KPI Strip -->
    <div class="kpis">
      <div class="kpi">
        <div class="label">전체</div>
        <div class="value">{{ total }}</div>
      </div>
      <div class="kpi">
        <div class="label">비공개</div>
        <div class="value muted">{{ statHidden }}</div>
      </div>
      <div class="kpi">
        <div class="label">임시숨김(3회↑)</div>
        <div class="value warn">{{ statTempHidden }}</div>
      </div>
      <div class="kpi">
        <div class="label"> 임박(48h)</div>
        <div class="value danger">{{ statSlaSoon }}</div>
      </div>
    </div>

    <!-- 테이블 -->
    <div class="table-wrap" ref="tableWrap">
      <a-table
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        :row-class-name="rowClassName"
        row-key="id"
        @change="onTableChange"
        :expandable="expandable"
        @expand="onExpand"
        class="table"
      ><!-- 확장행 (신고 로그) -->
        <template #expandedRowRender="{ record }">
          <div class="expand-wrap">
            <div v-if="record._loading">로딩 중...</div>
            <div v-else-if="Array.isArray(record.reports) && record.reports.length > 0">
              <table class="mini-table">
                <thead>
                <tr><th>사유</th><th>신고자</th><th>시간</th></tr>
                </thead>
                <tbody>
                <tr v-for="l in record.reports" :key="l.id ?? `${record.id}-${l.createdAt}`">
                  <td>
                    {{ reasonLabels[l.reason] || l.reason }}
                    <span v-if="l.detail" class="ml8 text-muted">- {{ l.detail }}</span>
                  </td>
                  <td>{{ l.reporter }}</td>
                  <td>{{ formatFull(l.createdAt) }}</td>
                </tr>
                </tbody>
              </table>
            </div>
            <div v-else-if="record._logsLoaded">신고 로그가 없습니다.</div>
            <div v-else class="text-muted">신고로그 창을 다시 눌러주세요 .</div>
          </div>
        </template>


        <!-- 컬럼별 Body -->
        <template #bodyCell="{ column, record }">
          <!-- 내용 + 메타 -->
          <template v-if="column.key === 'content'">
            <a-typography-paragraph
              :ellipsis="{rows: 2, tooltip: record.content}"
              :content="record.content"
              class="content"
            />
            <div class="meta-line">
              <a-tag>{{ record.postTitle }}</a-tag>
              <a-tag color="default" v-if="record.author">{{ record.author }}</a-tag>
              <a-tag :color="record.isPublic ? 'green' : 'default'">
                {{ record.isPublic ? '공개' : '비공개' }}
              </a-tag>
              <a-tag v-if="record.tempHidden" color="orange">임시숨김</a-tag>
            </div>
          </template>

          <!-- 신고수 + 대표 사유 -->
          <template v-else-if="column.key === 'reports'">
            <a-badge
              :count="record.reportCount"
              :number-style="{ backgroundColor: badgeColor(record.reportCount) }"
              show-zero
            />
            <div class="reason-chip" v-if="record.topReason">
              <a-tag color="volcano">
                {{ reasonLabels[record.topReason] || record.topReason }}
              </a-tag>
            </div>
          </template>

          <!-- SLA -->
          <template v-else-if="column.key === 'sla'">
            <a-tooltip :title="slaTooltip(record)">
              <a-tag :color="slaColor(record)">
                {{ slaText(record) }}
              </a-tag>
            </a-tooltip>
          </template>

          <!-- 작성일 -->
          <template v-else-if="column.key === 'date'">
            <a-tooltip :title="formatFull(record.createdAt)">
              {{ formatDate(record.createdAt) }}
            </a-tooltip>
          </template>



          <!-- 액션 -->
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-switch
                :checked="record.isPublic"
                @change="(v)=>toggleVisibility(record, v)"
                :checked-children="'공개'"
                :un-checked-children="'비공개'"
              />
              <a-dropdown :trigger="['click']" placement="bottomRight">
                <a-button type="text">작업</a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="reset" :disabled="record.reportCount===0" @click="resetReports(record)">
                      신고 초기화
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="toggle" @click="toggleVisibility(record, !record.isPublic)">
                      {{ record.isPublic ? '비공개로 전환' : '공개로 전환' }}
                    </a-menu-item>
                    <a-menu-divider />
                    <!-- ✅ Popconfirm 으로 감싼 삭제 -->
                    <a-menu-item key="delete" danger>
                      <a-popconfirm
                        title="정말 삭제할까요?"
                        ok-text="삭제"
                        cancel-text="취소"
                        @confirm="() => removeOne(record)"
                      >
                        <a>삭제</a>
                      </a-popconfirm>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 선택 시 여유 공간 -->
    <div v-if="selectedRowKeys.length" class="bulk-pad"></div>

    <!-- 선택 일괄 처리 바 -->
    <transition name="fade">
      <div v-if="selectedRowKeys.length" class="bulk-bar">
        <div class="left">
          <strong>{{ selectedRowKeys.length }}</strong>개 선택됨
        </div>
        <div class="right">
          <a-button @click="bulkVisible(true)">선택 공개</a-button>
          <a-button @click="bulkVisible(false)">선택 비공개</a-button>
          <a-button @click="bulkResetReports" :disabled="!canBulkReset">신고수 초기화</a-button>
          <a-popconfirm title="선택한 댓글을 삭제할까요?" @confirm="bulkDelete">
            <a-button danger>선택 삭제</a-button>
          </a-popconfirm>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { debounce } from 'lodash-es'
import { adminCommentAPI } from '@/utils/apiAdminComment'

export default {
  name: 'AdminCommentListView',
  setup() {
    const reasonLabels = {
      SPAM: "스팸/광고",
      ABUSE: "욕설/괴롭힘",
      INAPPROPRIATE: "부적절한 내용",
      PERSONAL_INFO: "개인정보 노출",
      ILLEGAL: "불법/범죄",
      ETC: "기타"
    }

    const loading = ref(false)
    const onlyPending = ref(true)

    // ✅ 기본 카테고리 = 전체
    const category = ref('ALL')

    const q = reactive({
      keyword: '',
      status: 'ALL',
      reason: undefined,
      range: [],
      minReports: 0,
      sort: 'REPORT_DESC',
      reportedOnly: false
    })

    const onReasonChange = (v) => {
      q.reason = v || undefined
      pagination.current = 1
      fetch()
    }

    const categoryOptions = [
      { label: '전체', value: 'ALL' },
      { label: '신고', value: 'REPORTED' },
      { label: '만료', value: 'EXPIRED' },
      { label: '숨김', value: 'HIDDEN' }
    ]

    const onCategoryChange = (v) => {
      switch (v) {
        case 'ALL':
          q.status = 'ALL';
          q.reportedOnly = false;
          onlyPending.value = false;
          break
        case 'REPORTED':
          q.status = 'REPORTED';
          q.reportedOnly = undefined;
          onlyPending.value = false
          break
        case 'EXPIRED':
          q.status = 'EXPIRED';
          q.reportedOnly = undefined;
          onlyPending.value = false
          break
        case 'HIDDEN':
          q.status = 'HIDDEN';
          q.reportedOnly = undefined;
          onlyPending.value = false
          break
      }
      pagination.current = 1
      fetch()
    }

    const reasons = ['SPAM','ABUSE','INAPPROPRIATE','PERSONAL_INFO','ILLEGAL','ETC']

    const columns = [
      { title: '내용 / 메타', key: 'content', dataIndex: 'content', width: '44%' },
      { title: '신고', key: 'reports', dataIndex: 'reportCount', align: 'center', width: 120 },
      { title: '(48h)', key: 'sla', dataIndex: 'moderationDueAt', align: 'center', width: 140 },
      { title: '작성일', key: 'date', dataIndex: 'createdAt', align: 'center', width: 140 },
      { title: '작업', key: 'actions', align: 'center', width: 180, fixed: 'right' }
    ]

    const pagination = reactive({
      current: 1, pageSize: 10, total: 0,
      showSizeChanger: true, showQuickJumper: true,
      pageSizeOptions: ['10','20','50'],
      showTotal: (t, r) => `${r[0]}-${r[1]} / 총 ${t}개`
    })

    const selectedRowKeys = ref([])
    const rowSelection = computed(() => ({
         selectedRowKeys: selectedRowKeys.value,
         onChange: (keys) => (selectedRowKeys.value = keys)
       }))

    const rows = ref([])
    const total = ref(0)

    const statHidden = computed(() => rows.value.filter(r=>!r.isPublic).length)
    const statTempHidden = computed(() => rows.value.filter(r=>r.tempHidden).length)
    const statSlaSoon = computed(() => rows.value.filter(r=>slaColor(r)==='red').length)

      // 확장 시 신고 로그 로드
    const onExpand = async (expanded, record) => {
      if (!expanded) return
      if (record._loading || record._logsLoaded) return

      record._loading = true
      try {
        const logs = await adminCommentAPI.reportLogs(record.id) // <- 배열
        record.reports = Array.isArray(logs) ? logs : []
        record._logsLoaded = true
      } catch (error) {
        console.error('❌ 신고 로그 로딩 실패:', error)
        record.reports = []
        record._logsLoaded = false
        message.error('신고 로그를 불러오지 못했습니다.')
      } finally {
        record._loading = false
        const idx = rows.value.findIndex(r => r.id === record.id)
        if (idx !== -1) rows.value.splice(idx, 1, { ...record })
      }
    }


    // 확장 허용 (우선 항상 허용; 필요 시 조건으로 조정)
         const expandable = { rowExpandable: () => true }
    const now = () => new Date().getTime()
    const hoursLeft = (record) => {
      if (!record.moderationDueAt) return null
      const leftMs = new Date(record.moderationDueAt).getTime() - now()
      return Math.ceil(leftMs / 36e5)
    }
    const slaText = (record) => {
      const h = hoursLeft(record)
      if (h === null) return '-'
      return h >= 0 ? `${h}h 남음` : `${Math.abs(h)}h 초과`
    }
    const slaColor = (record) => {
      const h = hoursLeft(record)
      if (h === null) return 'default'
      if (h <= 0) return 'red'
      if (h <= 12) return 'orange'
      return 'green'
    }
    const slaTooltip = (record) => {
      if (!record.moderationDueAt) return '없음'
      return `마감: ${formatFull(record.moderationDueAt)}`
    }

    const badgeColor = (n) => (n>=10 ? '#f5222d' : n>=3 ? '#faad14' : n>0 ? '#87d068' : '#d9d9d9')
    const rowClassName = (r) => r.reportCount>=10 ? 'row-danger' : r.reportCount>=3 ? 'row-warn' : ''
    const formatDate = (d) => new Date(d).toLocaleDateString('ko-KR')
    const formatFull = (d) => new Date(d).toLocaleString('ko-KR')

    const rootEl = ref(null)
    const tableWrap = ref(null)
    const updateBarSize = () => {
      const wrap = tableWrap.value
      const root = rootEl.value
      if (!wrap || !root) return
      const rect = wrap.getBoundingClientRect()
      root.style.setProperty('--bar-left', rect.left + 'px')
      root.style.setProperty('--bar-width', rect.width + 'px')
    }

    const fetch = async () => {
      loading.value = true
      try {
        const page = await adminCommentAPI.list({ ...q, onlyPending: onlyPending.value }, pagination)
        const { content = [], totalElements = 0 } = page || {}
        rows.value = content.map(c => ({
          id: c.id,
          content: c.content,
          author: c.authorEmail ?? c.member?.email ?? '익명',
          postTitle: c.postTitle ?? c.post?.title ?? '-',
          isPublic: c.isPublic,
          tempHidden: c.isPublic === false && (c.reportCount ?? 0) >= 3,
          reportCount: c.reportCount ?? 0,
          topReason: c.topReason ?? null,
          createdAt: c.createdAt,
          moderationDueAt: c.moderationDueAt,
          // ▼ 로그 영역 기본 상태
          _loading: false,
          _logsLoaded: false,
          reports: []
        }))
        pagination.total = totalElements
        total.value = totalElements
        await nextTick(); requestAnimationFrame(updateBarSize)
      } catch {
        message.error('목록을 불러오지 못했습니다.')
      } finally {
        loading.value = false
      }
    }
    const debouncedFetch = debounce(fetch, 300)

    const onTableChange = (pag) => {
      pagination.current = pag.current
      pagination.pageSize = pag.pageSize
      fetch()
    }

    const reload = () => fetch()

    const toggleVisibility = async (record, visible) => {
      try {
        await adminCommentAPI.setVisibility(record.id, visible)
        record.isPublic = visible
        record.tempHidden = !visible && (record.reportCount ?? 0) >= 3
        message.success(`댓글 #${record.id} ${visible ? '공개' : '비공개'} 처리`)
      } catch {
        message.error('처리 실패')
      }
    }

    const resetReports = async (record) => {
      try {
        await adminCommentAPI.resetReports(record.id)
        // 서버에서 0건이면 복구되므로 프론트도 즉시 반영
        record.reportCount = 0
        record.topReason = null          // ✅ 대표 사유 칩 제거
        record.tempHidden = false
        record.isPublic = true           // (서비스 로직상 0건이면 복구) 즉시 반영
        record._logsLoaded = false
        record.reports = []

        // 필요 시 강제 반응성 갱신
        const idx = rows.value.findIndex(r => r.id === record.id)
        if (idx !== -1) rows.value.splice(idx, 1, { ...record })

        message.success(`댓글 #${record.id} 신고 초기화 완료`)
        requestAnimationFrame(updateBarSize)
      } catch {
        message.error('신고 초기화 실패')
      }
    }


    const removeOne = async (record) => {
      try {
        await adminCommentAPI.remove(record.id)
        rows.value = rows.value.filter(r => r.id !== record.id)
        pagination.total = Math.max(0, pagination.total - 1)
        message.success('삭제되었습니다')
        requestAnimationFrame(updateBarSize)
      } catch {
        message.error('삭제 실패')
      }
    }

    const canBulkReset = computed(() => {
      const set = new Set(selectedRowKeys.value)
      return rows.value.some(r => set.has(r.id) && r.reportCount>0)
    })

    const bulkVisible = async (vis) => {
      if (!selectedRowKeys.value.length) return
      try {
        await adminCommentAPI.bulkVisibility(selectedRowKeys.value, vis)
        const set = new Set(selectedRowKeys.value)
        rows.value.forEach(r => {
               if (set.has(r.id)) {
                   r.isPublic = vis
                   r.tempHidden = !vis && (r.reportCount ?? 0) >= 3
                   }
             })

        message.success(`선택 ${selectedRowKeys.value.length}건 ${vis?'공개':'비공개'} 전환`)
        selectedRowKeys.value = []
      } catch {
        message.error('일괄 처리 실패')
      }
    }

    const bulkResetReports = async () => {
      if (!selectedRowKeys.value.length) return
      try {
        await adminCommentAPI.bulkResetReports(selectedRowKeys.value)
        const set = new Set(selectedRowKeys.value)
        rows.value = rows.value.map(r => {
          if (!set.has(r.id)) return r
          return {
            ...r,
            reportCount: 0,
            topReason: null,       // ✅ 대표 사유 칩 제거
            tempHidden: false,
            isPublic: true,        // (0건 → 복구) 프론트 반영
            _logsLoaded: false,
            reports: []
          }
        })
        message.success('선택 신고수 초기화')
        selectedRowKeys.value = []
        requestAnimationFrame(updateBarSize)
      } catch {
        message.error('일괄 초기화 실패')
      }
    }


    const bulkDelete = async () => {
      if (!selectedRowKeys.value.length) return
      try {
        await adminCommentAPI.bulkDelete(selectedRowKeys.value)
        const set = new Set(selectedRowKeys.value)
        rows.value = rows.value.filter(r => !set.has(r.id))
        pagination.total = Math.max(0, pagination.total - set.size)
        message.success('선택 삭제 완료')
        selectedRowKeys.value = []
        requestAnimationFrame(updateBarSize)
      } catch {
        message.error('일괄 삭제 실패')
      }
    }

    // ✅ 드롭다운 메뉴 클릭 핸들러
    const onMenuClick = (info, record) => {
      if (info.domEvent) {
        info.domEvent.stopPropagation()
      }
      switch (info.key) {
        case 'reset':
          resetReports(record)
          break
        case 'toggle':
          toggleVisibility(record, !record.isPublic)
          break
        case 'delete':
          // 삭제는 Popconfirm 안에서 처리
          break
      }
    }

    onMounted(async () => {
      onCategoryChange(category.value)   // ✅ 첫 로딩 시에도 동기화 실행
      window.addEventListener('resize', updateBarSize)
      await nextTick(); updateBarSize()
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateBarSize)
    })

    return {
      loading, q, reasons, onlyPending,
      category, categoryOptions, onCategoryChange, onReasonChange,
      columns, rows, pagination, rowSelection, selectedRowKeys, expandable,
      total, statHidden, statTempHidden, statSlaSoon,
      formatDate, formatFull, badgeColor, rowClassName,
      slaText, slaColor, slaTooltip,
      fetch, debouncedFetch, onTableChange, reload,
      toggleVisibility, resetReports, removeOne,
      bulkVisible, bulkResetReports, bulkDelete, canBulkReset,
      rootEl, tableWrap,
      reasonLabels,
      onMenuClick,
      onExpand
    }
  }
}
</script>


<style scoped>
:root { --main:#00C851; --main2:#00A844; --bg:#f6f8f7; --txt:#262626; }

.admin-comments{
  --container: 1080px;      /* 중앙 콘텐츠 최대 너비 */
  --pad: 18px;              /* 좌우 페이지 패딩 */
  /* ✅ 하단바 동기화 기본값(안전) */
  --bar-left: var(--pad);
  --bar-width: min(var(--container), calc(100% - var(--pad)*2));

  background: var(--bg);
  min-height: 100vh;
  padding: var(--pad);
  padding-bottom: calc(120px + env(safe-area-inset-bottom));
}

/* 중앙 정렬/동일폭 */
.page-header,
.filters,
.kpis,
.table,
.table-wrap{
  max-width: var(--container);
  margin-left: auto;
  margin-right: auto;
}

/* Header */
.page-header {
  position: sticky; top: 0; z-index: 8; background: #fff;
  border: 1px solid #f0f0f0; border-radius: 14px; padding: 14px 16px;
  display:flex; align-items:center; justify-content:space-between; box-shadow: 0 4px 16px rgba(0,0,0,.04);
}
.title { margin:0; font-size:20px; font-weight:800; color:var(--txt); display:flex; align-items:center; gap:8px; }
.subtitle { margin:2px 0 0; color:#8c8c8c; font-size:12px; }
.accent-dot { width:10px; height:10px; background:var(--main); border-radius:50%; box-shadow:0 0 0 4px rgba(0,200,81,.15); display:inline-block; }
.ml8{margin-left:8px}
.switch-label{margin-left:6px; color:#666}
.w320{max-width:320px}
.w160{width:160px}
.w260{width:260px}
.seg :deep(.ant-segmented-item-selected){ background:rgba(0,200,81,.08); color:var(--main); border:1px solid rgba(0,200,81,.25); }

/* Filters */
.filters{
  display:flex; align-items:center; flex-wrap:wrap; gap:10px;
  background:#fff; border:1px solid #f0f0f0; padding:12px 14px; border-radius:14px; margin:12px 0 14px;
}
.min-report{display:flex; align-items:center; gap:6px}
.min-report .label{font-size:12px; color:#888}

/* KPIs */
.kpis{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin-bottom:12px; }
.kpi{ background:#fff; border:1px solid #f0f0f0; border-radius:12px; padding:10px 12px; box-shadow:0 6px 18px rgba(0,0,0,.04); }
.kpi .label{font-size:12px; color:#888}
.kpi .value{font-size:18px; font-weight:800; color:var(--txt)}
.kpi .value.muted{color:#999}
.kpi .value.warn{color:#fa8c16}
.kpi .value.danger{color:#cf1322}

/* Table */
.table{ background:#fff; border-radius:12px; overflow:hidden; }
.table :deep(.ant-table-thead>tr>th){ background:#fafafa; font-weight:700; color:var(--txt); border-bottom:2px solid var(--main) }
.table :deep(.ant-table-tbody>tr:hover>td){ background:#f6ffed; }
.row-danger td{ background:#fff1f0 !important }
.row-warn td{ background:#fffbe6 !important }
.content{ margin-bottom:6px }
.meta-line{ display:flex; gap:6px; flex-wrap:wrap }

/* Expand mini table */
.expand-wrap{ padding:8px 4px }
.mini-table{ width:100%; border-collapse:collapse; font-size:12px }
.mini-table th, .mini-table td{ border:1px solid #f0f0f0; padding:6px; text-align:left }

/* 선택바 스페이서 */
.bulk-pad{ height: 84px; }

/* ✅ 하단 고정 액션바: 테이블 폭/좌표에 딱 맞춤 */
.bulk-bar{
  position: fixed;
  bottom: calc(var(--pad) + env(safe-area-inset-bottom));
  left: var(--bar-left);
  width: var(--bar-width);
  background:#1f1f1f;
  color:#fff;
  border-radius:10px;
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 12px; gap:8px;
  box-shadow:0 12px 28px rgba(0,0,0,.25);
  z-index:1000;
}
.bulk-bar .right :deep(.ant-button){ margin-left:8px }
.fade-enter-active, .fade-leave-active{ transition: opacity .2s }
.fade-enter-from, .fade-leave-to{ opacity:0 }

@media (max-width: 768px){
  .kpis{ grid-template-columns:1fr 1fr }
  .page-header{ flex-direction:column; align-items:flex-start; gap:8px }
}
</style>

