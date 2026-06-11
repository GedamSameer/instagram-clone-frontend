import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowLeft, MessageCircle, PenSquare, Check, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import {
  getConversations, getMessageRequests, getMessages, sendMessage,
  acceptMessageRequest, rejectMessageRequest, createConversation,
} from '../api/messages'
import { createMessagesSocket } from '../utils/messagesSocket'
import MessageBubble from '../components/MessageBubble'
import MessageInput from '../components/MessageInput'
import NewMessageModal from '../components/NewMessageModal'
import Avatar from '../components/Avatar'
import { timeAgo } from '../utils/time'

export default function Messages() {
  const { user } = useAuth()
  const location = useLocation()

  const [conversations, setConversations] = useState([])   // accepted + sent requests
  const [requests, setRequests] = useState([])              // received requests
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [convsLoading, setConvsLoading] = useState(true)
  const [msgsLoading, setMsgsLoading] = useState(false)
  const [showNewMsg, setShowNewMsg] = useState(false)
  const [activeTab, setActiveTab] = useState('messages')

  // 'list' | 'chat' — narrow screen navigation
  const [mobileView, setMobileView] = useState('list')

  // Is the open conversation a received request (recipient side)?
  const [activeConvIsRequest, setActiveConvIsRequest] = useState(false)
  // Has the current user (sender) already sent their one allowed message and is now waiting?
  const [awaitingApproval, setAwaitingApproval] = useState(false)

  const messagesEndRef = useRef(null)
  const activeConvIdRef = useRef(null)
  const isInitialLoad = useRef(false)

  useEffect(() => {
    activeConvIdRef.current = activeConvId
  }, [activeConvId])

  // ── Load lists ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getConversations(), getMessageRequests()])
      .then(([convsRes, reqsRes]) => {
        setConversations(convsRes.data.conversations || [])
        setRequests(reqsRes.data.conversations || [])
      })
      .catch(() => {})
      .finally(() => setConvsLoading(false))
  }, [])

  // ── Auto-open conversation when arriving from Profile "Message" button ──
  useEffect(() => {
    const openUserId = location.state?.openUserId
    if (!openUserId || convsLoading) return

    // Check if we already have a conversation with this user
    const all = [...conversations, ...requests]
    const existing = all.find(c => c.other_user?.id === openUserId)
    if (existing) {
      handleSelectConv(existing)
      return
    }

    // Create a new conversation
    createConversation(openUserId)
      .then(res => handleConvCreated(res.data.conversation))
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.openUserId, convsLoading])

  // ── Load messages + determine awaiting-approval state ───────────────────
  useEffect(() => {
    if (!activeConvId) {
      setMessages([])
      setActiveConvIsRequest(false)
      setAwaitingApproval(false)
      return
    }
    isInitialLoad.current = true
    setMsgsLoading(true)

    // Find the active conversation from either list
    const conv = [...conversations, ...requests].find(c => c.id === activeConvId)
    const isReceivedRequest = !!(conv && conv.status === 'request' && conv.requester_id !== user?.id)
    const isSentRequest    = !!(conv && conv.status === 'request' && conv.requester_id === user?.id)

    setActiveConvIsRequest(isReceivedRequest)

    getMessages(activeConvId)
      .then(res => {
        const msgs = res.data.messages || []
        setMessages(msgs)
        // Show "awaiting approval" only if sender has already sent at least one message
        if (isSentRequest) {
          const hasSent = msgs.some(m => m.sender_id === user?.id)
          setAwaitingApproval(hasSent)
        } else {
          setAwaitingApproval(false)
        }
      })
      .catch(() => setMessages([]))
      .finally(() => setMsgsLoading(false))
  }, [activeConvId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return
    const behavior = isInitialLoad.current ? 'instant' : 'smooth'
    isInitialLoad.current = false
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [messages])

  // ── WebSocket ────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = createMessagesSocket({
      onMessage(data) {
        if (data.type === 'new_message') {
          const { conversation_id: convId, message: msg } = data
          if (convId === activeConvIdRef.current) {
            setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
          }
          const patchLast = (list) =>
            list.map(c => c.id === convId ? { ...c, last_message: msg } : c)
          setConversations(prev => sortConvs(patchLast(prev)))
          setRequests(prev => sortConvs(patchLast(prev)))
        }

        if (data.type === 'new_conversation_request') {
          // A new message request arrived — add it to the Requests list if not already there
          const conv = data.conversation
          setRequests(prev =>
            prev.some(c => c.id === conv.id) ? prev : sortConvs([conv, ...prev])
          )
        }

        if (data.type === 'message_deleted') {
          const { conversation_id: convId, message: msg } = data
          if (convId === activeConvIdRef.current) {
            setMessages(prev => prev.map(m => m.id === msg.id ? msg : m))
          }
          const patchLast = (list) =>
            list.map(c =>
              c.id === convId && c.last_message?.id === msg.id
                ? { ...c, last_message: msg } : c
            )
          setConversations(prev => patchLast(prev))
          setRequests(prev => patchLast(prev))
        }

        if (data.type === 'conversation_accepted') {
          const { conversation_id: convId } = data

          // Move from Requests → Messages (for recipient B, via WS)
          // Also updates status for sender A already in Messages list
          setRequests(prev => {
            const conv = prev.find(c => c.id === convId)
            if (conv) {
              // Only add to conversations if not already there
              setConversations(existing =>
                existing.some(c => c.id === convId)
                  ? existing.map(c => c.id === convId ? { ...c, status: 'accepted' } : c)
                  : sortConvs([...existing, { ...conv, status: 'accepted' }])
              )
            } else {
              // Sender A side: just update status in conversations list
              setConversations(existing =>
                existing.map(c => c.id === convId ? { ...c, status: 'accepted' } : c)
              )
            }
            return prev.filter(c => c.id !== convId)
          })

          if (activeConvIdRef.current === convId) {
            setActiveConvIsRequest(false)
            setAwaitingApproval(false)
          }
        }
      },
    })
    return () => socket.disconnect()
  }, [])

  // ── Helpers ──────────────────────────────────────────────────────────────
  function sortConvs(list) {
    return [...list].sort((a, b) => {
      const at = a.last_message?.created_at || a.created_at || ''
      const bt = b.last_message?.created_at || b.created_at || ''
      return bt.localeCompare(at)
    })
  }

  const activeConv = [...conversations, ...requests].find(c => c.id === activeConvId) ?? null
  const displayList = activeTab === 'messages' ? conversations : requests

  const handleSelectConv = (conv) => {
    setActiveConvId(conv.id)
    setMobileView('chat')
    // Reset both flags — useEffect above will set them correctly after messages load
    setActiveConvIsRequest(false)
    setAwaitingApproval(false)
  }

  const handleSend = async (text) => {
    if (!activeConvId) return
    try {
      const res = await sendMessage(activeConvId, text)
      const msg = res.data.message
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      setConversations(prev =>
        sortConvs(prev.map(c => c.id === activeConvId ? { ...c, last_message: msg } : c))
      )
      // After first message sent in a request conv, lock the input
      if (activeConv?.status === 'request' && activeConv?.requester_id === user?.id) {
        setAwaitingApproval(true)
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        setAwaitingApproval(true)
      }
    }
  }

  const handleConvCreated = (conv) => {
    setShowNewMsg(false)
    setConversations(prev =>
      prev.some(c => c.id === conv.id) ? prev : sortConvs([conv, ...prev])
    )
    setActiveTab('messages')
    handleSelectConv(conv)
  }

  const handleAcceptRequest = async () => {
    if (!activeConvId) return
    try {
      await acceptMessageRequest(activeConvId)
      // Full refresh to avoid duplicates from stale state
      const [convsRes, reqsRes] = await Promise.all([getConversations(), getMessageRequests()])
      setConversations(convsRes.data.conversations || [])
      setRequests(reqsRes.data.conversations || [])
      setActiveConvIsRequest(false)
      setActiveTab('messages')
    } catch {}
  }

  const handleRejectRequest = async () => {
    if (!activeConvId) return
    try {
      await rejectMessageRequest(activeConvId)
      setRequests(prev => prev.filter(c => c.id !== activeConvId))
      setActiveConvId(null)
      setMobileView('list')
    } catch {}
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-black">

      {/* ── Left panel ── */}
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
          {['messages', 'requests'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors relative ${
                activeTab === tab
                  ? 'text-white border-b-2 border-white'
                  : 'text-[#a8a8a8] hover:text-white'
              }`}
            >
              {tab}
              {tab === 'requests' && requests.length > 0 && (
                <span className="absolute top-2 right-4 min-w-4 h-4 bg-[#0095f6] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {requests.length > 9 ? '9+' : requests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {convsLoading && <ConvListSkeleton />}

          {!convsLoading && displayList.length === 0 && (
            activeTab === 'messages'
              ? <EmptyConvList onNewMessage={() => setShowNewMsg(true)} />
              : <EmptyRequests />
          )}

          {!convsLoading && displayList.map(conv => (
            <ConvRow
              key={conv.id}
              conv={conv}
              active={conv.id === activeConvId}
              currentUserId={user?.id}
              onClick={() => handleSelectConv(conv)}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        className={`flex-1 flex flex-col min-w-0
          ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}
      >
        {activeConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-[#262626] shrink-0">
              <button
                className="md:hidden text-white hover:text-[#a8a8a8] mr-1"
                onClick={() => setMobileView('list')}
              >
                <ArrowLeft size={22} />
              </button>
              <Avatar
                username={activeConv.other_user?.username}
                src={activeConv.other_user?.profile_picture_url}
                userId={activeConv.other_user?.id}
                size={44}
              />
              <p className="font-semibold text-white text-sm truncate flex-1">
                {activeConv.other_user?.username}
              </p>
            </div>

            {/* Received-request banner (recipient B) */}
            {activeConvIsRequest && (
              <div className="border-b border-[#262626] px-4 py-3 shrink-0">
                <p className="text-sm text-[#a8a8a8] mb-3">
                  <span className="font-semibold text-white">{activeConv.other_user?.username}</span>
                  {' '}wants to send you a message. If you accept, they'll also be able to see when you've read messages.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleAcceptRequest}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    onClick={handleRejectRequest}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#363636] hover:bg-[#4d4d4d] text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <X size={14} /> Delete
                  </button>
                </div>
              </div>
            )}

            {/* Sent-request awaiting-approval banner (sender A, after first message) */}
            {awaitingApproval && (
              <div className="border-b border-[#262626] px-4 py-3 shrink-0 text-center">
                <p className="text-sm text-[#a8a8a8]">
                  Your message request is pending. You'll be able to chat once{' '}
                  <span className="text-white font-semibold">{activeConv.other_user?.username}</span>{' '}
                  accepts it.
                </p>
              </div>
            )}

            {/* Thread */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {msgsLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <EmptyChatThread
                  username={activeConv.other_user?.username}
                  userId={activeConv.other_user?.id}
                  profilePictureUrl={activeConv.other_user?.profile_picture_url}
                />
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

            {/* Input: hidden for recipient of request; disabled after sender's first message */}
            {!activeConvIsRequest && (
              <MessageInput onSend={handleSend} disabled={awaitingApproval} />
            )}
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

// ── Conversation row ────────────────────────────────────────────────────────

function ConvRow({ conv, active, currentUserId, onClick }) {
  const lastMsgText = () => {
    const m = conv.last_message
    if (!m) return 'No messages yet'
    if (m.is_deleted_for_everyone) return 'Message deleted'
    if (m.message_type === 'shared_post') return 'Shared a post'
    if (m.message_type === 'shared_reel') return 'Shared a reel'
    return m.body
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors text-left ${
        active ? 'bg-[#1a1a1a]' : ''
      }`}
    >
      <Avatar
        username={conv.other_user?.username}
        src={conv.other_user?.profile_picture_url}
        userId={conv.other_user?.id}
        size={56}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{conv.other_user?.username}</p>
        <p className="text-xs text-[#a8a8a8] truncate">
          {lastMsgText()}
          {conv.last_message && (
            <span className="text-[#737373]"> · {timeAgo(conv.last_message.created_at)}</span>
          )}
        </p>
      </div>
      {/* Pending badge for sent requests */}
      {conv.status === 'request' && conv.requester_id === currentUserId && (
        <span className="shrink-0 text-[10px] text-[#a8a8a8] border border-[#363636] rounded px-1.5 py-0.5">
          Pending
        </span>
      )}
    </button>
  )
}

// ── Small internal components ───────────────────────────────────────────────

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

function EmptyRequests() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-12 text-center">
      <MessageCircle size={40} className="text-[#a8a8a8]" strokeWidth={1.5} />
      <p className="font-semibold text-white">No message requests</p>
      <p className="text-sm text-[#a8a8a8]">
        When someone messages you for the first time, you'll see it here.
      </p>
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
