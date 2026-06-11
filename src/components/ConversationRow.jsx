import Avatar from './Avatar'
import { timeAgo } from '../utils/time'

export default function ConversationRow({ conv, active, currentUserId, onClick }) {
  const other = conv.other_user
  const last = conv.last_message

  let preview = 'No messages yet'
  if (last) {
    const prefix = last.sender_id === currentUserId ? 'You: ' : ''
    const text = last.is_deleted_for_everyone ? 'Message deleted' : last.body
    preview = prefix + text
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left
        ${active ? 'bg-[#1a1a1a]' : 'hover:bg-[#121212]'}`}
    >
      <div className="shrink-0">
        <Avatar username={other?.username} size={56} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate leading-tight">
          {other?.username}
        </p>
        <p className={`text-sm truncate mt-0.5 leading-tight
          ${last && last.sender_id !== currentUserId && !last.is_deleted_for_everyone
            ? 'text-white'
            : 'text-[#737373]'
          }`}
        >
          {preview}
        </p>
      </div>

      {last && (
        <span className="shrink-0 text-xs text-[#737373]">
          {timeAgo(last.created_at)}
        </span>
      )}
    </button>
  )
}
