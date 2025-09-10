
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { commentAPI } from '@/utils/comment'

export const useCommentStore = defineStore('comment', () => {
  const comments = ref([])
  const totalCount = ref(0)
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref(null)

  // 새로 추가된 상태
  const sortMode = ref('LATEST')   // 'LATEST' | 'LIKE'
  const page = ref(0)
  const size = ref(10)             // ✅ 요청당 10개
  const last = ref(false)          // 마지막 페이지 여부

  const likeLoading = ref(new Set())
  const reportLoading = ref(new Set())

  // 내부 공통 fetch (append 여부로 분기)
  const _fetch = async (postId, sort = sortMode.value, pageNo = page.value, append = false) => {
    const busy = append ? loadingMore : loading
    busy.value = true
    error.value = null
    try {
      const res = await commentAPI.getComments(postId, sort, pageNo, size.value)
      const list = res?.content ?? (Array.isArray(res) ? res : [])
      totalCount.value = res?.totalElements ?? list.length
      last.value = !!res?.last || (list.length < size.value)

      comments.value = append ? [...comments.value, ...list] : list
    } catch (err) {
      error.value = err?.response?.data?.message || '댓글을 불러오는데 실패했습니다.'
      if (!append) {
        comments.value = []
        totalCount.value = 0
        last.value = true
      }
      throw err
    } finally {
      busy.value = false
    }
  }

  // 최초/정렬 변경 시 호출
  const fetchComments = async (postId, sort = 'LATEST') => {
    sortMode.value = sort
    page.value = 0
    last.value = false
    await _fetch(postId, sort, 0, false)
  }

  // 더보기
  const loadMore = async (postId) => {
    if (last.value || loadingMore.value) return
    page.value += 1
    await _fetch(postId, sortMode.value, page.value, true)
  }

  // 작성 (리스트 초기화해서 현재 정렬 기준으로 다시 1페이지 로드)
  const addComment = async (postId, content) => {
    if (!content?.trim()) throw new Error('댓글 내용을 입력해주세요.')
    try {
      await commentAPI.createComment(postId, content.trim())
      await fetchComments(postId, sortMode.value) // ✅ 현재 정렬 유지
    } catch (err) {
      error.value = err?.response?.data?.message || '댓글 작성에 실패했습니다.'
      throw err
    }
  }

  const updateComment = async (commentId, content) => {
    try {
      const updated = await commentAPI.updateComment(commentId, content)
      const idx = comments.value.findIndex(c => c.id === commentId)
      if (idx !== -1) comments.value[idx] = { ...comments.value[idx], ...updated }
      return updated
    } catch (err) {
      error.value = err?.response?.data?.message || '댓글 수정에 실패했습니다.'
      throw err
    }
  }

  const deleteComment = async (commentId) => {
    try {
      await commentAPI.deleteComment(commentId)
      comments.value = comments.value.filter(c => c.id !== commentId)
      totalCount.value = Math.max(0, totalCount.value - 1)
    } catch (err) {
      error.value = err?.response?.data?.message || '댓글 삭제에 실패했습니다.'
      throw err
    }
  }

  const toggleLike = async (commentId) => {
    if (likeLoading.value.has(commentId)) return
    likeLoading.value.add(commentId)

    const idx = comments.value.findIndex(c => c.id === commentId)
    if (idx === -1) { likeLoading.value.delete(commentId); return }

    const before = comments.value[idx]
    const likedNext = !before.liked
    const likeDelta = likedNext ? +1 : -1

    comments.value[idx] = {
      ...before,
      liked: likedNext,
      likeCount: Math.max(0, (before.likeCount || 0) + likeDelta),
    }

    try {
      if (likedNext) await commentAPI.like(commentId)
      else await commentAPI.unlike(commentId)
    } catch (err) {
      comments.value[idx] = before
      throw err
    } finally {
      likeLoading.value.delete(commentId)
    }
  }

  const reportComment = async (commentId, payloadOrReason) => {
    if (reportLoading.value.has(commentId)) return
    reportLoading.value.add(commentId)

    // 하위 호환: 문자열이 넘어오면 객체로 변환
    const payload = typeof payloadOrReason === 'string'
      ? { reason: payloadOrReason }
      : (payloadOrReason || {})

    const idx = comments.value.findIndex(c => c.id === commentId)
    if (idx === -1) { reportLoading.value.delete(commentId); return }

    const before = comments.value[idx]
    // 낙관적 업데이트
    comments.value[idx] = {
      ...before,
      reportCount: (before.reportCount ?? 0) + 1,
      alreadyReported: true,
    }

    try {
      const res = await commentAPI.report(commentId, payload)
      comments.value[idx] = {
        ...comments.value[idx],
        reportCount: res?.totalReportCount ?? comments.value[idx].reportCount,
        alreadyReported: true,
        isPublic: res?.hidden !== undefined ? !res.hidden : comments.value[idx].isPublic,
        moderationDueAt: res?.moderationDue ?? comments.value[idx].moderationDueAt,
      }
    } catch (err) {
      // 롤백
      comments.value[idx] = before
      error.value = err?.response?.data?.message || '신고 처리에 실패했습니다.'
      throw err
    } finally {
      reportLoading.value.delete(commentId)
    }
  }

  const clearError = () => { error.value = null }

  return {
    // state
    comments, totalCount, loading, loadingMore, error,
    sortMode, page, size, last,
    likeLoading, reportLoading,
    // actions
    fetchComments, loadMore, addComment, updateComment, deleteComment,
    toggleLike, reportComment, clearError,
  }
})
