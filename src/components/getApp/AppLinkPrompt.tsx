import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, ExternalLink, X } from 'lucide-react';
import {
  androidOpenPathUrl,
  appLinkArrival,
  forgetAppLinkArrival,
  platformOf,
  storeLinkFor,
} from '../../utils/getApp';

// Shown on a phone that opened a shared link in the browser: open the app, get it, or stay here.
export function AppLinkPrompt() {
  // Read again on every navigation: the share redirect records the arrival as it runs.
  useLocation();
  const [closed, setClosed] = useState(false);
  const path = closed ? null : appLinkArrival();
  const store = storeLinkFor(platformOf());
  if (!path || !store) return null;

  const openUrl = androidOpenPathUrl(path);
  const close = () => {
    forgetAppLinkArrival();
    setClosed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3" role="dialog" aria-label="Open in the Affinity Echo app">
      <div className="mx-auto max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-semibold text-gray-900">This link opens in the Affinity Echo app</p>
            <p className="text-sm text-gray-500 mt-0.5">You can also carry on here in your browser.</p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 grid gap-2">
          {openUrl && (
            <a href={openUrl} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-xl">
              Open in the app <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <a
            href={store}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-purple-600 text-purple-700 font-medium rounded-xl"
          >
            <Download className="h-4 w-4" /> Get the app
          </a>
          <button type="button" onClick={close} className="px-4 py-2 text-sm text-gray-500">
            Continue in browser
          </button>
        </div>
      </div>
    </div>
  );
}
