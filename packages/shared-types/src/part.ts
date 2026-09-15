export interface Part {
  id?: number;
  partNumber: string;
  name: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  discount?: number;
  minQuantity?: number;
  application?: string;
  alternatePartNumber?: string;
  category?: string;
  focusGroup?: string;
  status?: string;
}
