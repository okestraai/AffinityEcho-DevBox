import React from 'react';
import { Shield, Timer, Heart } from 'lucide-react';

interface CreateNookCTAProps {
  onCreateClick: () => void;
}

export function CreateNookCTA({ onCreateClick }: CreateNookCTAProps) {
  return (
    <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-3xl p-8 border border-purple-200 shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Need a Safe Space?</h2>
        <p className="text-gray-600">Create an anonymous nook for sensitive discussions</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 shadow-md">
          <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-bold text-gray-900 mb-1">100% Anonymous</h3>
          <p className="text-sm text-gray-600">No usernames or profiles shown</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 shadow-md">
          <Timer className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
          <h3 className="font-bold text-gray-900 mb-1">24-Hour Limit</h3>
          <p className="text-sm text-gray-600">Auto-deletes for privacy</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 shadow-md">
          <Heart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-bold text-gray-900 mb-1">Safe Support</h3>
          <p className="text-sm text-gray-600">Moderated for safety</p>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onCreateClick}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 transition-all font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-lg"
        >
          Create Your Nook
        </button>
      </div>
    </div>
  );
}