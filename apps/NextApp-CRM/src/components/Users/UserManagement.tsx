import React, { useState, useEffect, ChangeEvent } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User as UserIcon, 
  Phone, 
  Mail, 
  Building2,
  Store,
  Eye,
  X,
  Upload,
  Download,
  Filter,
  Shield,
  CheckCircle,
  XCircle,
  UserCheck,
  Image as ImageIcon
} from 'lucide-react';
import { User, UserRole, Company, Store as StoreType, Retailer } from '../../types';
import { usersAPI, companiesAPI, storesAPI, retailersAPI } from '../../services/api';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');

  // Load users, companies, stores, retailers from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [usersRes, companiesRes, storesRes, retailersRes] = await Promise.all([
          usersAPI.getUsers(),
          companiesAPI.getCompanies(),
          storesAPI.getStores(),
          retailersAPI.getRetailers()
        ]);
        setUsers(usersRes.data.users || []);
        setCompanies(companiesRes.data.companies || []);
        setStores(storesRes.data.stores || []);
        setRetailers(retailersRes.data.retailers || []);
      } catch (err) {
        setError('Failed to load users or related data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesCompany = selectedCompany === 'all' || user.company_id === selectedCompany;
    
    return matchesSearch && matchesRole && matchesCompany;
  });

  const handleAddUser = () => {
    setFormData({
      name: '',
      email: '',
      role: 'storeman',
      company_id: '',
      store_id: '',
      retailer_id: undefined,
      profile_image: ''
    });
    setProfileImagePreview('');
    setShowAddModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData(user);
    setProfileImagePreview(user.profile_image || '');
    setShowEditModal(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      if (showEditModal && selectedUser) {
        await usersAPI.updateUser(selectedUser.id, formData);
      } else if (showAddModal) {
        await usersAPI.createUser(formData);
      }
      // Refresh list
      const usersRes = await usersAPI.getUsers();
      setUsers(usersRes.data.users || []);
      setShowEditModal(false);
      setShowAddModal(false);
    } catch (err) {
      setError('Failed to save user. Please try again.');
    } finally {
      setLoading(false);
      setFormData({});
      setSelectedUser(null);
      setProfileImagePreview('');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setLoading(true);
        await usersAPI.deleteUser(userId);
        setUsers(prev => prev.filter((u: User) => u.id !== userId));
      } catch (err) {
        setError('Failed to delete user. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProfileImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImagePreview(result);
        setFormData((prev: Partial<User>) => ({ ...prev, profile_image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      case 'storeman': return 'bg-yellow-100 text-yellow-800';
      case 'salesman': return 'bg-orange-100 text-orange-800';
      case 'retailer': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompanyName = (companyId?: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Not assigned';
  };

  const getStoreName = (storeId?: string) => {
    return stores.find(s => s.Branch_Code === storeId)?.Branch_Name || 'Not assigned';
  };

  const getRetailerName = (retailerId?: number) => {
    return retailers.find(r => r.Retailer_Id === retailerId)?.Retailer_Name || 'Not assigned';
  };

  const UserFormModal = ({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) => {
    if (!isOpen) return null;

    const availableStores = stores.filter(store => store.company_id === formData.company_id);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Profile Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Profile Picture</label>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-gray-50 overflow-hidden">
                  {profileImagePreview ? (
                    <img 
                      src={profileImagePreview} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    className="hidden"
                    id="profile-image-upload"
                  />
                  <label
                    htmlFor="profile-image-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Profile Picture
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: 400x400px, PNG or JPG format
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  value={formData.role || ''}
                  onChange={(e) => {
                    const role = e.target.value as UserRole;
                    setFormData(prev => ({ 
                      ...prev, 
                      role,
                      // Reset assignments when role changes
                      company_id: role === 'super_admin' ? undefined : prev.company_id,
                      store_id: undefined,
                      retailer_id: undefined
                    }));
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="storeman">Storeman</option>
                  <option value="salesman">Salesman</option>
                  <option value="retailer">Retailer</option>
                </select>
              </div>

              {/* Company Assignment (for non-super_admin and non-retailer roles) */}
              {formData.role && !['super_admin', 'retailer'].includes(formData.role) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <select
                    value={formData.company_id || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      company_id: e.target.value,
                      store_id: '' // Reset store when company changes
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    <option value="">Select Company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Store Assignment (for specific roles) */}
              {formData.company_id && ['manager', 'storeman', 'salesman'].includes(formData.role || '') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Store</label>
                  <select
                    value={formData.store_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, store_id: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    <option value="">Select Store</option>
                    {availableStores.map(store => (
                      <option key={store.Branch_Code} value={store.Branch_Code}>
                        {store.Branch_Name} ({store.Branch_Code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Retailer Assignment (for retailer role) */}
              {formData.role === 'retailer' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retailer *</label>
                  <select
                    value={formData.retailer_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, retailer_id: parseInt(e.target.value) || undefined }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select Retailer</option>
                    {retailers.map(retailer => (
                      <option key={retailer.Retailer_Id} value={retailer.Retailer_Id}>
                        {retailer.Retailer_Name} - {retailer.Contact_Person}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Role Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Role Permissions</h4>
              <div className="text-sm text-blue-700">
                {formData.role === 'super_admin' && 'Full system access including company and user management'}
                {formData.role === 'admin' && 'Company-level access including store and user management'}
                {formData.role === 'manager' && 'Store-level access including inventory and order management'}
                {formData.role === 'storeman' && 'Inventory management and order processing'}
                {formData.role === 'salesman' && 'Order creation and customer management'}
                {formData.role === 'retailer' && 'Order placement and account management'}
                {!formData.role && 'Select a role to see permissions'}
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
              onClick={handleSaveUser}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              Save User
            </button>
          </div>
        </div>
      </div>
    );
  };

  const UserViewModal = ({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: User | null }) => {
    if (!isOpen || !user) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-[#003366] rounded-full flex items-center justify-center overflow-hidden">
                  {user.profile_image ? (
                    <img 
                      src={user.profile_image} 
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : user.role === 'retailer' ? (
                    <UserCheck className="w-8 h-8 text-white" />
                  ) : (
                    <UserIcon className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-gray-600">{user.email}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleColor(user.role)}`}>
                    {user.role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Profile Image */}
            {user.profile_image && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto">
                  <img 
                    src={user.profile_image} 
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">User ID</p>
                    <p className="text-gray-900 font-mono">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Created</p>
                    <p className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Assignment</h3>
                
                <div className="space-y-3">
                  {user.company_id && (
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Company</p>
                        <p className="text-gray-900">{getCompanyName(user.company_id)}</p>
                      </div>
                    </div>
                  )}
                  
                  {user.store_id && (
                    <div className="flex items-center space-x-3">
                      <Store className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Store</p>
                        <p className="text-gray-900">{getStoreName(user.store_id)}</p>
                      </div>
                    </div>
                  )}
                  
                  {user.retailer_id && (
                    <div className="flex items-center space-x-3">
                      <UserCheck className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Retailer</p>
                        <p className="text-gray-900">{getRetailerName(user.retailer_id)}</p>
                        <p className="text-xs text-gray-500">ID: {user.retailer_id}</p>
                      </div>
                    </div>
                  )}
                  
                  {user.region_id && (
                    <div className="flex items-center space-x-3">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Region</p>
                        <p className="text-gray-900">{user.region_id}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Permissions</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Dashboard Access</span>
                </div>
                {user.role !== 'retailer' && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Parts Management</span>
                  </div>
                )}
                {user.role === 'retailer' && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Order Placement</span>
                  </div>
                )}
                {['super_admin', 'admin', 'manager'].includes(user.role) && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Reports Access</span>
                  </div>
                )}
                {user.role === 'super_admin' && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>System Administration</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={() => {
                onClose();
                handleEditUser(user);
              }}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit User</span>
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users with profile pictures and permissions</p>
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
            onClick={handleAddUser}
            className="bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <UserIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Staff Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role !== 'retailer').length}</p>
            </div>
            <Building2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Retailer Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'retailer').length}</p>
            </div>
            <UserCheck className="w-8 h-8 text-pink-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Photos</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.profile_image).length}</p>
            </div>
            <ImageIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-5 h-5 text-[#003366]" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
            />
          </div>
          
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="storeman">Storeman</option>
            <option value="salesman">Salesman</option>
            <option value="retailer">Retailer</option>
          </select>

          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="all">All Companies</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <span className="font-medium">{filteredUsers.length}</span> users found
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center mr-3 overflow-hidden">
                        {user.profile_image ? (
                          <img 
                            src={user.profile_image} 
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : user.role === 'retailer' ? (
                          <UserCheck className="w-5 h-5 text-white" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.role === 'retailer' && user.retailer_id ? (
                        <div>
                          <div>{getRetailerName(user.retailer_id)}</div>
                          <div className="text-xs text-gray-500">Retailer ID: {user.retailer_id}</div>
                        </div>
                      ) : user.company_id ? (
                        <div>
                          <div>{getCompanyName(user.company_id)}</div>
                          {user.store_id && (
                            <div className="text-xs text-gray-500">{getStoreName(user.store_id)}</div>
                          )}
                        </div>
                      ) : (
                        'System Level'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-12 text-center">
            <div className="w-12 h-12 border-4 border-t-[#003366] border-gray-200 dark:border-gray-700 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading users...</p>
          </div>
        )}

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <img
              src="/empty-state.svg"
              alt="No users illustration"
              className="w-40 h-40 mx-auto mb-4 opacity-80"
              loading="lazy"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }}
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No users found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search criteria or add a new user.</p>
            <button
              onClick={handleAddUser}
              className="inline-flex items-center px-5 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors mt-2"
            >
              <Plus className="w-4 h-4 mr-2" /> Add User
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserFormModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title="Add New User" 
      />
      <UserFormModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Edit User" 
      />
      <UserViewModal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        user={selectedUser} 
      />

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
    </div>
  );
};