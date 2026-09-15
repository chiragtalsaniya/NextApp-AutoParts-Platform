export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'storeman'
  | 'salesman'
  | 'retailer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  storeId?: string;
  regionId?: string;
  retailerId?: number;
  profileImage?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}
