import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, Search, Package, AlertTriangle, Save, Calculator, ShoppingCart, User, Calendar, FileText, Zap, CheckCircle, Triangle as ExclamationTriangle } from 'lucide-react';
import { NewOrderForm, NewOrderItemForm, Part, Retailer, dateToTimestamp, formatCurrency } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ItemMaster } from '../Parts/ItemMaster';

interface NewOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: NewOrderForm) => void;
}

interface ValidationErrors {
  retailer_id?: string;
  po_number?: string;
  items?: string;
  general?: string;
}

interface DuplicateItemConfirmation {
  show: boolean;
  existingIndex: number;
  newPart: Part;
}

const mockRetailers: Retailer[] = [
  {
    Retailer_Id: 1,
    Retailer_Name: 'Downtown Auto Parts',
    Contact_Person: 'Michael Johnson',
    Retailer_Email: 'michael@downtownauto.com',
    Credit_Limit: 50000
  },
  {
    Retailer_Id: 2,
    Retailer_Name: 'Quick Fix Auto',
    Contact_Person: 'Sarah Williams',
    Retailer_Email: 'sarah@quickfixauto.com',
    Credit_Limit: 75000
  },
  {
    Retailer_Id: 3,
    Retailer_Name: 'Sunset Auto Supply',
    Contact_Person: 'David Chen',
    Retailer_Email: 'david@sunsetauto.com',
    Credit_Limit: 100000
  }
];

