import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { FilterModal } from '@/components/FilterModal';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  MapPin,
  Phone,
  Mail,
  Building,
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  Plus,
  CreditCard,
  Clock,
  Star,
  Search,
  X,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Retailer {
  Retailer_Id: number;
  RetailerCRMId?: string;
  Retailer_Name: string;
  RetailerImage?: string;
  Retailer_Address?: string;
  Retailer_Mobile?: string;
  Retailer_TFAT_Id?: string;
  Retailer_Status: number;
  Area_Name?: string;
  Contact_Person?: string;
  Pincode?: string;
  Mobile_Order?: string;
  Mobile_Account?: string;
  Owner_Mobile?: string;
  Area_Id: number;
  GST_No?: string;
  Credit_Limit: string;
  Type_Id?: number;
  Confirm: number;
  Retailer_Tour_Id?: number;
  Retailer_Email?: string;
  latitude?: number;
  logitude?: number;
  Last_Sync?: number;
  created_at: string;
  updated_at: string;
}

type FilterType = 'all' | 'active' | 'pending' | 'inactive' | 'high_credit' | 'new';
type SortType = 'name_asc' | 'name_desc' | 'credit_desc' | 'credit_asc' | 'date_desc' | 'date_asc';

export default function RetailersScreen() {
  const { user } = useAuth();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [filteredRetailers, setFilteredRetailers] = useState<Retailer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedSort, setSelectedSort] = useState<SortType>('name_asc');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const canManageRetailers = ['super_admin', 'admin', 'manager', 'salesman'].includes(
    user?.role || ''
  );

  useEffect(() => {
    loadRetailers();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [retailers, searchQuery, selectedFilter, selectedSort]);

  const loadRetailers = async () => {
    try {
      setError(null);
      const response = await apiService.getRetailers({ limit: 100 });
      const retailerData = response.retailers || response.data || [];
      setRetailers(retailerData);
    } catch (error: any) {
      setError(error.error || 'Failed to load retailers');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRetailers();
  };

  const applyFiltersAndSort = () => {
    let filtered = [...retailers];

    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (retailer) =>
          retailer.Retailer_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (retailer.Contact_Person && retailer.Contact_Person.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (retailer.Area_Name && retailer.Area_Name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (retailer.Retailer_Email && retailer.Retailer_Email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    switch (selectedFilter) {
      case 'active':
        filtered = filtered.filter(r => r.Retailer_Status === 1 && r.Confirm === 1);
        break;
      case 'pending':
        filtered = filtered.filter(r => r.Confirm === 0);
        break;
      case 'inactive':
        filtered = filtered.filter(r => r.Retailer_Status === 0);
        break;
      case 'high_credit':
        filtered = filtered.filter(r => parseFloat(r.Credit_Limit) >= 10000);
        break;
      case 'new':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(r => new Date(r.created_at) > thirtyDaysAgo);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'name_asc':
          return a.Retailer_Name.localeCompare(b.Retailer_Name);
        case 'name_desc':
          return b.Retailer_Name.localeCompare(a.Retailer_Name);
        case 'credit_desc':
          return parseFloat(b.Credit_Limit) - parseFloat(a.Credit_Limit);
        case 'credit_asc':
          return parseFloat(a.Credit_Limit) - parseFloat(b.Credit_Limit);
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredRetailers(filtered);
  };

  const getStatusInfo = (retailer: Retailer) => {
    if (!retailer.Confirm) {
      return {
        icon: <Clock size={16} color="#f59e0b" />,
        text: 'Pending',
        color: '#f59e0b',
        bgColor: '#fef3c7',
      };
    }
    
    if (retailer.Retailer_Status === 1) {
      return {
        icon: <CheckCircle size={16} color="#10b981" />,
        text: 'Active',
        color: '#10b981',
        bgColor: '#dcfce7',
      };
    }
    
    return {
      icon: <AlertCircle size={16} color="#ef4444" />,
      text: 'Inactive',
      color: '#ef4444',
      bgColor: '#fee2e2',
    };
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount || '0');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleRetailerPress = (retailer: Retailer) => {
    Alert.alert(
      retailer.Retailer_Name,
      `Contact: ${retailer.Contact_Person || 'N/A'}\nEmail: ${retailer.Retailer_Email || 'N/A'}\nCreated: ${formatDate(retailer.created_at)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Details', onPress: () => {} },
      ]
    );
  };

  const renderRetailerItem = ({ item, index }: { item: Retailer; index: number }) => {
    const statusInfo = getStatusInfo(item);
    const isSpecialRetailer = item.Retailer_Name.toLowerCase().includes('counter');
    const creditAmount = parseFloat(item.Credit_Limit);
    const isHighCredit = creditAmount >= 10000;
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 50).duration(600)}>
        <TouchableOpacity
          style={styles.retailerCard}
          onPress={() => handleRetailerPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.retailerHeader}>
            <View style={styles.retailerImageContainer}>
              {item.RetailerImage ? (
                <Image source={{ uri: item.RetailerImage }} style={styles.retailerImage} />
              ) : (
                <LinearGradient
                  colors={isSpecialRetailer ? ['#f59e0b', '#d97706'] : ['#667eea', '#764ba2']}
                  style={styles.retailerImagePlaceholder}
                >
                  {isSpecialRetailer ? (
                    <Star size={28} color="#FFFFFF" />
                  ) : (
                    <Building size={28} color="#FFFFFF" />
                  )}
                </LinearGradient>
              )}
            </View>
            
            <View style={styles.retailerInfo}>
              <Text style={styles.businessName} numberOfLines={2}>
                {item.Retailer_Name}
              </Text>
              {item.Contact_Person && item.Contact_Person !== '0' && (
                <Text style={styles.contactName}>{item.Contact_Person}</Text>
              )}
              {item.Retailer_TFAT_Id && item.Retailer_TFAT_Id !== 'counter' && (
                <Text style={styles.tfatId}>ID: {item.Retailer_TFAT_Id}</Text>
              )}
            </View>
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                {statusInfo.icon}
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.text}
                </Text>
              </View>
              {isHighCredit && (
                <View style={styles.highCreditBadge}>
                  <TrendingUp size={12} color="#059669" />
                  <Text style={styles.highCreditText}>High Credit</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.retailerDetails}>
            {item.Area_Name && item.Area_Name !== '0' && (
              <View style={styles.detailRow}>
                <MapPin size={14} color="#64748b" />
                <Text style={styles.detailText}>{item.Area_Name}</Text>
              </View>
            )}
            
            {item.Retailer_Mobile && item.Retailer_Mobile !== '0' && (
              <View style={styles.detailRow}>
                <Phone size={14} color="#64748b" />
                <Text style={styles.detailText}>{item.Retailer_Mobile}</Text>
              </View>
            )}
            
            {item.Retailer_Email && item.Retailer_Email !== '0' && (
              <View style={styles.detailRow}>
                <Mail size={14} color="#64748b" />
                <Text style={styles.detailText}>{item.Retailer_Email}</Text>
              </View>
            )}
          </View>
          
          {canManageRetailers && (
            <View style={styles.creditInfo}>
              <View style={styles.creditItem}>
                <CreditCard size={16} color="#667eea" />
                <View style={styles.creditDetails}>
                  <Text style={styles.creditLabel}>Credit Limit</Text>
                  <Text style={[
                    styles.creditAmount,
                    { color: isHighCredit ? '#059669' : '#667eea' }
                  ]}>
                    {formatCurrency(item.Credit_Limit)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.joinedDate}>
                <Text style={styles.joinedLabel}>Joined</Text>
                <Text style={styles.joinedText}>{formatDate(item.created_at)}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderStats = () => {
    const totalRetailers = retailers.length;
    const activeRetailers = retailers.filter(r => r.Retailer_Status === 1 && r.Confirm === 1).length;
    const pendingRetailers = retailers.filter(r => r.Confirm === 0).length;
    const highCreditRetailers = retailers.filter(r => parseFloat(r.Credit_Limit) >= 10000).length;
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.statGradient}>
            <Users size={20} color="#FFFFFF" />
            <Text style={styles.statNumber}>{totalRetailers}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient colors={['#10b981', '#059669']} style={styles.statGradient}>
            <CheckCircle size={20} color="#FFFFFF" />
            <Text style={styles.statNumber}>{activeRetailers}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statGradient}>
            <Clock size={20} color="#FFFFFF" />
            <Text style={styles.statNumber}>{pendingRetailers}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.statGradient}>
            <TrendingUp size={20} color="#FFFFFF" />
            <Text style={styles.statNumber}>{highCreditRetailers}</Text>
            <Text style={styles.statLabel}>High Credit</Text>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const filterOptions = [
    { key: 'all', label: 'All Retailers', icon: Users, count: retailers.length },
    { key: 'active', label: 'Active', icon: CheckCircle, count: retailers.filter(r => r.Retailer_Status === 1 && r.Confirm === 1).length },
    { key: 'pending', label: 'Pending', icon: Clock, count: retailers.filter(r => r.Confirm === 0).length },
    { key: 'inactive', label: 'Inactive', icon: AlertCircle, count: retailers.filter(r => r.Retailer_Status === 0).length },
    { key: 'high_credit', label: 'High Credit', icon: TrendingUp, count: retailers.filter(r => parseFloat(r.Credit_Limit) >= 10000).length },
    { key: 'new', label: 'New (30 days)', icon: Star, count: retailers.filter(r => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(r.created_at) > thirtyDaysAgo;
    }).length },
  ];

  const sortOptions = [
    { key: 'name_asc', label: 'Name (A-Z)', icon: ArrowUpDown },
    { key: 'name_desc', label: 'Name (Z-A)', icon: ArrowUpDown },
    { key: 'credit_desc', label: 'Highest Credit', icon: TrendingUp },
    { key: 'credit_asc', label: 'Lowest Credit', icon: TrendingDown },
    { key: 'date_desc', label: 'Newest First', icon: ArrowUpDown },
    { key: 'date_asc', label: 'Oldest First', icon: ArrowUpDown },
  ];

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading retailers..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadRetailers} />;
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
              <Text style={styles.headerTitle}>Retailers</Text>
              <Text style={styles.headerSubtitle}>
                {filteredRetailers.length} retailer{filteredRetailers.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              {canManageRetailers && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => Alert.alert('Add Retailer', 'Feature coming soon!')}
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
            placeholder="Search retailers by name, contact, area..."
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
            (selectedFilter !== 'all' || selectedSort !== 'name_asc') && styles.filterButtonActive
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color={(selectedFilter !== 'all' || selectedSort !== 'name_asc') ? "#FFFFFF" : "#667eea"} />
          {(selectedFilter !== 'all' || selectedSort !== 'name_asc') && (
            <View style={styles.filterIndicator} />
          )}
        </TouchableOpacity>
      </View>

      {/* Retailers List */}
      <FlatList
        data={filteredRetailers}
        renderItem={renderRetailerItem}
        keyExtractor={(item) => item.Retailer_Id.toString()}
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
              <Users size={48} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No retailers found' : 'No retailers yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try adjusting your search terms or filters'
                : 'Retailers will appear here once added'}
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter & Sort Retailers"
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
  addButton: {
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
  retailerCard: {
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
  retailerHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  retailerImageContainer: {
    marginRight: 16,
  },
  retailerImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
  },
  retailerImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retailerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 24,
  },
  contactName: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  tfatId: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },
  statusContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  highCreditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  highCreditText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  retailerDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
    fontWeight: '400',
  },
  creditInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  creditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creditDetails: {
    marginLeft: 8,
  },
  creditLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  creditAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  joinedDate: {
    alignItems: 'flex-end',
  },
  joinedLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  joinedText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
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
  },
});