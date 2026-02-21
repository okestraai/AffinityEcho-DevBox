import React from "react";
import { EyeOff, Shield } from "lucide-react";

// Logging utility for consistent formatting
const log = (action: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [DemographicsStep] ${action}`;

  data !== undefined
    ? console.log(`${prefix}: ${message}`, data)
    : console.log(`${prefix}: ${message}`);
};

interface DemographicsData {
  firstName?: string;
  lastName?: string;
  race?: string;
  gender?: string;
  careerLevel?: string;
}

interface Props {
  data: DemographicsData;
  updateData: (updates: Partial<DemographicsData>) => void;
}

export function DemographicsStep({ data, updateData }: Props) {
  // Log component mount
  React.useEffect(() => {
    log("mount", "Component rendered", data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log data changes
  React.useEffect(() => {
    log("update", "Data changed", data);
  }, [data]);

  const races = [
    "Black/African American",
    "Hispanic/Latino",
    "Asian/Pacific Islander",
    "Native American",
    "Middle Eastern",
    "Mixed/Multiracial",
    "White",
    "Prefer not to say",
  ];

  const genders = ["Woman", "Man", "Non-binary", "Prefer not to say"];

  const careerLevels = [
    "Entry Level (0-2 years)",
    "Mid-level (3-7 years)",
    "Senior (8-12 years)",
    "Leadership (13+ years)",
    "Executive/C-Suite",
  ];

  const handleFirstNameChange = (firstName: string) => {
    log("firstName", "Changed", {
      previous: data.firstName,
      next: firstName,
    });
    updateData({ firstName });
  };

  const handleLastNameChange = (lastName: string) => {
    log("lastName", "Changed", {
      previous: data.lastName,
      next: lastName,
    });
    updateData({ lastName });
  };

  return (
    <div className="space-y-8">
      {/* Name fields */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={data.firstName ?? ""}
              onChange={(e) => handleFirstNameChange(e.target.value)}
              placeholder="First name"
              className="w-full px-3 sm:px-4 py-3.5 sm:py-4 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 bg-gray-50/50 focus:bg-white font-medium text-base"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={data.lastName ?? ""}
              onChange={(e) => handleLastNameChange(e.target.value)}
              placeholder="Last name"
              className="w-full px-3 sm:px-4 py-3.5 sm:py-4 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 bg-gray-50/50 focus:bg-white font-medium text-base"
            />
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <EyeOff className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Your real name stays private
            </p>
            <p className="text-xs text-blue-700 mt-1">
              This information will not be shared publicly unless you choose to
              reveal it.
            </p>
          </div>
        </div>
      </div>

      {/* Race */}
      <div>
        <label className="block text-base font-semibold text-gray-800 mb-4">
          Race / Ethnicity
        </label>
        <div className="space-y-3">
          {races.map((race) => (
            <label
              key={race}
              className="flex items-center p-3 sm:p-3 rounded-xl hover:bg-gray-50 cursor-pointer min-h-[44px]"
            >
              <input
                type="radio"
                name="race"
                value={race}
                checked={data.race === race}
                onChange={(e) => updateData({ race: e.target.value })}
                className="mr-3 sm:mr-4 w-5 h-5 sm:w-4 sm:h-4 text-purple-600"
              />
              <span className="text-gray-700 font-medium">{race}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-base font-semibold text-gray-800 mb-4">
          Gender Identity
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {genders.map((gender) => (
            <label
              key={gender}
              className="flex items-center p-3 rounded-xl hover:bg-gray-50 cursor-pointer min-h-[44px]"
            >
              <input
                type="radio"
                name="gender"
                value={gender}
                checked={data.gender === gender}
                onChange={(e) => updateData({ gender: e.target.value })}
                className="mr-3 w-5 h-5 sm:w-4 sm:h-4 text-purple-600"
              />
              <span className="text-sm sm:text-sm font-medium text-gray-700">
                {gender}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Career level */}
      <div>
        <label className="block text-base font-semibold text-gray-800 mb-4">
          Career Level
        </label>
        <select
          value={data.careerLevel ?? ""}
          onChange={(e) => updateData({ careerLevel: e.target.value })}
          className="w-full px-3 sm:px-4 py-3.5 sm:py-4 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 bg-gray-50/50 focus:bg-white font-medium text-base min-h-[48px]"
        >
          <option value="">Select your level</option>
          {careerLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      {/* Security notice */}
      <div className="pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border">
          <Shield className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Your information is encrypted and kept anonymous
          </span>
        </div>
      </div>
    </div>
  );
}
