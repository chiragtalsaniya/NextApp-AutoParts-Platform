import { Tabs } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Chrome as Home, User, ShoppingCart, ChartBar as BarChart3 } from 'lucide-react-native';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Navigation will be handled by the auth context
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Helper function to get orders tab title based on role
  const getOrdersTitle = (role: string) => {
    switch (role) {
      case 'retailer':
        return 'My Orders';
      case 'salesman':
        return 'Sales Orders';
      case 'storeman':
        return 'Order Fulfillment';
      default:
        return 'Orders';
    }
  };

  // Helper function to get reports tab title based on role
  const getReportsTitle = (role: string) => {
    switch (role) {
      case 'retailer':
        return 'Account';
      case 'salesman':
        return 'Sales Reports';
      case 'storeman':
        return 'Inventory Reports';
      default:
        return 'Reports';
    }
  };

  // Check if user should have access to reports
  const hasReportsAccess = ['super_admin', 'admin', 'manager', 'storeman', 'salesman'].includes(user.role);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#FFFFFF',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 32 : 16,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 20,
          position: 'absolute',
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} style={{ flex: 1 }} />
          ) : null
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      {/* Dashboard Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
          tabBarAccessibilityLabel: 'Dashboard',
        }}
      />

      {/* Orders Tab */}
      <Tabs.Screen
        name="orders"
        options={{
          title: getOrdersTitle(user.role),
          tabBarIcon: ({ size, color }) => <ShoppingCart size={size} color={color} />,
          tabBarAccessibilityLabel: 'Orders',
        }}
      />

      {/* Reports Tab - Only show for roles with access */}
      {hasReportsAccess && (
        <Tabs.Screen
          name="reports"
          options={{
            title: getReportsTitle(user.role),
            tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
            tabBarAccessibilityLabel: 'Reports',
          }}
        />
      )}

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          tabBarAccessibilityLabel: 'Profile',
        }}
      />

      {/* Hidden tabs - these will be accessible through menu or other navigation */}
      <Tabs.Screen
        name="parts"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="retailers"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}