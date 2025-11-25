import React, { useState } from 'react';
import { X, Target, Clock, MessageCircle, Award, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MentorshipProfileModal({ isOpen, onClose }: Props) {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    expertise: ['Career Development', 'Technical Leadership'],
    experience: 'Senior (8-12 years)',
    style: 'Collaborative and supportive',
    availability: 'Weekly 30-min calls',
    bio: 'Passionate about helping others navigate corporate challenges and advance their careers.',
    newExpertise: ''
  });

  if (!isOpen) return null;

  const experienceLevels = [
    'Mid-level (3-7 years)',
    'Senior (8-12 years)', 
    'Leadership (13+ years)',
    'Executive/C-Suite'
  ];

  const mentorshipStyles = [
    'Collaborative and supportive',
    'Direct and goal-oriented',
    'Flexible and adaptive',
    'Structured and systematic'
  ];

  const availabilityOptions = [
    'Weekly 30-min calls',
    'Bi-weekly 45-min calls',
    'Monthly 1-hour calls',
    'Flexible scheduling',
    'Text-based mentoring only'
  ];

  const addExpertise = () => {
    if (formData.newExpertise.trim() && !formData.expertise.includes(formData.newExpertise.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, prev.newExpertise.trim()],
        newExpertise: ''
      }));
    }
  };

  const removeExpertise = (item: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(exp => exp !== item)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save mentor profile data
    updateUser({ 
      isWillingToMentor: true,
      mentorProfile: {
        expertise: formData.expertise,
        experience: formData.experience,
        style: formData.style,
        availability: formData.availability,
        bio: formData.bio
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Mentor Profile</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Areas of Expertise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Areas of Expertise
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.newExpertise}
                  onChange={(e) => setFormData(prev => ({ ...prev, newExpertise: e.target.value }))}
                  placeholder="Add an area of expertise"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                />
                <button
                  type="button"
                  onClick={addExpertise}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.expertise.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeExpertise(item)}
                      className="text-purple-500 hover:text-purple-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <select
              value={formData.experience}
              onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            >
              {experienceLevels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Mentorship Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mentorship Style
            </label>
            <select
              value={formData.style}
              onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            >
              {mentorshipStyles.map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <select
              value={formData.availability}
              onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            >
              {availabilityOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mentor Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell potential mentees about your background and mentoring approach..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            />
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
              className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              Save Mentor Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}