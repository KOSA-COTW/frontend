// stores/post.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { postAPI } from '@/utils/post'

export const usePostStore = defineStore('post', () => {
  const posts = ref([]) // 전체 공개글 목록
  const myPosts = ref([]) // 내가 작성한 글 목록
  const postDetail = ref(null) // 단건 조회용
  const loading = ref(false)
  const error = ref(null)
  const selectedCategory = ref(null) // 선택된 카테고리

  const donationTotal = ref(0)

  // 총액 불러오기 액션
  const fetchDonationTotal = async () => {
    try {
      donationTotal.value = await postAPI.getDonationTotal()
    } catch (err) {
      console.error('fetchDonationTotal failed:', err)
      donationTotal.value = 0
    }
  }

  // 필터된 목록
  const filteredPosts = computed(() => {
    if (!selectedCategory.value) return posts.value
    return posts.value.filter(p => p.category === selectedCategory.value)
  })

  // 합계(전체/필터 반영)
  const totalPostAll = computed(() =>
    // posts.value.reduce((sum, p) => sum + (p.currentAmount || 0), 0)
    donationTotal.value
  )
  const totalPostFiltered = computed(() =>
    filteredPosts.value.reduce((sum, p) => sum + (p.currentAmount || 0), 0)
  )

  // 카테고리 설정 액션
  const setCategory = (name) => {
    selectedCategory.value = name
  }

  const clearCategory = () => {
    selectedCategory.value = null
  }

  // id로 상세 게시글 조회 (computed 반환)
  const getPostById = (id) => {
    return computed(() => posts.value.find(item => item.id === Number(id)))
  }

  // 메인용 6개: 공개 + 마감임박
  const fetchPostsHome = async () => {
    loading.value = true
    error.value = null
    try {
      posts.value = await postAPI.getHomePosts()
    } catch (err) {
      error.value = err.response?.data?.message || '메인 게시글을 불러오는데 실패했습니다.'
      console.error('Home posts fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  // 전체 공개글
  const fetchPostsAll = async () => {
    loading.value = true
    error.value = null
    try {
      posts.value = await postAPI.getAllPublicPosts()
    } catch (err) {
      error.value = err.response?.data?.message || '공개 게시글을 불러오는데 실패했습니다.'
      console.error('Public posts fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  // 내가 쓴 글 조회
  const fetchMyPosts = async () => {
    loading.value = true
    error.value = null
    try {
      myPosts.value = await postAPI.getMyPosts()
    } catch (err) {
      error.value = err.response?.data?.message || '내 게시글을 불러오는데 실패했습니다.'
      console.error('My posts fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  // id로 상세 게시글 조회
  const fetchPostDetail = async (postId) => {
    loading.value = true
    error.value = null
    try {
      postDetail.value = await postAPI.getPostById(postId)
      return postDetail.value
    } catch (err) {
      error.value = err.response?.data?.message || '게시글을 불러오는데 실패했습니다.'
      console.error('Post detail fetch error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 게시글 생성
  const createPost = async (postData) => {
    loading.value = true
    error.value = null
    try {
      const imageUrls = []
      for (const f of files) {
        const url = await postAPI.uploadImage(f)
        imageUrls.push(url)
      }

      const payload = { ...postData, imageUrls }
      const response = await postAPI.createPost(payload)

      // 생성 후 관련 목록 갱신
      await fetchMyPosts()
      await fetchPostsHome()
      return response
    } catch (err) {
      error.value = err.response?.data?.message || '게시글 작성에 실패했습니다.'
      console.error('Post creation error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 게시글 수정
  const updatePost = async (postId, updateData) => {
    loading.value = true
    error.value = null
    try {
      console.log(`[PostStore] Updating post ${postId}:`, updateData)
      const response = await postAPI.updatePost(postId, updateData)
      // 관련 목록들 갱신
      await fetchMyPosts()
      await fetchPostsHome()
      await fetchPostsAll()
      return response
    } catch (err) {
      error.value = err.response?.data?.message || '게시글 수정에 실패했습니다.'
      console.error('Post update error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 게시글 삭제
  const deletePost = async (postId) => {
    loading.value = true
    error.value = null
    try {
      console.log(`[PostStore] Deleting post: ${postId}`)
      const response = await postAPI.deletePost(postId)
      // 관련 목록들 갱신
      await fetchMyPosts()
      await fetchPostsHome()
      await fetchPostsAll()
      return response
    } catch (err) {
      error.value = err.response?.data?.message || '게시글 삭제에 실패했습니다.'
      console.error('Post deletion error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 공개 여부 변경 (관리자)
  const changePostVisibility = async (postId, isPublic) => {
    loading.value = true
    error.value = null
    try {
      console.log(`[PostStore] Changing visibility for post ${postId} to: ${isPublic}`)
      const response = await postAPI.changeVisibility(postId, isPublic)
      // 관련 목록들 갱신
      await fetchPostsHome()
      await fetchPostsAll()
      return response
    } catch (err) {
      error.value = err.response?.data?.message || '공개 여부 변경에 실패했습니다.'
      console.error('Post visibility change error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    posts,
    myPosts,
    loading,
    error,
    selectedCategory,
    filteredPosts,
    totalPostAll,
    totalPostFiltered,
    setCategory,
    clearCategory,
    getPostById,
    fetchPostsHome,
    fetchPostsAll,
    fetchMyPosts,
    fetchPostDetail,
    createPost,
    updatePost,
    deletePost,
    changePostVisibility,
    donationTotal,
    fetchDonationTotal
  }
}, { persist: true })
