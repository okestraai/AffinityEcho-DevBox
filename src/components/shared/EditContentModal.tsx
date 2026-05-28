import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { MentionTextarea } from './MentionTextarea';
import { UpdatePost } from '../../../api/feedApis';
import { UpdateForumTopic } from '../../../api/forumApis';
import { UpdateNook, GetNookById } from '../../../api/nookApis';
import { showToast } from '../../Helper/ShowToast';

type ContentType = 'post' | 'topic' | 'nook';

interface EditContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedItem: any) => void;
  contentType: ContentType;
  item: any;
}

const URGENCY_OPTIONS = ['low', 'medium', 'high'] as const;
const SCOPE_OPTIONS = ['global', 'company'] as const;

export function EditContentModal({
  isOpen,
  onClose,
  onSuccess,
  contentType,
  item,
}: EditContentModalProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [scope, setScope] = useState<'global' | 'company'>('global');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const itemKey = useMemo(() => isOpen ? `${item?.id}-${item?.content_id}-${item?.title}` : '', [isOpen, item?.id, item?.content_id, item?.title]);
  useEffect(() => {
    if (!isOpen || !item) return;
    let cancelled = false;
    const nested = typeof item.content === 'object' ? item.content : null;

    if (contentType === 'post') {
      setContent(typeof item.content === 'string' ? item.content : nested?.text || '');
    } else if (contentType === 'topic') {
      setTitle(item.title || nested?.title || '');
      setContent(typeof item.content === 'string' ? item.content : nested?.text || '');
      const topicTags = item.tags || item.hashtags || nested?.tags || [];
      setTags(Array.isArray(topicTags) ? topicTags : []);
    } else if (contentType === 'nook') {
      const c = nested;
      setTitle(item.title || item.name || c?.title || c?.nook_name || '');
      setDescription(item.description || c?.text || c?.description || '');
      setUrgency(item.urgency || c?.nook_urgency || c?.urgency || 'medium');
      setScope(item.scope || c?.nook_scope || c?.scope || 'global');

      const existingTags = item.hashtags || c?.hashtags || c?.nook_hashtags;
      if (existingTags && existingTags.length > 0) {
        setHashtags(existingTags);
      } else {
        const nookId = item.content_id || item.id;
        GetNookById(nookId).then((res: any) => {
          if (cancelled) return;
          const nookData = res?.nook || res;
          if (nookData?.hashtags) setHashtags(nookData.hashtags);
        }).catch(() => {});
      }
    }

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, itemKey, contentType]);

  if (!isOpen) return null;

  const handleClose = () => {
    setContent('');
    setTitle('');
    setDescription('');
    setTags([]);
    setHashtags([]);
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const id = item.content_id || item.id;
      let res: any;

      if (contentType === 'post') {
        if (!content.trim()) { showToast('Content is required', 'error'); return; }
        res = await UpdatePost(id, { content: content.trim() });
      } else if (contentType === 'topic') {
        if (!title.trim()) { showToast('Title is required', 'error'); return; }
        res = await UpdateForumTopic(id, { title: title.trim(), content: content.trim(), tags });
      } else if (contentType === 'nook') {
        if (!title.trim()) { showToast('Title is required', 'error'); return; }
        res = await UpdateNook(id, { title: title.trim(), description: description.trim(), urgency, scope, hashtags });
      }

      const updated = res?.data || res;
      const label = contentType === 'post' ? 'Post' : contentType === 'topic' ? 'Topic' : 'Nook';
      showToast(`${label} updated`, 'success');
      onSuccess(updated);
      handleClose();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update';
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = (value: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    const tag = value.trim().toLowerCase().replace(/^#/, '');
    if (tag && !list.includes(tag) && list.length < 10) {
      setList([...list, tag]);
    }
    setInput('');
  };

  const modalTitle = contentType === 'post' ? 'Edit Post' : contentType === 'topic' ? 'Edit Topic' : 'Edit Nook';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">{modalTitle}</h2>
          <button type="button" onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Post edit */}
          {contentType === 'post' && (
            <MentionTextarea
              value={content}
              onChange={setContent}
              placeholder="Edit your post... Use @ to mention someone"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 min-h-[120px] break-words whitespace-pre-wrap"
              autoFocus
            />
          )}

          {/* Topic edit */}
          {contentType === 'topic' && (
            <>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none min-h-[48px]"
                placeholder="Topic title"
                rows={2}
                autoFocus
              />
              <MentionTextarea
                value={content}
                onChange={setContent}
                placeholder="Topic content... Use @ to mention someone"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 min-h-[100px] break-words whitespace-pre-wrap"
              />
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <button key={tag} type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200">
                      #{tag} x
                    </button>
                  ))}
                </div>
                {tags.length < 10 && (
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput, tags, setTags, setTagInput); } }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                    placeholder="Add tag and press Enter"
                  />
                )}
              </div>
            </>
          )}

          {/* Nook edit */}
          {contentType === 'nook' && (
            <>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Nook title"
                maxLength={200}
                autoFocus
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 min-h-[80px]"
                placeholder="Nook description"
                maxLength={2000}
              />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Urgency</label>
                <div className="flex gap-2">
                  {URGENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setUrgency(opt)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${urgency === opt ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Scope</label>
                <div className="flex gap-2">
                  {SCOPE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setScope(opt)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${scope === opt ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {hashtags.map((tag) => (
                    <button key={tag} type="button" onClick={() => setHashtags(hashtags.filter((t) => t !== tag))} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200">
                      #{tag} x
                    </button>
                  ))}
                </div>
                {hashtags.length < 10 && (
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(hashtagInput, hashtags, setHashtags, setHashtagInput); } }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                    placeholder="Add hashtag and press Enter"
                  />
                )}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
