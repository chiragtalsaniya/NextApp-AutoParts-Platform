export type OrderStatus =
  | 'New'
  | 'Processing'
  | 'Completed'
  | 'Hold'
  | 'Picked'
  | 'Dispatched'
  | 'Pending'
  | 'Cancelled';

export interface OrderItem {
  id: number;
  orderId: number;
  partNumber: string;
  partName?: string;
  quantity: number;
  dispatchQuantity?: number;
  unitPrice: number;
  discount?: number;
  amount: number;
}

export interface Order {
  id: number;
  retailerId: number;
  storeId?: string;
  status: OrderStatus;
  poNumber?: string;
  poDate?: string;
  urgent: boolean;
  remark?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
}

export interface CreateOrderItemRequest {
  partNumber: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface CreateOrderRequest {
  retailerId: number;
  poNumber?: string;
  poDate?: string;
  urgent: boolean;
  remark?: string;
  items: CreateOrderItemRequest[];
}
