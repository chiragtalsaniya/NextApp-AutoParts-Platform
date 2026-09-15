import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Shield, 
  Plus,
  Edit,
  Package,
  PauseCircle,
  XCircle,
  PlusCircle,
  Filter,
  Download,
  Upload,
  Calendar,
  User,
  MapPin,
  FileText,
  Zap
} from 'lucide-react';
import { OrderMaster, OrderItem, OrderStatus, NewOrderForm, getOrderStatusColor, timestampToDate, formatCurrency, dateToTimestamp } from '../../types';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { NewOrderFormModal } from './NewOrderForm';
import { ordersAPI } from '../../services/api';

export const OrderManagement: React.FC = () => {
  const { user, canAccessStore, getAccessibleStores, getAccessibleRetailers } = useAuth();
  const [orders, setOrders] = useState<OrderMaster[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderMaster | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load orders from API
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {};
        
        // Add role-based filtering
        if (user?.role === 'retailer') {
          params.retailer_id = user.retailer_id;
        } else if (user?.role !== 'super_admin') {
          if (user?.store_id) {
            params.branch = user.store_id;
          } else if (user?.company_id) {
            // Company-level filtering will be handled by backend
          }
        }

        const response = await ordersAPI.getOrders(params);
        setOrders(response.data.orders || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadOrders();
    }
  }, [user]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.Order_Id.toString().includes(searchTerm.toLowerCase()) ||
      (order.CRMOrderId && order.CRMOrderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.PO_Number && order.PO_Number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.Order_Status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || 
      (urgencyFilter === 'urgent' && order.Urgent_Status === true) ||
      (urgencyFilter === 'normal' && order.Urgent_Status === false);
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const getStatusIcon = (status?: OrderStatus) => {
    switch (status) {
      case 'New': return <PlusCircle className="w-4 h-4" />;
      case 'Processing': return <Clock className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Hold': return <PauseCircle className="w-4 h-4" />;
      case 'Picked': return <Package className="w-4 h-4" />;
      case 'Dispatched': return <Truck className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleViewOrder = async (order: OrderMaster) => {
    try {
      setLoading(true);
      const response = await ordersAPI.getOrder(order.Order_Id);
      const orderWithItems = response.data;
      
      setSelectedOrder(orderWithItems);
      setOrderItems(orderWithItems.items || []);
      setShowOrderDetails(true);
    } catch (err) {
      console.error('Failed to load order details:', err);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = async (orderData: NewOrderForm) => {
    try {
      setLoading(true);
      const response = await ordersAPI.createOrder(orderData);
      
      // Refresh orders list
      const ordersResponse = await ordersAPI.getOrders();
      setOrders(ordersResponse.data.orders || []);
      
      setShowNewOrderForm(false);
      alert('Order created successfully!');
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getOrderItems = (orderId: number) => {
    return orderItems.filter(item => item.Order_Id === orderId);
  };

  const calculateOrderTotal = (orderId: number) => {
    const items = getOrderItems(orderId);
    return items.reduce((total, item) => total + (item.ItemAmount || 0), 0);
  };

  const getPageTitle = () => {
    switch (user?.role) {
      case 'super_admin': return 'System Order Management';
      case 'admin': return 'Company Order Management';
      case 'manager': return 'Store Order Management';
      case 'storeman': return 'Store Order Processing';
      case 'salesman': return 'Sales Order Management';
      case 'retailer': return 'My Orders';
      default: return 'Order Management';
    }
  };

  const getPageDescription = () => {
    switch (user?.role) {
      case 'super_admin': return 'Monitor and manage orders across all companies and stores';
      case 'admin': return `Manage orders for all stores in Company ${user?.company_id}`;
      case 'manager': return `Oversee all orders for Store ${user?.store_id}`;
      case 'storeman': return `Process and fulfill orders for Store ${user?.store_id}`;
      case 'salesman': return `Track orders you've created for Store ${user?.store_id}`;
      case 'retailer': return `View and track your order history and current orders`;
      default: return 'Track and manage orders';
    }
  };

  const OrderDetailsModal = () => {
    if (!showOrderDetails || !selectedOrder) return null;

    const items = selectedOrder.items || [];
    const orderTotal = items.reduce((total, item) => total + (item.ItemAmount || 0), 0);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#003366] rounded-lg flex items-center justify-center">
                  {getStatusIcon(selectedOrder.Order_Status)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Order #{selectedOrder.Order_Id}</h2>
                  <p className="text-gray-600">{selectedOrder.CRMOrderId}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(selectedOrder.Order_Status)}`}>
                      {selectedOrder.Order_Status}
                    </span>
                    {selectedOrder.Urgent_Status && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Zap className="w-3 h-3 mr-1" />
                        Urgent
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">PO Number</p>
                    <p className="text-gray-900">{selectedOrder.PO_Number || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Branch</p>
                    <p className="text-gray-900">{selectedOrder.Branch_Name || selectedOrder.Branch || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Urgency</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedOrder.Urgent_Status ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedOrder.Urgent_Status ? (
                        <>
                          <Zap className="w-3 h-3 mr-1" />
                          Urgent
                        </>
                      ) : (
                        'Normal'
                      )}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Transport</p>
                    <p className="text-gray-900">{selectedOrder.TransportBy || 'Not assigned'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
                <div className="space-y-3">
                  {selectedOrder.Place_Date && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Placed</p>
                      <p className="text-gray-900">{format(timestampToDate(selectedOrder.Place_Date)!, 'MMM dd, yyyy HH:mm')}</p>
                      <p className="text-xs text-gray-500">by {selectedOrder.Place_By}</p>
                    </div>
                  )}
                  {selectedOrder.Confirm_Date && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Confirmed</p>
                      <p className="text-gray-900">{format(timestampToDate(selectedOrder.Confirm_Date)!, 'MMM dd, yyyy HH:mm')}</p>
                      <p className="text-xs text-gray-500">by {selectedOrder.Confirm_By}</p>
                    </div>
                  )}
                  {selectedOrder.Pick_Date && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Picked</p>
                      <p className="text-gray-900">{format(timestampToDate(selectedOrder.Pick_Date)!, 'MMM dd, yyyy HH:mm')}</p>
                      <p className="text-xs text-gray-500">by {selectedOrder.Pick_By}</p>
                    </div>
                  )}
                  {selectedOrder.Delivered_Date && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Delivered</p>
                      <p className="text-gray-900">{format(timestampToDate(selectedOrder.Delivered_Date)!, 'MMM dd, yyyy HH:mm')}</p>
                      <p className="text-xs text-gray-500">by {selectedOrder.Delivered_By}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                    <p className="text-gray-900">{items.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-[#003366]">{formatCurrency(orderTotal)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Retailer</p>
                    <p className="text-gray-900">{selectedOrder.Retailer_Name || `ID: ${selectedOrder.Retailer_Id}` || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Dispatch ID</p>
                    <p className="text-gray-900">{selectedOrder.DispatchId || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {selectedOrder.Remark && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Remarks</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedOrder.Remark}</p>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discounts</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.Order_Item_Id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.Part_Salesman}</p>
                            <p className="text-xs text-gray-500">{item.Part_Admin}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900">Ordered: {item.Order_Qty}</p>
                            <p className="text-xs text-gray-500">Dispatched: {item.Dispatch_Qty || 0}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatCurrency(item.MRP)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs space-y-1">
                            <p>Basic: {item.Discount || 0}%</p>
                            <p>Scheme: {item.SchemeDisc || 0}%</p>
                            <p>Additional: {item.AdditionalDisc || 0}%</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {formatCurrency(item.ItemAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.OrderItemStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                            item.OrderItemStatus === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                            item.OrderItemStatus === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.OrderItemStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.Urgent_Status ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Zap className="w-3 h-3 mr-1" />
                              Urgent
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Location Information */}
            {(selectedOrder.Latitude && selectedOrder.Longitude) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delivery Location</h3>
                <div className="bg-gray-50 p-4 rounded-lg flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900">
                      Coordinates: {selectedOrder.Latitude}, {selectedOrder.Longitude}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={() => setShowOrderDetails(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {user?.role !== 'retailer' && (
              <button className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Edit Order</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600">{getPageDescription()}</p>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredOrders.length} orders accessible to your role
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Import</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
          {user?.role !== 'retailer' && (
            <button 
              onClick={() => setShowNewOrderForm(true)}
              className="bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-5 h-5 text-[#003366]" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="all">All Status</option>
            <option value="New">New</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
            <option value="Hold">Hold</option>
            <option value="Picked">Picked</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="all">All Urgency</option>
            <option value="urgent">Urgent Only</option>
            <option value="normal">Normal Only</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <span className="font-medium">{filteredOrders.length}</span> orders found
          </div>
        </div>
      </div>

      {/* Loader for each API call */}
      {loading && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-12 text-center">
          <div className="w-12 h-12 border-4 border-t-[#003366] border-gray-200 dark:border-gray-700 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading orders...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center flex flex-col items-center justify-center">
            <img
              src="/error-state.svg"
              alt="Error illustration"
              className="w-32 h-32 mx-auto mb-4 opacity-90"
              loading="lazy"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.10))' }}
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                  {user?.role !== 'retailer' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retailer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.Order_Id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">#{order.Order_Id}</div>
                        <div className="text-sm text-gray-500">{order.CRMOrderId}</div>
                        {order.PO_Number && (
                          <div className="text-xs text-gray-400">PO: {order.PO_Number}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.Order_Status)}`}>
                        {getStatusIcon(order.Order_Status)}
                        <span className="ml-1">{order.Order_Status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.Urgent_Status ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Zap className="w-3 h-3 mr-1" />
                          Urgent
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Normal
                        </span>
                      )}
                    </td>
                    {user?.role !== 'retailer' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.Branch_Name || order.Branch || 'Not assigned'}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.Retailer_Name || `ID: ${order.Retailer_Id}` || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.Place_Date ? format(timestampToDate(order.Place_Date)!, 'MMM dd, yyyy') : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleViewOrder(order)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && !loading && (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <img
                src="/empty-state.svg"
                alt="No orders illustration"
                className="w-40 h-40 mx-auto mb-4 opacity-80"
                loading="lazy"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }}
              />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No orders found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search criteria or filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal />

      {/* New Order Form Modal */}
      <NewOrderFormModal 
        isOpen={showNewOrderForm}
        onClose={() => setShowNewOrderForm(false)}
        onSubmit={handleNewOrder}
      />
    </div>
  );
};