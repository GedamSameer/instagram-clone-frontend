import { useEffect, useState } from 'react'
import { Eye, X } from 'lucide-react'
import { getStoryViewers } from '../api/stories'
import { timeAgo } from '../utils/time'
import Avatar from './Avatar'

export default function StoryViewersModal({ storyId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStoryViewers(storyId)
      .then(res => setData(res.data))
      .catch(() => setData({ views_count: 0, viewers: [] }))
      .finally(() => setLoading(false))
  }, [storyId])

  const count = data?.views_count ?? 0

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#363636] shrink-0">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-white" />
          <span className="text-white font-semibold text-sm">
            {loading ? '—' : `${count} ${count === 1 ? 'viewer' : 'viewers'}`}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Viewers list */}
      <div className="overflow-y-auto flex-1 py-1">
        {loading ? (
          <div className="py-8 text-center text-[#a8a8a8] text-sm">Loading…</div>
        ) : !data || data.viewers.length === 0 ? (
          <div className="py-8 text-center text-[#a8a8a8] text-sm">No views yet</div>
        ) : (
          data.viewers.map((v, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <Avatar username={v.user.username} src={v.user?.profile_picture_url} userId={v.user?.id} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{v.user.username}</p>
                <p className="text-[#a8a8a8] text-xs">{timeAgo(v.viewed_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
