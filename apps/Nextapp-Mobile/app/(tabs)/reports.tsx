import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/context/AuthContext';
import { ChartBar as BarChart3, TrendingUp, Package, ShoppingCart, Users, Download, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, Target, Award, Clock, Zap, Eye, Filter } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface ReportData {
  orders?: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    growth: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  };
  inventory?: {
    totalParts: number;
    lowStockItems: number;
    totalValue: number;
    categories: number;
    topCategories: Array<{ category: string; count: number; value: number }>;
  };
  sales?: {
    totalSales: number;
    dailyAverage: number;
    monthlyGrowth: number;
    weeklyGrowth: number;
    topSalespeople: Array<{ name: string; sales: number; revenue: number }>;
  };
  retailers?: {
    totalRetailers: number;
    activeRetailers: number;
    newRetailers: number;
    topRetailers: Array<{ name: string; orders: number; revenue: number }>;
  };
}

type ReportType = 'overview' | 'orders' | 'inventory' | 'sales' | 'retailers';

export default function ReportsScreen() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData>({});
  const [selectedReport, setSelectedReport] = useState<ReportType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [user?.role]);

  const loadReportData = async () => {
    try {
      setError(null);
      
      // Mock data for demonstration - in real app, these would be API calls
      const mockData: ReportData = {
        orders: {
          totalOrders: 1247,
          totalRevenue: 89650,
          averageOrderValue: 72,
          growth: 12.5,
          topProducts: [
            { name: 'Brake Pads - Front Set', quantity: 156, revenue: 14040 },
            { name: 'Engine Oil 5W-30', quantity: 234, revenue: 5850 },
            { name: 'Air Filter', quantity: 189, revenue: 3780 },
            { name: 'Spark Plugs Set', quantity: 145, revenue: 2900 },
          ],
        },
        inventory: {
          totalParts: 2847,
          lowStockItems: 23,
          totalValue: 156780,
          categories: 24,
          topCategories: [
            { category: 'Engine Parts', count: 456, value: 45600 },
            { category: 'Brake System', count: 234, value: 23400 },
            { category: 'Electrical', count: 189, value: 18900 },
            { category: 'Suspension', count: 167, value: 16700 },
          ],
        },
        sales: {
          totalSales: 89650,
          dailyAverage: 2988,
          monthlyGrowth: 15.2,
          weeklyGrowth: 8.7,
          topSalespeople: [
            { name: 'John Smith', sales: 45, revenue: 32400 },
            { name: 'Sarah Johnson', sales: 38, revenue: 27300 },
            { name: 'Mike Wilson', sales: 32, revenue: 22800 },
            { name: 'Lisa Brown', sales: 28, revenue: 19600 },
          ],
        },
        retailers: {
          totalRetailers: 156,
          activeRetailers: 134,
          newRetailers: 12,
          topRetailers: [
            { name: 'Downtown Auto Parts', orders: 23, revenue: 18400 },
            { name: 'City Motors', orders: 19, revenue: 15200 },
            { name: 'Highway Garage', orders: 16, revenue: 12800 },
            { name: 'Quick Fix Auto', orders: 14, revenue: 11200 },
          ],
        },
      };
      
      setReportData(mockData);
    } catch (error: any) {
      setError(error.error || 'Failed to load report data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

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

  const formatPercentage = (value: number) => {
    const safeValue = value || 0;
    return `${safeValue >= 0 ? '+' : ''}${safeValue.toFixed(1)}%`;
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

    if (['super_admin', 'admin', 'manager', 'salesman'].includes(user?.role || '')) {
      tabs.push({ key: 'sales', title: 'Sales', icon: TrendingUp });
    }
    
    return tabs;
  };

  const renderOverviewReport = () => {
    return (
      <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
        {/* Key Metrics */}
        <Animated.View entering={FadeInUp.delay(0).duration(600)}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.metricGradient}>
                <DollarSign size={24} color="#FFFFFF" />
                <Text style={styles.metricValue}>{formatCurrency(reportData.orders?.totalRevenue || 0)}</Text>
                <Text style={styles.metricLabel}>Total Revenue</Text>
                <View style={styles.metricTrend}>
                  <ArrowUpRight size={16} color="#FFFFFF" />
                  <Text style={styles.metricTrendText}>{formatPercentage(reportData.orders?.growth || 0)}</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.metricGradient}>
                <ShoppingCart size={24} color="#FFFFFF" />
                <Text style={styles.metricValue}>{reportData.orders?.totalOrders || 0}</Text>
                <Text style={styles.metricLabel}>Total Orders</Text>
                <View style={styles.metricTrend}>
                  <ArrowUpRight size={16} color="#FFFFFF" />
                  <Text style={styles.metricTrendText}>+8.2%</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.metricGradient}>
                <Package size={24} color="#FFFFFF" />
                <Text style={styles.metricValue}>{reportData.inventory?.totalParts || 0}</Text>
                <Text style={styles.metricLabel}>Total Parts</Text>
                <View style={styles.metricTrend}>
                  <ArrowUpRight size={16} color="#FFFFFF" />
                  <Text style={styles.metricTrendText}>+3.1%</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.metricGradient}>
                <Users size={24} color="#FFFFFF" />
                <Text style={styles.metricValue}>{reportData.retailers?.activeRetailers || 0}</Text>
                <Text style={styles.metricLabel}>Active Retailers</Text>
                <View style={styles.metricTrend}>
                  <ArrowUpRight size={16} color="#FFFFFF" />
                  <Text style={styles.metricTrendText}>+5.7%</Text>
                </View>
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
                <Target size={20} color="#667eea" />
              </View>
              <Text style={styles.quickStatValue}>{formatCurrency(reportData.orders?.averageOrderValue || 0)}</Text>
              <Text style={styles.quickStatLabel}>Avg Order Value</Text>
            </View>

            <View style={styles.quickStatCard}>
              <View style={styles.quickStatIcon}>
                <Clock size={20} color="#f59e0b" />
              </View>
              <Text style={styles.quickStatValue}>{formatCurrency(reportData.sales?.dailyAverage || 0)}</Text>
              <Text style={styles.quickStatLabel}>Daily Average</Text>
            </View>

            <View style={styles.quickStatCard}>
              <View style={styles.quickStatIcon}>
                <Zap size={20} color="#10b981" />
              </View>
              <Text style={styles.quickStatValue}>{reportData.inventory?.lowStockItems || 0}</Text>
              <Text style={styles.quickStatLabel}>Low Stock Items</Text>
            </View>

            <View style={styles.quickStatCard}>
              <View style={styles.quickStatIcon}>
                <Award size={20} color="#8b5cf6" />
              </View>
              <Text style={styles.quickStatValue}>{reportData.retailers?.newRetailers || 0}</Text>
              <Text style={styles.quickStatLabel}>New Retailers</Text>
            </View>
          </View>
        </Animated.View>

        {/* Top Performers */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text style={styles.sectionTitle}>Top Performers</Text>
          <View style={styles.topPerformersContainer}>
            <View style={styles.performerCard}>
              <Text style={styles.performerTitle}>Top Products</Text>
              {reportData.orders?.topProducts?.slice(0, 3).map((product, index) => (
                <View key={index} style={styles.performerItem}>
                  <Text style={styles.performerName}>{product.name}</Text>
                  <Text style={styles.performerValue}>{formatCurrency(product.revenue)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.performerCard}>
              <Text style={styles.performerTitle}>Top Retailers</Text>
              {reportData.retailers?.topRetailers?.slice(0, 3).map((retailer, index) => (
                <View key={index} style={styles.performerItem}>
                  <Text style={styles.performerName}>{retailer.name}</Text>
                  <Text style={styles.performerValue}>{formatCurrency(retailer.revenue)}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderOrdersReport = () => {
    const data = reportData.orders;
    if (!data) return null;

    return (
      <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(0).duration(600)}>
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#2563EB', '#1d4ed8']} style={styles.summaryGradient}>
                <ShoppingCart size={24} color="#FFFFFF" />
                <Text style={styles.summaryNumber}>{data.totalOrders}</Text>
                <Text style={styles.summaryLabel}>Total Orders</Text>
                <View style={styles.summaryTrend}>
                  <ArrowUpRight size={14} color="#FFFFFF" />
                  <Text style={styles.summaryTrendText}>+15%</Text>
                </View>
              </LinearGradient>
            </View>
            
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#059669', '#047857']} style={styles.summaryGradient}>
                <DollarSign size={24} color="#FFFFFF" />
                <Text style={styles.summaryNumber}>{formatCurrency(data.totalRevenue)}</Text>
                <Text style={styles.summaryLabel}>Revenue</Text>
                <View style={styles.summaryTrend}>
                  <ArrowUpRight size={14} color="#FFFFFF" />
                  <Text style={styles.summaryTrendText}>{formatPercentage(data.growth)}</Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Top Products</Text>
            {data.topProducts?.map((product, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{product.name}</Text>
                  <Text style={styles.listItemSubtitle}>Quantity: {product.quantity}</Text>
                </View>
                <Text style={styles.listItemValue}>{formatCurrency(product.revenue)}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderSalesReport = () => {
    const data = reportData.sales;
    if (!data) return null;

    return (
      <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(0).duration(600)}>
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#059669', '#047857']} style={styles.summaryGradient}>
                <DollarSign size={24} color="#FFFFFF" />
                <Text style={styles.summaryNumber}>{formatCurrency(data.totalSales)}</Text>
                <Text style={styles.summaryLabel}>Total Sales</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#2563EB', '#1d4ed8']} style={styles.summaryGradient}>
                <Calendar size={24} color="#FFFFFF" />
                <Text style={styles.summaryNumber}>{formatCurrency(data.dailyAverage)}</Text>
                <Text style={styles.summaryLabel}>Daily Average</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Growth Metrics</Text>
            <View style={styles.growthMetrics}>
              <View style={styles.growthItem}>
                <Text style={styles.growthLabel}>Monthly Growth</Text>
                <View style={styles.growthValue}>
                  <ArrowUpRight size={16} color="#10b981" />
                  <Text style={[styles.growthText, { color: '#10b981' }]}>
                    {formatPercentage(data.monthlyGrowth)}
                  </Text>
                </View>
              </View>
              <View style={styles.growthItem}>
                <Text style={styles.growthLabel}>Weekly Growth</Text>
                <View style={styles.growthValue}>
                  <ArrowUpRight size={16} color="#10b981" />
                  <Text style={[styles.growthText, { color: '#10b981' }]}>
                    {formatPercentage(data.weeklyGrowth)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Top Salespeople</Text>
            {data.topSalespeople?.map((salesperson, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{salesperson.name}</Text>
                  <Text style={styles.listItemSubtitle}>{salesperson.sales} sales</Text>
                </View>
                <Text style={styles.listItemValue}>{formatCurrency(salesperson.revenue)}</Text>
              </View>
            ))}
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
      case 'sales':
        return renderSalesReport();
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
              <Text style={styles.headerSubtitle}>Business insights and performance metrics</Text>
            </View>
            
            <TouchableOpacity style={styles.exportButton}>
              <Download size={20} color="#FFFFFF" />
            </TouchableOpacity>
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
      <View style={styles.content}>
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}>
          {renderCurrentReport()}
        </RefreshControl>
      </View>
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
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricTrendText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
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
  topPerformersContainer: {
    gap: 16,
    marginBottom: 32,
  },
  performerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  performerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  performerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  performerName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  performerValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
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
  summaryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  summaryTrendText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 2,
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
  growthMetrics: {
    gap: 16,
  },
  growthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  growthLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  growthValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
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