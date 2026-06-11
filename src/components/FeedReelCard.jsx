import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MoreHorizontal, Clapperboard, Volume2, VolumeX } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { likeReel, unlikeReel, saveReel, unsaveReel } from '../api/reels'
import { followUser, unfollowUser } from '../api/users'
import Avatar from './Avatar'
import PostActions from './PostActions'
import ReelCommentsModal from './ReelCommentsModal'
import { timeAgo } from '../utils/time'

export default function FeedReelCard({ reel: initialReel }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const containerRef = useRef(null)

  const [reel, setReel] = useState(initialReel)
  const [following, setFollowing] = useState(initialReel.is_following_user ?? false)
  const [muted, setMuted] = useState(true)
  const [showComments, setShowComments] = useState(false)

  const isOwnReel = user && reel.user_id === user.id

  /* Auto-play when in viewport */
  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const handleLike = async (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!user) return
    try {
      const res = reel.liked_by_me ? await unlikeReel(reel.id) : await likeReel(reel.id)
      setReel(prev => ({ ...prev, liked_by_me: res.data.liked_by_me, like_count: res.data.like_count }))
    } catch {}
  }

  const handleSave = async (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!user) return
    try {
      if (reel.saved_by_me) {
        await unsaveReel(reel.id)
        setReel(prev => ({ ...prev, saved_by_me: false }))
      } else {
        await saveReel(reel.id)
        setReel(prev => ({ ...prev, saved_by_me: true }))
      }
    } catch {}
  }

  const handleFollow = async () => {
    if (!user || isOwnReel) return
    try {
      if (following) {
        await unfollowUser(reel.user_id)
        setFollowing(false)
      } else {
        await followUser(reel.user_id)
        setFollowing(true)
      }
    } catch {}
  }

  const handleCommentAdded = () => {
    setReel(prev => ({ ...prev, comment_count: (prev.comment_count || 0) + 1 }))
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setMuted(videoRef.current.muted)
  }

  /* Build a PostActions-compatible post object for the action bar */
  const asPost = {
    ...reel,
    liked_by_me: reel.liked_by_me,
    like_count: reel.like_count,
    saved_by_me: reel.saved_by_me,
  }

  return (
    <article className="border-b border-[#262626] pb-3">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3">
        <Link to={`/users/${reel.user?.id}`} className="shrink-0">
          <Avatar username={reel.user?.username} size={32} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/users/${reel.user?.id}`} className="text-sm font-semibold text-white hover:opacity-80">
              {reel.user?.username}
            </Link>
            {/* Reels badge */}
            <span className="flex items-center gap-1 text-[#a8a8a8] text-xs">
              <Clapperboard size={12} strokeWidth={2} />
              Reel
            </span>
          </div>
          <span className="text-[#a8a8a8] text-xs">{timeAgo(reel.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isOwnReel && user && (
            <button
              onClick={handleFollow}
              className={`text-xs font-semibold transition-colors ${
                following ? 'text-[#a8a8a8] hover:text-white' : 'text-[#0095f6] hover:text-white'
              }`}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          )}
          <button className="text-white hover:text-[#a8a8a8] transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Video */}
      <div
        ref={containerRef}
        className="relative w-full bg-black overflow-hidden cursor-pointer"
        style={{ maxHeight: 585 }}
        onClick={() => navigate(`/reels/${reel.id}`)}
      >
        <video
          ref={videoRef}
          src={reel.video_url}
          poster={reel.thumbnail_url || undefined}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          className="w-full object-cover"
          style={{ maxHeight: 585 }}
        />
        {/* Mute toggle */}
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        {/* Reel indicator */}
        <div className="absolute top-3 right-3 bg-black/50 rounded-full p-1.5">
          <Clapperboard size={16} className="text-white" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-3 pt-3">
        <PostActions
          post={asPost}
          onLike={handleLike}
          onSave={handleSave}
          onCommentClick={() => setShowComments(true)}
        />
      </div>

      {/* Likes + Caption + Comments */}
      <div className="px-3 pt-2">
        {reel.like_count > 0 && (
          <p className="text-sm font-semibold text-white mb-1">
            {reel.like_count.toLocaleString()} {reel.like_count === 1 ? 'like' : 'likes'}
          </p>
        )}
        {reel.caption && (
          <p className="text-sm text-white leading-snug mb-1">
            <Link to={`/users/${reel.user?.id}`} className="font-semibold hover:opacity-80 mr-1">
              {reel.user?.username}
            </Link>
            {reel.caption}
          </p>
        )}
        {reel.comment_count > 0 && (
          <button
            onClick={() => setShowComments(true)}
            className="text-sm text-[#a8a8a8] hover:text-[#737373] transition-colors block mb-1 text-left"
          >
            View all {reel.comment_count} {reel.comment_count === 1 ? 'comment' : 'comments'}
          </button>
        )}
        <p className="text-[10px] text-[#a8a8a8] uppercase tracking-wide mt-1">
          {timeAgo(reel.created_at)}
        </p>
      </div>

      {showComments && (
        <ReelCommentsModal
          reel={reel}
          onClose={() => setShowComments(false)}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </article>
  )
}
