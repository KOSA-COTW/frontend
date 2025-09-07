
import api from '@/utils/axios'


export const fetchAdminDashboard = (start, end) => {
  const params = {}
  if (start) params.start = start
  if (end) params.end = end

  return api.get('/api/admin/dashboard', { params })
}
