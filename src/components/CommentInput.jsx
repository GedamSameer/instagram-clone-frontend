import { useEffect, useRef, useState } from 'react'
import { Smile, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function CommentInput({ onCreate, onCommentAdded, autoFocus = false, replyTo = null, onCancelReply }) {
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 120)
      return () => clearTimeout(t)
    }
  }, [autoFocus])

  // Focus input whenever replyTo changes (user clicked Reply)
  useEffect(() => {
    if (replyTo) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [replyTo])

  if (!user) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!body.trim() || submitting) return
    setSubmitting(true)
    try {
      const comment = await onCreate(body.trim())
      setBody('')
      onCommentAdded?.(comment)
    } catch {}
    setSubmitting(false)
  }

  return (
    <div>
      {replyTo && (
        <div className="flex items-center gap-1.5 px-1 pb-1.5 text-xs text-[#a8a8a8]">
          <span>Replying to{' '}
            <Link
              to={`/users/${replyTo.userId}`}
              className="text-white font-semibold hover:opacity-80"
            >
              @{replyTo.username}
            </Link>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="ml-auto text-[#a8a8a8] hover:text-white transition-colors"
            aria-label="Cancel reply"
          >
            <X size={13} />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <Smile size={20} className="text-white shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={replyTo ? `Reply to @${replyTo.username}…` : 'Add a comment…'}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-[#737373] focus:outline-none"
        />
        {body.trim() && (
          <button
            type="submit"
            disabled={submitting}
            className="text-sm font-semibold text-[#0095f6] hover:text-white disabled:opacity-50 transition-colors shrink-0"
          >
            Post
          </button>
        )}
      </form>
    </div>
  )
}
