import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Database, Share2, Clock, Download, Cookie, UserCheck, Bell, Mail } from "lucide-react";

const sections = [
  {
    icon: Database,
    color: "from-purple-100 to-indigo-100",
    iconColor: "text-purple-600",
    title: "1. Information We Collect",
    subsections: [
      {
        subtitle: "Account Information",
        text: "When you create an account, we collect your email address and generate an anonymous username and avatar for you. If you sign up via Google, we receive your email and basic profile information.",
      },
      {
        subtitle: "Onboarding Information",
        text: "During onboarding, you may provide demographic information (career level, company type), affinity group preferences, and professional details to personalize your experience.",
      },
      {
        subtitle: "Content You Create",
        text: "This includes posts, forum topics, nook messages, comments, mentorship messages, and reactions. Anonymous content is stored without linking to your real identity.",
      },
      {
        subtitle: "Usage Data",
        text: "We collect information about how you interact with the Platform, including pages visited, features used, and timestamps.",
      },
    ],
  },
  {
    icon: Shield,
    color: "from-green-100 to-emerald-100",
    iconColor: "text-green-600",
    title: "2. How We Protect Your Anonymity",
    intro: "Anonymity is core to Affinity Echo. We protect it by:",
    list: [
      "Assigning random usernames and emoji avatars by default.",
      "Encrypting sensitive personal information (such as company affiliation) at rest.",
      "Never displaying your real name to other users unless you explicitly use the identity reveal feature.",
      "Separating anonymous content from your account identity in our database architecture.",
    ],
  },
  {
    icon: Eye,
    color: "from-amber-100 to-orange-100",
    iconColor: "text-amber-600",
    title: "3. Identity Reveal",
    content:
      "The identity reveal feature allows you to share your real name with specific users in direct messages. This is always opt-in and requires mutual consent. You can reveal your identity to one user without affecting your anonymity elsewhere on the Platform.",
  },
  {
    icon: Lock,
    color: "from-blue-100 to-indigo-100",
    iconColor: "text-blue-600",
    title: "4. How We Use Your Information",
    list: [
      "To provide and operate the Platform.",
      "To personalize your experience (e.g., relevant forums and mentorship matches).",
      "To send notifications about activity relevant to you.",
      "To detect and prevent abuse, harassment, and violations of our Terms.",
      "To generate aggregated, anonymized analytics to improve the Platform.",
    ],
  },
  {
    icon: Share2,
    color: "from-red-100 to-pink-100",
    iconColor: "text-red-500",
    title: "5. Information Sharing",
    intro: "We do not sell your personal information. We may share data:",
    list: [
      "With service providers who help operate the Platform (hosting, email delivery) under strict confidentiality agreements.",
      "When required by law or to protect the safety of our users.",
      "In aggregated, anonymized form for research or analytics purposes.",
    ],
  },
  {
    icon: Clock,
    color: "from-indigo-100 to-purple-100",
    iconColor: "text-indigo-600",
    title: "6. Data Retention",
    content:
      "We retain your account data for as long as your account is active. You may deactivate your account at any time from your profile settings. Deactivated accounts can be reactivated within 30 days. After 30 days, your personal data is permanently deleted, though anonymized content may remain.",
  },
  {
    icon: Download,
    color: "from-teal-100 to-cyan-100",
    iconColor: "text-teal-600",
    title: "7. Data Export",
    content:
      "You can export your data at any time from your profile settings. The export includes your profile information, posts, comments, and activity history.",
  },
  {
    icon: Cookie,
    color: "from-yellow-100 to-amber-100",
    iconColor: "text-yellow-600",
    title: "8. Cookies and Local Storage",
    content:
      "We use cookies and local storage to maintain your session, remember your preferences, and keep you logged in. We do not use third-party advertising cookies.",
  },
  {
    icon: UserCheck,
    color: "from-green-100 to-teal-100",
    iconColor: "text-green-600",
    title: "9. Your Rights",
    intro: "You have the right to:",
    list: [
      "Access and export your personal data.",
      "Correct inaccurate information.",
      "Delete your account and associated data.",
      "Opt out of non-essential communications.",
    ],
  },
  {
    icon: Shield,
    color: "from-red-100 to-orange-100",
    iconColor: "text-red-600",
    title: "10. Child Safety Standards",
    intro: "Affinity Echo is designed for adults aged 18 and older. We are committed to preventing child sexual abuse and exploitation (CSAE) on our platform.",
    list: [
      "Users must be 18 years or older to create an account.",
      "We do not knowingly collect personal information from anyone under 18.",
      "All user-generated content is subject to moderation and community guidelines.",
      "Users can report inappropriate content or behavior directly within the app.",
      "Our moderation team reviews flagged content and takes action including content removal and account suspension.",
      "We comply with all applicable child safety laws and report violations to the relevant authorities.",
      "If we discover that a user is under 18, their account will be immediately suspended and their data deleted.",
    ],
  },
  {
    icon: Bell,
    color: "from-gray-100 to-slate-100",
    iconColor: "text-gray-600",
    title: "11. Changes to This Policy",
    content:
      "We may update this Privacy Policy periodically. We will notify you of material changes via email or in-app notification. Continued use after changes constitutes acceptance.",
  },
];

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            type="button"
            title="Go back"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src="/affinity-echo-logo-hd.png"
              alt="Affinity Echo"
              className="w-8 h-8 rounded-xl object-contain"
            />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Affinity Echo
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-4 shadow-sm">
            <Lock className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Privacy Policy
          </h1>
          <p className="text-gray-500 text-sm">
            Last updated: March 25, 2026
          </p>
          <p className="text-gray-600 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Your privacy is fundamental to Affinity Echo. This policy explains
            what we collect, how we protect your anonymity, and your rights
            over your data.
          </p>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { label: "End-to-end encrypted", icon: Lock },
            { label: "No data sold", icon: Shield },
            { label: "Anonymous by default", icon: Eye },
            { label: "Export anytime", icon: Download },
          ].map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 p-3 text-center"
            >
              <Icon className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-5 h-5 ${section.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        {section.title}
                      </h2>
                      {section.content && (
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                          {section.content}
                        </p>
                      )}
                      {section.intro && (
                        <p className="text-sm sm:text-base text-gray-600 mb-2">
                          {section.intro}
                        </p>
                      )}
                      {section.list && (
                        <ul className="space-y-1.5 text-sm sm:text-base text-gray-600">
                          {section.list.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {section.subsections && (
                        <div className="space-y-3 mt-1">
                          {section.subsections.map((sub, i) => (
                            <div key={i}>
                              <h3 className="text-sm font-semibold text-gray-800 mb-0.5">
                                {sub.subtitle}
                              </h3>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {sub.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact footer */}
        <div className="mt-10 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-center text-white shadow-lg">
          <Mail className="w-8 h-8 mx-auto mb-3 opacity-80" />
          <h3 className="text-lg font-bold mb-1">Privacy questions?</h3>
          <p className="text-sm text-white/80 mb-4">
            Our team is here to help with any privacy concerns.
          </p>
          <a
            href="mailto:privacy@affinityecho.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-50 transition-colors"
          >
            privacy@affinityecho.com
          </a>
        </div>
      </div>
    </div>
  );
}
