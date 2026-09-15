import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme } = useTheme();

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Fixed Top Bar */}
      <Header onMenuClick={handleSidebarToggle} />
      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden pt-24"> {/* Add padding-top for fixed header */}
        {/* Fixed Sidebar */}
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
        {/* Scrollable Main Section */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};