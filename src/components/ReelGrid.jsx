import { useEffect, useState } from 'react'
import { Clapperboard } from 'lucide-react'
import { getUserReels } from '../api/reels'
import ReelThumbnailCard from './ReelThumbnailCard'

export default function ReelGrid({ userId }) {
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserReels(userId)
      .then(res => setReels(res.data.reels || []))
      .catch(() => setReels([]))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <div key={n} className="aspect-square bg-[#262626] animate-pulse" />
        ))}
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="text-center py-16 text-[#a8a8a8]">
        <Clapperboard size={48} strokeWidth={1} className="mx-auto mb-4" />
        <p className="text-lg font-semibold text-white mb-1">No Reels Yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {reels.map(reel => (
        <ReelThumbnailCard key={reel.id} reel={reel} />
      ))}
    </div>
  )
}
