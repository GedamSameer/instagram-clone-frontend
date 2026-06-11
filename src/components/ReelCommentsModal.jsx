import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getReelComments, createReelComment, deleteReelComment } from '../api/reels'
import CommentsList from './CommentsList'
import CommentInput from './CommentInput'

export default function ReelCommentsModal({ reel, onClose, onCommentAdded: notifyParent }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState(null) // { commentId, userId, username }

  useEffect(() => {
    getReelComments(reel.id)
      .then(res => setComments(res.data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }, [reel.id])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleCommentAdded = (newComment) => {
    if (newComment.parent_comment_id) {
      setComments(prev => prev.map(c =>
        c.id === newComment.parent_comment_id
          ? { ...c, replies: [...(c.replies || []), newComment] }
          : c
      ))
    } else {
      setComments(prev => [...prev, { ...newComment, replies: [] }])
    }
    notifyParent?.()
    setReplyTo(null)
  }

  const handleDeleteComment = async (comment) => {
    try {
      await deleteReelComment(reel.id, comment.id)
      if (comment.parent_comment_id) {
        setComments(prev => prev.map(c =>
          c.id === comment.parent_comment_id
            ? { ...c, replies: (c.replies || []).filter(r => r.id !== comment.id) }
            : c
        ))
      } else {
        setComments(prev => prev.filter(c => c.id !== comment.id))
      }
    } catch {}
  }

  const handleReply = (target) => {
    const commentId = target.parent_comment_id || target.id
    setReplyTo({ commentId, userId: target.user_id, username: target.user?.username })
  }

  return (
    <div
      className="fixed inset-0 z-60 flex items-end justify-center sm:items-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-[#1c1c1c] w-full sm:max-w-md sm:rounded-xl rounded-t-2xl flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#363636] shrink-0">
          <span className="text-white font-semibold text-sm">Comments</span>
          <button onClick={onClose} className="text-white hover:text-[#a8a8a8] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Caption */}
        {reel.caption && (
          <div className="px-4 py-3 border-b border-[#262626] shrink-0">
            <p className="text-sm text-white">
              <span className="font-semibold mr-1">{reel.user?.username}</span>
              {reel.caption}
            </p>
          </div>
        )}

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <CommentsList
              post={{ ...reel, image_url: reel.thumbnail_url, caption: '' }}
              comments={comments}
              currentUserId={user?.id}
              onDeleteComment={handleDeleteComment}
              onReply={handleReply}
            />
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#363636] px-4 py-3 shrink-0">
          <CommentInput
            onCreate={async (body) => {
              const res = await createReelComment(
                reel.id,
                body,
                replyTo?.commentId ?? null,
                replyTo?.userId ?? null,
              )
              return res.data.comment
            }}
            onCommentAdded={handleCommentAdded}
            autoFocus
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </div>
      </div>
    </div>
  )
}
