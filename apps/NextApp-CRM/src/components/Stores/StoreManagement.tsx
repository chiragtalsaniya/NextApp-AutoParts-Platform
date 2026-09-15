import React, { useState, useEffect, ChangeEvent } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Store as StoreIcon, 
  Phone, 
  Mail, 
  MapPin,
  User,
  Globe,
  Building2,
  Eye,
  X,
  Upload,
  Download,
  Filter,
  Image as ImageIcon,
  Shield
} from 'lucide-react';
import { Store, Company } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { storesAPI } from '../../services/api';
import { companiesAPI } from '../../services/api';
import { Tooltip } from 'react-tooltip'; // Add a tooltip library if not present

export const StoreManagement: React.FC = () => {
  const { user, canAccessStore } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState<Partial<Store>>({});
  const [storeImagePreview, setStoreImagePreview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load stores and companies from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [storesRes, companiesRes] = await Promise.all([
          storesAPI.getStores(),
          companiesAPI.getCompanies()
        ]);
        setStores(storesRes.data.stores || []);
        setCompanies(companiesRes.data.companies || []);
      } catch (err) {
        setError('Failed to load stores or companies. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // Check if user can access store management
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only Super Administrators and Company Administrators can manage stores.</p>
        </div>
      </div>
    );
  }

  // Filter logic and UI
  const isSuperAdmin = user?.role === 'super_admin';
  const visibleCompanies = isSuperAdmin ? companies : companies.filter((c) => c.id === user?.company_id);
  const visibleStores = isSuperAdmin
    ? stores
    : stores.filter((s) => s.company_id === user?.company_id);
  const filteredStores = visibleStores.filter((store) => {
    const matchesSearch =
      store.Branch_Code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.Branch_Name && store.Branch_Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (store.Company_Name && store.Company_Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (store.Branch_Manager && store.Branch_Manager.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCompany = isSuperAdmin
      ? selectedCompanyId === 'All' || store.company_id === selectedCompanyId
      : true;
    return matchesSearch && matchesCompany;
  });

  const handleAddStore = () => {
    setFormData({
      Branch_Code: '',
      Branch_Name: '',
      Company_Name: companies[0]?.name || '',
      Branch_Address: '',
      Branch_Phone: '',
      Branch_Email: '',
      Branch_Manager: '',
      Branch_URL: '',
      Branch_Manager_Mobile: '',
      store_image: '',
      company_id: companies[0]?.id || ''
    });
    setStoreImagePreview('');
    setShowAddModal(true);
  };

  const handleEditStore = (store: Store) => {
    if (!canAccessStore(store.Branch_Code)) return;
    setSelectedStore(store);
    setFormData(store);
    setStoreImagePreview(store.store_image || '');
    setShowEditModal(true);
  };

  const handleViewStore = (store: Store) => {
    if (!canAccessStore(store.Branch_Code)) return;
    setSelectedStore(store);
    setShowViewModal(true);
  };

  const handleSaveStore = async () => {
    try {
      setLoading(true);
      if (showEditModal && selectedStore) {
        await storesAPI.updateStore(selectedStore.Branch_Code, formData);
      } else if (showAddModal) {
        await storesAPI.createStore(formData);
      }
      // Refresh list
      const storesRes = await storesAPI.getStores();
      setStores(storesRes.data.stores || []);
      setShowEditModal(false);
      setShowAddModal(false);
    } catch (err) {
      setError('Failed to save store. Please try again.');
    } finally {
      setLoading(false);
      setFormData({});
      setSelectedStore(null);
      setStoreImagePreview('');
    }
  };

  const handleDeleteStore = async (branchCode: string) => {
    if (!canAccessStore(branchCode)) return;
    if (window.confirm('Are you sure you want to delete this store?')) {
      try {
        setLoading(true);
        await storesAPI.deleteStore(branchCode);
        setStores(prev => prev.filter((s: Store) => s.Branch_Code !== branchCode));
      } catch (err) {
        setError('Failed to delete store. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStoreImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setStoreImagePreview(result);
        setFormData((prev: Partial<Store>) => ({ ...prev, store_image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const StoreFormModal = ({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) => {
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
            {/* Store Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Store Photo</label>
              <div className="flex items-center space-x-6">
                <div className="w-32 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {storeImagePreview ? (
                    <img 
                      src={storeImagePreview} 
                      alt="Store preview" 
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
                    onChange={handleStoreImageUpload}
                    className="hidden"
                    id="store-image-upload"
                  />
                  <label
                    htmlFor="store-image-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Store Photo
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: 800x600px, PNG or JPG format
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Code *</label>
                  <input
                    type="text"
                    value={formData.Branch_Code || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Branch_Code: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter branch code"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                  <input
                    type="text"
                    value={formData.Branch_Name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Branch_Name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter branch name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <select
                    value={formData.Company_Name || ''}
                    onChange={(e) => {
                      const selectedCompany = companies.find(c => c.name === e.target.value);
                      setFormData(prev => ({ 
                        ...prev, 
                        Company_Name: e.target.value,
                        company_id: selectedCompany?.id || ''
                      }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    {companies.map(company => (
                      <option key={company.id} value={company.name}>{company.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Address</label>
                  <textarea
                    value={formData.Branch_Address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Branch_Address: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none resize-none"
                    placeholder="Enter complete address"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Phone</label>
                  <input
                    type="tel"
                    value={formData.Branch_Phone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Branch_Phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Email</label>
                  <input
                    type="email"
                    value={formData.Branch_Email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Branch_Email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="branch@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Manager</label>
                  <input
                    type="text"
                    value={formData.Branch_Manager || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Branch_Manager: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Manager name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager Mobile</label>
                  <input
                    type="tel"
                    value={formData.Branch_Manager_Mobile || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Branch_Manager_Mobile: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch URL</label>
                  <input
                    type="url"
                    value={formData.Branch_URL || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Branch_URL: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="branch.company.com"
                  />
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
              onClick={handleSaveStore}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              Save Store
            </button>
          </div>
        </div>
      </div>
    );
  };

  const StoreViewModal = ({ isOpen, onClose, store }: { isOpen: boolean; onClose: () => void; store: Store | null }) => {
    if (!isOpen || !store) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-12 bg-[#003366] rounded-lg flex items-center justify-center">
                  {store.store_image ? (
                    <img 
                      src={store.store_image} 
                      alt={store.Branch_Name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <StoreIcon className="w-8 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{store.Branch_Code}</h2>
                  <p className="text-gray-600">{store.Branch_Name}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Store Image */}
            {store.store_image && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Photo</h3>
                <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={store.store_image} 
                    alt={store.Branch_Name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Store Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Store Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Branch Code</p>
                    <p className="text-gray-900 font-mono">{store.Branch_Code}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Branch Name</p>
                    <p className="text-gray-900">{store.Branch_Name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Company</p>
                    <p className="text-gray-900">{store.Company_Name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Manager</p>
                    <p className="text-gray-900">{store.Branch_Manager || 'Not assigned'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Details</h3>
                
                <div className="space-y-3">
                  {store.Branch_Phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Phone</p>
                        <p className="text-gray-900">{store.Branch_Phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {store.Branch_Email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="text-gray-900">{store.Branch_Email}</p>
                      </div>
                    </div>
                  )}
                  
                  {store.Branch_Manager_Mobile && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Manager Mobile</p>
                        <p className="text-gray-900">{store.Branch_Manager_Mobile}</p>
                      </div>
                    </div>
                  )}
                  
                  {store.Branch_URL && (
                    <div className="flex items-center space-x-3">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Website</p>
                        <a 
                          href={`https://${store.Branch_URL}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {store.Branch_URL}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            {store.Branch_Address && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Address</h3>
                <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <p className="text-gray-700">{store.Branch_Address}</p>
                </div>
              </div>
            )}

            {/* Technical Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Company ID</p>
                  <p className="text-gray-900 font-mono text-sm">{store.company_id || 'Not linked'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Store Image</p>
                  <p className="text-gray-900 text-sm">{store.store_image ? 'Uploaded' : 'No image'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={() => {
                onClose();
                handleEditStore(store);
              }}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Store</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Loading and error UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading stores...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center">
          <img
            src="https://undraw.co/api/illustrations/undraw_cancel_re_pkdm.svg"
            alt="Error illustration"
            className="w-32 h-32 mx-auto mb-4 opacity-90"
            loading="lazy"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.10))' }}
          />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Management</h1>
          <p className="text-gray-600">Manage branch locations, store information, and photos</p>
          <p className="text-sm text-gray-500 mt-1">
            Access Level: {user?.role === 'super_admin' ? 'All Stores' : `Company ${user?.company_id} Stores`}
          </p>
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
            onClick={handleAddStore}
            className="bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Store</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-5 h-5 text-[#003366]" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search stores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
            />
          </div>
          {isSuperAdmin && (
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
            >
              <option value="All">All Companies</option>
              {visibleCompanies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          )}
          <div className="text-sm text-gray-600 flex items-center">
            <span className="font-medium">{filteredStores.length}</span> stores found
          </div>
        </div>
      </div>

      {/* Stores Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] md:min-w-0">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStores.map((store) => (
                <tr key={store.Branch_Code} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-9 bg-[#003366] rounded-lg flex items-center justify-center mr-3">
                        {store.store_image ? (
                          <img 
                            src={store.store_image} 
                            alt={store.Branch_Name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <StoreIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{store.Branch_Code}</div>
                        <div className="text-sm text-gray-500">{store.Branch_Name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{store.Company_Name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-900">{store.Branch_Manager || 'Not assigned'}</div>
                        {store.Branch_Manager_Mobile && (
                          <div className="text-xs text-gray-500">{store.Branch_Manager_Mobile}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {store.Branch_Phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {store.Branch_Phone}
                        </div>
                      )}
                      {store.Branch_Email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {store.Branch_Email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {store.Branch_Address || 'Address not provided'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleViewStore(store)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        data-tooltip-id={`view-store-${store.Branch_Code}`}
                        aria-label="View Store"
                      >
                        <Eye className="w-4 h-4" />
                        <Tooltip id={`view-store-${store.Branch_Code}`}>View Store</Tooltip>
                      </button>
                      <button 
                        onClick={() => handleEditStore(store)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        data-tooltip-id={`edit-store-${store.Branch_Code}`}
                        aria-label="Edit Store"
                      >
                        <Edit className="w-4 h-4" />
                        <Tooltip id={`edit-store-${store.Branch_Code}`}>Edit Store</Tooltip>
                      </button>
                      <button 
                        onClick={() => handleDeleteStore(store.Branch_Code)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        data-tooltip-id={`delete-store-${store.Branch_Code}`}
                        aria-label="Delete Store"
                      >
                        <Trash2 className="w-4 h-4" />
                        <Tooltip id={`delete-store-${store.Branch_Code}`}>Delete Store</Tooltip>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <img
              src="https://undraw.co/api/illustrations/undraw_empty_xct9.svg"
              alt="No stores illustration"
              className="w-40 h-40 mx-auto mb-4 opacity-80"
              loading="lazy"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }}
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria, company filter, or add a new store.</p>
            <button
              onClick={handleAddStore}
              className="inline-flex items-center px-5 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors mt-2"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Store
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <StoreFormModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title="Add New Store" 
      />
      <StoreFormModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Edit Store" 
      />
      <StoreViewModal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        store={selectedStore} 
      />
    </div>
  );
};