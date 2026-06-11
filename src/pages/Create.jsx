import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ImagePlus, X } from 'lucide-react'
import { uploadToCloudinary } from '../utils/cloudinary'
import { createPost } from '../api/posts'
import { useAuth } from '../auth/AuthContext'
import ReelUploadForm from '../components/ReelUploadForm'
import StoryUploadForm from '../components/StoryUploadForm'

export default function Create() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef(null)

  const [storyMode, setStoryMode] = useState(location.state?.type === 'story')
  const [file, setFile] = useState(null)
  const [fileType, setFileType] = useState(null) // 'image' | 'video'
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    const isVideo = selected.type.startsWith('video/')
    setFile(selected)
    setFileType(isVideo ? 'video' : 'image')
    setPreview(URL.createObjectURL(selected))
    setCaption('')
    setError('')
  }

  const handleBack = () => {
    setFile(null)
    setFileType(null)
    setPreview(null)
    setCaption('')
    setError('')
  }

  const handleSharePost = async () => {
    if (!user || !file) return
    setUploading(true)
    setError('')
    try {
      const { url } = await uploadToCloudinary(file)
      await createPost({ image_url: url, caption })
      navigate('/')
    } catch {
      setError('Upload failed. Please try again.')
    }
    setUploading(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="bg-[#1c1c1c] border border-[#363636] rounded-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#363636]">
          {file && (
            <button onClick={handleBack} className="text-white text-sm hover:text-[#a8a8a8] transition-colors">
              Back
            </button>
          )}
          <span className="text-white font-semibold text-sm mx-auto">
            {!file
              ? storyMode ? 'New story' : 'Create new post'
              : storyMode ? 'New story'
              : fileType === 'video' ? 'New reel' : 'New post'}
          </span>
          {!file && (
            <button onClick={() => navigate(-1)} className="text-white hover:text-[#a8a8a8] transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        {!file ? (
          /* File picker */
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-5 bg-[#262626] rounded-full">
              <ImagePlus size={40} className="text-white" strokeWidth={1} />
            </div>
            <p className="text-white text-xl font-light">Drag photos and videos here</p>
            {/* Type picker */}
            <div className="flex gap-2">
              {[
                { label: 'Post / Reel', active: !storyMode },
                { label: 'Story', active: storyMode },
              ].map(({ label, active }) => (
                <button
                  key={label}
                  onClick={() => setStoryMode(label === 'Story')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    active ? 'bg-white text-black' : 'bg-[#262626] text-white hover:bg-[#363636]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[#a8a8a8] text-sm">
              {storyMode ? 'Disappears after 24 hours' : 'Share photos or short videos as reels'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Select from computer
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : storyMode ? (
          /* Story upload form */
          <div style={{ minHeight: 400 }}>
            <StoryUploadForm file={file} fileType={fileType} onBack={handleBack} />
          </div>
        ) : fileType === 'video' ? (
          /* Video → Reel upload form */
          <div style={{ minHeight: 400 }}>
            <ReelUploadForm videoFile={file} onBack={handleBack} />
          </div>
        ) : (
          /* Image → Post form */
          <div className="flex flex-col md:flex-row gap-0">
            {/* Preview */}
            <div className="md:w-72 shrink-0 bg-black flex items-center justify-center overflow-hidden" style={{ minHeight: 300 }}>
              <img src={preview} alt="preview" className="max-w-full max-h-80 object-contain" />
            </div>
            {/* Form */}
            <div className="flex-1 flex flex-col p-6">
              <p className="text-white text-sm font-semibold mb-1">{user?.username}</p>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={5}
                className="w-full bg-transparent border border-[#363636] rounded-lg p-3 text-sm text-white placeholder:text-[#737373] focus:outline-none focus:border-[#a8a8a8] resize-none mb-4"
              />
              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
              <button
                onClick={handleSharePost}
                disabled={uploading}
                className="w-full py-2 rounded-lg bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold disabled:opacity-50 transition-colors mt-auto"
              >
                {uploading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
