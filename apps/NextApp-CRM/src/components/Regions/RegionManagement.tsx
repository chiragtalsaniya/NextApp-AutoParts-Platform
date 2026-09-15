import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin, 
  Store,
  Eye,
  X,
  Upload,
  Download,
  Filter,
  Users
} from 'lucide-react';
import { Region } from '../../types';

const mockRegions: Region[] = [
  {
    id: 'NYC-REGION-1',
    name: 'Manhattan Region',
    store_id: 'NYC001',
    created_by: '2'
  },
  {
    id: 'NYC-REGION-2',
    name: 'Brooklyn Region',
    store_id: 'NYC002',
    created_by: '2'
  },
  {
    id: 'LA-REGION-1',
    name: 'Hollywood Region',
    store_id: 'LA001',
    created_by: '3'
  },
  {
    id: 'CHI-REGION-1',
    name: 'Downtown Chicago Region',
    store_id: 'CHI001',
    created_by: '4'
  }
];

const mockStores = [
  { Branch_Code: 'NYC001', Branch_Name: 'Manhattan Central Store' },
  { Branch_Code: 'NYC002', Branch_Name: 'Brooklyn East Store' },
  { Branch_Code: 'LA001', Branch_Name: 'Hollywood Store' },
  { Branch_Code: 'CHI001', Branch_Name: 'Downtown Chicago Store' }
];

export const RegionManagement: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>(mockRegions);
  const [stores] = useState(mockStores);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [formData, setFormData] = useState<Partial<Region>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredRegions = regions.filter(region => {
    const matchesSearch = 
      region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStore = selectedStore === 'all' || region.store_id === selectedStore;
    
    return matchesSearch && matchesStore;
  });

  const handleAddRegion = () => {
    setFormData({
      id: '',
      name: '',
      store_id: '',
      created_by: '1' // Current user ID
    });
    setShowAddModal(true);
  };

  const handleEditRegion = (region: Region) => {
    setSelectedRegion(region);
    setFormData(region);
    setShowEditModal(true);
  };

  const handleViewRegion = (region: Region) => {
    setSelectedRegion(region);
    setShowViewModal(true);
  };

  const handleSaveRegion = () => {
    if (showEditModal && selectedRegion) {
      setRegions(prev => prev.map(r => 
        r.id === selectedRegion.id ? { ...formData as Region } : r
      ));
      setShowEditModal(false);
    } else if (showAddModal) {
      const newRegion: Region = {
        ...formData as Region
      };
      setRegions(prev => [...prev, newRegion]);
      setShowAddModal(false);
    }
    setFormData({});
    setSelectedRegion(null);
  };

  const handleDeleteRegion = (regionId: string) => {
    if (confirm('Are you sure you want to delete this region?')) {
      setRegions(prev => prev.filter(r => r.id !== regionId));
    }
  };

  const getStoreName = (storeId: string) => {
    return stores.find(s => s.Branch_Code === storeId)?.Branch_Name || 'Unknown Store';
  };

  const RegionFormModal = ({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region ID *</label>
                <input
                  type="text"
                  value={formData.id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  placeholder="Enter region ID (e.g., NYC-REGION-1)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  placeholder="Enter region name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store *</label>
                <select
                  value={formData.store_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, store_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select Store</option>
                  {stores.map(store => (
                    <option key={store.Branch_Code} value={store.Branch_Code}>
                      {store.Branch_Name} ({store.Branch_Code})
                    </option>
                  ))}
                </select>
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
              onClick={handleSaveRegion}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              Save Region
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RegionViewModal = ({ isOpen, onClose, region }: { isOpen: boolean; onClose: () => void; region: Region | null }) => {
    if (!isOpen || !region) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#003366] rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{region.name}</h2>
                  <p className="text-gray-600">{region.id}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Region Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Region ID</p>
                    <p className="text-gray-900 font-mono">{region.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Region Name</p>
                    <p className="text-gray-900">{region.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Created By</p>
                    <p className="text-gray-900">User ID: {region.created_by}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Store Assignment</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Store className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Assigned Store</p>
                      <p className="text-gray-900">{getStoreName(region.store_id)}</p>
                      <p className="text-sm text-gray-500">Store ID: {region.store_id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Region Statistics</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Active Retailers</p>
                  <p className="text-blue-900 font-semibold">12</p>
                </div>
                <div>
                  <p className="text-blue-700">Total Orders</p>
                  <p className="text-blue-900 font-semibold">156</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={() => {
                onClose();
                handleEditRegion(region);
              }}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Region</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Region Management</h1>
          <p className="text-gray-600">Manage geographical regions and territories</p>
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
            onClick={handleAddRegion}
            className="bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Region</span>
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
              placeholder="Search regions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
            />
          </div>
          
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="all">All Stores</option>
            {stores.map(store => (
              <option key={store.Branch_Code} value={store.Branch_Code}>
                {store.Branch_Name}
              </option>
            ))}
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <span className="font-medium">{filteredRegions.length}</span> regions found
          </div>
        </div>
      </div>

      {/* Regions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statistics</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegions.map((region) => (
                <tr key={region.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#003366] rounded-lg flex items-center justify-center mr-3">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{region.name}</div>
                        <div className="text-sm text-gray-500">{region.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Store className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-900">{getStoreName(region.store_id)}</div>
                        <div className="text-sm text-gray-500">{region.store_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">User ID: {region.created_by}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900">12 Retailers</div>
                      <div className="text-sm text-gray-500">156 Orders</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleViewRegion(region)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditRegion(region)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteRegion(region.id)}
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
            <p className="text-gray-600 dark:text-gray-300">Loading regions...</p>
          </div>
        )}

        {filteredRegions.length === 0 && !loading && (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <img
              src="/empty-state.svg"
              alt="No regions illustration"
              className="w-40 h-40 mx-auto mb-4 opacity-80"
              loading="lazy"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }}
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No regions found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search criteria or add a new region.</p>
            <button
              onClick={handleAddRegion}
              className="inline-flex items-center px-5 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors mt-2"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Region
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <RegionFormModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title="Add New Region" 
      />
      <RegionFormModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Edit Region" 
      />
      <RegionViewModal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        region={selectedRegion} 
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