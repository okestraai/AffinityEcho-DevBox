import React, { useState, useEffect, useCallback } from 'react';
import {
  Hash, Users, Lock, Unlock, EyeOff, Eye,
  Plus, Search, ChevronLeft, ChevronRight, Loader2, Globe, Building2,
  Pencil, Trash2, X, Save, Download, ChevronDown,
} from 'lucide-react';
import {
  GetAdminNooks, CreateNook, UpdateNook, DeleteNook, ExportNooks,
} from '../../../api/adminApis';
import { showToast } from '../../Helper/ShowToast';
import { MSG } from '../../constants/messages';
import { ExportModal, ExportSuccessModal, SortDropdown, ConfirmModal, TableRowSkeleton } from '../components';
import { getApiError } from '../utils/apiError';
import { useExport } from '../hooks/useExport';
import type { SortOrder } from '../types';

interface NookCreator { id: string; username: string; avatar?: string; }
interface Nook {
  id: string; name: string; description?: string;
  scope: string; company_id?: string | null;
  is_locked: boolean; is_hidden: boolean;
  creator?: NookCreator | null; creator_id?: string;
  member_count?: number; message_count?: number;
  expires_at?: string | null; created_at: string;
}

interface NookSummary { total: number; public: number; private: number; company: number; locked: number; }

const PAGE_SIZE = 20;

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type SortField = 'name' | 'member_count' | 'message_count';

const SORT_OPTIONS = [
  { field: 'name', label: 'Nook Name' },
  { field: 'member_count', label: 'Members' },
  { field: 'message_count', label: 'Messages' },
];

