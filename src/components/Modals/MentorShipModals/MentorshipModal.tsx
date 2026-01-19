// components/Modals/MentorShipModals/MentorshipModal.tsx
import React, { useState } from "react";
import {
  X,
  Target,
  Star,
  MessageCircle,
  Calendar,
  Award,
  Bookmark,
} from "lucide-react";

interface MentorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBecomeMentor?: () => void;
}

export function MentorshipModal({
  isOpen,
  onClose,
  onBecomeMentor,
}: MentorshipModalProps) {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  if (!isOpen) return null;

  const mentorMatches = [
    {
      id: "1",
      name: "ExperiencedLeader789",
      avatar: "👩🏾‍💼",
      careerLevel: "Senior Leadership",
      company: "Microsoft",
      affinityTags: ["Black Women in Tech", "Women in Leadership"],
      matchScore: 95,
      bio: "VP of Engineering with 15+ years experience. Passionate about helping others navigate corporate challenges.",
      availability: "Weekly 30-min calls",
      languages: ["English", "Spanish"],
    },
    {
      id: "2",
      name: "WiseMentor456",
      avatar: "🧑🏽‍💻",
      careerLevel: "Senior (8-12 years)",
      company: "Google",
      affinityTags: ["Latino Leaders", "Tech Leadership"],
      matchScore: 87,
      bio: "Senior Software Engineer and team lead. Experienced in technical career growth and leadership transitions.",
      availability: "Bi-weekly check-ins",
      languages: ["English", "Portuguese"],
    },
    {
      id: "3",
      name: "CareerChampion",
      avatar: "👨🏿‍💼",
      careerLevel: "Executive/C-Suite",
      company: "Goldman Sachs",
      affinityTags: ["Black Professionals", "Finance Leaders"],
      matchScore: 82,
      bio: "Managing Director with expertise in finance and investment banking. Focus on career progression strategies.",
      availability: "Monthly mentoring",
      languages: ["English"],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Mentor Matches
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Based on your profile and interests
          </p>
        </div>

        {/* Matches List */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-4">
          <div className="space-y-4">
            {mentorMatches.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                    {mentor.avatar}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {mentor.name}
                      </h4>
                      <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">
                          {mentor.matchScore}%
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-1">
                      {mentor.careerLevel}
                    </p>
                    <p className="text-xs text-blue-600 mb-2">
                      {mentor.company}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {mentor.affinityTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                  {mentor.bio}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {mentor.availability}
                  </div>
                  <div className="flex gap-2">
                    {mentor.languages.map((lang) => (
                      <span
                        key={lang}
                        className="bg-gray-100 px-2 py-1 rounded-full"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      alert("Mentorship request sent!");
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      Request Mentor
                    </div>
                  </button>

                  <button
                    onClick={() => alert("Bookmarked!")}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Bookmark className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
            <div className="text-center">
              <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">
                Become a Mentor
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Help others in your field while building meaningful professional
                relationships.
              </p>
              <button
                onClick={onBecomeMentor}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Join as Mentor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
