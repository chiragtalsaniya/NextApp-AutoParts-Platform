import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { apiService } from '@/services/api';
import { SearchBar } from '@/components/SearchBar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/context/AuthContext';
import { Package, TriangleAlert as AlertTriangle, Plus, Minus, CreditCard as Edit3, TrendingUp, TrendingDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface InventoryItem {
  branchCode: string;
  partNo: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  rackLocation?: string;
  lastUpdated: string;
  part?: {
    name: string;
    category: string;
    unitPrice: number;
  };
}

export default function InventoryScreen() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadInventory = async () => {
    try {
      setError(null);
      const response = await apiService.getItemStatus({ limit: 100 });
      setInventory(response.data || []);
      setFilteredInventory(response.data || []);
    } catch (error: any) {
      setError(error.error || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredInventory(inventory);
    } else {
      const filtered = inventory.filter(
        (item) =>
          item.partNo.toLowerCase().includes(query.toLowerCase()) ||
          item.part?.name.toLowerCase().includes(query.toLowerCase()) ||
          item.part?.category.toLowerCase().includes(query.toLowerCase()) ||
          item.rackLocation?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredInventory(filtered);
    }
  };

  const handleStockUpdate = async (item: InventoryItem, operation: 'add' | 'subtract', quantity: number) => {
    try {
      await apiService.updateItemStock(item.branchCode, item.partNo, quantity, operation);
      loadInventory(); // Refresh the list
      Alert.alert('Success', `Stock ${operation === 'add' ? 'added' : 'removed'} successfully`);
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to update stock');
    }
  };

  const showStockUpdateDialog = (item: InventoryItem, operation: 'add' | 'subtract') => {
    Alert.prompt(
      `${operation === 'add' ? 'Add' : 'Remove'} Stock`,
      `Enter quantity to ${operation}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: (quantity) => {
            const qty = parseInt(quantity || '0', 10);
            if (qty > 0) {
              handleStockUpdate(item, operation, qty);
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const isLowStock = (item: InventoryItem) => {
    return item.currentStock <= item.minimumStock;
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minimumStock) {
      return { status: 'low', color: '#DC2626', text: 'Low Stock' };
    } else if (item.currentStock >= item.maximumStock) {
      return { status: 'high', color: '#D97706', text: 'Overstock' };
    } else {
      return { status: 'normal', color: '#059669', text: 'Normal' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    const stockStatus = getStockStatus(item);
    
    return (
      <View style={styles.inventoryCard}>
        <View style={styles.inventoryHeader}>
          <View style={styles.partInfo}>
            <Text style={styles.partNumber}>#{item.partNo}</Text>
            <Text style={styles.partName} numberOfLines={2}>
              {item.part?.name || 'Unknown Part'}
            </Text>
            <Text style={styles.partCategory}>{item.part?.category}</Text>
            {item.rackLocation && (
              <Text style={styles.rackLocation}>Rack: {item.rackLocation}</Text>
            )}
          </View>
          
          <View style={styles.stockInfo}>
            <Text style={styles.stockNumber}>{item.currentStock}</Text>
            <Text style={styles.stockLabel}>in stock</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${stockStatus.color}20` }]}>
              <Text style={[styles.statusText, { color: stockStatus.color }]}>
                {stockStatus.text}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stockDetails}>
          <View style={styles.stockRange}>
            <Text style={styles.stockRangeLabel}>Min: {item.minimumStock}</Text>
            <Text style={styles.stockRangeLabel}>Max: {item.maximumStock}</Text>
            {item.part?.unitPrice && (
              <Text style={styles.priceText}>{formatCurrency(item.part.unitPrice)}</Text>
            )}
          </View>
          
          <Text style={styles.lastUpdated}>Updated: {formatDate(item.lastUpdated)}</Text>
        </View>

        {/* Stock Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={() => showStockUpdateDialog(item, 'add')}
          >
            <Plus size={16} color="#059669" />
            <Text style={[styles.actionButtonText, { color: '#059669' }]}>Add</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => showStockUpdateDialog(item, 'subtract')}
          >
            <Minus size={16} color="#DC2626" />
            <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Remove</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.editButton]}>
            <Edit3 size={16} color="#2563EB" />
            <Text style={[styles.actionButtonText, { color: '#2563EB' }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {isLowStock(item) && (
          <View style={styles.alertBanner}>
            <AlertTriangle size={16} color="#DC2626" />
            <Text style={styles.alertText}>Stock level is below minimum threshold</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading inventory..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadInventory} />;
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
            
            <View style={styles.headerTitle}>
              <Text style={styles.headerTitleText}>Inventory Management</Text>
              <Text style={styles.headerSubtitle}>
                {filteredInventory.length} item{filteredInventory.length !== 1 ? 's' : ''} in stock
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <View style={styles.statItem}>
                <TrendingDown size={16} color="#DC2626" />
                <Text style={styles.statText}>
                  {filteredInventory.filter(item => isLowStock(item)).length} Low
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Search */}
      <SearchBar
        onSearch={handleSearch}
        placeholder="Search by part number, name, category, rack..."
        value={searchQuery}
      />

      {/* Inventory List */}
      <FlatList
        data={filteredInventory}
        renderItem={renderInventoryItem}
        keyExtractor={(item) => `${item.branchCode}-${item.partNo}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package size={64} color="#94A3B8" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No items found' : 'No inventory items'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Inventory items will appear here once added'}
            </Text>
          </View>
        }
      />
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
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
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
    alignItems: 'flex-end',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  partInfo: {
    flex: 1,
    marginRight: 12,
  },
  partNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  partName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  partCategory: {
    fontSize: 12,
    color: '#7C3AED',
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  rackLocation: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  stockInfo: {
    alignItems: 'center',
  },
  stockNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  stockLabel: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  stockDetails: {
    marginBottom: 12,
  },
  stockRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockRangeLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    fontFamily: 'Inter-SemiBold',
  },
  lastUpdated: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  addButton: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  editButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertText: {
    fontSize: 12,
    color: '#DC2626',
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    paddingHorizontal: 20,
  },
});