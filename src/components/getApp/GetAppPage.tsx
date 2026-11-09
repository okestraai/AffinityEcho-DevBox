import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Smartphone } from 'lucide-react';
import { STORE_LINKS, platformOf, storeLinkFor } from '../../utils/getApp';

// /get-app: phones go straight to their store; computers see both stores.
export function GetAppPage() {
  const platform = platformOf();
  const store = storeLinkFor(platform);

  useEffect(() => {
    if (store) window.location.replace(store);
  }, [store]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/40 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-purple-100 flex items-center justify-center">
          <Smartphone className="h-7 w-7 text-purple-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Get the Affinity Echo app</h1>
        <p className="text-gray-600 mb-6">
          {store ? 'Taking you to the store for your phone…' : 'Stay close to your community. Download the app on your phone.'}
        </p>
        <div className="space-y-3">
          {(platform === 'ios' || platform === 'other') && (
            <a
              href={STORE_LINKS.ios}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors"
            >
              <Download className="h-4 w-4" /> Download on the App Store
            </a>
          )}
          {(platform === 'android' || platform === 'other') && (
            <a
              href={STORE_LINKS.android}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
            >
              <Download className="h-4 w-4" /> Get it on Google Play
            </a>
          )}
        </div>
        <Link to="/" className="mt-6 inline-block text-sm text-gray-500 hover:text-gray-700">
          Continue on the website
        </Link>
      </div>
    </div>
  );
}
