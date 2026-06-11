import { useState } from 'react'
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react'

export default function ReelActions({
  reel,
  following,
  isOwnReel,
  onLike,
  onSave,
  onCommentClick,
  onFollow,
}) {
  const [copied, setCopied] = useState(false)

  const handleShare = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reels/${reel.id}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-10">
      {/* Like */}
      <button onClick={onLike} className="flex flex-col items-center gap-1 group">
        <div className="p-2">
          <Heart
            size={28}
            className={`transition-transform group-active:scale-125 ${
              reel.liked_by_me ? 'fill-[#ff3040] stroke-[#ff3040]' : 'stroke-white fill-transparent'
            }`}
            strokeWidth={1.5}
          />
        </div>
        <span className="text-white text-xs font-semibold drop-shadow">
          {reel.like_count > 0 ? reel.like_count : ''}
        </span>
      </button>

      {/* Comment */}
      <button onClick={onCommentClick} className="flex flex-col items-center gap-1 group">
        <div className="p-2">
          <MessageCircle size={28} className="stroke-white fill-transparent" strokeWidth={1.5} />
        </div>
        <span className="text-white text-xs font-semibold drop-shadow">
          {reel.comment_count > 0 ? reel.comment_count : ''}
        </span>
      </button>

      {/* Share */}
      <div className="relative flex flex-col items-center gap-1">
        <button onClick={handleShare} className="p-2">
          <Send size={28} className="stroke-white fill-transparent" strokeWidth={1.5} />
        </button>
        {copied && (
          <div className="absolute right-12 top-1 bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
            Link copied!
          </div>
        )}
      </div>

      {/* Save */}
      <button onClick={onSave} className="flex flex-col items-center gap-1 group">
        <div className="p-2">
          <Bookmark
            size={28}
            className={`transition-transform group-active:scale-125 ${
              reel.saved_by_me ? 'fill-white stroke-white' : 'stroke-white fill-transparent'
            }`}
            strokeWidth={1.5}
          />
        </div>
      </button>

      {/* Follow / Following — hidden for own reels */}
      {!isOwnReel && (
        <button
          onClick={onFollow}
          className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
            following
              ? 'border-white text-white bg-transparent hover:bg-white/10'
              : 'border-white text-black bg-white hover:bg-white/90'
          }`}
        >
          {following ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  )
}
