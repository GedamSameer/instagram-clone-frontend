import { useEffect, useState } from 'react'
import { UserCheck } from 'lucide-react'
import { getFollowRequests, acceptFollowRequest, rejectFollowRequest } from '../api/followRequests'
import Avatar from '../components/Avatar'
import { timeAgo } from '../utils/time'

function RequestRow({ req, onAccept, onReject }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null) // 'accepted' | 'rejected'

  const handle = async (action) => {
    setBusy(true)
    try {
      if (action === 'accept') {
        await onAccept(req.id)
        setDone('accepted')
      } else {
        await onReject(req.id)
        setDone('rejected')
      }
    } catch {}
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors">
      <div className="shrink-0">
        <Avatar
          username={req.requester?.username}
          src={req.requester?.profile_picture_url}
          userId={req.requester?.id}
          size={44}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white leading-snug">
          <span className="font-semibold">{req.requester?.username}</span>
          {' '}wants to follow you.{' '}
          <span className="text-[#a8a8a8]">{timeAgo(req.created_at)}</span>
        </p>
      </div>
      <div className="shrink-0 flex gap-2">
        {done === 'accepted' ? (
          <span className="text-xs text-[#a8a8a8]">Following</span>
        ) : done === 'rejected' ? (
          <span className="text-xs text-[#a8a8a8]">Removed</span>
        ) : (
          <>
            <button
              disabled={busy}
              onClick={() => handle('accept')}
              className="px-4 py-1.5 bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Confirm
            </button>
            <button
              disabled={busy}
              onClick={() => handle('reject')}
              className="px-4 py-1.5 bg-[#363636] hover:bg-[#4d4d4d] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function FollowRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFollowRequests()
      .then(res => setRequests(res.data.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleAccept = async (id) => {
    await acceptFollowRequest(id)
  }

  const handleReject = async (id) => {
    await rejectFollowRequest(id)
  }

  return (
    <div className="max-w-xl mx-auto pt-4 pb-20 md:pb-4">
      <h1 className="px-4 py-4 text-white font-semibold text-base">Follow Requests</h1>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 border-2 border-[#a8a8a8] rounded-full flex items-center justify-center mb-4">
            <UserCheck size={28} className="text-[#a8a8a8]" />
          </div>
          <p className="font-semibold text-white mb-1">No follow requests</p>
          <p className="text-sm text-[#a8a8a8]">
            When people request to follow your private account, they'll appear here.
          </p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div>
          {requests.map(req => (
            <RequestRow
              key={req.id}
              req={req}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  )
}
