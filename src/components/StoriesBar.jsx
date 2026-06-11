import { useAuth } from '../auth/AuthContext'
import { StoryAvatar } from './Avatar'
import { Plus } from 'lucide-react'

export default function StoriesBar({ feedItems = [], feedPosts = [] }) {
  const { user } = useAuth()

  /* Accept either feedItems (mixed feed) or feedPosts (legacy) */
  const items = feedItems.length > 0 ? feedItems : feedPosts

  /* Deduplicate users from feed items to show as story avatars */
  const storyUsers = []
  const seen = new Set()
  for (const item of items) {
    if (item.user && !seen.has(item.user.id)) {
      seen.add(item.user.id)
      storyUsers.push(item.user)
    }
    if (storyUsers.length >= 8) break
  }

  return (
    <div className="border border-[#262626] mb-3 px-4 py-4 overflow-x-auto scrollbar-hide">
      <div className="flex gap-4 min-w-max">
        {/* Your Story */}
        {user && (
          <div className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0">
            <div className="relative">
              <div
                className="rounded-full border-2 border-[#262626] overflow-hidden"
                style={{ width: 62, height: 62 }}
              >
                <div
                  className="w-full h-full rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xl"
                >
                  {user.username?.[0]?.toUpperCase()}
                </div>
              </div>
              {/* + badge */}
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#0095f6] rounded-full flex items-center justify-center border-2 border-black">
                <Plus size={11} strokeWidth={3} className="text-white" />
              </div>
            </div>
            <span className="text-[11px] text-white truncate text-center leading-none w-16">Your story</span>
          </div>
        )}

        {/* Feed users as story avatars */}
        {storyUsers.map(storyUser => (
          <StoryAvatar
            key={storyUser.id}
            username={storyUser.username}
            size={56}
            showRing
          />
        ))}
      </div>
    </div>
  )
}
