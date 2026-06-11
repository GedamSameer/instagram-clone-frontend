import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  Grid3x3, Clapperboard, Bookmark, Settings, MoreHorizontal,
  Plus, Heart, MessageCircle, Play, ChevronDown, Camera, Lock,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import {
  getProfile, getUserPosts, followUser, unfollowUser, getUserReels,
  getMutualFollowers, updateProfile, removeProfilePhoto, updatePrivacy,
} from '../api/users'
import { getSavedPosts } from '../api/posts'
import { getSavedReels } from '../api/reels'
import { getUserStories } from '../api/stories'
import { uploadToCloudinary } from '../utils/cloudinary'
import Avatar from '../components/Avatar'
import { useAvatarCache } from '../context/AvatarCacheContext'
import FollowersFollowingModal from '../components/FollowersFollowingModal'
import StoryViewer from '../components/StoryViewer'

const GRADIENT = 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'

// ── Skeleton ───────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-[935px] mx-auto animate-pulse">
      <div className="flex flex-col md:flex-row items-center md:items-start pt-8 pb-11 gap-6 md:gap-0 px-4 md:px-0">
        <div className="md:w-[290px] flex justify-center shrink-0">
          <div className="w-[150px] h-[150px] rounded-full bg-[#262626]" />
        </div>
        <div className="flex-1 flex flex-col gap-4 pt-0 md:pt-4">
          <div className="h-6 w-40 bg-[#262626] rounded" />
          <div className="flex gap-8">
            {[1, 2, 3].map(n => <div key={n} className="h-4 w-20 bg-[#262626] rounded" />)}
          </div>
          <div className="h-4 w-64 bg-[#262626] rounded" />
          <div className="h-4 w-48 bg-[#262626] rounded" />
        </div>
      </div>
      <div className="border-t border-[#262626] grid grid-cols-3 gap-1 mt-4">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <div key={n} className="aspect-square bg-[#262626]" />
        ))}
      </div>
    </div>
  )
}

// ── Grid item ─────────────────────────────────────────────────────────────────

function GridItem({ item, onClick }) {
  const isReel = item._type === 'reel'
  return (
    <button
      onClick={onClick}
      className="block aspect-square overflow-hidden relative group text-left w-full"
    >
      {isReel ? (
        item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt=""
            className="w-full h-full object-cover transition-[filter] group-hover:brightness-60"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#262626] flex items-center justify-center">
            <Play size={32} fill="white" className="text-white" />
          </div>
        )
      ) : (
        <img
          src={item.image_url}
          alt=""
          className="w-full h-full object-cover transition-[filter] group-hover:brightness-60"
          loading="lazy"
        />
      )}

      {/* Reel: play icon always visible */}
      {isReel && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <Play size={14} fill="white" className="text-white drop-shadow-md" />
        </div>
      )}

      {/* Hover overlay: stats */}
      <div className="absolute inset-0 flex items-center justify-center gap-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="flex items-center gap-1.5 text-white font-bold text-sm drop-shadow">
          <Heart size={18} fill="white" strokeWidth={0} />
          {item.like_count ?? 0}
        </span>
        {!isReel && (
          <span className="flex items-center gap-1.5 text-white font-bold text-sm drop-shadow">
            <MessageCircle size={18} fill="white" strokeWidth={0} />
            {item.comment_count ?? 0}
          </span>
        )}
      </div>
    </button>
  )
}

// ── Upload preview modal ──────────────────────────────────────────────────────

