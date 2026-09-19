import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/context/AuthContext';
import { ChartBar as BarChart3, TrendingUp, Package, ShoppingCart, Users, DollarSign, Clock, Zap, AlertTriangle, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface OrderStats {
  totalOrders?: number;
  totalRevenue?: number;
  avgOrderValue?: number;
  statusCounts?: Record<string, number>;
}

interface InventoryStats {
  totalItems?: number;
  totalStock?: number;
  criticalStock?: number;
  lowStock?: number;
  goodStock?: number;
}

interface SalesRow {
  total_amount?: number;
  item_count?: number;
  Retailer_Name?: string;
  Branch_Name?: string;
}

interface RetailerRow {
  Retailer_Name?: string;
  order_count?: number;
  total_spent?: number;
}

type ReportType = 'overview' | 'orders' | 'inventory' | 'sales' | 'retailers';

export default function ReportsScreen() {
  const { user } = useAuth();
  const [orderStats, setOrderStats] = useState<OrderStats>({});
  const [inventoryStats, setInventoryStats] = useState<InventoryStats>({});
  const [sales, setSales] = useState<SalesRow[]>([]);
  const [retailers, setRetailers] = useState<RetailerRow[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadReportData = async () => {
    try {
      setError(null);
      const role = user?.role || '';
      const monthStart = new Date();
      monthStart.setDate(1);
      const dateParams = { start_date: monthStart.toISOString().slice(0, 10) };

      const requests: Promise<any>[] = [apiService.getOrderReport(dateParams)];

      if (['super_admin', 'admin', 'manager', 'storeman'].includes(role)) {
        requests.push(apiService.getInventoryReport({ low_stock_only: 'true', limit: 1 }));
      }

      if (['super_admin', 'admin', 'manager'].includes(role)) {
        requests.push(apiService.getSalesReport(dateParams));
        requests.push(apiService.getRetailerReport(dateParams));
      }

      const results = await Promise.allSettled(requests);
      let anySuccess = false;

      if (results[0]?.status === 'fulfilled' && results[0].value) {
        setOrderStats(results[0].value.stats || {});
        anySuccess = true;
      }

      if (results.length > 1) {
        if (results[1]?.status === 'fulfilled' && results[1].value) {
          setInventoryStats(results[1].value.stats || {});
          anySuccess = true;
        }
      }

      if (results.length > 3) {
        if (results[2]?.status === 'fulfilled' && results[2].value) {
          setSales(results[2].value.sales || []);
          anySuccess = true;
        }
        if (results[3]?.status === 'fulfilled' && results[3].value) {
          setRetailers(results[3].value.retailers || []);
          anySuccess = true;
        }
      }

      if (!anySuccess) {
        setError('Failed to load report data');
      }
    } catch (err: any) {
      setError(err.error || 'Failed to load report data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  useFocusEffect(
    useCallback(() => {
      loadReportData();
    }, [user?.role])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReportData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getReportTabs = () => {
    const tabs = [
      { key: 'overview', title: 'Overview', icon: BarChart3 },
    ];

    if (['super_admin', 'admin', 'manager'].includes(user?.role || '')) {
      tabs.push(
        { key: 'orders', title: 'Orders', icon: ShoppingCart },
        { key: 'retailers', title: 'Retailers', icon: Users }
      );
    }

    if (['super_admin', 'admin', 'manager', 'storeman'].includes(user?.role || '')) {
      tabs.push({ key: 'inventory', title: 'Inventory', icon: Package });
    }

    if (['super_admin', 'admin', 'manager'].includes(user?.role || '')) {
      tabs.push({ key: 'sales', title: 'Sales', icon: TrendingUp });
    }

    return tabs;
  };

  const completedOrders = orderStats.statusCounts?.Completed || 0;

  const renderOverviewReport = () => {
    return (
      <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
        {/* Key Metrics */}
        <Animated.View entering={FadeInUp.delay(0).duration(600)}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.metricGradient}>
                <DollarSign size={24} color="#FFFFFF" />
                <Text style={styles.metricValue}>{formatCurrency(orderStats.totalRevenue || 0)}</Text>
                <Text style={styles.metricLabel}>Total Revenue</Text>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.metricGradient}>
                <ShoppingCart size={24} color="#FFFFFF" />
                <Text style={styles.metricValue}>{orderStats.totalOrders || 0}</Text>
                <Text style={styles.metricLabel}>Total Orders</Text>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.metricGradient}>
                <Package size={24} color="#FFFFFF" />
                <Text style={styles.metricValue}>{inventoryStats.totalItems || orderStats.totalOrders || 0}</Text>
                <Text style={styles.metricLabel}>Inventory Items</Text>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.metricGradient}>
                <Users size={24} color="#FFFFFF" />
                <Text style={styles.metricValue}>{retailers.length || orderStats.totalOrders || 0}</Text>
                <Text style={styles.metricLabel}>Retailers with Orders</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.quickStatsContainer}>
            <View style={styles.quickStatCard}>
              <View style={styles.quickStatIcon}>
                <DollarSign size={20} color="#667eea" />
              </View>
              <Text style={styles.quickStatValue}>{formatCurrency(orderStats.avgOrderValue || 0)}</Text>
              <Text style={styles.quickStatLabel}>Avg Order Value</Text>
            </View>

            <View style={styles.quickStatCard}>
              <View style={styles.quickStatIcon}>
                <Clock size={20} color="#f59e0b" />
              </View>
              <Text style={styles.quickStatValue}>{orderStats.statusCounts?.Processing || 0}</Text>
              <Text style={styles.quickStatLabel}>In Processing</Text>
            </View>

            <View style={styles.quickStatCard}>
              <View style={styles.quickStatIcon}>
                <Zap size={20} color="#10b981" />
              </View>
              <Text style={styles.quickStatValue}>{completedOrders}</Text>
              <Text style={styles.quickStatLabel}>Completed</Text>
            </View>

            <View style={styles.quickStatCard}>
              <View style={styles.quickStatIcon}>
                <AlertTriangle size={20} color="#ef4444" />
              </View>
              <Text style={styles.quickStatValue}>{(inventoryStats.criticalStock || 0) + (inventoryStats.lowStock || 0)}</Text>
              <Text style={styles.quickStatLabel}>Low Stock Items</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderOrdersReport = () => {
    return (
      <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(0).duration(600)}>
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#2563EB', '#1d4ed8']} style={styles.summaryGradient}>
                <ShoppingCart size={24} color="#FFFFFF" />
                <Text style={styles.summaryNumber}>{orderStats.totalOrders || 0}</Text>
                <Text style={styles.summaryLabel}>Total Orders</Text>
              </LinearGradient>
            </View>

            <View style={styles.summaryCard}>
              <LinearGradient colors={['#059669', '#047857']} style={styles.summaryGradient}>
                <DollarSign size={24} color="#FFFFFF" />
                <Text style={styles.summaryNumber}>{formatCurrency(orderStats.totalRevenue || 0)}</Text>
                <Text style={styles.summaryLabel}>Revenue</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Orders by Status</Text>
            {Object.entries(orderStats.statusCounts || {}).length === 0 ? (
              <Text style={styles.emptyText}>No orders in this period.</Text>
            ) : (
              Object.entries(orderStats.statusCounts || {}).map(([status, count]) => (
                <View key={status} style={styles.listItem}>
                  <Text style={styles.listItemTitle}>{status}</Text>
                  <Text style={styles.listItemValue}>{count}</Text>
                </View>
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderInventoryReport = () => {
    return (
      <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(0).duration(600)}>
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.summaryGradient}>
                <Package size={24} color="#FFFFFF" />
                <Text style={styles.summaryNumber}>{inventoryStats.totalItems || 0}</Text>
                <Text style={styles.summaryLabel}>Inventory Items</Text>
              </LinearGradient>
            </View>

            <View style={styles.summaryCard}>
              <LinearGradient colors={['#059669', '#047857']} style={styles.summaryGradient}>
                <Package size={24} color="#FFFFFF" />
                <Text style={styles.summaryNumber}>{inventoryStats.totalStock || 0}</Text>
                <Text style={styles.summaryLabel}>Total Stock</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Stock Health</Text>
            <View style={styles.listItem}>
              <Text style={styles.listItemTitle}>Good Stock</Text>
              <Text style={styles.listItemValue}>{inventoryStats.goodStock || 0}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.listItemTitle}>Low Stock</Text>
              <Text style={styles.listItemValue}>{inventoryStats.lowStock || 0}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.listItemTitle}>Critical</Text>
              <Text style={[styles.listItemValue, { color: '#ef4444' }]}>{inventoryStats.criticalStock || 0}</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderSalesReport = () => {
    return (
      <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(0).duration(600)}>
          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Completed Sales by Retailer</Text>
            {sales.length === 0 ? (
              <Text style={styles.emptyText}>No completed sales in this period.</Text>
            ) : (
              sales.slice(0, 20).map((sale, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{sale.Retailer_Name || 'Unknown retailer'}</Text>
                    <Text style={styles.listItemSubtitle}>{sale.item_count || 0} items</Text>
                  </View>
                  <Text style={styles.listItemValue}>{formatCurrency(sale.total_amount || 0)}</Text>
                </View>
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderRetailersReport = () => {
    return (
      <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(0).duration(600)}>
          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Top Retailers by Spend</Text>
            {retailers.length === 0 ? (
              <Text style={styles.emptyText}>No retailer activity in this period.</Text>
            ) : (
              retailers.slice(0, 20).map((retailer, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{retailer.Retailer_Name || 'Unknown'}</Text>
                    <Text style={styles.listItemSubtitle}>{retailer.order_count || 0} orders</Text>
                  </View>
                  <Text style={styles.listItemValue}>{formatCurrency(retailer.total_spent || 0)}</Text>
                </View>
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderCurrentReport = () => {
    switch (selectedReport) {
      case 'overview':
        return renderOverviewReport();
      case 'orders':
        return renderOrdersReport();
      case 'inventory':
        return renderInventoryReport();
      case 'sales':
        return renderSalesReport();
      case 'retailers':
        return renderRetailersReport();
      default:
        return renderOverviewReport();
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading reports..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadReportData} />;
  }

  const tabs = getReportTabs();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <HamburgerMenu />

            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Reports & Analytics</Text>
              <Text style={styles.headerSubtitle}>Business insights from real order data</Text>
            </View>

            <View style={styles.exportButton}>
              <Calendar size={20} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Report Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {tabs.map((tab, index) => (
            <Animated.View key={tab.key} entering={FadeInDown.delay(index * 100).duration(600)}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  selectedReport === tab.key && styles.activeTab,
                ]}
                onPress={() => setSelectedReport(tab.key as ReportType)}
              >
                <tab.icon
                  size={20}
                  color={selectedReport === tab.key ? '#FFFFFF' : '#64748B'}
                />
                <Text style={[
                  styles.tabText,
                  selectedReport === tab.key && styles.activeTabText,
                ]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* Report Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderCurrentReport()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  tabScroll: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  activeTab: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  reportContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    paddingVertical: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  metricGradient: {
    padding: 20,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  quickStatCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  quickStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryGradient: {
    padding: 20,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  reportSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  listItemValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
});
