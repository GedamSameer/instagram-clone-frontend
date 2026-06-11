import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search as SearchIcon, X } from 'lucide-react'
import { searchUsers } from '../api/users'
import Avatar from '../components/Avatar'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    timerRef.current = setTimeout(() => {
      setLoading(true)
      searchUsers(query.trim())
        .then(res => setResults(res.data.users || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  return (
    <div className="bg-black min-h-screen px-4 py-8 pb-20 md:pb-8">
      <div className="max-w-117.5 mx-auto">
        {/* Search input */}
        <div className="relative mb-6">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a8a8]">
            <SearchIcon size={16} />
          </div>
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-[#262626] rounded-lg pl-9 pr-9 py-2.5 text-sm text-white focus:outline-none placeholder:text-[#a8a8a8]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a8a8] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {loading && (
          <p className="text-center text-[#a8a8a8] text-sm">Searching...</p>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <p className="text-center text-[#a8a8a8] text-sm">No results for "{query}"</p>
        )}

        <div className="flex flex-col gap-0.5">
          {results.map(u => (
            <Link
              to={`/users/${u.id}`}
              key={u.id}
              className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-[#1a1a1a] transition-colors"
            >
              <Avatar username={u.username} src={u.profile_picture_url} userId={u.id} size={44} />
              <div>
                <p className="text-sm font-semibold text-white">{u.username}</p>
                <p className="text-xs text-[#a8a8a8]">{u.email || ''}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
