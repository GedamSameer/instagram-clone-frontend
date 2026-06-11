import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, MessageCircle, PenSquare } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getConversations, getMessages, sendMessage } from '../api/messages'
import { createMessagesSocket } from '../utils/messagesSocket'
import ConversationRow from '../components/ConversationRow'
import MessageBubble from '../components/MessageBubble'
import MessageInput from '../components/MessageInput'
import NewMessageModal from '../components/NewMessageModal'
import Avatar from '../components/Avatar'

export default function Messages() {
  const { user } = useAuth()

  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [convsLoading, setConvsLoading] = useState(true)
  const [msgsLoading, setMsgsLoading] = useState(false)
  const [showNewMsg, setShowNewMsg] = useState(false)
  // 'list' | 'chat' — controls which panel is visible on narrow screens
  const [mobileView, setMobileView] = useState('list')

  const messagesEndRef = useRef(null)
  // Keep a ref so the WebSocket handler always reads the latest activeConvId
  const activeConvIdRef = useRef(null)
  // Distinguish initial load (instant scroll) from new message (smooth scroll)
  const isInitialLoad = useRef(false)

  useEffect(() => {
    activeConvIdRef.current = activeConvId
  }, [activeConvId])

  // ── Load conversation list ──────────────────────────────────────────────
  useEffect(() => {
    getConversations()
      .then(res => setConversations(res.data.conversations || []))
      .catch(() => {})
      .finally(() => setConvsLoading(false))
  }, [])

  // ── Load messages when active conversation changes ──────────────────────
  useEffect(() => {
    if (!activeConvId) {
      setMessages([])
      return
    }
    isInitialLoad.current = true
    setMsgsLoading(true)
    getMessages(activeConvId)
      .then(res => setMessages(res.data.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setMsgsLoading(false))
  }, [activeConvId])

  // ── Auto-scroll to bottom ───────────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return
    const behavior = isInitialLoad.current ? 'instant' : 'smooth'
    isInitialLoad.current = false
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [messages])

  // ── WebSocket (singleton, lives for the page lifetime) ──────────────────
  useEffect(() => {
    const socket = createMessagesSocket({
      onMessage(data) {
        if (data.type === 'new_message') {
          const { conversation_id: convId, message: msg } = data

          // Add to thread if it's the active conversation; deduplicate by id
          if (convId === activeConvIdRef.current) {
            setMessages(prev =>
              prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
            )
          }

          // Bubble up last_message in list and re-sort
          setConversations(prev => {
            const updated = prev.map(c =>
              c.id === convId ? { ...c, last_message: msg } : c
            )
            return sortConvs(updated)
          })
        }

        if (data.type === 'message_deleted') {
          const { conversation_id: convId, message: msg } = data
          if (convId === activeConvIdRef.current) {
            setMessages(prev => prev.map(m => (m.id === msg.id ? msg : m)))
          }
          setConversations(prev =>
            prev.map(c =>
              c.id === convId && c.last_message?.id === msg.id
                ? { ...c, last_message: msg }
                : c
            )
          )
        }
      },
    })
    return () => socket.disconnect()
  }, [])

  // ── Helpers ─────────────────────────────────────────────────────────────
  function sortConvs(list) {
    return [...list].sort((a, b) => {
      const at = a.last_message?.created_at || a.created_at || ''
      const bt = b.last_message?.created_at || b.created_at || ''
      return bt.localeCompare(at)
    })
  }

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null

  const handleSelectConv = (convId) => {
    setActiveConvId(convId)
    setMobileView('chat')
  }

  const handleSend = async (text) => {
    if (!activeConvId) return
    const res = await sendMessage(activeConvId, text)
    const msg = res.data.message
    // Add optimistically; WebSocket echo will be deduplicated
    setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]))
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === activeConvId ? { ...c, last_message: msg } : c
      )
      return sortConvs(updated)
    })
  }

  const handleConvCreated = (conv) => {
    setShowNewMsg(false)
    setConversations(prev => {
      if (prev.some(c => c.id === conv.id)) return prev
      return sortConvs([conv, ...prev])
    })
    handleSelectConv(conv.id)
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-black">

      {/* ── Left panel: conversation list ── */}
      <div
        className={`flex flex-col border-r border-[#262626] shrink-0
          w-full md:w-80 xl:w-96
          ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#262626] shrink-0">
          <span className="font-semibold text-white">{user?.username}</span>
          <button
            onClick={() => setShowNewMsg(true)}
            className="text-white hover:text-[#a8a8a8] transition-colors"
            aria-label="New message"
          >
            <PenSquare size={22} />
          </button>
        </div>

        {/* Tab strip */}
        <div className="flex border-b border-[#262626] shrink-0">
          <button className="flex-1 py-3 text-sm font-semibold text-white border-b-2 border-white">
            Messages
          </button>
          <button className="flex-1 py-3 text-sm text-[#a8a8a8] hover:text-white transition-colors">
            Requests
          </button>
        </div>

        {/* List body */}
        <div className="flex-1 overflow-y-auto">
          {convsLoading && <ConvListSkeleton />}

          {!convsLoading && conversations.length === 0 && (
            <EmptyConvList onNewMessage={() => setShowNewMsg(true)} />
          )}

          {!convsLoading && conversations.map(conv => (
            <ConversationRow
              key={conv.id}
              conv={conv}
              active={conv.id === activeConvId}
              currentUserId={user?.id}
              onClick={() => handleSelectConv(conv.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel: chat area ── */}
      <div
        className={`flex-1 flex flex-col min-w-0
          ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}
      >
        {activeConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-[#262626] shrink-0">
              <button
                className="md:hidden text-white hover:text-[#a8a8a8] transition-colors mr-1"
                onClick={() => setMobileView('list')}
                aria-label="Back"
              >
                <ArrowLeft size={22} />
              </button>
              <Avatar username={activeConv.other_user?.username} src={activeConv.other_user?.profile_picture_url} userId={activeConv.other_user?.id} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">
                  {activeConv.other_user?.username}
                </p>
              </div>
            </div>

            {/* Message thread */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {msgsLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <EmptyChatThread username={activeConv.other_user?.username} userId={activeConv.other_user?.id} profilePictureUrl={activeConv.other_user?.profile_picture_url} />
              ) : (
                <>
                  {messages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender_id === user?.id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Composer */}
            <MessageInput onSend={handleSend} />
          </>
        ) : (
          <EmptyChatArea onNewMessage={() => setShowNewMsg(true)} />
        )}
      </div>

      {showNewMsg && (
        <NewMessageModal
          onClose={() => setShowNewMsg(false)}
          onConversationCreated={handleConvCreated}
        />
      )}
    </div>
  )
}

// ── Small internal components ──────────────────────────────────────────────

function ConvListSkeleton() {
  return (
    <div className="flex flex-col p-3 gap-1">
      {[1, 2, 3, 4].map(n => (
        <div key={n} className="flex items-center gap-3 p-3 animate-pulse">
          <div className="w-14 h-14 rounded-full bg-[#262626] shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 w-28 bg-[#262626] rounded" />
            <div className="h-3 w-40 bg-[#262626] rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyConvList({ onNewMessage }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 py-12 text-center">
      <div className="w-16 h-16 border-2 border-white rounded-full flex items-center justify-center">
        <MessageCircle size={28} className="text-white" />
      </div>
      <div>
        <p className="font-semibold text-white mb-1">Your messages</p>
        <p className="text-sm text-[#a8a8a8]">Send a message to start a chat.</p>
      </div>
      <button
        onClick={onNewMessage}
        className="px-4 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Send message
      </button>
    </div>
  )
}

function EmptyChatArea({ onNewMessage }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="w-24 h-24 border-2 border-white rounded-full flex items-center justify-center">
        <MessageCircle size={40} className="text-white" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-semibold text-white text-xl mb-1">Your messages</p>
        <p className="text-sm text-[#a8a8a8] mb-4">
          Send private photos and messages to a friend.
        </p>
        <button
          onClick={onNewMessage}
          className="px-4 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Send message
        </button>
      </div>
    </div>
  )
}

function EmptyChatThread({ username, userId, profilePictureUrl }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
      <Avatar username={username} src={profilePictureUrl} userId={userId} size={80} />
      <p className="font-semibold text-white">{username}</p>
      <p className="text-sm text-[#a8a8a8]">No messages yet. Say hi! 👋</p>
    </div>
  )
}
