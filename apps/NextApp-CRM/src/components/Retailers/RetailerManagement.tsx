import React, { useState, useEffect, ChangeEvent } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  Phone, 
  Mail, 
  MapPin,
  Store,
  Eye,
  X,
  Upload,
  Download,
  Filter,
  Building2,
  CreditCard,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  User,
  Hash,
  DollarSign
} from 'lucide-react';
import { Retailer } from '../../types';
import { retailersAPI } from '../../services/api';

export const RetailerManagement: React.FC = () => {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [areas] = useState([
    { id: 1, name: 'Manhattan Downtown' },
    { id: 2, name: 'SoHo District' },
    { id: 3, name: 'Hollywood' },
    { id: 4, name: 'Brooklyn Heights' }
  ]);
  const [retailerTypes] = useState([
    { id: 1, name: 'Premium Dealer' },
    { id: 2, name: 'Standard Dealer' },
    { id: 3, name: 'Basic Dealer' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [formData, setFormData] = useState<Partial<Retailer>>({});
  const [retailerImagePreview, setRetailerImagePreview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load retailers from API
  useEffect(() => {
    const loadRetailers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await retailersAPI.getRetailers();
        setRetailers(response.data.retailers || []);
      } catch (err) {
        setError('Failed to load retailers. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadRetailers();
  }, []);

  const filteredRetailers = retailers.filter((retailer: Retailer) => {
    const matchesSearch = 
      (retailer.Retailer_Name && retailer.Retailer_Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (retailer.Contact_Person && retailer.Contact_Person.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (retailer.Retailer_Email && retailer.Retailer_Email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (retailer.RetailerCRMId && retailer.RetailerCRMId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesArea = selectedArea === 'all' || retailer.Area_Id?.toString() === selectedArea;
    const matchesStatus = selectedStatus === 'all' || retailer.Retailer_Status?.toString() === selectedStatus;
    
    return matchesSearch && matchesArea && matchesStatus;
  });

  const handleAddRetailer = () => {
    setFormData({
      Retailer_Name: '',
      RetailerCRMId: '',
      Retailer_Address: '',
      Retailer_Mobile: '',
      Retailer_TFAT_Id: '',
      Retailer_Status: 1,
      Area_Name: '',
      Contact_Person: '',
      Pincode: '',
      Mobile_Order: '',
      Mobile_Account: '',
      Owner_Mobile: '',
      Area_Id: undefined,
      GST_No: '',
      Credit_Limit: 45,
      Type_Id: 0,
      Confirm: 0,
      Retailer_Tour_Id: undefined,
      Retailer_Email: '',
      latitude: undefined,
      logitude: undefined,
      RetailerImage: ''
    });
    setRetailerImagePreview('');
    setShowAddModal(true);
  };

  const handleEditRetailer = (retailer: Retailer) => {
    setSelectedRetailer(retailer);
    setFormData(retailer);
    setRetailerImagePreview(retailer.RetailerImage || '');
    setShowEditModal(true);
  };

  const handleViewRetailer = (retailer: Retailer) => {
    setSelectedRetailer(retailer);
    setShowViewModal(true);
  };

  const handleSaveRetailer = async () => {
    try {
      setLoading(true);
      if (showEditModal && selectedRetailer) {
        await retailersAPI.updateRetailer(selectedRetailer.Retailer_Id, formData);
      } else if (showAddModal) {
        await retailersAPI.createRetailer(formData);
      }
      // Refresh list
      const response = await retailersAPI.getRetailers();
      setRetailers(response.data.retailers || []);
      setShowEditModal(false);
      setShowAddModal(false);
    } catch (err) {
      setError('Failed to save retailer. Please try again.');
    } finally {
      setLoading(false);
      setFormData({});
      setSelectedRetailer(null);
      setRetailerImagePreview('');
    }
  };

  const handleDeleteRetailer = async (retailerId: number) => {
    if (window.confirm('Are you sure you want to delete this retailer?')) {
      try {
        setLoading(true);
        await retailersAPI.deleteRetailer(retailerId);
        setRetailers(prev => prev.filter((r: Retailer) => r.Retailer_Id !== retailerId));
      } catch (err) {
        setError('Failed to delete retailer. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRetailerImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setRetailerImagePreview(result);
        setFormData((prev: Partial<Retailer>) => ({ ...prev, RetailerImage: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getAreaName = (areaId?: number) => {
    return areas.find(a => a.id === areaId)?.name || 'Unknown Area';
  };

  const getRetailerTypeName = (typeId?: number) => {
    return retailerTypes.find(t => t.id === typeId)?.name || 'Unknown Type';
  };

  const getStatusColor = (status?: number) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (status?: number) => {
    return status === 1 ? 'Active' : 'Inactive';
  };

  const getConfirmColor = (confirm?: number) => {
    return confirm === 1 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getConfirmText = (confirm?: number) => {
    return confirm === 1 ? 'Confirmed' : 'Pending';
  };

  const RetailerFormModal = ({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Retailer Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Retailer Image</label>
              <div className="flex items-center space-x-6">
                <div className="w-32 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {retailerImagePreview ? (
                    <img 
                      src={retailerImagePreview} 
                      alt="Retailer preview" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleRetailerImageUpload}
                    className="hidden"
                    id="retailer-image-upload"
                  />
                  <label
                    htmlFor="retailer-image-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Retailer Image
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: 800x600px, PNG or JPG format. Store front or business logo.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retailer Name *</label>
                  <input
                    type="text"
                    value={formData.Retailer_Name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_Name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter retailer name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CRM ID</label>
                  <input
                    type="text"
                    value={formData.RetailerCRMId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, RetailerCRMId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter CRM ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TFAT ID</label>
                  <input
                    type="text"
                    value={formData.Retailer_TFAT_Id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_TFAT_Id: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter TFAT ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person *</label>
                  <input
                    type="text"
                    value={formData.Contact_Person || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Contact_Person: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter contact person name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.Retailer_Email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_Email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="retailer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retailer Type</label>
                  <select
                    value={formData.Type_Id || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, Type_Id: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    <option value={0}>Select Type</option>
                    {retailerTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Mobile</label>
                  <input
                    type="tel"
                    value={formData.Retailer_Mobile || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_Mobile: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Mobile</label>
                  <input
                    type="tel"
                    value={formData.Mobile_Order || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Mobile_Order: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Mobile</label>
                  <input
                    type="tel"
                    value={formData.Mobile_Account || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Mobile_Account: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Mobile</label>
                  <input
                    type="tel"
                    value={formData.Owner_Mobile || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Owner_Mobile: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={formData.Retailer_Address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_Address: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none resize-none"
                    placeholder="Enter complete address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area Name</label>
                  <input
                    type="text"
                    value={formData.Area_Name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Area_Name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter area name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <input
                    type="text"
                    value={formData.Pincode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Pincode: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter pincode"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area ID</label>
                  <select
                    value={formData.Area_Id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Area_Id: parseInt(e.target.value) || undefined }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    <option value="">Select Area</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || undefined }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="40.7128"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.logitude || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, logitude: parseFloat(e.target.value) || undefined }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="-74.0060"
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                  <input
                    type="text"
                    value={formData.GST_No || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, GST_No: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="GST123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Credit Limit</label>
                  <input
                    type="number"
                    value={formData.Credit_Limit || 45}
                    onChange={(e) => setFormData(prev => ({ ...prev, Credit_Limit: parseInt(e.target.value) || 45 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="45"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tour ID</label>
                  <input
                    type="number"
                    value={formData.Retailer_Tour_Id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_Tour_Id: parseInt(e.target.value) || undefined }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter tour ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.Retailer_Status || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_Status: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmation</label>
                  <select
                    value={formData.Confirm || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, Confirm: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    <option value={0}>Pending</option>
                    <option value={1}>Confirmed</option>
                  </select>
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
              onClick={handleSaveRetailer}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              Save Retailer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RetailerViewModal = ({ isOpen, onClose, retailer }: { isOpen: boolean; onClose: () => void; retailer: Retailer | null }) => {
    if (!isOpen || !retailer) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#003366] rounded-lg flex items-center justify-center">
                  {retailer.RetailerImage ? (
                    <img 
                      src={retailer.RetailerImage} 
                      alt={retailer.Retailer_Name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <UserCheck className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{retailer.Retailer_Name}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{retailer.Contact_Person}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(retailer.Retailer_Status)}`}>{getStatusText(retailer.Retailer_Status)}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getConfirmColor(retailer.Confirm)}`}>{getConfirmText(retailer.Confirm)}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 bg-white/80 dark:bg-gray-800/80 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Info Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-200">CRM ID</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{retailer.RetailerCRMId || '0'}</p>
                  </div>
                  <Hash className="w-8 h-8 text-blue-600 dark:text-blue-200" />
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-200">TFAT ID</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{retailer.Retailer_TFAT_Id || '0'}</p>
                  </div>
                  <User className="w-8 h-8 text-green-600 dark:text-green-200" />
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-200">GST Number</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{retailer.GST_No || '0'}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-purple-600 dark:text-purple-200" />
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-200">Credit Limit</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">${Number(retailer.Credit_Limit || 0).toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-600 dark:text-orange-200" />
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mx-auto">
              {retailer.Retailer_Email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">{retailer.Retailer_Email}</p>
                  </div>
                </div>
              )}
              {retailer.Retailer_Mobile && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mobile</p>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">{retailer.Retailer_Mobile}</p>
                  </div>
                </div>
              )}
              {retailer.Mobile_Order && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-yellow-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Order Mobile</p>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">{retailer.Mobile_Order}</p>
                  </div>
                </div>
              )}
              {retailer.Owner_Mobile && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Owner Mobile</p>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">{retailer.Owner_Mobile}</p>
                  </div>
                </div>
              )}
              {retailer.Area_Name && (
                <div className="flex items-center space-x-3">
                  <MapPin className="w-6 h-6 text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Area</p>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">{retailer.Area_Name}</p>
                  </div>
                </div>
              )}
              {retailer.Pincode && (
                <div className="flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pincode</p>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">{retailer.Pincode}</p>
                  </div>
                </div>
              )}
              {retailer.Contact_Person && (
                <div className="flex items-center space-x-3">
                  <User className="w-6 h-6 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Contact Person</p>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">{retailer.Contact_Person}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Location at the bottom */}
            {(retailer.latitude && retailer.logitude) && (
              <div className="w-full flex flex-col items-center mt-8">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">Location</span>
                </div>
                <div className="mt-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${retailer.latitude},${retailer.logitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-300 underline text-xs"
                  >
                    View on Google Maps ({retailer.latitude}, {retailer.logitude})
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Retailer Button */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end space-x-4">
          <button
            onClick={() => {
              onClose();
              handleEditRetailer(retailer);
            }}
            className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Retailer</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retailer Management</h1>
          <p className="text-gray-600">Comprehensive retailer database with image management</p>
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
            onClick={handleAddRetailer}
            className="bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Retailer</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-5 h-5 text-[#003366]" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search retailers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
            />
          </div>
          
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="all">All Areas</option>
            {areas.map(area => (
              <option key={area.id} value={area.id.toString()}>{area.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="all">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <span className="font-medium">{filteredRetailers.length}</span> retailers found
          </div>

          <div className="text-sm text-gray-600 flex items-center justify-end">
            <span className="font-medium">
              {filteredRetailers.filter(r => r.Retailer_Status === 1).length} active
            </span>
          </div>
        </div>
      </div>

      {/* Retailers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRetailers.map((retailer) => (
          <div
            key={retailer.Retailer_Id}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col"
          >
            {/* Retailer Image */}
            <div className="relative h-40 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {retailer.RetailerImage ? (
                <img
                  src={retailer.RetailerImage}
                  alt={retailer.Retailer_Name}
                  className="w-full h-full object-cover object-center transition-transform group-hover:scale-105 duration-300"
                />
              ) : (
                <UserCheck className="w-16 h-16 text-gray-400 dark:text-gray-600" />
              )}
              {/* Status Badges */}
              <div className="absolute top-3 left-3 flex flex-col space-y-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(retailer.Retailer_Status)} dark:bg-opacity-80`}>{getStatusText(retailer.Retailer_Status)}</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfirmColor(retailer.Confirm)} dark:bg-opacity-80`}>{getConfirmText(retailer.Confirm)}</span>
              </div>
              {/* Credit Limit */}
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 dark:text-blue-200 text-blue-800">
                  <DollarSign className="w-3 h-3 mr-1" />
                  {(retailer.Credit_Limit || 0).toLocaleString()}
                </span>
              </div>
            </div>
            {/* Retailer Details */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div className="mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-0.5 truncate">{retailer.Retailer_Name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{retailer.Contact_Person}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">ID: {retailer.Retailer_Id}</p>
              </div>
              {/* Only show most important info on card */}
              <div className="space-y-1 mb-3">
                {retailer.Retailer_Mobile && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <Phone className="w-3 h-3" />
                    <span>{retailer.Retailer_Mobile}</span>
                  </div>
                )}
                {retailer.Area_Name && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{retailer.Area_Name}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-auto">
                <button
                  onClick={() => handleViewRetailer(retailer)}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleEditRetailer(retailer)}
                  className="flex-1 bg-[#003366] text-white px-3 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm flex items-center justify-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteRetailer(retailer.Retailer_Id)}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-12 text-center">
          <div className="w-12 h-12 border-4 border-t-[#003366] border-gray-200 dark:border-gray-700 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading retailers...</p>
        </div>
      )}

      {filteredRetailers.length === 0 && !loading && (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <img
            src="/empty-state.svg"
            alt="No retailers illustration"
            className="w-40 h-40 mx-auto mb-4 opacity-80"
            loading="lazy"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }}
          />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No retailers found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search criteria or add a new retailer.</p>
          <button
            onClick={handleAddRetailer}
            className="inline-flex items-center px-5 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors mt-2"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Retailer
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
      <RetailerFormModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title="Add New Retailer" 
      />
      <RetailerFormModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Edit Retailer" 
      />
      <RetailerViewModal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        retailer={selectedRetailer} 
      />
    </div>
  );
};