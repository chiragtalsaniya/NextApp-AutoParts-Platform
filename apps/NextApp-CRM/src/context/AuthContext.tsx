import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authAPI, companiesAPI, storesAPI, retailersAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  canAccessCompany: (companyId: string) => boolean;
  canAccessStore: (storeId: string) => boolean;
  canAccessRetailer: (retailerId: number) => boolean;
  getAccessibleCompanies: () => string[];
  getAccessibleStores: () => string[];
  getAccessibleRetailers: () => number[];
  getCurrentUserScope: () => string;
  canManageUsers: () => boolean;
  canViewReports: () => boolean;
  canManageInventory: () => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allCompanyIds, setAllCompanyIds] = useState<string[]>([]);
  const [allStoreIds, setAllStoreIds] = useState<string[]>([]);
  const [allRetailerIds, setAllRetailerIds] = useState<number[]>([]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already authenticated
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          // Get user profile data
          try {
            const response = await authAPI.getProfile();
            setUser(response.data);
          } catch (error) {
            console.error('Failed to get user profile:', error);
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (loading) return;
    // Fetch all companies if user is super_admin
    const fetchAllCompanies = async () => {
      console.log('AuthContext: fetchAllCompanies user', user);
      if (user?.role === 'super_admin') {
        try {
          const response = await companiesAPI.getCompanies();
          setAllCompanyIds(Array.isArray(response.data) ? response.data.map((c: any) => c.id) : []);
          console.log('AuthContext: setAllCompanyIds', Array.isArray(response.data) ? response.data.map((c: any) => c.id) : []);
        } catch (err) {
          setAllCompanyIds([]);
          console.error('AuthContext: fetchAllCompanies error', err);
        }
      } else if (user?.role === 'admin' && user.company_id) {
        setAllCompanyIds([user.company_id]);
      } else {
        setAllCompanyIds([]);
      }
    };
    fetchAllCompanies();
  }, [user, loading]);

  useEffect(() => {
    // Fetch all stores for super_admin or company stores for admin
    const fetchAllStores = async () => {
      if (user?.role === 'super_admin') {
        try {
          const response = await storesAPI.getStores();
          // response.data.stores is an array of stores
          setAllStoreIds(Array.isArray(response.data.stores) ? response.data.stores.map((s: any) => s.Branch_Code) : []);
        } catch (err) {
          setAllStoreIds([]);
        }
      } else if (user?.role === 'admin' && user.company_id) {
        try {
          const response = await storesAPI.getStores({ company_id: user.company_id });
          setAllStoreIds(Array.isArray(response.data.stores) ? response.data.stores.map((s: any) => s.Branch_Code) : []);
        } catch (err) {
          setAllStoreIds([]);
        }
      } else {
        setAllStoreIds([]);
      }
    };
    fetchAllStores();
  }, [user]);

  useEffect(() => {
    // Fetch all retailers for super_admin or company retailers for admin
    const fetchAllRetailers = async () => {
      if (user?.role === 'super_admin') {
        try {
          const response = await retailersAPI.getRetailers();
          setAllRetailerIds(Array.isArray(response.data.retailers) ? response.data.retailers.map((r: any) => r.Retailer_Id) : []);
        } catch (err) {
          setAllRetailerIds([]);
        }
      } else if (user?.role === 'admin' && user.company_id) {
        try {
          const response = await retailersAPI.getRetailers({ company_id: user.company_id });
          setAllRetailerIds(Array.isArray(response.data.retailers) ? response.data.retailers.map((r: any) => r.Retailer_Id) : []);
        } catch (err) {
          setAllRetailerIds([]);
        }
      } else {
        setAllRetailerIds([]);
      }
    };
    fetchAllRetailers();
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(email, password);
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      setUser(response.data.user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  // Enhanced access control functions with proper validation
  const canAccessCompany = (companyId: string): boolean => {
    if (!user || !companyId) return false;
    
    switch (user.role) {
      case 'super_admin':
        return true; // Can access all companies
      case 'admin':
      case 'manager':
      case 'storeman':
      case 'salesman':
        return user.company_id === companyId;
      case 'retailer':
        return false; // Retailers cannot access company data
      default:
        return false;
    }
  };

  const canAccessStore = (storeId: string): boolean => {
    if (!user || !storeId) return false;
    
    switch (user.role) {
      case 'super_admin':
        return true; // Can access all stores
      case 'admin':
        // Admin can access all stores in their company
        // This would need to be validated against the actual store-company mapping
        return true; // Simplified for now - should check via API
      case 'manager':
      case 'storeman':
      case 'salesman':
        return user.store_id === storeId;
      case 'retailer':
        return false; // Retailers cannot access store data
      default:
        return false;
    }
  };

  const canAccessRetailer = (retailerId: number): boolean => {
    if (!user || !retailerId) return false;
    
    switch (user.role) {
      case 'super_admin':
        return true; // Can access all retailers
      case 'admin':
      case 'manager':
        return true; // Can access retailers in their scope
      case 'storeman':
      case 'salesman':
        return true; // Can see retailers for order management
      case 'retailer':
        return user.retailer_id === retailerId; // Can only access their own data
      default:
        return false;
    }
  };

  const getAccessibleCompanies = (): string[] => {
    if (!user) return [];
    const result = (() => {
      switch (user.role) {
        case 'super_admin':
          return allCompanyIds;
        case 'admin':
        case 'manager':
        case 'storeman':
        case 'salesman':
          return user.company_id ? [user.company_id] : [];
        case 'retailer':
          return [];
        default:
          return [];
      }
    })();
    console.log('AuthContext: getAccessibleCompanies returns', result);
    return result;
  };

  const getAccessibleStores = (): string[] => {
    if (!user) return [];
    
    switch (user.role) {
      case 'super_admin':
        return allStoreIds;
      case 'admin':
        return allStoreIds.filter((s: any) => s.company_id === user.company_id || s.Company_Id === user.company_id || s.company_id?.toString() === user.company_id?.toString());
      case 'manager':
      case 'storeman':
      case 'salesman':
        return user.store_id ? [user.store_id] : [];
      case 'retailer':
        return []; // No store access
      default:
        return [];
    }
  };

  const getAccessibleRetailers = (): number[] => {
    if (!user) return [];
    switch (user.role) {
      case 'super_admin':
        return allRetailerIds;
      case 'admin':
        // Only retailers for admin's company
        return allRetailerIds.filter((r: any) => r.company_id === user.company_id || r.Company_Id === user.company_id || r.company_id?.toString() === user.company_id?.toString());
      case 'manager':
      case 'storeman':
      case 'salesman':
        // Only retailers for user's store
        return allRetailerIds.filter((r: any) => r.store_id === user.store_id || r.Store_Id === user.store_id || r.store_id?.toString() === user.store_id?.toString());
      case 'retailer':
        return user.retailer_id ? [user.retailer_id] : [];
      default:
        return [];
    }
  };

  const getCurrentUserScope = (): string => {
    if (!user) return 'No Access';
    
    switch (user.role) {
      case 'super_admin':
        return 'System-wide Access';
      case 'admin':
        return `Company: ${user.company_id}`;
      case 'manager':
        return `Store: ${user.store_id} (Company: ${user.company_id})`;
      case 'storeman':
        return `Store Operations: ${user.store_id}`;
      case 'salesman':
        return `Sales Territory: ${user.store_id}`;
      case 'retailer':
        return `Retailer Account: ${user.retailer_id}`;
      default:
        return 'Limited Access';
    }
  };

  const canManageUsers = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'admin', 'manager'].includes(user.role);
  };

  const canViewReports = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'admin', 'manager'].includes(user.role);
  };

  const canManageInventory = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'admin', 'manager', 'storeman'].includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      hasRole,
      canAccessCompany,
      canAccessStore,
      canAccessRetailer,
      getAccessibleCompanies,
      getAccessibleStores,
      getAccessibleRetailers,
      getCurrentUserScope,
      canManageUsers,
      canViewReports,
      canManageInventory,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};