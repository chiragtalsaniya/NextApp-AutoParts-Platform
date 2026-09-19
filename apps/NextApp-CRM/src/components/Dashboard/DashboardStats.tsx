import React, { useState, useEffect } from 'react';
import { Building2, Store, Users, Package, ShoppingCart, TrendingUp, UserCheck, AlertTriangle, PackageCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, loading }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {loading ? <span className="inline-block w-8 h-8 border-2 border-gray-300 border-t-[#003366] rounded-full animate-spin" /> : value}
        </p>
      </div>
      <div className="bg-gradient-to-br from-[#003366] to-blue-600 p-3 rounded-xl shadow-lg">
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </div>
);

const formatNumber = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const formatCurrency = (amount: number): string => {
  if (amount >= 100000) return `${(amount / 1000).toFixed(1)}K`;
  return `${amount.toFixed(0)}`;
};

export const DashboardStats: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getStats();
        setStats(response.data || {});
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user?.role, refreshKey]);

  const getStatsForRole = (): { title: string; value: string | number; icon: React.ComponentType<any> }[] => {
    if (error) return [];

    switch (user?.role) {
      case 'super_admin':
        return [
          { title: 'Total Companies', value: formatNumber(stats.companies || 0), icon: Building2 },
          { title: 'Total Stores', value: formatNumber(stats.stores || 0), icon: Store },
          { title: 'Active Users', value: formatNumber(stats.activeUsers || 0), icon: Users },
          { title: 'Total Parts', value: formatNumber(stats.totalParts || 0), icon: Package },
          { title: 'Orders Today', value: stats.ordersToday || 0, icon: ShoppingCart },
          { title: 'System Revenue', value: formatCurrency(stats.totalRevenue || 0), icon: TrendingUp },
        ];
      case 'admin':
        return [
          { title: 'Company Stores', value: stats.stores || 0, icon: Store },
          { title: 'Company Users', value: stats.companyUsers || 0, icon: Users },
          { title: 'Total Parts', value: formatNumber(stats.totalParts || 0), icon: Package },
          { title: 'Orders Today', value: stats.ordersToday || 0, icon: ShoppingCart },
          { title: 'Active Retailers', value: stats.activeRetailers || 0, icon: UserCheck },
          { title: 'Company Revenue', value: formatCurrency(stats.totalRevenue || 0), icon: TrendingUp },
        ];
      case 'manager':
        return [
          { title: 'Store Inventory', value: formatNumber(stats.storeInventory || 0), icon: Package },
          { title: 'Pending Orders', value: stats.pendingOrders || 0, icon: ShoppingCart },
          { title: 'Store Staff', value: stats.storeStaff || 0, icon: Users },
          { title: 'Store Retailers', value: stats.storeRetailers || 0, icon: UserCheck },
          { title: 'Orders Today', value: stats.ordersToday || 0, icon: TrendingUp },
          { title: 'Low Stock Items', value: stats.lowStockItems || 0, icon: AlertTriangle },
        ];
      case 'storeman':
        return [
          { title: 'Available Parts', value: formatNumber(stats.availableParts || 0), icon: Package },
          { title: 'Orders Today', value: stats.ordersToday || 0, icon: ShoppingCart },
          { title: 'Pending Tasks', value: stats.pendingTasks || 0, icon: Users },
          { title: 'Completed Orders', value: stats.completedOrders || 0, icon: PackageCheck },
        ];
      case 'salesman':
        return [
          { title: 'My Retailers', value: stats.myRetailers || 0, icon: UserCheck },
          { title: 'Orders Created', value: stats.ordersCreated || 0, icon: ShoppingCart },
          { title: 'Available Parts', value: formatNumber(stats.availableParts || 0), icon: Package },
          { title: 'Orders Today', value: stats.ordersToday || 0, icon: TrendingUp },
        ];
      case 'retailer':
        return [
          { title: 'My Orders', value: stats.myOrders || 0, icon: ShoppingCart },
          { title: 'Pending Orders', value: stats.pendingOrders || 0, icon: Package },
          { title: 'Credit Available', value: formatCurrency(stats.creditAvailable || 0), icon: TrendingUp },
          { title: 'Completed Orders', value: stats.completedOrders || 0, icon: PackageCheck },
        ];
      default:
        return [];
    }
  };

  const statCards = getStatsForRole();

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Unable to load dashboard statistics.</p>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="text-[#003366] hover:text-blue-800 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <StatCard key={index} {...stat} loading={loading} />
      ))}
    </div>
  );
};
