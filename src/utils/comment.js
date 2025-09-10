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
    return await api.post(
      '/api/comments',
      { postId, content },
      buildAccessConfig(),
    )
  },

  // 수정
  updateComment: async (commentId, content) => {
    return await api.patch(
      `/api/comments/${commentId}`,
      { content },
      buildAccessConfig(),
    )
  },

  // 삭제
  deleteComment: async (commentId) => {
    return await api.delete(
      `/api/comments/${commentId}`,
      buildAccessConfig(),
    )
  },

  // ✅ 좋아요
  like: async (commentId) => {
    return await api.post(
      `/api/comments/${commentId}/likes`,
      null,
      buildAccessConfig(),
    )
  },

  unlike: async (commentId) => {
    return await api.delete(
      `/api/comments/${commentId}/likes`,
      buildAccessConfig(),
    )
  },

  report: async (commentId, payload) => {
    const body = typeof payload === 'string' ? { reason: payload } : payload
    return await api.post(
      `/api/comments/${commentId}/reports`,
      body,
      buildAccessConfig(),
    )
  },
}
