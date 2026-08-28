import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  HelpCircle,
  Rocket,
  Shield,
  Zap,
  Settings,
  Monitor,
  Mail,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqSections: {
  title: string;
  icon: React.ElementType;
  color: string;
  iconColor: string;
  items: FAQItem[];
}[] = [
  {
    title: "Getting Started",
    icon: Rocket,
    color: "from-purple-100 to-indigo-100",
    iconColor: "text-purple-600",
    items: [
      {
        question: "What is Affinity Echo?",
        answer:
          "Affinity Echo is a professional community platform where you can have authentic workplace conversations — anonymously or with your real identity. It features forums, time-limited discussion spaces (nooks), mentorship connections, and direct messaging. Think of it as a safe space to talk about what really happens at work.",
      },
      {
        question: "Who is Affinity Echo for?",
        answer:
          "Affinity Echo is for professionals at any career level who want to connect with others who share similar experiences — whether that's navigating corporate culture, dealing with workplace challenges, finding mentors, or simply having honest conversations without fear of judgment.",
      },
      {
        question: "Is Affinity Echo free to use?",
        answer:
          "Yes, Affinity Echo is completely free to join and use. All core features — forums, nooks, mentorship, messaging, and reactions — are available to every user at no cost.",
      },
      {
        question: "How do I create an account?",
        answer:
          "You can sign up with your email address or use Google Sign-In. After creating your account, you'll complete a short onboarding process where you select your career level, company type, and affinity communities. The whole process takes about 2 minutes.",
      },
      {
        question: "What happens during onboarding?",
        answer:
          "Onboarding has three quick steps: (1) Enter your name and demographic info, (2) Select your company type, and (3) Choose affinity communities that matter to you. This helps us personalize your feed and connect you with relevant forums and people.",
      },
      {
        question: "Can I sign up with Google?",
        answer:
          "Yes! Click the Google button on the login page to sign up or log in instantly with your Google account. Your Google profile info is only used to create your account — your real name stays private on the platform.",
      },
    ],
  },
  {
    title: "Anonymity & Privacy",
    icon: Shield,
    color: "from-green-100 to-emerald-100",
    iconColor: "text-green-600",
    items: [
      {
        question: "Am I really anonymous?",
        answer:
          "Yes. When you sign up, you're assigned a random username (like \"QuietFox9395\") and an emoji avatar. Your real name, email, and company are never shown to other users unless you explicitly choose to reveal your identity.",
      },
      {
        question: "What is the identity reveal feature?",
        answer:
          "Identity reveal lets you share your real name with a specific person in direct messages. It requires mutual consent — both parties must agree. Revealing to one person doesn't affect your anonymity anywhere else on the platform. It's a great way to build trust in mentorship or 1-on-1 connections.",
      },
      {
        question: "Can my employer see my posts?",
        answer:
          "No. Your company affiliation is encrypted and only used for matching you with relevant communities. Your employer cannot see your posts, and we will never share your activity with any employer. We don't even store your company name in plain text.",
      },
      {
        question: "Can other users figure out who I am?",
        answer:
          "We design the platform to prevent de-anonymization. Usernames are randomly generated, and we do not display any identifying information. However, be mindful of sharing very specific details in your posts (like unique project names or exact dates) that could indirectly identify you.",
      },
      {
        question: "What data do you collect about me?",
        answer:
          "We collect your email (for login), the demographic and affinity info you provide during onboarding, and the content you create on the platform. We do not track your browsing activity outside of Affinity Echo, and we never sell your data. See our Privacy Policy for full details.",
      },
      {
        question: "Can I delete my account and all my data?",
        answer:
          "Yes. You can deactivate your account from profile settings. After 30 days, your personal data is permanently deleted. You can also export all your data before deactivating. Anonymized content (posts without identity links) may remain to preserve conversation context for other users.",
      },
    ],
  },
  {
    title: "Forums & Discussions",
    icon: Zap,
    color: "from-blue-100 to-indigo-100",
    iconColor: "text-blue-600",
    items: [
      {
        question: "What are forums?",
        answer:
          "Forums are permanent discussion spaces organized by topic — like \"Tech Careers\", \"Leadership\", or \"Work-Life Balance\". You can browse topics, create new discussions, comment, and react. Forums are great for ongoing conversations that stay relevant over time.",
      },
      {
        question: "What are Nooks and how are they different from forums?",
        answer:
          "Nooks are time-limited discussion spaces with a sense of urgency. Each nook has an expiration time, an urgency level (low/medium/high), and a temperature gauge showing how active it is. Unlike forums, nooks are designed for timely, focused conversations — think of them as \"pop-up\" discussion rooms.",
      },
      {
        question: "How do I create a post?",
        answer:
          "From your home feed, tap the \"Share your thoughts...\" box at the top. Write your post, optionally add tags, and submit. Your post will appear in the feed with your anonymous username. You can also use @mentions to tag other users.",
      },
      {
        question: "How do I create a forum topic?",
        answer:
          "Navigate to Forums, pick the forum you want to post in, and click \"Create Topic\". Add a title, description, and tags. Your topic will be visible to all members of that forum.",
      },
      {
        question: "What are reactions and what do they mean?",
        answer:
          "Reactions let you engage with content without commenting. Heart (Heard) means \"I relate to this\" or \"I see you\". Clap (Validate) means \"I agree\" or \"well said\". Lightbulb (Inspired) means \"this gave me a new idea\". Forum topics also have a Seen (eye) reaction for acknowledgment.",
      },
      {
        question: "Can I edit or delete my posts and comments?",
        answer:
          "Yes. You can edit your own posts and comments after publishing. Edited content will show an \"(edited)\" tag. You can also delete your own content at any time.",
      },
      {
        question: "How does the feed work? What determines what I see?",
        answer:
          "Your home feed shows a mix of posts, forum topics, and nook activity from across the platform. Content is sorted by recency and engagement. The more you interact with specific forums and topics, the more relevant content you'll see.",
      },
      {
        question: "Can I bookmark content to read later?",
        answer:
          "Yes. Tap the bookmark icon on any post, topic, or nook to save it. Find all your bookmarks in your profile under the Bookmarks tab.",
      },
    ],
  },
  {
    title: "Mentorship",
    icon: Zap,
    color: "from-teal-100 to-cyan-100",
    iconColor: "text-teal-600",
    items: [
      {
        question: "How does mentorship work on Affinity Echo?",
        answer:
          "You can browse available mentors and mentees in the Mentorship section. Send a mentorship request with a personal message explaining why you'd like to connect. If the other person accepts, you'll get a dedicated messaging channel for your mentorship conversations.",
      },
      {
        question: "Can I be both a mentor and a mentee?",
        answer:
          "Yes! Many users are mentors in one area and mentees in another. You can set your mentorship availability and preferences in your profile.",
      },
      {
        question: "Is mentorship anonymous too?",
        answer:
          "Mentorship starts anonymously — both parties see only anonymous usernames. You can choose to reveal your identity through the identity reveal feature if you both agree. Many mentorship pairs eventually reveal to build deeper trust.",
      },
      {
        question: "What if a mentorship isn't working out?",
        answer:
          "You can end a mentorship connection at any time from the Messages section. There's no obligation to continue, and ending a mentorship doesn't affect your standing on the platform.",
      },
      {
        question: "How do I find the right mentor?",
        answer:
          "Use the search and filter features in the Mentorship section to find mentors by skills, career level, company type, and affinity groups. Read their bio and send a thoughtful request explaining what you hope to learn.",
      },
    ],
  },
  {
    title: "Messaging & Connections",
    icon: Zap,
    color: "from-pink-100 to-rose-100",
    iconColor: "text-pink-600",
    items: [
      {
        question: "How do I send a direct message?",
        answer:
          "Go to Messages and tap \"New Chat\". Search for a user by their anonymous username and start a conversation. You can also message someone directly from their profile or from a mentorship connection.",
      },
      {
        question: "Are my direct messages private?",
        answer:
          "Yes. Direct messages are only visible to you and the person you're chatting with. Our moderation team may review messages only if one party reports a violation.",
      },
      {
        question: "Can I see someone's profile from a chat?",
        answer:
          "Yes. Tap on the user's name or avatar in the chat header to view their profile. You'll see their anonymous profile, activity stats, and shared communities.",
      },
      {
        question: "What's the difference between regular chats and mentorship chats?",
        answer:
          "Regular chats are for casual conversations with any user. Mentorship chats are dedicated channels created when a mentorship request is accepted. Mentorship chats have a special badge and may include additional features like mentorship-specific profile viewing.",
      },
      {
        question: "Will I get notifications for new messages?",
        answer:
          "Yes. You'll receive in-app notifications and a notification badge for new messages. You can manage your notification preferences in your profile settings.",
      },
    ],
  },
  {
    title: "Account & Settings",
    icon: Settings,
    color: "from-amber-100 to-orange-100",
    iconColor: "text-amber-600",
    items: [
      {
        question: "Can I change my anonymous username?",
        answer:
          "Yes, you can update your username from your profile settings. Your new username will still be anonymous — it won't reveal your real identity.",
      },
      {
        question: "Can I change my emoji avatar?",
        answer:
          "Your avatar is assigned during signup. Currently, avatar changes are managed through your profile settings.",
      },
      {
        question: "Can I deactivate my account?",
        answer:
          "Yes. Go to your profile settings and select Deactivate Account. Your data will be preserved for 30 days in case you want to reactivate. After 30 days, your personal data is permanently deleted.",
      },
      {
        question: "Can I reactivate a deactivated account?",
        answer:
          "Yes, within 30 days of deactivation. Simply log in with your credentials and you'll be prompted to reactivate. After 30 days, the account is permanently deleted and you'd need to create a new one.",
      },
      {
        question: "Can I export my data?",
        answer:
          "Yes. You can export your profile data, posts, comments, and activity from your profile settings at any time. The export is provided in a standard format you can keep for your records.",
      },
      {
        question: "How do I change my password?",
        answer:
          "Go to your profile settings and look for the password/security section. If you signed up with Google, you don't have a platform password — your authentication is managed through Google.",
      },
      {
        question: "How do I report harassment or abuse?",
        answer:
          "You can report any content or user directly through the platform using the report button (flag icon). Our moderation team reviews every report and takes action according to our Community Guidelines. For urgent matters, email support@affinityecho.com.",
      },
    ],
  },
  {
    title: "Community & Safety",
    icon: Shield,
    color: "from-red-100 to-pink-100",
    iconColor: "text-red-500",
    items: [
      {
        question: "What are the community guidelines?",
        answer:
          "Our Community Guidelines promote respectful, constructive conversations. Key rules: no harassment or discrimination, no doxxing or de-anonymizing others, no spam, and no sharing of confidential employer information. Violations may result in content removal or account suspension.",
      },
      {
        question: "What happens when I report something?",
        answer:
          "When you report content or a user, our moderation team reviews the report within 24 hours. You'll be notified of the outcome. Reports are confidential — the person you reported won't know who filed the report.",
      },
      {
        question: "Can I block another user?",
        answer:
          "If you're experiencing unwanted interactions, you can report the user. Our moderation team will review and take appropriate action, which may include restricting the user's access to you.",
      },
      {
        question: "Is there a crisis support resource?",
        answer:
          "Yes. If you or someone you know is in crisis, we provide access to crisis resources through the platform. You can find these in your profile settings. If you're in immediate danger, please contact your local emergency services.",
      },
    ],
  },
  {
    title: "Technical & Troubleshooting",
    icon: Monitor,
    color: "from-gray-100 to-slate-100",
    iconColor: "text-gray-600",
    items: [
      {
        question: "What browsers are supported?",
        answer:
          "Affinity Echo works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated to the latest version for the best experience.",
      },
      {
        question: "Does Affinity Echo work on mobile?",
        answer:
          "Yes! Affinity Echo is fully responsive and works great on mobile browsers. Just open your phone's browser and navigate to the site. No app download needed — it works like a native app.",
      },
      {
        question: "Do I need to install anything?",
        answer:
          "No. Affinity Echo is a web application — just visit the site in your browser. No app download, no extensions, no plugins required.",
      },
      {
        question: "I'm having trouble logging in. What should I do?",
        answer:
          "First, make sure you're using the correct email. Try resetting your password using the \"Forgot Password\" link on the login page. If you signed up with Google, use the Google Sign-In button instead. Clear your browser cache if issues persist. Still stuck? Email support@affinityecho.com.",
      },
      {
        question: "Why am I not seeing new posts or messages?",
        answer:
          "Try refreshing the page. If you're still not seeing updates, check your internet connection. Affinity Echo uses real-time WebSocket connections for instant updates — if your connection drops temporarily, a refresh will catch you up.",
      },
      {
        question: "The page isn't loading properly. What should I do?",
        answer:
          "Try these steps: (1) Refresh the page, (2) Clear your browser cache and cookies, (3) Try a different browser, (4) Disable browser extensions that might interfere. If none of these work, contact support@affinityecho.com with details about your browser and device.",
      },
      {
        question: "How do I contact support?",
        answer:
          "Email us at support@affinityecho.com. Include as much detail as possible about your issue — browser, device, screenshots if applicable. We typically respond within 24 hours.",
      },
    ],
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="w-full text-left bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden hover:border-purple-200 transition-all duration-200"
    >
      <div className="flex items-center justify-between px-4 sm:px-5 py-4">
        <span className="text-sm sm:text-base font-medium text-gray-900 pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>
      {open && (
        <div className="px-4 sm:px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {item.answer}
        </div>
      )}
    </button>
  );
}

export function FAQPage() {
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
          <Link to="/" className="flex min-h-[44px] items-center gap-3">
            <img
              src="/affinity-echo-logo-hd.png"
              alt="Affinity Echo home"
              className="w-8 h-8 rounded-xl object-contain"
            />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Affinity Echo
            </span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4 shadow-sm">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
            Everything you need to know about Affinity Echo. Can't find what
            you're looking for? Reach out to our support team.
          </p>
        </div>

        {/* FAQ sections */}
        <div className="space-y-8">
          {faqSections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title}>
                <div className="flex items-center gap-3 mb-4 px-1">
                  <div
                    className={`w-9 h-9 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${section.iconColor}`} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <FAQAccordion key={item.question} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact footer */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-center text-white shadow-lg">
          <Mail className="w-8 h-8 mx-auto mb-3 opacity-80" />
          <h3 className="text-lg font-bold mb-1">Still have questions?</h3>
          <p className="text-sm text-white/80 mb-4">
            Our support team is happy to help you with anything.
          </p>
          <a
            href="mailto:support@affinityecho.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-50 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
