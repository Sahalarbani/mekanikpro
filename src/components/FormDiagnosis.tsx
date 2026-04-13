/**
 * Version: 2.0.0 (Diagnosis Upgrade)
 * Changelog: 
 * - Upgrade 'Langkah Diagnosis' menjadi Textarea Multi-line untuk penjelasan komprehensif.
 * - Membuka kunci fitur Upload Media (Gambar) yang sebelumnya di-hardcode kosong.
 * - Migrasi dari alert() konvensional ke sistem Toast Notification.
 * - Penyempurnaan UI Card agar sejajar dengan standar FormSkema.
 */
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface Props { onBack: () => void; }
interface ImageObject { file: File | null; preview: string; isExternal: boolean; }
interface CloudinaryResource { asset_id: string; secure_url: string; }

const FormDiagnosis: React.FC<Props> = ({ onBack }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  // --- MEDIA STATE (FITUR BARU UNTUK DIAGNOSIS) ---
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryImages, setGalleryImages] = useState<CloudinaryResource[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [images, setImages] = useState<ImageObject[]>([]);
  
  const [title, setTitle] = useState(''); 
  const [symptoms, setSymptoms] = useState<string[]>(['']);
  const [steps, setSteps] = useState<string[]>(['']);
  const [action, setAction] = useState('');
  const [prevention, setPrevention] = useState('');

  const CLOUDINARY_CLOUD_NAME = 'dxgkpvca2';
  const CLOUDINARY_UPLOAD_PRESET = 'mekanikPro';

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getOptimizedThumbnail = (url: string) => url.includes('/upload/') ? url.replace('/upload/', '/upload/c_fill,w_300,h_300,q_auto,f_auto/') : url;

  // --- MEDIA HANDLERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map(file => ({ file, preview: URL.createObjectURL(file), isExternal: false }));
      setImages([...images, ...newImages]);
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
      const res = await fetch('http://localhost:3000/api/gallery');
      if (!res.ok) throw new Error('Server ditolak');
      setGalleryImages(await res.json());
    } catch (err) { notify('Gagal load galeri', 'error'); setShowGalleryModal(false); } 
    finally { setIsLoadingGallery(false); }
  };
  
  const selectFromGallery = (url: string) => { 
    setImages(prev => [...prev, { file: null, preview: url, isExternal: true }]); 
    setShowGalleryModal(false); 
  };

  // --- ARRAY HANDLERS ---
  const updateField = (setter: any, current: any[], idx: number, val: any) => { 
    const next = [...current]; next[idx] = val; setter(next); 
  };
  const removeField = (setter: any, current: any[], idx: number) => { 
    if (current.length > 1) setter(current.filter((_: any, i: number) => i !== idx)); 
  };

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return notify('Judul kasus wajib diisi!', 'error');
    
    setIsUploading(true);
    try {
      // Proses upload gambar jika mekanik melampirkan foto komponen rusak
      const uploadPromises = images.map(async (img) => {
        if (img.isExternal) return img.preview;
        const fd = new FormData(); fd.append('file', img.file!); fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
        const data = await res.json(); return data.secure_url;
      });
      const finalImageUrls = await Promise.all(uploadPromises);

      await addDoc(collection(db, 'troubleshooting'), {
        case_title: title, 
        icon_class: 'bi-tools', 
        image_urls: finalImageUrls, // SEKARANG BISA SIMPAN GAMBAR!
        symptoms: symptoms.filter(s => s.trim() !== ''), 
        diagnosis_steps: steps.filter(s => s.trim() !== ''),
        initial_action: action, 
        prevention: prevention, 
        created_at: new Date().toISOString()
      });
      
      notify('Diagnosis berhasil dipublikasikan!'); 
      setTimeout(() => onBack(), 1500);
    } catch (err) { 
      notify('Gagal menyimpan diagnosis. Cek koneksi.', 'error'); 
    } finally { 
      setIsUploading(false); 
    }
  };

  return (
    <div className="animate-fade-in pb-10 relative">
      
      {/* TOAST NOTIFICATION */}
      {toast && <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-xl border shadow-2xl font-bold text-xs uppercase tracking-widest ${toast.type === 'success' ? 'bg-[#001a05] border-green-500 text-green-500' : 'bg-[#1a0000] border-red-500 text-red-500'}`}>{toast.msg}</div>}

      {/* MODAL GALLERY */}
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
                   </button>
                 ))}
               </div>
              )}
            </div>
          </div>
        </div>
      )}

      <button onClick={onBack} className="mb-6 text-gray-400 font-bold uppercase text-xs tracking-widest hover:text-white transition">
        <i className="bi bi-arrow-left mr-2"></i> Batal & Kembali
      </button>
      <h2 className="text-2xl font-black text-white uppercase mb-6 tracking-widest">Post Kasus Diagnosis</h2>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-8">
        
        {/* FITUR BARU: MEDIA UPLOAD DIAGNOSIS */}
        <div className="space-y-4">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Media Bukti Kasus (Opsional)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square bg-dark border border-border rounded-xl overflow-hidden group">
                <img src={img.preview} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg"><i className="bi bi-x"></i></button>
              </div>
            ))}
            <label className="aspect-square border border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-accent group bg-dark transition">
              <i className="bi bi-image text-gray-600 group-hover:text-accent text-2xl mb-1"></i>
              <span className="text-[9px] text-gray-500 uppercase font-bold group-hover:text-accent tracking-widest">Upload Foto</span>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
            <button type="button" onClick={fetchGalleryFromBackend} className="aspect-square border border-border rounded-xl flex flex-col items-center justify-center cursor-pointer bg-dark hover:border-green-500 group transition">
              <i className="bi bi-server text-gray-600 group-hover:text-green-500 text-2xl mb-1"></i>
              <span className="text-[9px] text-gray-500 uppercase font-bold group-hover:text-green-500 tracking-widest">Dari Server</span>
            </button>
          </div>
        </div>

        {/* JUDUL */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nama Kasus / Penyakit</label>
          <input type="text" placeholder="Ex: Vario Hilang Pengapian Total" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-dark border border-border p-4 rounded-xl text-white outline-none focus:border-accent font-bold" />
        </div>
        
        {/* GEJALA */}
        <div className="border border-border rounded-xl p-4 bg-[#0a0a0a]">
          <div className="flex justify-between items-center mb-4">
            <label className="text-xs font-bold text-accent uppercase tracking-widest">Daftar Gejala Pelanggan</label>
            <button type="button" onClick={() => setSymptoms([...symptoms, ''])} className="text-[10px] bg-dark border border-border text-white px-3 py-1.5 rounded-lg hover:border-accent transition">+ Tambah Gejala</button>
          </div>
          {symptoms.map((s, i) => (
            <div key={i} className="flex gap-2 mb-3">
              <input type="text" placeholder="Ex: Motor mati mendadak saat mesin panas" value={s} onChange={e => updateField(setSymptoms, symptoms, i, e.target.value)} className="flex-1 bg-dark border border-border p-3 rounded-lg text-sm text-white outline-none focus:border-accent transition" />
              <button type="button" onClick={() => removeField(setSymptoms, symptoms, i)} className="text-red-500 px-3 hover:bg-red-900/30 rounded-lg transition"><i className="bi bi-trash text-lg"></i></button>
            </div>
          ))}
        </div>

        {/* LANGKAH DIAGNOSIS (UPGRADED TO RICH TEXTAREA) */}
        <div className="border border-border rounded-xl p-4 bg-[#0a0a0a]">
          <div className="flex justify-between items-center mb-6">
            <label className="text-xs font-bold text-accent uppercase tracking-widest">Prosedur Pengecekan</label>
            <button type="button" onClick={() => setSteps([...steps, ''])} className="text-[10px] bg-border text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition font-bold uppercase tracking-widest">+ Tambah Langkah</button>
          </div>
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-3 items-start bg-card p-4 rounded-xl border border-border shadow-lg">
                <div className="flex justify-between w-full md:w-auto items-center">
                  <span className="text-accent font-black bg-dark border border-border px-3 py-1.5 rounded-lg text-xs tracking-widest">TAHAP {i+1}</span>
                  <button type="button" onClick={() => removeField(setSteps, steps, i)} className="md:hidden text-red-500 p-2 hover:bg-red-900/30 rounded-lg transition"><i className="bi bi-trash text-lg"></i></button>
                </div>
                
                <textarea 
                  value={s} 
                  onChange={e => updateField(setSteps, steps, i, e.target.value)} 
                  className="flex-1 w-full bg-dark border border-border p-4 rounded-xl text-sm text-white outline-none focus:border-accent transition min-h-[120px] leading-relaxed" 
                  placeholder={`Detail Pengecekan...\nContoh:\n- Komponen: Koil Pengapian\n- Alat: Multitester (Skala 200 Ohm)\n- Standar: 2.1 - 2.5 Ohm\n- Hasil/Tindakan: Jika di bawah standar, ganti koil.`}
                />
                
                <button type="button" onClick={() => removeField(setSteps, steps, i)} className="hidden md:block text-red-500 p-3 mt-1 hover:bg-red-900/30 rounded-lg transition"><i className="bi bi-trash text-lg"></i></button>
              </div>
            ))}
          </div>
        </div>

        {/* TINDAKAN & PENCEGAHAN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2">Tindakan Darurat (Bypass)</label>
            <textarea value={action} onChange={e => setAction(e.target.value)} className="w-full bg-dark border border-red-900/50 p-4 rounded-xl text-white outline-none focus:border-red-500 h-28 leading-relaxed text-sm" placeholder="Solusi sementara agar motor bisa jalan..." />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-green-500 uppercase tracking-widest mb-2">Pencegahan / Edukasi</label>
            <textarea value={prevention} onChange={e => setPrevention(e.target.value)} className="w-full bg-dark border border-green-900/50 p-4 rounded-xl text-white outline-none focus:border-green-500 h-28 leading-relaxed text-sm" placeholder="Saran ke konsumen agar tidak rusak lagi..." />
          </div>
        </div>
        
        <button type="submit" disabled={isUploading} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm bg-accent text-black hover:scale-[1.01] transition-all shadow-[0_0_15px_rgba(217,119,6,0.2)]">
          {isUploading ? 'Menyinkronkan Data...' : 'Publikasikan Diagnosis'}
        </button>
      </form>
    </div>
  );
};
export default FormDiagnosis;
