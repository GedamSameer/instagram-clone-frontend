import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
  </svg>
)

const PlusSquareIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function Navbar() {
  const { user } = useAuth()
  const location = useLocation()

  if (['/login', '/register'].includes(location.pathname)) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-[975px] mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-2xl" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 500 }}>
          Instagram
        </Link>

        {user ? (
          <div className="flex items-center gap-5">
            <Link to="/" className="text-gray-800 hover:opacity-60 transition-opacity">
              <HomeIcon />
            </Link>
            <Link to="/search" className="text-gray-800 hover:opacity-60 transition-opacity">
              <SearchIcon />
            </Link>
            <Link to="/posts/new" className="text-gray-800 hover:opacity-60 transition-opacity">
              <PlusSquareIcon />
            </Link>
            <Link
              to={`/users/${user.id}`}
              className="text-gray-800 hover:opacity-60 transition-opacity"
              title={user.username}
            >
              <UserIcon />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-sm">
            <Link to="/login" className="text-blue-500 font-semibold hover:text-blue-600">Log in</Link>
            <Link to="/register" className="font-medium text-gray-800 hover:text-gray-600">Sign up</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
