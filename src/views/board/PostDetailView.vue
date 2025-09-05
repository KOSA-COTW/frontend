<script setup>
import { ref, onMounted, computed, watch, h } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { MoreOutlined } from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'   // ✅ Radio import 제거
import { useAuthStore } from '@/stores/auth'
import { usePaymentStore } from '@/stores/payment'
import { usePostStore } from '@/stores/post'
import { useCommentStore } from '@/stores/comment'

const mainColor = '#00C851'
const newComment = ref('')
const activeImage = ref('')

// ✅ 댓글 정렬 옵션/상태
const sortOptions = [
  { label: '최신순', value: 'LATEST' },
  { label: '응원순', value: 'LIKE' },
]
const sortLocal = ref('LATEST')

// 기부 모달 상태
const donationModalVisible = ref(false)
const donationAmount = ref(10000)
const customAmount = ref('')
const quickAmounts = [5000, 10000, 20000, 50000, 100000, 200000]

const commentStore = useCommentStore()
const { comments, loading: commentsLoading, error: commentsError } = storeToRefs(commentStore)
const onCloseCommentError = () => {
  commentStore.clearError?.()
}

const route = useRoute()
const router = useRouter()

const auth = useAuthStore()
const paymentStore = usePaymentStore()
const postStore = usePostStore()

// 항상 최신 라우트 id
const postId = computed(() => Number(route.params.id))

// 상태값
const post = ref(null)
const loading = ref(true)
const error = ref(null)

// 로그인 상태
const isLoggedIn = computed(() => auth.isLoggedIn)

// 신고 사유(백엔드 Enum과 일치)
const REPORT_REASONS = [
  { label: '스팸/광고', value: 'SPAM' },
  { label: '욕설/괴롭힘', value: 'ABUSE' },
  { label: '부적절/선정', value: 'INAPPROPRIATE' },
  { label: '개인정보 노출', value: 'PERSONAL_INFO' },
  { label: '불법/범죄', value: 'ILLEGAL' },
  { label: '기타', value: 'ETC' },
]


// 댓글 권한 확인
const isAdmin = computed(() => {
  const storedAuth = JSON.parse(localStorage.getItem('auth') || '{}')
  return storedAuth?.user?.role === 'ADMIN'
})

// ✅ 훨씬 탄탄한 본인 판별
const canManageComment = (comment) => {
  if (!comment) return false
  if (isAdmin.value) return true
  if (!auth.isLoggedIn) return false

  const persisted = JSON.parse(localStorage.getItem('auth') || '{}')

  // 내 정보
  const myId = Number(
    persisted?.user?.id ??
    persisted?.user?.memberId ??
    persisted?.memberId ??
    auth?.user?.id ??               // 핀리아 스토어에 user가 있다면
    auth?.user?.memberId
  )
  const myEmailRaw =
    persisted?.user?.username ??
    persisted?.user?.email ??
    auth?.user?.username ??
    auth?.user?.email
  const myEmail = typeof myEmailRaw === 'string' ? myEmailRaw.toLowerCase() : null

  // 댓글 작성자 정보 (응답 스키마 다양성 커버)
  const authorId = Number(
    comment?.memberId ??
    comment?.authorId ??
    comment?.writerId ??
    comment?.member?.id
  )
  const authorEmailRaw =
    comment?.authorEmail ??
    comment?.writerEmail ??
    comment?.member?.email
  const authorEmail = typeof authorEmailRaw === 'string' ? authorEmailRaw.toLowerCase() : null

  // 백엔드가 친절하게 내려줄 수도 있는 플래그
  if (comment?.isMine === true || comment?.mine === true) return true

  // 1순위: ID 매칭
  if (Number.isFinite(myId) && Number.isFinite(authorId) && myId === authorId) return true

  // 2순위: 이메일 매칭 (백엔드가 id 안 주는 경우)
  if (myEmail && authorEmail && myEmail === authorEmail) return true

  return false
}

// 비공개 댓글은 작성자/관리자만 보이게
const safeComments = computed(() =>
  (comments.value || [])
    .filter(Boolean)
    .filter(c => c.isPublic !== false || canManageComment(c))
)

