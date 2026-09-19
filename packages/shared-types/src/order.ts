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
  schemeDiscount?: number;
  additionalDiscount?: number;
  amount: number;
  urgent?: boolean;
}

export interface OrderStatusHistoryEntry {
  id: number;
  orderId: number;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedBy: string;
  changedAt: number;
  notes?: string;
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
  statusHistory?: OrderStatusHistoryEntry[];
}

export interface CreateOrderItemRequest {
  part_number: string;
  part_name?: string;
  quantity: number;
  mrp: number;
  basic_discount?: number;
  scheme_discount?: number;
  additional_discount?: number;
  urgent?: boolean;
}

export interface CreateOrderRequest {
  retailer_id: number;
  po_number?: string;
  po_date?: string;
  urgent: boolean;
  remark?: string;
  items: CreateOrderItemRequest[];
}
