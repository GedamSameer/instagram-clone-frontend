import api from './client'

export const getConversations = () => api.get('/api/messages/conversations')
export const createConversation = (userId) => api.post('/api/messages/conversations', { user_id: userId })
export const getMessages = (conversationId) => api.get(`/api/messages/conversations/${conversationId}/messages`)
export const sendMessage = (conversationId, body) => api.post(`/api/messages/conversations/${conversationId}/messages`, { body })
export const deleteMessage = (messageId) => api.delete(`/api/messages/${messageId}`)
export const sharePost = (postId, conversationIds) => api.post(`/api/messages/share/post/${postId}`, { conversation_ids: conversationIds })
export const shareReel = (reelId, conversationIds) => api.post(`/api/messages/share/reel/${reelId}`, { conversation_ids: conversationIds })
