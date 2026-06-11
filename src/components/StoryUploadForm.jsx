import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { uploadToCloudinary, buildSegmentUrls, MAX_STORY_DURATION, SEGMENT_DURATION } from '../utils/cloudinary'
import { createStory, createStories } from '../api/stories'
import { useAuth } from '../auth/AuthContext'

export default function StoryUploadForm({ file, fileType, onBack }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [caption, setCaption] = useState('')
  const [preview] = useState(() => URL.createObjectURL(file))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [videoDuration, setVideoDuration] = useState(null) // seconds, null until loaded
  const [durationError, setDurationError] = useState('')
  const videoRef = useRef(null)

  // Detect duration for video files
  useEffect(() => {
    if (fileType !== 'video') return
    const el = document.createElement('video')
    el.preload = 'metadata'
    el.src = preview
    el.onloadedmetadata = () => {
      const dur = el.duration
      setVideoDuration(dur)
      if (dur > MAX_STORY_DURATION) {
        setDurationError('Story videos must be 3 minutes or less.')
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const segmentCount = fileType === 'video' && videoDuration
    ? Math.ceil(videoDuration / SEGMENT_DURATION)
    : 1

  const handleShare = async () => {
    if (!user) return
    if (durationError) return

    setUploading(true)
    setError('')
    try {
      const { url } = await uploadToCloudinary(file)

      if (fileType === 'video' && segmentCount > 1) {
        const segmentUrls = buildSegmentUrls(url, videoDuration)
        await createStories({
          segments: segmentUrls.map((segUrl, i) => ({
            media_url: segUrl,
            segment_index: i,
            total_segments: segmentCount,
          })),
          media_type: 'video',
          caption,
        })
      } else {
        await createStory({ media_url: url, media_type: fileType, caption })
      }
      navigate('/')
    } catch {
      setError('Upload failed. Please try again.')
    }
    setUploading(false)
  }

  return (
    <div className="flex flex-col md:flex-row gap-0 h-full">
      {/* Preview */}
      <div className="md:w-64 bg-[#121212] flex items-center justify-center shrink-0 aspect-9/16 md:aspect-auto md:h-full">
        {fileType === 'video' ? (
          <video ref={videoRef} src={preview} muted loop autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen size={20} className="text-[#a8a8a8]" />
          <span className="text-white font-semibold">New Story</span>
        </div>

        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Add a caption..."
          rows={4}
          className="w-full bg-transparent border border-[#363636] rounded-lg p-3 text-sm text-white placeholder:text-[#737373] focus:outline-none focus:border-[#a8a8a8] resize-none mb-4"
        />

        {/* Duration info for multi-segment videos */}
        {fileType === 'video' && segmentCount > 1 && !durationError && (
          <p className="text-[#a8a8a8] text-xs mb-3">
            Will be split into {segmentCount} segments of {SEGMENT_DURATION}s each.
          </p>
        )}

        {durationError && <p className="text-red-400 text-sm mb-3">{durationError}</p>}
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
            disabled={uploading || !!durationError}
            className="flex-1 py-2 rounded-lg bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  )
}
