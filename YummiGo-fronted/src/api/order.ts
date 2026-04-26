import request from '@/utils/request'

// 查询列表页接口
export const getOrderDetailPageAPI = (params: any) => {
  return request({
    url: '/order/page',
    method: 'get',
    params
  })
}

// 查看接口（订单 id 为 Snowflake 长整型，禁止用 Number()，否则 JS 丢精度导致后端查不到）
export const queryOrderDetailByIdAPI = async (params: { orderId: string | number }) => {
  const raw = params?.orderId
  const orderIdStr = raw != null ? String(raw).trim() : ''
  if (!orderIdStr || !/^\d+$/.test(orderIdStr)) {
    return Promise.resolve({
      data: {
        code: 0,
        message: '无效的订单ID',
        data: null
      }
    })
  }

  // 优先匹配当前后端实现：GET /order/{id}
  const detailUrls = [`/order/${orderIdStr}`]
  let lastResponse: any = null

  for (const url of detailUrls) {
    try {
      const response = await request({
        url,
        method: 'get'
      })
      lastResponse = response
      if (response?.data?.code === 1) {
        return response
      }
    } catch (error: any) {
      // 404 时继续尝试备用路径，避免因单一路径差异导致“查看”直接失败
      if (error?.response?.status === 404) {
        continue
      }
      throw error
    }
  }

  return lastResponse
}

// 派送接口
export const deliveryOrderAPI = (params: { status?: number; id: string | number }) => {
  return request({
    url: `/order/delivery/${String(params.id)}`,
    method: 'put'
  })
}

// 完成接口
export const completeOrderAPI = (params: { status?: number; id: string | number }) => {
  return request({
    url: `/order/complete/${String(params.id)}`,
    method: 'put'
  })
}

// 订单取消
export const orderCancelAPI = (params: any) => {
  return request({
    url: '/order/cancel',
    method: 'put',
    data: { ...params }
  })
}

// 接单
export const orderAcceptAPI = (params: any) => {
  console.log('接单params', params)
  return request({
    url: '/order/confirm',
    method: 'put',
    data: { ...params }
  })
}

// 拒单
export const orderRejectAPI = (params: any) => {
  return request({
    url: '/order/reject',
    method: 'put',
    data: { ...params }
  })
}

// 获取待处理，待派送，派送中数量
export const getOrderListByAPI = () => {
  return request({
    url: '/order/statistics',
    method: 'get'
  })
}
