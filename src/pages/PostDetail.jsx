import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MoreHorizontal, Smile } from 'lucide-react'
import { getPost, updatePost, deletePost, likePost, unlikePost } from '../api/posts'
import { getComments, createComment, deleteComment } from '../api/comments'
import { useAuth } from '../auth/AuthContext'
import PostCard from '../components/PostCard'
import Avatar from '../components/Avatar'
import { timeAgo } from '../utils/time'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [comments, setComments] = useState([])
  const [commentBody, setCommentBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getPost(id)
      .then(res => {
        setPost(res.data.post)
        setCaption(res.data.post.caption || '')
      })
      .catch(() => setError('Post not found'))
      .finally(() => setLoading(false))

    getComments(id)
      .then(res => setComments(res.data.comments || []))
      .catch(() => {})
  }, [id])

  const isOwner = user && post && user.id === post.user_id

  const handleLike = async (p) => {
    if (!user) return navigate('/login')
    try {
      const res = p.liked_by_me ? await unlikePost(p.id) : await likePost(p.id)
      setPost(prev => ({ ...prev, like_count: res.data.like_count, liked_by_me: res.data.liked_by_me }))
    } catch {}
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      const res = await updatePost(id, { caption })
      setPost(res.data.post)
      setEditing(false)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    try {
      await deletePost(id)
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete')
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentBody.trim()) return
    setSubmitting(true)
    try {
      const res = await createComment(id, commentBody.trim())
      setComments(prev => [...prev, res.data.comment])
      setCommentBody('')
      setPost(prev => ({ ...prev, comment_count: (prev.comment_count || 0) + 1 }))
    } catch {} finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (comment) => {
    try {
      await deleteComment(id, comment.id)
      setComments(prev => prev.filter(c => c.id !== comment.id))
      setPost(prev => ({ ...prev, comment_count: Math.max(0, (prev.comment_count || 1) - 1) }))
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
      </div>
    )
  }

  if (error && !post) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen flex justify-center py-8 px-4 pb-20 md:pb-8">
      <div className="w-full max-w-117.5">
        <PostCard post={post} onLike={handleLike} linkToDetail={false} />

        {/* Owner actions */}
        {isOwner && (
          <div className="border-b border-[#262626] px-3 py-3">
            {editing ? (
              <div className="flex flex-col gap-3">
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full bg-[#121212] border border-[#363636] rounded p-2.5 text-sm text-white focus:outline-none focus:border-[#a8a8a8] resize-none placeholder:text-[#737373]"
                  rows={3}
                  placeholder="Write a caption..."
                />
                <div className="flex gap-4">
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
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm font-semibold text-[#0095f6] hover:text-white transition-colors"
                >
                  Edit caption
                </button>
                <button
                  onClick={handleDelete}
                  className="text-sm font-semibold text-red-500 hover:text-red-400 transition-colors"
                >
                  Delete post
                </button>
              </div>
            )}
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>
        )}

        {/* Comments section */}
        <div className="border-b border-[#262626]">
          {comments.length > 0 && (
            <div className="px-3 py-3 flex flex-col gap-3">
              {comments.map(comment => (
                <div key={comment.id} className="flex items-start gap-3">
                  <Link to={`/users/${comment.user?.id}`} className="shrink-0">
                    <Avatar username={comment.user?.username} src={comment.user?.profile_picture_url} userId={comment.user?.id} size={32} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      <Link
                        to={`/users/${comment.user?.id}`}
                        className="font-semibold mr-1 hover:opacity-80"
                      >
                        {comment.user?.username}
                      </Link>
                      {comment.body}
                    </p>
                    <p className="text-xs text-[#a8a8a8] mt-0.5">{timeAgo(comment.created_at)}</p>
                  </div>
                  {user && user.id === comment.user_id && (
                    <button
                      onClick={() => handleDeleteComment(comment)}
                      className="text-[#a8a8a8] hover:text-red-400 transition-colors text-sm shrink-0 mt-1"
                      title="Delete comment"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment input */}
        {user ? (
          <form
            onSubmit={handleCommentSubmit}
            className="flex items-center gap-3 px-3 py-3 border-b border-[#262626]"
          >
            <Smile size={20} className="text-white shrink-0" />
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentBody}
              onChange={e => setCommentBody(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-[#737373] focus:outline-none"
            />
            {commentBody.trim() && (
              <button
                type="submit"
                disabled={submitting}
                className="text-sm font-semibold text-[#0095f6] hover:text-white disabled:opacity-40 transition-colors shrink-0"
              >
                Post
              </button>
            )}
          </form>
        ) : (
          <p className="px-3 py-3 text-sm text-[#a8a8a8]">
            <Link to="/login" className="text-[#0095f6] font-semibold hover:text-white transition-colors">
              Log in
            </Link>
            {' '}to comment.
          </p>
        )}
      </div>
    </div>
  )
}
