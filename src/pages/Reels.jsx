import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getReelFeed, getReels } from '../api/reels'
import ReelFeed from '../components/ReelFeed'

const LIMIT = 10

export default function Reels() {
  const { user } = useAuth()
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    const fetcher = user ? getReelFeed : getReels
    fetcher(0, LIMIT)
      .then(res => {
        const data = res.data.reels || []
        setReels(data)
        setSkip(data.length)
        setHasMore(data.length === LIMIT)
      })
      .catch(() => setReels([]))
      .finally(() => setLoading(false))
  }, [user])

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const fetcher = user ? getReelFeed : getReels
    fetcher(skip, LIMIT)
      .then(res => {
        const data = res.data.reels || []
        setReels(prev => [...prev, ...data])
        setSkip(prev => prev + data.length)
        setHasMore(data.length === LIMIT)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-white text-lg font-semibold mb-2">No Reels Yet</p>
          <p className="text-[#a8a8a8] text-sm">Follow people to see their reels here.</p>
        </div>
      </div>
    )
  }

  return <ReelFeed reels={reels} onLoadMore={hasMore ? loadMore : null} />
}
