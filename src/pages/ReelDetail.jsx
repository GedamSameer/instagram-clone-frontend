import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getReel } from '../api/reels'
import ReelCard from '../components/ReelCard'

export default function ReelDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [reel, setReel] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReel(id)
      .then(res => setReel(res.data.reel))
      .catch(() => setReel(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!reel) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <p className="text-[#a8a8a8]">Reel not found.</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[#262626]">
        <button onClick={() => navigate(-1)} className="text-white hover:text-[#a8a8a8] transition-colors">
          <ArrowLeft size={24} />
        </button>
        <span className="text-white font-semibold">Reel</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <ReelCard reel={reel} />
      </div>
    </div>
  )
}
