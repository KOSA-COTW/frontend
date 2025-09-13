// utils/post.js
import api from './axios.js'
import axios from 'axios'

export const postAPI = {
  // 메인: 공개 + 마감 임박 6개
  getHomePosts: async () => {
    const response = await api.get('/api/posts/home')
    return response
  },

  // 기부금 총액
  getDonationTotal: async () => {
    try {
      const response = await axios.get('/api/public/donation-total')
      return response.data.totalWon
    } catch (e) {
      console.error('[DonationAPI] getDonationTotal failed: ', e)
      throw e
    }
  },

  // 전체 공개글
  getAllPublicPosts: async () => {
    const response = await api.get('/api/posts')
    return response
  },

  // 게시글 단건 조회
  getPostById: async (postId) => {
    const response = await api.get(`/api/posts/${postId}`)
    return response
  },

  // 내가 쓴 게시글 전체 조회
  getMyPosts: async () => {
    const response = await api.get('/api/posts/me')
    return response
  },

  // 게시글 생성
  createPost: async (postData) => {
    const response = await api.post('/api/posts', postData)
    return response
  },

  // 게시글 수정
  updatePost: async (postId, updateData) => {
    const response = await api.patch(`/api/posts/${postId}`, updateData)
    return response
  },

  // 게시글 삭제
  deletePost: async (postId) => {
    const response = await api.delete(`/api/posts/${postId}`)
    return response
  },

  // 게시글 공개 여부 변경
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

  // 공지사항 전체 조회
  getAllNotices: async () => {
    const response = await api.get('/api/notices')
    return response
  },

  // 공지사항 단건 조회
  getNoticeById: async (id) => {
    const response = await api.get(`/api/notices/${id}`)
    return response
  },

  // 공지사항 생성
  createNotice: async (data) => {
    const response = await api.post('/api/notices', data)
    return response
  },

  // 공지사항 수정
  updateNotice: async (id, data) => {
    const response = await api.patch(`/api/notices/${id}`, data)
    return response
  },

  // 공지사항 삭제
  deleteNotice: async (id) => {
    const response = await api.delete(`/api/notices/${id}`)
    return response
  },

  // 이미지 업로드
  uploadImage: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/api/posts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.url
    } catch (error) {
      console.error('[PostAPI] uploadImage failed:', error)
      throw error
    }
  },

  // 여러 이미지 업로드
  uploadImages: async (files) => {
    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })

      const response = await api.post('/api/posts/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.url
    } catch (error) {
      console.error('[PostAPI] uploadImages failed:', error)
      throw error
    }
  },

  // presigned URL 발급
  getPresignedUrl: async (fileName, contentType) => {
    const response = await api.get('/api/posts/presigned-url', {
      params: { fileName, contentType },
    })
    return response.url
  },

  // 승인 요청
  requestApproval: async (postId) => {
    return api.post(`/api/posts/${postId}/request-approval`)
  },

  // 승인 취소
  cancelApproval: async (postId) => {
    return api.post(`/api/posts/${postId}/cancel-approval`)
  },
}
