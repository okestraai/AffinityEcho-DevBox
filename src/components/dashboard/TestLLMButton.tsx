import React, { useState } from 'react';
import { Activity, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { testLLMConnection, logEnvironmentVariables } from '../../lib/testLLMConnection';

export function TestLLMButton() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    logEnvironmentVariables();

    const testResult = await testLLMConnection();
    setResult(testResult);
    setTesting(false);
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <button
        onClick={handleTest}
        disabled={testing}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
      >
        {testing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Testing...
          </>
        ) : (
          <>
            <Activity className="w-4 h-4" />
            Test LLM
          </>
        )}
      </button>

      {result && (
        <div
          className={`mt-2 p-4 rounded-lg shadow-lg max-w-sm ${
            result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium mb-1 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {result.success ? 'Connection Successful' : 'Connection Failed'}
              </p>
              <p
                className={`text-xs ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {result.message}
              </p>
              {result.details && (
                <details className="mt-2 text-xs">
                  <summary
                    className={`cursor-pointer font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    Details
                  </summary>
                  <pre
                    className={`mt-1 p-2 rounded text-[10px] overflow-auto max-h-32 ${
                      result.success
                        ? 'bg-green-100 border border-green-300'
                        : 'bg-red-100 border border-red-300'
                    }`}
                  >
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
          <button
            onClick={() => setResult(null)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
