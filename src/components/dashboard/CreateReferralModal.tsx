import React, { useState } from 'react';
import { X, Briefcase, Building, Globe, ExternalLink, Hash, Tag, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateReferralModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const [referralType, setReferralType] = useState<'request' | 'offer'>('request');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    jobTitle: '',
    jobLink: '',
    description: '',
    scope: 'global' as 'global' | 'company',
    availableSlots: '',
    hashtags: [] as string[],
    hashtagInput: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setSubmitError('You must be logged in to post a referral');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const postData = {
        user_id: user.id,
        type: referralType,
        title: formData.title.trim(),
        company: formData.company.trim(),
        job_title: formData.jobTitle.trim() || null,
        job_link: formData.jobLink.trim() || null,
        description: formData.description.trim(),
        scope: formData.scope,
        status: 'open',
        available_slots: formData.availableSlots ? parseInt(formData.availableSlots) : null,
        total_slots: formData.availableSlots ? parseInt(formData.availableSlots) : null,
        tags: formData.hashtags
      };

      const { data, error } = await supabase
        .from('referral_posts')
        .insert([postData])
        .select()
        .single();

      if (error) throw error;

      console.log('Referral posted successfully:', data);

      // Reset form
      setFormData({
        title: '',
        company: '',
        jobTitle: '',
        jobLink: '',
        description: '',
        scope: 'global',
        availableSlots: '',
        hashtags: [],
        hashtagInput: ''
      });
      setReferralType('request');

      onClose();
    } catch (err) {
      console.error('Error posting referral:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to post referral');
    } finally {
      setSubmitting(false);
    }
  };

  const addHashtag = () => {
    const tag = formData.hashtagInput.trim().toLowerCase().replace(/^#/, '');
    if (tag && !formData.hashtags.includes(tag)) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Post a Referral</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What would you like to do?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setReferralType('request')}
              className={`p-4 rounded-xl border transition-all ${
                referralType === 'request'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5" />
                <span className="font-medium">Request Referral</span>
              </div>
              <p className="text-xs">Ask for help getting referred to a job</p>
            </button>
            
            <button
              type="button"
              onClick={() => setReferralType('offer')}
              className={`p-4 rounded-xl border transition-all ${
                referralType === 'offer'
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-5 h-5" />
                <span className="font-medium">Offer Referrals</span>
              </div>
              <p className="text-xs">Help others by offering referrals</p>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {referralType === 'request' ? 'What role are you seeking?' : 'What can you help with?'} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={
                referralType === 'request'
                  ? 'e.g., Looking for Software Engineer referral at Google'
                  : 'e.g., Can refer for Microsoft PM & Engineering roles'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {referralType === 'request'
                ? 'Be specific about the role and company you\'re targeting'
                : 'Clearly state what roles and departments you can help with'}
            </p>
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company *
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder={
                referralType === 'request' 
                  ? 'Which company are you targeting?'
                  : 'Which company can you refer for?'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Job Title (for requests) */}
          {referralType === 'request' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                placeholder="e.g., Senior Software Engineer"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {/* Job Link (for requests) */}
          {referralType === 'request' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Posting Link
              </label>
              <div className="relative">
                <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={formData.jobLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobLink: e.target.value }))}
                  placeholder="https://careers.company.com/job-id"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Available Slots (for offers) */}
          {referralType === 'offer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many referrals can you provide?
              </label>
              <input
                type="number"
                value={formData.availableSlots}
                onChange={(e) => setFormData(prev => ({ ...prev, availableSlots: e.target.value }))}
                placeholder="e.g., 3"
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={
                referralType === 'request'
                  ? 'Share your background, experience, and why you\'re interested in this role...'
                  : 'Describe what roles you can help with and any requirements...'
              }
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {referralType === 'request'
                ? 'Include: Your experience, skills, why this company/role, and what makes you a strong candidate'
                : 'Include: What you\'re looking for in candidates, your role at the company, and the referral process'}
            </p>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (helps others find your post)
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.hashtagInput}
                  onChange={(e) => setFormData(prev => ({ ...prev, hashtagInput: e.target.value }))}
                  onKeyPress={handleHashtagKeyPress}
                  placeholder="Add relevant tags (press Enter or Space)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              {formData.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      <Tag className="w-3 h-3" />
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeHashtag(tag)}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, scope: 'global' }))}
                className={`p-3 rounded-xl border transition-all ${
                  formData.scope === 'global'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">Global</span>
                </div>
                <p className="text-xs">Visible to all users</p>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, scope: 'company' }))}
                className={`p-3 rounded-xl border transition-all ${
                  formData.scope === 'company'
                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">Company Only</span>
                </div>
                <p className="text-xs">Visible to company members</p>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">{submitError}</span>
              </div>
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Referral Guidelines</span>
            </div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Be honest about your background and qualifications</li>
              <li>• Respect others' time and respond promptly to connections</li>
              <li>• Only offer referrals if you can genuinely help</li>
              <li>• Keep all interactions professional and respectful</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim() || !formData.company.trim() || !formData.description.trim() || submitting}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Posting...' : `Post ${referralType === 'request' ? 'Request' : 'Offer'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}