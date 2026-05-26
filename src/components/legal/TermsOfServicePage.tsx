import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Users, Eye, FileText, AlertTriangle, Scale, Pencil, Bell, Mail, Trash2, Database, Clock } from "lucide-react";

const sections = [
  {
    icon: Scale,
    color: "from-purple-100 to-indigo-100",
    iconColor: "text-purple-600",
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using Affinity Echo (\"the Platform\"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.",
  },
  {
    icon: FileText,
    color: "from-blue-100 to-indigo-100",
    iconColor: "text-blue-600",
    title: "2. Description of Service",
    content:
      "Affinity Echo is a professional community platform that enables anonymous and identity-revealed interactions including forums, nooks (time-limited discussion spaces), mentorship connections, and direct messaging. The Platform is designed to foster authentic workplace conversations in a safe environment.",
  },
  {
    icon: Users,
    color: "from-green-100 to-emerald-100",
    iconColor: "text-green-600",
    title: "3. User Accounts",
    list: [
      "You must provide accurate information when creating an account.",
      "You are responsible for maintaining the security of your account credentials.",
      "You must be at least 18 years old to use the Platform.",
      "One person may only maintain one account at a time.",
    ],
  },
  {
    icon: Eye,
    color: "from-amber-100 to-orange-100",
    iconColor: "text-amber-600",
    title: "4. Anonymity and Identity",
    content:
      "Affinity Echo supports anonymous participation. Your real identity is protected unless you choose to reveal it through the identity reveal feature. You agree not to attempt to de-anonymize other users through any means.",
  },
  {
    icon: AlertTriangle,
    color: "from-red-100 to-pink-100",
    iconColor: "text-red-500",
    title: "5. Acceptable Use",
    intro: "You agree not to:",
    list: [
      "Post content that is harassing, threatening, defamatory, or discriminatory.",
      "Share confidential or proprietary information belonging to your employer without authorization.",
      "Impersonate other users or misrepresent your affiliation.",
      "Use the Platform for spam, phishing, or any malicious purpose.",
      "Attempt to circumvent security measures or access unauthorized data.",
      "Use automated tools or bots to interact with the Platform.",
    ],
  },
  {
    icon: Pencil,
    color: "from-indigo-100 to-purple-100",
    iconColor: "text-indigo-600",
    title: "6. Content Ownership",
    content:
      "You retain ownership of content you post on Affinity Echo. By posting, you grant us a non-exclusive, worldwide license to display, distribute, and store your content as necessary to operate the Platform. You may delete your content at any time.",
  },
  {
    icon: Trash2,
    color: "from-red-100 to-orange-100",
    iconColor: "text-red-600",
    title: "7. User Content & Deletion",
    content:
      "When you post content on Affinity Echo \u2014 including posts, topics, comments, replies, nook messages, and nooks \u2014 you retain ownership of your content. You may edit or delete your content at any time through the app.",
  },
  {
    icon: AlertTriangle,
    color: "from-amber-100 to-yellow-100",
    iconColor: "text-amber-600",
    title: "8. Cascade Deletion Policy",
    content:
      "When you delete content that other users have replied to, all replies and nested responses under that content will also be permanently removed from the platform. By replying to another user\u2019s content, you acknowledge and agree that: your reply may be removed if the parent content is deleted by its author; Affinity Echo is not responsible for the loss of replies caused by another user deleting their content; you are encouraged to save any important information you post, as it may be removed at any time due to parent content deletion. Similarly, when a post, topic, or nook is deleted by its creator, all associated comments, replies, and messages within that content will be permanently removed.",
  },
  {
    icon: Database,
    color: "from-cyan-100 to-blue-100",
    iconColor: "text-cyan-600",
    title: "9. Data Retention",
    content:
      "When content is deleted, it is immediately removed from public view. Affinity Echo retains deleted content in its systems for up to 6 months for the following purposes: compliance with applicable laws and legal obligations; responding to legal requests, court orders, or law enforcement inquiries; investigating violations of our Community Guidelines; resolving content moderation appeals and user disputes. After 6 months, deleted content is permanently and irreversibly removed from our systems.",
  },
  {
    icon: Clock,
    color: "from-emerald-100 to-teal-100",
    iconColor: "text-emerald-600",
    title: "10. Edited Content",
    content:
      "When you edit content, the original version is not retained. Only the most recent version is stored. An \u201C(edited)\u201D indicator will be displayed to inform other users that the content has been modified.",
  },
  {
    icon: Shield,
    color: "from-purple-100 to-pink-100",
    iconColor: "text-purple-600",
    title: "11. Moderation and Enforcement",
    content:
      "Affinity Echo has zero tolerance for objectionable content or abusive users. We actively monitor and review reported content to maintain a safe community. Objectionable content will be removed within 24 hours of being reported. Users who post objectionable, abusive, or harmful content will have their accounts suspended or permanently terminated. All users can flag or report content and other users directly within the app. Users can restrict other users to prevent seeing their content or receiving messages from them. Users can hide individual posts or content they find objectionable from their personal feed. We reserve the right to remove any content, suspend, or terminate accounts at our sole discretion. For urgent concerns, contact us at support@affinityecho.com.",
  },
  {
    icon: Users,
    color: "from-teal-100 to-cyan-100",
    iconColor: "text-teal-600",
    title: "12. Mentorship Disclaimer",
    content:
      "Mentorship connections facilitated through Affinity Echo are informal and voluntary. The Platform does not guarantee the quality, accuracy, or outcomes of mentorship relationships. Users participate in mentorship at their own discretion.",
  },
  {
    icon: AlertTriangle,
    color: "from-gray-100 to-slate-100",
    iconColor: "text-gray-600",
    title: "13. Limitation of Liability",
    content:
      "Affinity Echo is provided \"as is\" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the amount you paid to use the Platform in the 12 months preceding the claim.",
  },
  {
    icon: Bell,
    color: "from-yellow-100 to-amber-100",
    iconColor: "text-yellow-600",
    title: "14. Changes to Terms",
    content:
      "We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the updated Terms. We will notify users of material changes via email or in-app notification.",
  },
];

export function TermsOfServicePage() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl mb-4 shadow-sm">
            <Scale className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Terms of Service
          </h1>
          <p className="text-gray-500 text-sm">
            Last updated: March 25, 2026
          </p>
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
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
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
          <h3 className="text-lg font-bold mb-1">Questions about our Terms?</h3>
          <p className="text-sm text-white/80 mb-4">
            We're here to help clarify anything.
          </p>
          <a
            href="mailto:support@affinityecho.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-50 transition-colors"
          >
            support@affinityecho.com
          </a>
        </div>
      </div>
    </div>
  );
}
