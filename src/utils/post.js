// utils/post.js
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
    console.error('[PostAPI] Failed to read token:', e)
  }
  return extra
}

export const postAPI = {
  // 메인: 공개 + 마감 임박 6개
  getHomePosts: async () => {
    try {
      const response = await api.get('/api/posts/home')
      return response
    } catch (error) {
      console.error('[PostAPI] getHomePosts failed:', error)
      throw error
    }
  },

  // 전체 공개글
  getAllPublicPosts: async () => {
    const response = await api.get('/api/posts')
    return response
  },

  // 단건 조회 (공개/비공개 혼합: 토큰 있으면 함께 보냄)
  getPostById: async (postId) => {
    const response = await api.get(`/api/posts/${postId}`)
    return response
  },

  // 내가 쓴 글 (인증 필요)
  getMyPosts: async () => {
    try {
      const response = await api.get('/api/posts/me', buildAccessConfig())
      return response
    } catch (error) {
      console.error('[PostAPI] getMyPosts failed:', error)
      throw error
    }
  },

  // 생성
  createPost: async (postData) => {
    const response = await api.post('/api/posts', postData)
    return response
  },

  // 수정
  updatePost: async (postId, updateData) => {
    try {
      const response = await api.patch(`/api/posts/${postId}`, updateData, buildAccessConfig())
      return response
    } catch (error) {
      console.error('[PostAPI] updatePost failed:', error)
      throw error
    }
  },

  // 삭제
  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/api/posts/${postId}`, buildAccessConfig())
      return response
    } catch (error) {
      console.error('[PostAPI] deletePost failed:', error)
      throw error
    }
  },

  // 공개 여부 변경
  changeVisibility: async (postId, isPublic) => {
    try {
      const response = await api.patch(
        `/api/posts/${postId}/visibility`,
        null,
        buildAccessConfig({ params: { isPublic } }),
      )
      return response
    } catch (error) {
      console.error('[PostAPI] changeVisibility failed:', error)
      throw error
    }
  },

  // 공지사항
  getAllNotices: async () => {
    try {
      const response = await api.get('/api/notices')
      return response
    } catch (error) {
      console.error('[PostAPI] getAllNotices failed:', error)
      throw error
    }
  },

  getNoticeById: async (id) => {
    try {
      const response = await api.get(`/api/notices/${id}`)
      return response
    } catch (error) {
      console.error('[PostAPI] getNoticeById failed:', error)
      throw error
    }
  },

  createNotice: async (data) => {
    try {
      const response = await api.post('/api/notices', data, buildAccessConfig())
      return response
    } catch (error) {
      console.error('[PostAPI] createNotice failed:', error)
      throw error
    }
  },

  updateNotice: async (id, data) => {
    try {
      const response = await api.patch(`/api/notices/${id}`, data, buildAccessConfig())
      return response
    } catch (error) {
      console.error('[PostAPI] updateNotice failed:', error)
      throw error
    }
  },

  deleteNotice: async (id) => {
    try {
      const response = await api.delete(`/api/notices/${id}`, buildAccessConfig())
      return response
    } catch (error) {
      console.error('[PostAPI] deleteNotice failed:', error)
      throw error
    }
  },

  uploadImage: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await api.post('/api/posts/upload', formData, {
        ...buildAccessConfig(),
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.url
    } catch (error) {
      console.error('[PostAPI] uploadImage failed:', error)
      throw error
    }
  },
  changeVisibilityBulk: async (postIds, isPublic) => {
    try {
      return await api.patch('/api/posts/visibility', {
        postIds,
        isPublic,
      })
    } catch (err) {
      console.error('[PostAPI] changeVisibilityBulk failed:', err)
      throw err
    }
  },
}
