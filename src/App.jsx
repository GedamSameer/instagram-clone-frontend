import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import ProtectedRoute from './auth/ProtectedRoute'
import Sidebar, { MobileNav } from './components/Sidebar'
import PostDetailModal from './components/PostDetailModal'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Create from './pages/Create'
import PostDetail from './pages/PostDetail'
import ReelDetail from './pages/ReelDetail'
import Reels from './pages/Reels'
import Profile from './pages/Profile'
import Search from './pages/Search'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'

const AUTH_PATHS = ['/login', '/register']

function AppLayout() {
  const location = useLocation()
  const background = location.state?.background
  const isAuthPage = AUTH_PATHS.includes(location.pathname)

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    )
  }

  return (
    <div className="flex bg-black min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-18 xl:ml-61">
        <Routes location={background || location}>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
          {/* Keep old path working as redirect */}
          <Route path="/posts/new" element={<ProtectedRoute><Create /></ProtectedRoute>} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/reels/:id" element={<ReelDetail />} />
          <Route path="/users/:id" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/explore" element={<PlaceholderPage label="Explore" />} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        </Routes>

        {/* Modal overlay — rendered on top when navigated with background state */}
        {background && (
          <Routes>
            <Route path="/posts/:id" element={<PostDetailModal />} />
          </Routes>
        )}
      </main>
      <MobileNav />
    </div>
  )
}

function PlaceholderPage({ label }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[#a8a8a8] text-lg">{label} — coming soon</p>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AppLayout />
      </NotificationsProvider>
    </AuthProvider>
  )
}

export default App
