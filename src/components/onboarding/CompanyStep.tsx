// src/components/onboarding/CompanyStep.tsx
import React, { useState } from "react";
import { Search, Building } from "lucide-react";

// Logging utility for consistent formatting
const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [CompanyStep.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [CompanyStep.${component}] ${message}`);
  }
};

interface Props {
  data: any;
  updateData: (updates: any) => void;
  onNext: () => void;
}

export function CompanyStep({ data, updateData, onNext }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOther, setShowOther] = useState(false);

  // List of static companies
  const staticCompanies = [
    "Google",
    "Microsoft",
    "Apple",
    "Amazon",
    "Meta",
    "Netflix",
    "Tesla",
    "Goldman Sachs",
    "JPMorgan Chase",
    "Bank of America",
    "Wells Fargo",
    "McKinsey & Company",
    "Boston Consulting Group",
    "Deloitte",
    "PwC",
    "Johnson & Johnson",
    "Pfizer",
    "Merck",
    "Abbott",
    "Bristol Myers Squibb",
  ];

  const filteredCompanies = staticCompanies.filter((company) =>
    company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompanySelect = (company: string) => {
    log('handleCompanySelect', 'Static company selected', { 
      previousCompany: data.company, 
      newCompany: company 
    });
    
    updateData({ 
      company,
      companyType: 'static', // Mark as static company
      isCustomCompany: false
    });
    setShowOther(false);
    
    // Auto-proceed for static companies
    onNext();
  };

  const handleOther = () => {
    log("handleOther", "Other option selected");
    setShowOther(true);
    updateData({
      company: "",
      companyType: 'other', // Mark as other/custom company
      isCustomCompany: true,
    });
  };

  const handleCustomCompanyChange = (company: string) => {
    log("handleCustomCompanyChange", "Custom company input changed", {
      previousCompany: data.company,
      newCompany: company,
    });
    updateData({
      company,
      companyType: 'other', // Ensure it's marked as 'other'
      isCustomCompany: true,
    });
  };

  const handleCustomCompanySubmit = () => {
    if (!data.company?.trim()) {
      return;
    }

    log("handleCustomCompanySubmit", "Submitting custom company", {
      company: data.company,
      companyType: data.companyType,
      isCustomCompany: data.isCustomCompany,
    });

    // Just call onNext - parent will handle forum creation
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Current Company
        </label>

        {!showOther ? (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for your company"
                value={searchTerm}
                onChange={(e) => {
                  const newSearchTerm = e.target.value;
                  log("handleSearchChange", "Search term updated", {
                    previousTerm: searchTerm,
                    newTerm: newSearchTerm,
                  });
                  setSearchTerm(newSearchTerm);
                }}
                className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base min-h-[44px]"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredCompanies.map((company) => (
                <button
                  key={company}
                  onClick={() => handleCompanySelect(company)}
                  className={`w-full text-left px-3 py-3 sm:py-2 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] ${
                    data.company === company
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    {company}
                  </div>
                </button>
              ))}

              <button
                onClick={handleOther}
                className="w-full text-left px-3 py-3 sm:py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors border border-dashed border-gray-300 min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  Other (not listed) 
                </div>
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter your company name (e.g., Indomie)"
                value={data.company}
                onChange={(e) => handleCustomCompanyChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && data.company?.trim()) {
                    handleCustomCompanySubmit();
                  }
                }}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base min-h-[44px]"
              />
              <p className="text-xs text-gray-500 mt-2">
                We'll create dedicated forums for "Others({data.company})"
              </p>
            </div>

            <button
              onClick={() => {
                log("handleBackToList", "Returning to company list");
                setShowOther(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors min-h-[44px] inline-flex items-center"
            >
              ← Back to company list
            </button>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-700 leading-relaxed">
            {showOther
              ? "We'll create a new 'Others({company name})' forum foundation where you can connect with colleagues from your company."
              : "You'll automatically join your company's private forum and can participate in discussions with colleagues."}
          </p>
        </div>
      </div>
    </div>
  );
}