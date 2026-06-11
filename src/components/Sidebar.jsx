import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Search, Compass, Clapperboard, MessageCircle,
  Heart, SquarePlus, MoreHorizontal
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import Avatar from './Avatar'

const NAV_ITEMS = [
  { label: 'Home', Icon: Home, to: '/' },
  { label: 'Search', Icon: Search, to: '/search' },
  { label: 'Explore', Icon: Compass, to: '/explore' },
  { label: 'Reels', Icon: Clapperboard, to: '/reels' },
  { label: 'Messages', Icon: MessageCircle, to: '/messages' },
  { label: 'Notifications', Icon: Heart, to: '/notifications' },
  { label: 'Create', Icon: SquarePlus, to: '/create' },
]

function NavItem({ label, Icon, to, active, badge }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-colors hover:bg-[#1a1a1a] group ${active ? 'font-bold' : ''}`}
    >
      <div className="relative shrink-0">
        <Icon
          size={24}
          strokeWidth={active ? 2.5 : 2}
          className="text-white"
        />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className={`text-[15px] text-white hidden xl:block ${active ? 'font-bold' : 'font-normal'}`}>
        {label}
      </span>
    </Link>
  )
}

/* Instagram wordmark SVG path */
function InstagramWordmark() {
  return (
    <span
      className="text-white text-[1.6rem] leading-none select-none"
      style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
    >
      Instagram
    </span>
  )
}

/* Camera icon for narrow sidebar */
function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-white">
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

/* Threads icon */
function ThreadsIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-white">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.474 12.01v-.017c.027-3.579.876-6.43 2.523-8.482C5.845 1.206 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.839 3.155 3.441 5.44l-2.344.655c-1-3.812-3.386-5.735-7.926-5.764-2.973.025-5.009.939-6.469 2.823C4.42 6.783 3.736 9.156 3.715 12c.022 2.847.706 5.218 2.007 6.756 1.461 1.875 3.498 2.785 6.47 2.81 3.07-.027 4.925-1.037 5.876-3.186.56-1.28.74-2.746.54-4.459H15.87c-.257 2.895-1.595 4.457-4.14 4.612l-.31.014c-1.7.031-3.08-.499-4.078-1.529-.882-.905-1.305-2.133-1.27-3.605.033-1.422.458-2.61 1.224-3.498.845-1.007 2.052-1.543 3.437-1.543.09 0 .18.003.27.008 1.3.063 2.36.535 3.03 1.335.327.387.53.833.6 1.323a5.26 5.26 0 01.046.703v3.17h2.276V12.6a7.54 7.54 0 00-.066-.98c-.139-1.022-.532-1.956-1.14-2.695C15.01 7.6 13.5 6.898 11.5 6.795l-.265-.012c-2.085 0-3.892.814-5.1 2.29-.98 1.189-1.524 2.784-1.565 4.617-.038 1.89.5 3.54 1.52 4.644 1.119 1.21 2.83 1.875 4.939 1.875h.17c2.974-.176 5.058-1.786 5.835-4.525l2.301.667c-.47 1.762-1.35 3.185-2.617 4.237-1.319 1.096-2.97 1.791-5.046 1.932H12.2c-.005 0-.01.001-.014.002h-.001l.001-.001z" />
    </svg>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full md:w-18 xl:w-61 border-r border-[#262626] flex-col py-2 z-50 bg-black transition-all duration-200">
      {/* Logo */}
      <div className="px-3 py-7 mb-1">
        <div className="px-0 xl:px-0 flex items-center justify-center xl:justify-start">
          <span className="hidden xl:block">
            <InstagramWordmark />
          </span>
          <span className="block xl:hidden">
            <CameraIcon />
          </span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.label}
            {...item}
            active={location.pathname === item.to}
            badge={item.label === 'Notifications' ? unreadCount : 0}
          />
        ))}

        {/* Profile item */}
        {user && (
          <Link
            to={`/users/${user.id}`}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-colors hover:bg-[#1a1a1a] ${location.pathname === `/users/${user.id}` ? 'font-bold' : ''}`}
          >
            <Avatar username={user.username} size={24} className="shrink-0" />
            <span className={`text-[15px] text-white hidden xl:block ${location.pathname === `/users/${user.id}` ? 'font-bold' : 'font-normal'}`}>
              Profile
            </span>
          </Link>
        )}

        {/* Threads */}
        <button className="flex items-center gap-4 px-3 py-3 rounded-xl transition-colors hover:bg-[#1a1a1a] w-full text-left">
          <ThreadsIcon size={24} />
          <span className="text-[15px] text-white font-normal hidden xl:block">Threads</span>
        </button>
      </nav>

      {/* More button at bottom */}
      <div className="px-2 pb-4">
        <button
          className="flex items-center gap-4 px-3 py-3 rounded-xl transition-colors hover:bg-[#1a1a1a] w-full text-left"
          onClick={handleLogout}
        >
          <MoreHorizontal size={24} className="text-white shrink-0" />
          <span className="text-[15px] text-white font-normal hidden xl:block">More</span>
        </button>
      </div>
    </aside>
  )
}

/* Mobile bottom navigation */
export function MobileNav() {
  const location = useLocation()
  const { user } = useAuth()

  const items = [
    { Icon: Home, to: '/' },
    { Icon: Search, to: '/search' },
    { Icon: SquarePlus, to: '/create' },
    { Icon: Clapperboard, to: '/reels' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-[#262626] flex items-center justify-around px-2 py-3 z-50">
      {items.map(({ Icon, to }) => (
        <Link key={to} to={to}>
          <Icon
            size={24}
            strokeWidth={location.pathname === to ? 2.5 : 2}
            className="text-white"
          />
        </Link>
      ))}
      {user && (
        <Link to={`/users/${user.id}`}>
          <Avatar username={user.username} size={24} />
        </Link>
      )}
    </nav>
  )
}
