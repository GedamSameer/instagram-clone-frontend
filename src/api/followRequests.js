import api from './client'

export const getFollowRequests = () => api.get('/api/follow-requests')
export const acceptFollowRequest = (id) => api.post(`/api/follow-requests/${id}/accept`)
export const rejectFollowRequest = (id) => api.delete(`/api/follow-requests/${id}`)
