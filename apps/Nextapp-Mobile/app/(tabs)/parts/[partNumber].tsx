import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/context/AuthContext';
import { Part } from '@/types/api';
import { Package, ArrowLeft, CreditCard as Edit3, Save, X, Star, Award, Zap, TriangleAlert as AlertCircle, ShoppingCart, Plus, Minus, Info, Tag, Wrench, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

export default function PartDetailsScreen() {
  const { partNumber, edit } = useLocalSearchParams<{ partNumber: string; edit?: string }>();
  const { user } = useAuth();
  const [part, setPart] = useState<Part | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(edit === 'true');
  const [isSaving, setIsSaving] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');

  // Edit form state
  const [editForm, setEditForm] = useState({
    Part_Name: '',
    Part_Price: '',
    Part_MinQty: '',
    Part_BasicDisc: '',
    Part_SchemeDisc: '',
    Part_AdditionalDisc: '',
    Part_Application: '',
    Part_Catagory: '',
    Focus_Group: '',
  });

  const canEdit = ['super_admin', 'admin', 'manager'].includes(user?.role || '');
  const canManageStock = ['super_admin', 'admin', 'manager', 'storeman'].includes(user?.role || '');

  useEffect(() => {
    if (partNumber) {
      loadPartDetails();
    }
  }, [partNumber]);

  const loadPartDetails = async () => {
    try {
      setError(null);
      const response = await apiService.getPart(partNumber);
      setPart(response);
      
      // Initialize edit form
      if (response) {
        setEditForm({
          Part_Name: response.Part_Name,
          Part_Price: response.Part_Price.toString(),
          Part_MinQty: response.Part_MinQty.toString(),
          Part_BasicDisc: response.Part_BasicDisc.toString(),
          Part_SchemeDisc: response.Part_SchemeDisc.toString(),
          Part_AdditionalDisc: response.Part_AdditionalDisc.toString(),
          Part_Application: response.Part_Application || '',
          Part_Catagory: response.Part_Catagory,
          Focus_Group: response.Focus_Group,
        });
      }
    } catch (error: any) {
      setError(error.error || 'Failed to load part details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!part) return;

    setIsSaving(true);
    try {
      // In a real app, you would call an API to update the part
      // await apiService.updatePart(part.Part_Number, editForm);
      
      // For now, just update local state
      const updatedPart = {
        ...part,
        ...editForm,
        Part_Price: parseFloat(editForm.Part_Price),
        Part_MinQty: parseInt(editForm.Part_MinQty),
        Part_BasicDisc: parseFloat(editForm.Part_BasicDisc),
        Part_SchemeDisc: parseFloat(editForm.Part_SchemeDisc),
        Part_AdditionalDisc: parseFloat(editForm.Part_AdditionalDisc),
      };
      
      setPart(updatedPart);
      setIsEditing(false);
      Alert.alert('Success', 'Part updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to update part');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStockAdjustment = async () => {
    if (!part || !stockAdjustment) return;

    try {
      const quantity = parseInt(stockAdjustment);
      if (isNaN(quantity) || quantity <= 0) {
        Alert.alert('Error', 'Please enter a valid quantity');
        return;
      }

      await apiService.updatePartStock(part.Part_Number, quantity, adjustmentType);
      Alert.alert('Success', 'Stock updated successfully');
      setShowStockModal(false);
      setStockAdjustment('');
      loadPartDetails(); // Refresh data
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to update stock');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStockStatus = () => {
    if (!part) return { currentStock: 0, isLowStock: false, status: 'Unknown', color: '#64748b' };
    
    const mockCurrentStock = Math.floor(Math.random() * (part.Part_MinQty * 3)) + 1;
    const isLowStock = mockCurrentStock <= part.Part_MinQty;
    
    return {
      currentStock: mockCurrentStock,
      isLowStock,
      status: isLowStock ? 'Low Stock' : 'In Stock',
      color: isLowStock ? '#ef4444' : '#10b981',
    };
  };

  const getDiscountInfo = () => {
    if (!part) return null;
    
    const totalDiscount = part.Part_BasicDisc + part.Part_SchemeDisc + part.Part_AdditionalDisc;
    if (totalDiscount > 0) {
      return {
        percentage: totalDiscount,
        finalPrice: part.Part_Price * (1 - totalDiscount / 100),
      };
    }
    return null;
  };

  const getPartBadges = () => {
    if (!part) return [];
    
    const badges = [];
    
    if (part.GuruPoint > 0) {
      badges.push({
        icon: <Award size={16} color="#f59e0b" />,
        text: 'Guru',
        color: '#f59e0b',
        bgColor: '#fef3c7',
      });
    }
    
    if (part.ChampionPoint > 0) {
      badges.push({
        icon: <Star size={16} color="#8b5cf6" />,
        text: 'Champion',
        color: '#8b5cf6',
        bgColor: '#ede9fe',
      });
    }
    
    if (part.Is_Order_Pad === 1) {
      badges.push({
        icon: <Zap size={16} color="#10b981" />,
        text: 'Quick Order',
        color: '#10b981',
        bgColor: '#dcfce7',
      });
    }
    
    return badges;
  };

  const renderStockModal = () => {
    return (
      <Modal
        visible={showStockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(300)} style={styles.stockModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Stock</Text>
              <TouchableOpacity onPress={() => setShowStockModal(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.adjustmentTypes}>
              {[
                { key: 'add', label: 'Add Stock', icon: Plus },
                { key: 'subtract', label: 'Remove Stock', icon: Minus },
                { key: 'set', label: 'Set Stock', icon: Edit3 },
              ].map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.adjustmentType,
                    adjustmentType === type.key && styles.selectedAdjustmentType
                  ]}
                  onPress={() => setAdjustmentType(type.key as any)}
                >
                  <type.icon 
                    size={20} 
                    color={adjustmentType === type.key ? '#667eea' : '#64748b'} 
                  />
                  <Text style={[
                    styles.adjustmentTypeText,
                    adjustmentType === type.key && styles.selectedAdjustmentTypeText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.quantityInput}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter quantity"
                value={stockAdjustment}
                onChangeText={setStockAdjustment}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowStockModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleStockAdjustment}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.confirmGradient}
                >
                  <Text style={styles.confirmButtonText}>Update Stock</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading part details..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadPartDetails} />;
  }

  if (!part) {
    return <ErrorMessage error="Part not found" />;
  }

  const stockStatus = getStockStatus();
  const discountInfo = getDiscountInfo();
  const badges = getPartBadges();

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
              <Text style={styles.headerTitleText}>Part Details</Text>
              <Text style={styles.headerSubtitle}>#{part.Part_Number}</Text>
            </View>
            
            <View style={styles.headerActions}>
              {canEdit && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <X size={24} color="#FFFFFF" />
                  ) : (
                    <Edit3 size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Part Image and Basic Info */}
        <Animated.View entering={FadeInUp.delay(0).duration(600)} style={styles.imageCard}>
          <View style={styles.imageContainer}>
            {part.Part_Image ? (
              <Image source={{ uri: part.Part_Image }} style={styles.partImage} />
            ) : (
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.partImagePlaceholder}
              >
                <Package size={64} color="#FFFFFF" />
              </LinearGradient>
            )}
            
            <View style={[styles.stockBadge, { backgroundColor: stockStatus.color }]}>
              <Text style={styles.stockBadgeText}>{stockStatus.currentStock}</Text>
            </View>
          </View>
          
          <View style={styles.basicInfo}>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editForm.Part_Name}
                onChangeText={(text) => setEditForm({ ...editForm, Part_Name: text })}
                placeholder="Part Name"
              />
            ) : (
              <Text style={styles.partName}>{part.Part_Name}</Text>
            )}
            
            <Text style={styles.partNumber}>#{part.Part_Number}</Text>
            
            <View style={styles.badgesContainer}>
              {badges.map((badge, index) => (
                <View
                  key={index}
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
        </Animated.View>

        {/* Pricing Information */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.pricingCard}>
          <Text style={styles.sectionTitle}>Pricing Information</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Price:</Text>
            {isEditing ? (
              <TextInput
                style={styles.priceInput}
                value={editForm.Part_Price}
                onChangeText={(text) => setEditForm({ ...editForm, Part_Price: text })}
                placeholder="0.00"
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.priceValue}>{formatCurrency(part.Part_Price)}</Text>
            )}
          </View>
          
          {discountInfo && (
            <>
              <View style={styles.discountBreakdown}>
                <View style={styles.discountRow}>
                  <Text style={styles.discountLabel}>Basic Discount:</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.discountInput}
                      value={editForm.Part_BasicDisc}
                      onChangeText={(text) => setEditForm({ ...editForm, Part_BasicDisc: text })}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.discountValue}>{part.Part_BasicDisc}%</Text>
                  )}
                </View>
                
                <View style={styles.discountRow}>
                  <Text style={styles.discountLabel}>Scheme Discount:</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.discountInput}
                      value={editForm.Part_SchemeDisc}
                      onChangeText={(text) => setEditForm({ ...editForm, Part_SchemeDisc: text })}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.discountValue}>{part.Part_SchemeDisc}%</Text>
                  )}
                </View>
                
                <View style={styles.discountRow}>
                  <Text style={styles.discountLabel}>Additional Discount:</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.discountInput}
                      value={editForm.Part_AdditionalDisc}
                      onChangeText={(text) => setEditForm({ ...editForm, Part_AdditionalDisc: text })}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.discountValue}>{part.Part_AdditionalDisc}%</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.finalPriceRow}>
                <Text style={styles.finalPriceLabel}>Final Price:</Text>
                <Text style={styles.finalPriceValue}>{formatCurrency(discountInfo.finalPrice)}</Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* Stock Information */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.stockCard}>
          <View style={styles.stockHeader}>
            <Text style={styles.sectionTitle}>Stock Information</Text>
            {canManageStock && (
              <TouchableOpacity
                style={styles.adjustStockButton}
                onPress={() => setShowStockModal(true)}
              >
                <Wrench size={16} color="#667eea" />
                <Text style={styles.adjustStockText}>Adjust</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.stockGrid}>
            <View style={styles.stockItem}>
              <Text style={styles.stockItemLabel}>Current Stock</Text>
              <Text style={[styles.stockItemValue, { color: stockStatus.color }]}>
                {stockStatus.currentStock}
              </Text>
            </View>
            
            <View style={styles.stockItem}>
              <Text style={styles.stockItemLabel}>Minimum Qty</Text>
              {isEditing ? (
                <TextInput
                  style={styles.stockInput}
                  value={editForm.Part_MinQty}
                  onChangeText={(text) => setEditForm({ ...editForm, Part_MinQty: text })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.stockItemValue}>{part.Part_MinQty}</Text>
              )}
            </View>
            
            <View style={styles.stockItem}>
              <Text style={styles.stockItemLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${stockStatus.color}20` }]}>
                {stockStatus.isLowStock && (
                  <AlertCircle size={14} color={stockStatus.color} />
                )}
                <Text style={[styles.statusText, { color: stockStatus.color }]}>
                  {stockStatus.status}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Category Information */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.categoryCard}>
          <Text style={styles.sectionTitle}>Category Information</Text>
          
          <View style={styles.categoryRow}>
            <Tag size={20} color="#667eea" />
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryLabel}>Category:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.categoryInput}
                  value={editForm.Part_Catagory}
                  onChangeText={(text) => setEditForm({ ...editForm, Part_Catagory: text })}
                  placeholder="Category"
                />
              ) : (
                <Text style={styles.categoryValue}>{part.Part_Catagory}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.categoryRow}>
            <Package size={20} color="#059669" />
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryLabel}>Focus Group:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.categoryInput}
                  value={editForm.Focus_Group}
                  onChangeText={(text) => setEditForm({ ...editForm, Focus_Group: text })}
                  placeholder="Focus Group"
                />
              ) : (
                <Text style={styles.categoryValue}>{part.Focus_Group}</Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Application Information */}
        {(part.Part_Application && part.Part_Application !== '0') || isEditing ? (
          <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.applicationCard}>
            <Text style={styles.sectionTitle}>Compatible Vehicles</Text>
            {isEditing ? (
              <TextInput
                style={styles.applicationInput}
                value={editForm.Part_Application}
                onChangeText={(text) => setEditForm({ ...editForm, Part_Application: text })}
                placeholder="Enter compatible vehicles..."
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.applicationText}>{part.Part_Application}</Text>
            )}
          </Animated.View>
        ) : null}

        {/* Metadata */}
        <Animated.View entering={FadeInUp.delay(1000).duration(600)} style={styles.metadataCard}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <View style={styles.metadataRow}>
            <Calendar size={16} color="#64748b" />
            <Text style={styles.metadataLabel}>Created:</Text>
            <Text style={styles.metadataValue}>{formatDate(part.created_at)}</Text>
          </View>
          
          <View style={styles.metadataRow}>
            <Info size={16} color="#64748b" />
            <Text style={styles.metadataLabel}>Status:</Text>
            <Text style={styles.metadataValue}>{part.Item_Status}</Text>
          </View>
          
          {part.GuruPoint > 0 && (
            <View style={styles.metadataRow}>
              <Award size={16} color="#f59e0b" />
              <Text style={styles.metadataLabel}>Guru Points:</Text>
              <Text style={styles.metadataValue}>{part.GuruPoint}</Text>
            </View>
          )}
          
          {part.ChampionPoint > 0 && (
            <View style={styles.metadataRow}>
              <Star size={16} color="#8b5cf6" />
              <Text style={styles.metadataLabel}>Champion Points:</Text>
              <Text style={styles.metadataValue}>{part.ChampionPoint}</Text>
            </View>
          )}
        </Animated.View>

        {/* Save Button */}
        {isEditing && (
          <Animated.View entering={FadeInUp.delay(1200).duration(600)} style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.saveGradient}
              >
                {isSaving ? (
                  <LoadingSpinner size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {renderStockModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 50,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerActions: {
    width: 44,
    alignItems: 'flex-end',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  imageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  partImage: {
    width: 150,
    height: 150,
    borderRadius: 20,
  },
  partImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  stockBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  basicInfo: {
    alignItems: 'center',
  },
  partName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  partNumber: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  priceInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
    minWidth: 100,
    textAlign: 'right',
  },
  discountBreakdown: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  discountLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  discountInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 2,
    minWidth: 50,
    textAlign: 'right',
  },
  finalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  finalPriceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  finalPriceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  stockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  adjustStockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    gap: 6,
  },
  adjustStockText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  stockGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
  },
  stockItemLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  stockItemValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  stockInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
    minWidth: 60,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  categoryInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
  },
  applicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  applicationText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  applicationInput: {
    fontSize: 16,
    color: '#64748b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  metadataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    marginRight: 8,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  editInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
    paddingVertical: 8,
    marginBottom: 8,
  },
  saveButtonContainer: {
    marginHorizontal: 20,
    marginTop: 8,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  adjustmentTypes: {
    marginBottom: 24,
  },
  adjustmentType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedAdjustmentType: {
    backgroundColor: '#ede9fe',
  },
  adjustmentTypeText: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
    fontWeight: '500',
  },
  selectedAdjustmentTypeText: {
    color: '#667eea',
    fontWeight: '600',
  },
  quantityInput: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});