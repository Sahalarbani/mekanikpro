/**
 * Version: 1.0.0
 * Changelog: Pembuatan komponen tabel khusus pemetaan pinout dengan visibilitas tinggi dan dukungan active viewport scroll (overflow-x).
 */
import React from 'react';
import { PinoutDetail } from '../types';

interface Props {
  pinouts: PinoutDetail[];
}

const PinoutTable: React.FC<Props> = ({ pinouts }) => {
  if (!pinouts || pinouts.length === 0) {
    return (
      <div className="bg-card border border-border p-4 rounded-xl text-center text-gray-500 text-sm">
        Data pin-out belum tersedia.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm text-gray-300 min-w-[500px]">
        <thead className="text-xs text-white uppercase bg-dark border-b border-border">
          <tr>
            <th scope="col" className="px-4 py-4 font-bold tracking-wider">Pin</th>
            <th scope="col" className="px-4 py-4 font-bold tracking-wider">Warna Kabel</th>
            <th scope="col" className="px-4 py-4 font-bold tracking-wider">Fungsi Utama</th>
            <th scope="col" className="px-4 py-4 font-bold tracking-wider">Standard (V)</th>
          </tr>
        </thead>
        <tbody>
          {pinouts.map((pin) => (
            <tr key={pin.pin_number} className="border-b border-border hover:bg-[#1a1a1a] transition">
              <td className="px-4 py-3 font-black text-accent text-base">{pin.pin_number}</td>
              <td className="px-4 py-3 font-bold text-white uppercase">{pin.cable_color}</td>
              <td className="px-4 py-3 text-gray-300 leading-relaxed">{pin.function_desc}</td>
              <td className="px-4 py-3 font-mono text-xs bg-dark text-gray-400 font-medium">
                {pin.standard_voltage}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PinoutTable;
