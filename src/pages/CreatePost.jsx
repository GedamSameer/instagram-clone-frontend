import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ImagePlus } from 'lucide-react'
import { uploadToCloudinary } from '../utils/cloudinary'
import { createPost } from '../api/posts'

export default function CreatePost() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!file) return setError('Please select an image')
    setLoading(true)
    setError(null)
    try {
      const image_url = await uploadToCloudinary(file)
      await createPost({ image_url, caption })
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-black min-h-screen flex justify-center py-8 px-4 pb-20 md:pb-8">
      <div className="w-full max-w-117.5">
        <div className="border border-[#262626]">
          {/* Header */}
          <div className="border-b border-[#262626] px-4 py-3 flex items-center justify-between">
            <Link to="/" className="text-sm text-[#a8a8a8] hover:text-white transition-colors">
              Cancel
            </Link>
            <h1 className="text-sm font-semibold text-white">New post</h1>
            <button
              form="create-post-form"
              type="submit"
              disabled={loading || !file}
              className="text-sm font-semibold text-[#0095f6] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>

          <form id="create-post-form" onSubmit={submit}>
            {/* Image picker / preview */}
            {preview ? (
              <img src={preview} alt="preview" className="w-full object-cover max-h-80" />
            ) : (
              <label className="flex flex-col items-center justify-center h-64 cursor-pointer hover:bg-[#111] transition-colors">
                <ImagePlus size={64} strokeWidth={0.75} className="text-[#363636] mb-3" />
                <span className="text-[#0095f6] text-sm font-medium hover:text-white transition-colors">
                  Select from computer
                </span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}

            {/* Caption — shown after image is selected */}
            {preview && (
              <div className="border-t border-[#262626] p-4">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-transparent text-sm text-white resize-none focus:outline-none placeholder:text-[#737373]"
                  rows={4}
                  placeholder="Write a caption..."
                />
              </div>
            )}
          </form>

          {error && <div className="px-4 pb-3 text-sm text-red-400">{error}</div>}
        </div>
      </div>
    </div>
  )
}
