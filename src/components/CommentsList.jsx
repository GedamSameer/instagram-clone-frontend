import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import Avatar from './Avatar'
import { timeAgo } from '../utils/time'
import { likeComment, unlikeComment } from '../api/comments'
import { useAuth } from '../auth/AuthContext'

function CommentRow({ comment, currentUserId, onDeleteComment, onReply, isReply = false }) {
  const { user } = useAuth()
  const [likesCount, setLikesCount] = useState(comment.likes_count ?? 0)
  const [isLiked, setIsLiked] = useState(comment.is_liked ?? false)
  const [pending, setPending] = useState(false)

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!user || pending) return
    // Optimistic update
    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    setLikesCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1)
    setPending(true)
    try {
      const res = wasLiked
        ? await unlikeComment(comment.id)
        : await likeComment(comment.id)
      setLikesCount(res.data.likes_count)
      setIsLiked(res.data.is_liked)
    } catch {
      // Rollback
      setIsLiked(wasLiked)
      setLikesCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-start gap-3 mb-3 group">
      <Link to={`/users/${comment.user?.id}`} className="shrink-0">
        <Avatar username={comment.user?.username} size={isReply ? 28 : 32} />
      </Link>

      <div className="flex-1 min-w-0 flex gap-2">
        {/* Text block */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white leading-snug">
            <Link
              to={`/users/${comment.user?.id}`}
              className="font-semibold hover:opacity-80 mr-1"
            >
              {comment.user?.username}
            </Link>
            {comment.reply_to_user && (
              <Link
                to={`/users/${comment.reply_to_user.id}`}
                className="text-[#0095f6] hover:opacity-80 mr-1"
              >
                @{comment.reply_to_user.username}
              </Link>
            )}
            {comment.body}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-[#a8a8a8] uppercase tracking-wide">
              {timeAgo(comment.created_at)}
            </span>
            {likesCount > 0 && (
              <span className="text-[10px] text-[#a8a8a8] uppercase tracking-wide">
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
              </span>
            )}
            <button
              onClick={() => onReply?.(comment)}
              className="text-[10px] text-[#a8a8a8] hover:text-white transition-colors uppercase tracking-wide"
            >
              Reply
            </button>
            {currentUserId && currentUserId === comment.user_id && (
              <button
                onClick={() => onDeleteComment?.(comment)}
                className="text-[10px] text-[#a8a8a8] hover:text-red-400 transition-colors uppercase tracking-wide opacity-0 group-hover:opacity-100"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Like button — right-aligned, always visible on hover or when liked */}
        <button
          onClick={handleLike}
          disabled={!user}
          className={`shrink-0 flex flex-col items-center gap-0.5 pt-0.5 transition-opacity ${
            user ? 'cursor-pointer' : 'cursor-default'
          } ${isLiked || likesCount > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          aria-label={isLiked ? 'Unlike comment' : 'Like comment'}
        >
          <Heart
            size={12}
            className={`transition-colors duration-100 ${
              isLiked
                ? 'fill-[#ff3040] stroke-[#ff3040]'
                : 'stroke-[#a8a8a8] fill-transparent hover:stroke-white'
            }`}
            strokeWidth={isLiked ? 0 : 1.5}
          />
        </button>
      </div>
    </div>
  )
}

function TopLevelComment({ comment, currentUserId, onDeleteComment, onReply }) {
  const [showReplies, setShowReplies] = useState(false)
  const replies = comment.replies || []

  return (
    <div className="mb-1">
      <CommentRow
        comment={comment}
        currentUserId={currentUserId}
        onDeleteComment={onDeleteComment}
        onReply={onReply}
      />
      {replies.length > 0 && (
        <div className="ml-11">
          <button
            onClick={() => setShowReplies(prev => !prev)}
            className="flex items-center gap-2 text-xs text-[#a8a8a8] hover:text-white transition-colors mb-2"
          >
            <span className="inline-block w-5 h-px bg-[#a8a8a8]" />
            {showReplies
              ? 'Hide replies'
              : `View ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
          </button>
          {showReplies && replies.map(reply => (
            <CommentRow
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onDeleteComment={onDeleteComment}
              onReply={onReply}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentsList({ post, comments, currentUserId, onDeleteComment, onReply }) {
  return (
    <div className="flex flex-col">
      {/* Caption as first entry */}
      {post?.caption && (
        <div className="flex items-start gap-3 mb-4">
          <Link to={`/users/${post.user?.id}`} className="shrink-0">
            <Avatar username={post.user?.username} size={32} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white leading-snug">
              <Link
                to={`/users/${post.user?.id}`}
                className="font-semibold hover:opacity-80 mr-1"
              >
                {post.user?.username}
              </Link>
              {post.caption}
            </p>
            <p className="text-[10px] text-[#a8a8a8] uppercase tracking-wide mt-1">
              {timeAgo(post.created_at)}
            </p>
          </div>
        </div>
      )}

      {comments.map(comment => (
        <TopLevelComment
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onDeleteComment={onDeleteComment}
          onReply={onReply}
        />
      ))}
    </div>
  )
}
