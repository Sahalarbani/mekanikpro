/**
 * Version: 3.0.1 (ManagePosts Ultimate + UX Fixes)
 * Changelog: 
 * - FIX UX: Penambahan 'whitespace-pre-wrap' pada textarea Edit Jurnal & Diagnosis agar karakter Enter terbaca.
 * - UI Upgrade: Memperbesar textarea Edit Jurnal (min-h-[300px]) agar sama nyamannya dengan Form Create.
 * - Mempertahankan 100% fitur Fase 2 & Fase 3 (Filter Brand, Deep Copy, CRUD Dinamis).
 */
import React, { useState } from 'react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Schematic, TroubleshootingCase, ModificationPost, PinoutDetail } from '../types';

interface Props {
  schematics: Schematic[];
  troubles: TroubleshootingCase[];
  modifications: ModificationPost[];
  onBack: () => void;
}

type TabType = 'skema' | 'diagnosis' | 'jurnal';
const BRANDS = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Vespa', 'Lainnya'];

const ManagePosts: React.FC<Props> = ({ schematics, troubles, modifications, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('skema');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- LOGIKA HAPUS (DELETE) ---
  const handleDelete = async (collectionName: string, id: string) => {
    if (!window.confirm('PERINGATAN: Data ini akan dihapus permanen dari Cloud. Lanjutkan?')) return;
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, collectionName, id));
      notify('Data berhasil dihapus dari database.', 'success');
    } catch (error) {
      console.error(error);
      notify('Gagal menghapus data.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- INISIALISASI EDIT (DEEP CLONE) ---
  const openEditModal = (item: any, type: TabType) => {
    setEditingItem({ ...item, type });
    
    // Default fallback jika data lama belum punya field baru
    const clonedData = JSON.parse(JSON.stringify(item));
    if (type === 'skema' && !clonedData.brand) clonedData.brand = 'Honda';
    
    setEditForm(clonedData);
  };

  // --- HANDLER EDIT DINAMIS: SKEMA ---
  const handleEditPinChange = (idx: number, field: keyof PinoutDetail, val: string) => {
    const next = [...editForm.pinouts];
    next[idx] = { ...next[idx], [field]: val };
    setEditForm({ ...editForm, pinouts: next });
  };
  const handleEditAddPin = () => {
    const newPin = { pin_number: editForm.pinouts.length + 1, cable_color: '', function_desc: '', standard_voltage: '' };
    setEditForm({ ...editForm, pinouts: [...editForm.pinouts, newPin] });
  };
  const handleEditRemovePin = (idxToRemove: number) => {
    if (editForm.pinouts.length > 1) {
      const next = editForm.pinouts.filter((_: any, idx: number) => idx !== idxToRemove);
      const renumbered = next.map((pin: any, idx: number) => ({ ...pin, pin_number: idx + 1 }));
      setEditForm({ ...editForm, pinouts: renumbered });
    }
  };

  // --- HANDLER EDIT DINAMIS: DIAGNOSIS ---
  const handleEditArrayChange = (field: 'symptoms' | 'diagnosis_steps', idx: number, val: string) => {
    const next = [...editForm[field]];
    next[idx] = val;
    setEditForm({ ...editForm, [field]: next });
  };
  const handleEditAddArray = (field: 'symptoms' | 'diagnosis_steps') => {
    setEditForm({ ...editForm, [field]: [...editForm[field], ''] });
  };
  const handleEditRemoveArray = (field: 'symptoms' | 'diagnosis_steps', idxToRemove: number) => {
    if (editForm[field].length > 1) {
      const next = editForm[field].filter((_: any, idx: number) => idx !== idxToRemove);
      setEditForm({ ...editForm, [field]: next });
    }
  };

  // --- LOGIKA SIMPAN UPDATE ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const collectionName = editingItem.type === 'skema' ? 'schematics' : editingItem.type === 'diagnosis' ? 'troubleshooting' : 'modifications';
    
    let payload = { ...editForm };
    delete payload.id; 
    delete payload.type;

    if (editingItem.type === 'skema') {
      payload.pinouts = payload.pinouts.filter((p: any) => p.cable_color !== '' || p.function_desc !== '');
    } else if (editingItem.type === 'diagnosis') {
      payload.symptoms = payload.symptoms.filter((s: string) => s.trim() !== '');
      payload.diagnosis_steps = payload.diagnosis_steps.filter((s: string) => s.trim() !== '');
    }

    try {
      await updateDoc(doc(db, collectionName, editingItem.id), payload);
      notify('Data berhasil diperbarui secara menyeluruh!', 'success');
      setEditingItem(null);
    } catch (error) {
      console.error(error);
      notify('Gagal memperbarui data.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredSchematics = schematics.filter(s => s.motorcycle_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.component_name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTroubles = troubles.filter(t => t.case_title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredMods = modifications.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="animate-fade-in pb-10 relative">
      {toast && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] px-5 py-3 rounded-xl border shadow-2xl font-bold text-xs uppercase tracking-widest ${toast.type === 'success' ? 'bg-[#001a05] border-green-500 text-green-500' : 'bg-[#1a0000] border-red-500 text-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* --- POWERFUL QUICK EDIT MODAL --- */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 px-4 py-6">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            
            <div className="p-6 border-b border-border flex justify-between items-center bg-[#0a0a0a] rounded-t-2xl">
              <h3 className="text-lg font-black text-accent uppercase tracking-widest flex items-center">
                <i className="bi bi-tools mr-3"></i> Bedah {editingItem.type}
              </h3>
              <button type="button" onClick={() => setEditingItem(null)} className="text-gray-500 hover:text-white transition bg-dark w-8 h-8 rounded-full flex items-center justify-center border border-border">
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
              <form id="editFormSubmit" onSubmit={handleUpdate} className="space-y-8">
                
                {/* ================================================== */}
                {/* 1. LAYOUT EDIT SKEMA                               */}
                {/* ================================================== */}
                {editingItem.type === 'skema' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Merek Motor</label>
                        <select value={editForm.brand || 'Honda'} onChange={e => setEditForm({ ...editForm, brand: e.target.value })} className="w-full bg-dark border border-border p-4 rounded-xl text-white outline-none focus:border-accent font-bold uppercase tracking-widest text-sm appearance-none">
                          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nama Motor</label>
                          <input type="text" value={editForm.motorcycle_name} onChange={e => setEditForm({ ...editForm, motorcycle_name: e.target.value })} className="w-full bg-dark border border-border rounded-xl p-4 text-sm text-white focus:border-accent outline-none" required />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Komponen</label>
                          <input type="text" value={editForm.component_name} onChange={e => setEditForm({ ...editForm, component_name: e.target.value })} className="w-full bg-dark border border-border rounded-xl p-4 text-sm text-white focus:border-accent outline-none" required />
                        </div>
                      </div>
                    </div>

                    <div className="border border-border rounded-xl p-4 bg-[#0a0a0a]">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-xs font-bold text-accent uppercase tracking-widest">Edit Tabel Pin-Out</label>
                        <button type="button" onClick={handleEditAddPin} className="text-[10px] bg-border border border-gray-600 text-white px-3 py-1.5 rounded-lg hover:border-accent transition uppercase font-bold tracking-widest">+ Tambah Pin</button>
                      </div>
                      <div className="space-y-4">
                        {editForm.pinouts.map((pin: any, index: number) => (
                          <div key={index} className="flex flex-col md:flex-row gap-3 bg-card p-4 rounded-xl border border-border items-start md:items-center shadow-lg">
                            <div className="flex justify-between w-full md:w-auto items-center">
                              <div className="text-accent font-black bg-dark border border-border px-3 py-1.5 rounded-lg text-xs tracking-widest">PIN {pin.pin_number}</div>
                              <button type="button" onClick={() => handleEditRemovePin(index)} className="md:hidden text-red-500 p-2 hover:bg-red-900/30 rounded-lg transition"><i className="bi bi-trash text-lg"></i></button>
                            </div>
                            <input type="text" value={pin.cable_color} onChange={(e) => handleEditPinChange(index, 'cable_color', e.target.value)} placeholder="Warna Kabel" className="w-full md:flex-1 bg-dark border border-border rounded-lg p-3 text-sm text-white outline-none focus:border-accent transition" />
                            <input type="text" value={pin.function_desc} onChange={(e) => handleEditPinChange(index, 'function_desc', e.target.value)} placeholder="Fungsi" className="w-full md:flex-[2] bg-dark border border-border rounded-lg p-3 text-sm text-white outline-none focus:border-accent transition" />
                            <input type="text" value={pin.standard_voltage || ''} onChange={(e) => handleEditPinChange(index, 'standard_voltage', e.target.value)} placeholder="Voltase" className="w-full md:flex-1 bg-dark border border-border rounded-lg p-3 text-sm text-white font-mono outline-none focus:border-accent transition" />
                            <button type="button" onClick={() => handleEditRemovePin(index)} className="hidden md:block text-red-500 p-3 hover:bg-red-900/30 rounded-lg transition"><i className="bi bi-trash text-lg"></i></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Catatan Teknis</label>
                      <textarea value={editForm.technical_notes || ''} onChange={e => setEditForm({ ...editForm, technical_notes: e.target.value })} className="w-full bg-dark border border-border rounded-xl p-4 text-sm text-white focus:border-accent outline-none h-24 leading-relaxed whitespace-pre-wrap" />
                    </div>
                  </div>
                )}

                {/* ================================================== */}
                {/* 2. LAYOUT EDIT DIAGNOSIS                           */}
                {/* ================================================== */}
                {editingItem.type === 'diagnosis' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Judul Kasus</label>
                      <input type="text" value={editForm.case_title} onChange={e => setEditForm({ ...editForm, case_title: e.target.value })} className="w-full bg-dark border border-border rounded-xl p-4 text-sm text-white focus:border-accent outline-none font-bold" required />
                    </div>

                    <div className="border border-border rounded-xl p-4 bg-[#0a0a0a]">
                      <div className="flex justify-between items-center mb-4">
                        <label className="block text-[10px] font-bold text-accent uppercase tracking-widest">Edit Gejala</label>
                        <button type="button" onClick={() => handleEditAddArray('symptoms')} className="text-[10px] bg-dark border border-border text-white px-3 py-1.5 rounded-lg hover:border-accent transition">+ Tambah</button>
                      </div>
                      {editForm.symptoms.map((s: string, i: number) => (
                        <div key={i} className="flex gap-2 mb-3">
                          <input type="text" value={s} onChange={e => handleEditArrayChange('symptoms', i, e.target.value)} className="flex-1 bg-dark border border-border p-3 rounded-lg text-sm text-white outline-none focus:border-accent transition" />
                          <button type="button" onClick={() => handleEditRemoveArray('symptoms', i)} className="text-red-500 px-3 hover:bg-red-900/30 rounded-lg transition"><i className="bi bi-trash text-lg"></i></button>
                        </div>
                      ))}
                    </div>

                    <div className="border border-border rounded-xl p-4 bg-[#0a0a0a]">
                      <div className="flex justify-between items-center mb-6">
                        <label className="block text-[10px] font-bold text-accent uppercase tracking-widest">Edit Prosedur Pengecekan</label>
                        <button type="button" onClick={() => handleEditAddArray('diagnosis_steps')} className="text-[10px] bg-border text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition font-bold uppercase tracking-widest">+ Tambah Langkah</button>
                      </div>
                      <div className="space-y-4">
                        {editForm.diagnosis_steps.map((s: string, i: number) => (
                          <div key={i} className="flex flex-col md:flex-row gap-3 items-start bg-card p-4 rounded-xl border border-border shadow-lg">
                            <div className="flex justify-between w-full md:w-auto items-center">
                              <span className="text-accent font-black bg-dark border border-border px-3 py-1.5 rounded-lg text-xs tracking-widest">TAHAP {i+1}</span>
                              <button type="button" onClick={() => handleEditRemoveArray('diagnosis_steps', i)} className="md:hidden text-red-500 p-2 hover:bg-red-900/30 rounded-lg transition"><i className="bi bi-trash text-lg"></i></button>
                            </div>
                            <textarea 
                              value={s} 
                              onChange={e => handleEditArrayChange('diagnosis_steps', i, e.target.value)} 
                              className="flex-1 w-full bg-dark border border-border p-4 rounded-xl text-sm text-white outline-none focus:border-accent transition min-h-[120px] leading-relaxed whitespace-pre-wrap" 
                            />
                            <button type="button" onClick={() => handleEditRemoveArray('diagnosis_steps', i)} className="hidden md:block text-red-500 p-3 mt-1 hover:bg-red-900/30 rounded-lg transition"><i className="bi bi-trash text-lg"></i></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2">Tindakan Darurat</label>
                        <textarea value={editForm.initial_action} onChange={e => setEditForm({ ...editForm, initial_action: e.target.value })} className="w-full bg-dark border border-red-900/50 p-4 rounded-xl text-sm text-white focus:border-red-500 outline-none h-28 leading-relaxed whitespace-pre-wrap" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-green-500 uppercase tracking-widest mb-2">Pencegahan</label>
                        <textarea value={editForm.prevention} onChange={e => setEditForm({ ...editForm, prevention: e.target.value })} className="w-full bg-dark border border-green-900/50 p-4 rounded-xl text-sm text-white focus:border-green-500 outline-none h-28 leading-relaxed whitespace-pre-wrap" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ================================================== */}
                {/* 3. LAYOUT EDIT JURNAL                              */}
                {/* ================================================== */}
                {editingItem.type === 'jurnal' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Judul Artikel</label>
                      <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="w-full bg-dark border border-border rounded-xl p-4 text-sm text-white focus:border-accent outline-none font-bold" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Isi Konten / Catatan</label>
                      <textarea 
                        value={editForm.content} 
                        onChange={e => setEditForm({ ...editForm, content: e.target.value })} 
                        className="w-full bg-dark border border-border rounded-xl p-5 text-sm text-white focus:border-accent outline-none min-h-[300px] leading-relaxed whitespace-pre-wrap" 
                        required 
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="p-4 border-t border-border bg-[#0a0a0a] rounded-b-2xl">
              <button type="submit" form="editFormSubmit" disabled={isProcessing} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm bg-accent text-black hover:scale-[1.01] transition-all shadow-[0_0_15px_rgba(217,119,6,0.2)]">
                {isProcessing ? 'Menyinkronkan Perubahan...' : 'Simpan Pembaruan Data'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- HALAMAN MANAJEMEN UTAMA --- */}
      <button onClick={onBack} className="mb-6 text-gray-400 font-bold uppercase text-xs tracking-widest hover:text-white transition"><i className="bi bi-arrow-left mr-2"></i> Kembali ke Sistem</button>
      <h2 className="text-2xl font-black text-white uppercase mb-4 tracking-widest">Manajemen Data</h2>

      <div className="relative mb-6">
        <i className="bi bi-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
        <input type="text" placeholder="Cari data untuk dibongkar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-card border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent transition" />
      </div>

      <div className="flex bg-black p-1 rounded-xl border border-border mb-6">
        <button onClick={() => setActiveTab('skema')} className={`flex-1 py-3 rounded-lg font-bold text-[10px] md:text-xs uppercase tracking-widest transition ${activeTab === 'skema' ? 'bg-border text-white' : 'text-gray-600 hover:text-gray-300'}`}>Skema ({schematics.length})</button>
        <button onClick={() => setActiveTab('diagnosis')} className={`flex-1 py-3 rounded-lg font-bold text-[10px] md:text-xs uppercase tracking-widest transition ${activeTab === 'diagnosis' ? 'bg-border text-white' : 'text-gray-600 hover:text-gray-300'}`}>Diagnosis ({troubles.length})</button>
        <button onClick={() => setActiveTab('jurnal')} className={`flex-1 py-3 rounded-lg font-bold text-[10px] md:text-xs uppercase tracking-widest transition ${activeTab === 'jurnal' ? 'bg-border text-white' : 'text-gray-600 hover:text-gray-300'}`}>Jurnal ({modifications.length})</button>
      </div>

      <div className="space-y-3">
        {activeTab === 'skema' && filteredSchematics.map(item => (
          <div key={item.id} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between group hover:border-accent transition">
            <div className="flex-1 pr-4">
              <h4 className="text-white font-bold text-sm uppercase">{item.motorcycle_name}</h4>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                {item.brand ? `${item.brand} • ` : ''}{item.component_name} • {item.pinouts.length} Pin
              </p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => openEditModal(item, 'skema')} className="bg-dark border border-border text-accent p-3 rounded-lg hover:bg-accent hover:text-black transition"><i className="bi bi-tools"></i></button>
              <button onClick={() => handleDelete('schematics', item.id)} disabled={isProcessing} className="bg-dark border border-border text-red-500 p-3 rounded-lg hover:bg-red-500 hover:text-black transition"><i className="bi bi-trash"></i></button>
            </div>
          </div>
        ))}

        {activeTab === 'diagnosis' && filteredTroubles.map(item => (
          <div key={item.id} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between group hover:border-accent transition">
            <div className="flex-1 pr-4">
              <h4 className="text-white font-bold text-sm uppercase">{item.case_title}</h4>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">{item.diagnosis_steps.length} Langkah Diagnosis</p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => openEditModal(item, 'diagnosis')} className="bg-dark border border-border text-accent p-3 rounded-lg hover:bg-accent hover:text-black transition"><i className="bi bi-tools"></i></button>
              <button onClick={() => handleDelete('troubleshooting', item.id)} disabled={isProcessing} className="bg-dark border border-border text-red-500 p-3 rounded-lg hover:bg-red-500 hover:text-black transition"><i className="bi bi-trash"></i></button>
            </div>
          </div>
        ))}

        {activeTab === 'jurnal' && filteredMods.map(item => (
          <div key={item.id} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between group hover:border-accent transition">
            <div className="flex-1 pr-4">
              <h4 className="text-white font-bold text-sm uppercase line-clamp-1">{item.title}</h4>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">{new Date(item.created_at).toLocaleDateString('id-ID')}</p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => openEditModal(item, 'jurnal')} className="bg-dark border border-border text-accent p-3 rounded-lg hover:bg-accent hover:text-black transition"><i className="bi bi-tools"></i></button>
              <button onClick={() => handleDelete('modifications', item.id)} disabled={isProcessing} className="bg-dark border border-border text-red-500 p-3 rounded-lg hover:bg-red-500 hover:text-black transition"><i className="bi bi-trash"></i></button>
            </div>
          </div>
        ))}

        {/* PESAN KOSONG */}
        {((activeTab === 'skema' && filteredSchematics.length === 0) || 
          (activeTab === 'diagnosis' && filteredTroubles.length === 0) || 
          (activeTab === 'jurnal' && filteredMods.length === 0)) && (
          <div className="text-center py-10 text-gray-600 font-bold uppercase tracking-widest text-xs">Data tidak ditemukan</div>
        )}
      </div>

    </div>
  );
};

export default ManagePosts;
