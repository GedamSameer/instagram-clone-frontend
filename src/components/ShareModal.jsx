import { useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { searchUsers } from '../api/users'
import { createConversation, getConversations, sharePost, shareReel } from '../api/messages'
import Avatar from './Avatar'
import UserSearchInput from './UserSearchInput'

export default function ShareModal({ postId, reelId, onClose }) {
  const [query, setQuery] = useState('')
  const [conversations, setConversations] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  // Map<key, {type:'conv'|'user', id, username}>
  const [selected, setSelected] = useState(new Map())
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const overlayRef = useRef(null)
  const timerRef = useRef(null)

  // Load recent conversations once
  useEffect(() => {
    getConversations()
      .then(res => setConversations(res.data.conversations || []))
      .catch(() => {})
  }, [])

  // Debounced user search
  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!query.trim()) { setSearchResults([]); return }
    timerRef.current = setTimeout(() => {
      setSearching(true)
      searchUsers(query.trim())
        .then(res => setSearchResults(res.data.users || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  // ESC to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const toggleConv = (conv) => {
    const key = `conv:${conv.id}`
    setSelected(prev => {
      const next = new Map(prev)
      if (next.has(key)) next.delete(key)
      else next.set(key, { type: 'conv', id: conv.id, username: conv.other_user?.username })
      return next
    })
  }

  const toggleUser = (user) => {
    const key = `user:${user.id}`
    setSelected(prev => {
      const next = new Map(prev)
      if (next.has(key)) next.delete(key)
      else next.set(key, { type: 'user', id: user.id, username: user.username })
      return next
    })
  }

  const handleSend = async () => {
    if (selected.size === 0 || sending || sent) return
    setSending(true)
    try {
      const convIds = []
      for (const item of selected.values()) {
        if (item.type === 'conv') {
          convIds.push(item.id)
        } else {
          const res = await createConversation(item.id)
          convIds.push(res.data.conversation.id)
        }
      }
      if (postId) await sharePost(postId, convIds)
      else await shareReel(reelId, convIds)
      setSent(true)
      setTimeout(onClose, 1500)
    } catch {
      setSending(false)
    }
  }

  const isSearchMode = query.trim().length > 0
  const label = postId ? 'Post' : 'Reel'

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
          <h2 className="text-sm font-semibold text-white">Share</h2>
          <div className="w-5" aria-hidden />
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

        {/* Selected chips */}
        {selected.size > 0 && (
          <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-[#363636] shrink-0 scrollbar-none">
            {[...selected.values()].map(item => (
              <div
                key={`${item.type}:${item.id}`}
                className="flex items-center gap-1.5 bg-[#3797f0]/15 border border-[#3797f0]/40 rounded-full pl-1.5 pr-2.5 py-1 shrink-0"
              >
                <Avatar username={item.username} size={20} />
                <span className="text-xs text-white whitespace-nowrap">{item.username}</span>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        <div className="overflow-y-auto" style={{ minHeight: 180, maxHeight: 340 }}>

          {/* Loading skeleton */}
          {searching && (
            <div className="flex flex-col px-4 py-2 gap-0.5">
              {[1, 2, 3].map(n => (
                <div key={n} className="flex items-center gap-3 py-2 animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-[#363636] shrink-0" />
                  <div className="h-3 w-28 bg-[#363636] rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty states */}
          {!searching && isSearchMode && searchResults.length === 0 && (
            <p className="text-center text-sm text-[#a8a8a8] py-10">No results found.</p>
          )}
          {!searching && !isSearchMode && conversations.length === 0 && (
            <p className="text-center text-sm text-[#a8a8a8] py-10">No conversations yet.</p>
          )}

          {/* Conversations (default view) */}
          {!searching && !isSearchMode && conversations.map(conv => {
            const key = `conv:${conv.id}`
            const isSelected = selected.has(key)
            return (
              <button
                key={conv.id}
                onClick={() => toggleConv(conv)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a1a1a] transition-colors text-left"
              >
                <Avatar username={conv.other_user?.username} size={44} className="shrink-0" />
                <span className="flex-1 text-sm font-semibold text-white truncate">
                  {conv.other_user?.username}
                </span>
                <SelectCircle checked={isSelected} />
              </button>
            )
          })}

          {/* User search results */}
          {!searching && isSearchMode && searchResults.map(user => {
            const key = `user:${user.id}`
            const isSelected = selected.has(key)
            return (
              <button
                key={user.id}
                onClick={() => toggleUser(user)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a1a1a] transition-colors text-left"
              >
                <Avatar username={user.username} size={44} className="shrink-0" />
                <span className="flex-1 text-sm font-semibold text-white truncate">
                  {user.username}
                </span>
                <SelectCircle checked={isSelected} />
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-[#363636] px-4 py-3 shrink-0">
          {sent ? (
            <p className="text-center text-sm font-semibold text-white py-0.5">
              {label} shared!
            </p>
          ) : (
            <button
              onClick={handleSend}
              disabled={selected.size === 0 || sending}
              className="w-full py-2 bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SelectCircle({ checked }) {
  return (
    <div
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
        ${checked ? 'bg-[#0095f6] border-[#0095f6]' : 'border-[#737373]'}`}
    >
      {checked && <Check size={13} className="text-white" strokeWidth={3} />}
    </div>
  )
}
