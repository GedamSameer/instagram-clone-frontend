import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { Grid3x3, Clapperboard, Bookmark, Play } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getProfile, getUserPosts, followUser, unfollowUser, getUserReels } from '../api/users'
import { getSavedPosts } from '../api/posts'
import { getSavedReels } from '../api/reels'
import Avatar from '../components/Avatar'
import FollowersFollowingModal from '../components/FollowersFollowingModal'
import ReelGrid from '../components/ReelGrid'
import ReelThumbnailCard from '../components/ReelThumbnailCard'

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [following, setFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [activeTab, setActiveTab] = useState('posts')
  const [modal, setModal] = useState(null)

  // Saved tab state
  const [savedPosts, setSavedPosts] = useState([])
  const [savedReels, setSavedReels] = useState([])
  const [savedFilter, setSavedFilter] = useState('all') // 'all' | 'posts' | 'reels'
  const [savedLoaded, setSavedLoaded] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setActiveTab('posts')
    setSavedLoaded(false)
    Promise.all([getProfile(id), getUserPosts(id), getUserReels(id)])
      .then(([profileRes, postsRes, reelsRes]) => {
        setProfile(profileRes.data)
        setFollowing(profileRes.data.is_following)
        setFollowersCount(profileRes.data.followers_count)
        setPosts(postsRes.data.posts || [])
        setReels(reelsRes.data.reels || [])
      })
      .catch(() => setError('User not found'))
      .finally(() => setLoading(false))
  }, [id])

  const isOwnProfile = user && profile && user.id === profile.id

  // Load saved content lazily when Saved tab is first opened
  useEffect(() => {
    if (activeTab === 'saved' && isOwnProfile && !savedLoaded) {
      Promise.all([getSavedPosts(), getSavedReels()])
        .then(([postsRes, reelsRes]) => {
          setSavedPosts(postsRes.data.posts || [])
          setSavedReels(reelsRes.data.reels || [])
          setSavedLoaded(true)
        })
        .catch(() => setSavedLoaded(true))
    }
  }, [activeTab, isOwnProfile, savedLoaded])

  // Mixed posts + reels sorted by created_at desc
  const mixedContent = [...posts.map(p => ({ ...p, _type: 'post' })), ...reels.map(r => ({ ...r, _type: 'reel' }))]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const handleFollow = async () => {
    try {
      if (following) {
        const res = await unfollowUser(id)
        setFollowing(false)
        setFollowersCount(res.data.followers_count)
      } else {
        const res = await followUser(id)
        setFollowing(true)
        setFollowersCount(res.data.followers_count)
      }
    } catch {}
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const openPostModal = (post) => {
    navigate(`/posts/${post.id}`, { state: { background: location } })
  }

  const openReelPage = (reel) => {
    navigate(`/reels/${reel.id}`, { state: { background: location } })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-start gap-8 w-full max-w-233.75 px-4 py-10 animate-pulse">
          <div className="flex items-start gap-16 w-full">
            <div className="w-20 h-20 rounded-full bg-[#262626] shrink-0" />
            <div className="flex flex-col gap-4 flex-1">
              <div className="h-5 w-40 bg-[#262626] rounded" />
              <div className="flex gap-8">
                {[1, 2, 3].map(n => <div key={n} className="h-4 w-16 bg-[#262626] rounded" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  // Saved tab filtered items
  const savedItems = savedFilter === 'posts'
    ? savedPosts.map(p => ({ ...p, _type: 'post' }))
    : savedFilter === 'reels'
      ? savedReels.map(r => ({ ...r, _type: 'reel' }))
      : [...savedPosts.map(p => ({ ...p, _type: 'post' })), ...savedReels.map(r => ({ ...r, _type: 'reel' }))]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div className="bg-black min-h-screen pb-20 md:pb-0">
      <div className="max-w-233.75 mx-auto px-4 py-10">
        {/* Profile header */}
        <div className="flex items-start gap-8 md:gap-16 mb-10">
          <div className="shrink-0">
            <div
              className="rounded-full p-0.75"
              style={{
                background: isOwnProfile
                  ? '#262626'
                  : 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              }}
            >
              <div className="rounded-full bg-black p-0.75">
                <Avatar username={profile.username} size={77} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-xl font-light text-white">{profile.username}</h1>
              {isOwnProfile ? (
                <>
                  <Link
                    to="/create"
                    className="bg-[#363636] hover:bg-[#4d4d4d] text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Edit profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-[#363636] hover:bg-[#4d4d4d] text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Log out
                  </button>
                </>
              ) : user ? (
                <button
                  onClick={handleFollow}
                  className={`text-sm font-semibold px-6 py-1.5 rounded-lg transition-colors ${
                    following
                      ? 'bg-[#363636] hover:bg-[#4d4d4d] text-white'
                      : 'bg-[#0095f6] hover:bg-[#1877f2] text-white'
                  }`}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold px-6 py-1.5 rounded-lg transition-colors"
                >
                  Follow
                </Link>
              )}
            </div>

            <div className="flex gap-8 text-sm text-white">
              <span>
                <strong className="font-semibold">{mixedContent.length}</strong>{' '}
                <span>{mixedContent.length === 1 ? 'post' : 'posts'}</span>
              </span>
              <button
                onClick={() => setModal('followers')}
                className="hover:opacity-70 transition-opacity text-left"
              >
                <strong className="font-semibold">{followersCount}</strong>{' '}
                <span>{followersCount === 1 ? 'follower' : 'followers'}</span>
              </button>
              <button
                onClick={() => setModal('following')}
                className="hover:opacity-70 transition-opacity text-left"
              >
                <strong className="font-semibold">{profile.following_count}</strong>{' '}
                <span>following</span>
              </button>
            </div>

            {profile.bio && (
              <p className="text-sm text-white leading-snug">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="border-t border-[#262626] flex items-center justify-center gap-12 mb-1">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-1.5 py-3 -mt-px text-xs font-semibold tracking-widest uppercase transition-colors ${
              activeTab === 'posts' ? 'border-t border-white text-white' : 'text-[#a8a8a8] hover:text-white'
            }`}
          >
            <Grid3x3 size={12} strokeWidth={2} />
            Posts
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`flex items-center gap-1.5 py-3 -mt-px text-xs font-semibold tracking-widest uppercase transition-colors ${
              activeTab === 'reels' ? 'border-t border-white text-white' : 'text-[#a8a8a8] hover:text-white'
            }`}
          >
            <Clapperboard size={12} strokeWidth={2} />
            Reels
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-1.5 py-3 -mt-px text-xs font-semibold tracking-widest uppercase transition-colors ${
                activeTab === 'saved' ? 'border-t border-white text-white' : 'text-[#a8a8a8] hover:text-white'
              }`}
            >
              <Bookmark size={12} strokeWidth={2} />
              Saved
            </button>
          )}
        </div>

        {/* Posts tab — mixed posts + reels */}
        {activeTab === 'posts' && (
          mixedContent.length === 0 ? (
            <div className="text-center text-[#a8a8a8] py-16">
              <p className="text-lg font-semibold text-white mb-1">No Posts Yet</p>
              {isOwnProfile && (
                <Link to="/create" className="text-[#0095f6] text-sm hover:text-white transition-colors">
                  Share your first photo or reel
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {mixedContent.map(item =>
                item._type === 'reel' ? (
                  <ReelThumbnailCard key={`reel-${item.id}`} reel={item} />
                ) : (
                  <button
                    key={`post-${item.id}`}
                    onClick={() => openPostModal(item)}
                    className="block aspect-square overflow-hidden relative group text-left"
                  >
                    <img
                      src={item.image_url}
                      alt="post"
                      className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                      loading="lazy"
                    />
                  </button>
                )
              )}
            </div>
          )
        )}

        {/* Reels tab */}
        {activeTab === 'reels' && <ReelGrid userId={id} />}

        {/* Saved tab */}
        {activeTab === 'saved' && isOwnProfile && (
          <div>
            {/* Filter buttons */}
            <div className="flex gap-2 mb-4">
              {['all', 'posts', 'reels'].map(f => (
                <button
                  key={f}
                  onClick={() => setSavedFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                    savedFilter === f
                      ? 'bg-white text-black'
                      : 'bg-[#262626] text-white hover:bg-[#363636]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {!savedLoaded ? (
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="aspect-square bg-[#262626] animate-pulse" />
                ))}
              </div>
            ) : savedItems.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg font-semibold text-white mb-1">Nothing saved yet.</p>
                <p className="text-sm text-[#a8a8a8]">Save posts and reels to see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {savedItems.map(item =>
                  item._type === 'reel' ? (
                    <ReelThumbnailCard key={`saved-reel-${item.id}`} reel={item} />
                  ) : (
                    <button
                      key={`saved-post-${item.id}`}
                      onClick={() => openPostModal(item)}
                      className="block aspect-square overflow-hidden relative group text-left"
                    >
                      <img
                        src={item.image_url}
                        alt="saved post"
                        className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                        loading="lazy"
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <FollowersFollowingModal
          userId={id}
          type={modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
