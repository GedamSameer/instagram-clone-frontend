import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { savePost, unsavePost } from '../api/posts'
import Avatar from './Avatar'
import PostActions from './PostActions'
import ShareModal from './ShareModal'
import { timeAgo } from '../utils/time'

export default function PostCard({ post: initialPost, onLike, linkToDetail = true }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [savedByMe, setSavedByMe] = useState(initialPost.saved_by_me ?? false)
  const [likedByMe, setLikedByMe] = useState(initialPost.liked_by_me ?? false)
  const [likeCount, setLikeCount] = useState(initialPost.like_count ?? 0)
  const [showShare, setShowShare] = useState(false)

  /* Sync when parent updates post (like toggle) */
  useEffect(() => {
    setLikedByMe(initialPost.liked_by_me ?? false)
    setLikeCount(initialPost.like_count ?? 0)
  }, [initialPost.liked_by_me, initialPost.like_count])

  const post = { ...initialPost, liked_by_me: likedByMe, like_count: likeCount, saved_by_me: savedByMe }

  const openModal = (focusComment = false) => {
    if (!linkToDetail) return
    navigate(`/posts/${post.id}`, { state: { background: location, focusComment } })
  }

  const handleLike = (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (onLike) onLike(initialPost)
  }

  const handleSave = async (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!user) return
    try {
      if (savedByMe) {
        await unsavePost(post.id)
        setSavedByMe(false)
      } else {
        await savePost(post.id)
        setSavedByMe(true)
      }
    } catch {}
  }

  return (
    <>
    <article className="border-b border-[#262626] pb-3">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3">
        <Link to={`/users/${post.user?.id}`} className="shrink-0">
          <Avatar username={post.user?.username} src={post.user?.profile_picture_url} userId={post.user?.id} size={32} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/users/${post.user?.id}`} className="text-sm font-semibold text-white hover:opacity-80">
            {post.user?.username}
          </Link>
          <span className="text-[#a8a8a8] text-xs"> • </span>
          <span className="text-[#a8a8a8] text-xs">{timeAgo(post.created_at)}</span>
        </div>
        <button className="text-white hover:text-[#a8a8a8] transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Image */}
      <button
        onClick={() => openModal(false)}
        className={linkToDetail ? 'block w-full text-left cursor-pointer' : 'block w-full text-left cursor-default'}
        disabled={!linkToDetail}
        tabIndex={linkToDetail ? 0 : -1}
      >
        <img
          src={post.image_url}
          alt="post"
          className="w-full object-cover"
          style={{ maxHeight: 585 }}
          loading="lazy"
        />
      </button>

      {/* Action buttons */}
      <div className="px-3 pt-3">
        <PostActions
          post={post}
          onLike={handleLike}
          onSave={handleSave}
          onCommentClick={() => openModal(true)}
          onShare={() => setShowShare(true)}
        />
      </div>

      {/* Likes + Caption + Comments */}
      <div className="px-3 pt-2">
        {likeCount > 0 && (
          <p className="text-sm font-semibold text-white mb-1">
            {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {post.caption && (
          <p className="text-sm text-white leading-snug mb-1">
            <Link to={`/users/${post.user?.id}`} className="font-semibold hover:opacity-80 mr-1">
              {post.user?.username}
            </Link>
            {post.caption}
          </p>
        )}

        {linkToDetail && post.comment_count > 0 && (
          <button
            onClick={() => openModal(true)}
            className="text-sm text-[#a8a8a8] hover:text-[#737373] transition-colors block mb-1 text-left"
          >
            View all {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
          </button>
        )}

        <p className="text-[10px] text-[#a8a8a8] uppercase tracking-wide mt-1">
          {timeAgo(post.created_at)}
        </p>
      </div>
    </article>

    {showShare && <ShareModal postId={post.id} onClose={() => setShowShare(false)} />}
    </>
  )
}
