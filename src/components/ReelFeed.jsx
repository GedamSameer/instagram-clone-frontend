import { useEffect, useRef } from 'react'
import ReelCard from './ReelCard'

export default function ReelFeed({ reels, onLoadMore }) {
  const containerRef = useRef(null)
  const activeVideoRef = useRef(null)
  const sentinelRef = useRef(null)

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e) => {
      const container = containerRef.current
      if (!container) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        container.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        container.scrollBy({ top: -window.innerHeight, behavior: 'smooth' })
      } else if (e.key === ' ') {
        e.preventDefault()
        const v = activeVideoRef.current
        if (v) v.paused ? v.play() : v.pause()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* Infinite scroll sentinel */
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !onLoadMore) return

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore() },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [onLoadMore])

  const handleBecomeActive = (videoRef) => {
    activeVideoRef.current = videoRef.current
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {reels.map(reel => (
        <div
          key={reel.id}
          className="h-screen snap-start flex items-center justify-center bg-black"
          style={{ scrollSnapAlign: 'start' }}
        >
          <ReelCard reel={reel} onBecomeActive={handleBecomeActive} />
        </div>
      ))}
      <div ref={sentinelRef} className="h-1" />
    </div>
  )
}
