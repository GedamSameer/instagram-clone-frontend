import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAllNotificationsRead } from '../api/notifications'
import { useNotifications } from '../context/NotificationsContext'
import Avatar from '../components/Avatar'

function getNotifText(n) {
  switch (n.type) {
    case 'follow':          return 'started following you.'
    case 'post_like':       return 'liked your post.'
    case 'post_comment':    return 'commented on your post.'
    case 'reel_like':       return 'liked your reel.'
    case 'reel_comment':    return 'commented on your reel.'
    case 'comment_like':    return 'liked your comment.'
    case 'comment_reply':   return 'replied to your comment.'
    case 'message_request': return 'sent you a message.'
    default:                return 'interacted with you.'
  }
}

function getNotifLink(n) {
  switch (n.type) {
    case 'follow':          return `/users/${n.actor?.id}`
    case 'post_like':
    case 'post_comment':    return `/posts/${n.entity_id}`
    case 'reel_like':
    case 'reel_comment':    return `/reels/${n.entity_id}`
    case 'comment_like':
    case 'comment_reply':   return n.entity_id ? `/posts/${n.entity_id}` : '/'
    case 'message_request': return '/messages'
    default:                return '/'
  }
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function groupByTime(notifications) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart  = new Date(todayStart - 6 * 24 * 60 * 60 * 1000)

  const groups = { today: [], thisWeek: [], earlier: [] }
  for (const n of notifications) {
    const d = new Date(n.created_at)
    if (d >= todayStart)  groups.today.push(n)
    else if (d >= weekStart) groups.thisWeek.push(n)
    else groups.earlier.push(n)
  }
  return groups
}

function NotifRow({ n, onClick }) {
  return (
    <button
      onClick={() => onClick(n)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors text-left"
    >
      <div className="relative shrink-0">
        <Avatar username={n.actor?.username} size={44} />
        {!n.is_read && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#0095f6] rounded-full border-2 border-black" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white leading-snug">
          <span className="font-semibold">{n.actor?.username}</span>
          {' '}
          {getNotifText(n)}
          {' '}
          <span className="text-[#a8a8a8]">{timeAgo(n.created_at)}</span>
        </p>
      </div>
    </button>
  )
}

function NotifGroup({ label, items, onClickItem }) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="px-4 py-3 text-sm font-semibold text-white">{label}</p>
      {items.map(n => (
        <NotifRow key={n.id} n={n} onClick={onClickItem} />
      ))}
    </div>
  )
}

export default function Notifications() {
  const navigate = useNavigate()
  const { setUnreadCount } = useNotifications()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotifications()
      .then(res => setNotifications(res.data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    markAllNotificationsRead()
      .then(() => setUnreadCount(0))
      .catch(() => {})
  }, [])

  const handleClickNotif = (n) => {
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
    navigate(getNotifLink(n))
  }

  const groups = groupByTime(notifications)

  return (
    <div className="max-w-xl mx-auto pt-4 pb-20 md:pb-4">
      <h1 className="px-4 py-4 text-white font-semibold text-base">Notifications</h1>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 border-2 border-[#a8a8a8] rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🔔</span>
          </div>
          <p className="font-semibold text-white mb-1">Activity on your posts</p>
          <p className="text-sm text-[#a8a8a8]">
            When someone likes or comments on one of your posts, you'll see it here.
          </p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <>
          <NotifGroup label="Today"     items={groups.today}    onClickItem={handleClickNotif} />
          <NotifGroup label="This week" items={groups.thisWeek} onClickItem={handleClickNotif} />
          <NotifGroup label="Earlier"   items={groups.earlier}  onClickItem={handleClickNotif} />
        </>
      )}
    </div>
  )
}
