/**
 * Version: 2.0.2 (Ultimate Diagnosis Wizard)
 * Changelog: 
 * - RESTORED: Fitur tombol "Buka Skema Pin-Out Terkait" (related_schematic_id) yang sempat terhapus.
 * - UPGRADE: Dukungan render gambar/foto bukti kasus (`image_urls`) hasil dari fitur upload baru.
 * - MEMPERTAHANKAN: `whitespace-pre-wrap` agar teks multi-line/enter tidak berantakan.
 * - UI/UX: Layout gahar, progress bar animasi, navigasi rapi.
 */
import React, { useState } from 'react';
import { TroubleshootingCase } from '../types';

interface Props {
  data: TroubleshootingCase;
  onBack: () => void;
  onViewSchematic: (schematicId: string) => void;
}

const DiagnosisWizard: React.FC<Props> = ({ data, onBack, onViewSchematic }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < data.diagnosis_steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      
      {/* TOMBOL KEMBALI */}
      <button onClick={onBack} className="mb-6 text-gray-400 font-bold uppercase text-xs tracking-widest hover:text-white transition flex items-center">
        <i className="bi bi-arrow-left mr-2"></i> Kembali ke Daftar Kasus
      </button>

      {/* HEADER JUDUL KASUS */}
      <div className="bg-[#1a1100] border-l-4 border-accent p-5 rounded-r-xl mb-8 shadow-lg">
        <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-wider leading-tight">
          {data.case_title}
        </h1>
      </div>

      {/* FITUR BARU: RENDER GAMBAR JIKA MEKANIK MENGUPLOAD FOTO BUKTI KASUS */}
      {data.image_urls && data.image_urls.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8 p-2 space-y-2 shadow-xl">
          {data.image_urls.map((url, idx) => (
            <img key={idx} src={url} className="w-full rounded-xl opacity-80 hover:opacity-100 transition duration-500" alt={`Dokumentasi Kasus ${idx + 1}`} />
          ))}
        </div>
      )}

      {/* PROGRESS BAR */}
      <div className="flex space-x-2 mb-6">
        {data.diagnosis_steps.map((_, idx) => (
          <div key={idx} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${idx <= currentStep ? 'bg-accent shadow-[0_0_10px_rgba(217,119,6,0.5)]' : 'bg-border'}`}></div>
        ))}
      </div>

      {/* KARTU LANGKAH DIAGNOSIS */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <span className="bg-[#1a1100] text-accent border border-accent/50 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-inner">
            Langkah {currentStep + 1}
          </span>
          <i className="bi bi-tools text-gray-600 text-xl"></i>
        </div>
        
        {/* INI KUNCI FIX-NYA: penambahan whitespace-pre-wrap agar 'enter' terbaca */}
        <p className="text-white text-base md:text-lg leading-loose mb-8 font-medium whitespace-pre-wrap">
          {data.diagnosis_steps[currentStep]}
        </p>

        {/* NAVIGASI KARTU */}
        <div className="flex space-x-4">
          <button 
            onClick={handlePrev} 
            disabled={currentStep === 0}
            className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border ${currentStep === 0 ? 'bg-dark border-border text-gray-600 cursor-not-allowed opacity-50' : 'bg-dark border-border text-white hover:border-gray-500'}`}
          >
            Kembali
          </button>
          <button 
            onClick={handleNext}
            disabled={currentStep === data.diagnosis_steps.length - 1}
            className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${currentStep === data.diagnosis_steps.length - 1 ? 'bg-gray-800 text-gray-500 border border-border cursor-not-allowed opacity-50' : 'bg-accent text-black hover:bg-opacity-90 hover:scale-[1.02] shadow-[0_0_15px_rgba(217,119,6,0.2)]'}`}
          >
            {currentStep === data.diagnosis_steps.length - 1 ? 'Selesai' : 'Lanjut'}
          </button>
        </div>
      </div>

      {/* RESTORE: TOMBOL LINK SKEMA TERKAIT YANG SEMPAT HILANG */}
      {data.related_schematic_id && (
        <button 
          onClick={() => onViewSchematic(data.related_schematic_id!)}
          className="w-full bg-[#1a1100] border border-accent p-4 rounded-xl flex items-center justify-between mb-6 hover:bg-accent group transition shadow-[0_0_15px_rgba(217,119,6,0.1)]"
        >
          <div className="flex items-center space-x-3 text-sm font-black text-accent group-hover:text-black uppercase tracking-widest transition">
            <i className="bi bi-diagram-3-fill text-lg"></i>
            <span>Buka Skema Pin-Out Terkait</span>
          </div>
          <i className="bi bi-arrow-up-right text-accent group-hover:text-black transition"></i>
        </button>
      )}

      {/* TINDAKAN DARURAT & PENCEGAHAN (MENDUKUNG MULTI-LINE) */}
      <div className="space-y-4">
        {data.initial_action && (
          <div className="bg-[#1a0000] border border-red-900/50 rounded-xl p-5">
            <h4 className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center">
              <i className="bi bi-exclamation-octagon-fill mr-2 text-sm"></i> Tindakan Awal / Darurat
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{data.initial_action}</p>
          </div>
        )}
        
        {data.prevention && (
          <div className="bg-[#001a05] border border-green-900/50 rounded-xl p-5">
            <h4 className="text-green-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center">
              <i className="bi bi-shield-check mr-2 text-sm"></i> Langkah Pencegahan
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{data.prevention}</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default DiagnosisWizard;
