import { useEffect, useRef, useState } from 'react'
import { X, PenSquare } from 'lucide-react'
import { searchUsers } from '../api/users'
import { createConversation } from '../api/messages'
import Avatar from './Avatar'
import UserSearchInput from './UserSearchInput'

export default function NewMessageModal({ onClose, onConversationCreated }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(null) // user_id being created
  const overlayRef = useRef(null)
  const timerRef = useRef(null)

  // Debounced search
  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    timerRef.current = setTimeout(() => {
      setSearching(true)
      searchUsers(query.trim())
        .then(res => setResults(res.data.users || []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSelect = async (user) => {
    if (creating) return
    setCreating(user.id)
    try {
      const res = await createConversation(user.id)
      onConversationCreated(res.data.conversation)
    } catch {
      setCreating(null)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-[#262626] rounded-xl w-full max-w-sm mx-4 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#363636] px-4 py-3 shrink-0">
          <button
            onClick={onClose}
            className="text-white hover:text-[#a8a8a8] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <h2 className="text-sm font-semibold text-white">New message</h2>
          <PenSquare size={20} className="text-[#363636]" aria-hidden />
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#363636] shrink-0">
          <UserSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search…"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="overflow-y-auto" style={{ minHeight: 200, maxHeight: 400 }}>
          {searching && (
            <div className="flex flex-col gap-0.5 px-4 py-2">
              {[1, 2, 3].map(n => (
                <div key={n} className="flex items-center gap-3 py-2 animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-[#363636] shrink-0" />
                  <div className="h-3 w-32 bg-[#363636] rounded" />
                </div>
              ))}
            </div>
          )}

          {!searching && query.trim() && results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white font-semibold mb-1">No results found.</p>
              <p className="text-sm text-[#a8a8a8]">No account found for "{query}".</p>
            </div>
          )}

          {!searching && !query.trim() && (
            <p className="text-center text-sm text-[#a8a8a8] py-10">Search for a person.</p>
          )}

          {!searching && results.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              disabled={creating === user.id}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 text-left"
            >
              <Avatar username={user.username} size={44} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-tight truncate">{user.username}</p>
                {user.email && (
                  <p className="text-xs text-[#a8a8a8] truncate">{user.email}</p>
                )}
              </div>
              {creating === user.id && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
