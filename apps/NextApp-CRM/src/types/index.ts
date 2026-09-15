export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id?: string;
  store_id?: string;
  region_id?: string;
  retailer_id?: number; // Added for retailer users
  profile_image?: string; // Added for user profile image
  created_at: string;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'storeman' | 'salesman' | 'retailer';

export interface Company {
  id: string;
  name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  logo_url?: string; // Added for company logo
  created_by: string;
  created_at: string;
}

export interface Store {
  Branch_Code: string;
  Branch_Name?: string;
  Company_Name?: string;
  Branch_Address?: string;
  Branch_Phone?: string;
  Branch_Email?: string;
  Branch_Manager?: string;
  Branch_URL?: string;
  Branch_Manager_Mobile?: string;
  store_image?: string; // Replaced Item_Photo_Path with store_image
  company_id?: string;
}

export interface Retailer {
  Retailer_Id: number;
  RetailerCRMId?: string;
  Retailer_Name?: string;
  RetailerImage?: string; // This is the retailer image URL
  Retailer_Address?: string;
  Retailer_Mobile?: string;
  Retailer_TFAT_Id?: string;
  Retailer_Status?: number;
  Area_Name?: string;
  Contact_Person?: string;
  Pincode?: string;
  Mobile_Order?: string;
  Mobile_Account?: string;
  Owner_Mobile?: string;
  Area_Id?: number;
  GST_No?: string;
  Credit_Limit?: number;
  Type_Id?: number;
  Confirm?: number;
  Retailer_Tour_Id?: number;
  Retailer_Email?: string;
  latitude?: number;
  logitude?: number;
  Last_Sync?: number;
}

export interface Part {
  Part_Number: string;
  Part_Name?: string;
  Part_Price?: number;
  Part_Discount?: string;
  Part_Image?: string;
  Part_MinQty?: number;
  Part_BasicDisc?: number;
  Part_SchemeDisc?: number;
  Part_AdditionalDisc?: number;
  Part_Application?: string;
  GuruPoint?: number;
  ChampionPoint?: number;
  Alternate_PartNumber?: string;
  T1?: number;
  T2?: number;
  T3?: number;
  T4?: number;
  T5?: number;
  Is_Order_Pad?: number;
  Item_Status?: string;
  Order_Pad_Category?: number;
  Previous_PartNumber?: string;
  Focus_Group?: string;
  Part_Catagory?: string;
  Last_Sync?: number;
}

// New Item Status interface for store-wise part status tracking
export interface ItemStatus {
  Branch_Code: string;
  Part_No: string;
  Part_Branch: string; // Primary key: Branch_Code-Part_No
  Part_A?: string; // Stock level A
  Part_B?: string; // Stock level B
  Part_C?: string; // Stock level C
  Part_Max?: string; // Maximum stock level
  Part_Rack?: string; // Rack location
  LastSale?: number; // Last sale timestamp
  LastPurchase?: number; // Last purchase timestamp
  Narr?: string; // Narrative/Notes
  Last_Sync?: number; // Last sync timestamp
  created_at?: string;
  updated_at?: string;
  // Joined fields from related tables
  Branch_Name?: string;
  Company_Name?: string;
  Part_Name?: string;
  Part_Price?: number;
  Part_MinQty?: number;
  Part_Catagory?: string;
  Focus_Group?: string;
  Part_Image?: string;
  // Calculated fields
  total_stock?: number;
  max_stock?: number;
  stock_percentage?: number;
  stock_level?: 'critical' | 'low' | 'medium' | 'good';
  urgency?: 'critical' | 'low';
}

// Updated Order Master structure based on your database schema
export interface OrderMaster {
  Order_Id: number;
  CRMOrderId?: string;
  Retailer_Id?: number;
  Transport_Id?: number;
  TransportBy?: string;
  Place_By?: string;
  Place_Date?: number; // decimal timestamp
  Confirm_By?: string;
  Confirm_Date?: number; // decimal timestamp
  Pick_By?: string;
  Pick_Date?: number; // decimal timestamp
  Pack_By?: string;
  Checked_By?: string;
  Pack_Date?: number; // decimal timestamp
  Delivered_By?: string;
  Delivered_Date?: number; // decimal timestamp
  Order_Status?: OrderStatus;
  Branch?: string; // Store branch code
  DispatchId?: number;
  Remark?: string;
  PO_Number?: string;
  PO_Date?: number; // decimal timestamp
  Urgent_Status?: boolean; // Changed to boolean as requested
  Longitude?: number;
  IsSync?: boolean;
  Latitude?: number;
  Last_Sync?: number; // decimal timestamp
}

