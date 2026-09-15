export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
  message?: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
