import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

export default function ReelVideoPlayer({ src, poster, onBecomeActive }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          video.play().catch(() => {})
          setPaused(false)
          onBecomeActive?.(videoRef)
        } else {
          video.pause()
          setPaused(true)
        }
      },
      { threshold: 0.7 }
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [onBecomeActive])

  const togglePlay = (e) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
      setPaused(false)
    } else {
      video.pause()
      setPaused(true)
    }
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setMuted(videoRef.current.muted)
  }

  return (
    <div ref={containerRef} className="absolute inset-0" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
      {/* Pause indicator */}
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[20px] border-l-white ml-1" />
          </div>
        </div>
      )}
      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  )
}
