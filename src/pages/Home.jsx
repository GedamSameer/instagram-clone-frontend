import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFeed, likePost, unlikePost } from '../api/posts'
import PostCard from '../components/PostCard'
import FeedReelCard from '../components/FeedReelCard'
import StoriesBar from '../components/StoriesBar'
import SuggestionsPanel from '../components/SuggestionsPanel'

export default function Home() {
  const [feedItems, setFeedItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeed()
      .then(res => setFeedItems(res.data.items || []))
      .finally(() => setLoading(false))
  }, [])

  const handleLikePost = async (post) => {
    try {
      const res = post.liked_by_me
        ? await unlikePost(post.id)
        : await likePost(post.id)
      setFeedItems(prev => prev.map(item =>
        item.item_type === 'post' && item.id === post.id
          ? { ...item, like_count: res.data.like_count, liked_by_me: res.data.liked_by_me }
          : item
      ))
    } catch {}
  }

  return (
    <div className="flex justify-center gap-8 px-4 pt-8 pb-20 md:pb-8 min-h-screen bg-black">
      {/* Feed column */}
      <div className="w-full max-w-117.5 shrink-0">
        <StoriesBar />

        {loading ? (
          <div className="flex flex-col gap-3 mt-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="border border-[#262626] animate-pulse">
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#262626]" />
                  <div className="h-3 w-28 bg-[#262626] rounded" />
                </div>
                <div className="w-full bg-[#262626]" style={{ height: 300 }} />
                <div className="px-3 pt-3 pb-4 flex flex-col gap-2">
                  <div className="h-3 w-20 bg-[#262626] rounded" />
                  <div className="h-3 w-48 bg-[#262626] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : feedItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-semibold text-white mb-1 text-lg">Your feed is empty</p>
            <p className="text-sm text-[#a8a8a8] mb-4">Follow people to see their posts and reels here.</p>
            <Link to="/search" className="text-[#0095f6] text-sm font-semibold hover:text-white transition-colors">
              Find people to follow
            </Link>
          </div>
        ) : (
          feedItems.map(item =>
            item.item_type === 'reel' ? (
              <FeedReelCard key={`reel-${item.id}`} reel={item} />
            ) : (
              <PostCard key={`post-${item.id}`} post={item} onLike={handleLikePost} />
            )
          )
        )}
      </div>

      {/* Right suggestions panel */}
      <div className="hidden xl:block w-79.75 shrink-0 pt-2">
        <SuggestionsPanel />
      </div>
    </div>
  )
}