onMounted(async () => {
  try {
    post.value = await postStore.fetchPostDetail(postId.value)
    if (post.value?.imageUrls?.length) {
      activeImage.value = post.value.imageUrls[0]
    }
    await loadComments()
  } catch (err) {
    error.value = '게시글을 불러오는 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
})

async function loadComments(id = postId.value) {
  try {
    await commentStore.fetchComments(id, 'LATEST')
    sortLocal.value = commentStore.sortMode
  } catch (err) {
    console.error('[댓글] 목록 조회 실패:', err)
    if (err?.response?.status === 401) {
      message.warning('댓글을 보려면 로그인이 필요합니다.')
    } else {
      message.error('댓글을 불러오는데 실패했습니다.')
    }
  }
}

// ✅ 정렬 전환
async function onChangeSort(v) {
  await commentStore.fetchComments(postId.value, v)
  sortLocal.value = v
}

// ✅ 더보기
async function onLoadMore() {
  await commentStore.loadMore(postId.value)
}

// 라우트 id 변경 시 갱신
watch(() => route.params.id, async (newId) => {
  if (!newId) return
  loading.value = true
  try {
    const detail = await postStore.fetchPostDetail(Number(newId))
    post.value = detail
    activeImage.value = detail?.imageUrls?.[0] || ''
    await loadComments(Number(newId))
  } catch (e) {
    console.error('[라우트 변경] 상세/댓글 로딩 실패:', e)
    error.value = '게시글을 불러오는 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
})

// 댓글 작성
async function addComment() {
  if (!newComment.value.trim()) {
    message.warning('댓글 내용을 입력해주세요.')
    return
  }
  if (!auth.isLoggedIn) {
    Modal.warning({
      title: '로그인이 필요합니다',
      content: '댓글을 작성하려면 로그인해주세요.',
      onOk: () => router.push('/login'),
    })
    return
  }
  try {
    await commentStore.addComment(postId.value, newComment.value.trim())
    newComment.value = ''
    message.success('댓글이 등록되었습니다.')
  } catch (err) {
    const status = err?.response?.status
    if (status === 401) {
      Modal.warning({
        title: '로그인이 필요합니다',
        content: '로그인 후 다시 시도해주세요.',
        onOk: () => router.push('/login'),
      })
    } else if (status === 403) {
      message.error('댓글 작성 권한이 없습니다.')
    } else {
      message.error(err?.response?.data?.message || '댓글 작성에 실패했습니다.')
    }
  }
}

// 댓글 수정
async function editComment(commentId, currentContent) {
  let newContent = currentContent
  Modal.confirm({
    title: '댓글 수정',
    content: h('div', {}, [
      h('div', { style: 'margin-bottom:8px;color:#666;font-size:12px;' }, '내용을 수정하세요.'),
      h('div', {}, [
        h('input', {
          value: currentContent,
          style: 'width:100%;border:1px solid #eee;border-radius:6px;padding:8px;',
          onInput: (e) => { newContent = e?.target?.value ?? '' }
        })
      ])
    ]),
    okText: '수정',
    cancelText: '취소',
    async onOk() {
      const value = (newContent || '').trim()
      if (!value) {
        message.warning('내용을 입력해주세요.')
        throw new Error('내용 없음') // 모달 닫힘 방지
      }
      try {
        await commentStore.updateComment(commentId, value)
        message.success('댓글이 수정되었습니다.')
      } catch (err) {
        console.error('[댓글] 수정 실패:', err)
        message.error(err?.response?.data?.message || '댓글 수정에 실패했습니다.')
        throw err
      }
    }
  })
}

// 댓글 삭제
async function deleteComment(commentId) {
  Modal.confirm({
    title: '댓글을 삭제하시겠습니까?',
    content: '삭제된 댓글은 복구할 수 없습니다.',
    okText: '삭제',
    okButtonProps: { danger: true },
    cancelText: '취소',
    async onOk() {
      try {
        await commentStore.deleteComment(commentId)
        message.success('댓글이 삭제되었습니다.')
      } catch (err) {
        console.error('[댓글] 삭제 실패:', err)
        message.error(err?.response?.data?.message || '댓글 삭제에 실패했습니다.')
      }
    }
  })
}

// 게시글 수정/삭제 권한
const canManage = computed(() => {
  const storedAuth = JSON.parse(localStorage.getItem('auth') || '{}')
  const myId = storedAuth?.user?.id || null
  const myEmail = storedAuth?.user?.username || null
  const isAdminRole = storedAuth?.user?.role === 'ADMIN'
  const authorId = post.value?.authorId
  const authorEmail = post.value?.authorEmail
  if (isAdminRole) return true
  if (authorId && myId) return myId === authorId
  if (authorEmail && myEmail) return myEmail === authorEmail
  return false
})

async function deletePost() {
  if (!auth.isLoggedIn) {
    Modal.warning({
      title: '로그인이 필요합니다',
      content: '로그인 후 다시 시도해주세요.',
      onOk: () => router.push('/login'),
    })
    return
  }
  if (!canManage.value) {
    Modal.error({
      title: '삭제 권한이 없습니다',
      content: '본인이 작성한 글만 삭제할 수 있습니다.',
    })
    return
  }
  Modal.confirm({
    title: '정말 삭제하시겠습니까?',
    okText: '삭제',
    okButtonProps: { danger: true },
    cancelText: '취소',
    async onOk() {
      try {
        await postStore.deletePost(postId.value)
        message.success('삭제 완료!')
        router.push('/')
      } catch (err) {
        const status = err?.response?.status
        if (status === 401) {
          Modal.warning({
            title: '로그인이 필요합니다',
            content: '로그인 후 다시 시도해주세요.',
            onOk: () => router.push('/login'),
          })
        } else if (status === 403) {
          Modal.error({
            title: '삭제 권한이 없습니다',
            content: '본인이 작성한 글만 삭제할 수 있습니다.',
          })
        } else if (status === 404) {
          message.error('존재하지 않는 게시글입니다.')
          router.replace('/posts')
        } else if (err?.code === 'ERR_NETWORK') {
          message.error('서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
        } else {
          message.error(err?.response?.data?.message || '삭제 중 오류가 발생했습니다.')
        }
      }
    },
  })
}

// 좋아요 클릭
async function onToggleLike(c) {
  if (!isLoggedIn.value) {
    message.warning('로그인이 필요합니다.')
    router.push('/login')
    return
  }
  try {
    await commentStore.toggleLike(c.id)
  } catch (err) {
    const code = err?.response?.status
    if (code === 401) {
      message.warning('로그인이 필요합니다.')
      router.push('/login')
    } else {
      message.error(err?.response?.data?.message || '좋아요 처리 중 오류가 발생했습니다.')
    }
  }
}

/* ===========================
   실무형: 컨트롤드 신고 모달
   =========================== */
const reportModalVisible = ref(false)
const reportTargetId = ref(null)
const selectedReason = ref(REPORT_REASONS[0].value)
const submittingReport = ref(false)

function openReport(c) {
  if (!isLoggedIn.value) {
    message.warning('로그인이 필요합니다.')
    router.push('/login')
    return
  }
  reportTargetId.value = c.id
  selectedReason.value = REPORT_REASONS[0].value
  reportModalVisible.value = true
}

async function submitReport() {
  if (!reportTargetId.value) return
  submittingReport.value = true
  try {
    await commentStore.reportComment(reportTargetId.value, selectedReason.value)
    message.success('신고가 접수되었습니다.')
    reportModalVisible.value = false
  } catch (err) {
    const status = err?.response?.status
    if (status === 409) {
      message.warning('이미 신고한 댓글입니다.')
    } else if (status === 429) {
      message.warning('하루 신고 한도를 초과했습니다.')
    } else if (status === 400) {
      message.error(err?.response?.data?.message || '잘못된 요청입니다.')
    } else {
      message.error(err?.response?.data?.message || '신고 처리 중 오류가 발생했습니다.')
    }
  } finally {
    submittingReport.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    return diffInMinutes <= 0 ? '방금 전' : `${diffInMinutes}분 전`
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`
  } else if (diffInHours < 24 * 7) {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}일 전`
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

function editPost() {
  router.push(`/posts/${postId.value}/edit`)
}

// 기부 모달 / 결제
function openDonationModal() {
  if (!auth.isLoggedIn) {
    message.warning('로그인이 필요합니다.')
    router.push('/login')
    return
  }
  if (isAdmin.value) {
    router.push(`/admin/donations/${postId.value}`)
    return
  }
  donationModalVisible.value = true
}

function closeDonationModal() {
  donationModalVisible.value = false
  donationAmount.value = 10000
  customAmount.value = ''
}

function setQuickAmount(amount) {
  donationAmount.value = amount
  customAmount.value = ''
}

function setCustomAmount() {
  const amount = parseInt(customAmount.value)
  if (amount && amount >= 1000) {
    donationAmount.value = amount
  } else {
    message.error('최소 기부 금액은 1,000원입니다.')
  }
}

function proceedToPayment() {
  if (donationAmount.value < 1000) {
    message.error('최소 기부 금액은 1,000원입니다.')
    return
  }
  paymentStore.setDonationAmount(donationAmount.value)
  closeDonationModal()
  const url = `/payment/checkout/${postId.value}?title=${encodeURIComponent(post.value?.title || '')}&category=${encodeURIComponent(post.value?.category || '')}`
  window.location.href = url
}
</script>

<template>
  <div class="detail-root" v-if="post">
    <!-- 상단 카테고리 뱃지 & 제목 -->
    <div class="badge-row">
      <span class="badge">{{ post.category }}</span>
    </div>
    <div class="title-row">
      <h2 class="detail-title">{{ post.title }}</h2>
      <a-dropdown v-if="canManage" placement="bottomRight">
        <a class="ant-dropdown-link" @click.prevent>
          <more-outlined style="font-size: 20px; cursor: pointer;" />
        </a>
        <template #overlay>
          <a-menu>
            <a-menu-item @click="editPost">수정하기</a-menu-item>
            <a-menu-item danger @click="deletePost">삭제하기</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>

    <div class="main-row">
      <div class="main-left">
        <div v-if="post.imageUrls?.length" class="gallery">
          <div class="main-view">
            <img :src="activeImage" alt="main image" />
          </div>
          <div class="thumbs">
            <img
              v-for="img in post.imageUrls"
              :key="img"
              :src="img"
              :alt="`첨부 이미지`"
              :class="{ active: activeImage === img }"
              @click="activeImage = img"
            />
          </div>
        </div>
        <!-- fallback -->
        <div v-else class="img-wrap">
          <img class="main-img" src="https://placehold.co/300x180" />
        </div>
      </div>

      <div class="main-right">
        <div class="progress-card">
          <div class="progress-header">
            <span>마감까지 {{ post.remaining }}원</span>
            <span class="percent">{{ post.percent }}%</span>
          </div>
          <a-progress :percent="post.percent" :stroke-color="mainColor" :show-info="false" />
          <div class="current">
            {{ post.currentAmount ? post.currentAmount + '원 모금' : '---' }}
          </div>
          <div class="progress-info">
            <div>모금 시작일 <span>{{ post.createdAt }}</span></div>
            <div>모금목표 <span>{{ post.amount }}원</span></div>
            <div>후원잔액까지 <span>{{ post.remaining }}원</span></div>
            <div>총 참여인원 <span>{{ post.donorCount }}명</span></div>
            <div v-if="post.overfunded > 0">초과모금 <span style="color: #00C851;">{{ post.overfunded }}원</span></div>
            <div>마감까지 <span>{{ post.daysLeft }}일</span></div>
          </div>
          <a-button
            type="primary"
            class="donate-btn"
            :style="{background: mainColor, borderColor: mainColor}"
            @click="openDonationModal"
            :disabled="post.status === 'COMPLETED' && !isAdmin"
          >
            <template v-if="post.status === 'COMPLETED' && !isAdmin">마감됨</template>
            <template v-else-if="isAdmin">기부내역보기</template>
            <template v-else>곧장기부하기</template>
          </a-button>
        </div>
      </div>
    </div>

    <!-- 상세 내용 -->
    <div class="desc-section">
      <div class="desc-title">
        기부금이 <span style="color:#FFC107">곧장</span>
      </div>
      <div class="desc-box">
        <div class="desc-block" v-html="post.content"></div>
      </div>
      <div class="stat-row">
        <div class="stat-col" v-for="(s, idx) in post.stat" :key="idx">
          <div class="stat-label">
            <template v-if="idx === 0">미취학</template>
            <template v-else-if="idx === 1">초등학교 저학년</template>
            <template v-else-if="idx === 2">초등학교 고학년</template>
            <template v-else>중학생 이상</template>
          </div>
          <div class="stat-value">{{ s }}</div>
        </div>
      </div>
    </div>

    <!-- 댓글/한마디 영역 -->
    <div class="comment-section">
      <div class="comment-title">
        따뜻한 <span style="color:#FFC107;">한마디</span>
      </div>

      <!-- ✅ 정렬 탭 -->
      <div class="comment-toolbar">
        <a-segmented
          v-model:value="sortLocal"
          :options="sortOptions"
          @change="onChangeSort"
          size="small"
        />
      </div>

      <!-- 댓글 입력 -->
      <div class="comment-input-row">
        <a-input
          v-model:value="newComment"
          placeholder="따뜻한 댓글을 남겨주세요!"
          @keyup.enter="addComment"
          :disabled="commentsLoading"
          allow-clear
          size="large"
          style="width:70%;margin-right:8px;"
        />
        <a-button
          type="primary"
          size="large"
          :style="{background: mainColor, borderColor: mainColor}"
          @click="addComment"
          :loading="commentsLoading"
        >
          등록
        </a-button>
      </div>

      <div class="comment-count">
        댓글 <span style="color:#00C851;">{{ commentStore.totalCount }}</span>
      </div>

      <div v-if="commentsLoading && safeComments.length === 0" class="comment-loading">
        <a-spin size="small" /> 댓글을 불러오는 중...
      </div>

      <div v-else-if="commentsError" class="comment-error">
        <a-alert
          :message="commentsError"
          type="warning"
          show-icon
          closable
          @close="onCloseCommentError"
        />
      </div>

      <div v-else-if="safeComments.length === 0" class="no-comments">
        등록된 한마디가 없습니다.
      </div>

      <!-- 댓글 목록 -->
      <ul v-else class="comment-list">
        <li v-for="c in safeComments" :key="c.id" class="comment-item">
          <div class="comment-header">
            <div class="comment-author">
              <span class="author-name">
                {{ c.authorEmail ? c.authorEmail.split('@')[0] + '@***' : `#${c.memberId}` }}
              </span>
              <span class="comment-date">{{ formatDate(c.createdAt) }}</span>
            </div>

            <a-dropdown v-if="canManageComment(c)" placement="bottomRight">
              <a class="ant-dropdown-link" @click.prevent>
                <more-outlined style="font-size: 16px; color: #999;" />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="editComment(c.id, c.content)">수정</a-menu-item>
                  <a-menu-item danger @click="deleteComment(c.id)">삭제</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>

          <div class="comment-content">{{ c.content }}</div>

          <div class="comment-actions">
            <!-- 좋아요 버튼 -->
            <button
              class="like-btn"
              :disabled="commentStore.likeLoading?.has?.(c.id)"
              @click="onToggleLike(c)"
              :aria-pressed="!!c.liked"
              :title="c.liked ? '좋아요 취소' : '좋아요'"
            >
              <span v-if="c.liked">❤️</span>
              <span v-else>🤍</span>
              <span class="count">{{ c.likeCount || 0 }}</span>
            </button>

            <!-- 신고 -->
            <template v-if="!c.alreadyReported">
              <button
                class="report-btn"
                :disabled="commentStore.reportLoading?.has?.(c.id)"
                @click="openReport(c)"
                title="신고하기"
              >
                🚩 신고
              </button>
            </template>
            <template v-else>
              <span class="report-label">🚩 신고됨</span>
            </template>
          </div>
        </li>
      </ul>

      <!-- ✅ 더보기 -->
      <div v-if="!commentStore.last && safeComments.length > 0" class="more-row">
        <a-button @click="onLoadMore" :loading="commentStore.loadingMore" block>
          더보기
        </a-button>
      </div>
    </div>

    <!-- 신고 모달: 컨트롤드 -->
    <a-modal
      v-model:open="reportModalVisible"
      title="이 댓글을 신고하시겠습니까?"
      :confirm-loading="submittingReport"
      @ok="submitReport"
      ok-text="신고"
      cancel-text="취소"
    >
      <a-radio-group v-model:value="selectedReason" style="display:flex;flex-direction:column;gap:8px;margin-top:6px;">
        <a-radio v-for="r in REPORT_REASONS" :key="r.value" :value="r.value">{{ r.label }}</a-radio>
      </a-radio-group>
      <div style="margin-top:10px;color:#999;font-size:12px;">
        허위 신고 시 이용 제한될 수 있습니다.
      </div>
    </a-modal>

    <!-- 기부 모달 -->
    <a-modal
      v-model:open="donationModalVisible"
      title="기부하기"
      :footer="null"
      width="500px"
      @cancel="closeDonationModal"
    >
      <div class="donation-modal">
        <div class="modal-post-info">
          <h3>{{ post?.title }}</h3>
          <p class="modal-description">{{ post?.category }}에 기부합니다</p>
        </div>

        <div class="amount-section">
          <h4>기부 금액</h4>
          <div class="quick-amounts">
            <button
              v-for="amount in quickAmounts"
              :key="amount"
              @click="setQuickAmount(amount)"
              class="quick-amount-btn"
              :class="{ active: donationAmount === amount }"
            >
              {{ amount.toLocaleString() }}원
            </button>
          </div>

          <div class="custom-amount">
            <a-input
              v-model:value="customAmount"
              placeholder="직접 입력"
              @blur="setCustomAmount"
              @keyup.enter="setCustomAmount"
              style="margin-top: 12px;"
            >
              <template #suffix>원</template>
            </a-input>
          </div>

          <div class="selected-amount">
            <span>선택된 금액: </span>
            <span class="amount-display">{{ donationAmount.toLocaleString() }}원</span>
          </div>
        </div>

        <div class="modal-footer">
          <a-button @click="closeDonationModal" style="margin-right: 8px;">
            취소
          </a-button>
          <a-button
            type="primary"
            :style="{background: mainColor, borderColor: mainColor}"
            @click="proceedToPayment"
          >
            {{ donationAmount.toLocaleString() }}원 기부하기
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>

  <div v-else style="text-align:center;padding:100px 0;">잘못된 접근입니다.</div>
</template>

<style scoped>
.comment-toolbar {
  display:flex;
  justify-content:flex-end;
  margin: 6px 0 10px;
}

.more-row {
  margin-top: 8px;
}

.comment-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
  color: #666;
  font-size: 14px;
}

.comment-error {
  margin-bottom: 16px;
}

.comment-item {
  background: #f6f6f6;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 10px;
  font-size: 15px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.comment-date {
  color: #888;
  font-size: 12px;
}

.comment-content {
  color: #444;
  line-height: 1.5;
  margin-bottom: 8px;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.like-btn,
.report-btn {
  font-size: 12px;
  color: #555;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 14px;
  transition: all 0.2s;
  border: 1px solid #eee;
  background: #fff;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.like-btn[aria-pressed="true"] { border-color:#ff6b81; }
.like-btn:hover { background: #fff7f8; }
.report-btn:hover { background: #fff7f0; }

.detail-root {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 10px 60px 10px;
  font-family: 'Noto Sans KR', sans-serif;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-title {
  font-size: 21px;
  font-weight: 700;
  margin: 0;
}

.badge-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.badge {
  background: #F5F5F5;
  color: #333;
  border-radius: 12px;
  font-size: 13px;
  padding: 3px 10px;
  font-weight: 500;
}

.main-row {
  display: flex;
  gap: 28px;
  align-items: flex-start;
}

.main-left {
  flex: 1 1 350px;
}

.main-right {
  flex: 0 0 310px;
}

.img-wrap {
  width: 100%;
  height: 220px;
  border-radius: 16px;
  position: relative;
  background: #f9f9f9;
  overflow: hidden;
}

.main-img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 16px;
}

.progress-card {
  background: #fff;
  border-radius: 16px;
  padding: 26px 18px 22px 18px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
}

.progress-header {
  font-size: 17px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.percent {
  font-size: 22px;
  font-weight: 800;
  color: #00C851;
}

.current {
  margin: 10px 0 14px 0;
  font-size: 18px;
  font-weight: 600;
  color: #222;
}

.progress-info {
  margin-bottom: 22px;
  font-size: 14px;
  color: #888;
  line-height: 1.7;
}

.progress-info span {
  float: right;
  color: #111;
  font-weight: 500;
}

.donate-btn {
  width: 100%;
  height: 46px;
  font-size: 17px;
  font-weight: bold;
}

.desc-section {
  margin-top: 44px;
  background: #FCFCF6;
  border-radius: 18px;
  padding: 32px 22px 24px 22px;
}

.desc-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
}

.desc-box {
  display: flex;
  gap: 30px;
  font-size: 14px;
  color: #444;
  margin-bottom: 24px;
}

.desc-block {
  flex: 1;
  min-width: 180px;
  line-height: 1.6;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  background: #fff;
  border-radius: 10px;
  padding: 20px 10px;
  gap: 12px;
}

.stat-col {
  text-align: center;
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #888;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 20px;
  color: #00C851;
  font-weight: 700;
}

.comment-section {
  margin-top: 54px;
}

.comment-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 18px;
}

.comment-input-row {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}

.comment-count {
  margin-bottom: 10px;
  color: #333;
  font-size: 15px;
  font-weight: 500;
}

.no-comments {
  color: #bbb;
  padding: 30px 0 20px 0;
  font-size: 15px;
  text-align: center;
}

.comment-list {
  margin: 0;
  padding: 0 0 14px 0;
  list-style: none;
}

/* 갤러리 */
.gallery .main-view img {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 12px;
}

.gallery .thumbs {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  overflow-x: auto;
}

.gallery .thumbs img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.6;
}

.gallery .thumbs img.active {
  border: 2px solid #00C851;
  opacity: 1;
}
</style>