function NookModal({ nook, onClose, onSaved }: { nook?: Nook; onClose: () => void; onSaved: () => void }) {
  const editing = !!nook;
  const [name, setName] = useState(nook?.name ?? '');
  const [description, setDescription] = useState(nook?.description ?? '');
  const [scope, setScope] = useState(nook?.scope ?? 'public');
  const [isLocked, setIsLocked] = useState(nook?.is_locked ?? false);
  const [isHidden, setIsHidden] = useState(nook?.is_hidden ?? false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { showToast(MSG.ADMIN.NOOK_NAME_REQUIRED, 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await UpdateNook(nook!.id, { name, description, scope, is_locked: isLocked, is_hidden: isHidden });
        showToast(MSG.ADMIN.NOOK_UPDATED, 'success');
      } else {
        await CreateNook({ name, description, scope, company_id: null });
        showToast(MSG.ADMIN.NOOK_CREATED, 'success');
      }
      onSaved();
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.NOOK_SAVE_FAILED), 'error');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">{editing ? 'Edit Nook' : 'Create Nook'}</h2>
          <button type="button" title="Close" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nook Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tech Enthusiasts" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What is this nook about?" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Scope</label>
            <select value={scope} onChange={e => setScope(e.target.value)} title="Nook scope" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700">
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="company">Company</option>
            </select>
          </div>
          {editing && (
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={isLocked} onChange={e => setIsLocked(e.target.checked)} className="rounded" /> Locked
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={isHidden} onChange={e => setIsHidden(e.target.checked)} className="rounded" /> Hidden
              </label>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-all shadow-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editing ? 'Save Changes' : 'Create Nook'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function NooksPage() {
  const [nooks, setNooks] = useState<Nook[]>([]);
  const [summary, setSummary] = useState<NookSummary>({ total: 0, public: 0, private: 0, company: 0, locked: 0 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [lockedFilter, setLockedFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editNook, setEditNook] = useState<Nook | undefined>();
  const [toggling, setToggling] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Nook | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const { exporting, showSuccess: showExportSuccess, downloadUrl: exportUrl, exportedFormat, doExport, closeSuccess } = useExport(
    (format) => ExportNooks({ format, search: search || undefined, scope: scopeFilter || undefined, is_locked: lockedFilter || undefined })
  );

  const fetchNooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GetAdminNooks({
        page, limit: PAGE_SIZE,
        search: search || undefined,
        scope: scopeFilter || undefined,
        is_locked: lockedFilter || undefined,
      });
      const d = res?.data ?? {};
      setNooks(d.items ?? []);
      setSummary(d.summary ?? { total: 0, public: 0, private: 0, company: 0, locked: 0 });
      setTotal(res?.meta?.total ?? 0);
      setTotalPages(res?.meta?.total_pages ?? 1);
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.NOOKS_LOAD_FAILED), 'error');
    } finally { setLoading(false); }
  }, [page, search, scopeFilter, lockedFilter]);

  useEffect(() => { fetchNooks(); }, [fetchNooks]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSort = (field: string, order: SortOrder) => {
    setSortField(field as SortField); setSortOrder(order); setPage(1);
  };

  async function handleToggle(nook: Nook, field: 'is_locked' | 'is_hidden') {
    setToggling(nook.id + field);
    try {
      await UpdateNook(nook.id, { [field]: !nook[field] });
      showToast(field === 'is_locked'
        ? (nook.is_locked ? MSG.ADMIN.NOOK_UNLOCKED : MSG.ADMIN.NOOK_LOCKED)
        : (nook.is_hidden ? MSG.ADMIN.NOOK_VISIBLE : MSG.ADMIN.NOOK_HIDDEN), 'success');
      fetchNooks();
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.NOOK_TOGGLE_FAILED), 'error');
    } finally { setToggling(null); }
  }

  async function handleDelete(nook: Nook) {
    setDeleting(nook.id);
    try {
      await DeleteNook(nook.id, 'Deleted by admin');
      showToast(MSG.ADMIN.NOOK_DELETED, 'success');
      fetchNooks();
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.NOOK_DELETE_FAILED), 'error');
    } finally { setDeleting(null); setConfirmDelete(null); }
  }

  const start = nooks.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  const hasFilters = !!(scopeFilter || lockedFilter || search);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-5 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {(showModal || editNook) && (
        <NookModal nook={editNook} onClose={() => { setShowModal(false); setEditNook(undefined); }} onSaved={() => { setShowModal(false); setEditNook(undefined); fetchNooks(); }} />
      )}
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={doExport} hasFilters={hasFilters} title="Export Nooks" />
      <ExportSuccessModal isOpen={showExportSuccess} onClose={closeSuccess} format={exportedFormat} downloadUrl={exportUrl} />
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Nook"
        message={`Delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Nooks</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span className="w-1 h-1 bg-purple-600 rounded-full" />
            {total.toLocaleString()} total nooks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowExportModal(true)} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Export</span>
          </button>
          <button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Nook</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: summary.total, color: 'text-gray-700', bg: 'bg-white', border: 'border-gray-100' },
          { label: 'Public', value: summary.public, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Private', value: summary.private, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { label: 'Company', value: summary.company, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Locked', value: summary.locked, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 shadow-sm`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100/80">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search nooks..." className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 transition-all" />
          </div>
          <SortDropdown sortField={sortField} sortOrder={sortOrder} onSort={handleSort} options={SORT_OPTIONS} />
          <div className="relative">
            <select value={scopeFilter} onChange={e => { setScopeFilter(e.target.value); setPage(1); }} title="Filter by scope" className="appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 min-w-[130px]">
              <option value="">All Scopes</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="company">Company</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={lockedFilter} onChange={e => { setLockedFilter(e.target.value); setPage(1); }} title="Filter by lock state" className="appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 min-w-[130px]">
              <option value="">All States</option>
              <option value="true">Locked</option>
              <option value="false">Unlocked</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                {['Nook', 'Scope', 'Creator', 'Members', 'Messages', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => <TableRowSkeleton key={i} columns={8} />)
              ) : nooks.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Hash className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No nooks found.</p>
                </td></tr>
              ) : nooks.map(nook => (
                <tr key={nook.id} className={`hover:bg-gray-50/60 transition-colors group ${deleting === nook.id ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Hash className="w-4 h-4 text-pink-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{nook.name}</p>
                        {nook.description && <p className="text-xs text-gray-400 truncate max-w-[160px]">{nook.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${nook.scope === 'public' ? 'bg-blue-50 text-blue-700 border-blue-200' : nook.scope === 'company' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                      {nook.scope === 'public' ? <Globe className="w-3 h-3" /> : nook.scope === 'company' ? <Building2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {nook.scope}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                    {nook.creator ? (typeof nook.creator === 'object' ? nook.creator.username : String(nook.creator)) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {(nook.member_count ?? 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">{(nook.message_count ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {nook.is_locked && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">Locked</span>}
                      {nook.is_hidden && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">Hidden</span>}
                      {!nook.is_locked && !nook.is_hidden && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Active</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">{formatDate(nook.created_at)}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setEditNook(nook)} title="Edit" className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button type="button" onClick={() => handleToggle(nook, 'is_locked')} disabled={toggling === nook.id + 'is_locked'} title={nook.is_locked ? 'Unlock' : 'Lock'} className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors disabled:opacity-40">
                        {toggling === nook.id + 'is_locked' ? <Loader2 className="w-4 h-4 animate-spin" /> : nook.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => handleToggle(nook, 'is_hidden')} disabled={toggling === nook.id + 'is_hidden'} title={nook.is_hidden ? 'Show' : 'Hide'} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors disabled:opacity-40">
                        {toggling === nook.id + 'is_hidden' ? <Loader2 className="w-4 h-4 animate-spin" /> : nook.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(nook)} disabled={deleting === nook.id} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-40">
                        {deleting === nook.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-700">{start}–{end}</span> of <span className="font-semibold text-gray-700">{total.toLocaleString()}</span> nooks
          </p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-md">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="px-4 py-2 text-sm font-semibold text-gray-700 bg-purple-50 rounded-xl">Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-md">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
