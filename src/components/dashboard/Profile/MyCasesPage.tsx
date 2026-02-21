import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  ChevronRight,
  Calendar,
  Filter,
  RefreshCw,
  Plus,
  Search,
} from 'lucide-react';
import { GetMyHarassmentReports, GetHarassmentReportById } from '../../../../api/profileApis';

type ReportStatus = 'submitted' | 'pending' | 'under_review' | 'investigating' | 'resolved' | 'dismissed';

interface HarassmentReport {
  id: string;
  reference_number?: string;
  referenceNumber?: string;
  status: ReportStatus;
  category?: string;
  incident_type?: string;
  incidentType?: string;
  description: string;
  date?: string;
  location?: string;
  witnesses?: string;
  evidence?: string;
  reporterType?: string;
  contactEmail?: string | null;
  immediateRisk?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  timeline?: Array<{
    event: string;
    date?: string;
    timestamp?: string;
    message?: string;
  }>;
}

const statusConfig: Record<ReportStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  submitted: {
    label: 'Submitted',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  pending: {
    label: 'Pending',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  under_review: {
    label: 'Under Review',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <Eye className="w-3.5 h-3.5" />,
  },
  investigating: {
    label: 'Investigating',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: <Search className="w-3.5 h-3.5" />,
  },
  resolved: {
    label: 'Resolved',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  dismissed: {
    label: 'Dismissed',
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

export function MyCasesPage() {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId?: string }>();
  const [cases, setCases] = useState<HarassmentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [selectedCase, setSelectedCase] = useState<HarassmentReport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  // Auto-open case detail when caseId param is present
  useEffect(() => {
    if (caseId && cases.length > 0 && !selectedCase) {
      const target = cases.find((c) => c.id === caseId);
      if (target) {
        handleViewDetail(target);
      }
    }
  }, [caseId, cases]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await GetMyHarassmentReports(1, 50);
      const data = response?.reports || response?.cases || (Array.isArray(response) ? response : []);
      setCases(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (report: HarassmentReport) => {
    setDetailLoading(true);
    try {
      const detail = await GetHarassmentReportById(report.id);
      const data = detail;
      setSelectedCase({ ...report, ...data });
    } catch {
      // Fallback to the list data if detail endpoint fails
      setSelectedCase(report);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter ||
      (statusFilter === 'submitted' && c.status === 'pending') ||
      (statusFilter === 'pending' && c.status === 'submitted');
    const ref = c.reference_number || c.referenceNumber || '';
    const type = c.incident_type || c.incidentType || c.category || '';
    const matchesSearch = !searchQuery ||
      ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const summary = {
    total: cases.length,
    submitted: cases.filter((c) => c.status === 'submitted' || c.status === 'pending').length,
    under_review: cases.filter((c) => c.status === 'under_review' || c.status === 'investigating').length,
    resolved: cases.filter((c) => c.status === 'resolved').length,
    dismissed: cases.filter((c) => c.status === 'dismissed').length,
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Detail view for a single case
  if (selectedCase) {
    const status = statusConfig[selectedCase.status] || statusConfig.pending;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/30">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={() => setSelectedCase(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Cases</span>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Case header card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-5 h-5 text-white/80" />
                    <span className="text-white/80 text-sm font-medium">Case Details</span>
                  </div>
                  <h1 className="text-xl font-bold text-white">
                    {selectedCase.reference_number || selectedCase.referenceNumber || `Case #${selectedCase.id.slice(0, 8)}`}
                  </h1>
                </div>
                <div className={`${status.bg} ${status.border} border px-3 py-1.5 rounded-full flex items-center gap-1.5`}>
                  {status.icon}
                  <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1">Incident Type</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {selectedCase.incident_type || selectedCase.incidentType || selectedCase.category || 'Harassment'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1">Filed On</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(selectedCase.created_at || selectedCase.createdAt)}
                  </div>
                </div>
                {selectedCase.date && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Incident Date</div>
                    <div className="text-sm font-semibold text-gray-900">{formatDate(selectedCase.date)}</div>
                  </div>
                )}
                {selectedCase.location && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Location</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedCase.location}</div>
                  </div>
                )}
              </div>

              {selectedCase.immediateRisk && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-red-700">Flagged as immediate risk</span>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">
                  {selectedCase.description || 'No description provided.'}
                </p>
              </div>

              {selectedCase.witnesses && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Witnesses</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">{selectedCase.witnesses}</p>
                </div>
              )}

              {selectedCase.evidence && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Evidence</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">{selectedCase.evidence}</p>
                </div>
              )}

              {selectedCase.updated_at || selectedCase.updatedAt ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Last updated: {formatDateTime(selectedCase.updated_at || selectedCase.updatedAt)}
                </div>
              ) : null}
            </div>
          </div>

          {/* Timeline */}
          {selectedCase.timeline && selectedCase.timeline.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Timeline
              </h3>
              <div className="space-y-0">
                {selectedCase.timeline.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'} flex-shrink-0 mt-1.5`} />
                      {index < selectedCase.timeline!.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className="text-sm font-medium text-gray-900">{event.message || event.event}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(event.date || event.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help section */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1 text-sm">Need help?</h4>
                <p className="text-sm text-blue-700">
                  If you need immediate assistance or have questions about your case, please reach out to our safety team
                  or visit the crisis resources page.
                </p>
                <button
                  onClick={() => navigate('/crisis-resources')}
                  className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View Crisis Resources →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Profile</span>
            </button>
            <button
              onClick={() => navigate('/report-harassment')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">My Cases</h1>
              <p className="text-red-100 text-sm">Track and manage your harassment reports</p>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        {cases.length > 0 && (
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Total', count: summary.total, bg: 'bg-white', color: 'text-gray-900' },
              { label: 'Submitted', count: summary.submitted, bg: 'bg-amber-50', color: 'text-amber-700' },
              { label: 'Reviewing', count: summary.under_review, bg: 'bg-blue-50', color: 'text-blue-700' },
              { label: 'Resolved', count: summary.resolved, bg: 'bg-green-50', color: 'text-green-700' },
              { label: 'Dismissed', count: summary.dismissed, bg: 'bg-gray-50', color: 'text-gray-600' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-gray-100`}>
                <div className={`text-lg font-bold ${s.color}`}>{s.count}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search and filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference number, type, or description..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-1.5 overflow-x-auto">
              {(['all', 'submitted', 'under_review', 'resolved', 'dismissed'] as const).map((filter) => {
                const isActive = statusFilter === filter;
                const config = filter === 'all' ? null : statusConfig[filter];
                return (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                      isActive
                        ? filter === 'all'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : `${config!.bg} ${config!.color} ${config!.border}`
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {filter === 'all' ? 'All' : config!.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cases list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-3" />
            <p className="text-sm text-gray-500">Loading your cases...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cases Filed</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              You haven't filed any harassment reports. If you need to report an incident,
              you can do so safely and confidentially.
            </p>
            <button
              onClick={() => navigate('/report-harassment')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              File a Report
            </button>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No matching cases</h3>
            <p className="text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCases.map((report) => {
              const status = statusConfig[report.status] || statusConfig.pending;
              const ref = report.reference_number || report.referenceNumber || `#${report.id.slice(0, 8)}`;
              const type = report.incident_type || report.incidentType || report.category || 'Harassment';
              const date = report.created_at || report.createdAt;

              return (
                <button
                  key={report.id}
                  onClick={() => handleViewDetail(report)}
                  className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all text-left group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-gray-900">{ref}</span>
                        <div className={`${status.bg} ${status.border} border px-2 py-0.5 rounded-full flex items-center gap-1`}>
                          {status.icon}
                          <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 font-medium mb-1">{type}</div>
                      <p className="text-xs text-gray-500 line-clamp-2">{report.description}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(date)}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1 group-hover:translate-x-0.5 group-hover:text-gray-400 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Privacy notice */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 p-4 flex gap-3">
          <Shield className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500">
            All reports are kept strictly confidential. Only authorized safety team members can view report details.
            You are protected from retaliation under company policy.
          </p>
        </div>
      </div>

      {/* Detail loading overlay */}
      {detailLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-red-500" />
            <span className="text-sm text-gray-700">Loading case details...</span>
          </div>
        </div>
      )}
    </div>
  );
}
