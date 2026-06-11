import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getUnreadCount } from '../api/notifications'
import { createMessagesSocket } from '../utils/messagesSocket'

const NotificationsContext = createContext({ unreadCount: 0, setUnreadCount: () => {} })

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    getUnreadCount()
      .then(res => setUnreadCount(res.data.count ?? 0))
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    const socket = createMessagesSocket({
      onMessage(data) {
        if (data.type === 'notification') {
          setUnreadCount(prev => prev + 1)
        }
      },
    })
    return () => socket.disconnect()
  }, [user?.id])

  return (
    <NotificationsContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
