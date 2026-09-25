import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { transportAPI } from '../services/api';

interface TransportRow { id: number; store_id: string; Branch_Name?: string; type: string; provider: string; contact_number?: string; }

export const Transport: React.FC = () => {
  const [rows, setRows] = useState<TransportRow[]>([]);
  const [form, setForm] = useState({ store_id: '', type: '', provider: '', contact_number: '' });
  const [error, setError] = useState('');

  const load = async () => {
    try { setRows((await transportAPI.getTransports()).data.transports || []); }
    catch (err: any) { setError(err?.response?.data?.error || 'Failed to load transport.'); }
  };
  useEffect(() => { load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    try { await transportAPI.createTransport(form); setForm({ store_id: '', type: '', provider: '', contact_number: '' }); await load(); }
    catch (err: any) { setError(err?.response?.data?.error || 'Failed to save transport.'); }
  };

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-gray-900">Transport</h1><p className="text-gray-600">Manage delivery providers and transport contacts.</p></div>
    <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-6 rounded-xl border">
      {(['store_id', 'type', 'provider', 'contact_number'] as const).map((field) => <input key={field} required={field !== 'contact_number'} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={field.replace('_', ' ')} className="px-3 py-2 border rounded-lg" />)}
      <button className="md:col-span-4 bg-[#003366] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"><Plus size={18} /> Add Transport</button>
      {error && <p className="md:col-span-4 text-sm text-red-600">{error}</p>}
    </form>
    <div className="bg-white rounded-xl border overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50"><tr><th className="p-4">Provider</th><th className="p-4">Type</th><th className="p-4">Store</th><th className="p-4">Contact</th><th /></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="p-4">{row.provider}</td><td className="p-4">{row.type}</td><td className="p-4">{row.Branch_Name || row.store_id}</td><td className="p-4">{row.contact_number || '-'}</td><td className="p-4"><button onClick={async () => { await transportAPI.deleteTransport(row.id); load(); }} className="text-red-600"><Trash2 size={18} /></button></td></tr>)}</tbody></table>{!rows.length && <p className="p-8 text-center text-gray-500">No transport providers found.</p>}</div>
  </div>;
};