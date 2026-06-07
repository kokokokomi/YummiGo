import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { OrderWsPayload } from '@/utils/merchantWebSocket'

/** WebSocket 新订单/催单时通知各页面刷新列表 */
export const useOrderNotifyStore = defineStore('orderNotify', () => {
  const tick = ref(0)
  const lastPayload = ref<OrderWsPayload | null>(null)

  const notify = (payload: OrderWsPayload) => {
    lastPayload.value = payload
    tick.value += 1
  }

  return { tick, lastPayload, notify }
})
