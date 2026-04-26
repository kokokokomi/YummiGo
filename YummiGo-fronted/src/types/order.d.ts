// 提交订单返回的信息
export type OrderSubmitVO = Partial<{
  id: string | number // 订单ID（后端 Long 建议用字符串，避免 JS 精度问题）
  orderAmount: number // 订单金额
  orderNumber: string // 订单编号
  orderTime: Date // 下单时间
}>

// 订单信息
export type Order = {
  id: string | number
  number: string
  status: number
  userId: string | number
  addressBookId: string | number
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
  id: string | number
  name: string // 名称
  orderId: string | number // 订单id
  dishId: string | number // 菜品id
  setmealId: string | number // 套餐id
  dishFlavor: string // 口味
  number: number // 数量
  amount: number // 金额
  /** 后端实体字段为 image；pic 为历史命名兼容 */
  image: string
  pic: string
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
