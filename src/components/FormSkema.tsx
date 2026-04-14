/**
 * Version: 2.5.1 (Stable Upgrade)
 * Changelog: 
 * - Bugfix UI: Layout Pin-Out overflow di layar mobile diperbaiki (stacking flex-col).
 * - Fitur: Inject Dropdown Merek Motor (Fase 2 Brand Filter).
 * - Mengembalikan input 'Voltase' yang hilang pada Pin-Out.
 */
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PinoutDetail } from '../types';

interface Props { onBack: () => void; }
interface ImageObject { file: File | null; preview: string; isExternal: boolean; }
interface CloudinaryResource { asset_id: string; secure_url: string; }

// LIST MEREK MOTOR UNTUK FASE 2
const BRANDS = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Vespa', 'Lainnya'];

const FormSkema: React.FC<Props> = ({ onBack }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryImages, setGalleryImages] = useState<CloudinaryResource[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  
  const [brand, setBrand] = useState('Honda'); // STATE MEREK BARU
  const [motorName, setMotorName] = useState('');
  const [compName, setCompName] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const [images, setImages] = useState<ImageObject[]>([]);
  const [externalUrl, setExternalUrl] = useState('');
  // Pastikan standard_voltage ada di state awal
  const [pinouts, setPinouts] = useState<PinoutDetail[]>([{ pin_number: 1, cable_color: '', function_desc: '', standard_voltage: '' }]);

  const CLOUDINARY_CLOUD_NAME = 'dxgkpvca2';
  const CLOUDINARY_UPLOAD_PRESET = 'mekanikPro';

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getOptimizedThumbnail = (url: string) => url.includes('/upload/') ? url.replace('/upload/', '/upload/c_fill,w_300,h_300,q_auto,f_auto/') : url;

  // Media Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map(file => ({ file, preview: URL.createObjectURL(file), isExternal: false }));
      setImages([...images, ...newImages]);
    }
  };
  
  const addExternalImage = () => { 
    if (externalUrl) { 
      setImages([...images, { file: null, preview: externalUrl, isExternal: true }]); 
      setExternalUrl(''); 
    } 
  };
  
  const removeImage = (index: number) => {
    const newImages = [...images];
    if (!newImages[index].isExternal) URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const fetchGalleryFromBackend = async () => {
    setIsLoadingGallery(true); setShowGalleryModal(true);
    try {
      const res = await fetch('/api/gallery');
      if (!res.ok) throw new Error('Server ditolak');
      setGalleryImages(await res.json());
    } catch (err) {
      notify('Gagal load galeri dari Port 3000', 'error'); setShowGalleryModal(false);
    } finally { setIsLoadingGallery(false); }
  };
  
  const selectFromGallery = (url: string) => { 
    setImages(prev => [...prev, { file: null, preview: url, isExternal: true }]); 
    setShowGalleryModal(false); 
  };

  // Pinout Handlers
  const handleAddPin = () => setPinouts([...pinouts, { pin_number: pinouts.length + 1, cable_color: '', function_desc: '', standard_voltage: '' }]);
  const handleRemovePin = (idxToRemove: number) => {
    if (pinouts.length > 1) setPinouts(pinouts.filter((_, idx) => idx !== idxToRemove).map((p, idx) => ({ ...p, pin_number: idx + 1 })));
  };
  const handlePinChange = (idx: number, field: keyof PinoutDetail, val: string) => {
    const next = [...pinouts]; next[idx] = { ...next[idx], [field]: val }; setPinouts(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motorName || !compName) return notify('Nama Motor dan Komponen wajib diisi!', 'error');
    if (images.length === 0 && !window.confirm('Post tanpa gambar?')) return;
    
    setIsUploading(true);
    try {
      const uploadPromises = images.map(async (img) => {
        if (img.isExternal) return img.preview;
        const fd = new FormData(); fd.append('file', img.file!); fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
        const data = await res.json(); return data.secure_url;
      });
      const finalImageUrls = await Promise.all(uploadPromises);

      await addDoc(collection(db, 'schematics'), {
        brand: brand, // DATA MEREK DISIMPAN KE FIREBASE
        motorcycle_name: motorName, 
        component_name: compName, 
        image_urls: finalImageUrls,
        pinouts: pinouts.filter(p => p.cable_color !== '' || p.function_desc !== ''),
        technical_notes: techNotes, 
        created_at: new Date().toISOString()
      });
      notify('Skema berhasil dipublikasikan!');
      setTimeout(() => onBack(), 1500);
    } catch (err) { notify('Gagal memposting skema!', 'error'); } finally { setIsUploading(false); }
  };

  return (
    <div className="animate-fade-in pb-10 relative">
      {toast && <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-xl border shadow-2xl font-bold text-xs uppercase tracking-widest ${toast.type === 'success' ? 'bg-[#001a05] border-green-500 text-green-500' : 'bg-[#1a0000] border-red-500 text-red-500'}`}>{toast.msg}</div>}
      
      {/* MODAL GALLERY FIX */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-10">
          <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-2xl max-h-full flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center"><i className="bi bi-server text-accent mr-3"></i> Server Gallery</h3>
              <button onClick={() => setShowGalleryModal(false)} className="text-gray-500 hover:text-white bg-dark w-8 h-8 rounded-full border border-border flex items-center justify-center"><i className="bi bi-x-lg text-sm"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar">
              {isLoadingGallery ? (
                <div className="text-center py-20 text-accent font-bold uppercase tracking-widest text-xs animate-pulse">Menghubungkan Database...</div>
              ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 {galleryImages.map(img => (
                   <button key={img.asset_id} onClick={() => selectFromGallery(img.secure_url)} className="aspect-square bg-dark border border-border rounded-xl overflow-hidden hover:border-accent group relative transition">
                     <img src={getOptimizedThumbnail(img.secure_url)} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" alt="gallery item" loading="lazy" />
                     <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="bg-black text-accent text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-accent">Pilih</span>
                     </div>
                   </button>
                 ))}
               </div>
              )}
            </div>
          </div>
        </div>
      )}

      <button onClick={onBack} className="mb-6 text-gray-400 font-bold uppercase text-xs tracking-widest hover:text-white transition"><i className="bi bi-arrow-left mr-2"></i> Kembali Ke Sistem</button>
      <h2 className="text-2xl font-black text-white uppercase mb-6 tracking-widest">Tambah Skema Baru</h2>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-8">
        
        {/* MEDIA MANAGEMENT */}
        <div className="space-y-4">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Upload Foto / Skema Komponen</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square bg-dark border border-border rounded-xl overflow-hidden group">
                <img src={img.preview} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg"><i className="bi bi-x"></i></button>
              </div>
            ))}
            <label className="aspect-square border border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-accent group bg-dark transition">
              <i className="bi bi-folder2-open text-gray-600 group-hover:text-accent text-2xl mb-1"></i>
              <span className="text-[9px] text-gray-500 uppercase font-bold group-hover:text-accent tracking-widest">Galeri HP</span>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
            <button type="button" onClick={fetchGalleryFromBackend} className="aspect-square border border-border rounded-xl flex flex-col items-center justify-center cursor-pointer bg-dark hover:border-green-500 group transition">
              <i className="bi bi-server text-gray-600 group-hover:text-green-500 text-2xl mb-1"></i>
              <span className="text-[9px] text-gray-500 uppercase font-bold group-hover:text-green-500 tracking-widest">Server Galeri</span>
            </button>
          </div>
        </div>

        {/* INPUT IDENTITAS MOTOR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Merek Motor</label>
            <select value={brand} onChange={e => setBrand(e.target.value)} className="w-full bg-dark border border-border p-4 rounded-xl text-white outline-none focus:border-accent font-bold uppercase tracking-widest text-sm appearance-none">
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Tipe Motor</label>
                <input type="text" placeholder="Ex: Vario 150 FI" value={motorName} onChange={e => setMotorName(e.target.value)} className="w-full bg-dark border border-border p-4 rounded-xl text-white outline-none focus:border-accent" required />
             </div>
             <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nama Komponen</label>
                <input type="text" placeholder="Ex: Soket ECM" value={compName} onChange={e => setCompName(e.target.value)} className="w-full bg-dark border border-border p-4 rounded-xl text-white outline-none focus:border-accent" required />
             </div>
          </div>
        </div>

        {/* KONFIGURASI PIN-OUT RESPONSIVE FIX */}
        <div className="border border-border rounded-xl p-4 bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-6">
            <label className="text-xs font-bold text-accent uppercase tracking-widest">Konfigurasi Pin-Out</label>
            <button type="button" onClick={handleAddPin} className="text-[10px] bg-border border border-gray-600 text-white px-3 py-1.5 rounded-lg hover:border-accent transition uppercase font-bold tracking-widest">+ Tambah Pin</button>
          </div>
          <div className="space-y-4">
            {pinouts.map((pin, index) => (
              // FIX: flex-col pada mobile agar tidak meluap ke samping, flex-row pada desktop
              <div key={index} className="flex flex-col md:flex-row gap-3 bg-card p-4 rounded-xl border border-border items-start md:items-center shadow-lg">
                
                {/* Header Mobile: PIN Label & Tombol Tong Sampah */}
                <div className="flex justify-between w-full md:w-auto items-center">
                  <div className="text-accent font-black bg-dark border border-border px-3 py-1.5 rounded-lg text-xs tracking-widest">PIN {pin.pin_number}</div>
                  <button type="button" onClick={() => handleRemovePin(index)} className="md:hidden text-red-500 p-2 hover:bg-red-900/30 rounded-lg transition"><i className="bi bi-trash text-lg"></i></button>
                </div>
                
                <input type="text" value={pin.cable_color} onChange={(e) => handlePinChange(index, 'cable_color', e.target.value)} placeholder="Warna Kabel" className="w-full md:flex-1 bg-dark border border-border rounded-lg p-3 text-sm text-white outline-none focus:border-accent transition" />
                <input type="text" value={pin.function_desc} onChange={(e) => handlePinChange(index, 'function_desc', e.target.value)} placeholder="Fungsi Kabel" className="w-full md:flex-[2] bg-dark border border-border rounded-lg p-3 text-sm text-white outline-none focus:border-accent transition" />
                <input type="text" value={pin.standard_voltage} onChange={(e) => handlePinChange(index, 'standard_voltage', e.target.value)} placeholder="Voltase (ex: 12V)" className="w-full md:flex-1 bg-dark border border-border rounded-lg p-3 text-sm text-white font-mono outline-none focus:border-accent transition" />
                
                {/* Tombol Tong Sampah khusus Desktop */}
                <button type="button" onClick={() => handleRemovePin(index)} className="hidden md:block text-red-500 p-3 hover:bg-red-900/30 rounded-lg transition"><i className="bi bi-trash text-lg"></i></button>
              </div>
            ))}
          </div>
        </div>

        {/* CATATAN TEKNIS */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Catatan Teknis (Opsional)</label>
          <textarea value={techNotes} onChange={e => setTechNotes(e.target.value)} className="w-full bg-dark border border-border p-4 rounded-xl text-white outline-none focus:border-accent h-24 leading-relaxed" placeholder="Instruksi khusus, peringatan korsleting, dll..." />
        </div>
        
        <button type="submit" disabled={isUploading} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm bg-accent text-black hover:bg-opacity-90 hover:scale-[1.01] transition-all">
          {isUploading ? 'Memproses Publikasi...' : 'Simpan Skema Sekarang'}
        </button>
      </form>
    </div>
  );
};
export default FormSkema;
