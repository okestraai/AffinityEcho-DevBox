
import { Zap } from "lucide-react";

export function NooksHero() {
  return (
    <div className="text-center mb-12">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-3xl mb-6 shadow-2xl">
        <Zap className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-4">
        Nooks
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
        Anonymous safe spaces that disappear after 24 hours. Share freely,
        support others, and find your voice.
      </p>
    </div>
  );
}
