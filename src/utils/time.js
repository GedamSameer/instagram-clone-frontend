export function timeAgo(dateStr) {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  // Clamp to 0 so we never display negative values
  const diffMs = Math.max(0, Date.now() - date.getTime())
  const s = Math.floor(diffMs / 1000)

  if (s < 60) return `${s}s`

  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`

  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`

  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`

  const now = new Date()
  const month = date.toLocaleString('en-US', { month: 'short' })
  const day = date.getDate()
  return date.getFullYear() === now.getFullYear()
    ? `${month} ${day}`
    : `${month} ${day}, ${date.getFullYear()}`
}
