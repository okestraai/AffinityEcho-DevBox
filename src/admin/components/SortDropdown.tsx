// src/admin/components/SortDropdown.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpDown, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { SortOrder, SortOption } from '../types';

interface SortDropdownProps {
  sortField: string;
  sortOrder: SortOrder;
  onSort: (field: string, order: SortOrder) => void;
  options: SortOption[];
}

export function SortDropdown({ sortField, sortOrder, onSort, options }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentLabel = options.find(o => o.field === sortField)?.label;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title="Sort options"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all"
      >
        <ArrowUpDown className="w-4 h-4 text-gray-500" />
        <span className="hidden lg:inline">Sort: {currentLabel} ({sortOrder === 'asc' ? 'Asc' : 'Desc'})</span>
        <span className="lg:hidden">Sort</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sort By</div>
          {options.map(opt => (
            <button
              type="button"
              key={opt.field}
              onClick={() => {
                onSort(opt.field, sortField === opt.field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc');
                setOpen(false);
              }}
              className={`flex items-center justify-between w-full px-3 py-2.5 text-sm hover:bg-purple-50 transition-colors ${
                sortField === opt.field ? 'text-purple-700 bg-purple-50/50' : 'text-gray-700'
              }`}
            >
              <span className="font-medium">{opt.label}</span>
              {sortField === opt.field && (
                sortOrder === 'asc'
                  ? <ArrowUp className="w-4 h-4 text-purple-600" />
                  : <ArrowDown className="w-4 h-4 text-purple-600" />
              )}
            </button>
          ))}
          <div className="border-t border-gray-100 my-2" />
          <div className="px-2 pb-1 flex gap-1">
            <button
              type="button"
              onClick={() => { onSort(sortField, 'asc'); setOpen(false); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-sm rounded-lg transition-all ${
                sortOrder === 'asc' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" /> Asc
            </button>
            <button
              type="button"
              onClick={() => { onSort(sortField, 'desc'); setOpen(false); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-sm rounded-lg transition-all ${
                sortOrder === 'desc' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" /> Desc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
