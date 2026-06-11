const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

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