function UploadPreviewModal({ previewUrl, username, uploading, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#262626] rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="py-5 px-4 text-center border-b border-[#363636]">
          <p className="text-white font-semibold text-lg">Preview</p>
        </div>
        <div className="flex justify-center py-8">
          <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-[#363636]">
            {previewUrl ? (
              <img src={previewUrl} alt={username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#363636]" />
            )}
          </div>
        </div>
        <button
          onClick={onConfirm}
          disabled={uploading}
          className="w-full py-4 text-[#0095f6] font-semibold text-sm border-t border-[#363636] hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-[#0095f6]/30 border-t-[#0095f6] rounded-full animate-spin" />
              Uploading...
            </>
          ) : 'Upload Photo'}
        </button>
        <button
          onClick={onCancel}
          disabled={uploading}
          className="w-full py-4 text-white text-sm hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Remove confirmation modal ─────────────────────────────────────────────────

function RemoveConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#262626] rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="py-5 px-4 text-center border-b border-[#363636]">
          <p className="text-white font-semibold text-lg">Remove Photo?</p>
          <p className="text-[#a8a8a8] text-sm mt-1">This will remove your current profile photo.</p>
        </div>
        <button
          onClick={onConfirm}
          className="w-full py-4 text-red-500 font-semibold text-sm border-b border-[#363636] hover:bg-[#1a1a1a] transition-colors"
        >
          Remove
        </button>
        <button
          onClick={onCancel}
          className="w-full py-4 text-white text-sm hover:bg-[#1a1a1a] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Pic options modal (own profile) ──────────────────────────────────────────

function ProfilePicModal({ hasPhoto, onChangePhoto, onRemovePhoto, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#262626] rounded-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="py-5 px-4 text-center border-b border-[#363636]">
          <p className="text-white font-semibold text-lg">Change Profile Photo</p>
        </div>
        <button
          onClick={onChangePhoto}
          className="w-full py-4 text-[#0095f6] font-semibold text-sm border-b border-[#363636] hover:bg-[#1a1a1a] transition-colors"
        >
          Upload Photo
        </button>
        {hasPhoto && (
          <button
            onClick={onRemovePhoto}
            className="w-full py-4 text-red-500 font-semibold text-sm border-b border-[#363636] hover:bg-[#1a1a1a] transition-colors"
          >
            Remove Current Photo
          </button>
        )}
        <button
          onClick={onClose}
          className="w-full py-4 text-white text-sm hover:bg-[#1a1a1a] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Photo preview modal (other users) ────────────────────────────────────────

function ProfilePicPreview({ username, src, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="w-[320px] h-[320px] rounded-full overflow-hidden" onClick={e => e.stopPropagation()}>
        {src ? (
          <img src={src} alt={username} className="w-full h-full object-cover" />
        ) : (
          <Avatar username={username} size={320} />
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshUser } = useAuth()
  const { setUrl } = useAvatarCache()

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [reels, setReels] = useState([])
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [following, setFollowing] = useState(false)
  const [hasRequested, setHasRequested] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [activeTab, setActiveTab] = useState('posts')
  const [modal, setModal] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [storyViewerOpen, setStoryViewerOpen] = useState(false)
  const [picModalOpen, setPicModalOpen] = useState(false)
  const [picPreviewOpen, setPicPreviewOpen] = useState(false)
  const [picUploading, setPicUploading] = useState(false)
  const [mutualFollowers, setMutualFollowers] = useState({ count: 0, users: [] })

  const [savedPosts, setSavedPosts] = useState([])
  const [savedReels, setSavedReels] = useState([])
  const [savedFilter, setSavedFilter] = useState('all')
  const [savedLoaded, setSavedLoaded] = useState(false)

  const fileInputRef = useRef(null)
  const toastRef = useRef(null)
  const [uploadPreviewOpen, setUploadPreviewOpen] = useState(false)
  const [uploadPreviewFile, setUploadPreviewFile] = useState(null)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null)
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const isOwnProfile = !!(user && profile && user.id === profile.id)
  const hasStories = stories.length > 0
  const allStoriesViewed = hasStories && stories.every(s => s.is_viewed)

  // ── Fetch profile ──────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true)
    setError(null)
    setActiveTab('posts')
    setSavedLoaded(false)
    setMutualFollowers({ count: 0, users: [] })
    Promise.all([
      getProfile(id),
      getUserPosts(id),
      getUserReels(id),
      getUserStories(id).catch(() => ({ data: { stories: [] } })),
    ])
      .then(([profileRes, postsRes, reelsRes, storiesRes]) => {
        setProfile(profileRes.data)
        setFollowing(profileRes.data.is_following)
        setHasRequested(profileRes.data.has_requested ?? false)
        setIsPrivate(profileRes.data.is_private ?? false)
        setFollowersCount(profileRes.data.followers_count)
        setPosts(postsRes.data.posts || [])
        setReels(reelsRes.data.reels || [])
        setStories(storiesRes.data.stories || [])
      })
      .catch(() => setError('User not found'))
      .finally(() => setLoading(false))
  }, [id])

  // Mutual followers (other profile, logged in)
  useEffect(() => {
    if (!user || !profile || isOwnProfile) return
    getMutualFollowers(id)
      .then(res => setMutualFollowers(res.data))
      .catch(() => {})
  }, [id, user, isOwnProfile]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lazy-load saved
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

  // ── Interactions ───────────────────────────────────────────────────────────

  const handleFollow = async () => {
    try {
      if (following || hasRequested) {
        // Unfollow or cancel follow request
        const res = await unfollowUser(id)
        setFollowing(false)
        setHasRequested(false)
        setFollowersCount(res.data.followers_count)
      } else {
        const res = await followUser(id)
        if (res.data.status === 'requested') {
          setHasRequested(true)
          setFollowing(false)
        } else {
          setFollowing(true)
          setHasRequested(false)
        }
        setFollowersCount(res.data.followers_count)
      }
    } catch {}
  }

  const handleTogglePrivacy = async () => {
    const newValue = !isPrivate
    try {
      setIsPrivate(newValue)
      await updatePrivacy(newValue)
    } catch {
      setIsPrivate(!newValue) // rollback
    }
  }

  const handleAvatarClick = () => {
    if (isOwnProfile) {
      setPicModalOpen(true)
    } else if (hasStories) {
      setStoryViewerOpen(true)
    } else if (profile?.profile_picture_url) {
      setPicPreviewOpen(true)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3500)
  }

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadPreviewFile(file)
    setUploadPreviewUrl(URL.createObjectURL(file))
    setUploadPreviewOpen(true)
    setPicModalOpen(false)
    e.target.value = ''
  }

  const handleConfirmUpload = async () => {
    if (!uploadPreviewFile) return
    setPicUploading(true)
    try {
      const { url } = await uploadToCloudinary(uploadPreviewFile)
      await updateProfile({ profile_picture_url: url })
      setProfile(p => ({ ...p, profile_picture_url: url }))
      setUrl(profile.id, url)
      await refreshUser()
      setUploadPreviewOpen(false)
      if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl)
      setUploadPreviewFile(null)
      setUploadPreviewUrl(null)
      showToast('Profile photo updated')
    } catch {
      showToast('Failed to upload profile photo', 'error')
    }
    setPicUploading(false)
  }

  const handleRemovePhoto = () => {
    setPicModalOpen(false)
    setRemoveConfirmOpen(true)
  }

  const handleConfirmRemove = async () => {
    try {
      await removeProfilePhoto()
      setProfile(p => ({ ...p, profile_picture_url: '' }))
      setUrl(profile.id, '')
      await refreshUser()
      setRemoveConfirmOpen(false)
      showToast('Profile photo removed')
    } catch {
      showToast('Failed to remove profile photo', 'error')
    }
  }

  const handleStoryViewerClose = () => {
    setStoryViewerOpen(false)
    getUserStories(id)
      .then(res => setStories(res.data.stories || []))
      .catch(() => {})
  }

  const openPostModal = (post) => {
    navigate(`/posts/${post.id}`, { state: { background: location } })
  }

  // ── Loading / error ────────────────────────────────────────────────────────

  if (loading) return <ProfileSkeleton />
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <p className="text-red-400">{error}</p>
    </div>
  )

  // Whether the current viewer can see this profile's content
  const canViewContent = isOwnProfile || !isPrivate || following

  // ── Derived data ───────────────────────────────────────────────────────────

  const ringBg = hasStories
    ? (allStoriesViewed ? '#4d4d4d' : GRADIENT)
    : null

  const avatarIsClickable = isOwnProfile || hasStories || !!profile.profile_picture_url

  const mixedContent = [
    ...posts.map(p => ({ ...p, _type: 'post' })),
    ...reels.map(r => ({ ...r, _type: 'reel' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const savedItems = savedFilter === 'posts'
    ? savedPosts.map(p => ({ ...p, _type: 'post' }))
    : savedFilter === 'reels'
      ? savedReels.map(r => ({ ...r, _type: 'reel' }))
      : [...savedPosts.map(p => ({ ...p, _type: 'post' })), ...savedReels.map(r => ({ ...r, _type: 'reel' }))]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const DESKTOP_AVATAR = 150
  const MOBILE_AVATAR = 86

  // ── Avatar node ────────────────────────────────────────────────────────────

  const avatarNode = (size) => (
    <Avatar
      username={profile.username}
      src={profile.profile_picture_url}
      userId={profile.id}
      size={size}
    />
  )

  const avatarWithRing = (size) => {
    const wrapper = (children) => (
      <div
        role={avatarIsClickable ? 'button' : undefined}
        tabIndex={avatarIsClickable ? 0 : undefined}
        onClick={avatarIsClickable ? handleAvatarClick : undefined}
        className={avatarIsClickable ? 'cursor-pointer' : ''}
        style={{ position: 'relative', display: 'inline-block' }}
      >
        {children}
        {picUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        {isOwnProfile && (
          <div className="absolute bottom-1 right-1 w-7 h-7 bg-[#1c1c1c] border-2 border-black rounded-full flex items-center justify-center">
            <Camera size={13} className="text-white" />
          </div>
        )}
      </div>
    )

    if (ringBg) {
      return wrapper(
        <div
          className="rounded-full p-0.75"
          style={{ background: ringBg, width: size + 6, height: size + 6 }}
        >
          <div className="rounded-full bg-black p-0.5 w-full h-full flex items-center justify-center overflow-hidden">
            {avatarNode(size - 4)}
          </div>
        </div>
      )
    }
    return wrapper(avatarNode(size))
  }

  // ── Mutual followers text ──────────────────────────────────────────────────

  const mutualText = () => {
    const { count, users } = mutualFollowers
    if (!count) return null
    const names = users.slice(0, 2).map((u, i) => (
      <span key={u.id}>
        <Link to={`/users/${u.id}`} className="text-white font-semibold hover:underline">
          {u.username}
        </Link>
        {i === 0 && count > 1 && users.length > 1 && (count > 2 ? ', ' : ' and ')}
      </span>
    ))
    const others = count > 2 ? ` and ${count - 2} ${count - 2 === 1 ? 'other' : 'others'}` : ''
    return (
      <p className="text-sm text-[#a8a8a8]">
        Followed by {names}{others}
      </p>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-black min-h-screen pb-16 md:pb-0">
      <div className="max-w-[935px] mx-auto">

        {/* ── Profile Header ── */}
        <header className="flex flex-col md:flex-row items-center md:items-start px-4 md:px-0 pt-8 md:pt-[30px] pb-6 md:pb-[44px] gap-6 md:gap-0">

          {/* Avatar column */}
          <div className="md:w-[290px] flex justify-center shrink-0 relative">
            <div className="md:hidden">{avatarWithRing(MOBILE_AVATAR)}</div>
            <div className="hidden md:block">{avatarWithRing(DESKTOP_AVATAR)}</div>
          </div>

          {/* Content column */}
          <div className="flex-1 flex flex-col gap-[14px] min-w-0 items-center md:items-start">

            {/* Row 1: username + actions */}
            <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
              <h2 className="text-[20px] font-light text-white tracking-tight">
                {profile.username}
              </h2>

              {isOwnProfile ? (
                <>
                  <button className="bg-[#363636] hover:bg-[#4d4d4d] text-white text-sm font-semibold px-4 py-[7px] rounded-lg transition-colors">
                    Edit profile
                  </button>
                  <button className="bg-[#363636] hover:bg-[#4d4d4d] text-white text-sm font-semibold px-4 py-[7px] rounded-lg transition-colors">
                    View archive
                  </button>
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="w-9 h-9 flex items-center justify-center text-white hover:bg-[#1a1a1a] rounded-full transition-colors"
                  >
                    <Settings size={22} />
                  </button>
                </>
              ) : user ? (
                <>
                  <button
                    onClick={handleFollow}
                    className={`flex items-center gap-1 text-sm font-semibold px-4 py-[7px] rounded-lg transition-colors ${
                      following
                        ? 'bg-[#363636] hover:bg-[#4d4d4d] text-white'
                        : hasRequested
                          ? 'bg-[#363636] hover:bg-[#4d4d4d] text-white'
                          : 'bg-[#0095f6] hover:bg-[#1877f2] text-white'
                    }`}
                  >
                    {following ? (
                      <>Following <ChevronDown size={14} /></>
                    ) : hasRequested ? (
                      'Requested'
                    ) : 'Follow'}
                  </button>
                  <button
                    onClick={() => navigate('/messages', { state: { openUserId: profile.id } })}
                    className="bg-[#363636] hover:bg-[#4d4d4d] text-white text-sm font-semibold px-4 py-[7px] rounded-lg transition-colors"
                  >
                    Message
                  </button>
                  <button className="w-9 h-9 flex items-center justify-center bg-[#363636] hover:bg-[#4d4d4d] text-white rounded-lg transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold px-6 py-[7px] rounded-lg transition-colors"
                >
                  Follow
                </Link>
              )}
            </div>

            {/* Row 2: stats (desktop) */}
            <div className="hidden md:flex items-center gap-10 text-[15px] text-white">
              <span>
                <strong className="font-semibold">{profile.posts_count}</strong>
                {' '}<span className="font-normal">posts</span>
              </span>
              <button
                onClick={() => setModal('followers')}
                className="hover:opacity-70 transition-opacity"
              >
                <strong className="font-semibold">{followersCount}</strong>
                {' '}<span className="font-normal">followers</span>
              </button>
              <button
                onClick={() => setModal('following')}
                className="hover:opacity-70 transition-opacity"
              >
                <strong className="font-semibold">{profile.following_count}</strong>
                {' '}<span className="font-normal">following</span>
              </button>
            </div>

            {/* Row 3: bio */}
            {profile.bio && (
              <p className="text-sm text-white leading-snug whitespace-pre-line text-center md:text-left max-w-[380px]">
                {profile.bio}
              </p>
            )}

            {/* Row 4: mutual followers */}
            {mutualText()}
          </div>
        </header>

        {/* ── Mobile stats ── */}
        <div className="md:hidden flex border-t border-[#262626] text-white">
          <button
            onClick={() => setModal('followers')}
            className="flex-1 flex flex-col items-center py-3 gap-0.5 hover:bg-[#0a0a0a] transition-colors"
          >
            <span className="font-semibold text-base">{profile.posts_count}</span>
            <span className="text-[#a8a8a8] text-xs">posts</span>
          </button>
          <button
            onClick={() => setModal('followers')}
            className="flex-1 flex flex-col items-center py-3 gap-0.5 border-x border-[#262626] hover:bg-[#0a0a0a] transition-colors"
          >
            <span className="font-semibold text-base">{followersCount}</span>
            <span className="text-[#a8a8a8] text-xs">followers</span>
          </button>
          <button
            onClick={() => setModal('following')}
            className="flex-1 flex flex-col items-center py-3 gap-0.5 hover:bg-[#0a0a0a] transition-colors"
          >
            <span className="font-semibold text-base">{profile.following_count}</span>
            <span className="text-[#a8a8a8] text-xs">following</span>
          </button>
        </div>

        {/* ── Stories / Highlights Section ── */}
        {(isOwnProfile || hasStories) && (
          <div className="border-t border-[#262626] py-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 px-4 min-w-max">

              {/* Own: Add new story */}
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/create', { state: { type: 'story' } })}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div
                    className="w-[66px] h-[66px] rounded-full border border-[#363636] flex items-center justify-center bg-[#1a1a1a] hover:bg-[#262626] transition-colors"
                  >
                    <Plus size={26} className="text-white" />
                  </div>
                  <span className="text-[11px] text-white w-[66px] text-center truncate leading-none">New</span>
                </button>
              )}

              {/* Active stories circle */}
              {hasStories && (
                <button
                  onClick={() => setStoryViewerOpen(true)}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div
                    className="rounded-full p-0.5"
                    style={{ background: allStoriesViewed ? '#4d4d4d' : GRADIENT, width: 70, height: 70 }}
                  >
                    <div className="rounded-full bg-black p-0.5 w-full h-full overflow-hidden flex items-center justify-center">
                      <Avatar
                        username={profile.username}
                        src={profile.profile_picture_url}
                        userId={profile.id}
                        size={62}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] text-white w-[70px] text-center truncate leading-none">Story</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Bar ── */}
        <div className="border-t border-[#262626] flex items-center justify-center">
          {[
            { key: 'posts', Icon: Grid3x3, label: 'POSTS' },
            { key: 'reels', Icon: Clapperboard, label: 'REELS' },
            ...(isOwnProfile ? [{ key: 'saved', Icon: Bookmark, label: 'SAVED' }] : []),
          ].map(({ key, Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 py-3 px-4 -mt-px text-xs font-semibold tracking-widest transition-colors ${
                activeTab === key
                  ? 'border-t border-white text-white'
                  : 'text-[#737373] hover:text-[#a8a8a8]'
              }`}
            >
              <Icon size={12} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Private account lock banner ── */}
        {!canViewContent && (
          <div className="border-t border-[#262626] flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
            <div className="w-16 h-16 border-2 border-white rounded-full flex items-center justify-center">
              <Lock size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-white mb-1">This Account is Private</h3>
              <p className="text-sm text-[#a8a8a8]">Follow this account to see their photos and videos.</p>
            </div>
          </div>
        )}

        {/* ── Posts Tab (mixed grid) ── */}
        {activeTab === 'posts' && canViewContent && (
          mixedContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
              <Camera size={56} strokeWidth={1.2} className="text-white" />
              <div>
                <h3 className="text-[28px] font-extrabold text-white mb-1">Share Photos</h3>
                <p className="text-sm text-[#a8a8a8]">When you share photos, they will appear on your profile.</p>
              </div>
              {isOwnProfile && (
                <Link to="/create" className="text-[#0095f6] text-sm font-semibold hover:text-white transition-colors">
                  Share your first photo
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[3px]">
              {mixedContent.map(item =>
                item._type === 'reel' ? (
                  <GridItem
                    key={`reel-${item.id}`}
                    item={item}
                    onClick={() => navigate(`/reels/${item.id}`)}
                  />
                ) : (
                  <GridItem
                    key={`post-${item.id}`}
                    item={item}
                    onClick={() => openPostModal(item)}
                  />
                )
              )}
            </div>
          )
        )}

        {/* ── Reels Tab ── */}
        {activeTab === 'reels' && canViewContent && (
          reels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
              <Clapperboard size={56} strokeWidth={1.2} className="text-white" />
              <div>
                <h3 className="text-[28px] font-extrabold text-white mb-1">No Reels Yet</h3>
                {isOwnProfile && (
                  <p className="text-sm text-[#a8a8a8]">Create reels to share moments with your followers.</p>
                )}
              </div>
              {isOwnProfile && (
                <Link to="/create" className="text-[#0095f6] text-sm font-semibold hover:text-white transition-colors">
                  Create your first reel
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[3px]">
              {reels.map(reel => (
                <GridItem
                  key={reel.id}
                  item={{ ...reel, _type: 'reel' }}
                  onClick={() => navigate(`/reels/${reel.id}`)}
                />
              ))}
            </div>
          )
        )}

        {/* ── Saved Tab ── */}
        {activeTab === 'saved' && isOwnProfile && (
          <div>
            {/* Filter chips */}
            <div className="flex gap-2 px-4 py-3">
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
              <div className="grid grid-cols-3 gap-[3px]">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="aspect-square bg-[#262626] animate-pulse" />
                ))}
              </div>
            ) : savedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                <Bookmark size={56} strokeWidth={1.2} className="text-white" />
                <div>
                  <h3 className="text-[28px] font-extrabold text-white mb-1">No Saved Content</h3>
                  <p className="text-sm text-[#a8a8a8]">Save photos and videos that you want to see again.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-[3px]">
                {savedItems.map(item =>
                  item._type === 'reel' ? (
                    <GridItem
                      key={`saved-reel-${item.id}`}
                      item={item}
                      onClick={() => navigate(`/reels/${item.id}`)}
                    />
                  ) : (
                    <GridItem
                      key={`saved-post-${item.id}`}
                      item={item}
                      onClick={() => openPostModal(item)}
                    />
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {modal && (
        <FollowersFollowingModal
          userId={id}
          type={modal}
          onClose={() => setModal(null)}
        />
      )}

      {storyViewerOpen && hasStories && (
        <StoryViewer
          groups={[{ user: profile, stories, has_unseen: !allStoriesViewed }]}
          initialGroupIdx={0}
          initialStoryIdx={0}
          onClose={handleStoryViewerClose}
          onStoryDeleted={(storyId, groupId) =>
            setStories(prev =>
              groupId
                ? prev.filter(s => s.story_group_id !== groupId)
                : prev.filter(s => s.id !== storyId)
            )
          }
        />
      )}

      {picModalOpen && (
        <ProfilePicModal
          hasPhoto={!!profile.profile_picture_url}
          onChangePhoto={() => fileInputRef.current?.click()}
          onRemovePhoto={handleRemovePhoto}
          onClose={() => setPicModalOpen(false)}
        />
      )}

      {picPreviewOpen && (
        <ProfilePicPreview
          username={profile.username}
          src={profile.profile_picture_url}
          onClose={() => setPicPreviewOpen(false)}
        />
      )}

      {uploadPreviewOpen && (
        <UploadPreviewModal
          previewUrl={uploadPreviewUrl}
          username={profile.username}
          uploading={picUploading}
          onConfirm={handleConfirmUpload}
          onCancel={() => {
            if (!picUploading) {
              setUploadPreviewOpen(false)
              if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl)
              setUploadPreviewFile(null)
              setUploadPreviewUrl(null)
            }
          }}
        />
      )}

      {removeConfirmOpen && (
        <RemoveConfirmModal
          onConfirm={handleConfirmRemove}
          onCancel={() => setRemoveConfirmOpen(false)}
        />
      )}

      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-xl pointer-events-none ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-[#1a1a1a] border border-[#363636]'
        }`}>
          {toast.message}
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          isPrivate={isPrivate}
          onTogglePrivacy={handleTogglePrivacy}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Hidden file input for profile picture upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  )
}

// ── Settings modal ─────────────────────────────────────────────────────────────

function SettingsModal({ isPrivate, onTogglePrivacy, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#262626] rounded-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="py-4 px-4 text-center border-b border-[#363636]">
          <p className="text-white font-semibold text-base">Settings</p>
        </div>

        {/* Private account row */}
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-white text-sm">Private account</span>
          {/* Toggle switch */}
          <button
            role="switch"
            aria-checked={isPrivate}
            onClick={onTogglePrivacy}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none ${
              isPrivate ? 'bg-[#0095f6]' : 'bg-[#4d4d4d]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                isPrivate ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Cancel */}
        <div className="border-t border-[#363636]">
          <button
            onClick={onClose}
            className="w-full py-4 text-white text-sm hover:bg-[#1a1a1a] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
