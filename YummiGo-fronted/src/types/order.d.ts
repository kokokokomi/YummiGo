// 提交订单返回的信息
export type OrderSubmitVO = Partial<{
  id: number // 订单ID
  orderAmount: number // 订单金额
  orderNumber: string // 订单编号
  orderTime: Date // 下单时间
}>

// 订单信息
export type Order = {
  id: number
  number: string
  status: number
  userId: number
  addressBookId: number
  orderTime: string
  checkoutTime?: string
  payMethod: number
  payStatus: number
  amount: number

  snapshotUserName?: string
  snapshotPhone?: string
  snapshotAddress?: string
  snapshotConsignee?: string
  remark?: string

  cancelReason?: string
  rejectionReason?: string
  cancelTime?: string
  estimatedDeliveryTime?: string
  deliveryStatus?: number
  deliveryTime?: string
  packAmount?: number
  tablewareNumber?: number
  tablewareStatus?: number
}

// 订单详细菜品信息
export type OrderDetail = Partial<{
  id: number
  name: string // 名称
  orderId: number // 订单id
  dishId: number // 菜品id
  setmealId: number // 套餐id
  dishFlavor: string // 口味
  number: number // 数量
  amount: number // 金额
  pic: string // 图片
}>

// 订单所有信息
export type OrderVO = Order & {
  orderDetailList: OrderDetail[]
}

// 分页接口
export type PageVO<T> = {
  total: number
  records: T[]
}
