// utils/post.js
import api from './axios.js'

export const postAPI = {
  // 메인: 공개 + 마감 임박 6개
  getHomePosts: async () => {
    console.log('[PostAPI] getHomePosts called')
    const response = await api.get('/api/posts/home')
    return response
  },

  // 전체 공개글
  getAllPublicPosts: async () => {
    console.log('[PostAPI] getAllPublicPosts called')
    const response = await api.get('/api/posts')
    return response
  },

  // 단건 조회
  getPostById: async (postId) => {
    console.log('[PostAPI] getPostById:', postId)
    const response = await api.get(`/api/posts/${postId}`)
    return response
  },

  // 내가 쓴 글
  getMyPosts: async () => {
    console.log('[PostAPI] getMyPosts called')
    const response = await api.get('/api/posts/me')
    return response
  },

  // 생성 (ADMIN/ORGANIZATION) -> 서버에서 Long(id) 반환
  createPost: async (postData) => {
    console.log('[PostAPI] createPost payload:', postData)
    const response = await api.post('/api/posts', postData)
    return response
  },

  // 수정 (작성자/관리자)
  updatePost: async (postId, updateData) => {
    console.log('[PostAPI] updatePost:', postId, updateData)
    const response = await api.patch(`/api/posts/${postId}`, updateData)
    return response
  },

  // 삭제 (작성자/관리자)
  deletePost: async (postId) => {
    console.log('[PostAPI] deletePost:', postId)
    const response = await api.delete(`/api/posts/${postId}`)
    return response
  },

  // 공개 여부 변경 (관리자)
  changeVisibility: async (postId, isPublic) => {
    console.log('[PostAPI] changeVisibility:', { postId, isPublic })
    // 쿼리 파라미터 방식 또는 params 옵션 모두 가능
    const response = await api.patch(`/api/posts/${postId}/visibility`, null, {
      params: { isPublic }
    })
    return response
  },
}
