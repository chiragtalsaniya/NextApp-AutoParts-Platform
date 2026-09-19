import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { FilterModal } from '@/components/FilterModal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Plus,
  Minus,
  Trash2,
  Package,
  ShoppingCart,
  User,
  Search,
  X,
  Check,
  ArrowLeft,
  Building,
  CreditCard,
  FileText,
  Save,
  Store,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  Zap,
  DollarSign,
  Calendar,
  Award,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

interface Part {
  partNumber: string;
  name: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  image?: string;
  Part_Number?: string;
  Part_Name?: string;
  Part_Price?: number;
  Part_Catagory?: string;
  Part_Image?: string;
}

interface Retailer {
  Retailer_Id: number;
  Retailer_Name: string;
  Contact_Person?: string;
  Retailer_Email?: string;
  Credit_Limit: string;
}

interface Store {
  Branch_Code?: string;
  Branch_Name?: string;
  branchCode?: string;
  name?: string;
  companyId?: string;
  Company_Name?: string;
  Branch_Address?: string;
  Branch_Phone?: string;
  Branch_Email?: string;
  Branch_Manager?: string;
  address?: string;
}

interface OrderItem {
  part: Part;
  quantity: number;
  totalPrice: number;
}

type CreateOrderStep = 'store' | 'retailer' | 'parts' | 'review';

type PartsFilterType = 'all' | 'low_stock' | 'high_demand' | 'new' | 'quick_order' | 'discounted';
type PartsSortType = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'category' | 'date_desc';

