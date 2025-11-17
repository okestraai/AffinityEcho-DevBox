import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Database, FileText, MessageCircle, Users, Calendar, CheckCircle, Shield, Info } from 'lucide-react';

export function ExportDataPage() {
  const navigate = useNavigate();
  const [selectedData, setSelectedData] = useState<string[]>(['all']);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const dataCategories = [
    {
      id: 'all',
      name: 'All Data',
      description: 'Export everything (recommended)',
      icon: Database,
      size: '~2.5 MB'
    },
    {
      id: 'profile',
      name: 'Profile Information',
      description: 'Your personal details, bio, and demographics',
      icon: Users,
      size: '~50 KB'
    },
    {
      id: 'posts',
      name: 'Posts & Topics',
      description: 'All your forum posts and topics',
      icon: FileText,
      size: '~800 KB'
    },
    {
      id: 'comments',
      name: 'Comments',
      description: 'All your comments and replies',
      icon: MessageCircle,
      size: '~600 KB'
    },
    {
      id: 'connections',
      name: 'Connections',
      description: 'Your network and mentorship relationships',
      icon: Users,
      size: '~100 KB'
    },
    {
      id: 'activity',
      name: 'Activity History',
      description: 'Likes, reactions, and engagement data',
      icon: Calendar,
      size: '~400 KB'
    }
  ];

  const handleCategoryToggle = (categoryId: string) => {
    if (categoryId === 'all') {
      setSelectedData(['all']);
    } else {
      const newSelected = selectedData.filter(id => id !== 'all');
      if (selectedData.includes(categoryId)) {
        setSelectedData(newSelected.filter(id => id !== categoryId));
      } else {
        setSelectedData([...newSelected, categoryId]);
      }
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const exportData = {
      exportedAt: new Date().toISOString(),
      format: exportFormat,
      categories: selectedData,
      data: {
        profile: {
          username: 'AnonymousUser123',
          email: 'user@example.com',
          joinedDate: '2024-01-15',
          demographics: {
            company: 'TechCorp',
            careerLevel: 'Mid-level'
          }
        },
        posts: selectedData.includes('posts') || selectedData.includes('all') ? 12 : 0,
        comments: selectedData.includes('comments') || selectedData.includes('all') ? 45 : 0,
        connections: selectedData.includes('connections') || selectedData.includes('all') ? 23 : 0
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-data-export-${Date.now()}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsExporting(false);
    setExportComplete(true);
  };

  if (exportComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Export Complete!
            </h2>

            <p className="text-gray-600 mb-6">
              Your data has been downloaded to your device.
            </p>

            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">What's included:</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                {selectedData.map(id => {
                  const category = dataCategories.find(c => c.id === id);
                  return category ? (
                    <li key={id} className="flex gap-2">
                      <span>•</span>
                      <span>{category.name}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/dashboard/profile')}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Return to Profile
              </button>

              <button
                onClick={() => setExportComplete(false)}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Export More Data
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Profile
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Export My Data</h1>
            </div>
            <p className="text-blue-100">
              Download a copy of your personal information and activity
            </p>
          </div>

          <div className="p-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Your Data Rights</h3>
                  <p className="text-sm text-blue-700">
                    Under GDPR and CCPA, you have the right to access, download, and delete your personal data.
                    This export includes all information we store about you in a machine-readable format.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Data to Export</h2>
              <div className="space-y-3">
                {dataCategories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedData.includes(category.id) ||
                    (selectedData.includes('all') && category.id !== 'all');

                  return (
                    <label
                      key={category.id}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">{category.size}</div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Export Format</h2>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    exportFormat === 'json'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={() => setExportFormat('json')}
                    className="sr-only"
                  />
                  <div className="font-semibold text-gray-900 mb-1">JSON</div>
                  <div className="text-sm text-gray-600">
                    Machine-readable format, ideal for developers
                  </div>
                </label>

                <label
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    exportFormat === 'csv'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="sr-only"
                  />
                  <div className="font-semibold text-gray-900 mb-1">CSV</div>
                  <div className="text-sm text-gray-600">
                    Spreadsheet format, easy to view and analyze
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">Privacy Notice</h3>
                  <p className="text-sm text-yellow-700">
                    Your export file contains sensitive personal information. Store it securely and do not share it publicly.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={selectedData.length === 0 || isExporting}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Preparing Export...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download My Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
