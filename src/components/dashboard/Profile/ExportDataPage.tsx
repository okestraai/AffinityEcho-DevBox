import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Database, FileText, MessageCircle, Users, Calendar, CheckCircle, Shield, Info } from 'lucide-react';
import { ExportUserData } from '../../../../api/profileApis';
import { showToast } from '../../../Helper/ShowToast';

export function ExportDataPage() {
  const navigate = useNavigate();
  const [selectedData, setSelectedData] = useState<string[]>(['all']);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const dataCategories = [
    {
      id: 'all',
      name: 'All Data',
      description: 'Export everything (recommended)',
      icon: Database,
      size: '~2.5 MB'
    },
    {
      id: 'profile',
      name: 'Profile Information',
      description: 'Your personal details, bio, and demographics',
      icon: Users,
      size: '~50 KB'
    },
    {
      id: 'posts',
      name: 'Posts & Topics',
      description: 'All your forum posts and topics',
      icon: FileText,
      size: '~800 KB'
    },
    {
      id: 'comments',
      name: 'Comments',
      description: 'All your comments and replies',
      icon: MessageCircle,
      size: '~600 KB'
    },
    {
      id: 'connections',
      name: 'Connections',
      description: 'Your network and mentorship relationships',
      icon: Users,
      size: '~100 KB'
    },
    {
      id: 'activity',
      name: 'Activity History',
      description: 'Likes, reactions, and engagement data',
      icon: Calendar,
      size: '~400 KB'
    }
  ];

  const handleCategoryToggle = (categoryId: string) => {
    if (categoryId === 'all') {
      setSelectedData(['all']);
    } else {
      const newSelected = selectedData.filter(id => id !== 'all');
      if (selectedData.includes(categoryId)) {
        setSelectedData(newSelected.filter(id => id !== categoryId));
      } else {
        setSelectedData([...newSelected, categoryId]);
      }
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const category = selectedData.includes('all') ? 'all' : selectedData[0] || 'all';
      const response = await ExportUserData(category as "all" | "profile" | "posts" | "comments" | "connections" | "activity");
      const exportData = response.data || response;

      if (exportFormat === 'pdf') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const html = buildPdfTemplate(exportData);
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.onload = () => printWindow.print();
        }
      } else {
        const dataStr = exportFormat === 'json'
          ? JSON.stringify(exportData, null, 2)
          : convertToCSV(exportData);
        const mimeType = exportFormat === 'json' ? 'application/json' : 'text/csv';
        const blob = new Blob([dataStr], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-data-export-${Date.now()}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setExportComplete(true);
    } catch {
      showToast('Failed to export data. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: unknown): string => {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const headers = Object.keys(data[0] as Record<string, unknown>);
      const rows = data.map(item => headers.map(h => JSON.stringify((item as Record<string, unknown>)[h] ?? '')).join(','));
      return [headers.join(','), ...rows].join('\n');
    }
    // For non-array data, flatten to key-value pairs
    const entries = Object.entries(data as Record<string, unknown>);
    return ['key,value', ...entries.map(([k, v]) => `${k},${JSON.stringify(v ?? '')}`)].join('\n');
  };

  const esc = (val: unknown): string => {
    const str = typeof val === 'string' ? val : JSON.stringify(val ?? '');
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const isIdField = (key: string): boolean => {
    const lower = key.toLowerCase();
    return lower === 'id' || lower.endsWith('_id') || lower === 'userid' || lower === 'postid' || lower === 'commentid' || lower === 'topicid';
  };

  const renderValue = (val: unknown): string => {
    if (val === null || val === undefined) return '<span class="empty">N/A</span>';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'string' && !val.trim()) return '<span class="empty">N/A</span>';
    if (Array.isArray(val)) {
      if (val.length === 0) return '<span class="empty">None</span>';
      if (typeof val[0] === 'string' || typeof val[0] === 'number') {
        return val.map(v => `<span class="tag">${esc(v)}</span>`).join(' ');
      }
      return renderList(val);
    }
    if (typeof val === 'object') return renderFields(val as Record<string, unknown>);
    return esc(val);
  };

  const renderFields = (obj: Record<string, unknown>): string => {
    return Object.entries(obj)
      .filter(([k, v]) => v !== null && v !== undefined && !isIdField(k))
      .map(([k, v]) => {
        if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
          return `<div class="field-group">
            <div class="field-group-label">${esc(formatLabel(k))}</div>
            <div class="field-group-body">${renderFields(v as Record<string, unknown>)}</div>
          </div>`;
        }
        return `<div class="field-row">
          <span class="field-label">${esc(formatLabel(k))}: </span>
          <span class="field-value">${renderValue(v)}</span>
        </div>`;
      })
      .join('');
  };

  const renderList = (items: unknown[]): string => {
    if (items.length === 0) return '<p class="empty">No data</p>';
    const firstItem = items[0];
    if (typeof firstItem !== 'object' || firstItem === null) {
      return items.map(i => `<span class="tag">${esc(i)}</span>`).join(' ');
    }
    return items.map((item, idx) => {
      const obj = item as Record<string, unknown>;
      const entries = Object.entries(obj).filter(([k, v]) => v !== null && v !== undefined && !isIdField(k));
      return `<div class="card">
        <div class="card-number">${idx + 1}.</div>
        <div class="card-body">
          ${entries.map(([k, v]) => {
            if (Array.isArray(v)) {
              const rendered = typeof v[0] === 'string' || typeof v[0] === 'number'
                ? v.map(i => `<span class="tag">${esc(i)}</span>`).join(' ')
                : renderList(v);
              return `<div class="field-row">
                <span class="field-label">${esc(formatLabel(k))}: </span>
                <span class="field-value">${rendered}</span>
              </div>`;
            }
            if (typeof v === 'object' && v !== null) {
              return `<div class="field-group">
                <div class="field-group-label">${esc(formatLabel(k))}</div>
                <div class="field-group-body">${renderFields(v as Record<string, unknown>)}</div>
              </div>`;
            }
            return `<div class="field-row">
              <span class="field-label">${esc(formatLabel(k))}: </span>
              <span class="field-value">${renderValue(v)}</span>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('');
  };

  const buildPdfTemplate = (data: unknown): string => {
    const exportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const selectedNames = selectedData.map(id => dataCategories.find(c => c.id === id)?.name).filter(Boolean).join(', ');

    // Build the body sections from the export data
    let sectionsHtml = '';
    const record = (typeof data === 'object' && data !== null && !Array.isArray(data)) ? data as Record<string, unknown> : null;

    if (record) {
      // Render each top-level key as its own section, skipping ID fields
      for (const [key, value] of Object.entries(record)) {
        if (value === null || value === undefined || isIdField(key)) continue;
        sectionsHtml += `
          <div class="section">
            <h2>${esc(formatLabel(key))}</h2>
            <div class="section-body">${renderValue(value)}</div>
          </div>`;
      }
    } else {
      // Fallback: render the whole thing
      sectionsHtml = `<div class="section"><div class="section-body">${renderValue(data)}</div></div>`;
    }

    return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Affinity Echo - Data Export</title>
<style>
  @page { margin: 20mm; }
  * { box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    color: #1f2937; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 0;
  }
  .header {
    border-bottom: 3px solid #7c3aed; padding-bottom: 16px; margin-bottom: 24px;
  }
  .header h1 {
    font-size: 28px; color: #6b21a8; margin: 0 0 4px 0;
  }
  .header .subtitle { color: #6b7280; font-size: 14px; margin: 0; }
  .meta-bar {
    display: flex; gap: 24px; background: #f9fafb; border: 1px solid #e5e7eb;
    border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px;
  }
  .meta-bar .meta-item { color: #6b7280; }
  .meta-bar .meta-item strong { color: #374151; }
  .section { margin-bottom: 28px; page-break-inside: avoid; }
  .section h2 {
    font-size: 16px; color: #7c3aed; margin: 0 0 12px 0;
    padding-bottom: 6px; border-bottom: 1px solid #e5e7eb;
  }
  .section-body { font-size: 14px; }
  .field-row { margin-bottom: 6px; line-height: 1.6; }
  .field-label { font-weight: 600; color: #374151; }
  .field-value { color: #4b5563; }
  .field-group { margin: 10px 0; }
  .field-group-label {
    font-weight: 700; color: #374151; font-size: 13px;
    margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px;
  }
  .field-group-body { padding-left: 16px; border-left: 2px solid #e5e7eb; }
  .card {
    display: flex; gap: 10px; padding: 14px 16px; margin-bottom: 10px;
    background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;
    page-break-inside: avoid;
  }
  .card-number {
    font-weight: 700; color: #7c3aed; font-size: 14px; min-width: 24px;
  }
  .card-body { flex: 1; }
  .tag {
    display: inline-block; background: #ede9fe; color: #6b21a8;
    padding: 2px 8px; border-radius: 12px; font-size: 12px; margin: 2px;
  }
  .empty { color: #9ca3af; font-style: italic; }
  .footer {
    margin-top: 40px; padding-top: 16px; border-top: 2px solid #e5e7eb;
    font-size: 11px; color: #9ca3af; text-align: center;
  }
  .footer .lock { font-size: 14px; }
</style>
</head><body>
  <div class="header">
    <h1>Affinity Echo</h1>
    <p class="subtitle">Personal Data Export</p>
  </div>
  <div class="meta-bar">
    <div class="meta-item"><strong>Date:</strong> ${exportDate}</div>
    <div class="meta-item"><strong>Categories:</strong> ${esc(selectedNames)}</div>
    <div class="meta-item"><strong>Format:</strong> PDF</div>
  </div>
  ${sectionsHtml}
  <div class="footer">
    <span class="lock">&#128274;</span><br>
    This document contains personal data exported from Affinity Echo.<br>
    Store securely and do not share publicly. Generated on ${exportDate}.
  </div>
</body></html>`;
  };

  if (exportComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Export Complete!
            </h2>

            <p className="text-gray-600 mb-6">
              Your data has been downloaded to your device.
            </p>

            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">What's included:</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                {selectedData.map(id => {
                  const category = dataCategories.find(c => c.id === id);
                  return category ? (
                    <li key={id} className="flex gap-2">
                      <span>•</span>
                      <span>{category.name}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/dashboard/profile')}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Return to Profile
              </button>

              <button
                onClick={() => setExportComplete(false)}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Export More Data
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Profile
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Export My Data</h1>
            </div>
            <p className="text-blue-100">
              Download a copy of your personal information and activity
            </p>
          </div>

          <div className="p-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Your Data Rights</h3>
                  <p className="text-sm text-blue-700">
                    Under GDPR and CCPA, you have the right to access, download, and delete your personal data.
                    This export includes all information we store about you in a machine-readable format.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Data to Export</h2>
              <div className="space-y-3">
                {dataCategories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedData.includes(category.id) ||
                    (selectedData.includes('all') && category.id !== 'all');

                  return (
                    <label
                      key={category.id}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">{category.size}</div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Export Format</h2>
              <div className="grid grid-cols-3 gap-4">
                <label
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    exportFormat === 'json'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={() => setExportFormat('json')}
                    className="sr-only"
                  />
                  <div className="font-semibold text-gray-900 mb-1">JSON</div>
                  <div className="text-sm text-gray-600">
                    Machine-readable, ideal for developers
                  </div>
                </label>

                <label
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    exportFormat === 'csv'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="sr-only"
                  />
                  <div className="font-semibold text-gray-900 mb-1">CSV</div>
                  <div className="text-sm text-gray-600">
                    Spreadsheet format, easy to analyze
                  </div>
                </label>

                <label
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    exportFormat === 'pdf'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={() => setExportFormat('pdf')}
                    className="sr-only"
                  />
                  <div className="font-semibold text-gray-900 mb-1">PDF</div>
                  <div className="text-sm text-gray-600">
                    Printable document, easy to save and share
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">Privacy Notice</h3>
                  <p className="text-sm text-yellow-700">
                    Your export file contains sensitive personal information. Store it securely and do not share it publicly.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={selectedData.length === 0 || isExporting}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Preparing Export...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download My Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
