
import api from '@/utils/axios' // 공용 axios (response.data만 반환)

export const adminCommentAPI = {
  async list(q, pagination) {
    // RangePicker(dayjs) → 서버가 기대하는 'YYYY-MM-DD'로 전송
    const from = q.range?.[0]
    const to   = q.range?.[1]
    const fromStr = from?.format ? from.startOf('day').format('YYYY-MM-DD') : undefined
    const toStr   = to?.format   ? to.add(1, 'day').startOf('day').format('YYYY-MM-DD') : undefined

    const params = {
      status: q.status,
      reason: q.reason || undefined,
      reportedOnly: q.reportedOnly,
      onlyPending: q.onlyPending,
      keyword: q.keyword || undefined,
      minReports: q.minReports ?? 0,
      sort: q.sort || 'REPORT_DESC',
      // 서버: createdAt >= :from AND createdAt < :to
      from: fromStr,
      to:   toStr,
      page: pagination.current,  // 1-base (백엔드에서 -1 처리)
      size: pagination.pageSize
    }

    // axios 인터셉터가 data만 반환하므로 그대로 반환
    return await api.get('/api/admin/comments', { params })
  },

  async reportLogs(commentId) {
    try {
      const data = await api.get(`/api/admin/comments/${commentId}/report-logs`)
      console.log('🚀 reportLogs 응답:', data)
      return data
    } catch (err) {
      console.error('❌ reportLogs 에러:', err)
      throw err
    }
  },

  async setVisibility(commentId, visible) {
    return await api.patch(`/api/admin/comments/${commentId}/visibility`, { visible })
  },

  async resetReports(commentId) {
    return await api.post(`/api/admin/comments/${commentId}/reset-reports`)
  },

  async remove(commentId) {
    return await api.delete(`/api/admin/comments/${commentId}`)
  },

  async bulkVisibility(ids, visible) {
    return await api.post(`/api/admin/comments/bulk/visibility?visible=${visible}`, { ids })
  },

  async bulkResetReports(ids) {
    return await api.post(`/api/admin/comments/bulk/reset-reports`, { ids })
  },

  async bulkDelete(ids) {
    return await api.post(`/api/admin/comments/bulk/delete`, { ids })
  }
}
