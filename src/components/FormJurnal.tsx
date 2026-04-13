/**
 * Version: 2.0.0 (Jurnal Editor Upgrade)
 * Changelog: 
 * - UI/UX: Migrasi dari alert() ke Toast Notification elegan.
 * - UI/UX: Memperbesar area Textarea Content (min-h-[300px]) untuk kenyamanan menulis long-form.
 * - FIX: Sinkronisasi desain Card dan Modal Server Gallery agar seragam dengan FormSkema.
 * - Mempertahankan 100% fitur Cloudinary & Database integration.
 */
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface Props { onBack: () => void; }
interface ImageObject { file: File | null; preview: string; isExternal: boolean; }
interface CloudinaryResource { asset_id: string; secure_url: string; }

const FormJurnal: React.FC<Props> = ({ onBack }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryImages, setGalleryImages] = useState<CloudinaryResource[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  
  const [title, setTitle] = useState(''); 
  const [content, setContent] = useState('');
  const [images, setImages] = useState<ImageObject[]>([]);
  
  const CLOUDINARY_CLOUD_NAME = 'dxgkpvca2';
  const CLOUDINARY_UPLOAD_PRESET = 'mekanikPro';

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getOptimizedThumbnail = (url: string) => url.includes('/upload/') ? url.replace('/upload/', '/upload/c_fill,w_300,h_300,q_auto,f_auto/') : url;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map(file => ({ file, preview: URL.createObjectURL(file), isExternal: false }));
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    const next = [...images]; 
    if (!next[index].isExternal) URL.revokeObjectURL(next[index].preview);
    next.splice(index, 1); 
    setImages(next);
  };

  const fetchGalleryFromBackend = async () => {
    setIsLoadingGallery(true); setShowGalleryModal(true);
    try {
      const res = await fetch('http://localhost:3000/api/gallery');
      if (!res.ok) throw new Error('Server error');
      setGalleryImages(await res.json());
    } catch (err) { 
      notify('Gagal terhubung ke Server Galeri (Port 3000)', 'error'); 
      setShowGalleryModal(false); 
    } finally { 
      setIsLoadingGallery(false); 
    }
  };

  const selectFromGallery = (url: string) => { 
    setImages(prev => [...prev, { file: null, preview: url, isExternal: true }]); 
    setShowGalleryModal(false); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return notify('Judul Jurnal wajib diisi!', 'error');
    if (!content) return notify('Isi jurnal tidak boleh kosong!', 'error');
    
    setIsUploading(true);
    try {
      const uploadPromises = images.map(async (img) => {
        if (img.isExternal) return img.preview;
        const fd = new FormData(); fd.append('file', img.file!); fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
        const data = await res.json(); return data.secure_url;
      });
      const finalImageUrls = await Promise.all(uploadPromises);

      await addDoc(collection(db, 'modifications'), {
        title: title, 
        content: content, 
        image_urls: finalImageUrls, 
        created_at: new Date().toISOString()
      });
      
      notify('Jurnal berhasil dipublikasikan!'); 
      setTimeout(() => onBack(), 1500);
    } catch (err) { 
      notify('Gagal mempublikasikan jurnal. Cek koneksi.', 'error'); 
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

      <button onClick={onBack} className="mb-6 text-gray-400 font-bold uppercase text-xs tracking-widest hover:text-white transition">
        <i className="bi bi-arrow-left mr-2"></i> Batal & Kembali
      </button>
      <h2 className="text-2xl font-black text-white uppercase mb-6 tracking-widest">Tulis Jurnal Modifikasi</h2>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-8 shadow-xl">
        
        {/* MEDIA UPLOAD SECTION */}
        <div className="space-y-4">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Media Dokumentasi Project</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square bg-dark border border-border rounded-xl overflow-hidden group">
                <img src={img.preview} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg"><i className="bi bi-x"></i></button>
              </div>
            ))}
            <label className="aspect-square border border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-accent group bg-dark transition">
              <i className="bi bi-image text-gray-600 group-hover:text-accent text-2xl mb-1"></i>
              <span className="text-[9px] text-gray-500 uppercase font-bold group-hover:text-accent tracking-widest mt-1">Upload Foto</span>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
            <button type="button" onClick={fetchGalleryFromBackend} className="aspect-square border border-border rounded-xl flex flex-col items-center justify-center cursor-pointer bg-dark hover:border-green-500 group transition">
              <i className="bi bi-server text-gray-600 group-hover:text-green-500 text-2xl mb-1"></i>
              <span className="text-[9px] text-gray-500 uppercase font-bold group-hover:text-green-500 tracking-widest mt-1">Dari Server</span>
            </button>
          </div>
        </div>

        {/* INPUT JUDUL */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Judul Artikel / Project</label>
          <input type="text" placeholder="Ex: Bore Up NMAX 183cc Harian" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-dark border border-border p-4 rounded-xl text-white outline-none focus:border-accent font-bold transition" />
        </div>

        {/* TEXTAREA CONTENT (DIBUAT LEBIH LEGA) */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-[10px] font-bold text-accent uppercase tracking-widest">Catatan Pengerjaan</label>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest">Mendukung Paragraf (Enter)</span>
          </div>
          <textarea 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            className="w-full bg-dark border border-border p-5 rounded-xl text-white outline-none focus:border-accent min-h-[300px] leading-relaxed transition" 
            placeholder="Ceritakan detail ubahan, spesifikasi part, hasil dyno test, atau kendala saat pengerjaan di sini..." 
          />
        </div>
        
        <button type="submit" disabled={isUploading} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm bg-accent text-black hover:scale-[1.01] shadow-[0_0_15px_rgba(217,119,6,0.2)] transition-all">
          {isUploading ? 'Memproses Publikasi...' : 'Publikasikan Jurnal'}
        </button>
      </form>
    </div>
  );
};

export default FormJurnal;
