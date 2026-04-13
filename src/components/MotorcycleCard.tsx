/**
 * Version: 1.0.0
 * Changelog: Pembuatan komponen Card modular untuk menampilkan daftar skema kendaraan. UI solid dark mode teroptimasi.
 */
import React from 'react';
import { Schematic } from '../types';

interface Props {
  data: Schematic;
  onClick: (id: string) => void;
}

const MotorcycleCard: React.FC<Props> = ({ data, onClick }) => {
  return (
    <button
      onClick={() => onClick(data.id)}
      className="w-full bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-accent transition text-left mb-3"
    >
      <div>
        <h3 className="text-white font-bold text-lg tracking-wide uppercase">{data.motorcycle_name}</h3>
        <p className="text-gray-400 text-sm mt-1">
          Komponen: <span className="text-accent font-medium">{data.component_name}</span>
        </p>
      </div>
      <div className="bg-dark p-2 rounded-lg border border-border flex items-center justify-center">
        <i className="bi bi-chevron-right text-gray-500"></i>
      </div>
    </button>
  );
};

export default MotorcycleCard;
