import React, { useState } from 'react';
import { User, Shield, Bell, Database, Palette, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const settingsTabs: SettingsTab[] = [
  { id: 'profile', label: 'Profile', icon: User, roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'] },
  { id: 'security', label: 'Security', icon: Shield, roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'] },
  { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'] },
  { id: 'system', label: 'System', icon: Database, roles: ['super_admin', 'admin'] },
  { id: 'appearance', label: 'Appearance', icon: Palette, roles: ['super_admin', 'admin', 'manager', 'storeman'] },
  { id: 'regional', label: 'Regional', icon: Globe, roles: ['super_admin', 'admin', 'manager'] },
];

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const availableTabs = settingsTabs.filter(tab => 
    tab.roles.includes(user?.role || '')
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003366] to-blue-600 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-blue-100 dark:text-gray-300">Manage your account and system preferences</p>
      </div>

      {/* Settings Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <nav className="flex space-x-0 px-6 overflow-x-auto">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-3 py-4 px-6 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#003366] dark:border-blue-500 text-[#003366] dark:text-blue-400 bg-white dark:bg-gray-800'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-8">
          {React.cloneElement(children as React.ReactElement, { activeTab })}
        </div>
      </div>
    </div>
  );
};