export const NewOrderFormModal: React.FC<NewOrderFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<NewOrderForm>({
    retailer_id: 0,
    po_number: '',
    po_date: new Date(),
    urgent: false,
    remark: '',
    items: []
  });
  const [showPartSelector, setShowPartSelector] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [retailers] = useState<Retailer[]>(mockRetailers);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [duplicateConfirmation, setDuplicateConfirmation] = useState<DuplicateItemConfirmation>({
    show: false,
    existingIndex: -1,
    newPart: {} as Part
  });

  useEffect(() => {
    if (formData.retailer_id) {
      const retailer = retailers.find(r => r.Retailer_Id === formData.retailer_id);
      setSelectedRetailer(retailer || null);
      if (validationErrors.retailer_id) {
        setValidationErrors(prev => ({ ...prev, retailer_id: undefined }));
      }
    } else {
      setSelectedRetailer(null);
    }
  }, [formData.retailer_id, retailers, validationErrors.retailer_id]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.retailer_id || formData.retailer_id === 0) {
      errors.retailer_id = 'Please select a retailer';
    }

    if (formData.items.length === 0) {
      errors.items = 'Please add at least one item to the order';
    } else {
      const itemErrors = formData.items.some((item, index) => {
        if (!item.part_number || item.part_number.trim() === '') {
          errors.general = `Item ${index + 1}: Part number is required`;
          return true;
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.general = `Item ${index + 1}: Quantity must be greater than 0`;
          return true;
        }
        if (!item.mrp || item.mrp <= 0) {
          errors.general = `Item ${index + 1}: MRP must be greater than 0`;
          return true;
        }
        return false;
      });
    }

    if (formData.po_number && formData.po_number.trim() !== '') {
      const poPattern = /^[A-Za-z0-9\-_]+$/;
      if (!poPattern.test(formData.po_number.trim())) {
        errors.po_number = 'PO number can only contain letters, numbers, hyphens, and underscores';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof NewOrderForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'retailer_id' && validationErrors.retailer_id) {
      setValidationErrors(prev => ({ ...prev, retailer_id: undefined }));
    }
    if (field === 'po_number' && validationErrors.po_number) {
      setValidationErrors(prev => ({ ...prev, po_number: undefined }));
    }
  };

  const handleAddItem = () => {
    setEditingItemIndex(null);
    setShowPartSelector(true);
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    setShowPartSelector(true);
  };

  const checkForDuplicateItem = (part: Part): number => {
    return formData.items.findIndex(item => item.part_number === part.Part_Number);
  };

  const handlePartSelect = (part: Part) => {
    const existingIndex = checkForDuplicateItem(part);
    
    if (editingItemIndex !== null) {
      const newItem: NewOrderItemForm = {
        part_number: part.Part_Number,
        part_name: part.Part_Name || '',
        quantity: formData.items[editingItemIndex].quantity,
        mrp: part.Part_Price || 0,
        basic_discount: part.Part_BasicDisc || 0,
        scheme_discount: part.Part_SchemeDisc || 0,
        additional_discount: part.Part_AdditionalDisc || 0,
        urgent: formData.items[editingItemIndex].urgent
      };

      const updatedItems = [...formData.items];
      updatedItems[editingItemIndex] = newItem;
      setFormData(prev => ({ ...prev, items: updatedItems }));
      setShowPartSelector(false);
      setEditingItemIndex(null);
      return;
    }

    if (existingIndex !== -1) {
      setDuplicateConfirmation({
        show: true,
        existingIndex,
        newPart: part
      });
      return;
    }

    addNewItem(part);
  };

  const addNewItem = (part: Part, quantity: number = 1) => {
    const newItem: NewOrderItemForm = {
      part_number: part.Part_Number,
      part_name: part.Part_Name || '',
      quantity,
      mrp: part.Part_Price || 0,
      basic_discount: part.Part_BasicDisc || 0,
      scheme_discount: part.Part_SchemeDisc || 0,
      additional_discount: part.Part_AdditionalDisc || 0,
      urgent: false
    };

    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setShowPartSelector(false);
    setEditingItemIndex(null);
    
    if (validationErrors.items) {
      setValidationErrors(prev => ({ ...prev, items: undefined }));
    }
  };

  const handleDuplicateConfirmation = (action: 'increase' | 'add' | 'cancel') => {
    const { existingIndex, newPart } = duplicateConfirmation;
    
    switch (action) {
      case 'increase':
        const updatedItems = [...formData.items];
        updatedItems[existingIndex].quantity += 1;
        setFormData(prev => ({ ...prev, items: updatedItems }));
        break;
      case 'add':
        addNewItem(newPart);
        break;
      case 'cancel':
        break;
    }
    
    setDuplicateConfirmation({ show: false, existingIndex: -1, newPart: {} as Part });
    setShowPartSelector(false);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleItemChange = (index: number, field: keyof NewOrderItemForm, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: updatedItems }));
    
    if (validationErrors.general) {
      setValidationErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const handleQuantityChange = (index: number, change: number) => {
    const currentQuantity = formData.items[index].quantity;
    const newQuantity = Math.max(1, currentQuantity + change);
    handleItemChange(index, 'quantity', newQuantity);
  };

  const calculateItemTotal = (item: NewOrderItemForm): number => {
    const totalDiscount = item.basic_discount + item.scheme_discount + item.additional_discount;
    const discountedPrice = item.mrp * (1 - totalDiscount / 100);
    return discountedPrice * item.quantity;
  };

  const calculateOrderTotal = (): number => {
    return formData.items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      onSubmit(formData);
      resetForm();
      onClose();
    } catch (error) {
      setValidationErrors({ general: 'Failed to create order. Please try again.' });
    }
  };

  const resetForm = () => {
    setFormData({
      retailer_id: 0,
      po_number: '',
      po_date: new Date(),
      urgent: false,
      remark: '',
      items: []
    });
    setSelectedRetailer(null);
    setValidationErrors({});
    setDuplicateConfirmation({ show: false, existingIndex: -1, newPart: {} as Part });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#003366] rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create New Order</h2>
                  <p className="text-gray-600">Add items and configure order details</p>
                </div>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {validationErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <ExclamationTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700">{validationErrors.general}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Retailer *
                </label>
                <select
                  value={formData.retailer_id}
                  onChange={(e) => handleInputChange('retailer_id', parseInt(e.target.value))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none ${
                    validationErrors.retailer_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value={0}>Select Retailer</option>
                  {retailers.map(retailer => (
                    <option key={retailer.Retailer_Id} value={retailer.Retailer_Id}>
                      {retailer.Retailer_Name} - {retailer.Contact_Person}
                    </option>
                  ))}
                </select>
                {validationErrors.retailer_id && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.retailer_id}</p>
                )}
                {selectedRetailer && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Credit Limit:</strong> {formatCurrency(selectedRetailer.Credit_Limit)}
                    </p>
                    <p className="text-sm text-blue-700">{selectedRetailer.Retailer_Email}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  PO Number
                </label>
                <input
                  type="text"
                  value={formData.po_number}
                  onChange={(e) => handleInputChange('po_number', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none ${
                    validationErrors.po_number ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter PO number"
                />
                {validationErrors.po_number && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.po_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  PO Date
                </label>
                <input
                  type="date"
                  value={formData.po_date?.toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange('po_date', new Date(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.urgent}
                    onChange={(e) => handleInputChange('urgent', e.target.checked)}
                    className="w-4 h-4 text-[#003366] bg-gray-100 border-gray-300 rounded focus:ring-[#003366] focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <Zap className="w-4 h-4 mr-1 text-orange-500" />
                    Mark as Urgent Order
                  </span>
                </label>
                {formData.urgent && (
                  <p className="mt-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    This order will be prioritized for processing and delivery.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none resize-none"
                  placeholder="Add any special instructions or notes..."
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Order Items ({formData.items.length})
                  </h3>
                  {validationErrors.items && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.items}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  validationErrors.items ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}>
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No items added yet</h4>
                  <p className="text-gray-600 mb-4">Start building your order by adding parts</p>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-[#003366] text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add First Item</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Part</label>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.part_name}</p>
                            <p className="text-xs text-gray-500">{item.part_number}</p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(index, -1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 px-2 py-1 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(index, 1)}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">MRP</label>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.mrp)}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Discount</label>
                          <div className="text-sm font-medium text-green-600">
                            {item.basic_discount + item.scheme_discount + item.additional_discount}%
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Line Total</label>
                          <div className="text-sm font-bold text-[#003366]">
                            {formatCurrency(calculateItemTotal(item))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={item.urgent}
                              onChange={(e) => handleItemChange(index, 'urgent', e.target.checked)}
                              className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                            />
                            <span className="text-sm text-gray-700 flex items-center">
                              <Zap className="w-3 h-3 mr-1 text-orange-500" />
                              Urgent Item
                            </span>
                          </label>

                          <div className="text-xs text-gray-500">
                            Discounts: Basic {item.basic_discount}% + Scheme {item.scheme_discount}% + Additional {item.additional_discount}%
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditItem(index)}
                            className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                            title="Change part"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formData.items.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calculator className="w-6 h-6 text-blue-600" />
                    <div>
                      <h4 className="text-lg font-semibold text-blue-900">Order Summary</h4>
                      <p className="text-sm text-blue-700">{formData.items.length} items</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(calculateOrderTotal())}</p>
                  </div>
                </div>

                {formData.urgent && (
                  <div className="mt-4 flex items-center space-x-2 text-orange-700 bg-orange-100 p-3 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm font-medium">This is marked as an urgent order</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>Create Order</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {duplicateConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ExclamationTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Duplicate Item Detected</h3>
                  <p className="text-sm text-gray-600">This part is already in your order</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm font-medium text-gray-900">{duplicateConfirmation.newPart.Part_Name}</p>
                <p className="text-xs text-gray-500">{duplicateConfirmation.newPart.Part_Number}</p>
                <p className="text-sm text-gray-700 mt-2">
                  Current quantity: {formData.items[duplicateConfirmation.existingIndex]?.quantity || 0}
                </p>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Would you like to increase the quantity of the existing item or add it as a separate line item?
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleDuplicateConfirmation('cancel')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDuplicateConfirmation('increase')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Increase Qty</span>
                </button>
                <button
                  onClick={() => handleDuplicateConfirmation('add')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Separate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPartSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingItemIndex !== null ? 'Edit Item' : 'Select Part'}
                </h3>
                <button 
                  onClick={() => {
                    setShowPartSelector(false);
                    setEditingItemIndex(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <ItemMaster 
                onPartSelect={handlePartSelect}
                selectionMode={true}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};