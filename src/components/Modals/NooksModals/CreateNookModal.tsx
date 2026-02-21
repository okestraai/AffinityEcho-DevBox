import React, { useState } from 'react';
import { X, Hash, Tag, Globe, Building, AlertTriangle } from 'lucide-react';
import { CreateNook } from '../../../../api/nookApis';

interface CreateNookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateNookModal({ isOpen, onClose, onSuccess }: CreateNookModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
    scope: 'company' as 'company' | 'global',
    hashtags: [] as string[],
    hashtagInput: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addHashtag = () => {
    const tag = formData.hashtagInput.trim().toLowerCase().replace(/^#/, '');
    if (tag && !formData.hashtags.includes(tag) && formData.hashtags.length < 5) {
      setFormData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, tag],
        hashtagInput: ''
      }));
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleHashtagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addHashtag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        urgency: formData.urgency,
        scope: formData.scope,
        hashtags: formData.hashtags
      };

      await CreateNook(payload);

      // Reset form
      setFormData({
        title: '',
        description: '',
        urgency: 'medium',
        scope: 'company',
        hashtags: [],
        hashtagInput: ''
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating nook:', err);
      setError(err.response?.data?.error?.message || 'Failed to create nook. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-3xl w-full sm:max-w-md md:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 sm:p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-1">Create Anonymous Nook</h3>
              <p className="text-purple-100">A safe space for sensitive discussions</p>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Topic Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="What do you want to discuss?"
              maxLength={200}
              disabled={submitting}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-gray-50 focus:bg-white transition-all disabled:opacity-50"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide context for your discussion..."
              rows={4}
              disabled={submitting}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none bg-gray-50 focus:bg-white transition-all disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Hashtags (Optional)
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.hashtagInput}
                  onChange={(e) => setFormData(prev => ({ ...prev, hashtagInput: e.target.value }))}
                  onKeyPress={handleHashtagKeyPress}
                  placeholder="Add hashtags (press Enter or Space)"
                  disabled={submitting || formData.hashtags.length >= 5}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-gray-50 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
              
              {formData.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      <Tag className="w-3 h-3" />
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeHashtag(tag)}
                        disabled={submitting}
                        className="text-purple-500 hover:text-purple-700 font-bold disabled:opacity-50"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">Maximum 5 hashtags</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">Urgency Level</label>
              <select 
                value={formData.urgency}
                onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                disabled={submitting}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-gray-50 focus:bg-white transition-all disabled:opacity-50"
              >
                <option value="low">Low - General discussion</option>
                <option value="medium">Medium - Seeking advice</option>
                <option value="high">High - Urgent support needed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">Nook Scope</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, scope: 'company' }))}
                  disabled={submitting}
                  className={`p-3 rounded-xl border transition-all text-sm font-medium disabled:opacity-50 ${
                    formData.scope === 'company'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Building className="w-4 h-4 mx-auto mb-1" />
                  Company
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, scope: 'global' }))}
                  disabled={submitting}
                  className={`p-3 rounded-xl border transition-all text-sm font-medium disabled:opacity-50 ${
                    formData.scope === 'global'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Globe className="w-4 h-4 mx-auto mb-1" />
                  Global
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-bold text-yellow-800">Auto-Delete Notice</span>
            </div>
            <p className="text-sm text-yellow-700 leading-relaxed">
              This nook will automatically expire in 24 hours and all content will be permanently deleted. 
              No recovery is possible. Use this space for sensitive discussions that need temporary anonymity.
            </p>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim() || !formData.description.trim() || submitting}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
            >
              {submitting ? 'Creating...' : 'Create Nook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}