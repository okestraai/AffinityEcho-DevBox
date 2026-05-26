import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Flag, EyeOff, Pencil, Trash2, Loader2 } from 'lucide-react';
import { FlagContent, HideContent } from '../../../api/contentApis';
import { showToast } from '../../Helper/ShowToast';

const REASONS = [
  'Spam',
  'Harassment',
  'Hate speech',
  'Inappropriate content',
  'Misinformation',
  'Other',
];

interface Props {
  contentType?: string;
  contentId?: string;
  isOwner?: boolean;
  isLocked?: boolean;
  onHide?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ContentMenu({
  contentType,
  contentId,
  isOwner,
  isLocked,
  onHide,
  onEdit,
  onDelete,
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleHide = async () => {
    setShowMenu(false);
    if (!contentType || !contentId) return;
    try {
      await HideContent(contentType, contentId);
      onHide?.();
      showToast('Content hidden from your view', 'success');
    } catch {
      showToast('Failed to hide content', 'error');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete?.();
  };

  const handleFlag = async () => {
    if (!reason || !contentType || !contentId) {
      showToast('Please select a reason', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await FlagContent(contentType, contentId, reason, description.trim() || undefined);
      showToast('Report submitted. We will review this content.', 'success');
      setReason('');
      setDescription('');
      setShowFlagModal(false);
    } catch {
      showToast('Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Content options"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 w-40">
            {isOwner ? (
              <>
                {onEdit && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 transition-colors text-left ${
                      isLocked
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-blue-50'
                    }`}
                  >
                    <Pencil className={`w-4 h-4 ${isLocked ? 'text-gray-300' : 'text-blue-500'}`} />
                    <span className={`text-sm font-medium ${isLocked ? 'text-gray-300' : 'text-blue-600'}`}>Edit</span>
                  </button>
                )}
                {onEdit && onDelete && <div className="h-px bg-gray-100" />}
                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-red-50 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-600">Delete</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowFlagModal(true); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-red-50 transition-colors text-left"
                >
                  <Flag className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">Report</span>
                </button>
                <div className="h-px bg-gray-100" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleHide(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <EyeOff className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Hide</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Flag Modal */}
      {showFlagModal && contentType && contentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFlagModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Flag className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900">Report Content</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Why are you reporting this content?</p>

            <div className="space-y-1.5 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    reason === r
                      ? 'bg-purple-50 text-purple-700 font-semibold border border-purple-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details (optional)"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 mb-4"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowFlagModal(false); setReason(''); setDescription(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFlag}
                disabled={!reason || submitting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
