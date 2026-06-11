const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const MAX_STORY_DURATION = 180 // seconds (3 minutes)
export const SEGMENT_DURATION = 30   // seconds per segment

/**
 * Build Cloudinary segment URLs from a base video URL.
 * Uses so_X,eo_Y (start/end offset) URL transformations.
 * totalDuration is in seconds (float OK).
 */
export function buildSegmentUrls(baseVideoUrl, totalDuration) {
  const segCount = Math.ceil(totalDuration / SEGMENT_DURATION)
  return Array.from({ length: segCount }, (_, i) => {
    const start = i * SEGMENT_DURATION
    const end = Math.min(start + SEGMENT_DURATION, totalDuration)
    return baseVideoUrl.replace('/upload/', `/upload/so_${start},eo_${Math.floor(end)}/`)
  })
}

export async function uploadToCloudinary(file) {
  const isVideo = file.type.startsWith('video/')
  const resourceType = isVideo ? 'video' : 'image'

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()

  if (isVideo) {
    const videoUrl = data.secure_url
    const thumbnailUrl = videoUrl
      .replace('/upload/', '/upload/so_0/')
      .replace(/\.(mp4|mov|webm|avi)$/i, '.jpg')
    return { url: videoUrl, thumbnailUrl }
  }

  return { url: data.secure_url, thumbnailUrl: data.secure_url }
}
