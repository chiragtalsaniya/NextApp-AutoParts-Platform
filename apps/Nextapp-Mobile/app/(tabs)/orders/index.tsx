import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { FilterModal } from '@/components/FilterModal';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Order } from '@/types/api';
import { ShoppingCart, Clock, CircleCheck as CheckCircle, Truck, Package, CircleAlert as AlertCircle, Plus, Calendar, User, DollarSign, MapPin, Search, X, Filter, Eye, CreditCard as Edit3, Trash2, Download, Building, FileText, Star, ArrowUpDown, SlidersHorizontal } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'new' | 'processing' | 'completed' | 'hold' | 'picked' | 'dispatched' | 'pending' | 'cancelled';
type SortType = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'status';

export default function OrdersScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedSort, setSelectedSort] = useState<SortType>('date_desc');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const canCreateOrder = ['admin', 'manager', 'salesman'].includes(user?.role || '');
  const canEditOrders = ['admin', 'manager'].includes(user?.role || '');
  const canUpdateStatus = ['admin', 'manager', 'storeman'].includes(user?.role || '');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [orders, searchQuery, selectedFilter, selectedSort]);

  const loadOrders = async () => {
    try {
      setError(null);
      const response = await apiService.getOrders({ limit: 100 });
      const orderData = response.data || response.orders || [];
      
      console.log('📦 Loaded orders:', orderData);
      setOrders(orderData);
    } catch (error: any) {
      setError(error.error || 'Failed to load orders');
      showToast('Failed to load orders', 'error');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const applyFiltersAndSort = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (order) =>
          (order.orderNumber || order.CRMOrderId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.retailer?.businessName || order.Retailer_Name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.retailer?.contactName || order.Contact_Person || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.status || order.Order_Status || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(order => 
        (order.status || order.Order_Status || '').toLowerCase() === selectedFilter.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'date_desc':
          const dateA = new Date(a.orderDate || a.created_at).getTime();
          const dateB = new Date(b.orderDate || b.created_at).getTime();
          return dateB - dateA;
        case 'date_asc':
          const dateA2 = new Date(a.orderDate || a.created_at).getTime();
          const dateB2 = new Date(b.orderDate || b.created_at).getTime();
          return dateA2 - dateB2;
        case 'amount_desc':
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case 'amount_asc':
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        case 'status':
          return (a.status || a.Order_Status || '').localeCompare(b.status || b.Order_Status || '');
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const getStatusInfo = (status: string) => {
    const safeStatus = (status || 'unknown').toLowerCase();
    switch (safeStatus) {
      case 'new':
        return {
          icon: <Plus size={16} color="#3b82f6" />,
          color: '#3b82f6',
          bgColor: '#dbeafe',
          text: 'New',
        };
      case 'pending':
        return {
          icon: <Clock size={16} color="#f59e0b" />,
          color: '#f59e0b',
          bgColor: '#fef3c7',
          text: 'Pending',
        };
      case 'processing':
        return {
          icon: <Package size={16} color="#8b5cf6" />,
          color: '#8b5cf6',
          bgColor: '#ede9fe',
          text: 'Processing',
        };
      case 'completed':
        return {
          icon: <CheckCircle size={16} color="#10b981" />,
          color: '#10b981',
          bgColor: '#dcfce7',
          text: 'Completed',
        };
      case 'hold':
        return {
          icon: <AlertCircle size={16} color="#f59e0b" />,
          color: '#f59e0b',
          bgColor: '#fef3c7',
          text: 'Hold',
        };
      case 'picked':
        return {
          icon: <Package size={16} color="#059669" />,
          color: '#059669',
          bgColor: '#dcfce7',
          text: 'Picked',
        };
      case 'dispatched':
        return {
          icon: <Truck size={16} color="#8b5cf6" />,
          color: '#8b5cf6',
          bgColor: '#ede9fe',
          text: 'Dispatched',
        };
      case 'cancelled':
        return {
          icon: <AlertCircle size={16} color="#ef4444" />,
          color: '#ef4444',
          bgColor: '#fee2e2',
          text: 'Cancelled',
        };
      default:
        return {
          icon: <Clock size={16} color="#64748b" />,
          color: '#64748b',
          bgColor: '#f1f5f9',
          text: 'Unknown',
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | number) => {
    const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | number) => {
    const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScreenTitle = () => {
    const role = user?.role || '';
    switch (role) {
      case 'retailer':
        return 'My Orders';
      case 'salesman':
        return 'Sales Orders';
      case 'storeman':
        return 'Order Fulfillment';
      default:
        return 'Order Management';
    }
  };

  const handleCreateOrder = () => {
    router.push('/(tabs)/orders/create');
  };

  const handleOrderPress = (order: Order) => {
    const orderId = order.id || order.Order_Id;
    router.push(`/(tabs)/orders/${orderId}`);
  };

  const handleQuickAction = (order: Order, action: 'view' | 'edit' | 'cancel' | 'download' | 'status') => {
    const orderId = order.id || order.Order_Id;
    const orderNumber = order.orderNumber || order.CRMOrderId;
    
    switch (action) {
      case 'view':
        handleOrderPress(order);
        break;
      case 'edit':
        if (canEditOrders) {
          router.push(`/(tabs)/orders/${orderId}?edit=true`);
        } else {
          showToast('You don\'t have permission to edit orders', 'warning');
        }
        break;
      case 'status':
        if (canUpdateStatus) {
          handleStatusUpdate(order);
        } else {
          showToast('You don\'t have permission to update order status', 'warning');
        }
        break;
      case 'cancel':
        if (canEditOrders) {
          Alert.alert(
            'Cancel Order',
            `Are you sure you want to cancel order ${orderNumber}?`,
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Yes, Cancel',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await apiService.updateOrderStatus(orderId, 'Cancelled');
                    showToast(`Order ${orderNumber} cancelled`, 'success');
                    loadOrders(); // Refresh the list
                  } catch (error: any) {
                    showToast(error.error || 'Failed to cancel order', 'error');
                  }
                },
              },
            ]
          );
        } else {
          showToast('You don\'t have permission to cancel orders', 'warning');
        }
        break;
      case 'download':
        showToast('Downloading order invoice...', 'info');
        break;
    }
  };

  const handleStatusUpdate = (order: Order) => {
    const validStatuses = ['New', 'Processing', 'Completed', 'Hold', 'Picked', 'Dispatched', 'Pending', 'Cancelled'];
    const currentStatus = order.status || order.Order_Status;
    
    Alert.alert(
      'Update Order Status',
      `Current status: ${currentStatus}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...validStatuses.map(status => ({
          text: status,
          onPress: async () => {
            try {
              const orderId = order.id || order.Order_Id;
              await apiService.updateOrderStatus(orderId, status);
              showToast(`Order status updated to ${status}`, 'success');
              loadOrders(); // Refresh the list
            } catch (error: any) {
              showToast(error.error || 'Failed to update order status', 'error');
            }
          },
        })),
      ]
    );
  };

  const renderOrderItem = ({ item, index }: { item: Order; index: number }) => {
    const statusInfo = getStatusInfo(item.status || item.Order_Status);
    const orderNumber = item.orderNumber || item.CRMOrderId;
    const retailerName = item.retailer?.businessName || item.Retailer_Name;
    const contactPerson = item.retailer?.contactName || item.Contact_Person;
    const orderDate = item.orderDate || item.created_at;
    const branchName = item.branch || item.Branch_Name;
    const companyName = item.Company_Name;
    const isUrgent = item.urgent || item.Urgent_Status === 1;
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 50).duration(600)}>
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => handleOrderPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <View style={styles.orderTitleRow}>
                <Text style={styles.orderNumber}>#{orderNumber}</Text>
                {isUrgent && (
                  <View style={styles.urgentBadge}>
                    <Star size={12} color="#ef4444" />
                    <Text style={styles.urgentText}>Urgent</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.retailerInfo}>
                <User size={14} color="#64748b" />
                <Text style={styles.retailerName}>
                  {retailerName || 'Unknown Retailer'}
                </Text>
              </View>
              
              {contactPerson && contactPerson !== '0' && (
                <View style={styles.contactInfo}>
                  <Text style={styles.contactText}>Contact: {contactPerson}</Text>
                </View>
              )}
              
              <View style={styles.dateInfo}>
                <Calendar size={14} color="#64748b" />
                <Text style={styles.orderDate}>{formatDateTime(orderDate)}</Text>
              </View>
              
              {branchName && (
                <View style={styles.branchInfo}>
                  <Building size={14} color="#64748b" />
                  <Text style={styles.branchText}>{branchName}</Text>
                </View>
              )}
              
              {companyName && (
                <View style={styles.companyInfo}>
                  <Text style={styles.companyText}>{companyName}</Text>
                </View>
              )}
              
              {item.PO_Number && (
                <View style={styles.poInfo}>
                  <FileText size={14} color="#64748b" />
                  <Text style={styles.poText}>PO: {item.PO_Number}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.orderAmount}>
              <Text style={styles.amountText}>{formatCurrency(item.totalAmount || 0)}</Text>
              <Text style={styles.itemCount}>
                {Math.floor(Math.random() * 10) + 1} item{Math.floor(Math.random() * 10) + 1 !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          
          <View style={styles.orderFooter}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              {statusInfo.icon}
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
            
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(item, 'view')}
              >
                <Eye size={16} color="#667eea" />
              </TouchableOpacity>
              
              {canUpdateStatus && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => handleQuickAction(item, 'status')}
                >
                  <Edit3 size={16} color="#059669" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(item, 'download')}
              >
                <Download size={16} color="#f59e0b" />
              </TouchableOpacity>
              
              {canEditOrders && ['new', 'pending', 'processing'].includes((item.status || item.Order_Status || '').toLowerCase()) && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => handleQuickAction(item, 'cancel')}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {item.Remark && (
            <View style={styles.remarksSection}>
              <Text style={styles.remarksLabel}>Notes:</Text>
              <Text style={styles.remarksText} numberOfLines={2}>{item.Remark}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderStats = () => {
    const totalOrders = orders.length;
    const newOrders = orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'new').length;
    const processingOrders = orders.filter(o => ['processing', 'picked'].includes((o.status || o.Order_Status || '').toLowerCase())).length;
    const completedOrders = orders.filter(o => ['completed', 'dispatched'].includes((o.status || o.Order_Status || '').toLowerCase())).length;
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.statGradient}>
            <ShoppingCart size={20} color="#FFFFFF" />
            <Text style={styles.statNumber}>{totalOrders}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statGradient}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.statNumber}>{newOrders}</Text>
            <Text style={styles.statLabel}>New</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.statGradient}>
            <Package size={20} color="#FFFFFF" />
            <Text style={styles.statNumber}>{processingOrders}</Text>
            <Text style={styles.statLabel}>Processing</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient colors={['#10b981', '#059669']} style={styles.statGradient}>
            <CheckCircle size={20} color="#FFFFFF" />
            <Text style={styles.statNumber}>{completedOrders}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const filterOptions = [
    { key: 'all', label: 'All Orders', icon: ShoppingCart, count: orders.length },
    { key: 'new', label: 'New', icon: Plus, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'new').length },
    { key: 'pending', label: 'Pending', icon: Clock, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'pending').length },
    { key: 'processing', label: 'Processing', icon: Package, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'processing').length },
    { key: 'completed', label: 'Completed', icon: CheckCircle, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'completed').length },
    { key: 'hold', label: 'Hold', icon: AlertCircle, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'hold').length },
    { key: 'picked', label: 'Picked', icon: Package, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'picked').length },
    { key: 'dispatched', label: 'Dispatched', icon: Truck, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'dispatched').length },
    { key: 'cancelled', label: 'Cancelled', icon: AlertCircle, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'cancelled').length },
  ];

  const sortOptions = [
    { key: 'date_desc', label: 'Newest First', icon: ArrowUpDown },
    { key: 'date_asc', label: 'Oldest First', icon: ArrowUpDown },
    { key: 'amount_desc', label: 'Highest Amount', icon: DollarSign },
    { key: 'amount_asc', label: 'Lowest Amount', icon: DollarSign },
    { key: 'status', label: 'Status', icon: SlidersHorizontal },
  ];

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading orders..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadOrders} />;
  }

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
              <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
              <Text style={styles.headerSubtitle}>
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              {canCreateOrder && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreateOrder}
                >
                  <Plus size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Stats */}
      {renderStats()}

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders by number, retailer..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.filterButton, 
            (selectedFilter !== 'all' || selectedSort !== 'date_desc') && styles.filterButtonActive
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color={(selectedFilter !== 'all' || selectedSort !== 'date_desc') ? "#FFFFFF" : "#667eea"} />
          {(selectedFilter !== 'all' || selectedSort !== 'date_desc') && (
            <View style={styles.filterIndicator} />
          )}
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => (item.id || item.Order_Id || index).toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.emptyIcon}
            >
              <ShoppingCart size={48} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No orders found' : 'No orders yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : user?.role === 'retailer'
                ? 'Place your first order to get started'
                : 'Orders will appear here once created'}
            </Text>
            {canCreateOrder && !searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleCreateOrder}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.emptyButtonGradient}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.emptyButtonText}>Create First Order</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter & Sort Orders"
        filters={filterOptions}
        sorts={sortOptions}
        selectedFilter={selectedFilter}
        selectedSort={selectedSort}
        onFilterSelect={(filter) => setSelectedFilter(filter as FilterType)}
        onSortSelect={(sort) => setSelectedSort(sort as SortType)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statGradient: {
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  listContent: {
    paddingBottom: 120,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginRight: 12,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
  },
  retailerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  retailerName: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  contactInfo: {
    marginBottom: 6,
  },
  contactText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 20,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
  },
  branchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  branchText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
  },
  companyInfo: {
    marginBottom: 4,
  },
  companyText: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '600',
    marginLeft: 20,
  },
  poInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 6,
  },
  orderAmount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 12,
    color: '#64748b',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  remarksSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  remarksLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});