export default function CreateOrderScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { cartItems } = useLocalSearchParams<{ cartItems?: string }>();
  
  const [step, setStep] = useState<CreateOrderStep>('store');
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartsFilter, setSelectedPartsFilter] = useState<PartsFilterType>('all');
  const [selectedPartsSort, setSelectedPartsSort] = useState<PartsSortType>('name_asc');
  const [showPartsFilterModal, setShowPartsFilterModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Order details
  const [poNumber, setPONumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  // Check if user needs to select a store
  const needsStoreSelection = ['super_admin', 'admin', 'manager'].includes(user?.role || '');

  useEffect(() => {
    // Initialize with cart items if provided
    if (cartItems) {
      try {
        const parsedCartItems = JSON.parse(cartItems);
        const convertedItems = parsedCartItems.map((item: any) => ({
          part: {
            partNumber: item.part.Part_Number,
            name: item.part.Part_Name,
            category: item.part.Part_Catagory,
            unitPrice: item.part.Part_Price,
            currentStock: (item.part.T1 || 0) + (item.part.T2 || 0) + (item.part.T3 || 0) + (item.part.T4 || 0) + (item.part.T5 || 0),
            image: item.part.Part_Image,
            Part_Number: item.part.Part_Number,
            Part_Name: item.part.Part_Name,
            Part_Price: item.part.Part_Price,
            Part_Catagory: item.part.Part_Catagory,
            Part_Image: item.part.Part_Image,
          },
          quantity: item.quantity,
          totalPrice: item.part.Part_Price * item.quantity,
        }));
        setOrderItems(convertedItems);
      } catch (error) {
        console.error('Failed to parse cart items:', error);
      }
    }

    // For non-admin users, set the store from their profile
    if (!needsStoreSelection && user?.storeId) {
      setSelectedStore({
        branchCode: user.storeId,
        name: `Store ${user.storeId}`,
        companyId: user.companyId,
      });
      setStep('retailer');
    }
  }, [cartItems, user, needsStoreSelection]);

  useEffect(() => {
    if (step === 'store') {
      loadStores();
    } else if (step === 'retailer') {
      loadRetailers();
    } else if (step === 'parts') {
      loadParts();
    }
  }, [step]);

  const loadStores = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let storesData = [];
      
      if (user?.companyId) {
        // If user has a company ID, load stores for that company
        const response = await apiService.getStoresByCompany(user.companyId);
        storesData = response.stores || [];
      } else {
        // Otherwise load all stores
        const response = await apiService.getStores();
        storesData = response.stores || response.data || [];
      }
      
      // Map the API response to our Store interface
      const mappedStores = storesData.map((store: any) => ({
        branchCode: store.Branch_Code,
        name: store.Branch_Name,
        companyId: store.company_id,
        address: store.Branch_Address,
        Branch_Code: store.Branch_Code,
        Branch_Name: store.Branch_Name,
        Company_Name: store.Company_Name,
        Branch_Address: store.Branch_Address,
        Branch_Phone: store.Branch_Phone,
        Branch_Email: store.Branch_Email,
        Branch_Manager: store.Branch_Manager,
      }));
      
      setStores(mappedStores);
    } catch (error: any) {
      setError(error.error || 'Failed to load stores');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRetailers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getRetailers({ limit: 100 });
      const retailerData = response.retailers || response.data || [];
      setRetailers(retailerData);
    } catch (error: any) {
      setError(error.error || 'Failed to load retailers');
    } finally {
      setIsLoading(false);
    }
  };

  const loadParts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getParts({ limit: 100 });
      const partsData = response.parts || response.data || [];
      
      // Convert API parts to our interface
      const convertedParts = partsData.map((part: any) => ({
        partNumber: part.Part_Number,
        name: part.Part_Name,
        category: part.Part_Catagory,
        unitPrice: part.Part_Price,
        currentStock: (part.T1 || 0) + (part.T2 || 0) + (part.T3 || 0) + (part.T4 || 0) + (part.T5 || 0),
        image: part.Part_Image,
        Part_Number: part.Part_Number,
        Part_Name: part.Part_Name,
        Part_Price: part.Part_Price,
        Part_Catagory: part.Part_Catagory,
        Part_Image: part.Part_Image,
      }));
      
      setParts(convertedParts);
    } catch (error: any) {
      setError(error.error || 'Failed to load parts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
    setStep('retailer');
  };

  const handleRetailerSelect = (retailer: Retailer) => {
    setSelectedRetailer(retailer);
    if (orderItems.length > 0) {
      setStep('review');
    } else {
      setStep('parts');
    }
  };

  const addToOrder = (part: Part) => {
    const existingItem = orderItems.find(item => 
      item.part.partNumber === part.partNumber || 
      item.part.Part_Number === part.Part_Number
    );
    
    if (existingItem) {
      updateQuantity(part.partNumber || part.Part_Number || '', existingItem.quantity + 1);
    } else {
      const newItem: OrderItem = {
        part,
        quantity: 1,
        totalPrice: part.unitPrice || part.Part_Price || 0,
      };
      setOrderItems([...orderItems, newItem]);
    }
  };

  const updateQuantity = (partNumber: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(partNumber);
      return;
    }

    setOrderItems(items =>
      items.map(item =>
        (item.part.partNumber === partNumber || item.part.Part_Number === partNumber)
          ? { 
              ...item, 
              quantity: newQuantity, 
              totalPrice: (item.part.unitPrice || item.part.Part_Price || 0) * newQuantity 
            }
          : item
      )
    );
  };

  const removeFromOrder = (partNumber: string) => {
    setOrderItems(items => items.filter(item => 
      item.part.partNumber !== partNumber && item.part.Part_Number !== partNumber
    ));
  };

  const getOrderTotal = () => {
    return orderItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSubmitOrder = async () => {
    if (!selectedRetailer || !selectedStore || orderItems.length === 0) {
      showToast('Please select a retailer, store, and add items to the order', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        retailer_id: selectedRetailer.Retailer_Id,
        branch: selectedStore.branchCode || selectedStore.Branch_Code,
        po_number: poNumber || `PO-${Date.now()}`,
        po_date: new Date().toISOString(),
        urgent: isUrgent,
        remark: notes || 'Order created via mobile app',
        items: orderItems.map(item => ({
          part_number: item.part.partNumber || item.part.Part_Number,
          part_name: item.part.name || item.part.Part_Name,
          quantity: item.quantity,
          mrp: item.part.unitPrice || item.part.Part_Price,
          basic_discount: 0,
          scheme_discount: 0,
          additional_discount: 0,
          urgent: false,
        })),
      };

      await apiService.createOrder(orderData);
      
      showToast('Order created successfully!', 'success');
      
      // Navigate back to orders list after a short delay
      setTimeout(() => {
        router.replace('/(tabs)/orders');
      }, 1500);
      
    } catch (error: any) {
      showToast(error.error || 'Failed to create order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackPress = () => {
    switch (step) {
      case 'retailer':
        if (needsStoreSelection) {
          setStep('store');
        } else {
          router.back();
        }
        setSearchQuery('');
        break;
      case 'parts':
        setStep('retailer');
        setSearchQuery('');
        break;
      case 'review':
        setStep(orderItems.length > 0 ? 'parts' : 'retailer');
        break;
      default:
        router.back();
    }
  };

  const renderStoreStep = () => {
    const filteredStores = stores.filter(store =>
      (store.name && store.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (store.Branch_Name && store.Branch_Name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (store.branchCode && store.branchCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (store.Branch_Code && store.Branch_Code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (store.address && store.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (store.Branch_Address && store.Branch_Address.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <View style={styles.stepContainer}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search stores..."
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
        </View>

        <FlatList
          data={filteredStores}
          keyExtractor={(item) => item.branchCode || item.Branch_Code || ''}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(index * 100).duration(600)}>
              <TouchableOpacity
                style={styles.storeCard}
                onPress={() => handleStoreSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.storeInfo}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.storeIcon}
                  >
                    <Store size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.storeDetails}>
                    <Text style={styles.storeName}>{item.name || item.Branch_Name}</Text>
                    <Text style={styles.storeCode}>Branch Code: {item.branchCode || item.Branch_Code}</Text>
                    {(item.address || item.Branch_Address) && (
                      <Text style={styles.storeAddress}>{item.address || item.Branch_Address}</Text>
                    )}
                  </View>
                  <View style={styles.selectButton}>
                    <Check size={20} color="#10b981" />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No stores found' : 'No stores available'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search terms' : 'Please add stores to continue'}
              </Text>
            </View>
          }
        />
      </View>
    );
  };

  const renderRetailerStep = () => {
    const filteredRetailers = retailers.filter(retailer =>
      retailer.Retailer_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (retailer.Contact_Person && retailer.Contact_Person.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <View style={styles.stepContainer}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search retailers..."
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
        </View>

        <FlatList
          data={filteredRetailers}
          keyExtractor={(item) => item.Retailer_Id.toString()}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(index * 100).duration(600)}>
              <TouchableOpacity
                style={styles.retailerCard}
                onPress={() => handleRetailerSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.retailerInfo}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.retailerIcon}
                  >
                    <User size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.retailerDetails}>
                    <Text style={styles.retailerName}>{item.Retailer_Name}</Text>
                    {item.Contact_Person && item.Contact_Person !== '0' && (
                      <Text style={styles.contactPerson}>{item.Contact_Person}</Text>
                    )}
                    <Text style={styles.creditLimit}>
                      Credit Limit: {formatCurrency(parseFloat(item.Credit_Limit))}
                    </Text>
                  </View>
                  <View style={styles.selectButton}>
                    <Check size={20} color="#667eea" />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No retailers found' : 'No retailers available'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search terms' : 'Please add retailers to continue'}
              </Text>
            </View>
          }
        />
      </View>
    );
  };

  const getPartStockStatus = (part: Part) => {
    const currentStock = part.currentStock || 0;
    const minQty = 5;
    const isLowStock = currentStock <= minQty;
    return {
      currentStock,
      isLowStock,
    };
  };

  const renderPartsStep = () => {
    let filteredParts = [...parts];

    // Apply search filter
    if (searchQuery.trim() !== '') {
      filteredParts = filteredParts.filter(part =>
        (part.name && part.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (part.Part_Name && part.Part_Name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (part.partNumber && part.partNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (part.Part_Number && part.Part_Number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (part.category && part.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (part.Part_Catagory && part.Part_Catagory.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    switch (selectedPartsFilter) {
      case 'low_stock':
        filteredParts = filteredParts.filter(part => getPartStockStatus(part).isLowStock);
        break;
      case 'high_demand':
        filteredParts = filteredParts.filter(part => {
          const guruPoint = (part as any).GuruPoint || 0;
          const championPoint = (part as any).ChampionPoint || 0;
          return guruPoint > 0 || championPoint > 0;
        });
        break;
      case 'new':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filteredParts = filteredParts.filter(part => {
          const createdAt = (part as any).created_at;
          return createdAt && new Date(createdAt) > thirtyDaysAgo;
        });
        break;
      case 'quick_order':
        filteredParts = filteredParts.filter(part => (part as any).Is_Order_Pad === 1);
        break;
      case 'discounted':
        filteredParts = filteredParts.filter(part => {
          const basicDisc = (part as any).Part_BasicDisc || 0;
          const schemeDisc = (part as any).Part_SchemeDisc || 0;
          const additionalDisc = (part as any).Part_AdditionalDisc || 0;
          return basicDisc > 0 || schemeDisc > 0 || additionalDisc > 0;
        });
        break;
    }

    // Apply sorting
    filteredParts.sort((a, b) => {
      switch (selectedPartsSort) {
        case 'name_asc':
          return (a.name || a.Part_Name || '').localeCompare(b.name || b.Part_Name || '');
        case 'name_desc':
          return (b.name || b.Part_Name || '').localeCompare(a.name || a.Part_Name || '');
        case 'price_asc':
          return (a.unitPrice || a.Part_Price || 0) - (b.unitPrice || b.Part_Price || 0);
        case 'price_desc':
          return (b.unitPrice || b.Part_Price || 0) - (a.unitPrice || a.Part_Price || 0);
        case 'category':
          return (a.category || a.Part_Catagory || '').localeCompare(b.category || b.Part_Catagory || '');
        case 'date_desc':
          const dateA = new Date((a as any).created_at || 0).getTime();
          const dateB = new Date((b as any).created_at || 0).getTime();
          return dateB - dateA;
        default:
          return 0;
      }
    });

    return (
      <View style={styles.stepContainer}>
        {/* Search and Filter */}
        <View style={styles.partsSearchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search parts..."
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
              (selectedPartsFilter !== 'all' || selectedPartsSort !== 'name_asc') && styles.filterButtonActive
            ]}
            onPress={() => setShowPartsFilterModal(true)}
          >
            <Filter size={20} color={(selectedPartsFilter !== 'all' || selectedPartsSort !== 'name_asc') ? "#FFFFFF" : "#667eea"} />
            {(selectedPartsFilter !== 'all' || selectedPartsSort !== 'name_asc') && (
              <View style={styles.filterIndicator} />
            )}
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredParts}
          keyExtractor={(item) => item.partNumber || item.Part_Number || ''}
          renderItem={({ item, index }) => {
            const partNumber = item.partNumber || item.Part_Number || '';
            const orderItem = orderItems.find(oi => 
              oi.part.partNumber === partNumber || 
              oi.part.Part_Number === partNumber
            );
            const quantity = orderItem?.quantity || 0;

            return (
              <Animated.View entering={FadeInUp.delay(index * 100).duration(600)}>
                <View style={styles.partCard}>
                  <View style={styles.partHeader}>
                    <View style={styles.partImageContainer}>
                      {(item.image || item.Part_Image) ? (
                        <Image source={{ uri: item.image || item.Part_Image }} style={styles.partImage} />
                      ) : (
                        <LinearGradient
                          colors={['#667eea', '#764ba2']}
                          style={styles.partImagePlaceholder}
                        >
                          <Package size={28} color="#FFFFFF" />
                        </LinearGradient>
                      )}
                    </View>
                    
                    <View style={styles.partInfo}>
                      <Text style={styles.partName} numberOfLines={2}>
                        {item.name || item.Part_Name}
                      </Text>
                      <Text style={styles.partNumber}>#{item.partNumber || item.Part_Number}</Text>
                      
                      <View style={styles.categoryContainer}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{item.category || item.Part_Catagory}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.partStock}>{item.currentStock || 0} in stock</Text>
                    </View>
                    
                    <View style={styles.partPrice}>
                      <Text style={styles.priceText}>{formatCurrency(item.unitPrice || item.Part_Price || 0)}</Text>
                    </View>
                  </View>

                  <View style={styles.partActions}>
                    {quantity > 0 ? (
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(partNumber, quantity - 1)}
                        >
                          <Minus size={16} color="#667eea" />
                        </TouchableOpacity>
                        
                        <Text style={styles.quantityText}>{quantity}</Text>
                        
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(partNumber, quantity + 1)}
                        >
                          <Plus size={16} color="#667eea" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeFromOrder(partNumber)}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => addToOrder(item)}
                      >
                        <LinearGradient
                          colors={['#667eea', '#764ba2']}
                          style={styles.addButtonGradient}
                        >
                          <Plus size={16} color="#FFFFFF" />
                          <Text style={styles.addButtonText}>Add to Order</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Animated.View>
            );
          }}
          contentContainerStyle={[
            styles.listContent, 
            { paddingBottom: orderItems.length > 0 ? 180 : 100 }
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {searchQuery || selectedPartsFilter !== 'all' ? 'No parts found' : 'No parts available'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedPartsFilter !== 'all' ? 'Try adjusting your search terms or filters' : 'Parts will appear here once added'}
              </Text>
            </View>
          }
        />

        {orderItems.length > 0 && (
          <View style={styles.orderSummary}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <Text style={styles.summaryTotal}>{formatCurrency(getOrderTotal())}</Text>
              </View>
              <Text style={styles.summaryItems}>
                {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} • {orderItems.reduce((sum, item) => sum + item.quantity, 0)} total quantity
              </Text>
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => setStep('review')}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.reviewButtonGradient}
                >
                  <Text style={styles.reviewButtonText}>Review Order</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const partsFilterOptions = [
    { key: 'all', label: 'All Parts', icon: Package, count: parts.length },
    { key: 'low_stock', label: 'Low Stock', icon: AlertTriangle, count: parts.filter(p => getPartStockStatus(p).isLowStock).length },
    { key: 'high_demand', label: 'High Demand', icon: TrendingUp, count: parts.filter(p => {
      const guruPoint = (p as any).GuruPoint || 0;
      const championPoint = (p as any).ChampionPoint || 0;
      return guruPoint > 0 || championPoint > 0;
    }).length },
    { key: 'new', label: 'New Parts', icon: Star, count: parts.filter(p => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return (p as any).created_at && new Date((p as any).created_at) > thirtyDaysAgo;
    }).length },
    { key: 'quick_order', label: 'Quick Order', icon: Zap, count: parts.filter(p => (p as any).Is_Order_Pad === 1).length },
    { key: 'discounted', label: 'Discounted', icon: DollarSign, count: parts.filter(p => {
      const basicDisc = (p as any).Part_BasicDisc || 0;
      const schemeDisc = (p as any).Part_SchemeDisc || 0;
      const additionalDisc = (p as any).Part_AdditionalDisc || 0;
      return basicDisc > 0 || schemeDisc > 0 || additionalDisc > 0;
    }).length },
  ];

  const partsSortOptions = [
    { key: 'name_asc', label: 'Name (A-Z)', icon: ArrowUpDown },
    { key: 'name_desc', label: 'Name (Z-A)', icon: ArrowUpDown },
    { key: 'price_asc', label: 'Price (Low to High)', icon: TrendingUp },
    { key: 'price_desc', label: 'Price (High to Low)', icon: TrendingDown },
    { key: 'category', label: 'Category', icon: Package },
    { key: 'date_desc', label: 'Newest First', icon: Calendar },
  ];

  const renderReviewStep = () => {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView style={styles.stepContainer} contentContainerStyle={styles.reviewContent}>
          {/* Store Info */}
          <Animated.View entering={FadeInUp.delay(0).duration(600)}>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewSectionTitle}>Store</Text>
              <View style={styles.storeReview}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.storeIcon}
                >
                  <Store size={24} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.storeDetails}>
                  <Text style={styles.storeName}>{selectedStore?.name || selectedStore?.Branch_Name}</Text>
                  <Text style={styles.storeCode}>Branch Code: {selectedStore?.branchCode || selectedStore?.Branch_Code}</Text>
                  {(selectedStore?.address || selectedStore?.Branch_Address) && (
                    <Text style={styles.storeAddress}>{selectedStore?.address || selectedStore?.Branch_Address}</Text>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Retailer Info */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)}>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewSectionTitle}>Customer</Text>
              <View style={styles.retailerReview}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.retailerIcon}
                >
                  <User size={24} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.retailerDetails}>
                  <Text style={styles.retailerName}>{selectedRetailer?.Retailer_Name}</Text>
                  {selectedRetailer?.Contact_Person && selectedRetailer.Contact_Person !== '0' && (
                    <Text style={styles.contactPerson}>{selectedRetailer.Contact_Person}</Text>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Order Details */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewSectionTitle}>Order Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PO Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter PO number (optional)"
                  value={poNumber}
                  onChangeText={setPONumber}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={styles.textAreaInput}
                  placeholder="Add any notes for this order..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.urgentContainer}>
                <Text style={styles.urgentLabel}>Mark as Urgent</Text>
                <TouchableOpacity
                  style={[styles.urgentToggle, isUrgent && styles.urgentToggleActive]}
                  onPress={() => setIsUrgent(!isUrgent)}
                >
                  <Text style={[styles.urgentToggleText, isUrgent && styles.urgentToggleTextActive]}>
                    {isUrgent ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Order Items */}
          <Animated.View entering={FadeInUp.delay(300).duration(600)}>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewSectionTitle}>Order Items</Text>
              {orderItems.map((item, index) => (
                <View key={item.part.partNumber || item.part.Part_Number || index} style={styles.reviewItem}>
                  <View style={styles.reviewItemInfo}>
                    <Text style={styles.reviewItemName}>{item.part.name || item.part.Part_Name}</Text>
                    <Text style={styles.reviewItemNumber}>#{item.part.partNumber || item.part.Part_Number}</Text>
                  </View>
                  <View style={styles.reviewItemQuantity}>
                    <Text style={styles.quantityLabel}>Qty: {item.quantity}</Text>
                    <Text style={styles.reviewItemPrice}>{formatCurrency(item.totalPrice)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Order Total */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)}>
            <View style={styles.totalCard}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.totalGradient}
              >
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Order Total</Text>
                  <Text style={styles.totalAmount}>{formatCurrency(getOrderTotal())}</Text>
                </View>
                <Text style={styles.totalItems}>
                  {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} • {orderItems.reduce((sum, item) => sum + item.quantity, 0)} total quantity
                </Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInUp.delay(500).duration(600)}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitOrder}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.submitGradient}
              >
                {isSubmitting ? (
                  <LoadingSpinner size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Place Order</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Extra padding to ensure content is visible above tab bar */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const getStepTitle = () => {
    switch (step) {
      case 'store':
        return 'Select Store';
      case 'retailer':
        return 'Select Customer';
      case 'parts':
        return 'Add Products';
      case 'review':
        return 'Review Order';
      default:
        return 'Create Order';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'store':
        return 'Choose a store for this order';
      case 'retailer':
        return selectedStore ? `Order for ${selectedStore.name || selectedStore.Branch_Name}` : 'Select a customer for this order';
      case 'parts':
        return selectedRetailer ? `Order for ${selectedRetailer.Retailer_Name}` : 'Add products to order';
      case 'review':
        return 'Review and confirm your order';
      default:
        return '';
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => { setError(null); loadStores(); }} />;
  }

  const canCreateOrder = ['admin', 'manager', 'salesman', 'storeman'].includes(user?.role || '');

  if (!canCreateOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <AlertTriangle size={48} color="#94a3b8" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b', marginTop: 16 }}>
            Access Restricted
          </Text>
          <Text style={{ fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
            You do not have permission to create orders.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={styles.headerTitleText}>{getStepTitle()}</Text>
              <Text style={styles.headerSubtitle}>{getStepSubtitle()}</Text>
            </View>
            
            {step === 'parts' && (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => router.push('/(tabs)/parts/add')}
              >
                <Plus size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {step !== 'parts' && (
              <View style={styles.headerSpacer} />
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <View style={styles.stepIndicatorContainer}>
          {['store', 'retailer', 'parts', 'review'].map((stepName, index) => {
            // Skip store step for non-admin users
            if (stepName === 'store' && !needsStoreSelection) {
              return null;
            }
            
            return (
              <View key={stepName} style={styles.stepIndicatorItem}>
                <View style={[
                  styles.stepDot,
                  step === stepName && styles.stepDotActive,
                  ((step === 'retailer' && stepName === 'store') ||
                   (step === 'parts' && (stepName === 'store' || stepName === 'retailer')) ||
                   (step === 'review' && (stepName === 'store' || stepName === 'retailer' || stepName === 'parts')))
                    ? styles.stepDotCompleted : {}
                ]}>
                  <Text style={[
                    styles.stepDotText,
                    ((step === stepName) || 
                     (step === 'retailer' && stepName === 'store') ||
                     (step === 'parts' && (stepName === 'store' || stepName === 'retailer')) ||
                     (step === 'review' && (stepName === 'store' || stepName === 'retailer' || stepName === 'parts')))
                      && styles.stepDotTextActive
                  ]}>
                    {index + 1}
                  </Text>
                </View>
                {index < (needsStoreSelection ? 3 : 2) && (
                  <View style={[
                    styles.stepLine,
                    ((step === 'retailer' && stepName === 'store') ||
                     (step === 'parts' && stepName === 'retailer') ||
                     (step === 'parts' && stepName === 'store') ||
                     (step === 'review' && stepName === 'store') ||
                     (step === 'review' && stepName === 'retailer') ||
                     (step === 'review' && stepName === 'parts')) && styles.stepLineCompleted
                  ]} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Step Content */}
      {step === 'store' && renderStoreStep()}
      {step === 'retailer' && renderRetailerStep()}
      {step === 'parts' && renderPartsStep()}
      {step === 'review' && renderReviewStep()}

      {/* Parts Filter Modal */}
      <FilterModal
        visible={showPartsFilterModal}
        onClose={() => setShowPartsFilterModal(false)}
        title="Filter & Sort Parts"
        filters={partsFilterOptions}
        sorts={partsSortOptions}
        selectedFilter={selectedPartsFilter}
        selectedSort={selectedPartsSort}
        onFilterSelect={(filter) => setSelectedPartsFilter(filter as PartsFilterType)}
        onSortSelect={(sort) => setSelectedPartsSort(sort as PartsSortType)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 0,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerSpacer: {
    width: 44,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#667eea',
  },
  stepDotCompleted: {
    backgroundColor: '#10b981',
  },
  stepDotText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  stepLineCompleted: {
    backgroundColor: '#10b981',
  },
  stepContainer: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  partsSearchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
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
  searchBar: {
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
  listContent: {
    paddingBottom: 120,
  },
  retailerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  retailerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retailerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  retailerDetails: {
    flex: 1,
  },
  retailerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  contactPerson: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  creditLimit: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  selectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  storeCode: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 12,
    color: '#94a3b8',
  },
  partCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  partHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  partImageContainer: {
    marginRight: 16,
  },
  partImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  partImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  partName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  partNumber: {
    fontSize: 12,
    color: '#64748b',
  },
  partCategory: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  partStock: {
    fontSize: 11,
    color: '#94a3b8',
  },
  partPrice: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  partActions: {
    alignItems: 'flex-end',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
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
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  orderSummary: {
    position: 'absolute',
    bottom: 100, // Increased to ensure it's above the tab bar
    left: 0,
    right: 0,
    backgroundColor: '#f8fafc',
    paddingTop: 16,
    paddingBottom: 20,
    zIndex: 10,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  summaryItems: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  reviewButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  reviewButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewContent: {
    paddingBottom: 120,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  retailerReview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeReview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    minHeight: 80,
  },
  urgentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  urgentToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  urgentToggleActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  urgentToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  urgentToggleTextActive: {
    color: '#ef4444',
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  reviewItemInfo: {
    flex: 1,
  },
  reviewItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  reviewItemNumber: {
    fontSize: 12,
    color: '#64748b',
  },
  reviewItemQuantity: {
    alignItems: 'flex-end',
  },
  quantityLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  reviewItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  totalCard: {
    marginHorizontal: 20,
    marginVertical: 8,
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
  totalGradient: {
    padding: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalItems: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  submitButton: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
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
});