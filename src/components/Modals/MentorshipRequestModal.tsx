import React, { useState } from 'react';
import { X, Target, MessageCircle, Calendar, User, Send } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MentorshipRequestModal({ isOpen, onClose }: Props) {
  const [formData, setFormData] = useState({
    topic: '',
    goals: '',
    availability: '',
    communicationMethod: 'video-calls',
    urgency: 'medium',
    background: ''
  });

  if (!isOpen) return null;

  const communicationMethods = [
    { id: 'video-calls', label: 'Video Calls', icon: '📹' },
    { id: 'phone-calls', label: 'Phone Calls', icon: '📞' },
    { id: 'text-chat', label: 'Text Chat', icon: '💬' },
    { id: 'email', label: 'Email', icon: '📧' }
  ];

  const urgencyLevels = [
    { id: 'low', label: 'Low - General guidance', color: 'bg-gray-100 text-gray-700' },
    { id: 'medium', label: 'Medium - Specific goals', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'high', label: 'High - Urgent decisions', color: 'bg-red-100 text-red-700' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit mentorship request
    console.log('Mentorship request submitted:', formData);
    onClose();
    // Reset form
    setFormData({
      topic: '',
      goals: '',
      availability: '',
      communicationMethod: 'video-calls',
      urgency: 'medium',
      background: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Request Mentorship</h3>
            <p className="text-sm text-gray-500">Connect with experienced professionals</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic/Skill */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you need help with? *
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="e.g., Career advancement, Technical leadership, Salary negotiation"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              required
            />
          </div>

          {/* Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Goals *
            </label>
            <textarea
              value={formData.goals}
              onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
              placeholder="Describe your specific mentorship goals and what you hope to achieve..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              required
            />
          </div>

          {/* Background */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Background
            </label>
            <textarea
              value={formData.background}
              onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
              placeholder="Share relevant background information that would help a mentor understand your situation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            />
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Availability *
            </label>
            <input
              type="text"
              value={formData.availability}
              onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
              placeholder="e.g., Weekday evenings, Weekend mornings, Flexible"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              required
            />
          </div>

          {/* Communication Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preferred Communication Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {communicationMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, communicationMethod: method.id }))}
                  className={`p-3 rounded-lg border transition-all ${
                    formData.communicationMethod === method.id
                      ? 'bg-purple-50 border-purple-200 text-purple-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{method.icon}</span>
                    <span className="font-medium text-sm">{method.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Urgency Level
            </label>
            <div className="space-y-2">
              {urgencyLevels.map((level) => (
                <label key={level.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value={level.id}
                    checked={formData.urgency === level.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                    className="mr-3 text-purple-600 focus:ring-purple-500"
                  />
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${level.color}`}>
                    {level.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">How Matching Works</span>
            </div>
            <p className="text-xs text-blue-700">
              We'll match you with mentors based on your goals, their expertise, and mutual availability. 
              All initial connections are anonymous until both parties agree to reveal identities.
            </p>
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
              disabled={!formData.topic.trim() || !formData.goals.trim() || !formData.availability.trim()}
              className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}