import React, { useEffect, useState } from 'react';
import { Download, Edit, Plus, Search, Trash2, Truck, X } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Store, Transport as TransportModel } from '../types';
import { useAuth } from '../context/AuthContext';
import { storesAPI, transportAPI } from '../services/api';

type TransportRow = TransportModel & { id: number; Branch_Name?: string };
type TransportForm = {
  store_id: string;
  type: string;
  provider: string;
  contact_number: string;
};

const emptyForm: TransportForm = {
  store_id: '',
  type: '',
  provider: '',
  contact_number: '',
};

export const Transport: React.FC = () => {
  const { user } = useAuth();
  const canManage = ['super_admin', 'admin', 'manager'].includes(user?.role || '');
  const canDelete = ['super_admin', 'admin'].includes(user?.role || '');
  const [rows, setRows] = useState<TransportRow[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [form, setForm] = useState<TransportForm>(emptyForm);
  const [selected, setSelected] = useState<TransportRow | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [transportResponse, storesResponse] = await Promise.all([
        transportAPI.getTransports(),
        storesAPI.getStores({ limit: 200 }),
      ]);
      setRows(transportResponse.data?.transports || []);
      setStores(storesResponse.data?.stores || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load transport data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visibleRows = rows.filter((row) => {
    const value = `${row.provider} ${row.type} ${row.store_id} ${row.Branch_Name || ''}`.toLowerCase();
    return value.includes(searchTerm.toLowerCase());
  });

  const openAdd = () => {
    setSelected(null);
    setForm({ ...emptyForm, store_id: user?.store_id || '' });
    setModalError(null);
    setShowModal(true);
  };

  const openEdit = (row: TransportRow) => {
    setSelected(row);
    setForm({
      store_id: row.store_id,
      type: row.type,
      provider: row.provider,
      contact_number: row.contact_number || '',
    });
    setModalError(null);
    setShowModal(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setModalError(null);
    try {
      if (selected) {
        await transportAPI.updateTransport(Number(selected.id), form);
      } else {
        await transportAPI.createTransport(form);
      }
      setShowModal(false);
      await load();
    } catch (err: any) {
      setModalError(err?.response?.data?.error || 'Failed to save transport. Please try again.');
    }
  };

  const remove = async (row: TransportRow) => {
    if (!window.confirm(`Delete ${row.provider}?`)) return;
    try {
      setError(null);
      await transportAPI.deleteTransport(Number(row.id));
      setRows((current) => current.filter((item) => item.id !== row.id));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete transport. Please try again.');
    }
  };

  const exportRows = () => {
    const data = visibleRows.map((row) => ({
      Provider: row.provider,
      Type: row.type,
      Store: row.Branch_Name || row.store_id,
      Store_Code: row.store_id,
      Contact: row.contact_number || '',
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Transport');
    XLSX.writeFile(workbook, `transport-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (!canManage) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        You do not have permission to manage transport.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transport Management</h1>
          <p className="text-gray-600">Manage delivery providers and transport contacts by store.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={exportRows}
            disabled={!visibleRows.length}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-blue-800 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Transport
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search provider, type, or store"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
          />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700" role="alert">{error}</div>}

      {loading ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">Loading transport providers...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">Provider</th>
                <th className="p-4">Type</th>
                <th className="p-4">Store</th>
                <th className="p-4">Contact</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{row.provider}</td>
                  <td className="p-4 text-gray-600">{row.type}</td>
                  <td className="p-4 text-gray-600">{row.Branch_Name || row.store_id}</td>
                  <td className="p-4 text-gray-600">{row.contact_number || '-'}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => openEdit(row)} className="text-blue-600 hover:text-blue-800" aria-label={`Edit ${row.provider}`}>
                        <Edit className="w-4 h-4" />
                      </button>
                      {canDelete && (
                        <button type="button" onClick={() => remove(row)} className="text-red-600 hover:text-red-800" aria-label={`Delete ${row.provider}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleRows.length && (
            <div className="p-12 text-center">
              <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transport providers found.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selected ? 'Edit Transport' : 'Add Transport'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Store
                <select required value={form.store_id} onChange={(event) => setForm({ ...form, store_id: event.target.value })} className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-lg">
                  <option value="">Select store</option>
                  {stores.map((store) => <option key={store.Branch_Code} value={store.Branch_Code}>{store.Branch_Name || store.Branch_Code} ({store.Branch_Code})</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Transport type
                <input required value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-lg" />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Provider
                <input required value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-lg" />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Contact number
                <input value={form.contact_number} onChange={(event) => setForm({ ...form, contact_number: event.target.value })} className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-lg" />
              </label>
              {modalError && <p className="text-sm text-red-600" role="alert">{modalError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-blue-800">{selected ? 'Save Changes' : 'Add Transport'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
