import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Users, Eye, EyeOff, Lock, Unlock,
  Plus, Search, ChevronLeft, ChevronRight, Loader2, Globe, Building2,
  Pencil, Trash2, X, Save, Download, ChevronDown,
} from 'lucide-react';
import { GetAdminForums, CreateForum, UpdateForum, DeleteForum, ExportForums } from '../../../api/adminApis';
import { showToast } from '../../Helper/ShowToast';
import { MSG } from '../../constants/messages';
import { ExportModal, ExportSuccessModal, SortDropdown, ConfirmModal, TableRowSkeleton } from '../components';
import { getApiError } from '../utils/apiError';
import { useExport } from '../hooks/useExport';
import type { SortOrder } from '../types';

interface ModeratorProfile { id: string; username: string; avatar?: string; }
interface Forum {
  id: string; name: string; description?: string; icon?: string;
  category?: string; scope: string; is_global: boolean;
  company_id?: string | null; company_name?: string | null;
  rules?: string[]; moderator_ids?: string[];
  moderator_profiles?: ModeratorProfile[];
  is_locked: boolean; is_hidden: boolean;
  topic_count?: number; member_count?: number;
  created_at: string;
}

type SortField = 'created_at' | 'name' | 'topic_count' | 'member_count';

const PAGE_SIZE = 20;

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SORT_OPTIONS = [
  { field: 'created_at', label: 'Date Created' },
  { field: 'name', label: 'Forum Name' },
  { field: 'topic_count', label: 'Topics' },
  { field: 'member_count', label: 'Members' },
];

