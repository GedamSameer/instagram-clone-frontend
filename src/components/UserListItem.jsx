import { Link } from 'react-router-dom'
import Avatar from './Avatar'

export default function UserListItem({ user, onClose, extra }) {
  return (
    <Link
      to={`/users/${user.id}`}
      onClick={onClose}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a1a1a] transition-colors rounded-lg"
    >
      <Avatar username={user.username} size={44} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight truncate">{user.username}</p>
        {user.full_name && (
          <p className="text-xs text-[#a8a8a8] truncate">{user.full_name}</p>
        )}
      </div>
      {extra && <div className="shrink-0">{extra}</div>}
    </Link>
  )
}
