import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Video } from 'lucide-react'
import { uploadToCloudinary } from '../utils/cloudinary'
import { createReel } from '../api/reels'
import { useAuth } from '../auth/AuthContext'

export default function ReelUploadForm({ videoFile, onBack }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState(() => URL.createObjectURL(videoFile))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleShare = async () => {
    if (!user) return
    setUploading(true)
    setError('')
    try {
      const { url, thumbnailUrl } = await uploadToCloudinary(videoFile)
      await createReel({ video_url: url, thumbnail_url: thumbnailUrl, caption })
      navigate('/reels')
    } catch {
      setError('Upload failed. Please try again.')
    }
    setUploading(false)
  }

  return (
    <div className="flex flex-col md:flex-row gap-0 h-full">
      {/* Left: video preview */}
      <div className="md:w-64 bg-[#121212] flex items-center justify-center shrink-0 aspect-[9/16] md:aspect-auto md:h-full">
        <video
          src={preview}
          muted
          loop
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right: caption + share */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex items-center gap-2 mb-6">
          <Video size={20} className="text-[#a8a8a8]" />
          <span className="text-white font-semibold">New Reel</span>
        </div>

        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Write a caption..."
          rows={4}
          className="w-full bg-transparent border border-[#363636] rounded-lg p-3 text-sm text-white placeholder:text-[#737373] focus:outline-none focus:border-[#a8a8a8] resize-none mb-4"
        />

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <div className="flex gap-3 mt-auto">
          <button
            onClick={onBack}
            disabled={uploading}
            className="flex-1 py-2 rounded-lg border border-[#363636] text-white text-sm font-semibold hover:bg-[#1a1a1a] disabled:opacity-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleShare}
            disabled={uploading}
            className="flex-1 py-2 rounded-lg bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  )
}
