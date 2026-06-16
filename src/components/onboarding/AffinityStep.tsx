import React from 'react';
import { Lightbulb } from 'lucide-react';

// Logging utility for consistent formatting
const log = (component: string, message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [AffinityStep.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [AffinityStep.${component}] ${message}`);
  }
};

interface OnboardingData {
  affinityTags?: string[];
  [key: string]: unknown;
}

interface Props {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export function AffinityStep({ data, updateData }: Props) {
  // Log component render
  React.useEffect(() => {
    log('AffinityStep', 'Component rendered', { 
      data, 
      selectedTagsCount: data.affinityTags?.length || 0 
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log affinity tags changes
  React.useEffect(() => {
    log('AffinityStep', 'Affinity tags changed', { 
      affinityTags: data.affinityTags,
      count: data.affinityTags?.length || 0 
    });
  }, [data.affinityTags]);

  const affinityGroups = [
    { id: 'black-professionals', name: 'Black Professionals', icon: '👨🏾‍💼' },
    { id: 'latino-leaders', name: 'Latino Leaders', icon: '🌟' },
    { id: 'lgbtq-finance', name: 'LGBTQ+ in Finance', icon: '🏳️‍🌈' },
    { id: 'asian-entrepreneurs', name: 'Asian Entrepreneurs', icon: '🚀' },
    { id: 'women-leadership', name: 'Women in Leadership', icon: '👑' },
    { id: 'first-gen-college', name: 'First-Gen College Grads', icon: '🎓' },
    { id: 'working-parents', name: 'Working Parents', icon: '👨‍👩‍👧‍👦' },
    { id: 'military-veterans', name: 'Military Veterans', icon: '🇺🇸' },
    { id: 'disabled-professionals', name: 'Disabled Professionals', icon: '♿' },
    { id: 'immigrant-professionals', name: 'Immigrant Professionals', icon: '🌍' },
    { id: 'allies-advocates', name: 'Allies & Advocates', icon: '🤝' }
  ];

  const toggleAffinityTag = (tagId: string) => {
    log('toggleAffinityTag', 'Function called', { tagId, currentTags: data.affinityTags });
    
    const currentTags = data.affinityTags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((tag: string) => tag !== tagId)
      : [...currentTags, tagId];
    
    log('toggleAffinityTag', 'Tags updated', { 
      previousTags: currentTags, 
      newTags, 
      action: currentTags.includes(tagId) ? 'removed' : 'added',
      tagId 
    });
    
    updateData({ affinityTags: newTags });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select communities you'd like to join
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {affinityGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => toggleAffinityTag(group.id)}
              className={`w-full text-left px-3 sm:px-4 py-3 rounded-xl border transition-all duration-200 min-h-[48px] ${
                data.affinityTags?.includes(group.id)
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-lg flex-shrink-0">{group.icon}</span>
                <span className="font-medium text-sm sm:text-base">{group.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs text-purple-700 leading-relaxed">
            These communities help you find others with shared experiences. You can join or leave groups anytime.
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">Coming Soon</span>
        </div>
        <p className="text-xs text-yellow-700">
          Mentorship matching based on your selections and career goals.
        </p>
      </div>
    </div>
  );
}