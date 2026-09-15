import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  Upload,
  Download,
  Filter,
  Eye,
  Copy,
  Star,
  Award,
  Tag,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { Part, PartCategory, FocusGroup } from '../../types';

const mockParts: Part[] = [
  {
    Part_Number: 'SP-001-NGK',
    Part_Name: 'NGK Spark Plug - Standard',
    Part_Price: 1299,
    Part_Discount: '5%',
    Part_Image: 'https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=400',
    Part_MinQty: 10,
    Part_BasicDisc: 5,
    Part_SchemeDisc: 3,
    Part_AdditionalDisc: 2,
    Part_Application: 'Honda Civic, Toyota Corolla, Nissan Sentra',
    GuruPoint: 50,
    ChampionPoint: 75,
    Alternate_PartNumber: 'NGK-6962, DENSO-K20TT',
    T1: 150,
    T2: 200,
    T3: 175,
    T4: 125,
    T5: 100,
    Is_Order_Pad: 1,
    Item_Status: 'Active',
    Order_Pad_Category: 1,
    Previous_PartNumber: 'SP-001-OLD',
    Focus_Group: 'Engine Components',
    Part_Catagory: 'Ignition System',
    Last_Sync: 1704067200000
  },
  {
    Part_Number: 'BP-002-BREMBO',
    Part_Name: 'Brembo Brake Pads - Front Set',
    Part_Price: 4599,
    Part_Discount: '10%',
    Part_Image: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=400',
    Part_MinQty: 5,
    Part_BasicDisc: 8,
    Part_SchemeDisc: 5,
    Part_AdditionalDisc: 3,
    Part_Application: 'BMW 3 Series, Mercedes C-Class, Audi A4',
    GuruPoint: 100,
    ChampionPoint: 150,
    Alternate_PartNumber: 'AKEBONO-ASP1424, BOSCH-BP1234',
    T1: 25,
    T2: 30,
    T3: 28,
    T4: 22,
    T5: 20,
    Is_Order_Pad: 1,
    Item_Status: 'Active',
    Order_Pad_Category: 2,
    Previous_PartNumber: '',
    Focus_Group: 'Brake System',
    Part_Catagory: 'Brake Pads',
    Last_Sync: 1704067200000
  },
  {
    Part_Number: 'OF-003-MANN',
    Part_Name: 'Mann Oil Filter - Premium',
    Part_Price: 899,
    Part_Discount: '0%',
    Part_Image: 'https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=400',
    Part_MinQty: 20,
    Part_BasicDisc: 3,
    Part_SchemeDisc: 2,
    Part_AdditionalDisc: 1,
    Part_Application: 'Universal - Most European Cars',
    GuruPoint: 25,
    ChampionPoint: 40,
    Alternate_PartNumber: 'MAHLE-OC90, BOSCH-0451103316',
    T1: 100,
    T2: 120,
    T3: 110,
    T4: 95,
    T5: 85,
    Is_Order_Pad: 1,
    Item_Status: 'Active',
    Order_Pad_Category: 1,
    Previous_PartNumber: 'OF-003-OLD',
    Focus_Group: 'Engine Components',
    Part_Catagory: 'Filters',
    Last_Sync: 1704067200000
  }
];

const mockCategories: PartCategory[] = [
  { id: 1, name: 'Engine Components', description: 'Engine related parts and components' },
  { id: 2, name: 'Brake System', description: 'Brake pads, discs, and related components' },
  { id: 3, name: 'Suspension', description: 'Shock absorbers, springs, and suspension parts' },
  { id: 4, name: 'Electrical', description: 'Electrical components and accessories' },
  { id: 5, name: 'Body Parts', description: 'External and internal body components' }
];

const mockFocusGroups: FocusGroup[] = [
  { id: 'engine', name: 'Engine Components', description: 'Core engine parts' },
  { id: 'brake', name: 'Brake System', description: 'Braking components' },
  { id: 'suspension', name: 'Suspension', description: 'Suspension and steering' },
  { id: 'electrical', name: 'Electrical', description: 'Electrical systems' },
  { id: 'body', name: 'Body Parts', description: 'Body and exterior parts' }
];

interface ItemMasterProps {
  onPartSelect?: (part: Part) => void;
  selectionMode?: boolean;
}

