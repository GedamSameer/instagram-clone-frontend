import api from './client'

export const createPost = (data) => api.post('/api/posts', data)
export const getPosts = () => api.get('/api/posts')
export const getPost = (id) => api.get(`/api/posts/${id}`)
export const updatePost = (id, data) => api.put(`/api/posts/${id}`, data)
export const deletePost = (id) => api.delete(`/api/posts/${id}`)
export const likePost = (id) => api.post(`/api/posts/${id}/like`)
export const unlikePost = (id) => api.delete(`/api/posts/${id}/like`)
export const getFeed = () => api.get('/api/feed')
export const savePost = (id) => api.post(`/api/posts/${id}/save`)
export const unsavePost = (id) => api.delete(`/api/posts/${id}/save`)
export const getSavedPosts = () => api.get('/api/users/me/saved-posts')
