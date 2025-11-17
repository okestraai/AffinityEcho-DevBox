import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Phone, MessageCircle, Users, Briefcase, Shield, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export function CrisisResourcesPage() {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const emergencyContacts = [
    {
      id: 'crisis-lifeline',
      name: '988 Suicide & Crisis Lifeline',
      phone: '988',
      description: '24/7 free and confidential support for people in distress',
      icon: Phone,
      color: 'red'
    },
    {
      id: 'domestic-violence',
      name: 'National Domestic Violence Hotline',
      phone: '1-800-799-7233',
      description: 'Support for domestic violence survivors',
      icon: Shield,
      color: 'purple'
    },
    {
      id: 'sexual-assault',
      name: 'RAINN Sexual Assault Hotline',
      phone: '1-800-656-4673',
      description: '24/7 support for survivors of sexual assault',
      icon: Heart,
      color: 'pink'
    },
    {
      id: 'crisis-text',
      name: 'Crisis Text Line',
      phone: 'Text HOME to 741741',
      description: 'Text-based crisis support available 24/7',
      icon: MessageCircle,
      color: 'blue'
    }
  ];

  const mentalHealthResources = [
    {
      title: 'NAMI (National Alliance on Mental Illness)',
      description: 'Support, education and advocacy for those affected by mental illness',
      phone: '1-800-950-6264',
      website: 'https://www.nami.org',
      hours: 'M-F 10am-10pm ET'
    },
    {
      title: 'SAMHSA National Helpline',
      description: 'Treatment referral and information service for mental health and substance abuse',
      phone: '1-800-662-4357',
      website: 'https://www.samhsa.gov',
      hours: '24/7/365'
    },
    {
      title: 'BetterHelp',
      description: 'Online therapy and counseling services',
      phone: 'Online only',
      website: 'https://www.betterhelp.com',
      hours: 'Varies by therapist'
    },
    {
      title: 'Talkspace',
      description: 'Virtual therapy platform with licensed therapists',
      phone: 'Online only',
      website: 'https://www.talkspace.com',
      hours: 'Message anytime'
    }
  ];

  const workplaceResources = [
    {
      title: 'EEOC (Equal Employment Opportunity Commission)',
      description: 'Federal agency that enforces workplace discrimination laws',
      phone: '1-800-669-4000',
      website: 'https://www.eeoc.gov',
      services: ['Discrimination complaints', 'Workplace harassment', 'Retaliation']
    },
    {
      title: 'Department of Labor',
      description: 'Federal agency protecting workers\' rights and safety',
      phone: '1-866-487-2365',
      website: 'https://www.dol.gov',
      services: ['Wage disputes', 'FMLA', 'Workplace safety']
    },
    {
      title: 'Legal Aid',
      description: 'Free legal assistance for employment issues',
      phone: 'Varies by location',
      website: 'https://www.lawhelp.org',
      services: ['Legal consultation', 'Representation', 'Resources']
    }
  ];

  const identitySpecificResources = [
    {
      category: 'Black Professionals',
      resources: [
        {
          name: 'Black Mental Health Alliance',
          description: 'Mental health resources for Black communities',
          contact: 'https://blackmentalhealth.com'
        },
        {
          name: 'The Boris Lawrence Henson Foundation',
          description: 'Mental health advocacy for African Americans',
          contact: 'https://borislhensonfoundation.org'
        }
      ]
    },
    {
      category: 'LGBTQ+ Community',
      resources: [
        {
          name: 'The Trevor Project',
          description: 'Crisis intervention for LGBTQ+ youth',
          contact: '1-866-488-7386'
        },
        {
          name: 'Trans Lifeline',
          description: 'Support hotline run by transgender people',
          contact: '1-877-565-8860'
        }
      ]
    },
    {
      category: 'Women',
      resources: [
        {
          name: 'National Women\'s Law Center',
          description: 'Legal resources for workplace discrimination',
          contact: 'https://nwlc.org'
        },
        {
          name: 'Lean In',
          description: 'Community and resources for women in the workplace',
          contact: 'https://leanin.org'
        }
      ]
    },
    {
      category: 'Asian American & Pacific Islander',
      resources: [
        {
          name: 'Asian Mental Health Collective',
          description: 'Mental health resources for AAPI communities',
          contact: 'https://asianmhc.org'
        },
        {
          name: 'Stop AAPI Hate',
          description: 'Report and get support for hate incidents',
          contact: 'https://stopaapihate.org'
        }
      ]
    },
    {
      category: 'Latino/Latinx',
      resources: [
        {
          name: 'National Latinx Psychological Association',
          description: 'Mental health resources in Spanish and English',
          contact: 'https://nlpa.ws'
        },
        {
          name: 'UnidosUS',
          description: 'Latino civil rights and advocacy',
          contact: 'https://unidosus.org'
        }
      ]
    }
  ];

  const selfCareStrategies = [
    {
      title: 'Document Everything',
      tips: [
        'Keep detailed records of incidents (date, time, witnesses)',
        'Save emails, messages, and any relevant communications',
        'Note how incidents made you feel and any physical symptoms',
        'Store documentation securely outside of work systems'
      ]
    },
    {
      title: 'Build Your Support Network',
      tips: [
        'Connect with trusted colleagues or friends',
        'Join employee resource groups or affinity networks',
        'Consider finding a mentor or career coach',
        'Don\'t isolate yourself - reach out for support'
      ]
    },
    {
      title: 'Set Boundaries',
      tips: [
        'Limit contact with toxic individuals when possible',
        'Take breaks and use your PTO',
        'Learn to say no to unreasonable requests',
        'Protect your personal time and mental health'
      ]
    },
    {
      title: 'Know Your Rights',
      tips: [
        'Review your company\'s harassment and discrimination policies',
        'Understand protected characteristics under federal law',
        'Know the reporting procedures and retaliation protections',
        'Consider consulting with an employment lawyer'
      ]
    }
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
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
              <Heart className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Crisis Resources & Support</h1>
            </div>
            <p className="text-blue-100">
              You're not alone. Help is available 24/7 for mental health, workplace, and personal crises.
            </p>
          </div>

          <div className="p-8">
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                <Phone className="w-6 h-6" />
                Emergency: Call 911
              </h2>
              <p className="text-red-700 mb-3">
                If you or someone else is in immediate danger or experiencing a life-threatening emergency, call 911 or go to the nearest emergency room.
              </p>
              <p className="text-red-700 font-medium">
                Suicide Prevention: Call or text <strong>988</strong> to reach the Suicide & Crisis Lifeline
              </p>
            </div>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">24/7 Crisis Hotlines</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {emergencyContacts.map((contact) => {
                  const Icon = contact.icon;
                  return (
                    <div
                      key={contact.id}
                      className={`bg-${contact.color}-50 border border-${contact.color}-200 rounded-xl p-6 hover:shadow-lg transition-shadow`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 bg-${contact.color}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 text-${contact.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{contact.name}</h3>
                          <p className={`text-2xl font-bold text-${contact.color}-600 mb-2`}>{contact.phone}</p>
                          <p className="text-sm text-gray-600">{contact.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Heart className="w-6 h-6 text-purple-600" />
                Mental Health Resources
              </h2>
              <div className="space-y-4">
                {mentalHealthResources.map((resource, index) => (
                  <div
                    key={index}
                    className="bg-purple-50 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{resource.title}</h3>
                      <span className="text-sm text-purple-600 font-medium">{resource.hours}</span>
                    </div>
                    <p className="text-gray-600 mb-3">{resource.description}</p>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-purple-700">
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">{resource.phone}</span>
                      </div>
                      <a
                        href={resource.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-purple-700 hover:text-purple-900"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Visit Website</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-600" />
                Workplace Rights & Legal Resources
              </h2>
              <div className="space-y-4">
                {workplaceResources.map((resource, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{resource.title}</h3>
                    <p className="text-gray-600 mb-3">{resource.description}</p>
                    <div className="flex flex-wrap gap-4 mb-3">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">{resource.phone}</span>
                      </div>
                      <a
                        href={resource.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-700 hover:text-blue-900"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Visit Website</span>
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resource.services.map((service, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-green-600" />
                Identity-Specific Resources
              </h2>
              <div className="space-y-4">
                {identitySpecificResources.map((category, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection(category.category)}
                      className="w-full bg-green-50 p-4 flex justify-between items-center hover:bg-green-100 transition-colors"
                    >
                      <h3 className="font-bold text-gray-900">{category.category}</h3>
                      {expandedSection === category.category ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                    {expandedSection === category.category && (
                      <div className="p-4 space-y-4 bg-white">
                        {category.resources.map((resource, idx) => (
                          <div key={idx} className="border-l-4 border-green-500 pl-4">
                            <h4 className="font-semibold text-gray-900">{resource.name}</h4>
                            <p className="text-sm text-gray-600 mb-1">{resource.description}</p>
                            <p className="text-sm text-green-700 font-medium">{resource.contact}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Self-Care & Coping Strategies</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {selfCareStrategies.map((strategy, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6"
                  >
                    <h3 className="font-bold text-gray-900 mb-4">{strategy.title}</h3>
                    <ul className="space-y-2">
                      {strategy.tips.map((tip, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-orange-500 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white text-center">
              <h3 className="text-xl font-bold mb-2">Remember: You Are Not Alone</h3>
              <p className="text-blue-100 mb-4">
                Seeking help is a sign of strength, not weakness. These resources are here for you.
              </p>
              <button
                onClick={() => navigate('/report-harassment')}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors"
              >
                Report Workplace Harassment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
