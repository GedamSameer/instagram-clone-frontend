import { useEffect, useRef, useState } from 'react'
import { Smile, Send } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

export default function MessageInput({ onSend, disabled = false }) {
  const [body, setBody] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef(null)
  const pickerRef = useRef(null)
  const smileBtnRef = useRef(null)

  // Auto-resize textarea up to ~5 lines
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [body])

  // Close picker on outside click.
  // Exclude the smile button itself so its own onClick can toggle correctly.
  useEffect(() => {
    if (!showPicker) return
    const handler = (e) => {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target) &&
        smileBtnRef.current && !smileBtnRef.current.contains(e.target)
      ) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPicker])

  const insertEmoji = (emojiChar) => {
    const el = textareaRef.current
    if (!el) {
      setBody(prev => prev + emojiChar)
      setShowPicker(false)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    setBody(body.slice(0, start) + emojiChar + body.slice(end))
    setShowPicker(false)
    // Restore cursor after the inserted emoji
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = start + emojiChar.length
    })
  }

  const handleSubmit = async () => {
    const text = body.trim()
    if (!text || submitting || disabled) return
    setSubmitting(true)
    try {
      await onSend(text)
      setBody('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } catch {}
    setSubmitting(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="relative px-4 py-3 border-t border-[#262626] bg-black shrink-0">
      {/* Emoji picker — opens upward above the input bar */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-full mb-2 left-4 z-50"
        >
          <EmojiPicker
            theme="dark"
            onEmojiClick={(emojiData) => insertEmoji(emojiData.emoji)}
            width={300}
            height={380}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
            searchPlaceholder="Search emoji…"
          />
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-3 bg-[#262626] rounded-3xl px-4 py-2.5">
        {/* Emoji toggle */}
        <button
          ref={smileBtnRef}
          type="button"
          onClick={() => setShowPicker(p => !p)}
          className={`shrink-0 transition-colors mb-0.5 ${
            showPicker ? 'text-[#0095f6]' : 'text-[#a8a8a8] hover:text-white'
          }`}
          aria-label="Open emoji picker"
        >
          <Smile size={22} />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-[#737373] focus:outline-none resize-none leading-relaxed disabled:opacity-50"
          style={{ maxHeight: 120, overflowY: 'auto' }}
        />

        {/* Send — only visible when there is text */}
        {body.trim() && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || disabled}
            className="shrink-0 text-[#0095f6] hover:text-white disabled:opacity-40 transition-colors mb-0.5"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
