import React from "react";
import { EyeOff, Globe2, Shield } from "lucide-react";
import { countryOptions } from "../../constants/countries";
import {
  ETHNICITY_OPTIONS,
  LIFE_STAGES,
  MAX_ETHNICITIES,
} from "../../constants/onboardingOptions";

// Logging utility for consistent formatting
const log = (action: string, message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [DemographicsStep] ${action}`;

  if (data !== undefined) {
    console.log(`${prefix}: ${message}`, data);
  } else {
    console.log(`${prefix}: ${message}`);
  }
};

interface DemographicsData {
  firstName?: string;
  lastName?: string;
  country?: string;
  ethnicities?: string[];
  gender?: string;
  careerLevel?: string;
  ageConfirmed?: boolean;
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

  const countries = React.useMemo(() => countryOptions(), []);
  const ethnicities = data.ethnicities ?? [];

  // "Prefer not to say" stands alone; any other choice clears it.
  const toggleEthnicity = (value: string) => {
    if (ethnicities.includes(value)) {
      updateData({ ethnicities: ethnicities.filter((e) => e !== value) });
    } else if (value === "Prefer not to say") {
      updateData({ ethnicities: [value] });
    } else if (ethnicities.length < MAX_ETHNICITIES) {
      updateData({
        ethnicities: [
          ...ethnicities.filter((e) => e !== "Prefer not to say"),
          value,
        ],
      });
    }
  };

  const genders = ["Woman", "Man", "Non-binary", "Prefer not to say"];

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
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={data.firstName ?? ""}
              onChange={(e) => handleFirstNameChange(e.target.value)}
              placeholder="First name"
              className="w-full px-3 sm:px-4 py-3.5 sm:py-4 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 bg-gray-50/50 focus:bg-white font-medium text-base"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
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

      {/* Country */}
      <div>
        <label
          htmlFor="onboarding-country"
          className="block text-base font-semibold text-gray-800 mb-2"
        >
          Where are you based? <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <select
            id="onboarding-country"
            required
            value={data.country ?? ""}
            onChange={(e) => updateData({ country: e.target.value })}
            className="w-full pl-11 pr-4 py-3.5 sm:py-4 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 bg-gray-50/50 focus:bg-white font-medium text-base min-h-[48px]"
          >
            <option value="">Choose your country</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          We use this to show you safety help and dates that fit where you
          live.
        </p>
      </div>

      {/* Ethnicity */}
      <div>
        <label className="block text-base font-semibold text-gray-800 mb-1">
          Ethnicity or heritage{" "}
          <span className="text-sm font-normal text-gray-500">(optional)</span>
        </label>
        <p className="text-xs text-gray-500 mb-4">
          Choose up to {MAX_ETHNICITIES}.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ETHNICITY_OPTIONS.map((option) => (
            <label
              key={option}
              className="flex items-center p-3 rounded-xl hover:bg-gray-50 cursor-pointer min-h-[44px]"
            >
              <input
                type="checkbox"
                checked={ethnicities.includes(option)}
                onChange={() => toggleEthnicity(option)}
                className="mr-3 w-5 h-5 sm:w-4 sm:h-4 rounded text-purple-600"
              />
              <span className="text-gray-700 font-medium">{option}</span>
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
          Life / career stage{" "}
          <span className="text-sm font-normal text-gray-500">(optional)</span>
        </label>
        <select
          value={data.careerLevel ?? ""}
          onChange={(e) => updateData({ careerLevel: e.target.value })}
          className="w-full px-3 sm:px-4 py-3.5 sm:py-4 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 bg-gray-50/50 focus:bg-white font-medium text-base min-h-[48px]"
        >
          <option value="">Select your stage</option>
          {LIFE_STAGES.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      {/* Age confirmation */}
      <div className="pt-4">
        <label className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={data.ageConfirmed || false}
            onChange={(e) => updateData({ ageConfirmed: e.target.checked })}
            className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">
            I confirm that I am 18 years of age or older
          </span>
        </label>
      </div>

      {/* Security notice */}
      <div className="pt-4 border-t border-gray-100">
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
