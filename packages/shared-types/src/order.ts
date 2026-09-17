export type OrderStatus =
  | 'New'
  | 'Processing'
  | 'Completed'
  | 'Hold'
  | 'Picked'
  | 'Dispatched'
  | 'Pending'
  | 'Cancelled';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  New: ['Pending', 'Processing', 'Hold', 'Cancelled'],
  Pending: ['Processing', 'Hold', 'Cancelled'],
  Processing: ['Picked', 'Hold', 'Cancelled'],
  Hold: ['Pending', 'Processing', 'Cancelled'],
  Picked: ['Dispatched', 'Hold'],
  Dispatched: ['Completed'],
  Completed: [],
  Cancelled: [],
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  New: 'Order has been created and is awaiting processing',
  Pending: 'Order is waiting for confirmation',
  Processing: 'Order is being processed and prepared',
  Hold: 'Order is on hold pending review',
  Picked: 'Order items have been picked from inventory',
  Dispatched: 'Order has been dispatched for delivery',
  Completed: 'Order has been completed successfully',
  Cancelled: 'Order has been cancelled',
};

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