// ── Forum Create/Edit Modal ───────────────────────────────────────────────────
function ForumModal({ forum, onClose, onSaved }: { forum?: Forum; onClose: () => void; onSaved: () => void }) {
  const editing = !!forum;
  const [name, setName] = useState(forum?.name ?? '');
  const [description, setDescription] = useState(forum?.description ?? '');
  const [icon, setIcon] = useState(forum?.icon ?? '');
  const [category, setCategory] = useState(forum?.category ?? 'foundation');
  const [scope, setScope] = useState(forum?.scope ?? 'global');
  const [companyName, setCompanyName] = useState(forum?.company_name ?? '');
  const [isLocked, setIsLocked] = useState(forum?.is_locked ?? false);
  const [isHidden, setIsHidden] = useState(forum?.is_hidden ?? false);
  const DEFAULT_RULES = 'Be respectful and professional in all interactions\nShare experiences honestly while maintaining privacy\nSupport others and contribute constructively';
  const [rulesInput, setRulesInput] = useState(forum?.rules?.join('\n') ?? (!editing ? DEFAULT_RULES : ''));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { showToast(MSG.ADMIN.FORUM_NAME_REQUIRED, 'error'); return; }
    setSaving(true);
    try {
      const rules = rulesInput.split('\n').map(r => r.trim()).filter(Boolean);
      if (editing) {
        await UpdateForum(forum!.id, { name, description, icon, category, rules, is_locked: isLocked, is_hidden: isHidden });
        showToast(MSG.ADMIN.FORUM_UPDATED, 'success');
      } else {
        await CreateForum({ name, description, icon, category, scope, company_name: scope === 'company' ? companyName || null : null, rules });
        showToast(MSG.ADMIN.FORUM_CREATED, 'success');
      }
      onSaved();
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.FORUM_SAVE_FAILED), 'error');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">{editing ? 'Edit Forum' : 'Create Forum'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Forum Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. General Discussion" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief description..." className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Icon / Emoji</label>
              <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="💬" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} title="Forum category" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700">
                <option value="foundation">Foundation</option>
                <option value="global">Global</option>
              </select>
            </div>
          </div>
          {!editing && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Scope</label>
              <select value={scope} onChange={e => setScope(e.target.value)} title="Forum scope" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700">
                <option value="global">Global</option>
                <option value="company">Company-based</option>
              </select>
            </div>
          )}
          {!editing && scope === 'company' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Company Name</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name..." className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Rules (one per line)</label>
            <textarea value={rulesInput} onChange={e => setRulesInput(e.target.value)} rows={3} placeholder={"Be respectful\nNo spam\nStay on topic"} className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
          </div>
          {editing && (
            <div className="flex gap-6 pt-1">
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editing ? 'Save Changes' : 'Create Forum'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ForumsPage() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editForum, setEditForum] = useState<Forum | undefined>();
  const [toggling, setToggling] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Forum | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const { exporting, showSuccess: showExportSuccess, downloadUrl: exportUrl, exportedFormat, doExport, closeSuccess } = useExport(
    (format) => ExportForums({ format, search: search || undefined, type: typeFilter || undefined })
  );

  const fetchForums = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GetAdminForums({ page, limit: PAGE_SIZE, search: search || undefined, type: typeFilter || undefined, sortBy: sortField, sortOrder });
      setForums(res?.data ?? []);
      setTotal(res?.meta?.total ?? 0);
      setTotalPages(res?.meta?.total_pages ?? 1);
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.FORUMS_LOAD_FAILED), 'error');
    } finally { setLoading(false); }
  }, [page, search, typeFilter, sortField, sortOrder]);

  useEffect(() => { fetchForums(); }, [fetchForums]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSort = (field: string, order: SortOrder) => {
    setSortField(field as SortField); setSortOrder(order); setPage(1);
  };

  async function handleToggle(forum: Forum, field: 'is_locked' | 'is_hidden') {
    setToggling(forum.id + field);
    try {
      await UpdateForum(forum.id, { [field]: !forum[field] });
      showToast(field === 'is_locked' ? (forum.is_locked ? MSG.ADMIN.FORUM_UNLOCKED : MSG.ADMIN.FORUM_LOCKED) : (forum.is_hidden ? MSG.ADMIN.FORUM_VISIBLE : MSG.ADMIN.FORUM_HIDDEN), 'success');
      fetchForums();
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.FORUM_TOGGLE_FAILED), 'error');
    } finally { setToggling(null); }
  }

  async function handleDelete(forum: Forum) {
    setDeleting(forum.id);
    try {
      await DeleteForum(forum.id, 'Deleted by admin');
      showToast(MSG.ADMIN.FORUM_DELETED, 'success');
      fetchForums();
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.FORUM_DELETE_FAILED), 'error');
    } finally { setDeleting(null); setConfirmDelete(null); }
  }

  const start = forums.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  const hasFilters = !!(typeFilter || search);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-5 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Modals */}
      {(showModal || editForum) && (
        <ForumModal forum={editForum} onClose={() => { setShowModal(false); setEditForum(undefined); }} onSaved={() => { setShowModal(false); setEditForum(undefined); fetchForums(); }} />
      )}
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={doExport} hasFilters={hasFilters} title="Export Forums" />
      <ExportSuccessModal isOpen={showExportSuccess} onClose={closeSuccess} format={exportedFormat} downloadUrl={exportUrl} />
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Forum"
        message={`Delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Forums</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span className="w-1 h-1 bg-purple-600 rounded-full" />
            {total.toLocaleString()} total forums
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowExportModal(true)} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Export</span>
          </button>
          <button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Forum</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100/80">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search forums..." className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 transition-all" />
          </div>
          <SortDropdown sortField={sortField} sortOrder={sortOrder} onSort={handleSort} options={SORT_OPTIONS} />
          <div className="relative">
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} title="Filter by type" className="appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 min-w-[130px]">
              <option value="">All Types</option>
              <option value="global">Global</option>
              <option value="company">Company</option>
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
                {['Forum', 'Scope', 'Mods', 'Topics', 'Members', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => <TableRowSkeleton key={i} columns={8} />)
              ) : forums.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No forums found.</p>
                </td></tr>
              ) : forums.map(forum => (
                <tr key={forum.id} className={`hover:bg-gray-50/60 transition-colors group ${deleting === forum.id ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                        {forum.icon || <MessageSquare className="w-4 h-4 text-indigo-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{forum.name}</p>
                        {forum.category && <p className="text-xs text-gray-400">{forum.category}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${forum.is_global || forum.scope === 'global' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                      {forum.is_global || forum.scope === 'global' ? <><Globe className="w-3 h-3" /> Global</> : <><Building2 className="w-3 h-3" /> {forum.company_name ?? 'Company'}</>}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {forum.moderator_profiles && forum.moderator_profiles.length > 0 ? (
                      <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-gray-400" /><span className="text-sm text-gray-700">{forum.moderator_profiles.length}</span></div>
                    ) : <span className="text-sm text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">{(forum.topic_count ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">{(forum.member_count ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {forum.is_locked && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">Locked</span>}
                      {forum.is_hidden && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">Hidden</span>}
                      {!forum.is_locked && !forum.is_hidden && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Active</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">{formatDate(forum.created_at)}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setEditForum(forum)} title="Edit" className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button type="button" onClick={() => handleToggle(forum, 'is_locked')} disabled={toggling === forum.id + 'is_locked'} title={forum.is_locked ? 'Unlock' : 'Lock'} className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors disabled:opacity-40">
                        {toggling === forum.id + 'is_locked' ? <Loader2 className="w-4 h-4 animate-spin" /> : forum.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => handleToggle(forum, 'is_hidden')} disabled={toggling === forum.id + 'is_hidden'} title={forum.is_hidden ? 'Show' : 'Hide'} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors disabled:opacity-40">
                        {toggling === forum.id + 'is_hidden' ? <Loader2 className="w-4 h-4 animate-spin" /> : forum.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(forum)} disabled={deleting === forum.id} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-40">
                        {deleting === forum.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
            Showing <span className="font-semibold text-gray-700">{start}–{end}</span> of <span className="font-semibold text-gray-700">{total.toLocaleString()}</span> forums
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
