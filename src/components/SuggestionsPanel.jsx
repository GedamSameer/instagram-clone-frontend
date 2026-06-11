import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Avatar from './Avatar'
import { searchUsers, followUser, unfollowUser } from '../api/users'

const FOOTER_LINKS = ['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms', 'Locations', 'Language']

function SuggestionRow({ suggUser, onFollowToggle }) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFollow = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      if (following) {
        await unfollowUser(suggUser.id)
        setFollowing(false)
      } else {
        await followUser(suggUser.id)
        setFollowing(true)
        if (onFollowToggle) onFollowToggle(suggUser.id)
      }
    } catch {}
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3 mb-3">
      <Link to={`/users/${suggUser.id}`} className="shrink-0">
        <Avatar username={suggUser.username} size={32} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/users/${suggUser.id}`} className="block text-sm font-semibold text-white leading-tight truncate hover:opacity-80">
          {suggUser.username}
        </Link>
        <p className="text-xs text-[#a8a8a8] truncate">Suggested for you</p>
      </div>
      <button
        onClick={handleFollow}
        disabled={loading}
        className={`text-xs font-semibold shrink-0 transition-opacity ${following ? 'text-white hover:text-[#a8a8a8]' : 'text-[#0095f6] hover:text-white'} disabled:opacity-50`}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  )
}

export default function SuggestionsPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    searchUsers('')
      .then(res => {
        const all = res.data.users || res.data || []
        setSuggestions(all.filter(u => u.id !== user?.id).slice(0, 5))
      })
      .catch(() => {})
  }, [user?.id])

  const handleSwitchAccount = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="sticky top-8">
      {/* Current user row */}
      {user && (
        <div className="flex items-center gap-3 mb-6">
          <Link to={`/users/${user.id}`} className="shrink-0">
            <Avatar username={user.username} size={44} />
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/users/${user.id}`} className="block text-sm font-semibold text-white leading-tight truncate hover:opacity-80">
              {user.username}
            </Link>
            <p className="text-sm text-[#a8a8a8] truncate">{user.email || user.username}</p>
          </div>
          <button
            onClick={handleSwitchAccount}
            className="text-xs font-semibold text-[#0095f6] hover:text-white shrink-0 transition-colors"
          >
            Switch
          </button>
        </div>
      )}

      {/* Suggested for you header */}
      {suggestions.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-[#a8a8a8]">Suggested for you</span>
            <Link to="/search" className="text-xs font-semibold text-white hover:text-[#a8a8a8] transition-colors">
              See all
            </Link>
          </div>

          {suggestions.map(s => (
            <SuggestionRow key={s.id} suggUser={s} />
          ))}
        </>
      )}

      {/* Footer */}
      <div className="mt-5">
        <p className="text-[11px] text-[#a8a8a8] leading-relaxed">
          {FOOTER_LINKS.join(' · ')}
        </p>
        <p className="text-[11px] text-[#a8a8a8] mt-3">© 2024 Instagram from Meta</p>
      </div>
    </div>
  )
}
