
import api from '@/utils/axios.js'

// 회원 목록 조회
export function fetchMembers(params) {
  return api.get('/api/admin/members', { params })
}

// 단일 회원 상세 조회
export function getMember(id) {
  return api.get(`/api/admin/members/${id}`)
}

// 회원 프로필 수정
export function updateMember(id, payload) {
  return api.put(`/api/admin/members/${id}`, payload)
}

// 회원 권한 수정
export function updateMemberRole(id, payload) {
  return api.patch(`/api/admin/members/${id}/roles`, payload)
}

// 단일 회원 삭제
export function deleteMember(id) {
  return api.delete(`/api/admin/members/${id}`)
}

// 여러 회원 삭제
export function bulkDeleteMembers(ids) {
  return api.post('/api/admin/members/bulk-delete', { ids })
}

// 여러 회원 상태 일괄 변경
export function bulkUpdateMemberStatus(ids, status) {
  return api.post('/api/admin/members/bulk-status', { ids, status })
}
