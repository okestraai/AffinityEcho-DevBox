import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Shield, Users, MessageCircle, AlertTriangle, CheckCircle, X, Flag } from 'lucide-react';

export function CommunityGuidelinesPage() {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>('core-values');

  const guidelines = [
    {
      id: 'core-values',
      title: 'Core Values',
      icon: Heart,
      color: 'blue',
      content: [
        {
          subtitle: 'Respect & Inclusion',
          points: [
            'Treat all members with dignity and respect regardless of race, gender, age, religion, sexual orientation, or background',
            'Value diverse perspectives and lived experiences',
            'Use inclusive language and be mindful of cultural differences',
            'Welcome newcomers and help them feel included'
          ]
        },
        {
          subtitle: 'Authenticity',
          points: [
            'Share genuine experiences and advice',
            'Be honest about your own journey and challenges',
            'Acknowledge when you don\'t know something',
            'Maintain your anonymous identity but keep your contributions real'
          ]
        },
        {
          subtitle: 'Support & Empowerment',
          points: [
            'Lift each other up and celebrate wins together',
            'Offer constructive feedback with kindness',
            'Share resources and opportunities generously',
            'Create space for others to be heard'
          ]
        }
      ]
    },
    {
      id: 'behavior',
      title: 'Expected Behavior',
      icon: CheckCircle,
      color: 'green',
      content: [
        {
          subtitle: 'Constructive Participation',
          points: [
            'Stay on topic and contribute meaningfully to discussions',
            'Ask thoughtful questions and provide helpful answers',
            'Share relevant experiences that add value',
            'Use reactions thoughtfully to show support'
          ]
        },
        {
          subtitle: 'Professional Conduct',
          points: [
            'Maintain professional standards even in difficult conversations',
            'Disagree respectfully without personal attacks',
            'Take heated discussions to private messages when needed',
            'Apologize when you make mistakes'
          ]
        },
        {
          subtitle: 'Privacy & Confidentiality',
          points: [
            'Respect the confidentiality of what\'s shared in the community',
            'Don\'t share identifying information about others',
            'Keep workplace specifics vague to protect anonymity',
            'Think twice before sharing screenshots or content outside the platform'
          ]
        }
      ]
    },
    {
      id: 'prohibited',
      title: 'Prohibited Behavior',
      icon: X,
      color: 'red',
      content: [
        {
          subtitle: 'Harassment & Discrimination',
          points: [
            'No hate speech, slurs, or discriminatory language',
            'No personal attacks, bullying, or intimidation',
            'No unwanted sexual advances or inappropriate content',
            'No doxxing or sharing personal information without consent'
          ]
        },
        {
          subtitle: 'Harmful Content',
          points: [
            'No misinformation or deliberately false information',
            'No spam, excessive self-promotion, or advertising',
            'No illegal content or encouragement of illegal activities',
            'No content that glorifies violence or self-harm'
          ]
        },
        {
          subtitle: 'Platform Abuse',
          points: [
            'No creating multiple accounts to manipulate discussions',
            'No coordinated harassment or brigading',
            'No attempts to hack, spam, or disrupt the platform',
            'No circumventing bans or disciplinary actions'
          ]
        }
      ]
    },
    {
      id: 'reporting',
      title: 'Reporting & Enforcement',
      icon: Flag,
      color: 'orange',
      content: [
        {
          subtitle: 'How to Report',
          points: [
            'Use the report button on any post, comment, or message',
            'Provide specific details about the violation',
            'Reports are reviewed within 24 hours',
            'All reports are kept confidential'
          ]
        },
        {
          subtitle: 'What We Review',
          points: [
            'Content that violates community guidelines',
            'Harassment or threatening behavior',
            'Spam or inappropriate solicitation',
            'Privacy violations and doxxing attempts'
          ]
        },
        {
          subtitle: 'Consequences',
          points: [
            'First violation: Warning and content removal',
            'Repeated violations: Temporary suspension (7-30 days)',
            'Severe violations: Permanent ban',
            'Illegal activity: Reported to authorities'
          ]
        }
      ]
    },
    {
      id: 'forums',
      title: 'Forum-Specific Guidelines',
      icon: MessageCircle,
      color: 'purple',
      content: [
        {
          subtitle: 'Company Forums',
          points: [
            'Keep discussions relevant to your company\'s culture and challenges',
            'Be extra cautious about identifying details',
            'Don\'t use forums to escalate workplace disputes',
            'Focus on peer support, not official HR processes'
          ]
        },
        {
          subtitle: 'Global Forums',
          points: [
            'Remember that members come from different companies and industries',
            'Provide context when sharing company-specific experiences',
            'Be open to different workplace cultures and practices',
            'Look for universal insights that apply across contexts'
          ]
        },
        {
          subtitle: 'Nooks (Ephemeral Spaces)',
          points: [
            'Content disappears after 24 hours - speak freely but responsibly',
            'Higher tolerance for venting, but respect still required',
            'Don\'t use anonymity as license for cruelty',
            'Particularly serious violations may be preserved for review'
          ]
        }
      ]
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: Users,
      color: 'teal',
      content: [
        {
          subtitle: 'Giving Advice',
          points: [
            'Share what worked for you, not universal prescriptions',
            'Acknowledge that situations differ and one size doesn\'t fit all',
            'Provide rationale for your suggestions',
            'Encourage seeking professional help when appropriate'
          ]
        },
        {
          subtitle: 'Asking for Help',
          points: [
            'Provide enough context for meaningful responses',
            'Be specific about what kind of help you need',
            'Show appreciation for those who take time to respond',
            'Update the community on outcomes when comfortable'
          ]
        },
        {
          subtitle: 'Building Connections',
          points: [
            'Engage consistently to build trust and rapport',
            'Support others before asking for support',
            'Participate in multiple forums to expand your network',
            'Consider mentoring or being mentored'
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Profile
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Community Guidelines</h1>
            </div>
            <p className="text-blue-100">
              Building a safe, supportive space for everyone
            </p>
          </div>

          <div className="p-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Our Commitment</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                This platform exists to provide a safe, anonymous space for underrepresented professionals to connect,
                support each other, and navigate workplace challenges. These guidelines help us maintain a community where
                everyone feels welcomed, heard, and respected.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By participating, you agree to uphold these standards and help create an environment where authentic
                conversations can happen without fear of judgment or retaliation.
              </p>
            </div>

            <div className="space-y-4">
              {guidelines.map((section) => {
                const Icon = section.icon;
                const isExpanded = expandedSection === section.id;

                return (
                  <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      className={`w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        isExpanded ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-${section.color}-100 rounded-xl flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 text-${section.color}-600`} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                      </div>
                      <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <AlertTriangle className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-6 bg-white border-t border-gray-200">
                        <div className="space-y-6">
                          {section.content.map((item, idx) => (
                            <div key={idx}>
                              <h4 className="font-semibold text-gray-900 mb-3">{item.subtitle}</h4>
                              <ul className="space-y-2">
                                {item.points.map((point, pointIdx) => (
                                  <li key={pointIdx} className="flex gap-3 text-gray-700">
                                    <span className={`text-${section.color}-500 font-bold mt-1`}>•</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-3">Questions or Concerns?</h3>
              <p className="text-blue-100 mb-4">
                If you have questions about these guidelines or need to report a violation, we're here to help.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/report-harassment')}
                  className="bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors"
                >
                  Report a Violation
                </button>
                <button
                  onClick={() => navigate('/crisis-resources')}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-400 transition-colors"
                >
                  Get Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
