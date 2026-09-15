export interface Retailer {
  id: number;
  crmId?: string;
  name: string;
  imageUrl?: string;
  address?: string;
  mobile?: string;
  email?: string;
  contactPerson?: string;
  areaName?: string;
  areaId?: number;
  pincode?: string;
  gstNumber?: string;
  creditLimit?: number;
  isActive?: boolean;
  latitude?: number;
  longitude?: number;
}
