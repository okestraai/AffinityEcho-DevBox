
import { Zap } from "lucide-react";

export function NooksHero() {
  return (
    <div className="text-center mb-8 md:mb-12">
      <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl md:rounded-3xl mb-4 md:mb-6 shadow-2xl">
        <Zap className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-3 md:mb-4">
        Nooks
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
        Anonymous safe spaces that disappear after 24 hours. Share freely,
        support others, and find your voice.
      </p>
    </div>
  );
}
