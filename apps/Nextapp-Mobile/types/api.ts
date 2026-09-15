export interface User {
  id: number;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'storeman' | 'salesman' | 'retailer';
  companyId?: string; // Changed to string to handle both string and numeric IDs
  storeId?: string; // Changed to string to handle both string and numeric IDs
  isActive: boolean;
  profilePicture?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: number;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  branchCode: string;
  name: string;
  companyId?: string; // Changed to string to handle both string and numeric IDs
  address: string;
  phone?: string;
  email?: string;
  managerId?: number;
  isActive: boolean;
  photo?: string;
  regionId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Part {
  Part_Number: string;
  Part_Name: string;
  Part_Price: number;
  Part_Discount?: number;
  Part_Image?: string;
  Part_MinQty: number;
  Part_BasicDisc: number;
  Part_SchemeDisc: number;
  Part_AdditionalDisc: number;
  Part_Application: string;
  GuruPoint: number;
  ChampionPoint: number;
  Alternate_PartNumber?: string;
  T1: number;
  T2: number;
  T3: number;
  T4: number;
  T5: number;
  Is_Order_Pad: number;
  Item_Status: string;
  Order_Pad_Category: number;
  Previous_PartNumber?: string;
  Focus_Group: string;
  Part_Catagory: string;
  Last_Sync?: number;
  created_at: string;
  updated_at: string;
}

// Updated Order interface to match the new API response
export interface Order {
  Order_Id: number;
  CRMOrderId: string;
  Retailer_Id: number;
  Transport_Id?: number;
  TransportBy?: string;
  Place_By: string;
  Place_Date: number;
  Confirm_By?: string;
  Confirm_Date?: number;
  Pick_By?: string;
  Pick_Date?: number;
  Pack_By?: string;
  Checked_By?: string;
  Pack_Date?: number;
  Delivered_By?: string;
  Delivered_Date?: number;
  Order_Status: string;
  Branch: string;
  DispatchId?: string;
  Remark?: string;
  PO_Number: string;
  PO_Date: number;
  Urgent_Status: number;
  Longitude?: number;
  IsSync: number;
  Latitude?: number;
  Last_Sync: number;
  created_at: string;
  updated_at: string;
  // Additional fields from API response
  Retailer_Name: string;
  Contact_Person: string;
  Branch_Name: string;
  Company_Name: string;
  // Computed fields for compatibility
  id?: number;
  orderNumber?: string;
  retailerId?: number;
  status?: string;
  totalAmount?: number;
  orderDate?: string;
  deliveryDate?: string;
  notes?: string;
  urgent?: boolean;
  branch?: string;
  retailer?: {
    businessName: string;
    contactName: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  part?: {
    name: string;
    category: string;
    image?: string;
  };
}

export interface Retailer {
  Retailer_Id: number;
  RetailerCRMId?: string;
  Retailer_Name: string;
  RetailerImage?: string;
  Retailer_Address?: string;
  Retailer_Mobile?: string;
  Retailer_TFAT_Id?: string;
  Retailer_Status: number;
  Area_Name?: string;
  Contact_Person?: string;
  Pincode?: string;
  Mobile_Order?: string;
  Mobile_Account?: string;
  Owner_Mobile?: string;
  Area_Id: number;
  GST_No?: string;
  Credit_Limit: string;
  Type_Id?: number;
  Confirm: number;
  Retailer_Tour_Id?: number;
  Retailer_Email?: string;
  latitude?: number;
  logitude?: number;
  Last_Sync?: number;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  details?: string[];
  status?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  filter?: Record<string, any>;
  sort?: string;
  order?: 'asc' | 'desc';
  company_id?: string; // Added for store filtering
}

export interface InventoryItem {
  branchCode: string;
  partNo: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  rackLocation?: string;
  lastUpdated: string;
  part?: {
    name: string;
    category: string;
    unitPrice: number;
  };
}

export interface DashboardStats {
  orders?: {
    total: number;
    pending: number;
    delivered: number;
    revenue: number;
    growth?: number;
  };
  parts?: {
    total: number;
    lowStock: number;
    categories: number;
  };
  retailers?: {
    total: number;
    active: number;
    pending: number;
  };
  sales?: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth?: number;
  };
}

export interface ReportData {
  orders?: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  };
  inventory?: {
    totalParts: number;
    lowStockItems: number;
    totalValue: number;
    topCategories: Array<{ category: string; count: number; value: number }>;
  };
  sales?: {
    totalSales: number;
    dailyAverage: number;
    monthlyGrowth: number;
    topSalespeople: Array<{ name: string; sales: number; revenue: number }>;
  };
  retailers?: {
    totalRetailers: number;
    activeRetailers: number;
    topRetailers: Array<{ name: string; orders: number; revenue: number }>;
  };
}