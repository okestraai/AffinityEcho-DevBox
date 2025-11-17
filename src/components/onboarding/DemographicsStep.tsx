import React from 'react';
import { Shield } from 'lucide-react';

// Logging utility for consistent formatting
const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [DemographicsStep.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [DemographicsStep.${component}] ${message}`);
  }
};

interface Props {
  data: any;
  updateData: (updates: any) => void;
  onNext: () => void;
}

export function DemographicsStep({ data, updateData }: Props) {
  // Log component render
  React.useEffect(() => {
    log('DemographicsStep', 'Component rendered', { data });
  }, []);

  // Log data changes
  React.useEffect(() => {
    log('DemographicsStep', 'Data prop changed', data);
  }, [data]);

  const races = [
    'Black/African American',
    'Hispanic/Latino',
    'Asian/Pacific Islander',
    'Native American',
    'Middle Eastern',
    'Mixed/Multiracial',
    'White',
    'Prefer not to say'
  ];

  const genders = [
    'Woman',
    'Man',
    'Non-binary',
    'Prefer not to say'
  ];

  const careerLevels = [
    'Entry Level (0-2 years)',
    'Mid-level (3-7 years)',
    'Senior (8-12 years)',
    'Leadership (13+ years)',
    'Executive/C-Suite'
  ];

  const handleRaceChange = (race: string) => {
    log('handleRaceChange', 'Race selection changed', { 
      previousRace: data.race, 
      newRace: race 
    });
    updateData({ race });
  };

  const handleGenderChange = (gender: string) => {
    log('handleGenderChange', 'Gender selection changed', { 
      previousGender: data.gender, 
      newGender: gender 
    });
    updateData({ gender });
  };

  const handleCareerLevelChange = (careerLevel: string) => {
    log('handleCareerLevelChange', 'Career level selection changed', { 
      previousCareerLevel: data.careerLevel, 
      newCareerLevel: careerLevel 
    });
    updateData({ careerLevel });
  };

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-base font-semibold text-gray-800 mb-4">
          Race/Ethnicity <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-1 gap-3">
          {races.map((race) => (
            <label key={race} className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="radio"
                name="race"
                value={race}
                checked={data.race === race}
                onChange={(e) => handleRaceChange(e.target.value)}
                className="mr-4 text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <span className="text-base text-gray-700 font-medium">{race}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-base font-semibold text-gray-800 mb-4">
          Gender Identity <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {genders.map((gender) => (
            <label key={gender} className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="radio"
                name="gender"
                value={gender}
                checked={data.gender === gender}
                onChange={(e) => handleGenderChange(e.target.value)}
                className="mr-3 text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <span className="text-sm text-gray-700 font-medium">{gender}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-base font-semibold text-gray-800 mb-4">
          Career Level
        </label>
        <select
          value={data.careerLevel}
          onChange={(e) => handleCareerLevelChange(e.target.value)}
          className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-gray-50/50 focus:bg-white text-gray-900 font-medium"
        >
          <option value="">Select your level</option>
          {careerLevels.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      <div className="pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-100">
          <Shield className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800 font-medium">Your information is encrypted and kept anonymous</span>
        </div>
      </div>
    </div>
  );
}