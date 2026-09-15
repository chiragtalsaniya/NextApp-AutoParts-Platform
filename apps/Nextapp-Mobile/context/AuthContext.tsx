import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { User, LoginRequest } from '@/types/api';
import { apiService } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Platform-specific storage helpers
const getSecureItem = async (key: string): Promise<string | null> => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

const setSecureItem = async (key: string, value: string): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const deleteSecureItem = async (key: string): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

// Helper function to normalize user data from API response
const normalizeUserData = (userData: any): User => {
  return {
    id: userData.id || userData.user_id,
    email: userData.email,
    name: userData.name || userData.full_name || userData.username,
    role: userData.role || userData.user_role,
    // Handle both string and numeric company_id
    companyId: userData.company_id ? (typeof userData.company_id === 'string' ? userData.company_id : userData.company_id.toString()) : undefined,
    // Handle both string and numeric store_id  
    storeId: userData.store_id ? (typeof userData.store_id === 'string' ? userData.store_id : userData.store_id.toString()) : undefined,
    isActive: userData.is_active !== undefined ? userData.is_active : true,
    profilePicture: userData.profile_picture || userData.avatar,
    phone: userData.phone || userData.mobile,
    createdAt: userData.created_at || userData.createdAt || new Date().toISOString(),
    updatedAt: userData.updated_at || userData.updatedAt || new Date().toISOString(),
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = await getSecureItem('authToken');
      const userString = await getSecureItem('user');
      
      if (token && userString) {
        const user = JSON.parse(userString);
        // Verify token is still valid by fetching profile
        try {
          const profileData = await apiService.getProfile();
          const normalizedUser = normalizeUserData(profileData);
          dispatch({ type: 'AUTH_SUCCESS', payload: normalizedUser });
        } catch (error) {
          // Token is invalid, remove stored data
          await deleteSecureItem('authToken');
          await deleteSecureItem('user');
          dispatch({ type: 'AUTH_LOGOUT' });
          router.replace('/(auth)/login');
        }
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
        router.replace('/(auth)/login');
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Failed to check authentication status' });
      router.replace('/(auth)/login');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await apiService.login(credentials);
      
      // Normalize user data to ensure consistent field names
      const normalizedUser = normalizeUserData(response.user);
      
      console.log('🔐 Normalized user data:', normalizedUser);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: normalizedUser });
      router.replace('/(tabs)');
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.error || 'Login failed' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      dispatch({ type: 'AUTH_LOGOUT' });
      router.replace('/(auth)/login');
    } catch (error) {
      // Even if logout fails on server, clear local data
      dispatch({ type: 'AUTH_LOGOUT' });
      router.replace('/(auth)/login');
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};