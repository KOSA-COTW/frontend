// stores/comment.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { commentAPI } from '@/utils/comment'

export const useCommentStore = defineStore('comment', () => {
  const comments = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 액션 로딩 세트 (중복 클릭 방지)
  const likeLoading = ref(new Set())     // commentId 저장
  const reportLoading = ref(new Set())   // commentId 저장

  // 목록 가져오기
  const fetchComments = async (postId, sort = 'LATEST') => {
    loading.value = true
    error.value = null
    try {
      const page = await commentAPI.getComments(postId, sort)
      const content = page?.content ?? page // Page or Array 모두 대응
      comments.value = Array.isArray(content) ? content : []
    } catch (err) {
      error.value = err.response?.data?.message || '댓글을 불러오는데 실패했습니다.'
      comments.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  // 작성 (작성 후 전체 재조회)
  const addComment = async (postId, content) => {
    if (!content?.trim()) throw new Error('댓글 내용을 입력해주세요.')
    try {
      const res = await commentAPI.createComment(postId, content.trim())
      await fetchComments(postId)
      return res
    } catch (err) {
      error.value = err.response?.data?.message || '댓글 작성에 실패했습니다.'
      throw err
    }
  }

  // 수정 (낙관적 적용)
  const updateComment = async (commentId, content) => {
    try {
      const updated = await commentAPI.updateComment(commentId, content)
      const idx = comments.value.findIndex(c => c.id === commentId)
      if (idx !== -1) comments.value[idx] = { ...comments.value[idx], ...updated }
      return updated
    } catch (err) {
      error.value = err.response?.data?.message || '댓글 수정에 실패했습니다.'
      throw err
    }
  }

  // 삭제
  const deleteComment = async (commentId) => {
    try {
      await commentAPI.deleteComment(commentId)
      comments.value = comments.value.filter(c => c.id !== commentId)
    } catch (err) {
      error.value = err.response?.data?.message || '댓글 삭제에 실패했습니다.'
      throw err
    }
  }

  // 좋아요 토글 (멱등 + 낙관적 업데이트)
  const toggleLike = async (commentId) => {
    if (likeLoading.value.has(commentId)) return
    likeLoading.value.add(commentId)

    const idx = comments.value.findIndex(c => c.id === commentId)
    if (idx === -1) { likeLoading.value.delete(commentId); return }

    const before = comments.value[idx]
    const likedNext = !before.liked
    const likeDelta = likedNext ? +1 : -1

    // 낙관적 반영
    comments.value[idx] = {
      ...before,
      liked: likedNext,
      likeCount: Math.max(0, (before.likeCount || 0) + likeDelta),
    }

    try {
      if (likedNext) await commentAPI.like(commentId)
      else await commentAPI.unlike(commentId)
    } catch (err) {
      // 롤백
      comments.value[idx] = before
      throw err
    } finally {
      likeLoading.value.delete(commentId)
    }
  }

  // 신고 (낙관적 + 롤백)
  const reportComment = async (commentId, reason) => {
    if (reportLoading.value.has(commentId)) return
    reportLoading.value.add(commentId)

    const idx = comments.value.findIndex(c => c.id === commentId)
    if (idx === -1) { reportLoading.value.delete(commentId); return }

    const before = comments.value[idx]
    comments.value[idx] = {
      ...before,
      reportCount: (before.reportCount ?? 0) + 1
    }

    try {
      await commentAPI.report(commentId, reason)
      // 백엔드 정책상 isPublic=false로 내려오면 재조회나 제거를 고려
      // if (comments.value[idx]?.isPublic === false) {
      //   comments.value.splice(idx, 1)
      // }
    } catch (err) {
      // 롤백
      comments.value[idx] = before
      error.value = err.response?.data?.message || '신고 처리에 실패했습니다.'
      throw err
    } finally {
      reportLoading.value.delete(commentId)
    }
  }

  const clearError = () => { error.value = null }

  return {
    comments,
    loading,
    error,
    likeLoading,
    reportLoading,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
    toggleLike,
    reportComment,
    clearError,
  }
})
