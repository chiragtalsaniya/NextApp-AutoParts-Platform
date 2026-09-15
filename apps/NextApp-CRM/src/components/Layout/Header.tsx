import React, { useState, useEffect } from 'react';
import { User, LogOut, Settings, Menu, ChevronDown, Building2, Store, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout, getCurrentUserScope, getAccessibleCompanies, getAccessibleStores } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);
  const [accessibleCompanies, setAccessibleCompanies] = useState<string[]>([]);
  const [accessibleStores, setAccessibleStores] = useState<string[]>([]);

  useEffect(() => {
    setAccessibleCompanies(getAccessibleCompanies());
    setAccessibleStores(getAccessibleStores());
  }, [getAccessibleCompanies, getAccessibleStores]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-gradient-to-r from-[#003366] to-blue-800 dark:from-gray-900 dark:to-gray-800 shadow-xl border-b border-blue-900 dark:border-gray-800 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-blue-900/20 transition-all duration-200 lg:hidden"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/95 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-[#003366] font-black text-2xl tracking-tight">N</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">NextApp Inc.</h1>
              <div className="relative">
                <button
                  onClick={() => setShowScopeDropdown(!showScopeDropdown)}
                  className="flex items-center space-x-1 text-xs text-blue-100 hover:text-white transition-colors bg-blue-900/20 px-2 py-1 rounded-lg"
                >
                  <span>{getCurrentUserScope()}</span>
                  {(user?.role === 'super_admin' || user?.role === 'admin') && (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
                {showScopeDropdown && (user?.role === 'super_admin' || user?.role === 'admin') && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Access Scope</p>
                      {user?.role === 'super_admin' && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <Building2 className="w-3 h-3" />
                            <span>Companies: {accessibleCompanies.length}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <Store className="w-3 h-3" />
                            <span>Stores: {accessibleStores.length}</span>
                          </div>
                        </div>
                      )}
                      {user?.role === 'admin' && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <Building2 className="w-3 h-3" />
                            <span>Company: {user.company_id}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <Store className="w-3 h-3" />
                            <span>Stores: {accessibleStores.length}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <div className="hidden md:flex items-center gap-1 bg-blue-900/20 rounded-xl p-1">
            <button
              onClick={() => setTheme('light')}
              className={`p-2 rounded-lg transition-all duration-200 ${theme === 'light' ? 'bg-white text-blue-900 shadow-md' : 'text-blue-100 hover:text-yellow-300'}`}
              aria-label="Light mode"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-lg transition-all duration-200 ${theme === 'dark' ? 'bg-white text-blue-900 shadow-md' : 'text-blue-100 hover:text-blue-300'}`}
              aria-label="Dark mode"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('auto')}
              className={`p-2 rounded-lg transition-all duration-200 ${theme === 'auto' ? 'bg-white text-blue-900 shadow-md' : 'text-blue-100 hover:text-white'}`}
              aria-label="System mode"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
          {/* User Info */}
          <div className="flex items-center gap-3 bg-blue-900/20 rounded-xl p-2">
            <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-lg">
              {user?.profile_image ? (
                <img 
                  src={user.profile_image} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="hidden lg:block text-right">
              <p className="text-sm font-bold text-white leading-tight">{user?.name}</p>
              <p className="text-xs text-blue-100 capitalize font-medium">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          {/* Settings & Logout */}
          <div className="flex items-center gap-1">
            <button className="p-2 text-blue-100 hover:text-white transition-all duration-200 rounded-xl hover:bg-blue-900/30" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={logout}
              className="p-2 text-blue-100 hover:text-red-400 transition-all duration-200 rounded-xl hover:bg-blue-900/30"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};