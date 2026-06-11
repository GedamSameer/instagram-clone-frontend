import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { MoreHorizontal, X } from 'lucide-react'
import { getPost, likePost, unlikePost, savePost, unsavePost, updatePost, deletePost } from '../api/posts'
import { createComment, getComments, deleteComment } from '../api/comments'
import { useAuth } from '../auth/AuthContext'
import Avatar from './Avatar'
import PostActions from './PostActions'
import ShareModal from './ShareModal'
import CommentsList from './CommentsList'
import CommentInput from './CommentInput'
import { timeAgo } from '../utils/time'

export default function PostDetailModal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState(null) // { commentId, userId, username }
  const [showShare, setShowShare] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)
  const backdropRef = useRef(null)

  const focusComment = location.state?.focusComment ?? false

  useEffect(() => {
    Promise.all([getPost(id), getComments(id)])
      .then(([postRes, commentsRes]) => {
        setPost(postRes.data.post)
        setCaption(postRes.data.post.caption || '')
        setComments(commentsRes.data.comments || [])
      })
      .finally(() => setLoading(false))
  }, [id])

  const isOwner = user?.id === post?.user_id

  const handleUpdate = async () => {
    setSaving(true)
    try {
      await updatePost(post.id, { caption })
      setPost(prev => ({ ...prev, caption }))
      setEditing(false)
    } catch {}
    setSaving(false)
  }

  const handleDelete = async () => {
    try {
      await deletePost(post.id)
      handleClose()
    } catch {}
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleClose = () => navigate(-1)

  const handleLike = async () => {
    if (!user) return
    try {
      const res = post.liked_by_me
        ? await unlikePost(post.id)
        : await likePost(post.id)
      setPost(prev => ({ ...prev, like_count: res.data.like_count, liked_by_me: res.data.liked_by_me }))
    } catch {}
  }

  const handleSave = async () => {
    if (!user) return
    try {
      if (post.saved_by_me) {
        await unsavePost(post.id)
        setPost(prev => ({ ...prev, saved_by_me: false }))
      } else {
        await savePost(post.id)
        setPost(prev => ({ ...prev, saved_by_me: true }))
      }
    } catch {}
  }

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
    setPost(prev => ({ ...prev, comment_count: (prev.comment_count || 0) + 1 }))
    setReplyTo(null)
  }

  const handleDeleteComment = async (comment) => {
    try {
      await deleteComment(id, comment.id)
      if (comment.parent_comment_id) {
        setComments(prev => prev.map(c =>
          c.id === comment.parent_comment_id
            ? { ...c, replies: (c.replies || []).filter(r => r.id !== comment.id) }
            : c
        ))
      } else {
        setComments(prev => prev.filter(c => c.id !== comment.id))
      }
      setPost(prev => ({ ...prev, comment_count: Math.max(0, (prev.comment_count || 1) - 1) }))
    } catch {}
  }

  const handleReply = (target) => {
    // target can be a top-level comment or a reply; always use root as parent
    const commentId = target.parent_comment_id || target.id
    setReplyTo({ commentId, userId: target.user_id, username: target.user?.username })
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={e => { if (e.target === backdropRef.current) handleClose() }}
    >
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white hover:text-[#a8a8a8] transition-colors z-10"
        aria-label="Close"
      >
        <X size={28} />
      </button>

      {loading ? (
        <div className="bg-[#1c1c1c] w-full max-w-5xl mx-4 h-[85vh] rounded-sm flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !post ? (
        <div className="bg-[#1c1c1c] w-full max-w-5xl mx-4 h-[85vh] rounded-sm flex items-center justify-center">
          <p className="text-[#a8a8a8]">Post not found.</p>
        </div>
      ) : (
        <div
          className="flex bg-black border border-[#262626] w-full max-w-5xl mx-4 rounded-sm overflow-hidden"
          style={{ height: 'min(90vh, 700px)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* LEFT: Image */}
          <div className="flex-none w-[60%] bg-black flex items-center justify-center border-r border-[#262626] overflow-hidden">
            <img
              src={post.image_url}
              alt="post"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* RIGHT: Content */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] shrink-0">
              <Link to={`/users/${post.user?.id}`} onClick={handleClose} className="shrink-0">
                <Avatar username={post.user?.username} src={post.user?.profile_picture_url} userId={post.user?.id} size={32} />
              </Link>
              <Link
                to={`/users/${post.user?.id}`}
                onClick={handleClose}
                className="text-sm font-semibold text-white hover:opacity-80 flex-1 min-w-0 truncate"
              >
                {post.user?.username}
              </Link>
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowMenu(v => !v)}
                  className="text-white hover:text-[#a8a8a8] transition-colors"
                >
                  <MoreHorizontal size={20} />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-7 bg-[#262626] border border-[#363636] rounded-lg shadow-lg z-20 min-w-40 overflow-hidden">
                      {isOwner && (
                        <>
                          <button
                            onClick={() => { setEditing(true); setShowMenu(false) }}
                            className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#363636] transition-colors"
                          >
                            Edit caption
                          </button>
                          <button
                            onClick={() => { setShowMenu(false); handleDelete() }}
                            className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-[#363636] transition-colors"
                          >
                            Delete post
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Inline caption editor (owner only) */}
            {editing && (
              <div className="border-b border-[#262626] px-4 py-3 shrink-0">
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full bg-[#121212] border border-[#363636] rounded p-2.5 text-sm text-white focus:outline-none focus:border-[#a8a8a8] resize-none placeholder:text-[#737373]"
                  rows={3}
                  placeholder="Write a caption..."
                />
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="text-sm font-semibold text-[#0095f6] hover:text-white disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setCaption(post.caption || '') }}
                    className="text-sm text-[#a8a8a8] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable comments body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
              <CommentsList
                post={post}
                comments={comments}
                currentUserId={user?.id}
                onDeleteComment={handleDeleteComment}
                onReply={handleReply}
              />
            </div>

            {/* Actions + meta */}
            <div className="border-t border-[#262626] px-4 pt-3 pb-2 shrink-0">
              <PostActions
                post={post}
                onLike={handleLike}
                onSave={handleSave}
                onShare={() => setShowShare(true)}
                className="mb-2"
              />
              {post.like_count > 0 && (
                <p className="text-sm font-semibold text-white mb-0.5">
                  {post.like_count.toLocaleString()} {post.like_count === 1 ? 'like' : 'likes'}
                </p>
              )}
              <p className="text-[10px] text-[#a8a8a8] tracking-wide">
                {timeAgo(post.created_at)}
              </p>
            </div>

            {/* Comment input */}
            <div className="border-t border-[#262626] px-4 py-3 shrink-0">
              <CommentInput
                onCreate={async (body) => {
                  const res = await createComment(
                    post.id,
                    body,
                    replyTo?.commentId ?? null,
                    replyTo?.userId ?? null,
                  )
                  return res.data.comment
                }}
                onCommentAdded={handleCommentAdded}
                autoFocus={focusComment}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
              />
            </div>
          </div>
        </div>
      )}

      {showShare && post && <ShareModal postId={post.id} onClose={() => setShowShare(false)} />}
    </div>
  )
}
