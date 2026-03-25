import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function TermsOfServicePage() {
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
              Terms of Service
            </h1>
          </div>
          <p className="text-sm text-gray-500 mb-8">
            Last updated: March 25, 2026
          </p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using Affinity Echo ("the Platform"), you agree
                to be bound by these Terms of Service. If you do not agree to
                these terms, please do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                2. Description of Service
              </h2>
              <p>
                Affinity Echo is a professional community platform that enables
                anonymous and identity-revealed interactions including forums,
                nooks (time-limited discussion spaces), mentorship connections,
                and direct messaging. The Platform is designed to foster
                authentic workplace conversations in a safe environment.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                3. User Accounts
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  You must provide accurate information when creating an
                  account.
                </li>
                <li>
                  You are responsible for maintaining the security of your
                  account credentials.
                </li>
                <li>
                  You must be at least 18 years old to use the Platform.
                </li>
                <li>
                  One person may only maintain one account at a time.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                4. Anonymity and Identity
              </h2>
              <p>
                Affinity Echo supports anonymous participation. Your real
                identity is protected unless you choose to reveal it through
                the identity reveal feature. You agree not to attempt to
                de-anonymize other users through any means.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                5. Acceptable Use
              </h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Post content that is harassing, threatening, defamatory, or
                  discriminatory.
                </li>
                <li>
                  Share confidential or proprietary information belonging to
                  your employer without authorization.
                </li>
                <li>
                  Impersonate other users or misrepresent your affiliation.
                </li>
                <li>
                  Use the Platform for spam, phishing, or any malicious
                  purpose.
                </li>
                <li>
                  Attempt to circumvent security measures or access
                  unauthorized data.
                </li>
                <li>
                  Use automated tools or bots to interact with the Platform.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                6. Content Ownership
              </h2>
              <p>
                You retain ownership of content you post on Affinity Echo. By
                posting, you grant us a non-exclusive, worldwide license to
                display, distribute, and store your content as necessary to
                operate the Platform. You may delete your content at any time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                7. Moderation and Enforcement
              </h2>
              <p>
                We reserve the right to remove content, suspend, or terminate
                accounts that violate these Terms or our Community Guidelines.
                Users may report content that they believe violates these
                terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                8. Mentorship Disclaimer
              </h2>
              <p>
                Mentorship connections facilitated through Affinity Echo are
                informal and voluntary. The Platform does not guarantee the
                quality, accuracy, or outcomes of mentorship relationships.
                Users participate in mentorship at their own discretion.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                9. Limitation of Liability
              </h2>
              <p>
                Affinity Echo is provided "as is" without warranties of any
                kind. We are not liable for any indirect, incidental, or
                consequential damages arising from your use of the Platform.
                Our total liability shall not exceed the amount you paid to use
                the Platform in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                10. Changes to Terms
              </h2>
              <p>
                We may update these Terms from time to time. Continued use of
                the Platform after changes constitutes acceptance of the
                updated Terms. We will notify users of material changes via
                email or in-app notification.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                11. Contact
              </h2>
              <p>
                For questions about these Terms, contact us at{" "}
                <a
                  href="mailto:support@affinityecho.com"
                  className="text-purple-600 hover:underline"
                >
                  support@affinityecho.com
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
