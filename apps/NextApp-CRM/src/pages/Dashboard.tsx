import React from 'react';
import { DashboardStats } from '../components/Dashboard/DashboardStats';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const getRoleSpecificWelcome = () => {
    switch (user?.role) {
      case 'super_admin':
        return {
          title: 'System Administration Dashboard',
          description: 'Monitor and manage the entire NextApp ecosystem across all companies and stores.'
        };
      case 'admin':
        return {
          title: 'Company Administration Dashboard',
          description: `Manage your company operations, stores, and team members for Company ${user.company_id}.`
        };
      case 'manager':
        return {
          title: 'Store Management Dashboard',
          description: `Oversee store operations, inventory, orders, and team for Store ${user.store_id}.`
        };
      case 'storeman':
        return {
          title: 'Store Operations Dashboard',
          description: `Manage inventory and process orders for Store ${user.store_id}.`
        };
      case 'salesman':
        return {
          title: 'Sales Dashboard',
          description: `Track your sales activities and manage retailer relationships for Store ${user.store_id}.`
        };
      case 'retailer':
        return {
          title: 'Retailer Portal',
          description: `Access your orders, account information, and available products as Retailer ${user.retailer_id}.`
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Welcome to your portal.'
        };
    }
  };

  const getRoleSpecificActivities = () => {
    switch (user?.role) {
      case 'super_admin':
        return [
          { type: 'success', message: 'New company "Tech Auto Parts" added', time: '2 hours ago' },
          { type: 'info', message: 'System backup completed successfully', time: '4 hours ago' },
          { type: 'warning', message: 'Server maintenance scheduled for tonight', time: '6 hours ago' },
        ];
      case 'admin':
        return [
          { type: 'success', message: 'New store "Downtown Branch" added', time: '1 hour ago' },
          { type: 'info', message: 'Monthly report generated', time: '3 hours ago' },
          { type: 'warning', message: 'User permissions updated for 3 staff members', time: '5 hours ago' },
        ];
      case 'manager':
        return [
          { type: 'success', message: 'Order #ORD-2024-156 completed', time: '30 minutes ago' },
          { type: 'info', message: 'New retailer "Quick Fix Auto" registered', time: '2 hours ago' },
          { type: 'warning', message: 'Low stock alert: Brake Pads', time: '4 hours ago' },
        ];
      case 'storeman':
        return [
          { type: 'success', message: 'Inventory updated: 50 new spark plugs', time: '1 hour ago' },
          { type: 'info', message: 'Order #ORD-2024-157 picked and ready', time: '2 hours ago' },
          { type: 'warning', message: 'Restock needed: Oil filters', time: '3 hours ago' },
        ];
      case 'salesman':
        return [
          { type: 'success', message: 'New order created for Downtown Auto', time: '45 minutes ago' },
          { type: 'info', message: 'Retailer meeting scheduled for tomorrow', time: '2 hours ago' },
          { type: 'warning', message: 'Follow up needed with 2 retailers', time: '4 hours ago' },
        ];
      case 'retailer':
        return [
          { type: 'success', message: 'Order #ORD-2024-158 shipped', time: '1 hour ago' },
          { type: 'info', message: 'New parts catalog available', time: '3 hours ago' },
          { type: 'warning', message: 'Payment due in 5 days', time: '1 day ago' },
        ];
      default:
        return [];
    }
  };

  const getRoleSpecificQuickActions = () => {
    switch (user?.role) {
      case 'super_admin':
        return [
          { title: 'Add Company', description: 'Register new company', color: 'blue' },
          { title: 'System Reports', description: 'View analytics', color: 'green' },
          { title: 'User Management', description: 'Manage all users', color: 'purple' },
          { title: 'System Settings', description: 'Configure system', color: 'orange' },
        ];
      case 'admin':
        return [
          { title: 'Add Store', description: 'Create new branch', color: 'blue' },
          { title: 'Company Reports', description: 'View performance', color: 'green' },
          { title: 'Manage Users', description: 'Company staff', color: 'purple' },
          { title: 'Store Settings', description: 'Configure stores', color: 'orange' },
        ];
      case 'manager':
        return [
          { title: 'Add Retailer', description: 'Register new client', color: 'blue' },
          { title: 'Create Order', description: 'Process new request', color: 'green' },
          { title: 'View Reports', description: 'Store analytics', color: 'purple' },
          { title: 'Manage Staff', description: 'Store team', color: 'orange' },
        ];
      case 'storeman':
        return [
          { title: 'Update Inventory', description: 'Stock management', color: 'blue' },
          { title: 'Process Orders', description: 'Pick and pack', color: 'green' },
          { title: 'View Stock', description: 'Check availability', color: 'purple' },
          { title: 'Order Reports', description: 'Daily summary', color: 'orange' },
        ];
      case 'salesman':
        return [
          { title: 'Create Order', description: 'For retailer', color: 'blue' },
          { title: 'View Retailers', description: 'My clients', color: 'green' },
          { title: 'Check Inventory', description: 'Available parts', color: 'purple' },
          { title: 'Sales Report', description: 'My performance', color: 'orange' },
        ];
      case 'retailer':
        return [
          { title: 'Place Order', description: 'Order new parts', color: 'blue' },
          { title: 'Order History', description: 'View past orders', color: 'green' },
          { title: 'Account Info', description: 'Update details', color: 'purple' },
          { title: 'Catalog', description: 'Browse parts', color: 'orange' },
        ];
      default:
        return [];
    }
  };

  const welcome = getRoleSpecificWelcome();
  const activities = getRoleSpecificActivities();
  const quickActions = getRoleSpecificQuickActions();

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 hover:bg-blue-100 text-blue-900';
      case 'green': return 'bg-green-50 hover:bg-green-100 text-green-900';
      case 'purple': return 'bg-purple-50 hover:bg-purple-100 text-purple-900';
      case 'orange': return 'bg-orange-50 hover:bg-orange-100 text-orange-900';
      default: return 'bg-gray-50 hover:bg-gray-100 text-gray-900';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#003366] to-blue-600 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">{welcome.title}</h1>
        <p className="text-blue-100 dark:text-gray-300 text-lg">
          Welcome back, <span className="font-semibold">{user?.name}</span>! {welcome.description}
        </p>
      </div>

      {/* Stats Grid */}
      <DashboardStats />

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activity - Takes 2 columns */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className={`w-3 h-3 ${getActivityColor(activity.type)} rounded-full flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className={`w-full p-4 text-left rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${getActionColor(action.color)} dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 shadow-sm hover:shadow-md`}
                tabIndex={0}
                aria-label={action.title}
              >
                <p className="font-semibold dark:text-gray-100 mb-1">{action.title}</p>
                <p className="text-sm opacity-75 dark:text-gray-300">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};