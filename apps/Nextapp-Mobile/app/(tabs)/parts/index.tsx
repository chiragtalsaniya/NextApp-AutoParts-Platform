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
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { FilterModal } from '@/components/FilterModal';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Part } from '@/types/api';
import { 
  Package, 
  TriangleAlert as AlertTriangle, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Award, 
  Zap, 
  Search, 
  X, 
  Filter, 
  ShoppingCart, 
  Minus,
  Eye,
  CreditCard as Edit3,
  ArrowUpDown,
  DollarSign,
  Calendar,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface CartItem {
  part: Part;
  quantity: number;
}

type FilterType = 'all' | 'low_stock' | 'high_demand' | 'new' | 'quick_order' | 'discounted';
type SortType = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'category' | 'date_desc';

export default function PartsScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedSort, setSelectedSort] = useState<SortType>('name_asc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const canManageParts = ['super_admin', 'admin', 'manager'].includes(user?.role || '');
  const canAddToCart = ['admin', 'manager', 'salesman'].includes(user?.role || '');

  useEffect(() => {
    loadParts();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [parts, searchQuery, selectedFilter, selectedSort]);

  const loadParts = async () => {
    try {
      setError(null);
      const response = await apiService.getParts({ limit: 100 });
      const partsData = response.parts || response.data || [];
      setParts(partsData);
    } catch (error: any) {
      setError(error.error || 'Failed to load parts');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadParts();
  };

  const applyFiltersAndSort = () => {
    let filtered = [...parts];

    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (part) =>
          part.Part_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.Part_Number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.Part_Catagory.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.Focus_Group.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'low_stock':
        filtered = filtered.filter(part => getStockStatus(part).isLowStock);
        break;
      case 'high_demand':
        filtered = filtered.filter(part => part.GuruPoint > 0 || part.ChampionPoint > 0);
        break;
      case 'new':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(part => new Date(part.created_at) > thirtyDaysAgo);
        break;
      case 'quick_order':
        filtered = filtered.filter(part => part.Is_Order_Pad === 1);
        break;
      case 'discounted':
        filtered = filtered.filter(part => 
          part.Part_BasicDisc > 0 || part.Part_SchemeDisc > 0 || part.Part_AdditionalDisc > 0
        );
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'name_asc':
          return a.Part_Name.localeCompare(b.Part_Name);
        case 'name_desc':
          return b.Part_Name.localeCompare(a.Part_Name);
        case 'price_asc':
          return a.Part_Price - b.Part_Price;
        case 'price_desc':
          return b.Part_Price - a.Part_Price;
        case 'category':
          return a.Part_Catagory.localeCompare(b.Part_Catagory);
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredParts(filtered);
  };

  const getStockStatus = (part: Part) => {
    const mockCurrentStock = Math.floor(Math.random() * (part.Part_MinQty * 3)) + 1;
    const isLowStock = mockCurrentStock <= part.Part_MinQty;
    
    return {
      currentStock: mockCurrentStock,
      isLowStock,
      status: isLowStock ? 'Low Stock' : 'In Stock',
      color: isLowStock ? '#ef4444' : '#10b981',
      bgColor: isLowStock ? '#fee2e2' : '#dcfce7',
    };
  };

  const getPartBadges = (part: Part) => {
    const badges = [];
    
    if (part.GuruPoint > 0) {
      badges.push({
        icon: <Award size={12} color="#f59e0b" />,
        text: 'Guru',
        color: '#f59e0b',
        bgColor: '#fef3c7',
      });
    }
    
    if (part.ChampionPoint > 0) {
      badges.push({
        icon: <Star size={12} color="#8b5cf6" />,
        text: 'Champion',
        color: '#8b5cf6',
        bgColor: '#ede9fe',
      });
    }
    
    if (part.Is_Order_Pad === 1) {
      badges.push({
        icon: <Zap size={12} color="#10b981" />,
        text: 'Quick Order',
        color: '#10b981',
        bgColor: '#dcfce7',
      });
    }
    
    return badges;
  };

  const getDiscountInfo = (part: Part) => {
    const totalDiscount = part.Part_BasicDisc + part.Part_SchemeDisc + part.Part_AdditionalDisc;
    if (totalDiscount > 0) {
      return {
        percentage: totalDiscount,
        finalPrice: part.Part_Price * (1 - totalDiscount / 100),
      };
    }
    return null;
  };

  const addToCart = (part: Part) => {
    const existingItem = cart.find(item => item.part.Part_Number === part.Part_Number);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.part.Part_Number === part.Part_Number
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { part, quantity: 1 }]);
    }
    
    showToast(`${part.Part_Name} added to cart`, 'success', 2000);
  };

  const updateCartQuantity = (partNumber: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.part.Part_Number !== partNumber));
    } else {
      setCart(cart.map(item =>
        item.part.Part_Number === partNumber
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const discountInfo = getDiscountInfo(item.part);
      const price = discountInfo ? discountInfo.finalPrice : item.part.Part_Price;
      return total + (price * item.quantity);
    }, 0);
  };

  const proceedToOrder = () => {
    if (cart.length === 0) {
      showToast('Please add items to your cart before proceeding', 'warning');
      return;
    }
    
    // Navigate to order creation with cart items
    router.push({
      pathname: '/(tabs)/orders/create',
      params: { cartItems: JSON.stringify(cart) }
    });
    setShowCart(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderPartItem = ({ item, index }: { item: Part; index: number }) => {
    const stockStatus = getStockStatus(item);
    const badges = getPartBadges(item);
    const discountInfo = getDiscountInfo(item);
    const cartItem = cart.find(cartItem => cartItem.part.Part_Number === item.Part_Number);
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 50).duration(600)}>
        <View style={styles.partCard}>
          <TouchableOpacity
            style={styles.partContent}
            onPress={() => router.push(`/(tabs)/parts/${item.Part_Number}`)}
            activeOpacity={0.7}
          >
            <View style={styles.partHeader}>
              <View style={styles.partImageContainer}>
                {item.Part_Image ? (
                  <Image source={{ uri: item.Part_Image }} style={styles.partImage} />
                ) : (
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.partImagePlaceholder}
                  >
                    <Package size={28} color="#FFFFFF" />
                  </LinearGradient>
                )}
                
                <View style={[styles.stockIndicator, { backgroundColor: stockStatus.color }]}>
                  <Text style={styles.stockIndicatorText}>{stockStatus.currentStock}</Text>
                </View>
              </View>
              
              <View style={styles.partInfo}>
                <Text style={styles.partName} numberOfLines={2}>
                  {item.Part_Name}
                </Text>
                <Text style={styles.partNumber}>#{item.Part_Number}</Text>
                
                <View style={styles.categoryContainer}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.Part_Catagory}</Text>
                  </View>
                  <View style={styles.focusGroupBadge}>
                    <Text style={styles.focusGroupText}>{item.Focus_Group}</Text>
                  </View>
                </View>
                
                <View style={styles.badgesContainer}>
                  {badges.map((badge, badgeIndex) => (
                    <View
                      key={badgeIndex}
                      style={[styles.badge, { backgroundColor: badge.bgColor }]}
                    >
                      {badge.icon}
                      <Text style={[styles.badgeText, { color: badge.color }]}>
                        {badge.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.partPrice}>
                {discountInfo ? (
                  <View style={styles.discountPricing}>
                    <Text style={styles.originalPrice}>{formatCurrency(item.Part_Price)}</Text>
                    <Text style={styles.discountedPrice}>{formatCurrency(discountInfo.finalPrice)}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-{discountInfo.percentage}%</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.priceText}>{formatCurrency(item.Part_Price)}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.partFooter}>
              <View style={styles.stockInfo}>
                <View style={[
                  styles.stockStatusBadge,
                  { backgroundColor: stockStatus.bgColor }
                ]}>
                  {stockStatus.isLowStock && (
                    <AlertTriangle size={14} color={stockStatus.color} style={styles.stockIcon} />
                  )}
                  <Text style={[styles.stockText, { color: stockStatus.color }]}>
                    {stockStatus.status}
                  </Text>
                </View>
                
                <Text style={styles.minQtyText}>Min Qty: {item.Part_MinQty}</Text>
              </View>
              
              {item.Part_Application && item.Part_Application !== '0' && (
                <View style={styles.applicationInfo}>
                  <Text style={styles.applicationLabel}>Compatible:</Text>
                  <Text style={styles.applicationText} numberOfLines={2}>
                    {item.Part_Application}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => router.push(`/(tabs)/parts/${item.Part_Number}`)}
            >
              <Eye size={16} color="#667eea" />
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>

            {canManageParts && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push(`/(tabs)/parts/${item.Part_Number}?edit=true`)}
              >
                <Edit3 size={16} color="#059669" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}

            {canAddToCart && (
              <View style={styles.cartControls}>
                {cartItem ? (
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateCartQuantity(item.Part_Number, cartItem.quantity - 1)}
                    >
                      <Minus size={16} color="#667eea" />
                    </TouchableOpacity>
                    
                    <Text style={styles.quantityText}>{cartItem.quantity}</Text>
                    
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateCartQuantity(item.Part_Number, cartItem.quantity + 1)}
                    >
                      <Plus size={16} color="#667eea" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => addToCart(item)}
                  >
                    <ShoppingCart size={16} color="#FFFFFF" />
                    <Text style={styles.addToCartText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderStats = () => {
    const totalParts = parts.length;
    const lowStockParts = parts.filter(p => getStockStatus(p).isLowStock).length;
    const highDemandParts = parts.filter(p => p.GuruPoint > 0 || p.ChampionPoint > 0).length;
    const quickOrderParts = parts.filter(p => p.Is_Order_Pad === 1).length;
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.statGradient}>
            <Package size={20} color="#FFFFFF" />
            <Text style={styles.statNumber}>{totalParts}</Text>
            <Text style={styles.statLabel}>Total Parts</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.statGradient}>
            <AlertTriangle size={20} color="#FFFFFF" />
            <Text style={styles.statNumber}>{lowStockParts}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statGradient}>
            <TrendingUp size={20} color="#FFFFFF" />
            <Text style={styles.statNumber}>{highDemandParts}</Text>
            <Text style={styles.statLabel}>High Demand</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient colors={['#10b981', '#059669']} style={styles.statGradient}>
            <Zap size={20} color="#FFFFFF" />
            <Text style={styles.statNumber}>{quickOrderParts}</Text>
            <Text style={styles.statLabel}>Quick Order</Text>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const filterOptions = [
    { key: 'all', label: 'All Parts', icon: Package, count: parts.length },
    { key: 'low_stock', label: 'Low Stock', icon: AlertTriangle, count: parts.filter(p => getStockStatus(p).isLowStock).length },
    { key: 'high_demand', label: 'High Demand', icon: TrendingUp, count: parts.filter(p => p.GuruPoint > 0 || p.ChampionPoint > 0).length },
    { key: 'new', label: 'New Parts', icon: Star, count: parts.filter(p => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(p.created_at) > thirtyDaysAgo;
    }).length },
    { key: 'quick_order', label: 'Quick Order', icon: Zap, count: parts.filter(p => p.Is_Order_Pad === 1).length },
    { key: 'discounted', label: 'Discounted', icon: DollarSign, count: parts.filter(p => p.Part_BasicDisc > 0 || p.Part_SchemeDisc > 0 || p.Part_AdditionalDisc > 0).length },
  ];

  const sortOptions = [
    { key: 'name_asc', label: 'Name (A-Z)', icon: ArrowUpDown },
    { key: 'name_desc', label: 'Name (Z-A)', icon: ArrowUpDown },
    { key: 'price_asc', label: 'Price (Low to High)', icon: TrendingUp },
    { key: 'price_desc', label: 'Price (High to Low)', icon: TrendingDown },
    { key: 'category', label: 'Category', icon: Package },
    { key: 'date_desc', label: 'Newest First', icon: Calendar },
  ];

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading parts..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadParts} />;
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
              <Text style={styles.headerTitle}>
                {user?.role === 'retailer' ? 'Parts Catalog' : 'Parts Management'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {filteredParts.length} part{filteredParts.length !== 1 ? 's' : ''} available
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              {canAddToCart && cart.length > 0 && (
                <TouchableOpacity
                  style={styles.cartButton}
                  onPress={() => setShowCart(true)}
                >
                  <ShoppingCart size={24} color="#FFFFFF" />
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cart.length}</Text>
                  </View>
                </TouchableOpacity>
              )}
              
              {canManageParts && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => router.push('/(tabs)/parts/add')}
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
            placeholder="Search parts by name, number, category..."
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

      {/* Parts List */}
      <FlatList
        data={filteredParts}
        renderItem={renderPartItem}
        keyExtractor={(item) => item.Part_Number}
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
              <Package size={48} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No parts found' : 'No parts available'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try adjusting your search terms or filters'
                : 'Parts catalog is empty'}
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter & Sort Parts"
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
    gap: 12,
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
    paddingBottom: 160,
  },
  partCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  partContent: {
    padding: 20,
  },
  partHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  partImageContainer: {
    marginRight: 16,
    position: 'relative',
  },
  partImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  partImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stockIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  partInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  partName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 24,
  },
  partNumber: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  focusGroupBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  focusGroupText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  partPrice: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#059669',
  },
  discountPricing: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 14,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  discountBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  partFooter: {
    marginBottom: 16,
  },
  stockInfo: {
    marginBottom: 12,
  },
  stockStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  stockIcon: {
    marginRight: 6,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  minQtyText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  applicationInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  applicationLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  applicationText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#ede9fe',
    borderRadius: 12,
    gap: 6,
  },
  viewButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    gap: 6,
  },
  editButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  cartControls: {
    flex: 1,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    minWidth: 30,
    textAlign: 'center',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#667eea',
    borderRadius: 12,
    gap: 6,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 14,
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