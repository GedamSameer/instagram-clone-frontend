import { Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ReelThumbnailCard({ reel }) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/reels/${reel.id}`)
  }

  return (
    <button
      onClick={handleClick}
      className="block aspect-square overflow-hidden relative group text-left w-full"
    >
      {reel.thumbnail_url ? (
        <img
          src={reel.thumbnail_url}
          alt="reel thumbnail"
          className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-[#262626] flex items-center justify-center">
          <Play size={24} className="text-white" />
        </div>
      )}
      {/* Play icon overlay */}
      <div className="absolute top-2 left-2 flex items-center gap-1">
        <Play size={14} className="text-white fill-white drop-shadow" />
        {reel.like_count > 0 && (
          <span className="text-white text-xs font-semibold drop-shadow">{reel.like_count}</span>
        )}
      </div>
    </button>
  )
}
