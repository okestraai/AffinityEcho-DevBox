import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
          </div>
          <p className="text-sm text-gray-500 mb-8">
            Last updated: March 25, 2026
          </p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                1. Information We Collect
              </h2>
              <h3 className="text-base font-medium text-gray-800 mt-3 mb-1">
                Account Information
              </h3>
              <p>
                When you create an account, we collect your email address and
                generate an anonymous username and avatar for you. If you sign
                up via Google, we receive your email and basic profile
                information from Google.
              </p>
              <h3 className="text-base font-medium text-gray-800 mt-3 mb-1">
                Onboarding Information
              </h3>
              <p>
                During onboarding, you may provide demographic information
                (career level, company type), affinity group preferences, and
                professional details. This data helps us personalize your
                experience and connect you with relevant communities.
              </p>
              <h3 className="text-base font-medium text-gray-800 mt-3 mb-1">
                Content You Create
              </h3>
              <p>
                This includes posts, forum topics, nook messages, comments,
                mentorship messages, and reactions. Anonymous content is stored
                without linking to your real identity.
              </p>
              <h3 className="text-base font-medium text-gray-800 mt-3 mb-1">
                Usage Data
              </h3>
              <p>
                We collect information about how you interact with the
                Platform, including pages visited, features used, and
                timestamps.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                2. How We Protect Your Anonymity
              </h2>
              <p>Anonymity is core to Affinity Echo. We protect it by:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Assigning random usernames and emoji avatars by default.
                </li>
                <li>
                  Encrypting sensitive personal information (such as company
                  affiliation) at rest.
                </li>
                <li>
                  Never displaying your real name to other users unless you
                  explicitly use the identity reveal feature.
                </li>
                <li>
                  Separating anonymous content from your account identity in
                  our database architecture.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                3. Identity Reveal
              </h2>
              <p>
                The identity reveal feature allows you to share your real name
                with specific users in direct messages. This is always
                opt-in and requires mutual consent. You can reveal your
                identity to one user without affecting your anonymity
                elsewhere on the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                4. How We Use Your Information
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>To provide and operate the Platform.</li>
                <li>
                  To personalize your experience (e.g., relevant forums and
                  mentorship matches).
                </li>
                <li>To send notifications about activity relevant to you.</li>
                <li>
                  To detect and prevent abuse, harassment, and violations of
                  our Terms.
                </li>
                <li>
                  To generate aggregated, anonymized analytics to improve the
                  Platform.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                5. Information Sharing
              </h2>
              <p>We do not sell your personal information. We may share data:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  With service providers who help operate the Platform (hosting,
                  email delivery) under strict confidentiality agreements.
                </li>
                <li>
                  When required by law or to protect the safety of our users.
                </li>
                <li>
                  In aggregated, anonymized form for research or analytics
                  purposes.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                6. Data Retention
              </h2>
              <p>
                We retain your account data for as long as your account is
                active. You may deactivate your account at any time from your
                profile settings. Deactivated accounts can be reactivated
                within 30 days. After 30 days, your personal data is
                permanently deleted, though anonymized content may remain.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                7. Data Export
              </h2>
              <p>
                You can export your data at any time from your profile
                settings. The export includes your profile information, posts,
                comments, and activity history.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                8. Cookies and Local Storage
              </h2>
              <p>
                We use cookies and local storage to maintain your session,
                remember your preferences, and keep you logged in. We do not
                use third-party advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                9. Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access and export your personal data.</li>
                <li>Correct inaccurate information.</li>
                <li>Delete your account and associated data.</li>
                <li>Opt out of non-essential communications.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                10. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy periodically. We will notify
                you of material changes via email or in-app notification.
                Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                11. Contact
              </h2>
              <p>
                For privacy-related questions or requests, contact us at{" "}
                <a
                  href="mailto:privacy@affinityecho.com"
                  className="text-purple-600 hover:underline"
                >
                  privacy@affinityecho.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