export const ItemMaster: React.FC<ItemMasterProps> = ({ onPartSelect, selectionMode = false }) => {
  const [parts, setParts] = useState<Part[]>(mockParts);
  const [categories] = useState<PartCategory[]>(mockCategories);
  const [focusGroups] = useState<FocusGroup[]>(mockFocusGroups);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFocusGroup, setSelectedFocusGroup] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [formData, setFormData] = useState<Partial<Part>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate data fetching
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setParts(mockParts);
    }, 1000);
  }, []);

  const filteredParts = parts.filter(part => {
    const matchesSearch = 
      part.Part_Number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.Part_Name && part.Part_Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (part.Part_Application && part.Part_Application.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || part.Part_Catagory === selectedCategory;
    const matchesFocusGroup = selectedFocusGroup === 'All' || part.Focus_Group === selectedFocusGroup;
    const matchesStatus = statusFilter === 'All' || part.Item_Status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesFocusGroup && matchesStatus;
  });

  const handleAddPart = () => {
    setFormData({
      Part_Number: '',
      Part_Name: '',
      Part_Price: 0,
      Part_Discount: '0%',
      Part_MinQty: 1,
      Part_BasicDisc: 0,
      Part_SchemeDisc: 0,
      Part_AdditionalDisc: 0,
      GuruPoint: 0,
      ChampionPoint: 0,
      T1: 0,
      T2: 0,
      T3: 0,
      T4: 0,
      T5: 0,
      Is_Order_Pad: 1,
      Item_Status: 'Active',
      Order_Pad_Category: 1,
      Part_Catagory: categories[0]?.name || '',
      Focus_Group: focusGroups[0]?.name || ''
    });
    setShowAddModal(true);
  };

  const handleEditPart = (part: Part) => {
    setSelectedPart(part);
    setFormData(part);
    setShowEditModal(true);
  };

  const handleViewPart = (part: Part) => {
    setSelectedPart(part);
    setShowViewModal(true);
  };

  const handleSavePart = () => {
    if (showEditModal && selectedPart) {
      setParts(prev => prev.map(p => 
        p.Part_Number === selectedPart.Part_Number ? { ...formData as Part } : p
      ));
      setShowEditModal(false);
    } else if (showAddModal) {
      setParts(prev => [...prev, { ...formData as Part }]);
      setShowAddModal(false);
    }
    setFormData({});
    setSelectedPart(null);
  };

  const handleDeletePart = (partNumber: string) => {
    if (confirm('Are you sure you want to delete this part?')) {
      setParts(prev => prev.filter(p => p.Part_Number !== partNumber));
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '$0.00';
    return `$${(price / 100).toFixed(2)}`;
  };

  const getStockLevel = (part: Part) => {
    const total = (part.T1 || 0) + (part.T2 || 0) + (part.T3 || 0) + (part.T4 || 0) + (part.T5 || 0);
    const minQty = part.Part_MinQty || 0;
    
    if (total <= minQty) return { level: 'critical', color: 'text-red-600', bg: 'bg-red-100' };
    if (total <= minQty * 2) return { level: 'low', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const PartFormModal = ({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Part Number *</label>
                  <input
                    type="text"
                    value={formData.Part_Number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Part_Number: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter part number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Part Name</label>
                  <input
                    type="text"
                    value={formData.Part_Name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Part_Name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter part name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (cents)</label>
                    <input
                      type="number"
                      value={formData.Part_Price || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, Part_Price: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                    <input
                      type="text"
                      value={formData.Part_Discount || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, Part_Discount: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                      placeholder="0%"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.Part_Catagory || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Part_Catagory: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Focus Group</label>
                  <select
                    value={formData.Focus_Group || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Focus_Group: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    {focusGroups.map(group => (
                      <option key={group.id} value={group.name}>{group.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Advanced Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application</label>
                  <textarea
                    value={formData.Part_Application || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Part_Application: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none resize-none"
                    placeholder="Vehicle applications..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Part Numbers</label>
                  <input
                    type="text"
                    value={formData.Alternate_PartNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Alternate_PartNumber: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Comma separated alternate part numbers"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Basic Disc %</label>
                    <input
                      type="number"
                      value={formData.Part_BasicDisc || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, Part_BasicDisc: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scheme Disc %</label>
                    <input
                      type="number"
                      value={formData.Part_SchemeDisc || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, Part_SchemeDisc: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Disc %</label>
                    <input
                      type="number"
                      value={formData.Part_AdditionalDisc || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, Part_AdditionalDisc: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guru Points</label>
                    <input
                      type="number"
                      value={formData.GuruPoint || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, GuruPoint: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Champion Points</label>
                    <input
                      type="number"
                      value={formData.ChampionPoint || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, ChampionPoint: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Levels */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Levels</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Qty</label>
                  <input
                    type="number"
                    value={formData.Part_MinQty || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, Part_MinQty: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">T1</label>
                  <input
                    type="number"
                    value={formData.T1 || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, T1: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">T2</label>
                  <input
                    type="number"
                    value={formData.T2 || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, T2: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">T3</label>
                  <input
                    type="number"
                    value={formData.T3 || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, T3: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">T4</label>
                  <input
                    type="number"
                    value={formData.T4 || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, T4: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">T5</label>
                  <input
                    type="number"
                    value={formData.T5 || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, T5: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Additional Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.Item_Status || 'Active'}
                    onChange={(e) => setFormData(prev => ({ ...prev, Item_Status: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Pad Category</label>
                  <input
                    type="number"
                    value={formData.Order_Pad_Category || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, Order_Pad_Category: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Previous Part Number</label>
                  <input
                    type="text"
                    value={formData.Previous_PartNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Previous_PartNumber: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Previous part number"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isOrderPad"
                    checked={formData.Is_Order_Pad === 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, Is_Order_Pad: e.target.checked ? 1 : 0 }))}
                    className="w-4 h-4 text-[#003366] bg-gray-100 border-gray-300 rounded focus:ring-[#003366] focus:ring-2"
                  />
                  <label htmlFor="isOrderPad" className="ml-2 text-sm font-medium text-gray-900">
                    Include in Order Pad
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePart}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              Save Part
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PartViewModal = ({ isOpen, onClose, part }: { isOpen: boolean; onClose: () => void; part: Part | null }) => {
    if (!isOpen || !part) return null;

    const stockStatus = getStockLevel(part);
    const totalStock = (part.T1 || 0) + (part.T2 || 0) + (part.T3 || 0) + (part.T4 || 0) + (part.T5 || 0);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#003366] rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{part.Part_Number}</h2>
                  <p className="text-gray-600">{part.Part_Name}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Part Image and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {part.Part_Image ? (
                  <img 
                    src={part.Part_Image} 
                    alt={part.Part_Name}
                    className="w-full h-64 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-2xl font-bold text-[#003366]">{formatPrice(part.Part_Price)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Discount</p>
                    <p className="text-2xl font-bold text-green-600">{part.Part_Discount || '0%'}</p>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${stockStatus.bg}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Stock</p>
                      <p className={`text-2xl font-bold ${stockStatus.color}`}>{totalStock} units</p>
                    </div>
                    {stockStatus.level === 'critical' && <AlertTriangle className="w-6 h-6 text-red-600" />}
                    {stockStatus.level === 'good' && <CheckCircle className="w-6 h-6 text-green-600" />}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium">Guru: {part.GuruPoint || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium">Champion: {part.ChampionPoint || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Part Details</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Category</p>
                    <p className="text-gray-900">{part.Part_Catagory}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Focus Group</p>
                    <p className="text-gray-900">{part.Focus_Group}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      part.Item_Status === 'Active' ? 'bg-green-100 text-green-800' :
                      part.Item_Status === 'Inactive' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {part.Item_Status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Minimum Quantity</p>
                    <p className="text-gray-900">{part.Part_MinQty || 0} units</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Discount Structure</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Basic Discount:</span>
                    <span className="font-medium">{part.Part_BasicDisc || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Scheme Discount:</span>
                    <span className="font-medium">{part.Part_SchemeDisc || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Additional Discount:</span>
                    <span className="font-medium">{part.Part_AdditionalDisc || 0}%</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Total Discount:</span>
                      <span className="font-bold text-green-600">
                        {((part.Part_BasicDisc || 0) + (part.Part_SchemeDisc || 0) + (part.Part_AdditionalDisc || 0))}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Distribution */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Distribution</h3>
              <div className="grid grid-cols-5 gap-4">
                {['T1', 'T2', 'T3', 'T4', 'T5'].map((tier, index) => {
                  const value = [part.T1, part.T2, part.T3, part.T4, part.T5][index] || 0;
                  return (
                    <div key={tier} className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm font-medium text-gray-600">{tier}</p>
                      <p className="text-xl font-bold text-gray-900">{value}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Application and Alternates */}
            {part.Part_Application && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Applications</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{part.Part_Application}</p>
              </div>
            )}

            {part.Alternate_PartNumber && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Alternate Part Numbers</h3>
                <div className="flex flex-wrap gap-2">
                  {part.Alternate_PartNumber.split(',').map((alt, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      {alt.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={() => {
                onClose();
                handleEditPart(part);
              }}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Part</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts Inventory</h1>
          <p className="text-gray-600">Comprehensive parts inventory management system</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Import</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
          <button 
            onClick={handleAddPart}
            className="bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Part</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-5 h-5 text-[#003366]" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search parts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <select
            value={selectedFocusGroup}
            onChange={(e) => setSelectedFocusGroup(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="All">All Focus Groups</option>
            {focusGroups.map(group => (
              <option key={group.id} value={group.name}>{group.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Discontinued">Discontinued</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <span className="font-medium">{filteredParts.length}</span> parts found
          </div>
        </div>
      </div>

      {/* Parts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredParts.map((part) => {
          const stockStatus = getStockLevel(part);
          const totalStock = (part.T1 || 0) + (part.T2 || 0) + (part.T3 || 0) + (part.T4 || 0) + (part.T5 || 0);
          
          return (
            <div key={part.Part_Number} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Part Image */}
              <div className="relative h-48 bg-gray-100">
                {part.Part_Image ? (
                  <img 
                    src={part.Part_Image} 
                    alt={part.Part_Name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    part.Item_Status === 'Active' ? 'bg-green-100 text-green-800' :
                    part.Item_Status === 'Inactive' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {part.Item_Status}
                  </span>
                </div>

                {/* Stock Status */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                    {stockStatus.level === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {totalStock} units
                  </span>
                </div>

                {/* Order Pad Indicator */}
                {part.Is_Order_Pad === 1 && (
                  <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Tag className="w-3 h-3 mr-1" />
                      Order Pad
                    </span>
                  </div>
                )}
              </div>

              {/* Part Details */}
              <div className="p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{part.Part_Number}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{part.Part_Name}</p>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-lg font-bold text-[#003366]">{formatPrice(part.Part_Price)}</p>
                    {part.Part_Discount && part.Part_Discount !== '0%' && (
                      <p className="text-sm text-green-600">{part.Part_Discount} off</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm font-medium text-gray-900">{part.Part_Catagory}</p>
                  </div>
                </div>

                {/* Points */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs text-gray-600">{part.GuruPoint || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-gray-600">{part.ChampionPoint || 0}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Min: {part.Part_MinQty || 0}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  {selectionMode ? (
                    <button
                      onClick={() => onPartSelect?.(part)}
                      className="w-full bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm"
                    >
                      Select Part
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 w-full">
                      <button
                        onClick={() => handleViewPart(part)}
                        className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleEditPart(part)}
                        className="flex-1 bg-[#003366] text-white px-3 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm flex items-center justify-center space-x-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePart(part.Part_Number)}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-12 text-center">
          <div className="w-12 h-12 border-4 border-t-[#003366] border-gray-200 dark:border-gray-700 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading parts...</p>
        </div>
      )}

      {filteredParts.length === 0 && !loading && (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <img
            src="/empty-state.svg"
            alt="No parts illustration"
            className="w-40 h-40 mx-auto mb-4 opacity-80"
            loading="lazy"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }}
          />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No parts found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search criteria or add a new part.</p>
          <button
            onClick={handleAddPart}
            className="inline-flex items-center px-5 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors mt-2"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Part
          </button>
        </div>
      )}

      {error && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center flex flex-col items-center justify-center">
            <img
              src="/error-state.svg"
              alt="Error illustration"
              className="w-32 h-32 mx-auto mb-4 opacity-90"
              loading="lazy"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.10))' }}
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
          </div>
        </div>
      )}

      {/* Modals */}
      <PartFormModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title="Add New Part" 
      />
      <PartFormModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Edit Part" 
      />
      <PartViewModal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        part={selectedPart} 
      />
    </div>
  );
};