const WS_URL = 'ws://localhost:8080/ws/messages'
const INITIAL_DELAY_MS = 1000
const MAX_DELAY_MS = 30000

/**
 * Opens a WebSocket connection to the messages endpoint and keeps it alive
 * with exponential backoff on disconnect.
 *
 * Usage:
 *   const socket = createMessagesSocket({ onMessage: (data) => ... })
 *   socket.disconnect() // clean teardown, stops reconnect loop
 */
export function createMessagesSocket({ onMessage }) {
  let ws = null
  let destroyed = false
  let reconnectTimer = null
  let delay = INITIAL_DELAY_MS

  function connect() {
    if (destroyed) return

    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      delay = INITIAL_DELAY_MS // reset backoff on successful connection
      clearTimeout(reconnectTimer)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch {}
    }

    ws.onerror = () => {
      // onerror is always followed by onclose — let onclose handle the reconnect
      try { ws.close() } catch {}
    }

    ws.onclose = () => {
      if (!destroyed) {
        reconnectTimer = setTimeout(() => {
          delay = Math.min(delay * 2, MAX_DELAY_MS)
          connect()
        }, delay)
      }
    }
  }

  connect()

  return {
    disconnect() {
      destroyed = true
      clearTimeout(reconnectTimer)
      try { if (ws) ws.close() } catch {}
    },
  }
}
