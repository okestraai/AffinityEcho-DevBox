// src/admin/types/index.ts
// Shared types used across all admin pages.

export type ExportFormat = 'csv' | 'pdf';
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: string;
  label: string;
}

export interface ApiMeta {
  total: number;
  total_pages: number;
  page?: number;
  limit?: number;
}
