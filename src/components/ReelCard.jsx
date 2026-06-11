import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { likeReel, unlikeReel, saveReel, unsaveReel } from '../api/reels'
import { followUser, unfollowUser } from '../api/users'
import Avatar from './Avatar'
import ReelVideoPlayer from './ReelVideoPlayer'
import ReelCommentsModal from './ReelCommentsModal'
import ShareModal from './ShareModal'
import { timeAgo } from '../utils/time'

export default function ReelCard({ reel: initialReel, onBecomeActive }) {
  const { user } = useAuth()
  const [reel, setReel] = useState(initialReel)
  const [following, setFollowing] = useState(initialReel.is_following_user ?? false)
  const [showComments, setShowComments] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const isOwnReel = user && reel.user_id === user.id

  const handleLike = async () => {
    if (!user) return
    try {
      const res = reel.liked_by_me ? await unlikeReel(reel.id) : await likeReel(reel.id)
      setReel(prev => ({ ...prev, liked_by_me: res.data.liked_by_me, like_count: res.data.like_count }))
    } catch {}
  }

  const handleSave = async () => {
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

  return (
    <>
      {/*
        Instagram Reels layout:
        - Left: tall portrait video (fills most of viewport height)
        - Right: action rail (like / comment / share / save / more) — outside the video
        Both are flex siblings so the action rail is never clipped by overflow:hidden on the video.
      */}
      <div className="flex items-end gap-4">

        {/* ── Video container ─────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden bg-black shrink-0"
          style={{
            height: 'min(calc(100vh - 20px), 840px)',
            aspectRatio: '9 / 16',
          }}
        >
          <ReelVideoPlayer
            src={reel.video_url}
            poster={reel.thumbnail_url}
            onBecomeActive={onBecomeActive}
          />

          {/* Bottom overlay: user info + caption */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-20 bg-linear-to-t from-black/85 via-black/30 to-transparent z-10 pointer-events-none">
            {/* Avatar + username + follow */}
            <div className="flex items-center gap-2 mb-2 pointer-events-auto flex-wrap">
              <Link
                to={`/users/${reel.user?.id}`}
                className="shrink-0"
                onClick={e => e.stopPropagation()}
              >
                <Avatar username={reel.user?.username} src={reel.user?.profile_picture_url} userId={reel.user?.id} size={32} />
              </Link>
              <Link
                to={`/users/${reel.user?.id}`}
                onClick={e => e.stopPropagation()}
                className="text-sm font-semibold text-white hover:opacity-80 drop-shadow"
              >
                {reel.user?.username}
              </Link>
              {!isOwnReel && user && (
                <button
                  onClick={e => { e.stopPropagation(); handleFollow() }}
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded border transition-colors ${
                    following
                      ? 'border-white/60 text-white/80 hover:border-white hover:text-white'
                      : 'border-white text-white hover:bg-white/15'
                  }`}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            {/* Caption */}
            {reel.caption && (
              <p className="text-sm text-white leading-snug drop-shadow line-clamp-3 pointer-events-auto">
                {reel.caption}
              </p>
            )}
            <p className="text-[11px] text-white/70 mt-1 drop-shadow">
              {timeAgo(reel.created_at)}
            </p>
          </div>
        </div>

        {/* ── Right action rail ───────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-5 pb-5 shrink-0">

          {/* Like */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1 group"
          >
            <Heart
              size={28}
              className={`transition-transform duration-150 group-active:scale-125 ${
                reel.liked_by_me
                  ? 'fill-[#ff3040] stroke-[#ff3040]'
                  : 'stroke-white fill-transparent'
              }`}
              strokeWidth={reel.liked_by_me ? 0 : 1.5}
            />
            {reel.like_count > 0 && (
              <span className="text-white text-xs font-semibold">{reel.like_count}</span>
            )}
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center gap-1 group"
          >
            <MessageCircle
              size={28}
              className="stroke-white fill-transparent group-hover:stroke-white/75 transition-colors"
              strokeWidth={1.5}
            />
            {reel.comment_count > 0 && (
              <span className="text-white text-xs font-semibold">{reel.comment_count}</span>
            )}
          </button>

          {/* Share */}
          <button onClick={() => setShowShare(true)} className="group flex flex-col items-center gap-1">
            <Send
              size={28}
              className="stroke-white fill-transparent group-hover:stroke-white/75 transition-colors"
              strokeWidth={1.5}
            />
          </button>

          {/* Save */}
          <button onClick={handleSave} className="group">
            <Bookmark
              size={28}
              className={`transition-transform duration-150 group-active:scale-125 ${
                reel.saved_by_me
                  ? 'fill-white stroke-white'
                  : 'stroke-white fill-transparent group-hover:stroke-white/75'
              }`}
              strokeWidth={reel.saved_by_me ? 0 : 1.5}
            />
          </button>

          {/* More */}
          <button className="group">
            <MoreHorizontal
              size={28}
              className="stroke-white group-hover:stroke-white/75 transition-colors"
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>

      {showComments && (
        <ReelCommentsModal
          reel={reel}
          onClose={() => setShowComments(false)}
          onCommentAdded={handleCommentAdded}
        />
      )}

      {showShare && <ShareModal reelId={reel.id} onClose={() => setShowShare(false)} />}
    </>
  )
}
