import { Link } from 'react-router-dom'
import { timeAgo } from '../utils/time'

export default function MessageBubble({ message, isOwn }) {
  const type = message.message_type || 'text'

  if (message.is_deleted_for_everyone) {
    return <DeletedBubble isOwn={isOwn} timestamp={message.created_at} />
  }

  if (type === 'shared_post') {
    return <SharedPostBubble message={message} isOwn={isOwn} />
  }

  if (type === 'shared_reel') {
    return <SharedReelBubble message={message} isOwn={isOwn} />
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group`}>
      <div className="relative max-w-[65%]">
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
            ${isOwn ? 'bg-[#3797f0] text-white rounded-br-sm' : 'bg-[#262626] text-white rounded-bl-sm'}`}
        >
          {message.body}
        </div>
        <Timestamp isOwn={isOwn} ts={message.created_at} />
      </div>
    </div>
  )
}

function DeletedBubble({ isOwn, timestamp }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group`}>
      <div className="relative max-w-[65%]">
        <div className={`px-3 py-2 rounded-2xl text-sm opacity-50
          ${isOwn ? 'bg-[#3797f0] text-white rounded-br-sm' : 'bg-[#262626] text-white rounded-bl-sm'}`}>
          <span className="italic">Message deleted</span>
        </div>
        <Timestamp isOwn={isOwn} ts={timestamp} />
      </div>
    </div>
  )
}

function SharedPostBubble({ message, isOwn }) {
  const post = message.shared_post
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group`}>
      <div className="relative">
        {post ? (
          <Link to={`/posts/${post.id}`} className="block">
            <div
              className={`w-52 overflow-hidden border border-[#363636] rounded-2xl
                ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
            >
              <img
                src={post.image_url}
                alt="shared post"
                className="w-full aspect-square object-cover"
              />
              <div className="px-3 py-2 bg-[#1a1a1a]">
                <p className="text-xs font-semibold text-white truncate">
                  {post.user?.username}
                </p>
                {post.caption && (
                  <p className="text-xs text-[#a8a8a8] mt-0.5 line-clamp-2">
                    {post.caption}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ) : (
          <UnavailableCard isOwn={isOwn} label="This post is unavailable." />
        )}
        <Timestamp isOwn={isOwn} ts={message.created_at} />
      </div>
    </div>
  )
}

function SharedReelBubble({ message, isOwn }) {
  const reel = message.shared_reel
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group`}>
      <div className="relative">
        {reel ? (
          <Link to={`/reels/${reel.id}`} className="block">
            <div
              className={`w-52 overflow-hidden border border-[#363636] rounded-2xl
                ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
            >
              {reel.thumbnail_url ? (
                <img
                  src={reel.thumbnail_url}
                  alt="shared reel"
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-[#262626] flex items-center justify-center">
                  <span className="text-[#a8a8a8] text-xs">Reel</span>
                </div>
              )}
              <div className="px-3 py-2 bg-[#1a1a1a]">
                <p className="text-xs font-semibold text-white truncate">
                  {reel.user?.username}
                </p>
                {reel.caption && (
                  <p className="text-xs text-[#a8a8a8] mt-0.5 line-clamp-2">
                    {reel.caption}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ) : (
          <UnavailableCard isOwn={isOwn} label="This reel is unavailable." />
        )}
        <Timestamp isOwn={isOwn} ts={message.created_at} />
      </div>
    </div>
  )
}

function UnavailableCard({ isOwn, label }) {
  return (
    <div
      className={`w-52 px-3 py-3 rounded-2xl bg-[#262626] border border-[#363636] text-sm text-[#a8a8a8] italic
        ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
    >
      {label}
    </div>
  )
}

function Timestamp({ isOwn, ts }) {
  return (
    <p
      className={`text-[10px] text-[#737373] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity
        ${isOwn ? 'text-right' : 'text-left'}`}
    >
      {timeAgo(ts)}
    </p>
  )
}
