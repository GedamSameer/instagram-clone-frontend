export function timeAgo(dateStr) {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const diffMs = Math.max(0, Date.now() - date.getTime())
  const s = Math.floor(diffMs / 1000)

  if (s < 60)  return `${s}s`

  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m`

  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h`

  const d = Math.floor(h / 24)
  if (d < 7)   return `${d}d`
  if (d < 30)  return `${Math.floor(d / 7)}w`
  if (d < 365) return `${Math.floor(d / 30)}mo`
  return `${Math.floor(d / 365)}y`
}
