// src/admin/components/ExportSuccessModal.tsx
import React from 'react';
import { Check, Download } from 'lucide-react';
import type { ExportFormat } from '../types';

interface ExportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  format: ExportFormat;
  downloadUrl: string;
}

export function ExportSuccessModal({ isOpen, onClose, format, downloadUrl }: ExportSuccessModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Export Ready</h3>
        <p className="text-sm text-gray-500 mb-5">Your {format.toUpperCase()} file is ready to download.</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <a
            href={downloadUrl}
            download
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            <Download className="w-4 h-4" /> Download
          </a>
        </div>
      </div>
    </div>
  );
}