// Updated Order Items structure based on your database schema
export interface OrderItem {
  Order_Item_Id: number;
  Order_Id?: number;
  Order_Srl?: number; // Serial number within order
  Part_Admin?: string; // Part number from admin perspective
  Part_Salesman?: string; // Part number from salesman perspective
  Order_Qty?: number;
  Dispatch_Qty?: number;
  Pick_Date?: number; // decimal timestamp
  Pick_By?: string;
  OrderItemStatus?: string;
  PlaceDate?: number; // decimal timestamp
  RetailerId?: number;
  ItemAmount?: number; // Amount in cents/paise
  SchemeDisc?: number; // Scheme discount percentage
  AdditionalDisc?: number; // Additional discount percentage
  Discount?: number; // Basic discount percentage
  MRP?: number; // Maximum Retail Price in cents/paise
  FirstOrderDate?: number; // decimal timestamp
  Urgent_Status?: boolean; // Changed to boolean as requested
  Last_Sync?: number; // decimal timestamp
}

// Updated Order Status enum
export type OrderStatus = 'New' | 'Processing' | 'Completed' | 'Hold' | 'Picked' | 'Dispatched' | 'Pending' | 'Cancelled';

// New Order Form interface for creating orders
export interface NewOrderForm {
  retailer_id: number;
  po_number?: string;
  po_date?: Date;
  urgent: boolean;
  remark?: string;
  items: NewOrderItemForm[];
}

export interface NewOrderItemForm {
  part_number: string;
  part_name?: string;
  quantity: number;
  mrp: number;
  basic_discount: number;
  scheme_discount: number;
  additional_discount: number;
  urgent: boolean;
}

// Legacy Order interface for backward compatibility (can be removed later)
export interface Order {
  id: string;
  retailer_id: string;
  salesman_id: string;
  store_id: string;
  status: OrderStatus;
  total_price: number;
  created_at: string;
  items: LegacyOrderItem[];
}

export interface LegacyOrderItem {
  id: string;
  order_id: string;
  part_id: string;
  quantity: number;
  price_per_unit: number;
  part_name?: string;
}

export interface Transport {
  id: string;
  store_id: string;
  type: string;
  provider: string;
  contact_number: string;
}

export interface Region {
  id: string;
  name: string;
  store_id: string;
  created_by: string;
}

export interface PartCategory {
  id: number;
  name: string;
  description?: string;
}

export interface FocusGroup {
  id: string;
  name: string;
  description?: string;
}

// Helper functions for timestamp conversion
export const timestampToDate = (timestamp?: number): Date | null => {
  if (!timestamp) return null;
  return new Date(timestamp);
};

export const dateToTimestamp = (date: Date): number => {
  return date.getTime();
};

// Helper function to format currency from cents/paise
export const formatCurrency = (amount?: number): string => {
  if (!amount) return '$0.00';
  return `$${(amount / 100).toFixed(2)}`;
};

// Helper function to get status color
export const getOrderStatusColor = (status?: OrderStatus): string => {
  switch (status) {
    case 'New': return 'bg-blue-100 text-blue-800';
    case 'Processing': return 'bg-yellow-100 text-yellow-800';
    case 'Completed': return 'bg-green-100 text-green-800';
    case 'Hold': return 'bg-red-100 text-red-800';
    case 'Picked': return 'bg-purple-100 text-purple-800';
    case 'Dispatched': return 'bg-indigo-100 text-indigo-800';
    case 'Pending': return 'bg-orange-100 text-orange-800';
    case 'Cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Helper function to get status icon
export const getOrderStatusIcon = (status?: OrderStatus): string => {
  switch (status) {
    case 'New': return 'plus-circle';
    case 'Processing': return 'clock';
    case 'Completed': return 'check-circle';
    case 'Hold': return 'pause-circle';
    case 'Picked': return 'package';
    case 'Dispatched': return 'truck';
    case 'Pending': return 'clock';
    case 'Cancelled': return 'x-circle';
    default: return 'circle';
  }
};

// Helper functions for item status
export const getStockLevelColor = (level?: string): string => {
  switch (level) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'low': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'good': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const calculateStockLevel = (current: number, max: number): string => {
  if (max === 0) return 'unknown';
  const percentage = (current / max) * 100;
  
  if (percentage < 20) return 'critical';
  if (percentage < 40) return 'low';
  if (percentage < 70) return 'medium';
  return 'good';
};

export const formatStockDisplay = (partA?: string, partB?: string, partC?: string): string => {
  const a = parseInt(partA || '0');
  const b = parseInt(partB || '0');
  const c = parseInt(partC || '0');
  const total = a + b + c;
  
  return `${total} (A:${a}, B:${b}, C:${c})`;
};