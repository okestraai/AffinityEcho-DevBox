// src/admin/hooks/useExport.ts
import { useState } from 'react';
import type { ExportFormat } from '../types';
import { showToast } from '../../Helper/ShowToast';

type ExportFn = (format: ExportFormat) => Promise<{ data: BlobPart }>;

/**
 * Handles the full export flow:
 * - calls the export API function
 * - creates an object URL from the blob
 * - exposes state for ExportSuccessModal
 * - cleans up the URL on close
 */
export function useExport(exportFn: ExportFn) {
  const [exporting, setExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [exportedFormat, setExportedFormat] = useState<ExportFormat>('csv');

  async function doExport(format: ExportFormat) {
    setExporting(true);
    try {
      const res = await exportFn(format);
      const mime = format === 'csv' ? 'text/csv' : 'application/pdf';
      const blob = new Blob([res.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      setExportedFormat(format);
      setDownloadUrl(url);
      setShowSuccess(true);
      showToast(`${format.toUpperCase()} export ready`, 'success');
    } catch {
      showToast('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  }

  function closeSuccess() {
    window.URL.revokeObjectURL(downloadUrl);
    setShowSuccess(false);
  }

  return { exporting, showSuccess, downloadUrl, exportedFormat, doExport, closeSuccess };
}
