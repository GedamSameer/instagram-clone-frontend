import api from './client'

export const getReels = (skip = 0, limit = 10) => api.get(`/api/reels?skip=${skip}&limit=${limit}`)
export const getReelFeed = (skip = 0, limit = 10) => api.get(`/api/reels/feed?skip=${skip}&limit=${limit}`)
export const getReel = (id) => api.get(`/api/reels/${id}`)
export const createReel = (data) => api.post('/api/reels', data)
export const updateReel = (id, data) => api.put(`/api/reels/${id}`, data)
export const deleteReel = (id) => api.delete(`/api/reels/${id}`)

export const likeReel = (id) => api.post(`/api/reels/${id}/like`)
export const unlikeReel = (id) => api.delete(`/api/reels/${id}/like`)

export const saveReel = (id) => api.post(`/api/reels/${id}/save`)
export const unsaveReel = (id) => api.delete(`/api/reels/${id}/save`)

export const getReelComments = (id) => api.get(`/api/reels/${id}/comments`)
export const createReelComment = (id, body, parentCommentId = null, replyToUserId = null) =>
  api.post(`/api/reels/${id}/comments`, { body, parent_comment_id: parentCommentId, reply_to_user_id: replyToUserId })
export const deleteReelComment = (reelId, commentId) => api.delete(`/api/reels/${reelId}/comments/${commentId}`)

export const getSavedReels = () => api.get('/api/users/me/saved-reels')
export const getUserReels = (userId) => api.get(`/api/users/${userId}/reels`)
