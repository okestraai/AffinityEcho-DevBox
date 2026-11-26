// src/components/onboarding/CompanyStep.tsx
import { useEffect, useMemo, useState } from "react";
import { Search, Building, GraduationCap, Briefcase } from "lucide-react";
import { GetCompanies, type CompanyOption } from "../../../api/profileApis";
import { GRAD_YEARS } from "../../constants/onboardingOptions";

export interface SchoolWorkData {
  isWorking: boolean;
  company: string;
  isStudent: boolean;
  school: string;
  expectedGradYear: string;
  showSchool: boolean;
}

interface Props {
  data: SchoolWorkData;
  updateData: (updates: Partial<SchoolWorkData>) => void;
  onNext: () => void;
}

// "School & work": either, both or neither. The server decides whether a company is on the list.
export function CompanyStep({ data, updateData }: Props) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!data.isWorking || companies.length) return;
    GetCompanies()
      .then((list) => setCompanies(Array.isArray(list) ? list : []))
      .catch(() => setTyping(true));
  }, [data.isWorking, companies.length]);

  const filtered = useMemo(
    () =>
      companies.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
      ),
    [companies, searchTerm],
  );

  const toggleClass = (on: boolean) =>
    `flex items-center gap-3 w-full p-4 rounded-2xl border text-left transition-colors min-h-[56px] ${
      on
        ? "bg-purple-50 border-purple-300 text-purple-900"
        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
    }`;

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-600">
        Both are optional. Choose what fits you, or skip this step.
      </p>

      {/* Work */}
      <section className="space-y-4">
        <button
          type="button"
          aria-pressed={data.isWorking}
          onClick={() =>
            updateData({ isWorking: !data.isWorking, company: data.isWorking ? "" : data.company })
          }
          className={toggleClass(data.isWorking)}
        >
          <Briefcase className="w-5 h-5" />
          <span className="font-semibold">I'm working</span>
        </button>

        {data.isWorking && (
          <div className="pl-1 space-y-3">
            {!typing ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    aria-label="Search for your company"
                    placeholder="Search for your company"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-base min-h-[44px]"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filtered.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => updateData({ company: c.name })}
                      className={`w-full text-left px-3 py-3 rounded-lg transition-colors min-h-[44px] ${
                        data.company === c.name
                          ? "bg-purple-50 text-purple-800 border border-purple-200"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        {c.name}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setTyping(true);
                      updateData({ company: searchTerm.trim() });
                    }}
                    className="w-full text-left px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 border border-dashed border-gray-300 min-h-[44px]"
                  >
                    <span className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      Not listed? Type your company
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  aria-label="Company name"
                  placeholder="Your company's name"
                  maxLength={120}
                  value={data.company}
                  onChange={(e) => updateData({ company: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-base min-h-[44px]"
                />
                {companies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTyping(false)}
                    className="text-sm text-purple-700 hover:text-purple-800 min-h-[44px]"
                  >
                    ← Back to the list
                  </button>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Your company stays private unless you choose to show it.
            </p>
          </div>
        )}
      </section>

      {/* School */}
      <section className="space-y-4">
        <button
          type="button"
          aria-pressed={data.isStudent}
          onClick={() => updateData({ isStudent: !data.isStudent })}
          className={toggleClass(data.isStudent)}
        >
          <GraduationCap className="w-5 h-5" />
          <span className="font-semibold">I'm a student</span>
        </button>

        {data.isStudent && (
          <div className="pl-1 space-y-4">
            <div>
              <label
                htmlFor="onboarding-school"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
                School, college or university <span className="text-red-500">*</span>
              </label>
              <input
                id="onboarding-school"
                type="text"
                maxLength={120}
                placeholder="e.g. University of Lagos"
                value={data.school}
                onChange={(e) => updateData({ school: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-base min-h-[44px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Any level counts: diploma, degree, master's, PhD or other.
              </p>
            </div>
            <div>
              <label
                htmlFor="onboarding-grad-year"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
                Expected to finish{" "}
                <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <select
                id="onboarding-grad-year"
                value={data.expectedGradYear}
                onChange={(e) => updateData({ expectedGradYear: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white text-base min-h-[44px]"
              >
                <option value="">Not sure</option>
                {GRAD_YEARS.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={data.showSchool}
                onChange={(e) => updateData({ showSchool: e.target.checked })}
                className="w-5 h-5 rounded text-purple-600"
              />
              <span className="text-sm text-gray-700">
                Show my school on my profile
              </span>
            </label>
            <p className="text-xs text-gray-500">
              Your school is private unless you choose to show it.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
