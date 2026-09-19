import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { ModernCard } from '@/components/ModernCard';
import { ModernHeader } from '@/components/ModernHeader';
import { ModernButton } from '@/components/ModernButton';
import { StatsCard } from '@/components/StatsCard';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { Package, ShoppingCart, Users, TriangleAlert as AlertTriangle, TrendingUp, Clock, CircleCheck as CheckCircle, ChartBar as BarChart3, DollarSign, Bell, Plus, Scan, Camera, Menu, Grid3x3 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface DashboardStats {
  companies?: number;
  stores?: number;
  activeUsers?: number;
  totalParts?: number;
  availableParts?: number;
  ordersToday?: number;
  totalOrders?: number;
  totalRevenue?: number;
  activeRetailers?: number;
  lowStockItems?: number;
  storeInventory?: number;
  pendingOrders?: number;
  storeStaff?: number;
  storeRetailers?: number;
  pendingTasks?: number;
  completedOrders?: number;
  myRetailers?: number;
  ordersCreated?: number;
  myOrders?: number;
  creditAvailable?: number;
  creditLimit?: number;
  outstandingAmount?: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setError(null);

      const requests: Promise<any>[] = [apiService.getDashboardStats()];

      if (['super_admin', 'admin', 'manager', 'storeman'].includes(user?.role || '')) {
        requests.push(apiService.getLowStockParts());
      }

      const results = await Promise.allSettled(requests);

      let newStats: DashboardStats = {};
      let alertsData: any[] = [];
      let hadError = true;

      if (results[0]?.status === 'fulfilled' && results[0].value) {
        newStats = results[0].value;
        hadError = false;
      }

      if (results.length > 1 && results[1]?.status === 'fulfilled') {
        alertsData = Array.isArray(results[1].value) ? results[1].value : [];
      } else if (results.length > 1 && results[1]?.status === 'rejected') {
        // Low-stock alerts are supplementary; stats still show without them
      }

      setNotifications(alertsData.length);

      if (hadError) {
        setError('Failed to load dashboard data');
      } else {
        setStats(newStats);
      }
      setLowStockAlerts(alertsData);
    } catch (error: any) {
      setError(error.error || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.role]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'scan_barcode':
        Alert.alert('Barcode Scanner', 'Barcode scanning is not available yet. You can find parts in the Parts Catalog instead.');
        break;
      case 'new_order':
        router.push('/(tabs)/orders/create');
        break;
      case 'quick_stock':
        router.push('/(tabs)/inventory');
        break;
      case 'photo_report':
        Alert.alert('Photo Report', 'Photo reports are not available yet.');
        break;
      case 'low_stock_alert':
        Alert.alert('Stock Alerts', `You have ${lowStockAlerts.length} low stock alerts`);
        break;
      case 'daily_report':
        router.push('/(tabs)/reports');
        break;
      case 'parts_catalog':
        router.push('/(tabs)/parts');
        break;
      case 'retailers_list':
        router.push('/(tabs)/retailers');
        break;
      case 'inventory_management':
        router.push('/(tabs)/inventory');
        break;
      default:
        Alert.alert('Action', `${actionId} feature coming soon!`);
    }
  };

  const getDashboardTitle = () => {
    const role = user?.role || '';
    const timeOfDay = new Date().getHours() < 12 ? 'Morning' : 
                     new Date().getHours() < 18 ? 'Afternoon' : 'Evening';
    
    switch (role) {
      case 'super_admin':
        return `Good ${timeOfDay}`;
      case 'admin':
        return `Company Overview`;
      case 'manager':
        return `Store Management`;
      case 'storeman':
        return `Inventory Control`;
      case 'salesman':
        return `Sales Dashboard`;
      case 'retailer':
        return `My Account`;
      default:
        return `Dashboard`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderQuickActions = () => {
    const role = user?.role || '';
    const actions = [];

    if (['admin', 'manager', 'storeman', 'salesman'].includes(role)) {
      actions.push({
        id: 'scan_barcode',
        title: 'Scan Part',
        icon: <Scan size={24} color="#FFFFFF" />,
        colors: ['#667eea', '#764ba2'],
      });
    }

    if (['admin', 'manager', 'salesman'].includes(role)) {
      actions.push({
        id: 'new_order',
        title: 'New Order',
        icon: <Plus size={24} color="#FFFFFF" />,
        colors: ['#f093fb', '#f5576c'],
      });
    }

    if (['admin', 'manager', 'storeman'].includes(role)) {
      actions.push({
        id: 'quick_stock',
        title: 'Quick Stock',
        icon: <Package size={24} color="#FFFFFF" />,
        colors: ['#4facfe', '#00f2fe'],
      });
    }

    if (['admin', 'manager', 'storeman', 'salesman'].includes(role)) {
      actions.push({
        id: 'photo_report',
        title: 'Photo Report',
        icon: <Camera size={24} color="#FFFFFF" />,
        colors: ['#43e97b', '#38f9d7'],
      });
    }

    if (actions.length === 0) return null;

    return (
      <Animated.View entering={FadeInUp.delay(200).duration(600)}>
        <ModernCard style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={action.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.quickActionGradient}
                >
                  {action.icon}
                </LinearGradient>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ModernCard>
      </Animated.View>
    );
  };

  const renderMenuActions = () => {
    const role = user?.role || '';
    const menuActions = [];

    // Add menu actions based on role
    if (['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'].includes(role)) {
      menuActions.push({
        id: 'parts_catalog',
        title: 'Parts Catalog',
        icon: <Package size={20} color="#667eea" />,
        description: 'Browse and manage parts',
      });
    }

    if (['super_admin', 'admin', 'manager', 'salesman'].includes(role)) {
      menuActions.push({
        id: 'retailers_list',
        title: 'Retailers',
        icon: <Users size={20} color="#059669" />,
        description: 'Manage customer relationships',
      });
    }

    if (['super_admin', 'admin', 'manager', 'storeman'].includes(role)) {
      menuActions.push({
        id: 'inventory_management',
        title: 'Inventory',
        icon: <Grid3x3 size={20} color="#f59e0b" />,
        description: 'Stock management & control',
      });
    }

    if (menuActions.length === 0) return null;

    return (
      <Animated.View entering={FadeInUp.delay(400).duration(600)}>
        <ModernCard style={styles.menuCard}>
          <View style={styles.menuHeader}>
            <Menu size={24} color="#1e293b" />
            <Text style={styles.sectionTitle}>More Features</Text>
          </View>
          <View style={styles.menuGrid}>
            {menuActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={styles.menuItem}
                onPress={() => handleQuickAction(action.id)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemIcon}>
                  {action.icon}
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{action.title}</Text>
                  <Text style={styles.menuItemDescription}>{action.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ModernCard>
      </Animated.View>
    );
  };

  const renderStatsCards = () => {
    const role = user?.role || '';

    if (role === 'salesman') {
      return (
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text style={styles.sectionTitle}>My Performance</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <StatsCard
              title="My Retailers"
              value={stats.myRetailers ?? 0}
              icon={<Users size={24} color="#FFFFFF" />}
              variant="gradient"
              gradientColors={['#667eea', '#764ba2']}
              delay={0}
            />
            <StatsCard
              title="Orders Created"
              value={stats.ordersCreated ?? 0}
              icon={<ShoppingCart size={24} color="#FFFFFF" />}
              variant="gradient"
              gradientColors={['#f093fb', '#f5576c']}
              delay={100}
            />
            <StatsCard
              title="Orders Today"
              value={stats.ordersToday ?? 0}
              icon={<BarChart3 size={24} color="#FFFFFF" />}
              variant="gradient"
              gradientColors={['#4facfe', '#00f2fe']}
              delay={200}
            />
          </ScrollView>
        </Animated.View>
      );
    }

    if (['super_admin', 'admin', 'manager'].includes(role)) {
      return (
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text style={styles.sectionTitle}>Business Overview</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <StatsCard
              title="Total Orders"
              value={stats.totalOrders ?? 0}
              icon={<ShoppingCart size={24} color="#667eea" />}
              delay={0}
            />
            <StatsCard
              title="Revenue"
              value={formatCurrency(stats.totalRevenue ?? 0)}
              icon={<DollarSign size={24} color="#667eea" />}
              delay={100}
            />
            <StatsCard
              title="Pending"
              value={stats.pendingOrders ?? 0}
              icon={<Clock size={24} color="#667eea" />}
              delay={200}
            />
          </ScrollView>
        </Animated.View>
      );
    }

    if (role === 'storeman') {
      return (
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text style={styles.sectionTitle}>Inventory Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <StatsCard
              title="Low Stock"
              value={lowStockAlerts.length}
              icon={<AlertTriangle size={24} color="#ef4444" />}
              delay={0}
            />
            <StatsCard
              title="Store Parts"
              value={stats.availableParts ?? 0}
              icon={<Package size={24} color="#667eea" />}
              delay={100}
            />
            <StatsCard
              title="Pending Tasks"
              value={stats.pendingTasks ?? 0}
              icon={<Clock size={24} color="#667eea" />}
              delay={200}
            />
          </ScrollView>
        </Animated.View>
      );
    }

    if (role === 'retailer') {
      return (
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text style={styles.sectionTitle}>My Account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <StatsCard
              title="My Orders"
              value={stats.myOrders ?? 0}
              icon={<ShoppingCart size={24} color="#667eea" />}
              delay={0}
            />
            <StatsCard
              title="Pending"
              value={stats.pendingOrders ?? 0}
              icon={<Clock size={24} color="#667eea" />}
              delay={100}
            />
            <StatsCard
              title="Credit Available"
              value={formatCurrency(stats.creditAvailable ?? 0)}
              icon={<DollarSign size={24} color="#667eea" />}
              delay={200}
            />
          </ScrollView>
        </Animated.View>
      );
    }

    return null;
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadDashboardData} />;
  }

  return (
    <View style={styles.container}>
      <ModernHeader
        title={getDashboardTitle()}
        subtitle={user?.name}
        leftButton={
          <HamburgerMenu />
        }
        rightButton={
          notifications > 0
            ? {
                icon: <Bell size={24} color="#FFFFFF" />,
                onPress: () => Alert.alert('Notifications', `You have ${notifications} notifications`),
              }
            : undefined
        }
        variant="gradient"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        {renderQuickActions()}

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Menu Actions */}
        {renderMenuActions()}
        {lowStockAlerts.length > 0 && ['admin', 'manager', 'storeman'].includes(user?.role || '') && (
          <Animated.View entering={FadeInUp.delay(600).duration(600)}>
            <ModernCard style={styles.alertsCard}>
              <View style={styles.alertsHeader}>
                <Text style={styles.sectionTitle}>Stock Alerts</Text>
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>{lowStockAlerts.length}</Text>
                </View>
              </View>
              {lowStockAlerts.slice(0, 3).map((item: any, index) => (
                <TouchableOpacity key={index} style={styles.alertItem} activeOpacity={0.7}>
                  <View style={styles.alertIcon}>
                    <AlertTriangle size={16} color="#f59e0b" />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{item.name}</Text>
                    <Text style={styles.alertSubtitle}>#{item.partNumber} • {item.currentStock} in stock</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {lowStockAlerts.length > 3 && (
                <ModernButton
                  title={`View All ${lowStockAlerts.length} Alerts`}
                  onPress={() => handleQuickAction('low_stock_alert')}
                  variant="ghost"
                  size="small"
                />
              )}
            </ModernCard>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  quickActionsCard: {
    margin: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
    minWidth: (width - 80) / 2 - 8,
  },
  quickActionGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
  menuCard: {
    margin: 20,
    marginTop: 0,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuGrid: {
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  statsScroll: {
    paddingLeft: 20,
  },
  alertsCard: {
    margin: 20,
    marginTop: 0,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  alertBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  alertBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 4,
  },
  alertSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
});