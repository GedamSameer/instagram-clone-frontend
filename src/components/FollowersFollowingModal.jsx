import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { getFollowers, getFollowing } from '../api/users'
import UserListItem from './UserListItem'
import UserSearchInput from './UserSearchInput'

export default function FollowersFollowingModal({ userId, type, onClose }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const overlayRef = useRef(null)

  useEffect(() => {
    const fetch = type === 'followers' ? getFollowers : getFollowing
    fetch(userId)
      .then(res => setUsers(res.data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [userId, type])

  /* Close on ESC */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /* Prevent body scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(query.toLowerCase())
  )

  const title = type === 'followers' ? 'Followers' : 'Following'

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-[#262626] rounded-xl w-full max-w-sm mx-4 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#363636] px-4 py-3 shrink-0">
          <div className="w-6" />
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-[#a8a8a8] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#363636] shrink-0">
          <UserSearchInput value={query} onChange={setQuery} placeholder={`Search ${title.toLowerCase()}`} autoFocus />
        </div>

        {/* User list */}
        <div className="overflow-y-auto flex-1 py-2" style={{ maxHeight: 420 }}>
          {loading ? (
            <div className="flex flex-col gap-0.5 px-4 py-2">
              {[1, 2, 3].map(n => (
                <div key={n} className="flex items-center gap-3 py-2 animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-[#363636] shrink-0" />
                  <div className="h-3 w-32 bg-[#363636] rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              {query ? (
                <>
                  <p className="text-white font-semibold mb-1">No results found.</p>
                  <p className="text-sm text-[#a8a8a8]">No account found for "{query}".</p>
                </>
              ) : (
                <p className="text-[#a8a8a8] text-sm">
                  {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                </p>
              )}
            </div>
          ) : (
            filtered.map(u => (
              <UserListItem key={u.id} user={u} onClose={onClose} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
