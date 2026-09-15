import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar, 
  Filter,
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Order, OrderStatus } from '../../types';
import { exportToExcel, exportToPDF, exportToWord } from '../../utils/exportUtils';

const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    retailer_id: '1',
    salesman_id: '1',
    store_id: '1',
    status: 'delivered',
    total_price: 156.97,
    created_at: '2024-01-15T10:30:00Z',
    items: [
      { id: '1', order_id: 'ORD-2024-001', part_id: '1', quantity: 4, price_per_unit: 12.99, part_name: 'NGK Spark Plug' },
      { id: '2', order_id: 'ORD-2024-001', part_id: '2', quantity: 2, price_per_unit: 45.99, part_name: 'Brake Pads - Front' }
    ]
  },
  {
    id: 'ORD-2024-002',
    retailer_id: '2',
    salesman_id: '1',
    store_id: '1',
    status: 'shipped',
    total_price: 89.97,
    created_at: '2024-01-14T14:15:00Z',
    items: [
      { id: '3', order_id: 'ORD-2024-002', part_id: '3', quantity: 10, price_per_unit: 8.99, part_name: 'Oil Filter' }
    ]
  },
  {
    id: 'ORD-2024-003',
    retailer_id: '3',
    salesman_id: '2',
    store_id: '1',
    status: 'processing',
    total_price: 234.50,
    created_at: '2024-01-13T09:20:00Z',
    items: [
      { id: '4', order_id: 'ORD-2024-003', part_id: '1', quantity: 8, price_per_unit: 12.99, part_name: 'NGK Spark Plug' },
      { id: '5', order_id: 'ORD-2024-003', part_id: '4', quantity: 6, price_per_unit: 15.99, part_name: 'Air Filter' }
    ]
  },
  {
    id: 'ORD-2024-004',
    retailer_id: '1',
    salesman_id: '1',
    store_id: '1',
    status: 'pending',
    total_price: 67.45,
    created_at: '2024-01-12T16:45:00Z',
    items: [
      { id: '6', order_id: 'ORD-2024-004', part_id: '2', quantity: 1, price_per_unit: 45.99, part_name: 'Brake Pads - Front' },
      { id: '7', order_id: 'ORD-2024-004', part_id: '3', quantity: 2, price_per_unit: 8.99, part_name: 'Oil Filter' }
    ]
  },
  {
    id: 'ORD-2024-005',
    retailer_id: '4',
    salesman_id: '2',
    store_id: '1',
    status: 'delivered',
    total_price: 445.20,
    created_at: '2024-01-11T11:30:00Z',
    items: [
      { id: '8', order_id: 'ORD-2024-005', part_id: '1', quantity: 12, price_per_unit: 12.99, part_name: 'NGK Spark Plug' },
      { id: '9', order_id: 'ORD-2024-005', part_id: '4', quantity: 18, price_per_unit: 15.99, part_name: 'Air Filter' }
    ]
  }
];

interface ReportFilters {
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate: string;
  endDate: string;
  status: OrderStatus | 'all';
  storeId: string;
  salesmanId: string;
  retailerId: string;
}

export const OrderReports: React.FC = () => {
  const [orders] = useState<Order[]>(mockOrders);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'month',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    status: 'all',
    storeId: 'all',
    salesmanId: 'all',
    retailerId: 'all'
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Auto-set date ranges for predefined periods
      if (key === 'dateRange') {
        const today = new Date();
        switch (value) {
          case 'today':
            newFilters.startDate = format(today, 'yyyy-MM-dd');
            newFilters.endDate = format(today, 'yyyy-MM-dd');
            break;
          case 'week':
            newFilters.startDate = format(subDays(today, 7), 'yyyy-MM-dd');
            newFilters.endDate = format(today, 'yyyy-MM-dd');
            break;
          case 'month':
            newFilters.startDate = format(startOfMonth(today), 'yyyy-MM-dd');
            newFilters.endDate = format(endOfMonth(today), 'yyyy-MM-dd');
            break;
          case 'quarter':
            const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
            newFilters.startDate = format(quarterStart, 'yyyy-MM-dd');
            newFilters.endDate = format(today, 'yyyy-MM-dd');
            break;
          case 'year':
            newFilters.startDate = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd');
            newFilters.endDate = format(today, 'yyyy-MM-dd');
            break;
        }
      }
      
      return newFilters;
    });
  };

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    
    const matchesDate = orderDate >= startDate && orderDate <= endDate;
    const matchesStatus = filters.status === 'all' || order.status === filters.status;
    
    return matchesDate && matchesStatus;
  });

  const getOrderStats = () => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_price, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const statusCounts = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      statusCounts
    };
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'word') => {
    setIsExporting(true);
    try {
      const reportData = {
        orders: filteredOrders,
        filters,
        stats: getOrderStats(),
        generatedAt: new Date().toISOString()
      };

      switch (format) {
        case 'excel':
          await exportToExcel(reportData, 'order-report');
          break;
        case 'pdf':
          await exportToPDF(reportData, 'order-report');
          break;
        case 'word':
          await exportToWord(reportData, 'order-report');
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const stats = getOrderStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Reports</h1>
          <p className="text-gray-600">Generate and export comprehensive order reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Filter className="w-6 h-6 text-[#003366]" />
          <h3 className="text-lg font-semibold text-gray-900">Report Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {filters.dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="picked">Picked</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${stats.avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.statusCounts.delivered || 0}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-[#003366]" />
            <h3 className="text-lg font-semibold text-gray-900">Export Report</h3>
          </div>
          <div className="text-sm text-gray-500">
            {filteredOrders.length} orders found
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className="flex items-center justify-center space-x-3 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Export to Excel</p>
              <p className="text-sm opacity-90">Detailed spreadsheet with charts</p>
            </div>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex items-center justify-center space-x-3 bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Export to PDF</p>
              <p className="text-sm opacity-90">Professional report format</p>
            </div>
          </button>

          <button
            onClick={() => handleExport('word')}
            disabled={isExporting}
            className="flex items-center justify-center space-x-3 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Export to Word</p>
              <p className="text-sm opacity-90">Editable document format</p>
            </div>
          </button>
        </div>

        {isExporting && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-gray-600">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#003366] rounded-full animate-spin"></div>
            <span>Generating report...</span>
          </div>
        )}
      </div>

      {/* Order Summary Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-[#003366]" />
            <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.slice(0, 10).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(order.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.items.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${order.total_price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 10 && (
          <div className="px-6 py-3 bg-gray-50 text-center text-sm text-gray-500">
            Showing 10 of {filteredOrders.length} orders. Export for complete data.
          </div>
        )}
      </div>
    </div>
  );
};