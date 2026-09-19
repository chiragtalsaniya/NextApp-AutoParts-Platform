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

export interface PartCategory {
  category: string;
  count: number;
}

export interface FocusGroup {
  focus_group: string;
  count: number;
}

export interface PartsListResponse {
  parts: Part[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ItemStatus {
  Branch_Code: string;
  Part_No: string;
  Part_Branch: string;
  Part_A?: string;
  Part_B?: string;
  Part_C?: string;
  Part_Max?: string;
  Part_Rack?: string;
  LastSale?: number;
  LastPurchase?: number;
  Narr?: string;
  Last_Sync?: number;
  Branch_Name?: string;
  Company_Name?: string;
  Part_Name?: string;
  Part_Price?: number;
  Part_MinQty?: number;
  Part_Catagory?: string;
  Focus_Group?: string;
  Part_Image?: string;
  total_stock?: number;
  max_stock?: number;
  stock_percentage?: number;
  stock_level?: 'critical' | 'low' | 'medium' | 'good';
  urgency?: 'critical' | 'low';
}
