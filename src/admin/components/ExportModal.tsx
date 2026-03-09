// src/admin/components/ExportModal.tsx
import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, Download, Filter } from 'lucide-react';
import type { ExportFormat } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  hasFilters?: boolean;
  title?: string;
}

export function ExportModal({ isOpen, onClose, onExport, hasFilters, title = 'Export' }: ExportModalProps) {
  const [fmt, setFmt] = useState<ExportFormat>('csv');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button type="button" title="Close" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {hasFilters && (
          <p className="text-xs text-purple-600 font-medium mb-4 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Exporting with active filters
          </p>
        )}
        <div className="flex gap-3 mb-6">
          {(['csv', 'pdf'] as ExportFormat[]).map(f => (
            <button
              type="button"
              key={f}
              onClick={() => setFmt(f)}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                fmt === f ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
              }`}
            >
              {f === 'csv'
                ? <FileSpreadsheet className={`w-7 h-7 ${fmt === f ? 'text-purple-600' : 'text-gray-400'}`} />
                : <FileText className={`w-7 h-7 ${fmt === f ? 'text-purple-600' : 'text-gray-400'}`} />
              }
              <span className={`text-sm font-medium ${fmt === f ? 'text-purple-700' : 'text-gray-600'}`}>
                {f.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onExport(fmt); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>
    </div>
  );
}
