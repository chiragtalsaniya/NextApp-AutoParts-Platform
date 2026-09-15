import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Order } from '@/types/api';
import { 
  Package, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CircleCheck as CheckCircle, 
  Truck, 
  CircleAlert as AlertCircle, 
  CreditCard as Edit3, 
  Trash2, 
  Download,
  ArrowLeft,
  Building,
  DollarSign,
  FileText,
  Save,
  X,
  Eye,
  MessageSquare,
  Star,
  Plus
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

interface OrderDetails extends Order {
  items?: OrderItem[];
  statusHistory?: StatusHistoryItem[];
}

interface OrderItem {
  id: number;
  partNumber: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  basicDiscount?: number;
  schemeDiscount?: number;
  additionalDiscount?: number;
  urgent?: boolean;
  part?: {
    name: string;
    category: string;
    image?: string;
  };
}

interface StatusHistoryItem {
  status: string;
  timestamp: string;
  updatedBy: string;
  notes?: string;
}

export default function OrderDetailsScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(edit === 'true');
  const [isSaving, setIsSaving] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const canEdit = ['admin', 'manager'].includes(user?.role || '');
  const canUpdateStatus = ['admin', 'manager', 'storeman'].includes(user?.role || '');
  const canCancel = ['admin', 'manager'].includes(user?.role || '');

  useEffect(() => {
    if (id) {
      loadOrderDetails();
    }
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      setError(null);
      const response = await apiService.getOrder(parseInt(id));
      
      // Mock enhanced order data for demonstration
      const enhancedOrder: OrderDetails = {
        ...response,
        items: [
          {
            id: 1,
            partNumber: 'BP-001',
            partName: 'Brake Pads - Front Set',
            quantity: 2,
            unitPrice: 89.99,
            totalPrice: 179.98,
            basicDiscount: 5,
            schemeDiscount: 2,
            additionalDiscount: 0,
            urgent: false,
            part: {
              name: 'Brake Pads - Front Set',
              category: 'Brake System',
              image: 'https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=400',
            },
          },
          {
            id: 2,
            partNumber: 'OIL-002',
            partName: 'Engine Oil 5W-30',
            quantity: 4,
            unitPrice: 24.99,
            totalPrice: 99.96,
            basicDiscount: 3,
            schemeDiscount: 0,
            additionalDiscount: 1,
            urgent: true,
            part: {
              name: 'Engine Oil 5W-30',
              category: 'Engine',
              image: 'https://images.pexels.com/photos/4489702/pexels-photo-4489702.jpeg?auto=compress&cs=tinysrgb&w=400',
            },
          },
        ],
        statusHistory: [
          {
            status: 'New',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            updatedBy: 'System',
            notes: 'Order created',
          },
          {
            status: 'Processing',
            timestamp: new Date(Date.now() - 43200000).toISOString(),
            updatedBy: user?.name || 'Manager',
            notes: 'Order confirmed and ready for processing',
          },
        ],
      };
      
      setOrder(enhancedOrder);
    } catch (error: any) {
      setError(error.error || 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch ((status || 'unknown').toLowerCase()) {
      case 'new':
        return {
          icon: <Plus size={20} color="#3b82f6" />,
          color: '#3b82f6',
          bgColor: '#dbeafe',
          text: 'New',
          description: 'Order has been created and is awaiting processing',
        };
      case 'pending':
        return {
          icon: <Clock size={20} color="#f59e0b" />,
          color: '#f59e0b',
          bgColor: '#fef3c7',
          text: 'Pending',
          description: 'Order is waiting for confirmation',
        };
      case 'processing':
        return {
          icon: <Package size={20} color="#8b5cf6" />,
          color: '#8b5cf6',
          bgColor: '#ede9fe',
          text: 'Processing',
          description: 'Order is being processed and prepared',
        };
      case 'completed':
        return {
          icon: <CheckCircle size={20} color="#10b981" />,
          color: '#10b981',
          bgColor: '#dcfce7',
          text: 'Completed',
          description: 'Order has been completed successfully',
        };
      case 'hold':
        return {
          icon: <AlertCircle size={20} color="#f59e0b" />,
          color: '#f59e0b',
          bgColor: '#fef3c7',
          text: 'Hold',
          description: 'Order is on hold pending review',
        };
      case 'picked':
        return {
          icon: <Package size={20} color="#059669" />,
          color: '#059669',
          bgColor: '#dcfce7',
          text: 'Picked',
          description: 'Order items have been picked from inventory',
        };
      case 'dispatched':
        return {
          icon: <Truck size={20} color="#8b5cf6" />,
          color: '#8b5cf6',
          bgColor: '#ede9fe',
          text: 'Dispatched',
          description: 'Order has been dispatched for delivery',
        };
      case 'cancelled':
        return {
          icon: <AlertCircle size={20} color="#ef4444" />,
          color: '#ef4444',
          bgColor: '#fee2e2',
          text: 'Cancelled',
          description: 'Order has been cancelled',
        };
      default:
        return {
          icon: <Clock size={20} color="#64748b" />,
          color: '#64748b',
          bgColor: '#f1f5f9',
          text: 'Unknown',
          description: 'Status unknown',
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const canEditOrder = () => {
    if (!order || !canEdit) return false;
    const editableStatuses = ['new', 'pending'];
    return editableStatuses.includes((order.status || order.Order_Status || 'unknown').toLowerCase());
  };

  const canCancelOrder = () => {
    if (!order || !canCancel) return false;
    const cancellableStatuses = ['new', 'pending', 'processing'];
    return cancellableStatuses.includes((order.status || order.Order_Status || 'unknown').toLowerCase());
  };

  const handleUpdateStatus = async () => {
    if (!order || !newStatus) return;

    setIsUpdatingStatus(true);
    try {
      const orderId = order.id || order.Order_Id;
      await apiService.updateOrderStatus(orderId, newStatus, statusNotes);
      
      // Update local state
      setOrder(prev => prev ? { 
        ...prev, 
        status: newStatus,
        Order_Status: newStatus,
        statusHistory: [
          ...(prev.statusHistory || []),
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            updatedBy: user?.name || 'User',
            notes: statusNotes || `Status updated to ${newStatus}`,
          }
        ]
      } : null);
      
      setShowStatusModal(false);
      setNewStatus('');
      setStatusNotes('');
      showToast('Order status updated successfully', 'success');
      
      // Redirect back to orders list after a short delay to show the success message
      setTimeout(() => {
        router.replace('/(tabs)/orders');
      }, 1500);
      
    } catch (error: any) {
      showToast(error.error || 'Failed to update order status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const orderId = order!.id || order!.Order_Id;
              await apiService.updateOrderStatus(orderId, 'Cancelled');
              setOrder(prev => prev ? { ...prev, status: 'Cancelled', Order_Status: 'Cancelled' } : null);
              showToast('Order has been cancelled', 'success');
              
              // Redirect back to orders list after cancellation
              setTimeout(() => {
                router.replace('/(tabs)/orders');
              }, 1500);
              
            } catch (error: any) {
              showToast(error.error || 'Failed to cancel order', 'error');
            }
          },
        },
      ]
    );
  };

  const handleDownloadInvoice = () => {
    showToast('Downloading invoice...', 'info');
  };

  const handleBackPress = () => {
    // Navigate back to orders list to ensure refresh
    router.replace('/(tabs)/orders');
  };

  const calculateItemTotal = (item: OrderItem) => {
    const totalDiscount = (item.basicDiscount || 0) + (item.schemeDiscount || 0) + (item.additionalDiscount || 0);
    const discountedPrice = item.unitPrice * (1 - totalDiscount / 100);
    return discountedPrice * item.quantity;
  };

  const calculateOrderSubtotal = () => {
    return order?.items?.reduce((sum, item) => sum + calculateItemTotal(item), 0) || order?.totalAmount || 0;
  };

  const renderStatusModal = () => {
    const statuses = [
      { key: 'New', label: 'New' },
      { key: 'Pending', label: 'Pending' },
      { key: 'Processing', label: 'Processing' },
      { key: 'Completed', label: 'Completed' },
      { key: 'Hold', label: 'Hold' },
      { key: 'Picked', label: 'Picked' },
      { key: 'Dispatched', label: 'Dispatched' },
      { key: 'Cancelled', label: 'Cancelled' },
    ];

    return (
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(300)} style={styles.statusModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            {statuses.map((status) => (
              <TouchableOpacity
                key={status.key}
                style={[
                  styles.statusOption,
                  newStatus === status.key && styles.selectedStatusOption
                ]}
                onPress={() => setNewStatus(status.key)}
              >
                <Text style={[
                  styles.statusOptionText,
                  newStatus === status.key && styles.selectedStatusOptionText
                ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <View style={styles.notesInput}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Add notes about this status change..."
                value={statusNotes}
                onChangeText={setStatusNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowStatusModal(false)}
                disabled={isUpdatingStatus}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdateStatus}
                disabled={!newStatus || isUpdatingStatus}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.updateGradient}
                >
                  {isUpdatingStatus ? (
                    <LoadingSpinner size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.updateButtonText}>Update Status</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading order details..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadOrderDetails} />;
  }

  if (!order) {
    return <ErrorMessage error="Order not found" />;
  }

  const statusInfo = getStatusInfo(order.status || order.Order_Status);
  const subtotal = calculateOrderSubtotal();
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;
  const orderNumber = order.orderNumber || order.CRMOrderId;
  const retailerName = order.retailer?.businessName || order.Retailer_Name;
  const contactPerson = order.retailer?.contactName || order.Contact_Person;
  const orderDate = order.orderDate || order.created_at;
  const branchName = order.branch || order.Branch_Name;
  const companyName = order.Company_Name;
  const isUrgent = order.urgent || order.Urgent_Status === 1;

  return (
    <View style={styles.container}>
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
              <Text style={styles.headerTitleText}>Order #{orderNumber}</Text>
              <Text style={styles.headerSubtitle}>
                {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleDownloadInvoice}
              >
                <Download size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Order Status */}
        <Animated.View entering={FadeInUp.delay(0).duration(600)} style={styles.statusCard}>
          <View style={[styles.statusHeader, { backgroundColor: statusInfo.bgColor }]}>
            <View style={styles.statusInfo}>
              {statusInfo.icon}
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.text}
                </Text>
                <Text style={styles.statusDescription}>{statusInfo.description}</Text>
              </View>
            </View>
            
            {isUrgent && (
              <View style={styles.urgentBadge}>
                <Star size={16} color="#ef4444" />
                <Text style={styles.urgentText}>Urgent</Text>
              </View>
            )}
          </View>
          
          {canUpdateStatus && (
            <TouchableOpacity
              style={styles.updateStatusButton}
              onPress={() => setShowStatusModal(true)}
            >
              <Edit3 size={16} color="#667eea" />
              <Text style={styles.updateStatusText}>Update Status</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Order Summary */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.summaryCard}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Order Total</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(total)}</Text>
            </View>
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Calendar size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.summaryText}>Ordered: {formatDate(orderDate)}</Text>
              </View>
              {order.deliveryDate && (
                <View style={styles.summaryRow}>
                  <Truck size={16} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.summaryText}>Delivery: {formatDate(order.deliveryDate)}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Building size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.summaryText}>Branch: {branchName}</Text>
              </View>
              {order.PO_Number && (
                <View style={styles.summaryRow}>
                  <FileText size={16} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.summaryText}>PO: {order.PO_Number}</Text>
                </View>
              )}
              {companyName && (
                <View style={styles.summaryRow}>
                  <Building size={16} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.summaryText}>Company: {companyName}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Customer Information */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.customerCard}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerInfo}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.customerIcon}
            >
              <User size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{retailerName}</Text>
              {contactPerson && contactPerson !== '0' && (
                <Text style={styles.contactName}>{contactPerson}</Text>
              )}
              {order.retailer?.email && (
                <View style={styles.contactRow}>
                  <Mail size={14} color="#64748b" />
                  <Text style={styles.contactText}>{order.retailer.email}</Text>
                </View>
              )}
              {order.retailer?.phone && (
                <View style={styles.contactRow}>
                  <Phone size={14} color="#64748b" />
                  <Text style={styles.contactText}>{order.retailer.phone}</Text>
                </View>
              )}
              {order.retailer?.address && (
                <View style={styles.contactRow}>
                  <MapPin size={14} color="#64748b" />
                  <Text style={styles.contactText}>{order.retailer.address}</Text>
                </View>
              )}
              {order.retailer?.creditLimit && (
                <View style={styles.contactRow}>
                  <DollarSign size={14} color="#059669" />
                  <Text style={[styles.contactText, { color: '#059669', fontWeight: '600' }]}>
                    Credit Limit: {formatCurrency(order.retailer.creditLimit)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Order Items */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items && order.items.map((item, index) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemImageContainer}>
                {item.part?.image ? (
                  <Image source={{ uri: item.part.image }} style={styles.itemImage} />
                ) : (
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.itemImagePlaceholder}
                  >
                    <Package size={20} color="#FFFFFF" />
                  </LinearGradient>
                )}
                {item.urgent && (
                  <View style={styles.itemUrgentBadge}>
                    <Star size={10} color="#ef4444" />
                  </View>
                )}
              </View>
              
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.partName || item.part?.name || 'Unknown Part'}</Text>
                <Text style={styles.itemNumber}>#{item.partNumber}</Text>
                {item.part?.category && (
                  <Text style={styles.itemCategory}>{item.part.category}</Text>
                )}
                
                {/* Discount Information */}
                {((item.basicDiscount || 0) + (item.schemeDiscount || 0) + (item.additionalDiscount || 0)) > 0 && (
                  <View style={styles.discountInfo}>
                    <Text style={styles.discountText}>
                      Discounts: {item.basicDiscount || 0}% + {item.schemeDiscount || 0}% + {item.additionalDiscount || 0}%
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.itemPricing}>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                <Text style={styles.itemUnitPrice}>{formatCurrency(item.unitPrice)} each</Text>
                <Text style={styles.itemTotalPrice}>{formatCurrency(calculateItemTotal(item))}</Text>
              </View>
            </View>
          ))}
          
          {/* Order Totals */}
          <View style={styles.orderTotals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax (8%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.historyCard}>
            <Text style={styles.sectionTitle}>Status History</Text>
            {order.statusHistory.map((history, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  {getStatusInfo(history.status).icon}
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyStatus}>{getStatusInfo(history.status).text}</Text>
                  <Text style={styles.historyTime}>{formatDateTime(history.timestamp)}</Text>
                  <Text style={styles.historyUser}>by {history.updatedBy}</Text>
                  {history.notes && (
                    <Text style={styles.historyNotes}>{history.notes}</Text>
                  )}
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Notes */}
        {(order.notes || order.Remark) && (
          <Animated.View entering={FadeInUp.delay(1000).duration(600)} style={styles.notesCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.notes || order.Remark}</Text>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View entering={FadeInUp.delay(1200).duration(600)} style={styles.actionButtons}>
          {canEditOrder() && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/(tabs)/orders/${order.id || order.Order_Id}?edit=true`)}
            >
              <Edit3 size={18} color="#667eea" />
              <Text style={styles.actionButtonText}>Edit Order</Text>
            </TouchableOpacity>
          )}
          
          {canCancelOrder() && (
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleCancelOrder}
            >
              <Trash2 size={18} color="#ef4444" />
              <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>

      {/* Status Update Modal */}
      {renderStatusModal()}
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
  headerActions: {
    width: 44,
    alignItems: 'flex-end',
  },
  headerActionButton: {
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
    paddingBottom: 140, // Fixed: Increased from 40 to 140 to account for tab bar height
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 8,
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusTextContainer: {
    marginLeft: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  updateStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  updateStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 20,
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
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryDetails: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
  },
  customerCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  customerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  itemsCard: {
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
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemImageContainer: {
    marginRight: 16,
    position: 'relative',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemUrgentBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  itemNumber: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 4,
  },
  discountInfo: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  discountText: {
    fontSize: 10,
    color: '#d97706',
    fontWeight: '600',
  },
  itemPricing: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  itemUnitPrice: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  orderTotals: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  grandTotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 0,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  historyCard: {
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
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  historyUser: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  historyNotes: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  notesCard: {
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
  notesText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  dangerButton: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  dangerButtonText: {
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModal: {
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
  statusOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedStatusOption: {
    backgroundColor: '#ede9fe',
  },
  statusOptionText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  selectedStatusOptionText: {
    color: '#667eea',
    fontWeight: '600',
  },
  notesInput: {
    marginTop: 16,
    marginBottom: 24,
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
    minHeight: 80,
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
  updateButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  updateGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});