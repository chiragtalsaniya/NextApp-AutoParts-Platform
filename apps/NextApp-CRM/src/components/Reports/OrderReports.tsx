import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Filter,
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { OrderStatus } from '../../types';
import { exportToExcel, exportToPDF, exportToWord } from '../../utils/exportUtils';
import { reportsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ReportFilters {
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate: string;
  endDate: string;
  status: OrderStatus | 'all';
}

interface OrderReportRow {
  Order_Id: number;
  CRMOrderId?: string;
  Place_Date: number;
  Order_Status: OrderStatus;
  Retailer_Name?: string;
  Branch_Name?: string;
  ItemAmount?: number;
}

interface ReportResponse {
  orders: OrderReportRow[];
  stats: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    statusCounts: Record<string, number>;
  };
}

const formatDate = (value: number | string | undefined): Date | null => {
  if (value === undefined || value === null) return null;
  const d = new Date(typeof value === 'number' ? value : isNaN(Number(value)) ? value : Number(value));
  return isNaN(d.getTime()) ? null : d;
};

export const OrderReports: React.FC = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'month',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    status: 'all'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await reportsAPI.getOrderReport({
          start_date: filters.startDate,
          end_date: filters.endDate,
          status: filters.status === 'all' ? undefined : filters.status,
        });
        setReport(res.data || null);
      } catch (err) {
        setError('Failed to load report data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, [filters.startDate, filters.endDate, filters.status, refreshKey, user?.role]);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setDateError(null);
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

  const handleDateChange = (key: 'startDate' | 'endDate', value: string) => {
    setDateError(null);
    const other = key === 'startDate' ? filters.endDate : filters.startDate;
    if (other && value && new Date(value) > new Date(other)) {
      setDateError('Start date must be before end date.');
      return;
    }
    handleFilterChange(key, value);
  };

  const orders = report?.orders || [];
  const stats = report?.stats || {
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    statusCounts: {}
  };

  const handleExport = async (exportFormat: 'excel' | 'pdf' | 'word') => {
    setIsExporting(true);
    try {
      const reportData = {
        orders,
        filters,
        stats,
        generatedAt: new Date().toISOString()
      };

      switch (exportFormat) {
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
    } catch (err) {
      setError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Dispatched': return 'bg-blue-100 text-blue-800';
      case 'Picked': return 'bg-cyan-100 text-cyan-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      case 'Hold': return 'bg-orange-100 text-orange-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
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
              <option value="New">New</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Hold">Hold</option>
              <option value="Picked">Picked</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {dateError && (
          <p className="mt-3 text-sm text-red-600">{dateError}</p>
        )}
      </div>

      {error ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="bg-[#003366] text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-[#003366] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading report data...</p>
        </div>
      ) : (
        <>
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">${Number(stats.totalRevenue).toFixed(2)}</p>
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">${Number(stats.avgOrderValue).toFixed(2)}</p>
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.statusCounts?.Completed || 0}</p>
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
                Page 1 ({orders.length} orders shown)
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retailer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                        No orders found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const d = formatDate(order.Place_Date);
                      return (
                        <tr key={order.Order_Id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.CRMOrderId || order.Order_Id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {order.Retailer_Name || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {d ? format(d, 'MMM dd, yyyy') : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(order.Order_Status)}`}>
                              {order.Order_Status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${Number(order.ItemAmount || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
