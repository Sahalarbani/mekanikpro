/**
 * Version: 1.0.0
 * Changelog: Pembuatan komponen card untuk list kasus troubleshooting dengan aksen amber.
 */
import React from 'react';
import { TroubleshootingCase } from '../types';

interface Props {
  data: TroubleshootingCase;
  onClick: (id: string) => void;
}

const TroubleshootingCard: React.FC<Props> = ({ data, onClick }) => {
  return (
    <button
      onClick={() => onClick(data.id)}
      className="w-full bg-card border border-border rounded-xl p-5 flex items-start space-x-4 hover:border-accent transition text-left mb-4"
    >
      <div className="bg-dark p-3 rounded-lg border border-border flex items-center justify-center">
        <i className={`bi ${data.icon_class} text-accent text-2xl`}></i>
      </div>
      <div className="flex-1">
        <h3 className="text-white font-bold text-lg leading-tight uppercase tracking-wide">{data.case_title}</h3>
        <p className="text-gray-500 text-xs mt-2 font-medium uppercase tracking-tighter">
          {data.diagnosis_steps.length} Langkah Diagnosis
        </p>
      </div>
      <i className="bi bi-chevron-right text-gray-700 self-center"></i>
    </button>
  );
};

export default TroubleshootingCard;
