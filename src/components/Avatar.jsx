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

export default function Avatar({ username, size = 32, className = '' }) {
  const color = getColor(username)
  const style = { width: size, height: size, fontSize: size * 0.38, flexShrink: 0 }
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-semibold ${className}`}
      style={style}
    >
      {username?.[0]?.toUpperCase()}
    </div>
  )
}

export function StoryAvatar({ username, size = 56, showRing = true }) {
  const color = getColor(username)
  return (
    <div className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0">
      {showRing ? (
        <div
          className="rounded-full p-[2px]"
          style={{
            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            width: size + 6,
            height: size + 6,
          }}
        >
          <div className="rounded-full bg-black p-[2px] w-full h-full">
            <div
              className={`rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-semibold w-full h-full`}
              style={{ fontSize: size * 0.38 }}
            >
              {username?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-semibold border-2 border-[#262626]`}
          style={{ width: size, height: size, fontSize: size * 0.38 }}
        >
          {username?.[0]?.toUpperCase()}
        </div>
      )}
      <span className="text-[11px] text-white truncate text-center leading-none" style={{ width: size + 6 }}>
        {username}
      </span>
    </div>
  )
}
