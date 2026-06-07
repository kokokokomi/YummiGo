export type OrderWsPayload = {
  type?: number
  event?: string
  orderId?: string
  orderNumber?: string
  content?: string
}

/** 开发走 Vite /ws 代理；生产优先 VITE_WS_URL，否则从 API 地址或当前站点推导 */
export function resolveWebSocketUrl(clientId: string): string {
  const explicit = import.meta.env.VITE_WS_URL?.trim()
  if (explicit) {
    const base = explicit.replace(/\/$/, '')
    return `${base}/${clientId}`
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL?.trim()
  if (apiBase) {
    try {
      const u = new URL(apiBase)
      const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${wsProto}//${u.host}/ws/${clientId}`
    } catch {
      // fall through
    }
  }

  const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${wsProto}//${window.location.host}/ws/${clientId}`
}

type MerchantWebSocketOptions = {
  onMessage: (payload: OrderWsPayload) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (event: Event) => void
}

/** 商家端 WebSocket：断线自动重连（Mac 休眠/系统更新后常见断连） */
export function createMerchantWebSocket(options: MerchantWebSocketOptions): () => void {
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempt = 0
  let closed = false

  const scheduleReconnect = () => {
    if (closed) return
    const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempt))
    reconnectAttempt += 1
    reconnectTimer = setTimeout(connect, delay)
  }

  const connect = () => {
    if (closed || typeof WebSocket === 'undefined') return

    const clientId = Math.random().toString(36).slice(2)
    const url = resolveWebSocketUrl(clientId)
    console.log('[WebSocket] connecting', url)

    ws = new WebSocket(url)

    ws.onopen = () => {
      reconnectAttempt = 0
      console.log('[WebSocket] connected')
      options.onConnect?.()
    }

    ws.onmessage = (msg) => {
      try {
        const payload = JSON.parse(String(msg.data)) as OrderWsPayload
        options.onMessage(payload)
      } catch (e) {
        console.error('[WebSocket] message parse failed', e, msg.data)
      }
    }

    ws.onerror = (event) => {
      console.error('[WebSocket] error', event)
      options.onError?.(event)
    }

    ws.onclose = () => {
      console.log('[WebSocket] closed')
      options.onDisconnect?.()
      scheduleReconnect()
    }
  }

  connect()

  return () => {
    closed = true
    if (reconnectTimer) clearTimeout(reconnectTimer)
    ws?.close()
    ws = null
  }
}
