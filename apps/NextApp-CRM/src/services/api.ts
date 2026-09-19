import api from '../lib/database';

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  getProfile: () => 
    api.get('/auth/profile'),
  
  logout: () => {
    localStorage.removeItem('auth_token');
    return Promise.resolve();
  },
  
  changePassword: (currentPassword: string, newPassword: string) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  
  refreshToken: () => 
    api.post('/auth/refresh')
};

// Users API
export const usersAPI = {
  getUsers: (params?: any) => 
    api.get('/users', { params }),
  
  getUser: (id: string) => 
    api.get(`/users/${id}`),
  
  createUser: (userData: any) => 
    api.post('/users', userData),
  
  updateUser: (id: string, userData: any) => 
    api.put(`/users/${id}`, userData),
  
  deleteUser: (id: string) => 
    api.delete(`/users/${id}`),
  
  updateUserStatus: (id: string, isActive: boolean) => 
    api.patch(`/users/${id}/status`, { is_active: isActive }),
  
  getUserStats: () => 
    api.get('/users/stats/summary')
};

// Companies API
export const companiesAPI = {
  getCompanies: (params?: any) => 
    api.get('/companies', { params }),
  
  getCompany: (id: string) => 
    api.get(`/companies/${id}`),
  
  createCompany: (companyData: any) => 
    api.post('/companies', companyData),
  
  updateCompany: (id: string, companyData: any) => 
    api.put(`/companies/${id}`, companyData),
  
  deleteCompany: (id: string) => 
    api.delete(`/companies/${id}`)
};

// Stores API
export const storesAPI = {
  getStores: (params?: any) => 
    api.get('/stores', { params }),
  
  getStore: (id: string) => 
    api.get(`/stores/${id}`),
  
  createStore: (storeData: any) => 
    api.post('/stores', storeData),
  
  updateStore: (id: string, storeData: any) => 
    api.put(`/stores/${id}`, storeData),
  
  deleteStore: (id: string) => 
    api.delete(`/stores/${id}`)
};

// Retailers API
export const retailersAPI = {
  getRetailers: (params?: any) => 
    api.get('/retailers', { params }),
  
  getRetailer: (id: number) => 
    api.get(`/retailers/${id}`),
  
  createRetailer: (retailerData: any) => 
    api.post('/retailers', retailerData),
  
  updateRetailer: (id: number, retailerData: any) => 
    api.put(`/retailers/${id}`, retailerData),
  
  deleteRetailer: (id: number) => 
    api.delete(`/retailers/${id}`),
  
  confirmRetailer: (id: number) => 
    api.patch(`/retailers/${id}/confirm`),
  
  updateRetailerStatus: (id: number, status: number) => 
    api.patch(`/retailers/${id}/status`, { status }),
  
  getRetailerStats: () => 
    api.get('/retailers/stats/summary')
};

// Parts API
export const partsAPI = {
  getParts: (params?: any) => 
    api.get('/parts', { params }),
  
  getPart: (partNumber: string) => 
    api.get(`/parts/${partNumber}`),
  
  createPart: (partData: any) => 
    api.post('/parts', partData),
  
  updatePart: (partNumber: string, partData: any) => 
    api.put(`/parts/${partNumber}`, partData),
  
  updateStockLevels: (partNumber: string, stockData: any) => 
    api.patch(`/parts/${partNumber}/stock`, stockData),
  
  getCategories: () => 
    api.get('/parts/meta/categories'),
  
  getFocusGroups: () => 
    api.get('/parts/meta/focus-groups'),
  
  getLowStockParts: () => 
    api.get('/parts/alerts/low-stock')
};

// Item Status API
export const itemStatusAPI = {
  getItemStatus: (params?: any) => 
    api.get('/item-status', { params }),
  
  getItemStatusByStoreAndPart: (branchCode: string, partNo: string) => 
    api.get(`/item-status/${branchCode}/${partNo}`),
  
  createOrUpdateItemStatus: (itemStatusData: any) => 
    api.post('/item-status', itemStatusData),
  
  updateStockLevels: (branchCode: string, partNo: string, stockData: any) => 
    api.patch(`/item-status/${branchCode}/${partNo}/stock`, stockData),
  
  updateRackLocation: (branchCode: string, partNo: string, rackData: any) => 
    api.patch(`/item-status/${branchCode}/${partNo}/rack`, rackData),
  
  recordSale: (branchCode: string, partNo: string, saleData: any) => 
    api.post(`/item-status/${branchCode}/${partNo}/sale`, saleData),
  
  recordPurchase: (branchCode: string, partNo: string, purchaseData: any) => 
    api.post(`/item-status/${branchCode}/${partNo}/purchase`, purchaseData),
  
  getLowStockAlerts: (params?: any) => 
    api.get('/item-status/alerts/low-stock', { params }),
  
  getStoreStats: (branchCode: string) => 
    api.get(`/item-status/stats/${branchCode}`)
};

// Orders API
export const ordersAPI = {
  getOrders: (params?: any) => 
    api.get('/orders', { params }),
  
  getOrder: (id: number) => 
    api.get(`/orders/${id}`),
  
  createOrder: (orderData: any) => 
    api.post('/orders', orderData),
  
  updateOrderStatus: (id: number, statusData: any) => 
    api.patch(`/orders/${id}/status`, statusData),
  
  getOrderStats: () => 
    api.get('/orders/stats/summary')
};

// Regions API
export const regionsAPI = {
  getRegions: (params?: any) => 
    api.get('/regions', { params }),
  
  getRegion: (id: string) => 
    api.get(`/regions/${id}`),
  
  createRegion: (regionData: any) => 
    api.post('/regions', regionData),
  
  updateRegion: (id: string, regionData: any) => 
    api.put(`/regions/${id}`, regionData),
  
  deleteRegion: (id: string) => 
    api.delete(`/regions/${id}`)
};

// Reports API
export const reportsAPI = {
  getOrderReport: (params?: any) => 
    api.get('/reports/orders', { params }),
  
  getInventoryReport: (params?: any) => 
    api.get('/reports/inventory', { params }),
  
  getSalesReport: (params?: any) => 
    api.get('/reports/sales', { params }),
  
  getRetailerReport: (params?: any) => 
    api.get('/reports/retailers', { params }),
  
  exportReport: (reportType: string, format: string, params?: any) => 
    api.get(`/reports/export/${reportType}/${format}`, { 
      params,
      responseType: 'blob'
    })
};