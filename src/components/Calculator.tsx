/**
 * Version: 3.0.0 (Ultimate Electrical Tool + Wiring Estimator)
 * Changelog: 
 * - Mempertahankan seluruh fitur Kalkulator Beban (Ampere, AWG, mm², Fuse, Relay, Ohm).
 * - UPGRADE: Penambahan "Estimasi Belanja Full Wiring" berdasarkan Golden Rule mekanik.
 * - Fitur dinamis: Estimasi menyesuaikan jenis rangka motor (Matic/Sport/Custom).
 * - UI Upgrade: Layout dibagi menjadi 2 section utama (Beban Aksesoris & Belanja Kabel Bodi).
 */
import React, { useState } from 'react';

interface Props { onBack: () => void; }

const Calculator: React.FC<Props> = ({ onBack }) => {
  // --- STATE KALKULATOR BEBAN ---
  const [volt, setVolt] = useState<number>(12);
  const [watt, setWatt] = useState<number | ''>('');
  const [qty, setQty] = useState<number>(1);

  // --- STATE ESTIMATOR WIRING ---
  const [bikeType, setBikeType] = useState<'matic' | 'sport' | 'custom'>('matic');

  // --- LOGIKA KALKULATOR BEBAN ---
  const totalWatt = typeof watt === 'number' ? (watt * qty) : 0;
  const ampere = totalWatt > 0 ? (totalWatt / volt) : 0;
  const ohm = ampere > 0 ? (volt / ampere) : 0;

  let awg = "-"; let mm2 = "-"; let fuse = "-";
  let relayReq = "-"; let relaySpec = "-"; let relayColor = "text-gray-500";

  if (ampere > 0) {
    if (ampere <= 5) { awg = "18 AWG"; mm2 = "0.75 mm²"; fuse = "5A - 7.5A"; } 
    else if (ampere <= 10) { awg = "16 AWG"; mm2 = "1.25 mm²"; fuse = "10A - 15A"; } 
    else if (ampere <= 15) { awg = "14 AWG"; mm2 = "2.0 mm²"; fuse = "15A - 20A"; } 
    else if (ampere <= 20) { awg = "12 AWG"; mm2 = "3.5 mm²"; fuse = "20A - 25A"; } 
    else if (ampere <= 30) { awg = "10 AWG"; mm2 = "5.0 mm²"; fuse = "30A - 40A"; } 
    else { awg = "8 AWG (Min)"; mm2 = "8.0 mm²"; fuse = "> 40A"; }

    if (ampere >= 5) {
      relayReq = "WAJIB RELAY!"; relayColor = "text-red-500";
      if (ampere <= 30) relaySpec = "1 Pcs (Relay 30A / 40A)";
      else if (ampere <= 60) relaySpec = "2 Pcs (Pisah Jalur Beban)";
      else relaySpec = "Sistem Multi-Relay (Custom)";
    } else {
      relayReq = "Opsional (Aman)"; relayColor = "text-green-500"; relaySpec = "Bisa Langsung Saklar";
    }
  }

  // --- LOGIKA ESTIMATOR WIRING (Berdasarkan Golden Rule User) ---
  // Standar Matic/Bebek: 0.85mm (4x20m), 1.5mm (2x5m)
  let estSmallCable = { size: "0.85 mm² (Kabel Bintik)", qty: "4 Biji (Beda Warna)", length: "20 Meter / Roll", total: "80 Meter", desc: "Jalur lampu, sein, sensor, spido, saklar." };
  let estLargeCable = { size: "1.5 mm² - 2.0 mm²", qty: "2 Biji (Merah & Hitam)", length: "5 Meter / Roll", total: "10 Meter", desc: "Jalur utama Aki, Kunci Kontak, Kiprok, Ground." };
  let estSleeve = "5 Meter (Campur ukuran 4mm, 6mm, 10mm)";

  if (bikeType === 'sport') {
    // Motor Sport (Sasis lebih panjang)
    estSmallCable.qty = "5 Biji (Beda Warna)"; estSmallCable.total = "100 Meter";
    estSleeve = "7 Meter (Campur ukuran 4mm, 6mm, 10mm)";
  } else if (bikeType === 'custom') {
    // Custom Chopper/Bobber (Minimalis, tanpa spido/sein rumit)
    estSmallCable.qty = "3 Biji (Beda Warna)"; estSmallCable.total = "60 Meter";
    estSleeve = "4 Meter (Fokus selongsong bakar bakar)";
  }

  return (
    <div className="animate-fade-in pb-10">
      <button onClick={onBack} className="mb-6 text-gray-400 font-bold uppercase text-xs tracking-widest hover:text-white transition">
        <i className="bi bi-arrow-left mr-2"></i> Kembali ke Beranda
      </button>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center">
          <i className="bi bi-calculator text-accent mr-3"></i> Tools Kelistrikan
        </h2>
        <i className="bi bi-lightning-charge text-accent text-3xl opacity-20"></i>
      </div>

      <div className="space-y-6">
        
        {/* SECTION 1: KALKULATOR BEBAN AKSESORIS */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          <h3 className="text-accent font-black uppercase tracking-widest mb-2 flex items-center border-b border-border pb-4">
            <i className="bi bi-plug-fill mr-2"></i> 1. Kalkulator Beban & Relay
          </h3>
          <p className="text-gray-400 text-xs leading-relaxed mb-6 mt-4">
            Hitung spesifikasi aman sebelum pasang aksesoris (Lampu Biled, Klakson, dll).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Voltase Aki (V)</label>
              <div className="relative">
                <input type="number" value={volt} onChange={e => setVolt(Number(e.target.value))} className="w-full bg-dark border border-border p-4 rounded-xl text-white font-black text-lg outline-none focus:border-accent pl-12 transition" />
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">V</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-accent uppercase tracking-widest mb-2">Daya Per Item (Watt)</label>
              <div className="relative">
                <input type="number" placeholder="Ex: 55" value={watt} onChange={e => setWatt(e.target.value ? Number(e.target.value) : '')} className="w-full bg-[#1a1100] border border-accent p-4 rounded-xl text-white font-black text-lg outline-none focus:ring-2 focus:ring-accent pl-12 transition" />
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-accent font-bold">W</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Jumlah Pasang (Pcs)</label>
              <div className="relative">
                <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full bg-dark border border-border p-4 rounded-xl text-white font-black text-lg outline-none focus:border-accent pl-12 transition" />
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">X</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Dashboard Spesifikasi</h3>
              <span className="text-accent font-black text-[10px] md:text-xs bg-dark px-3 py-1 rounded border border-border tracking-widest">TOTAL: {totalWatt} W</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark border border-border rounded-xl p-4 text-center group hover:border-accent transition flex flex-col justify-center">
                <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Beban Arus</span>
                <span className="text-2xl font-black text-white">{ampere > 0 ? ampere.toFixed(2) : '0'} <span className="text-sm text-gray-500">A</span></span>
              </div>
              <div className="bg-[#001a05] border border-green-500 rounded-xl p-4 text-center shadow-[0_0_15px_rgba(34,197,94,0.1)] relative overflow-hidden flex flex-col justify-center">
                <span className="block text-[10px] text-green-500 font-bold uppercase tracking-widest mb-1 relative z-10">Kabel Min</span>
                <span className="text-xl font-black text-green-500 relative z-10 leading-none">{awg}</span>
                <span className="text-[10px] font-bold text-green-500/70 mt-1 uppercase tracking-widest relative z-10">{mm2}</span>
              </div>
              <div className="bg-[#1a0000] border border-red-500 rounded-xl p-4 text-center shadow-[0_0_15px_rgba(239,68,68,0.1)] flex flex-col justify-center">
                <span className="block text-[10px] text-red-500 font-bold uppercase tracking-widest mb-1">Sekring</span>
                <span className="text-xl md:text-2xl font-black text-red-500">{fuse}</span>
              </div>
              <div className="bg-dark border border-border rounded-xl p-4 text-center group hover:border-accent transition flex flex-col justify-center">
                <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Status Relay</span>
                <span className={`text-sm md:text-lg font-black leading-tight ${relayColor}`}>{relayReq}</span>
                <span className="text-[8px] md:text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{relaySpec}</span>
              </div>
              <div className="col-span-2 md:col-span-4 bg-black border border-border rounded-xl p-4 flex justify-between items-center px-6">
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Hukum Ohm</span>
                  <span className="text-gray-400 text-[9px] md:text-xs">Prediksi nilai hambatan komponen</span>
                </div>
                <span className="text-xl md:text-2xl font-black text-white">{ohm > 0 ? ohm.toFixed(2) : '0'} <span className="text-sm text-gray-500">Ω</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ESTIMATOR BELANJA KABEL BODI (FITUR BARU) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          <h3 className="text-accent font-black uppercase tracking-widest mb-2 flex items-center border-b border-border pb-4">
            <i className="bi bi-cart-check-fill mr-2"></i> 2. Estimasi Belanja Wiring Harness
          </h3>
          <p className="text-gray-400 text-xs leading-relaxed mb-6 mt-4">
            Patokan belanja kabel untuk merakit kabel bodi (wiring harness) full dari nol berdasarkan rasio standar bengkel.
          </p>

          {/* PILIH JENIS MOTOR */}
          <div className="flex bg-black p-1 rounded-xl border border-border mb-6">
            <button onClick={() => setBikeType('matic')} className={`flex-1 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest transition ${bikeType === 'matic' ? 'bg-border text-white' : 'text-gray-600 hover:text-gray-300'}`}>Matic / Bebek</button>
            <button onClick={() => setBikeType('sport')} className={`flex-1 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest transition ${bikeType === 'sport' ? 'bg-border text-white' : 'text-gray-600 hover:text-gray-300'}`}>Motor Sport</button>
            <button onClick={() => setBikeType('custom')} className={`flex-1 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest transition ${bikeType === 'custom' ? 'bg-border text-white' : 'text-gray-600 hover:text-gray-300'}`}>Custom Minimalis</button>
          </div>

          <div className="space-y-4">
            {/* KABEL INSTRUMEN */}
            <div className="bg-dark border border-border p-4 rounded-xl flex items-start">
              <div className="bg-[#1a1100] p-3 rounded-lg border border-accent mr-4">
                <i className="bi bi-share text-accent text-xl"></i>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-white font-bold text-sm uppercase tracking-widest">{estSmallCable.size}</h4>
                  <span className="text-accent text-[10px] font-black tracking-widest uppercase bg-accent/10 px-2 py-1 rounded">Total {estSmallCable.total}</span>
                </div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Beli: {estSmallCable.qty} (@ {estSmallCable.length})</p>
                <p className="text-gray-400 text-xs leading-relaxed">{estSmallCable.desc}</p>
              </div>
            </div>

            {/* KABEL UTAMA */}
            <div className="bg-dark border border-border p-4 rounded-xl flex items-start">
              <div className="bg-[#1a0000] p-3 rounded-lg border border-red-500 mr-4">
                <i className="bi bi-lightning text-red-500 text-xl"></i>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-white font-bold text-sm uppercase tracking-widest">{estLargeCable.size}</h4>
                  <span className="text-red-500 text-[10px] font-black tracking-widest uppercase bg-red-500/10 px-2 py-1 rounded">Total {estLargeCable.total}</span>
                </div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Beli: {estLargeCable.qty} (@ {estLargeCable.length})</p>
                <p className="text-gray-400 text-xs leading-relaxed">{estLargeCable.desc}</p>
              </div>
            </div>

            {/* SELONGSONG BAKAR */}
            <div className="bg-dark border border-border p-4 rounded-xl flex items-start">
              <div className="bg-[#001a05] p-3 rounded-lg border border-green-500 mr-4">
                <i className="bi bi-shield-shaded text-green-500 text-xl"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-1">Selongsong & Skun</h4>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Beli: {estSleeve}</p>
                <p className="text-gray-400 text-xs leading-relaxed">Siapkan juga Skun Kuningan (Cowo/Cewe) 1 Box isi 50pcs dan Soket Pin (2, 3, 4, 6 Pin) sesuai kebutuhan komponen.</p>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default Calculator;
