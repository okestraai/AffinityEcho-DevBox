import React, { useState } from 'react';
import { Database, CheckCircle, AlertCircle } from 'lucide-react';
import { seedReferralData } from '../../../lib/seedData';

export function SeedDataButton() {
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setResult(null);

      await seedReferralData();

      setResult('success');
      setTimeout(() => {
        setResult(null);
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Error seeding data:', err);
      setResult('error');
      setTimeout(() => setResult(null), 3000);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <button
        onClick={handleSeed}
        disabled={seeding || result !== null}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg transition-all ${
          result === 'success'
            ? 'bg-green-600 text-white'
            : result === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        } disabled:opacity-50`}
      >
        {result === 'success' ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>Data Loaded!</span>
          </>
        ) : result === 'error' ? (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>Error</span>
          </>
        ) : seeding ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Loading...</span>
          </>
        ) : (
          <>
            <Database className="w-4 h-4" />
            <span className="text-sm">Load Sample Data</span>
          </>
        )}
      </button>
    </div>
  );
}
