import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getSavedPosts } from '../api/posts'

export default function SavedPostsGrid() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    getSavedPosts()
      .then(res => setPosts(res.data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const openModal = (post) => {
    navigate(`/posts/${post.id}`, { state: { background: location } })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <div key={n} className="aspect-square bg-[#262626] animate-pulse" />
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-semibold text-white mb-1">No saved posts yet.</p>
        <p className="text-sm text-[#a8a8a8]">Save posts to see them here.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map(post => (
        <button
          key={post.id}
          onClick={() => openModal(post)}
          className="block aspect-square overflow-hidden relative group text-left"
        >
          <img
            src={post.image_url}
            alt="saved post"
            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  )
}
