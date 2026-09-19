import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  ApiError,
  LoginRequest,
  LoginResponse,
  PaginationParams,
} from '@/types/api';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshSubscriber = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'https://yogrind.shop/api';

const getSecureItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
};

const setSecureItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
};

const deleteSecureItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
};

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: RefreshSubscriber[] = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-API-Version': process.env.EXPO_PUBLIC_API_VERSION || 'v1',
        'X-Mobile-App': 'NextApp-AutoParts-Mobile',
        'X-App-Version': process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
        'X-Platform': Platform.OS,
      },
      withCredentials: false,
    });

    this.setupInterceptors();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      async (config) => {
        config.headers['X-Request-ID'] = this.generateRequestId();
        config.headers['X-Device-Platform'] = Platform.OS;
        config.headers['X-App-Environment'] =
          process.env.EXPO_PUBLIC_APP_ENV || 'production';

        const isLoginOrRefresh =
          config.url?.includes('/auth/login') ||
          config.url?.includes('/auth/refresh');

        if (!isLoginOrRefresh) {
          const token = await getSecureItem('authToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      },
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config as RetryableRequestConfig | undefined;
        const requestUrl = originalRequest?.url || '';
        const isAuthRequest =
          requestUrl.includes('/auth/login') ||
          requestUrl.includes('/auth/refresh');

        if (this.isNetworkError(error)) {
          return Promise.reject(this.handleError(error));
        }

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isAuthRequest
        ) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.refreshSubscribers.push({
                resolve: (token: string) => {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(this.api(originalRequest));
                },
                reject,
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.processRefreshQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            this.processRefreshQueue(refreshError);
            await this.clearAuthentication();
            return Promise.reject(this.handleError(refreshError));
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      },
    );
  }

  private isNetworkError(error: any): boolean {
    return (
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('CORS') ||
      error.message?.includes('Network Error') ||
      error.message?.includes('ERR_FAILED')
    );
  }

  private getWebOrigin(): string | null {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return null;
    }

    return window.location.origin;
  }

  private async refreshToken(): Promise<string> {
    const storedRefreshToken = await getSecureItem('refreshToken');
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken: storedRefreshToken },
      {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Mobile-App': 'NextApp-AutoParts-Mobile',
          'X-Platform': Platform.OS,
        },
        withCredentials: false,
      },
    );

    const responseData = response.data?.data || response.data;
    const token = responseData?.token;
    const newRefreshToken = responseData?.refreshToken;

    if (!token) {
      throw new Error('Refresh response did not include an access token');
    }

    await setSecureItem('authToken', token);
    if (newRefreshToken) {
      await setSecureItem('refreshToken', newRefreshToken);
    }

    return token;
  }

  private processRefreshQueue(error: unknown, token?: string): void {
    this.refreshSubscribers.forEach((subscriber) => {
      if (error || !token) {
        subscriber.reject(error || new Error('Token refresh failed'));
      } else {
        subscriber.resolve(token);
      }
    });

    this.refreshSubscribers = [];
  }

  private async clearAuthentication(): Promise<void> {
    await Promise.all([
      deleteSecureItem('authToken'),
      deleteSecureItem('refreshToken'),
      deleteSecureItem('user'),
    ]);
  }

  private handleError(error: any): ApiError {
    if (error?.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          return {
            error: data?.error || 'Invalid request. Please check your input.',
            details: data?.details || ['Bad request'],
            status,
          };
        case 401:
          return {
            error: data?.error || 'Invalid credentials or expired session.',
            details: data?.details || ['Authentication failed'],
            status,
          };
        case 403:
          return {
            error: data?.error || 'Access denied.',
            details: data?.details || ['Insufficient permissions'],
            status,
          };
        case 404:
          return {
            error: data?.error || 'The requested resource was not found.',
            details: data?.details || ['Resource not found'],
            status,
          };
        case 429:
          return {
            error: data?.error || 'Too many requests. Please try again later.',
            details: data?.details || ['Rate limit exceeded'],
            status,
          };
        case 500:
          return {
            error: data?.error || 'Server error. Please try again later.',
            details: data?.details || ['Internal server error'],
            status,
          };
        default:
          return {
            error: data?.error || `Server error (${status})`,
            details: data?.details || [`HTTP ${status} error`],
            status,
          };
      }
    }

    if (error?.request || this.isNetworkError(error)) {
      const isTimeout =
        error.code === 'ECONNABORTED' || error.message?.includes('timeout');

      if (isTimeout) {
        return {
          error: 'Request timed out. Please check your connection.',
          details: ['Connection timeout'],
          status: 0,
        };
      }

      return {
        error:
          Platform.OS === 'web'
            ? `Unable to reach the API from ${this.getWebOrigin() || 'the web app'}. The API must allow this web origin.`
            : 'Network connection failed. Please check your internet connection.',
        details: [error.message || 'No response received from the server'],
        status: 0,
      };
    }

    return {
      error: 'An unexpected error occurred. Please try again.',
      details: [error?.message || 'Unknown error'],
      status: -1,
    };
  }

  private extractResponseData(response: any): any {
    if (
      response?.data &&
      typeof response.data === 'object' &&
      'data' in response.data
    ) {
      return response.data.data;
    }

    return response?.data;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post('/auth/login', credentials);
    const responseData = this.extractResponseData(response);
    const { user, token, refreshToken, expiresIn } = responseData || {};

    if (!user || !token) {
      throw new Error('Invalid login response: missing user or token');
    }

    await Promise.all([
      setSecureItem('authToken', token),
      setSecureItem('user', JSON.stringify(user)),
      refreshToken
        ? setSecureItem('refreshToken', refreshToken)
        : deleteSecureItem('refreshToken'),
    ]);

    return { user, token, refreshToken, expiresIn };
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed; clearing local authentication.', error);
    } finally {
      await this.clearAuthentication();
    }
  }

  async getProfile() {
    return this.extractResponseData(await this.api.get('/auth/profile'));
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.extractResponseData(
      await this.api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      }),
    );
  }

  async getParts(params?: PaginationParams) {
    return this.extractResponseData(
      await this.api.get('/parts', {
        params: {
          page: 1,
          limit: 100,
          ...params,
        },
      }),
    );
  }

  async getPart(partNumber: string) {
    return this.extractResponseData(await this.api.get(`/parts/${partNumber}`));
  }

  async updatePart(partNumber: string, partData: Record<string, unknown>) {
    return this.extractResponseData(
      await this.api.put(`/parts/${partNumber}`, partData),
    );
  }

  async updatePartStock(
    partNumber: string,
    stock: { T1?: number; T2?: number; T3?: number; T4?: number; T5?: number },
  ) {
    return this.extractResponseData(
      await this.api.patch(`/parts/${partNumber}/stock`, stock),
    );
  }

  async getPartCategories() {
    return this.extractResponseData(await this.api.get('/parts/meta/categories'));
  }

  async getFocusGroups() {
    return this.extractResponseData(await this.api.get('/parts/meta/focus-groups'));
  }

  async getLowStockParts() {
    return this.extractResponseData(await this.api.get('/parts/alerts/low-stock'));
  }

  async getOrders(params?: PaginationParams) {
    const response = await this.api.get('/orders', { params });
    const data = this.extractResponseData(response);

    if (data && Array.isArray(data.orders || data)) {
      const orders = data.orders || data;
      const transformedOrders = orders.map((order: any) => ({
        ...order,
        id: order.Order_Id,
        orderNumber: order.CRMOrderId,
        retailerId: order.Retailer_Id,
        status: order.Order_Status,
        totalAmount: this.calculateOrderTotal(order),
        orderDate: new Date(order.Place_Date).toISOString(),
        deliveryDate: order.Delivered_Date
          ? new Date(order.Delivered_Date).toISOString()
          : undefined,
        notes: order.Remark,
        urgent: order.Urgent_Status === 1 || order.Urgent_Status === true,
        branch: order.Branch_Name,
        retailer: {
          businessName: order.Retailer_Name,
          contactName:
            order.Contact_Person && order.Contact_Person !== '0'
              ? order.Contact_Person
              : undefined,
        },
        items: order.items || [],
      }));

      return {
        ...data,
        data: transformedOrders,
        orders: transformedOrders,
      };
    }

    return data;
  }

  async getOrder(id: number) {
    const data = this.extractResponseData(await this.api.get(`/orders/${id}`));

    if (!data) {
      return data;
    }

    return {
      ...data,
      id: data.Order_Id,
      orderNumber: data.CRMOrderId,
      retailerId: data.Retailer_Id,
      status: data.Order_Status,
      totalAmount: this.calculateOrderTotal(data),
      orderDate: new Date(data.Place_Date).toISOString(),
      deliveryDate: data.Delivered_Date
        ? new Date(data.Delivered_Date).toISOString()
        : undefined,
      notes: data.Remark,
      urgent: data.Urgent_Status === 1 || data.Urgent_Status === true,
      branch: data.Branch_Name,
      retailer: {
        businessName: data.Retailer_Name,
        contactName:
          data.Contact_Person && data.Contact_Person !== '0'
            ? data.Contact_Person
            : undefined,
      },
      items: data.items || [],
    };
  }

  private calculateOrderTotal(order: any): number {
    if (typeof order.totalAmount === 'number') return order.totalAmount;
    if (typeof order.Total_Amount === 'number') return order.Total_Amount;

    if (Array.isArray(order.items)) {
      return order.items.reduce((total: number, item: any) => {
        const quantity = Number(item.quantity ?? item.Order_Qty ?? 0);
        const price = Number(item.unitPrice ?? item.ItemAmount ?? item.MRP ?? 0);
        return total + quantity * price;
      }, 0);
    }

    return 0;
  }

  async createOrder(orderData: any) {
    const formattedOrderData = {
      retailer_id: orderData.retailer_id,
      branch: orderData.branch,
      po_number: orderData.po_number || 'Mobile Order',
      po_date: orderData.po_date || new Date().toISOString(),
      urgent: orderData.urgent || false,
      remark: orderData.remark || orderData.notes || '',
      items: orderData.items.map((item: any) => ({
        part_number: item.part_number,
        part_name: item.part_name || item.partName || 'Unknown Part',
        quantity: item.quantity,
        mrp: item.unitPrice || item.mrp,
        basic_discount: item.basic_discount || 0,
        scheme_discount: item.scheme_discount || 0,
        additional_discount: item.additional_discount || 0,
        urgent: item.urgent || false,
      })),
    };

    return this.extractResponseData(
      await this.api.post('/orders', formattedOrderData),
    );
  }

  async updateOrderStatus(id: number, status: string, notes?: string) {
    return this.extractResponseData(
      await this.api.patch(`/orders/${id}/status`, {
        status,
        notes: notes || `Status updated to ${status} via mobile app`,
      }),
    );
  }

  async getOrderStats() {
    return this.extractResponseData(await this.api.get('/orders/stats/summary'));
  }

  async getDashboardStats() {
    return this.extractResponseData(await this.api.get('/dashboard/stats'));
  }

  async getRetailers(params?: PaginationParams) {
    return this.extractResponseData(await this.api.get('/retailers', { params }));
  }

  async getRetailer(id: number) {
    return this.extractResponseData(await this.api.get(`/retailers/${id}`));
  }

  async createRetailer(retailerData: any) {
    return this.extractResponseData(
      await this.api.post('/retailers', retailerData),
    );
  }

  async updateRetailer(id: number, retailerData: any) {
    return this.extractResponseData(
      await this.api.put(`/retailers/${id}`, retailerData),
    );
  }

  async confirmRetailer(id: number) {
    return this.extractResponseData(
      await this.api.patch(`/retailers/${id}/confirm`),
    );
  }

  async updateRetailerStatus(id: number, status: string) {
    return this.extractResponseData(
      await this.api.patch(`/retailers/${id}/status`, { status }),
    );
  }

  async getRetailerStats() {
    return this.extractResponseData(
      await this.api.get('/retailers/stats/summary'),
    );
  }

  async getStores(params?: PaginationParams) {
    const responseData = this.extractResponseData(
      await this.api.get('/stores', { params }),
    );

    if (responseData?.stores && Array.isArray(responseData.stores)) {
      return responseData;
    }

    return {
      stores: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
    };
  }

  async getStore(branchCode: string) {
    return this.extractResponseData(
      await this.api.get(`/stores/${branchCode}`),
    );
  }

  async getStoresByCompany(
    companyId: string,
    params?: PaginationParams,
  ) {
    const responseData = this.extractResponseData(
      await this.api.get('/stores', {
        params: { company_id: companyId, ...params },
      }),
    );

    if (responseData?.stores && Array.isArray(responseData.stores)) {
      return responseData;
    }

    return {
      stores: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
    };
  }

  async getItemStatus(params?: PaginationParams) {
    return this.extractResponseData(
      await this.api.get('/item-status', { params }),
    );
  }

  async getItemStatusForPart(branchCode: string, partNo: string) {
    return this.extractResponseData(
      await this.api.get(`/item-status/${branchCode}/${partNo}`),
    );
  }

  async updateItemStock(
    branchCode: string,
    partNo: string,
    stockLevels: { Part_A: string | number; Part_B: string | number; Part_C: string | number; Narr?: string },
  ) {
    return this.extractResponseData(
      await this.api.patch(`/item-status/${branchCode}/${partNo}/stock`, stockLevels),
    );
  }

  /**
   * Adjust shelf stock up (add) or down (subtract) by a quantity.
   * Subtraction pulls from shelf A first, then B, then C, and is
   * rejected if there is not enough total stock.
   */
  async adjustItemStock(
    branchCode: string,
    partNo: string,
    quantity: number,
    operation: 'add' | 'subtract',
  ) {
    return this.extractResponseData(
      await this.api.post(`/item-status/${branchCode}/${partNo}/adjust-stock`, {
        quantity,
        operation,
      }),
    );
  }

  async updateRackLocation(
    branchCode: string,
    partNo: string,
    rackLocation: string,
  ) {
    return this.extractResponseData(
      await this.api.patch(`/item-status/${branchCode}/${partNo}/rack`, {
        rackLocation,
      }),
    );
  }

  async recordSale(branchCode: string, partNo: string, saleData: any) {
    return this.extractResponseData(
      await this.api.post(`/item-status/${branchCode}/${partNo}/sale`, saleData),
    );
  }

  async recordPurchase(branchCode: string, partNo: string, purchaseData: any) {
    return this.extractResponseData(
      await this.api.post(
        `/item-status/${branchCode}/${partNo}/purchase`,
        purchaseData,
      ),
    );
  }

  async getLowStockItems() {
    return this.extractResponseData(
      await this.api.get('/item-status/alerts/low-stock'),
    );
  }

  async getItemStatusStats(branchCode: string) {
    return this.extractResponseData(
      await this.api.get(`/item-status/stats/${branchCode}`),
    );
  }

  async getOrderReport(params?: any) {
    return this.extractResponseData(
      await this.api.get('/reports/orders', { params }),
    );
  }

  async getInventoryReport(params?: any) {
    return this.extractResponseData(
      await this.api.get('/reports/inventory', { params }),
    );
  }

  async getSalesReport(params?: any) {
    return this.extractResponseData(
      await this.api.get('/reports/sales', { params }),
    );
  }

  async getRetailerReport(params?: any) {
    return this.extractResponseData(
      await this.api.get('/reports/retailers', { params }),
    );
  }

  async getUsers(params?: PaginationParams) {
    return this.extractResponseData(await this.api.get('/users', { params }));
  }

  async getUser(id: number) {
    return this.extractResponseData(await this.api.get(`/users/${id}`));
  }

  async createUser(userData: any) {
    return this.extractResponseData(await this.api.post('/users', userData));
  }

  async updateUser(id: number, userData: any) {
    return this.extractResponseData(
      await this.api.put(`/users/${id}`, userData),
    );
  }

  async updateUserStatus(id: number, status: string) {
    return this.extractResponseData(
      await this.api.patch(`/users/${id}/status`, { status }),
    );
  }

  async getUserStats() {
    return this.extractResponseData(await this.api.get('/users/stats/summary'));
  }

  async getCompanies(params?: PaginationParams) {
    return this.extractResponseData(
      await this.api.get('/companies', { params }),
    );
  }

  async getCompany(id: number) {
    return this.extractResponseData(await this.api.get(`/companies/${id}`));
  }

  async getRegions(params?: PaginationParams) {
    return this.extractResponseData(await this.api.get('/regions', { params }));
  }

  async getRegion(id: number) {
    return this.extractResponseData(await this.api.get(`/regions/${id}`));
  }
}

export const apiService = new ApiService();
