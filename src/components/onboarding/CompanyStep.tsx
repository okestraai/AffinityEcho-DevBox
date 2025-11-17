import React, { useState } from 'react';
import { Search, Building } from 'lucide-react';

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

export function CompanyStep({ data, updateData }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOther, setShowOther] = useState(false);

  // Log component render
  React.useEffect(() => {
    log('CompanyStep', 'Component rendered', { data, searchTerm, showOther });
  }, []);

  // Log search term changes
  React.useEffect(() => {
    log('CompanyStep', 'Search term changed', { searchTerm, filteredCount: filteredCompanies.length });
  }, [searchTerm]);

  // Log show other toggle
  React.useEffect(() => {
    log('CompanyStep', 'Show other mode changed', { showOther });
  }, [showOther]);

  const companies = [
    'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix', 'Tesla',
    'Goldman Sachs', 'JPMorgan Chase', 'Bank of America', 'Wells Fargo',
    'McKinsey & Company', 'Boston Consulting Group', 'Deloitte', 'PwC',
    'Johnson & Johnson', 'Pfizer', 'Merck', 'Abbott', 'Bristol Myers Squibb'
  ];

  const filteredCompanies = companies.filter(company =>
    company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompanySelect = (company: string) => {
    log('handleCompanySelect', 'Company selected', { 
      previousCompany: data.company, 
      newCompany: company 
    });
    updateData({ company });
    setShowOther(false);
    log('handleCompanySelect', 'Show other mode disabled');
  };

  const handleOther = () => {
    log('handleOther', 'Other option selected');
    setShowOther(true);
    updateData({ company: '' });
    log('handleOther', 'Company field cleared for custom input');
  };

  const handleCustomCompanyChange = (company: string) => {
    log('handleCustomCompanyChange', 'Custom company input changed', { 
      previousCompany: data.company, 
      newCompany: company 
    });
    updateData({ company });
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
                  log('handleSearchChange', 'Search term updated', { 
                    previousTerm: searchTerm, 
                    newTerm: newSearchTerm 
                  });
                  setSearchTerm(newSearchTerm);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredCompanies.map((company) => (
                <button
                  key={company}
                  onClick={() => handleCompanySelect(company)}
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                    data.company === company ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-700'
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
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors border border-dashed border-gray-300"
              >
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  Other (not listed)
                </div>
              </button>
            </div>
          </>
        ) : (
          <div>
            <input
              type="text"
              placeholder="Enter your company name"
              value={data.company}
              onChange={(e) => handleCustomCompanyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-3"
            />
            <button
              onClick={() => {
                log('handleBackToList', 'Returning to company list');
                setShowOther(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              ← Back to company list
            </button>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-700 leading-relaxed">
            You'll automatically join your company's private forum and can participate in discussions with colleagues.
          </p>
        </div>
      </div>
    </div>
  );
}