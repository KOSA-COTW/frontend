// utils/comment.js
import api from './axios.js'

function buildAccessConfig(extra = {}) {
  try {
    const token = JSON.parse(localStorage.getItem('auth') || '{}')?.accessToken
    if (token) {
      return {
        ...extra,
        headers: {
          ...(extra.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      }
    }
  } catch (e) {
    console.error('[CommentAPI] Failed to read token:', e)
  }
  return extra
}

/**
 * Axios 인터셉터에서 response.data 만 반환하도록 설정되어 있음.
 * → 아래 메서드들은 모두 res(=data) 그대로 반환합니다.
 */
export const commentAPI = {
  // 목록 (정렬 + 페이지네이션)
  getComments: async (postId, sort = 'LATEST', page = 0, size = 10) => {
    return await api.get(
      '/api/comments',
      buildAccessConfig({
        params: { postId, sort, page, size },
      }),
    )
  },

  // 작성
  createComment: async (postId, content) => {
    try {
      const res = await api.post(
        '/api/comments',
        { postId, content },
        buildAccessConfig(),
      )
      return res
    } catch (error) {
      throw error
    }
  },

  // 수정
  updateComment: async (commentId, content) => {
    try {
      const res = await api.patch(
        `/api/comments/${commentId}`,
        { content },
        buildAccessConfig(),
      )
      return res
    } catch (error) {
      throw error
    }
  },

  // 삭제
  deleteComment: async (commentId) => {
    try {
      const res = await api.delete(
        `/api/comments/${commentId}`,
        buildAccessConfig(),
      )
      return res
    } catch (error) {
      throw error
    }
  },

  // ✅ 좋아요
  like: async (commentId) => {
    const res = await api.post(
      `/api/comments/${commentId}/likes`,
      null,
      buildAccessConfig(),
    )
    return res
  },

  unlike: async (commentId) => {
    const res = await api.delete(
      `/api/comments/${commentId}/likes`,
      buildAccessConfig(),
    )
    return res
  },

  // ✅ 신고
  report: async (commentId, reason) => {
    const res = await api.post(
      `/api/comments/${commentId}/reports`,
      { reason }, // e.g. 'SPAM' | 'ABUSE' | 'INAPPROPRIATE'
      buildAccessConfig(),
    )
    return res
  },
}
