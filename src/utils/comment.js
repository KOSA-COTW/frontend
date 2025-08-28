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

export const commentAPI = {
  getComments: async (postId, sort = 'LATEST', page = 0, size = 20) => {
    try {
      const res = await api.get('/api/comments', buildAccessConfig({
        params: { postId, sort, page, size },
      }))
      return res
    } catch (error) {
      throw error
    }
  },

  createComment: async (postId, content) => {
    try {
      const res = await api.post(
        '/api/comments',
        { postId, content },
        buildAccessConfig()
      )
      return res
    } catch (error) {
      throw error
    }
  },

  updateComment: async (commentId, content) => {
    try {
      const res = await api.patch(
        `/api/comments/${commentId}`,
        { content },
        buildAccessConfig()
      )
      return res
    } catch (error) {
      throw error
    }
  },

  deleteComment: async (commentId) => {
    try {
      const res = await api.delete(
        `/api/comments/${commentId}`,
        buildAccessConfig()
      )
      return res ?? true
    } catch (error) {
      throw error
    }
  },
  // ✅ 좋아요
  like: async (commentId) => {
    const res = await api.post(`/api/comments/${commentId}/likes`, null, buildAccessConfig())
    return res.data ?? res
  },
  unlike: async (commentId) => {
    const res = await api.delete(`/api/comments/${commentId}/likes`, buildAccessConfig())
    return res.data ?? res
  },

  // ✅ 신고
  report: async (commentId, reason) => {
    const res = await api.post(
      `/api/comments/${commentId}/reports`,
      { reason }, // e.g. 'SPAM' | 'ABUSE' | 'INAPPROPRIATE'
      buildAccessConfig()
    )
    return res.data ?? res
  },
}

