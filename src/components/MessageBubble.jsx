import { timeAgo } from '../utils/time'

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group`}>
      <div className="relative max-w-[65%]">
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
            ${isOwn
              ? 'bg-[#3797f0] text-white rounded-br-sm'
              : 'bg-[#262626] text-white rounded-bl-sm'
            }
            ${message.is_deleted_for_everyone ? 'opacity-50' : ''}`}
        >
          {message.is_deleted_for_everyone
            ? <span className="italic">Message deleted</span>
            : message.body
          }
        </div>
        <p className={`text-[10px] text-[#737373] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity
          ${isOwn ? 'text-right' : 'text-left'}`}
        >
          {timeAgo(message.created_at)}
        </p>
      </div>
    </div>
  )
}
