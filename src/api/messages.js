import api from './client'

export const getConversations = () => api.get('/api/messages/conversations')
export const createConversation = (userId) => api.post('/api/messages/conversations', { user_id: userId })
export const getMessages = (conversationId) => api.get(`/api/messages/conversations/${conversationId}/messages`)
export const sendMessage = (conversationId, body) => api.post(`/api/messages/conversations/${conversationId}/messages`, { body })
export const deleteMessage = (messageId) => api.delete(`/api/messages/${messageId}`)
