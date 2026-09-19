import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardStats } from '../components/Dashboard/DashboardStats';
import { useAuth } from '../context/AuthContext';

interface QuickAction {
  title: string;
  description: string;
  color: string;
  path: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
          description: 'Manage your company operations, stores, and team members.'
        };
      case 'manager':
        return {
          title: 'Store Management Dashboard',
          description: 'Oversee store operations, inventory, orders, and team.'
        };
      case 'storeman':
        return {
          title: 'Store Operations Dashboard',
          description: 'Manage inventory and process orders.'
        };
      case 'salesman':
        return {
          title: 'Sales Dashboard',
          description: 'Track your sales activities and manage retailer relationships.'
        };
      case 'retailer':
        return {
          title: 'Retailer Portal',
          description: 'Access your orders, account information, and available products.'
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Welcome to your portal.'
        };
    }
  };

  const getRoleSpecificQuickActions = (): QuickAction[] => {
    switch (user?.role) {
      case 'super_admin':
        return [
          { title: 'Add Company', description: 'Register new company', color: 'blue', path: '/companies' },
          { title: 'System Reports', description: 'View analytics', color: 'green', path: '/reports' },
          { title: 'User Management', description: 'Manage all users', color: 'purple', path: '/users' },
          { title: 'System Settings', description: 'Configure system', color: 'orange', path: '/settings' },
        ];
      case 'admin':
        return [
          { title: 'Add Store', description: 'Create new branch', color: 'blue', path: '/stores' },
          { title: 'Company Reports', description: 'View performance', color: 'green', path: '/reports' },
          { title: 'Manage Users', description: 'Company staff', color: 'purple', path: '/users' },
          { title: 'Store Settings', description: 'Configure stores', color: 'orange', path: '/stores' },
        ];
      case 'manager':
        return [
          { title: 'Add Retailer', description: 'Register new client', color: 'blue', path: '/retailers' },
          { title: 'Create Order', description: 'Process new request', color: 'green', path: '/orders' },
          { title: 'View Reports', description: 'Store analytics', color: 'purple', path: '/reports' },
          { title: 'Manage Staff', description: 'Store team', color: 'orange', path: '/users' },
        ];
      case 'storeman':
        return [
          { title: 'Update Inventory', description: 'Stock management', color: 'blue', path: '/item-status' },
          { title: 'Process Orders', description: 'Pick and pack', color: 'green', path: '/orders' },
          { title: 'View Stock', description: 'Check availability', color: 'purple', path: '/item-status' },
          { title: 'Order Reports', description: 'Daily summary', color: 'orange', path: '/reports' },
        ];
      case 'salesman':
        return [
          { title: 'Create Order', description: 'For retailer', color: 'blue', path: '/orders' },
          { title: 'View Retailers', description: 'My clients', color: 'green', path: '/retailers' },
          { title: 'Check Inventory', description: 'Available parts', color: 'purple', path: '/parts' },
          { title: 'Sales Report', description: 'My performance', color: 'orange', path: '/reports' },
        ];
      case 'retailer':
        return [
          { title: 'Place Order', description: 'Order new parts', color: 'blue', path: '/orders' },
          { title: 'Order History', description: 'View past orders', color: 'green', path: '/orders' },
          { title: 'Account Info', description: 'Update details', color: 'purple', path: '/settings' },
          { title: 'Catalog', description: 'Browse parts', color: 'orange', path: '/parts' },
        ];
      default:
        return [];
    }
  };

  const welcome = getRoleSpecificWelcome();
  const quickActions = getRoleSpecificQuickActions();

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

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
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
  );
};
