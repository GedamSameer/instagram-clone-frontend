import api from './client'

export const getComments = (postId) => api.get(`/api/posts/${postId}/comments`)
export const createComment = (postId, body, parentCommentId = null, replyToUserId = null) =>
  api.post(`/api/posts/${postId}/comments`, { body, parent_comment_id: parentCommentId, reply_to_user_id: replyToUserId })
export const deleteComment = (postId, commentId) => api.delete(`/api/posts/${postId}/comments/${commentId}`)

export const likeComment = (commentId) => api.post(`/api/comments/${commentId}/like`)
export const unlikeComment = (commentId) => api.delete(`/api/comments/${commentId}/like`)
