import React from 'react';
import { Building2, Store, Users, Package, ShoppingCart, TrendingUp, UserCheck, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  change?: string;
  changeType?: 'positive' | 'negative';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, change, changeType }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
        {change && (
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            changeType === 'positive' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
          }`}>
            {change}
          </div>
        )}
      </div>
      <div className="bg-gradient-to-br from-[#003366] to-blue-600 p-3 rounded-xl shadow-lg">
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </div>
);

export const DashboardStats: React.FC = () => {
  const { user } = useAuth();

  const getStatsForRole = () => {
    switch (user?.role) {
      case 'super_admin':
        return [
          { title: 'Total Companies', value: 12, icon: Building2, change: '+2 this month', changeType: 'positive' as const },
          { title: 'Total Stores', value: 48, icon: Store, change: '+5 this month', changeType: 'positive' as const },
          { title: 'Active Users', value: 234, icon: Users, change: '+12 this week', changeType: 'positive' as const },
          { title: 'Total Parts', value: '12.5K', icon: Package, change: '+156 this week', changeType: 'positive' as const },
          { title: 'Orders Today', value: 89, icon: ShoppingCart, change: '+23% vs yesterday', changeType: 'positive' as const },
          { title: 'System Revenue', value: '$145.2K', icon: TrendingUp, change: '+18% this month', changeType: 'positive' as const },
        ];
      case 'admin':
        return [
          { title: 'Company Stores', value: 8, icon: Store, change: '+1 this month', changeType: 'positive' as const },
          { title: 'Company Users', value: 45, icon: Users, change: '+3 this week', changeType: 'positive' as const },
          { title: 'Total Parts', value: '3.2K', icon: Package, change: '+45 this week', changeType: 'positive' as const },
          { title: 'Orders Today', value: 23, icon: ShoppingCart, change: '+12% vs yesterday', changeType: 'positive' as const },
          { title: 'Active Retailers', value: 156, icon: UserCheck, change: '+8 this month', changeType: 'positive' as const },
          { title: 'Company Revenue', value: '$45.2K', icon: TrendingUp, change: '+15% this month', changeType: 'positive' as const },
        ];
      case 'manager':
        return [
          { title: 'Store Inventory', value: '1.8K', icon: Package, change: '+12 new parts', changeType: 'positive' as const },
          { title: 'Pending Orders', value: 15, icon: ShoppingCart, change: '-3 from yesterday', changeType: 'positive' as const },
          { title: 'Store Staff', value: 8, icon: Users, change: 'All active', changeType: 'positive' as const },
          { title: 'Store Retailers', value: 24, icon: UserCheck, change: '+2 this month', changeType: 'positive' as const },
          { title: 'Regions Managed', value: 3, icon: MapPin, change: 'Active coverage', changeType: 'positive' as const },
          { title: 'Low Stock Items', value: 5, icon: Package, change: 'Needs attention', changeType: 'negative' as const },
        ];
      case 'storeman':
        return [
          { title: 'Available Parts', value: '1.2K', icon: Package, change: '+25 restocked', changeType: 'positive' as const },
          { title: 'Orders Today', value: 8, icon: ShoppingCart, change: '+2 from yesterday', changeType: 'positive' as const },
          { title: 'Pending Tasks', value: 3, icon: Users, change: 'In progress', changeType: 'positive' as const },
          { title: 'Completed Orders', value: 12, icon: TrendingUp, change: '+4 today', changeType: 'positive' as const },
        ];
      case 'salesman':
        return [
          { title: 'My Retailers', value: 15, icon: UserCheck, change: '+1 new client', changeType: 'positive' as const },
          { title: 'Orders Created', value: 6, icon: ShoppingCart, change: '+2 today', changeType: 'positive' as const },
          { title: 'Available Parts', value: '1.2K', icon: Package, change: 'In stock', changeType: 'positive' as const },
          { title: 'Sales Target', value: '85%', icon: TrendingUp, change: '+5% this week', changeType: 'positive' as const },
        ];
      case 'retailer':
        return [
          { title: 'My Orders', value: 12, icon: ShoppingCart, change: '+2 this week', changeType: 'positive' as const },
          { title: 'Pending Orders', value: 3, icon: Package, change: 'Processing', changeType: 'positive' as const },
          { title: 'Credit Available', value: '$2.5K', icon: TrendingUp, change: 'Good standing', changeType: 'positive' as const },
          { title: 'Order History', value: 45, icon: Users, change: 'Total orders', changeType: 'positive' as const },
        ];
      default:
        return [
          { title: 'Available Parts', value: '1.2K', icon: Package },
          { title: 'Orders Today', value: 8, icon: ShoppingCart },
          { title: 'Pending Tasks', value: 3, icon: Users },
          { title: 'Completed', value: 12, icon: TrendingUp },
        ];
    }
  };

  const stats = getStatsForRole();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};