import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getStoryFeed } from '../api/stories'
import { StoryAvatar } from './Avatar'
import StoryViewer from './StoryViewer'

export default function StoriesBar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewer, setViewer] = useState(null) // { groupIdx } | null

  const fetchFeed = () => {
    if (!user) { setLoading(false); return }
    getStoryFeed()
      .then(res => setGroups(res.data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(fetchFeed, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const ownGroupIdx = groups.findIndex(g => g.user.id === user?.id)
  const hasOwnStories = ownGroupIdx >= 0

  const handleOwnClick = () => {
    if (hasOwnStories) setViewer({ groupIdx: ownGroupIdx })
    else navigate('/create', { state: { type: 'story' } })
  }

  // Re-fetch feed after viewing so has_unseen states + ring colours update
  const handleViewerClose = () => {
    setViewer(null)
    getStoryFeed()
      .then(res => setGroups(res.data.items || []))
      .catch(() => {})
  }

  // Sync local state when a story (or group) is deleted inside the viewer
  const handleStoryDeleted = (storyId, groupId) => {
    setGroups(prev =>
      prev
        .map(g => ({
          ...g,
          stories: g.stories.filter(s =>
            groupId ? s.story_group_id !== groupId : s.id !== storyId
          ),
        }))
        .filter(g => g.stories.length > 0)
    )
  }

  if (loading) {
    return (
      <div className="border border-[#262626] mb-3 px-4 py-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 min-w-max">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-15.5 h-15.5 rounded-full bg-[#262626] animate-pulse" />
              <div className="h-2 w-12 rounded bg-[#262626] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Backend already sorts: own first, then unviewed, then viewed.
  // We just separate own slot from others for custom rendering.
  const otherGroups = groups.filter(g => g.user.id !== user?.id)

  return (
    <>
      <div className="border border-[#262626] mb-3 px-4 py-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 min-w-max">
          {/* Own story slot */}
          {user && (
            <div
              className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0"
              onClick={handleOwnClick}
            >
              <div className="relative">
                {hasOwnStories ? (
                  /* Gradient ring — own stories always show gradient regardless of viewed state */
                  <div
                    className="rounded-full p-0.5"
                    style={{
                      background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                      width: 68,
                      height: 68,
                    }}
                  >
                    <div className="rounded-full bg-black p-0.5 w-full h-full">
                      {user.profile_picture_url ? (
                        <img src={user.profile_picture_url} alt={user.username} className="w-full h-full rounded-full object-cover" draggable={false} />
                      ) : (
                        <div className="w-full h-full rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xl">
                          {user.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Plain avatar with + badge */
                  <div
                    className="rounded-full border-2 border-[#262626] overflow-hidden"
                    style={{ width: 62, height: 62 }}
                  >
                    {user.profile_picture_url ? (
                      <img src={user.profile_picture_url} alt={user.username} className="w-full h-full rounded-full object-cover" draggable={false} />
                    ) : (
                      <div className="w-full h-full rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xl">
                        {user.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                {!hasOwnStories && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#0095f6] rounded-full flex items-center justify-center border-2 border-black">
                    <Plus size={11} strokeWidth={3} className="text-white" />
                  </div>
                )}
              </div>
              <span className="text-[11px] text-white truncate text-center leading-none w-16">
                {hasOwnStories ? user.username : 'Your story'}
              </span>
            </div>
          )}

          {/* Other users' stories — gradient ring if unviewed, gray if all viewed */}
          {otherGroups.map(group => {
            const gIdx = groups.indexOf(group)
            return (
              <div key={group.user.id} onClick={() => setViewer({ groupIdx: gIdx })}>
                <StoryAvatar
                  username={group.user.username}
                  src={group.user?.profile_picture_url}
                  userId={group.user?.id}
                  size={56}
                  showRing
                  viewed={!group.has_unseen}
                />
              </div>
            )
          })}
        </div>
      </div>

      {viewer && (
        <StoryViewer
          groups={groups}
          initialGroupIdx={viewer.groupIdx}
          initialStoryIdx={0}
          onClose={handleViewerClose}
          onStoryDeleted={handleStoryDeleted}
        />
      )}
    </>
  )
}
