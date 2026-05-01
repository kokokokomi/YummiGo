export type ApiResult<T> = {
  code: number;
  message?: string;
  msg?: string;
  data: T;
};

export type UserLoginVO = {
  id: string;
  token: string;
  name?: string;
  firstLogin?: boolean;
};

export type Category = {
  id: string;
  type: number;
  name: string;
};

export type DishFlavor = {
  id: string;
  name: string;
  value: string;
};

export type DishVO = {
  id: string;
  categoryId: string;
  name: string;
  image?: string;
  description?: string;
  price: number;
  status: number;
  flavors?: DishFlavor[];
};

export type Setmeal = {
  id: string;
  categoryId: string;
  name: string;
  image?: string;
  description?: string;
  price: number;
  status: number;
};

export type ShoppingCartItem = {
  id: string;
  name: string;
  image?: string;
  userId: string;
  dishId?: string;
  setmealId?: string;
  dishFlavor?: string;
  number: number;
  amount: number;
};

export type Address = {
  id: string;
  consignee: string;
  sex?: string;
  phone: string;
  provinceName?: string;
  cityName?: string;
  districtName?: string;
  detail: string;
  label?: string;
  isDefault?: boolean;
  fullAddress?: string;
};

export type OrderSubmitVO = {
  id: string;
  orderNumber: string;
  orderAmount: number;
  orderTime: string;
};

export type OrderPaymentVO = {
  orderId: string;
  sessionId: string;
  checkoutUrl: string;
  waitingOrders?: number;
};

export type OrderPaymentStatusVO = {
  orderId: string;
  orderNumber: string;
  payStatus: number;
  status: number;
  amount: number;
  checkoutTime?: string;
};

export type OrderDetail = {
  id: string;
  name: string;
  image?: string;
  number: number;
  amount: number;
  dishFlavor?: string;
};

export type OrderVO = {
  id: string;
  number: string;
  status: number;
  orderTime: string;
  checkoutTime?: string;
  payStatus: number;
  payMethod: number;
  amount: number;
  snapshotConsignee?: string;
  snapshotAddress?: string;
  snapshotPhone?: string;
  remark?: string;
  tablewareNumber?: number;
  packAmount?: number;
  estimatedDeliveryTime?: string;
  deliveryTime?: string;
  orderDetailList: OrderDetail[];
};

export type PageResult<T> = {
  total: number;
  records: T[];
};

