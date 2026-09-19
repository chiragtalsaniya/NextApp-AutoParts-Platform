import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { apiService } from '@/services/api';
import { SearchBar } from '@/components/SearchBar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/context/AuthContext';
import { Package, TriangleAlert as AlertTriangle, Plus, Minus, TrendingDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface InventoryItem {
  branchCode: string;
  partNo: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  rackLocation?: string;
  lastUpdated: string;
  stockLevel: string;
  stockPercentage: number;
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
      const rows = Array.isArray(response?.data) ? response.data : [];
      const mapped: InventoryItem[] = rows.map((item: any) => ({
        branchCode: item.Branch_Code,
        partNo: item.Part_No,
        currentStock: item.total_stock ?? 0,
        minimumStock: item.Part_MinQty ?? 0,
        maximumStock: item.max_stock ?? 0,
        rackLocation: item.Part_Rack || undefined,
        lastUpdated: item.Last_Sync ? String(item.Last_Sync) : '',
        stockLevel: item.stock_level || 'good',
        stockPercentage: item.stock_percentage ?? 0,
        part: {
          name: item.Part_Name || '',
          category: item.Part_Catagory || '',
          unitPrice: item.Part_Price ?? 0,
        },
      }));
      setInventory(mapped);
      setFilteredInventory(mapped);
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
      const q = query.toLowerCase();
      const filtered = inventory.filter(
        (item) =>
          (item.partNo || '').toLowerCase().includes(q) ||
          (item.part?.name || '').toLowerCase().includes(q) ||
          (item.part?.category || '').toLowerCase().includes(q) ||
          (item.rackLocation || '').toLowerCase().includes(q)
      );
      setFilteredInventory(filtered);
    }
  };

  const handleStockUpdate = async (item: InventoryItem, operation: 'add' | 'subtract', quantity: number) => {
    try {
      await apiService.adjustItemStock(item.branchCode, item.partNo, quantity, operation);
      loadInventory(); // Refresh the list
      Alert.alert('Success', `Stock ${operation === 'add' ? 'added' : 'removed'} successfully`);
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to update stock');
    }
  };

  const [quantityDialog, setQuantityDialog] = useState<{
    item: InventoryItem;
    operation: 'add' | 'subtract';
  } | null>(null);
  const [quantityInput, setQuantityInput] = useState('');

  const showStockUpdateDialog = (item: InventoryItem, operation: 'add' | 'subtract') => {
    setQuantityInput('');
    setQuantityDialog({ item, operation });
  };

  const confirmStockUpdate = () => {
    if (!quantityDialog) return;
    const qty = parseInt(quantityInput, 10);
    if (Number.isInteger(qty) && qty > 0) {
      const { item, operation } = quantityDialog;
      setQuantityDialog(null);
      handleStockUpdate(item, operation, qty);
    } else {
      Alert.alert('Invalid quantity', 'Please enter a whole number greater than zero.');
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.stockLevel === 'critical') {
      return { status: 'low', color: '#DC2626', text: 'Critical' };
    } else if (item.stockLevel === 'low') {
      return { status: 'low', color: '#DC2626', text: 'Low Stock' };
    } else if (item.stockLevel === 'medium') {
      return { status: 'normal', color: '#D97706', text: 'Medium' };
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
            <Text style={styles.stockRangeLabel}>Max: {item.maximumStock}</Text>
            <Text style={styles.stockRangeLabel}>{item.stockPercentage}% full</Text>
            {item.part?.unitPrice ? (
              <Text style={styles.priceText}>{formatCurrency(item.part.unitPrice / 100)}</Text>
            ) : null}
          </View>

          {item.lastUpdated ? (
            <Text style={styles.lastUpdated}>Updated: {formatDate(item.lastUpdated)}</Text>
          ) : null}
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
        </View>

        {item.stockLevel === 'critical' && (
          <View style={styles.alertBanner}>
            <AlertTriangle size={16} color="#DC2626" />
            <Text style={styles.alertText}>Stock level is critically low</Text>
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
                  {filteredInventory.filter(item => item.stockLevel === 'critical' || item.stockLevel === 'low').length} Low
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

      {/* Quantity Input Modal */}
      <Modal
        visible={quantityDialog !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setQuantityDialog(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {quantityDialog?.operation === 'add' ? 'Add Stock' : 'Remove Stock'}
            </Text>
            {quantityDialog && (
              <Text style={styles.modalSubtitle}>
                {quantityDialog.item.partNo} — {quantityDialog.item.part?.name || 'Unknown part'}
              </Text>
            )}
            <TextInput
              style={styles.modalInput}
              value={quantityInput}
              onChangeText={setQuantityInput}
              placeholder="Quantity"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setQuantityDialog(null)}
              >
                <Text style={[styles.modalButtonText, { color: '#64748B' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmStockUpdate}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F1F5F9',
  },
  modalConfirmButton: {
    backgroundColor: '#667eea',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
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