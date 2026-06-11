import { useAvatarCache } from '../context/AvatarCacheContext'

const COLORS = [
  'from-purple-500 to-pink-500',
  'from-orange-400 to-pink-500',
  'from-blue-500 to-cyan-400',
  'from-green-400 to-emerald-500',
  'from-yellow-400 to-orange-500',
]

function getColor(username) {
  return COLORS[(username?.charCodeAt(0) ?? 0) % COLORS.length]
}

export default function Avatar({ username, src = '', userId, size = 32, className = '' }) {
  const { getUrl } = useAvatarCache()
  const resolvedSrc = getUrl(userId, src)
  const color = getColor(username)
  const style = { width: size, height: size, flexShrink: 0 }

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={username}
        className={`rounded-full object-cover ${className}`}
        style={style}
        draggable={false}
      />
    )
  }

  return (
    <div
      className={`rounded-full bg-linear-to-br ${color} flex items-center justify-center text-white font-semibold ${className}`}
      style={{ ...style, fontSize: size * 0.38 }}
    >
      {username?.[0]?.toUpperCase()}
    </div>
  )
}

const STORY_GRADIENT = 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
const STORY_VIEWED = '#4d4d4d'

export function StoryAvatar({ username, src = '', userId, size = 56, showRing = true, viewed = false }) {
  const { getUrl } = useAvatarCache()
  const resolvedSrc = getUrl(userId, src)
  const color = getColor(username)
  const inner = resolvedSrc ? (
    <img
      src={resolvedSrc}
      alt={username}
      className="w-full h-full rounded-full object-cover"
      draggable={false}
    />
  ) : (
    <div
      className={`rounded-full bg-linear-to-br ${color} flex items-center justify-center text-white font-semibold w-full h-full`}
      style={{ fontSize: size * 0.38 }}
    >
      {username?.[0]?.toUpperCase()}
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0">
      {showRing ? (
        <div
          className="rounded-full p-0.5"
          style={{
            background: viewed ? STORY_VIEWED : STORY_GRADIENT,
            width: size + 6,
            height: size + 6,
          }}
        >
          <div className="rounded-full bg-black p-0.5 w-full h-full">
            {inner}
          </div>
        </div>
      ) : (
        <div
          className="rounded-full border-2 border-[#262626] overflow-hidden"
          style={{ width: size, height: size }}
        >
          {inner}
        </div>
      )}
      <span className="text-[11px] text-white truncate text-center leading-none" style={{ width: size + 6 }}>
        {username}
      </span>
    </div>
  )
}
