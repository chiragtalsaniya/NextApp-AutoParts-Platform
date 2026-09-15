import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Building2,
  Store,
  Users,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Settings,
  UserCheck,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface NavItem {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: Home, label: 'Dashboard', roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'] },
  { to: '/companies', icon: Building2, label: 'Companies', roles: ['super_admin'] },
  { to: '/stores', icon: Store, label: 'Stores', roles: ['super_admin', 'admin'] },
  { to: '/users', icon: Users, label: 'Users', roles: ['super_admin', 'admin', 'manager'] },
  { to: '/retailers', icon: UserCheck, label: 'Retailers', roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman'] },
  { to: '/regions', icon: MapPin, label: 'Regions', roles: ['super_admin', 'admin', 'manager'] },
  { to: '/parts', icon: Package, label: 'Parts Inventory', roles: ['super_admin', 'admin', 'manager', 'storeman'] },
  { to: '/item-status', icon: Warehouse, label: 'Item Status', roles: ['super_admin', 'admin', 'manager', 'storeman'] },
  { to: '/orders', icon: ShoppingCart, label: 'Orders', roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'] },
  { to: '/transport', icon: Truck, label: 'Transport', roles: ['super_admin', 'admin', 'manager'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['super_admin', 'admin', 'manager'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'] },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user } = useAuth();
  const { theme } = useTheme();

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      {/* Redesigned Sidebar */}
      <div className={`
        fixed left-0 z-40
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${theme === 'dark' ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white border-r border-gray-800' : 'bg-gradient-to-b from-[#003366] to-blue-900 text-white'}
        transform transition-all duration-300 ease-in-out
        ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        flex flex-col shadow-xl
        top-16 bottom-0 overflow-hidden
      `}>
        {/* Navigation (scrollable middle) */}
        <nav className="flex-1 p-2 space-y-2 overflow-y-auto pt-8">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 group relative font-medium ${
                    isActive
                      ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/20'
                      : 'text-blue-100 hover:bg-white/5 hover:text-white hover:shadow-md'
                  }`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                  {item.label}
                </span>
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
        {/* Toggle Button (Desktop, fixed bottom) */}
        <div className="p-4 border-t border-blue-900 flex-shrink-0 bg-gradient-to-r from-blue-900/30 to-blue-800/30">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-white/10 transition-all duration-200 text-white font-medium"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <div className="flex items-center space-x-2">
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Collapse</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
};