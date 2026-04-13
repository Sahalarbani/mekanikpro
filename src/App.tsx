/**
 * Version: 5.0.2 (Ultimate Stable + Navigation Fix)
 * Changelog: 
 * - FIX LOGIC: Perbaikan fungsi Open Detail (Skema/Diagnosis/Jurnal) agar merubah state `activeTab` 
 * secara eksplisit, memperbaiki bug dimana klik dari Beranda (Feed/Bookmark) tidak merubah layar.
 * - Mempertahankan 100% fitur Fase 2 & Fase 3 tanpa ada yang terpotong.
 */
import React, { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { db, auth } from './services/firebase' 
import MotorcycleCard from './components/MotorcycleCard'
import PinoutTable from './components/PinoutTable'
import TroubleshootingCard from './components/TroubleshootingCard'
import DiagnosisWizard from './components/DiagnosisWizard'
import FormSkema from './components/FormSkema'
import FormDiagnosis from './components/FormDiagnosis'
import FormJurnal from './components/FormJurnal'
import ManagePosts from './components/ManagePosts'
import Calculator from './components/Calculator'
import { Schematic, TroubleshootingCase, ModificationPost } from './types'

type AdminMode = 'none' | 'skema' | 'diagnosis' | 'jurnal' | 'manage' | 'calculator';
const BRANDS = ['Semua', 'Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Vespa', 'Lainnya'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home') 
  const [adminView, setAdminView] = useState<AdminMode>('none')
  
  const [selectedSchematicId, setSelectedSchematicId] = useState<string | null>(null)
  const [selectedTroubleId, setSelectedTroubleId] = useState<string | null>(null)
  const [selectedJurnalId, setSelectedJurnalId] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Semua');

  const [schematics, setSchematics] = useState<Schematic[]>([]);
  const [troubles, setTroubles] = useState<TroubleshootingCase[]>([]);
  const [modifications, setModifications] = useState<ModificationPost[]>([]);

  const [isInitializing, setIsInitializing] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ s: false, t: false, m: false });
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem('mekanikpro_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  const notify = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id];
      localStorage.setItem('mekanikpro_bookmarks', JSON.stringify(next));
      if(!prev.includes(id)) notify('Disimpan ke Favorit', 'success');
      return next;
    });
  };

  const handleShare = async (title: string, desc: string, hashUrl: string) => {
    const fullUrl = `${window.location.origin}/#${hashUrl}`;
    const shareData = { title: `Mekanik Pro: ${title}`, text: desc, url: fullUrl };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`); notify('Link disalin!', 'success'); }
    } catch (err) { console.error('Share dibatalkan', err); }
  };

  useEffect(() => { if (syncStatus.s && syncStatus.t && syncStatus.m) setTimeout(() => setIsInitializing(false), 500); }, [syncStatus]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    const qSchematics = query(collection(db, 'schematics'), orderBy('created_at', 'desc'));
    const unsubSchematics = onSnapshot(qSchematics, (snapshot) => { setSchematics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schematic))); setSyncStatus(p => ({ ...p, s: true })); });
    const qTroubles = query(collection(db, 'troubleshooting'), orderBy('created_at', 'desc'));
    const unsubTroubles = onSnapshot(qTroubles, (snapshot) => { setTroubles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TroubleshootingCase))); setSyncStatus(p => ({ ...p, t: true })); });
    const qMods = query(collection(db, 'modifications'), orderBy('created_at', 'desc'));
    const unsubMods = onSnapshot(qMods, (snapshot) => { setModifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ModificationPost))); setSyncStatus(p => ({ ...p, m: true })); });
    return () => { unsubscribeAuth(); unsubSchematics(); unsubTroubles(); unsubMods(); };
  }, []);

  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); setAuthLoading(true); try { await signInWithEmailAndPassword(auth, email, password); notify('Akses Admin Dibuka!', 'success'); setEmail(''); setPassword(''); } catch (error) { notify('Akses Ditolak: Kredensial Salah', 'error'); } finally { setAuthLoading(false); } };
  const handleLogout = async () => { if(window.confirm('Yakin ingin keluar dari Mode Admin?')) { await signOut(auth); setAdminView('none'); notify('Berhasil Logout', 'success'); } };

  // DEEP LINKING ROUTER
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        setSelectedSchematicId(null); setSelectedTroubleId(null); setSelectedJurnalId(null); setAdminView('none');
      } else if (hash.startsWith('skema-')) {
        setActiveTab('schematics'); setSelectedSchematicId(hash.replace('skema-', '')); setSelectedTroubleId(null); setSelectedJurnalId(null); setAdminView('none');
      } else if (hash.startsWith('diagnosis-')) {
        setActiveTab('troubleshoot'); setSelectedTroubleId(hash.replace('diagnosis-', '')); setSelectedSchematicId(null); setSelectedJurnalId(null); setAdminView('none');
      } else if (hash.startsWith('jurnal-')) {
        setActiveTab('blog'); setSelectedJurnalId(hash.replace('jurnal-', '')); setSelectedSchematicId(null); setSelectedTroubleId(null); setAdminView('none');
      }
    };
    if (!isInitializing) handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isInitializing]);

  const openAdminPanel = (mode: AdminMode) => { window.location.hash = 'view'; setAdminView(mode); };
  
  // FIX LOGIC: OPEN DETAIL FUNCTIONS SEKARANG MENGUBAH TAB SECARA LANGSUNG
  const openSchematicDetail = (id: string) => { 
    setActiveTab('schematics'); 
    setSelectedSchematicId(id); 
    window.location.hash = `skema-${id}`; 
  };
  const openTroubleDetail = (id: string) => { 
    setActiveTab('troubleshoot'); 
    setSelectedTroubleId(id); 
    window.location.hash = `diagnosis-${id}`; 
  };
  const openJurnalDetail = (id: string) => { 
    setActiveTab('blog'); 
    setSelectedJurnalId(id); 
    window.location.hash = `jurnal-${id}`; 
  };
  
  const closeDetailView = () => {
    if (window.location.hash) window.history.back(); 
    else { setSelectedSchematicId(null); setSelectedTroubleId(null); setSelectedJurnalId(null); setAdminView('none'); }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId); setSearchQuery(''); setSelectedBrand('Semua'); setSelectedSchematicId(null); setSelectedTroubleId(null); setSelectedJurnalId(null); setAdminView('none');
    if (window.location.hash) window.history.replaceState(null, '', window.location.href.split('#')[0]);
  };

  const recentUpdates = [
    ...schematics.map(s => ({ id: s.id, type: 'Skema', title: `${s.motorcycle_name} - ${s.component_name}`, date: s.created_at || new Date().toISOString(), icon: 'bi-diagram-3', color: 'text-blue-500' })),
    ...troubles.map(t => ({ id: t.id, type: 'Diagnosis', title: t.case_title, date: t.created_at || new Date().toISOString(), icon: 'bi-exclamation-triangle', color: 'text-red-500' })),
    ...modifications.map(m => ({ id: m.id, type: 'Jurnal', title: m.title, date: m.created_at, icon: 'bi-journal-richtext', color: 'text-green-500' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5); 

  const allItems = [...schematics.map(s => ({...s, type: 'skema'})), ...troubles.map(t => ({...t, type: 'diagnosis'})), ...modifications.map(m => ({...m, type: 'jurnal'}))];
  const bookmarkedItems = allItems.filter(item => bookmarks.includes(item.id));

  const currentSchematic = schematics.find(s => s.id === (selectedSchematicId || ''));
  const currentTrouble = troubles.find(t => t.id === (selectedTroubleId || ''));
  const currentJurnal = modifications.find(m => m.id === (selectedJurnalId || ''));

  const filteredSchematics = schematics.filter(s => { const matchBrand = selectedBrand === 'Semua' || s.brand === selectedBrand; const matchText = s.motorcycle_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.component_name.toLowerCase().includes(searchQuery.toLowerCase()); return matchBrand && matchText; });
  const filteredTroubles = troubles.filter(t => t.case_title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredModifications = modifications.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.content.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute w-64 h-64 bg-accent/20 rounded-full blur-[100px] animate-pulse"></div>
        <i className="bi bi-lightning-charge-fill text-accent text-6xl mb-6 relative z-10 animate-bounce"></i>
        <h1 className="text-3xl font-black text-white uppercase tracking-widest relative z-10">Mekanik Pro</h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2 relative z-10">Digital Workshop Manual</p>
        <div className="mt-12 w-48 relative z-10">
          <div className="flex justify-between text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-2"><span>Sinkronisasi Database...</span><span className="text-accent">{((syncStatus.s ? 33 : 0) + (syncStatus.t ? 33 : 0) + (syncStatus.m ? 34 : 0))}%</span></div>
          <div className="h-1 bg-dark rounded-full overflow-hidden"><div className="h-full bg-accent transition-all duration-500 ease-out" style={{ width: `${(syncStatus.s ? 33 : 0) + (syncStatus.t ? 33 : 0) + (syncStatus.m ? 34 : 0)}%` }}></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-gray-200 flex flex-col relative">
      {toast && <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] px-5 py-3 rounded-xl border shadow-2xl font-bold text-xs uppercase tracking-widest ${toast.type === 'success' ? 'bg-[#001a05] border-green-500 text-green-500' : 'bg-[#1a0000] border-red-500 text-red-500'}`}>{toast.msg}</div>}

      <header className="fixed top-0 left-0 right-0 h-16 bg-black border-b border-border z-40 flex items-center justify-between px-6">
        <div className="flex items-center"><i className="bi bi-lightning-charge-fill text-accent text-xl mr-3"></i><span className="font-bold text-lg tracking-tight text-white uppercase">Mekanik Pro</span></div>
        {user && activeTab === 'dashboard' && adminView === 'none' && <button onClick={handleLogout} className="text-red-500 hover:text-white transition text-sm"><i className="bi bi-box-arrow-right text-xl"></i></button>}
      </header>

      <main className="flex-1 pt-20 pb-24 px-4 md:px-6 overflow-y-auto">
        
        {/* --- TAB 1: BERANDA --- */}
        {activeTab === 'home' && (
          <div className="animate-fade-in space-y-8">
            {adminView === 'calculator' ? <Calculator onBack={closeDetailView} /> : (
              <>
                <div className="bg-gradient-to-br from-[#1a1100] to-black border border-accent/30 p-6 rounded-2xl relative overflow-hidden mt-2">
                  <div className="relative z-10">
                    <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-1">Selamat Datang</h1>
                    <p className="text-accent text-xs font-bold uppercase tracking-widest mb-6">Di Pusat Komando Bengkel</p>
                    <div className="flex gap-3">
                      <button onClick={() => handleTabChange('schematics')} className="bg-accent text-black px-4 py-2.5 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-opacity-90 transition">Cari Skema</button>
                      <button onClick={() => openAdminPanel('calculator')} className="bg-dark border border-border text-white px-4 py-2.5 rounded-lg font-bold uppercase text-[10px] tracking-widest hover:border-gray-500 transition flex items-center"><i className="bi bi-calculator mr-2 text-accent"></i> Kalkulator</button>
                    </div>
                  </div>
                  <i className="bi bi-cpu text-9xl text-accent/10 absolute -right-6 -bottom-6"></i>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-card border border-border p-4 rounded-xl text-center"><i className="bi bi-diagram-3 text-2xl text-blue-500 mb-2 block"></i><h2 className="text-xl font-black text-white">{schematics.length}</h2><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Skema</p></div>
                  <div className="bg-card border border-border p-4 rounded-xl text-center"><i className="bi bi-exclamation-triangle text-2xl text-red-500 mb-2 block"></i><h2 className="text-xl font-black text-white">{troubles.length}</h2><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Kasus</p></div>
                  <div className="bg-card border border-border p-4 rounded-xl text-center"><i className="bi bi-journal-richtext text-2xl text-green-500 mb-2 block"></i><h2 className="text-xl font-black text-white">{modifications.length}</h2><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Jurnal</p></div>
                </div>

                <div>
                  <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-4 flex items-center"><i className="bi bi-star-fill text-accent mr-2"></i> Favorit Tersimpan</h3>
                  <div className="space-y-3">
                    {bookmarkedItems.length > 0 ? bookmarkedItems.map((item: any) => (
                      <div key={item.id} onClick={() => item.type === 'skema' ? openSchematicDetail(item.id) : item.type === 'diagnosis' ? openTroubleDetail(item.id) : openJurnalDetail(item.id)} className="bg-card border border-border p-4 rounded-xl flex items-center cursor-pointer hover:border-accent transition">
                        <div className={`w-10 h-10 rounded-lg bg-dark border border-border flex items-center justify-center mr-4 ${item.type === 'skema' ? 'text-blue-500' : item.type === 'diagnosis' ? 'text-red-500' : 'text-green-500'}`}>
                          <i className={`bi ${item.type === 'skema' ? 'bi-diagram-3' : item.type === 'diagnosis' ? 'bi-exclamation-triangle' : 'bi-journal-richtext'} text-lg`}></i>
                        </div>
                        <div className="flex-1 pr-2">
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">{item.type}</p>
                          <h4 className="text-white font-bold text-xs uppercase line-clamp-1">{item.motorcycle_name || item.case_title || item.title}</h4>
                        </div>
                        <i className="bi bi-chevron-right text-gray-600"></i>
                      </div>
                    )) : <div className="text-center py-10 bg-card border border-dashed rounded-xl"><p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">Belum ada favorit</p></div>}
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-4">Baru Ditambahkan</h3>
                  <div className="space-y-3">
                    {recentUpdates.length > 0 ? recentUpdates.map((item, idx) => (
                      <div key={idx} onClick={() => item.type === 'Skema' ? openSchematicDetail(item.id) : item.type === 'Diagnosis' ? openTroubleDetail(item.id) : openJurnalDetail(item.id)} className="bg-card border border-border p-4 rounded-xl flex items-center cursor-pointer hover:border-accent transition">
                        <div className={`w-10 h-10 rounded-lg bg-dark border border-border flex items-center justify-center mr-4 ${item.color}`}><i className={`bi ${item.icon} text-lg`}></i></div>
                        <div className="flex-1 pr-2"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">{item.type} • {new Date(item.date).toLocaleDateString('id-ID')}</p><h4 className="text-white font-bold text-xs uppercase line-clamp-1">{item.title}</h4></div>
                        <i className="bi bi-chevron-right text-gray-600"></i>
                      </div>
                    )) : <div className="text-center py-10 bg-card border border-border rounded-xl border-dashed"><p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Belum ada aktivitas</p></div>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- TAB SISTEM / CONTROL PANEL --- */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            {!user ? (
              <div className="flex flex-col items-center justify-center pt-10 pb-20">
                <div className="w-16 h-16 bg-[#1a1100] border border-accent rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(217,119,6,0.15)]"><i className="bi bi-shield-lock-fill text-accent text-3xl"></i></div>
                <h1 className="text-2xl font-black text-white uppercase mb-2 tracking-widest">Otorisasi Sistem</h1><p className="text-gray-500 text-xs uppercase tracking-widest mb-10 text-center">Masukkan kredensial khusus kepala mekanik</p>
                <form onSubmit={handleLogin} className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl"><div className="space-y-4 mb-8"><div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email Akses</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-dark border border-border p-3.5 rounded-xl text-white outline-none focus:border-accent transition text-sm" placeholder="mekanik@bengkel.com" required /></div><div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Kode Keamanan</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-dark border border-border p-3.5 rounded-xl text-white outline-none focus:border-accent transition text-sm" placeholder="••••••••" required /></div></div><button type="submit" disabled={authLoading} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition bg-accent text-black hover:shadow-[0_0_20px_rgba(217,119,6,0.3)]">{authLoading ? 'Memverifikasi...' : 'Buka Brankas'}</button></form>
              </div>
            ) : adminView === 'none' ? (
              <>
                <h1 className="text-2xl font-black text-white uppercase mb-6 tracking-widest">Sistem Ready</h1>
                <div className="bg-card border border-border p-6 rounded-2xl mb-8 flex justify-between items-center relative overflow-hidden"><div className="relative z-10"><h3 className="text-white font-bold uppercase text-sm">Akses Admin Aktif</h3><p className="text-gray-500 text-xs mt-1">{schematics.length} Skema | {troubles.length} Kasus</p></div><i className="bi bi-shield-check text-accent text-4xl relative z-10 opacity-80"></i><div className="absolute -right-4 -bottom-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl"></div></div>
                <button onClick={() => openAdminPanel('manage')} className="w-full bg-[#1a1100] border border-accent p-5 rounded-2xl flex items-center justify-between hover:bg-accent transition group mb-8"><div className="flex items-center space-x-4"><div className="bg-dark p-3 rounded-lg border border-accent group-hover:bg-black transition"><i className="bi bi-database-gear text-accent group-hover:text-white text-xl"></i></div><div className="text-left"><h3 className="text-accent group-hover:text-black font-black uppercase tracking-wider text-sm">Manajemen Data</h3><p className="text-accent/70 group-hover:text-black/70 text-[10px] font-bold mt-1 uppercase tracking-widest">Edit & Hapus Postingan</p></div></div><i className="bi bi-chevron-right text-accent group-hover:text-black font-bold"></i></button>
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-4">Pusat Data Entry</h3>
                <div className="space-y-3">
                  <button onClick={() => openAdminPanel('skema')} className="w-full bg-[#1a1a1a] border border-border p-5 rounded-2xl flex items-center hover:border-accent transition text-left group"><div className="bg-dark p-3 rounded-lg border border-border group-hover:bg-accent transition mr-4"><i className="bi bi-diagram-3 text-gray-400 group-hover:text-black text-xl"></i></div><div><h3 className="text-white font-bold uppercase tracking-wider text-sm">Post Skema Baru</h3><p className="text-gray-500 text-[10px] mt-1">Upload foto soket & tabel pin-out</p></div></button>
                  <button onClick={() => openAdminPanel('diagnosis')} className="w-full bg-[#1a1a1a] border border-border p-5 rounded-2xl flex items-center hover:border-accent transition text-left group"><div className="bg-dark p-3 rounded-lg border border-border group-hover:bg-accent transition mr-4"><i className="bi bi-exclamation-triangle text-gray-400 group-hover:text-black text-xl"></i></div><div><h3 className="text-white font-bold uppercase tracking-wider text-sm">Post Kasus Diagnosis</h3><p className="text-gray-500 text-[10px] mt-1">Logika penanganan masalah</p></div></button>
                  <button onClick={() => openAdminPanel('jurnal')} className="w-full bg-[#1a1a1a] border border-border p-5 rounded-2xl flex items-center hover:border-accent transition text-left group"><div className="bg-dark p-3 rounded-lg border border-border group-hover:bg-accent transition mr-4"><i className="bi bi-journal-richtext text-gray-400 group-hover:text-black text-xl"></i></div><div><h3 className="text-white font-bold uppercase tracking-wider text-sm">Tulis Jurnal Modifikasi</h3><p className="text-gray-500 text-[10px] mt-1">Dokumentasi custom part bengkel</p></div></button>
                </div>
              </>
            ) : adminView === 'skema' ? <FormSkema onBack={closeDetailView} /> : adminView === 'diagnosis' ? <FormDiagnosis onBack={closeDetailView} /> : adminView === 'jurnal' ? <FormJurnal onBack={closeDetailView} /> : <ManagePosts schematics={schematics} troubles={troubles} modifications={modifications} onBack={closeDetailView} />}
          </div>
        )}

        {/* --- TAB SKEMA --- */}
        {activeTab === 'schematics' && (
          <div className="animate-fade-in">
             {selectedSchematicId && currentSchematic ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <button onClick={closeDetailView} className="text-gray-400 font-bold uppercase text-xs tracking-widest"><i className="bi bi-arrow-left mr-2"></i> Kembali</button>
                  <div className="flex space-x-3">
                    <button onClick={() => handleShare(currentSchematic.motorcycle_name, currentSchematic.component_name, `skema-${currentSchematic.id}`)} className="w-8 h-8 rounded-full bg-dark border border-border flex items-center justify-center text-gray-400 hover:text-white transition"><i className="bi bi-share-fill"></i></button>
                    <button onClick={() => toggleBookmark(currentSchematic.id)} className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${bookmarks.includes(currentSchematic.id) ? 'bg-accent/20 border-accent text-accent' : 'bg-dark border-border text-gray-400 hover:text-white'}`}><i className={bookmarks.includes(currentSchematic.id) ? "bi bi-star-fill" : "bi bi-star"}></i></button>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mb-2">
                  {currentSchematic.brand && <span className="bg-accent/20 text-accent border border-accent px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">{currentSchematic.brand}</span>}
                  <h1 className="text-2xl font-black text-white uppercase leading-none">{currentSchematic.motorcycle_name}</h1>
                </div>
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-8">{currentSchematic.component_name}</p>
                
                {currentSchematic.image_urls && currentSchematic.image_urls.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8 p-2 space-y-2">
                    {currentSchematic.image_urls.map((url, idx) => (<img key={idx} src={url} className="w-full rounded-xl opacity-60 hover:opacity-100 transition duration-500" alt="Detail" />))}
                  </div>
                )}
                
                <h3 className="text-white font-bold uppercase text-sm mb-4 border-l-4 border-accent pl-3 tracking-widest">Tabel Pin-Out</h3>
                <PinoutTable pinouts={currentSchematic.pinouts} />
                {currentSchematic.technical_notes && (
                  <div className="mt-8 bg-[#1a1100] border border-accent p-5 rounded-2xl flex items-start space-x-4">
                    <i className="bi bi-info-circle-fill text-accent text-xl mt-0.5"></i>
                    <div><h4 className="text-accent text-[10px] font-black uppercase tracking-widest mb-1.5">Catatan Teknis</h4><p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{currentSchematic.technical_notes}</p></div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-black text-white uppercase mb-4 tracking-widest">Database Skema</h1>
                <div className="relative mb-4"><i className="bi bi-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i><input type="text" placeholder="Cari skema..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-card border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent transition" /></div>
                <div className="flex overflow-x-auto hide-scrollbar space-x-2 mb-6 pb-2">
                  {BRANDS.map(brand => (<button key={brand} onClick={() => setSelectedBrand(brand)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition border ${selectedBrand === brand ? 'bg-accent text-black border-accent' : 'bg-dark text-gray-500 border-border hover:border-gray-500'}`}>{brand}</button>))}
                </div>
                {filteredSchematics.length > 0 ? (
                  <div className="space-y-2">{filteredSchematics.map(s => (<MotorcycleCard key={s.id} data={s} onClick={openSchematicDetail} />))}</div>
                ) : <div className="text-center py-10 text-gray-500 uppercase tracking-widest text-xs">Skema tidak ditemukan</div>}
              </div>
            )}
          </div>
        )}

        {/* --- TAB DIAGNOSIS --- */}
        {activeTab === 'troubleshoot' && (
          <div className="animate-fade-in">
             {selectedTroubleId && currentTrouble ? (
              <div className="relative pt-12">
                <div className="absolute top-0 right-0 flex space-x-2 z-10">
                  <button onClick={() => handleShare(currentTrouble.case_title, 'Panduan Diagnosis', `diagnosis-${currentTrouble.id}`)} className="w-8 h-8 rounded-full bg-dark border border-border flex items-center justify-center text-gray-400 hover:text-white transition"><i className="bi bi-share-fill"></i></button>
                  <button onClick={() => toggleBookmark(currentTrouble.id)} className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${bookmarks.includes(currentTrouble.id) ? 'bg-accent/20 border-accent text-accent' : 'bg-dark border-border text-gray-400 hover:text-white'}`}><i className={bookmarks.includes(currentTrouble.id) ? "bi bi-star-fill" : "bi bi-star"}></i></button>
                </div>
                <button onClick={closeDetailView} className="mb-6 text-gray-400 font-bold uppercase text-xs tracking-widest block"><i className="bi bi-arrow-left mr-2"></i> Kembali</button>
                <DiagnosisWizard data={currentTrouble} onBack={closeDetailView} onViewSchematic={(id) => {setActiveTab('schematics'); setSelectedTroubleId(null); setSelectedSchematicId(id);}} />
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-black text-white uppercase mb-4 tracking-widest">Pusat Diagnosis</h1>
                <div className="relative mb-6"><i className="bi bi-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i><input type="text" placeholder="Cari kasus..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-card border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent transition" /></div>
                {filteredTroubles.length > 0 ? (
                  <div className="space-y-4">{filteredTroubles.map(t => (<TroubleshootingCard key={t.id} data={t} onClick={openTroubleDetail} />))}</div>
                ) : <div className="text-center py-10 text-gray-500 uppercase tracking-widest text-xs">Kasus tidak ditemukan</div>}
              </div>
            )}
          </div>
        )}

        {/* --- TAB JURNAL --- */}
        {activeTab === 'blog' && (
          <div className="animate-fade-in">
            {selectedJurnalId && currentJurnal ? (
              <div className="pb-10">
                <div className="flex justify-between items-center mb-6">
                  <button onClick={closeDetailView} className="text-gray-400 font-bold uppercase text-xs tracking-widest"><i className="bi bi-arrow-left mr-2"></i> Kembali</button>
                  <div className="flex space-x-3">
                    <button onClick={() => handleShare(currentJurnal.title, currentJurnal.content.substring(0, 50), `jurnal-${currentJurnal.id}`)} className="w-8 h-8 rounded-full bg-dark border border-border flex items-center justify-center text-gray-400 hover:text-white transition"><i className="bi bi-share-fill"></i></button>
                    <button onClick={() => toggleBookmark(currentJurnal.id)} className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${bookmarks.includes(currentJurnal.id) ? 'bg-accent/20 border-accent text-accent' : 'bg-dark border-border text-gray-400 hover:text-white'}`}><i className={bookmarks.includes(currentJurnal.id) ? "bi bi-star-fill" : "bi bi-star"}></i></button>
                  </div>
                </div>

                <div className="mb-8">
                  <span className="text-accent text-[10px] font-black uppercase tracking-widest mb-2 block">{new Date(currentJurnal.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <h1 className="text-3xl font-black text-white leading-tight">{currentJurnal.title}</h1>
                </div>

                {currentJurnal.image_urls && currentJurnal.image_urls.length > 0 && (
                  <div className="space-y-4 mb-8">
                    {currentJurnal.image_urls.map((url, idx) => (
                      <div key={idx} className="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                        <img src={url} className="w-full object-cover" alt={`Dokumentasi ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                  <p className="text-gray-300 text-sm md:text-base leading-loose whitespace-pre-wrap">{currentJurnal.content}</p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-black text-white uppercase mb-4 tracking-widest border-b border-border pb-4">Jurnal Modifikasi</h1>
                <div className="relative mb-6">
                  <i className="bi bi-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
                  <input type="text" placeholder="Cari artikel..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-card border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent transition" />
                </div>
                {filteredModifications.length > 0 ? (
                  <div className="space-y-6">
                    {filteredModifications.map(post => (
                      <div key={post.id} onClick={() => openJurnalDetail(post.id)} className="bg-card border border-border rounded-2xl overflow-hidden mb-6 group cursor-pointer hover:border-accent transition">
                        {post.image_urls && post.image_urls.length > 0 && (
                          <div className="w-full h-48 bg-black relative">
                            <img src={post.image_urls[0]} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500" alt="Cover" />
                            {post.image_urls.length > 1 && <span className="absolute top-3 right-3 bg-black/80 text-white text-[10px] px-2 py-1 rounded-full font-bold">+{post.image_urls.length - 1} Foto</span>}
                          </div>
                        )}
                        <div className="p-5">
                          <span className="text-accent text-[10px] font-black uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString('id-ID')}</span>
                          <h2 className="text-white font-bold text-lg mt-2 mb-2 line-clamp-2">{post.title}</h2>
                          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{post.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-center py-20 bg-card border border-border rounded-2xl border-dashed"><i className="bi bi-journal-x text-4xl text-gray-600 mb-3 block"></i><p className="text-gray-500 uppercase font-bold tracking-widest text-xs">{searchQuery ? 'Artikel tidak ditemukan' : 'Belum ada jurnal'}</p></div>}
              </div>
            )}
          </div>
        )}

      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-border z-50 h-[72px] flex justify-between items-center px-1 md:px-4">
        {[
          { id: 'home', icon: 'bi-house-door', label: 'Beranda' },
          { id: 'schematics', icon: 'bi-diagram-3', label: 'Skema' },
          { id: 'troubleshoot', icon: 'bi-exclamation-triangle', label: 'Diagnosis' },
          { id: 'blog', icon: 'bi-journal-richtext', label: 'Jurnal' },
          { id: 'dashboard', icon: 'bi-shield-lock', label: 'Sistem' } 
        ].map(nav => (
          <button key={nav.id} onClick={() => handleTabChange(nav.id)} className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-all duration-300 ${activeTab === nav.id ? 'text-accent scale-110' : 'text-gray-600 hover:text-gray-400'}`}>
            <i className={`bi ${nav.icon} text-xl md:text-2xl`}></i>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{nav.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
