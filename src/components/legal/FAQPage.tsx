import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqSections: { title: string; items: FAQItem[] }[] = [
  {
    title: "Getting Started",
    items: [
      {
        question: "What is Affinity Echo?",
        answer:
          "Affinity Echo is a professional community platform where you can have authentic workplace conversations — anonymously or with your real identity. It features forums, time-limited discussion spaces (nooks), mentorship connections, and direct messaging.",
      },
      {
        question: "Is Affinity Echo free to use?",
        answer:
          "Yes, Affinity Echo is free to join and use. We may introduce premium features in the future, but core functionality will always remain free.",
      },
      {
        question: "How do I create an account?",
        answer:
          "You can sign up with your email address or use Google Sign-In. After creating your account, you'll complete a short onboarding process to set up your profile and select your affinity communities.",
      },
    ],
  },
  {
    title: "Anonymity & Privacy",
    items: [
      {
        question: "Am I really anonymous?",
        answer:
          "Yes. When you sign up, you're assigned a random username and emoji avatar. Your real name, email, and company are never shown to other users unless you explicitly choose to reveal your identity.",
      },
      {
        question: "What is the identity reveal feature?",
        answer:
          "Identity reveal lets you share your real name with a specific person in direct messages. It requires mutual consent — both parties must agree to reveal. Revealing to one person doesn't affect your anonymity anywhere else on the platform.",
      },
      {
        question: "Can my employer see my posts?",
        answer:
          "No. Your company affiliation is encrypted and only used for matching you with relevant communities. Your employer cannot see your posts, and we will never share your activity with any employer.",
      },
      {
        question: "Can other users figure out who I am?",
        answer:
          "We design the platform to prevent de-anonymization. Usernames are randomly generated, and we do not display any identifying information. However, be mindful of sharing specific details in your posts that could indirectly identify you.",
      },
    ],
  },
  {
    title: "Features",
    items: [
      {
        question: "What are Nooks?",
        answer:
          "Nooks are time-limited, themed discussion spaces. They have an urgency level and temperature indicator showing how active the conversation is. Nooks automatically expire, creating a sense of urgency and encouraging timely participation.",
      },
      {
        question: "How does mentorship work?",
        answer:
          "You can browse available mentors and mentees, then send a mentorship request with a personal message. If accepted, you'll have a dedicated messaging channel. Mentorship connections are separate from regular messaging.",
      },
      {
        question: "What are reactions?",
        answer:
          "You can react to posts and topics with: Heart (Heard) to acknowledge someone's experience, Clap (Validate) to show agreement, and Lightbulb (Inspired) to mark content that gave you new ideas. Forum topics also have a Seen reaction.",
      },
      {
        question: "Can I bookmark content?",
        answer:
          "Yes. You can bookmark posts, topics, and nooks. Find all your bookmarks in your profile under the Bookmarks tab.",
      },
    ],
  },
  {
    title: "Account & Settings",
    items: [
      {
        question: "Can I change my anonymous username?",
        answer:
          "Yes, you can update your username from your profile settings. Your new username will still be anonymous — it won't reveal your real identity.",
      },
      {
        question: "Can I deactivate my account?",
        answer:
          "Yes. Go to your profile settings and select Deactivate Account. Your data will be preserved for 30 days in case you want to reactivate. After 30 days, your personal data is permanently deleted.",
      },
      {
        question: "Can I export my data?",
        answer:
          "Yes. You can export your profile data, posts, and activity from your profile settings at any time.",
      },
      {
        question: "How do I report harassment or abuse?",
        answer:
          "You can report any content or user directly through the platform. Our moderation team reviews reports and takes action according to our Community Guidelines. You can also reach out to support@affinityecho.com.",
      },
    ],
  },
  {
    title: "Technical",
    items: [
      {
        question: "What browsers are supported?",
        answer:
          "Affinity Echo works on all modern browsers including Chrome, Firefox, Safari, and Edge. It's fully responsive and works on mobile devices.",
      },
      {
        question: "Do I need to install anything?",
        answer:
          "No. Affinity Echo is a web application — just visit the site in your browser. No app download required.",
      },
      {
        question: "I'm having trouble logging in. What should I do?",
        answer:
          "Try resetting your password using the 'Forgot Password' link on the login page. If you signed up with Google, use the Google Sign-In button. If issues persist, contact support@affinityecho.com.",
      },
    ],
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm sm:text-base font-medium text-gray-900 pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export function FAQPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/affinity-echo-logo-hd.png"
              alt="Affinity Echo"
              className="w-10 h-10 rounded-xl object-contain"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-sm text-gray-500 mb-8">
            Everything you need to know about Affinity Echo.
          </p>

          <div className="space-y-8">
            {faqSections.map((section) => (
              <div key={section.title}>
                <h2 className="text-base font-semibold text-purple-700 mb-3 px-1">
                  {section.title}
                </h2>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <FAQAccordion key={item.question} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Still have questions?
            </p>
            <a
              href="mailto:support@affinityecho.com"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
