import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, Trash2, Volume2, VolumeX, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { deleteStory as deleteStoryApi, viewStory as viewStoryApi } from '../api/stories'
import { timeAgo } from '../utils/time'
import Avatar from './Avatar'
import StoryViewersModal from './StoryViewersModal'

const IMAGE_DURATION = 5000

export default function StoryViewer({
  groups: initialGroups,
  initialGroupIdx = 0,
  initialStoryIdx = 0,
  onClose,
  onStoryDeleted,
}) {
  const { user } = useAuth()
  const [groups, setGroups] = useState(initialGroups)
  const [groupIdx, setGroupIdx] = useState(initialGroupIdx)
  const [storyIdx, setStoryIdx] = useState(initialStoryIdx)
  const [paused, setPaused] = useState(false)
  const [mediaLoading, setMediaLoading] = useState(true)
  const [videoDuration, setVideoDuration] = useState(IMAGE_DURATION)
  const [muted, setMuted] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [viewersOpen, setViewersOpen] = useState(false)
  const [tick, setTick] = useState(0) // drives periodic timestamp re-render

  const stateRef = useRef({})
  stateRef.current = { groupIdx, storyIdx, groups, onClose }

  const cardRef = useRef(null)
  const videoRef = useRef(null)
  const holdTimerRef = useRef(null)
  const isHoldRef = useRef(false)

  const currentGroup = groups[groupIdx]
  const story = currentGroup?.stories[storyIdx]
  const isOwner = !!user && !!story && story.user_id === user.id

  // Refresh timestamp display every 30s
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  // Reset per-story state on navigation
  useEffect(() => {
    setMediaLoading(true)
    setVideoDuration(IMAGE_DURATION)
    setDeleteConfirm(false)
    setViewersOpen(false)
  }, [groupIdx, storyIdx])

  // Record view for non-owners
  useEffect(() => {
    if (!story || isOwner) return
    viewStoryApi(story.id).catch(() => {})
  }, [groupIdx, storyIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync video pause / play
  useEffect(() => {
    if (!videoRef.current) return
    if (paused || mediaLoading) videoRef.current.pause()
    else videoRef.current.play().catch(() => {})
  }, [paused, mediaLoading])

  const goNext = useCallback(() => {
    const { groupIdx, storyIdx, groups, onClose } = stateRef.current
    if (storyIdx < groups[groupIdx].stories.length - 1) {
      setStoryIdx(s => s + 1)
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(g => g + 1)
      setStoryIdx(0)
    } else {
      onClose()
    }
  }, [])

  const goPrev = useCallback(() => {
    const { groupIdx, storyIdx, groups } = stateRef.current
    if (storyIdx > 0) {
      setStoryIdx(s => s - 1)
    } else if (groupIdx > 0) {
      setGroupIdx(g => g - 1)
      setStoryIdx(groups[groupIdx - 1].stories.length - 1)
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') stateRef.current.onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goPrev, goNext])

  // Preload next image
  useEffect(() => {
    const { groupIdx, storyIdx, groups } = stateRef.current
    const next = groups[groupIdx]?.stories[storyIdx + 1] ?? groups[groupIdx + 1]?.stories[0]
    if (next?.media_type === 'image') new Image().src = next.media_url
  }, [groupIdx, storyIdx])

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!story) return
    const deletedId = story.id
    const groupId = story.story_group_id
    try {
      await deleteStoryApi(deletedId)
    } catch {
      setDeleteConfirm(false)
      return
    }

    // Remove all segments belonging to the same group (or just this story)
    const shouldRemove = groupId
      ? (s) => s.story_group_id === groupId
      : (s) => s.id === deletedId

    const newGroups = groups
      .map(g => ({ ...g, stories: g.stories.filter(s => !shouldRemove(s)) }))
      .filter(g => g.stories.length > 0)

    setGroups(newGroups)
    onStoryDeleted?.(deletedId, groupId)
    setDeleteConfirm(false)

    if (newGroups.length === 0) {
      onClose()
    } else if (groupIdx >= newGroups.length) {
      setGroupIdx(newGroups.length - 1)
      setStoryIdx(0)
    } else {
      const newCount = newGroups[groupIdx]?.stories.length ?? 0
      if (newCount === 0) {
        if (groupIdx > 0) {
          setGroupIdx(g => g - 1)
          setStoryIdx(newGroups[groupIdx - 1].stories.length - 1)
        } else {
          onClose()
        }
      } else if (storyIdx >= newCount) {
        setStoryIdx(newCount - 1)
      }
    }
  }

  // ── Pointer handlers ──────────────────────────────────────────────────────

  const onPointerDown = (e) => {
    if (e.target.closest('[data-no-nav]')) return
    cardRef.current?.setPointerCapture(e.pointerId)
    isHoldRef.current = false
    holdTimerRef.current = setTimeout(() => {
      isHoldRef.current = true
      setPaused(true)
    }, 200)
  }

  const onPointerUp = (e) => {
    if (e.target.closest('[data-no-nav]')) return
    clearTimeout(holdTimerRef.current)
    if (isHoldRef.current) {
      isHoldRef.current = false
      setPaused(false)
      return
    }
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    if (e.clientX - rect.left < rect.width * 0.4) goPrev()
    else goNext()
  }

  const onPointerCancel = () => {
    clearTimeout(holdTimerRef.current)
    if (isHoldRef.current) setPaused(false)
    isHoldRef.current = false
  }

  if (!currentGroup || !story) return null

  const duration = story.media_type === 'video' ? videoDuration : IMAGE_DURATION
  const animating = !paused && !mediaLoading && !deleteConfirm && !viewersOpen

  return (
    <div className="fixed inset-0 z-100 bg-black flex items-center justify-center">
      {/* Prev user arrow */}
      {groupIdx > 0 && (
        <button
          data-no-nav=""
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white transition-colors hidden md:flex"
          onClick={() => { setGroupIdx(g => g - 1); setStoryIdx(0) }}
        >
          <ChevronLeft size={36} />
        </button>
      )}

      {/* Story card */}
      <div
        ref={cardRef}
        className="relative h-screen aspect-9/16 max-w-full bg-[#111] overflow-hidden select-none"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {/* Progress bars */}
        <div data-no-nav="" className="absolute top-0 left-0 right-0 flex gap-0.75 px-2 pt-2 z-10 pointer-events-none">
          {currentGroup.stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 bg-white/40 overflow-hidden rounded-full">
              {idx < storyIdx && <div className="h-full w-full bg-white" />}
              {idx === storyIdx && (
                <div
                  key={`${groupIdx}-${storyIdx}`}
                  className="h-full bg-white rounded-full"
                  style={{
                    animation: `story-progress ${duration}ms linear forwards`,
                    animationPlayState: animating ? 'running' : 'paused',
                  }}
                  onAnimationEnd={story.media_type !== 'video' ? goNext : undefined}
                />
              )}
            </div>
          ))}
        </div>

        {/* User header */}
        <div data-no-nav="" className="absolute top-5 left-0 right-0 flex items-center gap-2 px-3 pt-2 z-10">
          <Avatar username={currentGroup.user.username} src={currentGroup.user?.profile_picture_url} userId={currentGroup.user?.id} size={32} />
          <span className="text-white text-sm font-semibold drop-shadow">
            {currentGroup.user.username}
          </span>
          {/* key={tick} causes React to re-evaluate timeAgo every 30s */}
          <span key={tick} className="text-white/60 text-xs">
            {timeAgo(story.created_at)}
          </span>
          <div className="ml-auto flex items-center gap-3">
            {story.media_type === 'video' && (
              <button
                data-no-nav=""
                className="text-white hover:text-white/70 transition-colors"
                onClick={() => setMuted(m => !m)}
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            )}
            {isOwner && (
              <button
                data-no-nav=""
                className="text-white hover:text-white/70 transition-colors"
                onClick={() => setDeleteConfirm(true)}
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              data-no-nav=""
              className="text-white hover:text-white/70 transition-colors"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Media */}
        {story.media_type === 'video' ? (
          <video
            ref={videoRef}
            key={`${groupIdx}-${storyIdx}-v`}
            src={story.media_url}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted={muted}
            onLoadedMetadata={e => setVideoDuration(e.target.duration * 1000)}
            onLoadedData={() => setMediaLoading(false)}
            onEnded={goNext}
          />
        ) : (
          <img
            key={`${groupIdx}-${storyIdx}-i`}
            src={story.media_url}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
            onLoad={() => setMediaLoading(false)}
          />
        )}

        {/* Loading spinner */}
        {mediaLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 pointer-events-none">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Caption */}
        {story.caption && !viewersOpen && (
          <div className="absolute bottom-14 left-0 right-0 px-4 z-10 pointer-events-none">
            <p className="text-white text-sm text-center drop-shadow-lg">{story.caption}</p>
          </div>
        )}

        {/* Views count — owner only */}
        {isOwner && !viewersOpen && !deleteConfirm && (
          <div data-no-nav="" className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
            <button
              data-no-nav=""
              className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
              onClick={() => setViewersOpen(true)}
            >
              <Eye size={16} />
              <span className="text-sm">{story.views_count ?? 0}</span>
            </button>
          </div>
        )}

        {/* Delete confirmation overlay */}
        {deleteConfirm && (
          <div data-no-nav="" className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
            <div className="bg-[#1c1c1c] rounded-xl p-6 mx-4 w-full max-w-xs">
              <p className="text-white font-semibold text-center mb-1">Delete story?</p>
              <p className="text-[#a8a8a8] text-sm text-center mb-5">This can't be undone.</p>
              <div className="flex gap-3">
                <button
                  className="flex-1 py-2 rounded-lg border border-[#363636] text-white text-sm font-semibold hover:bg-[#262626] transition-colors"
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                  onClick={handleDeleteConfirm}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Story viewers bottom sheet */}
        {viewersOpen && (
          <div data-no-nav="" className="absolute inset-0 z-20 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={() => setViewersOpen(false)} />
            <div className="relative bg-[#1c1c1c] rounded-t-2xl max-h-[60%] flex flex-col">
              <StoryViewersModal storyId={story.id} onClose={() => setViewersOpen(false)} />
            </div>
          </div>
        )}
      </div>

      {/* Next user arrow */}
      {groupIdx < groups.length - 1 && (
        <button
          data-no-nav=""
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white transition-colors hidden md:flex"
          onClick={() => { setGroupIdx(g => g + 1); setStoryIdx(0) }}
        >
          <ChevronRight size={36} />
        </button>
      )}
    </div>
  )
}
