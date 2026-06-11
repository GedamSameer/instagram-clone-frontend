import api from './client'

export const getStoryFeed = () => api.get('/api/stories/feed')
export const createStory = (data) => api.post('/api/stories', data)
export const createStories = (data) => api.post('/api/stories/batch', data)
export const getStory = (id) => api.get(`/api/stories/${id}`)
export const deleteStory = (id) => api.delete(`/api/stories/${id}`)
export const getUserStories = (userId) => api.get(`/api/users/${userId}/stories`)
export const viewStory = (id) => api.post(`/api/stories/${id}/view`)
export const getStoryViewers = (id) => api.get(`/api/stories/${id}/viewers`)
