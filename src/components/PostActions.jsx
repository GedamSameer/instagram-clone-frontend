import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react'

export default function PostActions({ post, onLike, onSave, onCommentClick, className = '' }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-4">
        {/* Like */}
        <button
          onClick={onLike}
          className="transition-transform active:scale-90"
          aria-label={post.liked_by_me ? 'Unlike' : 'Like'}
        >
          <Heart
            size={24}
            strokeWidth={post.liked_by_me ? 0 : 2}
            fill={post.liked_by_me ? '#ff3040' : 'none'}
            stroke={post.liked_by_me ? '#ff3040' : 'white'}
            className="transition-all duration-100"
          />
        </button>

        {/* Comment */}
        <button
          onClick={onCommentClick}
          className="text-white hover:text-[#a8a8a8] transition-colors"
          aria-label="Comment"
        >
          <MessageCircle size={24} strokeWidth={2} />
        </button>

        {/* Share */}
        <button className="text-white hover:text-[#a8a8a8] transition-colors" aria-label="Share">
          <Send size={24} strokeWidth={2} />
        </button>
      </div>

      {/* Bookmark */}
      <button
        onClick={onSave}
        className="text-white hover:text-[#a8a8a8] transition-colors"
        aria-label={post.saved_by_me ? 'Remove from saved' : 'Save'}
      >
        <Bookmark
          size={24}
          strokeWidth={post.saved_by_me ? 0 : 2}
          fill={post.saved_by_me ? 'white' : 'none'}
          stroke="white"
        />
      </button>
    </div>
  )
}
